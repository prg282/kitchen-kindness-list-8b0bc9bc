import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Share2, Copy, Mail, MessageCircle, Check, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface InviteShareProps {
  householdId: string;
  householdName: string;
  userId: string;
}

const InviteShare = ({ householdId, householdName, userId }: InviteShareProps) => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [invitePin, setInvitePin] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  const generateInviteLink = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase
        .from('household_invitations')
        .insert({
          household_id: householdId,
          created_by: userId,
        })
        .select('invite_code, pin')
        .single();

      if (error) throw error;
      setInviteCode(data.invite_code);
      setInvitePin(data.pin);
      toast.success('Invite link generated!');
    } catch (err: any) {
      console.error('Error generating invite:', err);
      toast.error('Failed to generate invite link');
    } finally {
      setGenerating(false);
    }
  };

  const getInviteUrl = () => {
    return `${window.location.origin}/join/${inviteCode}`;
  };

  const getInviteMessage = () => {
    return `Join my household "${householdName}" on our Grocery List app!\n\nClick here to join: ${getInviteUrl()}\n\nPIN: ${invitePin}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl());
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const copyPinToClipboard = async () => {
    if (!invitePin) return;
    try {
      await navigator.clipboard.writeText(invitePin);
      setPinCopied(true);
      toast.success('PIN copied to clipboard!');
      setTimeout(() => setPinCopied(false), 2000);
    } catch {
      toast.error('Failed to copy PIN');
    }
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${householdName}`,
          text: getInviteMessage(),
          url: getInviteUrl(),
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(getInviteMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join my household "${householdName}"`);
    const body = encodeURIComponent(getInviteMessage());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Invite Members
        </CardTitle>
        <CardDescription>
          Share an invite link and PIN to let others join your household
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!inviteCode ? (
          <Button onClick={generateInviteLink} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Generate Invite Link
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted border border-border">
              <p className="text-xs text-muted-foreground mb-1">Invite Link</p>
              <p className="text-sm font-mono break-all text-foreground">
                {getInviteUrl()}
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <KeyRound className="w-3 h-3" />
                    PIN Code (share separately for security)
                  </p>
                  <p className="text-2xl font-mono font-bold tracking-widest text-primary">
                    {invitePin}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyPinToClipboard}
                  className="shrink-0"
                >
                  {pinCopied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex-1 min-w-[120px]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              
              {typeof navigator.share === 'function' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareViaWebShare}
                  className="flex-1 min-w-[120px]"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaWhatsApp}
                className="flex-1 min-w-[120px] text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaEmail}
                className="flex-1 min-w-[120px]"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              This invite link expires in 7 days. The invitee will need the PIN to join. Generate a new one if needed.
            </p>

            <Button
              variant="ghost"
              size="sm"
              onClick={generateInviteLink}
              disabled={generating}
            >
              Generate New Link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InviteShare;