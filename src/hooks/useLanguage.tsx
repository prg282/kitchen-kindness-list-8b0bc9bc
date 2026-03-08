import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { LanguageCode, translations, TranslationKey } from '@/lib/i18n/translations';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  isPremium: boolean;
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
  t: defaultT,
  isPremium: false,
};

const LanguageContext = createContext<LanguageContextType>(defaultValue);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (profile) {
      const lang = (profile as any).language as LanguageCode;
      const premium = (profile as any).is_premium as boolean;
      if (lang) setLanguageState(lang);
      if (premium !== undefined) setIsPremium(premium);
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

  const t = useCallback((key: TranslationKey, params?: Record<string, string>): string => {
    let text = translations[language]?.[key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isPremium }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
