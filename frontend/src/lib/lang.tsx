import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

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

function getLangFromURL(): Lang | null {
  try {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang === 'id' || urlLang === 'in') return 'id';
    if (urlLang === 'en') return 'en';
    return null;
  } catch {
    return null;
  }
}

function getStoredLang(): Lang {
  try {
    return (localStorage.getItem('site_lang') as Lang) || 'en';
  } catch {
    return 'en';
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [lang, setLangState] = useState<Lang>(() => getLangFromURL() || getStoredLang());
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const urlLang = getLangFromURL();
    if (urlLang && urlLang !== lang) {
      setLangState(urlLang);
    }
  }, [location.search]);

  const setLang = (l: Lang) => {
    try {
      localStorage.setItem('site_lang', l);
    } catch {
      /* private mode */
    }
    setLangState(l);
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
