import { useState } from 'react';
import { Settings, Globe, Crown, Lock, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/useLanguage';
import { languages, LanguageCode } from '@/lib/i18n/translations';
import { countries, CountryCode, getCountry } from '@/lib/countries';
import { cn } from '@/lib/utils';

export function SettingsDialog() {
  const { language, setLanguage, country, setCountry, t, isPremium, premiumPriceLabel } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleLanguageChange = async (code: LanguageCode) => {
    if (!isPremium) return;
    await setLanguage(code);
  };

  const handleCountryChange = async (code: CountryCode) => {
    if (!isPremium) return;
    await setCountry(code);
  };

  const selectedCountry = getCountry(country);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={t('settings.title')}
          className="text-muted-foreground hover:text-foreground h-8 w-8 md:h-10 md:w-10"
        >
          <Settings className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('settings.title')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-3">
          <div className="space-y-6 py-4">
            {/* Premium Upgrade Banner (shown once at top for free users) */}
            {!isPremium && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{t('settings.premiumUpgrade')}</p>
                    <Button size="sm" className="mt-3 bg-amber-500 hover:bg-amber-600 text-white">
                      Upgrade to Premium — {premiumPriceLabel}
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
