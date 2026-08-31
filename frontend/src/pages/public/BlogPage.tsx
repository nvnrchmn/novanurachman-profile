import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Rss } from 'lucide-react';

import { apiData } from '@/lib/api';
import type { Post } from '@/lib/types';
import { Reveal, SectionHeading, Spinner, EmptyState, ErrorState } from '@/components/ui';
import { useLang } from '@/lib/lang';
import { formatDate } from '@/lib/markdown';

export default function BlogPage() {
  const { t, lang } = useLang();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiData<Post[]>('/posts')
      .then((d) => setPosts(d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [lang]);

  const tagsOf = (p: Post) =>
    p.tags
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

  return (
    <section className="container-content py-16">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            label={t('blog', 'blog')}
            title={t('Blog', 'Blog')}
            description={t(
              'Notes on web development, infrastructure, and the things I build.',
              'Catatan tentang pengembangan web, infrastruktur, dan hal-hal yang saya bangun.'
            )}
          />
          <a
            href="/feed.xml"
            target="_blank"
            rel="noreferrer noopener"
            className="mb-10 inline-flex items-center gap-1.5 font-mono text-xs text-mist-600 hover:text-accent"
          >
            <Rss size={13} aria-hidden="true" />
            RSS
          </a>
        </div>
      </Reveal>

      {loading && <Spinner />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && posts.length === 0 && (
        <EmptyState message={t('No posts yet.', 'Belum ada tulisan.')} />
      )}

      <div className="space-y-4">
        {posts.map((p, i) => (
          <Reveal key={p.id} delay={i * 60}>
            <article className="card card-hover overflow-hidden">
              {p.cover_image && (
                <Link to={`/blog/${p.slug}`} tabIndex={-1} aria-hidden="true">
                  <img
                    src={p.cover_image}
                    alt=""
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                </Link>
              )}
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3">
                  {p.published_at && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-mist-600">
                      <CalendarDays size={12} aria-hidden="true" />
                      {formatDate(p.published_at, lang)}
                    </span>
                  )}
                  {tagsOf(p).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <h3 className="mt-3 text-lg font-medium text-mist-50">
                  <Link to={`/blog/${p.slug}`} className="hover:text-accent">
                    {p.title}
                  </Link>
                </h3>

                {p.excerpt && (
                  <p className="mt-2 text-sm leading-relaxed text-mist-400">{p.excerpt}</p>
                )}

                <Link
                  to={`/blog/${p.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-accent"
                >
                  {t('read more', 'baca selengkapnya')}
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
