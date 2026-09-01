import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

import { useLang } from '@/lib/lang';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const KEY = 'pwa-install-dismissed';

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent);

export default function InstallPrompt() {
  const { t } = useLang();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone;
    if (inStandalone || localStorage.getItem(KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iOS Safari has no beforeinstallprompt — show hint after a delay.
    let id: ReturnType<typeof setTimeout> | undefined;
    if (isIOS()) {
      id = setTimeout(() => setVisible(true), 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      if (id) clearTimeout(id);
    };
  }, []);

  if (!visible) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
    }
    setVisible(false);
    localStorage.setItem(KEY, '1');
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(KEY, '1');
  };

  return (
    <div className="card fixed inset-x-4 bottom-4 z-50 p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Download size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-mist-50">
            {isIOS()
              ? t('Install this app', 'Pasang aplikasi ini')
              : t('Install Nova App', 'Pasang Aplikasi Nova')}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-mist-400">
            {isIOS()
              ? t('Tap Share, then "Add to Home Screen".', 'Ketuk Bagikan, lalu "Tambahkan ke Layar Utama".')
              : t('Offline-ready. Open without a browser tab.', 'Siap offline — buka tanpa tab browser.')}
          </p>
        </div>
        {!isIOS() && (
          <button
            onClick={install}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-accent/90"
          >
            {t('Install', 'Pasang')}
          </button>
        )}
        <button
          onClick={dismiss}
          className="shrink-0 rounded p-1 text-mist-500 transition-colors hover:text-mist-200"
          aria-label={t('Dismiss', 'Tutup')}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
