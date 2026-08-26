import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

import { apiData } from '@/lib/api';
import type { Experience } from '@/lib/types';
import { Reveal, SectionHeading, Spinner, EmptyState, ErrorState } from '@/components/ui';

export default function ExperiencePage() {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiData<Experience[]>('/experiences')
      .then((d) => setItems(d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <section className="container-content py-16">
      <Reveal>
        <SectionHeading
          label="experience"
          title="Pengalaman"
          description="Perjalanan kerja dan proyek profesional."
        />
      </Reveal>

      {loading && <Spinner />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState message="Belum ada data pengalaman." />}

      <div className="relative">
        {/* Timeline rail */}
        {items.length > 0 && (
          <span className="absolute left-[5px] top-2 bottom-2 w-px bg-ink-700" aria-hidden="true" />
        )}

        <div className="space-y-10">
          {items.map((x, i) => (
            <Reveal key={x.id} delay={i * 70}>
              <div className="relative pl-8">
                <span
                  className={`absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 ${
                    x.is_current ? 'border-accent bg-accent' : 'border-ink-600 bg-ink-950'
                  }`}
                  aria-hidden="true"
                />

                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h3 className="text-base font-medium text-mist-50">{x.role}</h3>
                  <span className="text-mist-600" aria-hidden="true">
                    ·
                  </span>
                  {x.company_url ? (
                    <a
                      href={x.company_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                    >
                      {x.company}
                      <ExternalLink size={11} aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="text-sm text-mist-200">{x.company}</span>
                  )}
                </div>

                <p className="mt-1.5 font-mono text-xs text-mist-600">
                  {x.start_date}
                  {' — '}
                  {x.is_current || !x.end_date ? 'sekarang' : x.end_date}
                  {x.employment && ` · ${x.employment}`}
                  {x.location && ` · ${x.location}`}
                </p>

                {x.description && (
                  <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-mist-400">
                    {x.description}
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
