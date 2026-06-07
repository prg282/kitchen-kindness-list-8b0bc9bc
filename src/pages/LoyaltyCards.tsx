import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, CreditCard, Plus, ScanLine, Camera, Trash2, Loader2, Image as ImageIcon, Search, Pencil, Maximize2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { BarcodeDisplay } from '@/components/BarcodeDisplay';
import { BrandPicker } from '@/components/BrandPicker';
import { FullscreenBarcode } from '@/components/FullscreenBarcode';
import { BrandLogo } from '@/components/BrandLogo';
import { PrintableCard } from '@/components/PrintableCard';
import { SA_LOYALTY_BRANDS, detectBrandFromBarcode, findBrandByName, type LoyaltyBrand } from '@/lib/loyaltyCards';

interface LoyaltyCard {
  id: string;
  household_id: string;
  name: string;
  card_number: string | null;
  barcode_value: string | null;
  barcode_format: string | null;
  photo_path: string | null;
  notes: string | null;
  brand_color: string | null;
  created_at: string;
}

const BUCKET = 'loyalty-card-photos';

function brandInitials(name: string) {
  return name.replace(/\(.*?\)/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

const LoyaltyCards = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [pickingBrand, setPickingBrand] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<LoyaltyCard | null>(null);
  const [fullscreenCard, setFullscreenCard] = useState<LoyaltyCard | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [printingCard, setPrintingCard] = useState<LoyaltyCard | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeFormat, setBarcodeFormat] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [brandColor, setBrandColor] = useState('#0ea5e9');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const applyBrand = (brand: LoyaltyBrand, opts?: { keepName?: boolean }) => {
    setBrandColor(brand.color);
    if (!opts?.keepName || !name.trim()) setName(brand.name);
  };

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (profile?.household_id) loadCards();
  }, [profile?.household_id]);

  const loadCards = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('loyalty_cards')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast.error('Failed to load cards');
    } else {
      setCards(data as LoyaltyCard[]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName('');
    setCardNumber('');
    setBarcodeValue('');
    setBarcodeFormat(null);
    setNotes('');
    setBrandColor('#0ea5e9');
    setPhotoFile(null);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (card: LoyaltyCard) => {
    setEditingId(card.id);
    setName(card.name);
    setCardNumber(card.card_number || '');
    setBarcodeValue(card.barcode_value || '');
    setBarcodeFormat(card.barcode_format);
    setNotes(card.notes || '');
    setBrandColor(card.brand_color || '#0ea5e9');
    setPhotoFile(null);
    setViewing(null);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!profile?.household_id) return;
    if (!name.trim()) {
      toast.error('Card name is required');
      return;
    }
    setSaving(true);
    try {
      let photoPath: string | null | undefined = undefined;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() || 'jpg';
        const path = `${profile.household_id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, photoFile, {
          cacheControl: '3600',
          upsert: false,
        });
        if (upErr) throw upErr;
        photoPath = path;
      }

      const payload: any = {
        name: name.trim().slice(0, 100),
        card_number: cardNumber.trim().slice(0, 100) || null,
        barcode_value: barcodeValue.trim().slice(0, 200) || null,
        barcode_format: barcodeFormat,
        notes: notes.trim().slice(0, 500) || null,
        brand_color: brandColor,
      };
      if (photoPath !== undefined) payload.photo_path = photoPath;

      if (editingId) {
        const { error } = await supabase.from('loyalty_cards').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Card updated');
      } else {
        const { error } = await supabase.from('loyalty_cards').insert({
          ...payload,
          household_id: profile.household_id,
          created_by: user!.id,
          photo_path: photoPath ?? null,
        });
        if (error) throw error;
        toast.success('Card added');
      }
      resetForm();
      setOpen(false);
      loadCards();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save card');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (card: LoyaltyCard) => {
    if (!confirm(`Delete "${card.name}"?`)) return;
    if (card.photo_path) {
      await supabase.storage.from(BUCKET).remove([card.photo_path]);
    }
    const { error } = await supabase.from('loyalty_cards').delete().eq('id', card.id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Card deleted');
      setViewing(null);
      loadCards();
    }
  };

  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!viewing?.photo_path) {
      setViewingPhotoUrl(null);
      return;
    }
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(viewing.photo_path, 300)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to sign photo URL:', error);
          setViewingPhotoUrl(null);
        } else {
          setViewingPhotoUrl(data?.signedUrl ?? null);
        }
      });
    return () => { cancelled = true; };
  }, [viewing?.photo_path]);

  // Categories present in saved cards (matched against brand list by name)
  const categories = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      const b = SA_LOYALTY_BRANDS.find((x) => x.name === c.name);
      if (b?.category) set.add(b.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [cards]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !(c.card_number || '').toLowerCase().includes(q)) return false;
      if (activeCategory !== 'All') {
        const b = SA_LOYALTY_BRANDS.find((x) => x.name === c.name);
        if (b?.category !== activeCategory) return false;
      }
      return true;
    });
  }, [cards, search, activeCategory]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container py-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-2.5 rounded-xl bg-primary/10">
            <CreditCard className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Rewards Cards</h1>
            <p className="text-sm text-muted-foreground">Loyalty cards shared with your household</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add Card
          </Button>
        </div>

        {cards.length > 0 && (
          <div className="container pb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your cards..."
                className="pl-9"
              />
            </div>
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={activeCategory === cat ? 'default' : 'secondary'}
                    className="cursor-pointer whitespace-nowrap"
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit rewards card' : 'Add a rewards card'}</DialogTitle>
            <DialogDescription>
              Pick a programme, scan the barcode, or enter details manually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Rewards programme</Label>
              <Button type="button" variant="outline" className="w-full justify-start h-auto py-2" onClick={() => setPickingBrand(true)}>
                <BrandLogo brand={findBrandByName(name)} name={name} color={brandColor} className="w-8 h-8 mr-2" />
                <span className="truncate">{name || 'Browse South African brands...'}</span>
              </Button>
            </div>
            <div className="space-y-1">
              <Label htmlFor="card-name">Card name *</Label>
              <Input id="card-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pick n Pay Smart Shopper" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="card-number">Card number</Label>
              <Input id="card-number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Printed card number" />
            </div>
            <div className="space-y-1">
              <Label>Barcode</Label>
              <div className="flex gap-2">
                <Input
                  value={barcodeValue}
                  onChange={(e) => { setBarcodeValue(e.target.value); setBarcodeFormat(null); }}
                  placeholder="Scan or type the barcode value"
                />
                <Button type="button" variant="outline" onClick={() => setScanning(true)}>
                  <ScanLine className="w-4 h-4 mr-1" /> Scan
                </Button>
              </div>
              {barcodeFormat && (
                <p className="text-xs text-muted-foreground">Detected: {barcodeFormat}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="card-photo">Card photo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="card-photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
                <Camera className="w-4 h-4 text-muted-foreground" />
              </div>
              {photoFile && <p className="text-xs text-muted-foreground">{photoFile.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="card-color">Brand colour</Label>
                <Input id="card-color" type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 p-1" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="card-notes">Notes</Label>
              <Textarea id="card-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingId ? 'Save changes' : 'Save card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="container py-6">
        {cards.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No rewards cards yet. Add your first one to get started.</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No cards match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => (
              <Card
                key={card.id}
                className="cursor-pointer overflow-hidden transition-transform hover:-translate-y-0.5"
                onClick={() => setViewing(card)}
              >
                <div
                  className="h-24 flex items-center justify-center p-3"
                  style={{ background: card.brand_color || 'hsl(var(--primary))' }}
                >
                  <BrandLogo
                    name={card.name}
                    color={card.brand_color}
                    className="w-20 h-16"
                    textClassName="text-2xl"
                    rounded="rounded-lg"
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="truncate">{card.name}</span>
                    {card.photo_path && <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {card.card_number ? <span className="font-mono">{card.card_number}</span> : <em>No card number</em>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Card detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.name}</DialogTitle>
                <DialogDescription>
                  Show this barcode at the till to scan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {viewing.barcode_value && (
                  <button
                    type="button"
                    onClick={() => setFullscreenCard(viewing)}
                    className="w-full rounded-lg bg-white p-4 hover:ring-2 hover:ring-primary transition relative group"
                  >
                    <BarcodeDisplay value={viewing.barcode_value} format={viewing.barcode_format} />
                    <p className="text-center text-xs font-mono text-black mt-2">{viewing.barcode_value}</p>
                    <span className="absolute top-2 right-2 bg-black/60 text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <Maximize2 className="w-3 h-3" /> Fullscreen
                    </span>
                  </button>
                )}
                {viewing.card_number && (
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Card number</p>
                    <p className="text-xl font-mono">{viewing.card_number}</p>
                  </div>
                )}
                {!viewing.barcode_value && !viewing.card_number && (
                  <p className="text-sm text-muted-foreground text-center">No barcode or number stored.</p>
                )}
                {viewing.photo_path && (
                  <img
                    src={photoUrl(viewing.photo_path)!}
                    alt={viewing.name}
                    className="w-full rounded-lg border border-border"
                  />
                )}
                {viewing.notes && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewing.notes}</p>
                )}
              </div>
              <DialogFooter className="flex-wrap gap-2">
                <Button variant="destructive" onClick={() => handleDelete(viewing)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
                <Button variant="outline" onClick={() => openEdit(viewing)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </Button>
                {(viewing.barcode_value || viewing.card_number) && (
                  <Button variant="outline" onClick={() => setPrintingCard(viewing)}>
                    <Printer className="w-4 h-4 mr-2" /> Print
                  </Button>
                )}
                {viewing.barcode_value && (
                  <Button onClick={() => setFullscreenCard(viewing)}>
                    <Maximize2 className="w-4 h-4 mr-2" /> Show at till
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BrandPicker
        open={pickingBrand}
        onClose={() => setPickingBrand(false)}
        onPick={(b) => applyBrand(b)}
      />

      <BarcodeScanner
        open={scanning}
        onClose={() => setScanning(false)}
        onDetected={(value, format) => {
          setBarcodeValue(value);
          setBarcodeFormat(format);
          setScanning(false);
          if (!cardNumber.trim()) setCardNumber(value);
          const detected = detectBrandFromBarcode(value);
          if (detected) {
            applyBrand(detected, { keepName: true });
            toast.success(`Detected ${detected.name}`);
          } else {
            toast.success(`Scanned (${format})`);
          }
        }}
      />

      {fullscreenCard && fullscreenCard.barcode_value && (
        <FullscreenBarcode
          open={!!fullscreenCard}
          onClose={() => setFullscreenCard(null)}
          title={fullscreenCard.name}
          value={fullscreenCard.barcode_value}
          format={fullscreenCard.barcode_format}
          cardNumber={fullscreenCard.card_number}
          brandColor={fullscreenCard.brand_color}
        />
      )}

      {printingCard && (
        <PrintableCard
          name={printingCard.name}
          cardNumber={printingCard.card_number}
          barcodeValue={printingCard.barcode_value}
          barcodeFormat={printingCard.barcode_format}
          onDone={() => setPrintingCard(null)}
        />
      )}
    </div>
  );
};

export default LoyaltyCards;
