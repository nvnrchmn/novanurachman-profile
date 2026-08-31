import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react';

import { apiData } from '@/lib/api';
import type { Post } from '@/lib/types';
import { Reveal, Spinner, ErrorState } from '@/components/ui';
import { useLang } from '@/lib/lang';
import { formatDate, readingTime, renderMarkdown } from '@/lib/markdown';

export default function BlogDetailPage() {
  const { t, lang } = useLang();
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError('');
    apiData<Post>(`/posts/${slug}`)
      .then(setPost)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, lang]);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} — Nova Nurachman`;
    }
    return () => {
      document.title = 'Nova Nurachman — Developer';
    };
  }, [post]);

  if (loading) {
    return (
      <div className="container-content">
        <Spinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container-content py-16">
        <ErrorState message={error || t('Post not found.', 'Tulisan tidak ditemukan.')} />
        <Link
          to="/blog"
          className="mt-6 inline-flex items-center gap-2 font-mono text-sm text-mist-400 hover:text-accent"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {t('blog', 'blog')}
        </Link>
      </div>
    );
  }

  const tags = post.tags
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  return (
    <article className="container-content py-16">
      <Reveal>
        <Link
          to="/blog"
          className="mb-8 inline-flex items-center gap-2 font-mono text-xs text-mist-600 hover:text-accent"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          {t('blog', 'blog')}
        </Link>

        <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-mist-600">
          {post.published_at && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={12} aria-hidden="true" />
              {formatDate(post.published_at, lang)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} aria-hidden="true" />
            {readingTime(post.content)} min {t('read', 'baca')}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-mist-50 sm:text-3xl">
          {post.title}
        </h1>

        {tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            loading="lazy"
            className="mt-8 w-full rounded-lg border border-ink-700"
          />
        )}

        {post.content && (
          <div
            className="markdown-body mt-10"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />
        )}
      </Reveal>
    </article>
  );
}
