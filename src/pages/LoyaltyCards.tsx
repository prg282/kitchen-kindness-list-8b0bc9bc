import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, CreditCard, Plus, ScanLine, Camera, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { BarcodeDisplay } from '@/components/BarcodeDisplay';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SA_LOYALTY_BRANDS, detectBrandFromBarcode, type LoyaltyBrand } from '@/lib/loyaltyCards';

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

const LoyaltyCards = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<LoyaltyCard | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeFormat, setBarcodeFormat] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [brandColor, setBrandColor] = useState('#0ea5e9');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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
  };

  const handleSave = async () => {
    if (!profile?.household_id) return;
    if (!name.trim()) {
      toast.error('Card name is required');
      return;
    }
    setSaving(true);
    try {
      let photoPath: string | null = null;
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

      const { error } = await supabase.from('loyalty_cards').insert({
        household_id: profile.household_id,
        created_by: user!.id,
        name: name.trim().slice(0, 100),
        card_number: cardNumber.trim().slice(0, 100) || null,
        barcode_value: barcodeValue.trim().slice(0, 200) || null,
        barcode_format: barcodeFormat,
        notes: notes.trim().slice(0, 500) || null,
        brand_color: brandColor,
        photo_path: photoPath,
      });
      if (error) throw error;
      toast.success('Card added');
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

  const photoUrl = (path: string | null) => {
    if (!path) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

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
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Add Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add a rewards card</DialogTitle>
                <DialogDescription>
                  Capture the barcode with your camera or enter details manually.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
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
                  Save card
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-6">
        {cards.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No rewards cards yet. Add your first one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <Card
                key={card.id}
                className="cursor-pointer overflow-hidden transition-transform hover:-translate-y-0.5"
                onClick={() => setViewing(card)}
              >
                <div className="h-20" style={{ background: card.brand_color || 'hsl(var(--primary))' }} />
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
                {viewing.barcode_value ? (
                  <div className="rounded-lg bg-white p-4">
                    <BarcodeDisplay value={viewing.barcode_value} format={viewing.barcode_format} />
                    <p className="text-center text-xs font-mono text-black mt-2">{viewing.barcode_value}</p>
                  </div>
                ) : viewing.card_number ? (
                  <p className="text-2xl text-center font-mono">{viewing.card_number}</p>
                ) : (
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
              <DialogFooter>
                <Button variant="destructive" onClick={() => handleDelete(viewing)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
                <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        open={scanning}
        onClose={() => setScanning(false)}
        onDetected={(value, format) => {
          setBarcodeValue(value);
          setBarcodeFormat(format);
          setScanning(false);
          toast.success(`Scanned (${format})`);
        }}
      />
    </div>
  );
};

export default LoyaltyCards;
