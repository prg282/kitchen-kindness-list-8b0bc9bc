import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Share2,
  Copy,
  Mail,
  MessageCircle,
  Check,
  KeyRound,
  QrCode,
  Download,
  Link as LinkIcon,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface InviteShareProps {
  householdId: string;
  householdName: string;
  userId: string;
}

type InviteMethod = 'link' | 'qr' | 'whatsapp' | 'email' | 'share';

interface MethodDef {
  id: InviteMethod;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  guard?: () => boolean;
}

const METHODS: MethodDef[] = [
  { id: 'link', label: 'Copy Link', description: 'Copy an invite link to share anywhere', icon: LinkIcon },
  { id: 'qr', label: 'QR Code', description: 'Show a QR code to scan in person', icon: QrCode },
  { id: 'whatsapp', label: 'WhatsApp', description: 'Send the invite via WhatsApp', icon: MessageCircle },
  { id: 'email', label: 'Email', description: 'Send the invite by email', icon: Mail },
  {
    id: 'share',
    label: 'Device Share',
    description: 'Use your phone’s share menu',
    icon: Share2,
    guard: () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
  },
];

const InviteShare = ({ householdId, householdName, userId }: InviteShareProps) => {
  const [method, setMethod] = useState<InviteMethod | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [invitePin, setInvitePin] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const inviteUrl = inviteCode ? `${window.location.origin}/join/${inviteCode}` : '';

  const ensureInvite = async () => {
    if (inviteCode) return { code: inviteCode, pin: invitePin! };
    setGenerating(true);
    try {
      const { data, error } = await supabase
        .from('household_invitations')
        .insert({ household_id: householdId, created_by: userId })
        .select('invite_code, pin')
        .single();
      if (error) throw error;
      setInviteCode(data.invite_code);
      setInvitePin(data.pin);
      return { code: data.invite_code as string, pin: data.pin as string };
    } catch (err: any) {
      console.error('Error generating invite:', err);
      toast.error('Failed to generate invite');
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (method && !inviteCode && !generating) {
      ensureInvite().catch(() => setMethod(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  useEffect(() => {
    if (method !== 'qr' || !inviteCode) {
      setQrDataUrl(null);
      return;
    }
    const url = `${window.location.origin}/join/${inviteCode}`;
    QRCode.toDataURL(url, { width: 320, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQrDataUrl)
      .catch((err) => console.warn('QR generation failed:', err));
  }, [method, inviteCode]);

  const inviteMessage = () =>
    `Join my household "${householdName}" on our Grocery List app!\n\nClick here to join: ${inviteUrl}\n\nPIN: ${invitePin}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const copyPin = async () => {
    if (!invitePin) return;
    try {
      await navigator.clipboard.writeText(invitePin);
      setPinCopied(true);
      toast.success('PIN copied');
      setTimeout(() => setPinCopied(false), 2000);
    } catch {
      toast.error('Failed to copy PIN');
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `household-invite-${inviteCode}.png`;
    a.click();
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage())}`, '_blank');
  };

  const openEmail = () => {
    const subject = encodeURIComponent(`Join my household "${householdName}"`);
    const body = encodeURIComponent(inviteMessage());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const openDeviceShare = async () => {
    const shareData = {
      title: `Join ${householdName}`,
      text: inviteMessage(),
      url: inviteUrl,
    };
    if (typeof navigator.share === 'function') {
      try {
        // @ts-ignore - canShare not in all TS libs
        if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
          throw new Error('not-shareable');
        }
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        // Fall through to clipboard fallback
      }
    }
    try {
      await navigator.clipboard.writeText(inviteMessage());
      toast.success('Sharing unavailable here — invite copied to clipboard');
    } catch {
      toast.error('Sharing unavailable. Use Copy Link instead.');
    }
  };

  const reset = () => {
    setMethod(null);
  };

  const availableMethods = METHODS.filter((m) => !m.guard || m.guard());

  const PinCard = () =>
    invitePin ? (
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <KeyRound className="w-3 h-3 shrink-0" />
              <span>PIN Code (required to join)</span>
            </p>
            <p className="text-2xl font-mono font-bold tracking-widest text-primary">{invitePin}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={copyPin} className="shrink-0">
            {pinCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Invite Members
        </CardTitle>
        <CardDescription>
          {method
            ? 'Send this invite. It expires in 7 days.'
            : 'Choose how you’d like to invite someone to join your household.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!method && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableMethods.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/40 transition-colors text-left"
                >
                  <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {method && (
          <>
            <Button variant="ghost" size="sm" onClick={reset} className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Choose another method
            </Button>

            {generating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating invite…
              </div>
            )}

            {!generating && inviteCode && (
              <div className="space-y-4">
                {method === 'link' && (
                  <>
                    <div className="p-3 rounded-lg bg-muted border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Invite Link</p>
                      <p className="text-sm font-mono break-all text-foreground">{inviteUrl}</p>
                    </div>
                    <Button onClick={copyLink} className="w-full">
                      {copied ? (
                        <><Check className="w-4 h-4 mr-2" /> Copied</>
                      ) : (
                        <><Copy className="w-4 h-4 mr-2" /> Copy Link</>
                      )}
                    </Button>
                    <PinCard />
                  </>
                )}

                {method === 'qr' && (
                  <>
                    <div className="p-4 rounded-lg bg-card border border-border flex flex-col items-center gap-3">
                      {qrDataUrl ? (
                        <>
                          <img
                            src={qrDataUrl}
                            alt={`QR code to join ${householdName}`}
                            className="w-56 h-56 rounded bg-white p-2"
                          />
                          <Button variant="outline" size="sm" onClick={downloadQr}>
                            <Download className="w-4 h-4 mr-2" /> Download QR
                          </Button>
                        </>
                      ) : (
                        <div className="w-56 h-56 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground text-center">
                        Recipient scans, then enters the PIN below.
                      </p>
                    </div>
                    <PinCard />
                  </>
                )}

                {method === 'whatsapp' && (
                  <>
                    <Button onClick={openWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <MessageCircle className="w-4 h-4 mr-2" /> Open WhatsApp
                    </Button>
                    <PinCard />
                  </>
                )}

                {method === 'email' && (
                  <>
                    <Button onClick={openEmail} className="w-full">
                      <Mail className="w-4 h-4 mr-2" /> Open Email
                    </Button>
                    <PinCard />
                  </>
                )}

                {method === 'share' && (
                  <>
                    <Button onClick={openDeviceShare} className="w-full">
                      <Share2 className="w-4 h-4 mr-2" /> Share via Device
                    </Button>
                    <PinCard />
                  </>
                )}

                <p className="text-xs text-muted-foreground">Link expires in 7 days.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InviteShare;
