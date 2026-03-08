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

            {/* Country Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Country</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Select your country for local stores and pricing</p>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleCountryChange(c.code)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all duration-200 text-sm",
                      country === c.code
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <div className="min-w-0">
                      <div className="font-medium truncate text-xs">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.currencySymbol} {c.currency}</div>
                    </div>
                  </button>
                ))}
              </div>

            </div>

            {/* Language Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">{t('settings.language')}</h3>
                </div>
                {!isPremium && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full">
                    <Crown className="w-3 h-3" />
                    {t('settings.premiumRequired')}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{t('settings.languageDescription')}</p>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    disabled={!isPremium}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all duration-200 text-sm",
                      language === lang.code
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : isPremium
                          ? "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                          : "border-border/50 text-muted-foreground opacity-60 cursor-not-allowed"
                    )}
                  >
                    {!isPremium && language !== lang.code && (
                      <Lock className="w-3 h-3 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{lang.nativeName}</div>
                      <div className="text-xs text-muted-foreground truncate">{lang.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
