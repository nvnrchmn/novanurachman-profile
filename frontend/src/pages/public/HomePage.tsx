import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, ExternalLink, Github } from 'lucide-react';

import { apiData } from '@/lib/api';
import type { Profile, Project } from '@/lib/types';
import { Reveal, SectionHeading, Spinner } from '@/components/ui';
import { useLang } from '@/lib/lang';

export default function HomePage() {
  const { t, lang } = useLang();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiData<Profile | null>('/profile').catch(() => null),
      apiData<Project[]>('/projects').catch(() => []),
    ])
      .then(([p, pr]) => {
        setProfile(p);
        setProjects((pr || []).filter((x) => x.featured).slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, [lang]);

  if (loading) {
    return (
      <div className="container-content">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="container-content pb-16 pt-16 sm:pt-24">
        <Reveal>
          <p className="mono-label mb-5">
            {profile?.available
              ? t('● available for projects', '● tersedia untuk proyek')
              : t('○ not available', '○ sedang tidak tersedia')}
          </p>

          <h1 className="text-3xl font-semibold leading-[1.15] tracking-tight text-mist-50 sm:text-5xl">
            {profile?.name || 'Nova Nurachman'}
          </h1>

          {profile?.headline && (
            <p className="mt-3 font-mono text-base text-accent sm:text-lg">{profile.headline}</p>
          )}

          {profile?.tagline && (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-mist-400">{profile.tagline}</p>
          )}

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/projects" className="btn-primary">
              {t('View Projects', 'Lihat Proyek')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/contact" className="btn-outline">
              {t('Contact Me', 'Hubungi Saya')}
            </Link>
          </div>

          {profile?.location && (
            <p className="mt-8 flex items-center gap-2 font-mono text-xs text-mist-600">
              <MapPin size={13} aria-hidden="true" />
              {profile.location}
            </p>
          )}
        </Reveal>
      </section>

      {/* About */}
      {profile?.bio && (
        <section className="container-content py-14">
          <Reveal>
            <SectionHeading label={t('about', 'tentang')} title={t('About', 'Tentang')} />
            <p className="max-w-[38rem] whitespace-pre-line text-[15px] leading-[1.75] text-mist-200">
              {profile.bio}
            </p>
          </Reveal>
        </section>
      )}

      {/* Featured projects */}
      {projects.length > 0 && (
        <section className="container-content py-14">
          <Reveal>
            <SectionHeading label={t('selected work', 'proyek pilihan')} title={t('Selected Work', 'Proyek Pilihan')} />
          </Reveal>

          <div className="space-y-4">
            {projects.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <article className="card card-hover group p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="text-lg font-medium text-mist-50">
                      <Link to={`/projects/${p.slug}`} className="hover:text-accent">
                        {p.title}
                      </Link>
                    </h3>
                    {p.year && <span className="font-mono text-xs text-mist-600">{p.year}</span>}
                  </div>

                  {p.summary && (
                    <p className="mt-3 text-sm leading-relaxed text-mist-400">{p.summary}</p>
                  )}

                  {p.tech_stack && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.tech_stack
                        .split(',')
                        .map((tr) => tr.trim())
                        .filter(Boolean)
                        .map((tech) => (
                          <span key={tech} className="tag">
                            {tech}
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-4">
                    <Link
                      to={`/projects/${p.slug}`}
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-accent"
                    >
                      {t('detail', 'detail')}
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

          <Reveal delay={120}>
            <Link
              to="/projects"
              className="mt-8 inline-flex items-center gap-2 font-mono text-sm text-mist-400 hover:text-accent"
            >
              {t('all projects', 'semua proyek')}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </Reveal>
        </section>
      )}
    </>
  );
}
