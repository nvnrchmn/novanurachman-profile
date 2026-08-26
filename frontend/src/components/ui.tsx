import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Fades content up when it scrolls into view.
 * Falls back to visible immediately if IntersectionObserver is unavailable,
 * so content is never permanently hidden.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 520ms ease-out ${delay}ms, transform 520ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10">
      <p className="mono-label mb-3">{label}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-mist-50 sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist-400">{description}</p>}
    </div>
  );
}

export function Spinner({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-16 text-sm text-mist-600" role="status">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-ink-600 border-t-accent"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-mono text-sm text-mist-600">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card border-red-500/30 px-6 py-10 text-center">
      <p className="mb-4 text-sm text-red-300">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline">
          Coba lagi
        </button>
      )}
    </div>
  );
}
