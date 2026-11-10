import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations, type Lang } from './translations';
import { uiTextAm } from './uiText';

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  tText: (text: string) => string;
}

const STORAGE_KEY = 'cbs-lang';

const I18nContext = createContext<I18nState>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => translations.en[key] ?? key,
  tText: (text: string) => text,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'am' ? 'am' : 'en';
  });

  const setLang = (next: Lang) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  };

  const t = (key: string): string =>
    translations[lang][key] ?? translations.en[key] ?? key;

  const tText = (text: string): string =>
    lang === 'am' ? uiTextAm[text] ?? text : text;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, tText }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
