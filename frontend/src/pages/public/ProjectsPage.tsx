import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Github } from 'lucide-react';

import { apiData } from '@/lib/api';
import type { Project } from '@/lib/types';
import { Reveal, SectionHeading, Spinner, EmptyState, ErrorState } from '@/components/ui';
import { useLang } from '@/lib/lang';

export default function ProjectsPage() {
  const { lang } = useLang();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiData<Project[]>('/projects')
      .then((d) => setProjects(d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [lang]);

  return (
    <section className="container-content py-16">
      <Reveal>
        <SectionHeading
          label="projects"
          title="Proyek"
          description="Produk dan aplikasi yang saya bangun, dari backend sampai deployment."
        />
      </Reveal>

      {loading && <Spinner />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && projects.length === 0 && <EmptyState message="Belum ada proyek." />}

      <div className="space-y-4">
        {projects.map((p, i) => (
          <Reveal key={p.id} delay={i * 60}>
            <article className="card card-hover p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg font-medium text-mist-50">
                  <Link to={`/projects/${p.slug}`} className="hover:text-accent">
                    {p.title}
                  </Link>
                </h3>
                <div className="flex items-center gap-3">
                  {p.featured && <span className="mono-label">featured</span>}
                  {p.year && <span className="font-mono text-xs text-mist-600">{p.year}</span>}
                </div>
              </div>

              {p.summary && <p className="mt-3 text-sm leading-relaxed text-mist-400">{p.summary}</p>}

              {p.tech_stack && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.tech_stack
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                </div>
              )}

              <div className="mt-5 flex items-center gap-4">
                <Link
                  to={`/projects/${p.slug}`}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-accent"
                >
                  detail
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
                {p.live_url && (
                  <a
                    href={p.live_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-mist-600 hover:text-mist-200"
                  >
                    live
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                )}
                {p.repo_url && (
                  <a
                    href={p.repo_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-mist-600 hover:text-mist-200"
                  >
                    <Github size={12} aria-hidden="true" />
                    repo
                  </a>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
