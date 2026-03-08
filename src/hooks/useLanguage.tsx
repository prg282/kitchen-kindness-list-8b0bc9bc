import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { LanguageCode, translations, TranslationKey } from '@/lib/i18n/translations';
import { CountryCode, getCountry, premiumPrices, formatPrice } from '@/lib/countries';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  country: CountryCode;
  setCountry: (country: CountryCode) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  isPremium: boolean;
  premiumPriceLabel: string;
}

const defaultT = (key: TranslationKey, params?: Record<string, string>): string => {
  let text = translations.en[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
};

const defaultValue: LanguageContextType = {
  language: 'en',
  setLanguage: async () => {},
  country: 'ZA',
  setCountry: async () => {},
  t: defaultT,
  isPremium: false,
  premiumPriceLabel: 'R49.99/mo',
};

const LanguageContext = createContext<LanguageContextType>(defaultValue);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [country, setCountryState] = useState<CountryCode>('ZA');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (profile) {
      const lang = (profile as any).language as LanguageCode;
      const premium = (profile as any).is_premium as boolean;
      const ctry = (profile as any).country as CountryCode;
      if (lang) setLanguageState(lang);
      if (premium !== undefined) setIsPremium(premium);
      if (ctry) setCountryState(ctry);
    }
  }, [profile]);

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    setLanguageState(lang);
    if (user) {
      await supabase
        .from('profiles')
        .update({ language: lang } as any)
        .eq('id', user.id);
    }
  }, [user]);

  const setCountry = useCallback(async (ctry: CountryCode) => {
    setCountryState(ctry);
    if (user) {
      await supabase
        .from('profiles')
        .update({ country: ctry } as any)
        .eq('id', user.id);
    }
  }, [user]);

  const t = useCallback((key: TranslationKey, params?: Record<string, string>): string => {
    let text = translations[language]?.[key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [language]);

  const premiumPriceLabel = `${formatPrice(premiumPrices[country], country)}/mo`;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, country, setCountry, t, isPremium, premiumPriceLabel }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
