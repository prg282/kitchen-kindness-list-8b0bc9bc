import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserRound, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Please enter your name')
  .max(50, 'Name must be less than 50 characters');

export function ProfileNameCard() {
  const { user, profile, refreshProfile } = useAuth();
  const [value, setValue] = useState(profile?.display_name || '');
  const [saving, setSaving] = useState(false);

  const current = profile?.display_name || '';
  const dirty = value.trim() !== current.trim();

  const handleSave = async () => {
    const parsed = nameSchema.safeParse(value);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: parsed.data })
      .eq('id', user.id);
    setSaving(false);

    if (error) {
      console.error('Error updating display name:', error);
      toast.error('Could not update your name');
      return;
    }
    await refreshProfile();
    toast.success('Your name has been updated');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="w-5 h-5" />
          Your name
        </CardTitle>
        <CardDescription>
          This is how you appear to everyone else in the household
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <div className="flex items-center gap-2">
            <Input
              id="displayName"
              value={value}
              maxLength={50}
              placeholder="e.g. Nomsa"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && dirty) handleSave();
              }}
            />
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span className="ml-2 hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileNameCard;
