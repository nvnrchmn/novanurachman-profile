import { useEffect, useMemo, useState } from 'react';

import { apiData } from '@/lib/api';
import type { Skill } from '@/lib/types';
import { Reveal, SectionHeading, Spinner, EmptyState, ErrorState } from '@/components/ui';
import { useLang } from '@/lib/lang';

export default function SkillsPage() {
  const { lang } = useLang();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiData<Skill[]>('/skills')
      .then((d) => setSkills(d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [lang]);

  const grouped = useMemo(() => {
    const map = new Map<string, Skill[]>();
    for (const s of skills) {
      const key = s.category || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [skills]);

  return (
    <section className="container-content py-16">
      <Reveal>
        <SectionHeading
          label="skills"
          title="Keahlian"
          description="Teknologi dan tools yang saya pakai sehari-hari."
        />
      </Reveal>

      {loading && <Spinner />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && skills.length === 0 && <EmptyState message="Belum ada data keahlian." />}

      <div className="space-y-8">
        {grouped.map(([category, list], i) => (
          <Reveal key={category} delay={i * 60}>
            <div className="card p-6">
              <h3 className="mono-label mb-4">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {list.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-2 rounded-md border border-ink-700
                               bg-ink-900 px-3 py-2 text-sm text-mist-200"
                  >
                    {s.name}
                    {s.level && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-mist-600">
                        {s.level}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
