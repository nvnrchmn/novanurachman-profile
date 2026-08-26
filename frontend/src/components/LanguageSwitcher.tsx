import { useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '@/lib/lang';

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const switchTo = (target: 'en' | 'id') => {
    setLang(target);
    // Update the URL so the API client reads the right language
    const params = new URLSearchParams(location.search);
    params.set('lang', target);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  return (
    <div className="flex overflow-hidden rounded-md border border-ink-700">
      <button
        onClick={() => switchTo('en')}
        className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
          lang === 'en'
            ? 'bg-accent text-ink-950'
            : 'bg-transparent text-mist-400 hover:text-mist-200'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => switchTo('id')}
        className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
          lang === 'id'
            ? 'bg-accent text-ink-950'
            : 'bg-transparent text-mist-400 hover:text-mist-200'
        }`}
        aria-label="Beralih ke Bahasa Indonesia"
      >
        ID
      </button>
    </div>
  );
}
