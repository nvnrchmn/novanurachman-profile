import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Lang = 'en' | 'id';

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, id: string) => string;
}

const LangContext = createContext<LangValue>({
  lang: 'en',
  setLang: () => {},
  t: (en) => en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      // URL parameter takes precedence
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang === 'id' || urlLang === 'in') return 'id';
      return (localStorage.getItem('site_lang') as Lang) || 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('site_lang', l);
    } catch {
      /* private mode */
    }
  };

  const t = (en: string, id: string) => (lang === 'id' ? id : en);

  useEffect(() => {
    document.documentElement.lang = lang === 'id' ? 'id' : 'en';
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
