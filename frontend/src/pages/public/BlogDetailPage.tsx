import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, Share2, Copy, Tag as TagIcon } from 'lucide-react';

import { apiData } from '@/lib/api';
import type { Post, Tag } from '@/lib/types';
import { Reveal, Spinner, ErrorState } from '@/components/ui';
import { useLang } from '@/lib/lang';
import { formatDate, readingTime, renderMarkdown } from '@/lib/markdown';

export default function BlogDetailPage() {
  const { t, lang } = useLang();
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError('');
    Promise.all([
      apiData<Post>(`/posts/${slug}`),
      apiData<Post[]>(`/posts/${slug}/related`),
    ])
      .then(([p, r]) => {
        setPost(p);
        setRelatedPosts(r || []);
      })
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

  const handleShare = async () => {
    if (!post) return;
    const url = window.location.href;
    const title = post.title;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      // show toast or alert
      alert(t('Link copied!', 'Tautan disalin!'));
    }
  };

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

  const tags = post.tags_list?.length
    ? post.tags_list
    : post.tags
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
          {post.category && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 text-accent rounded">
              <TagIcon size={10} aria-hidden="true" />
              {post.category.name}
            </span>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-mist-50 sm:text-3xl">
          {post.title}
        </h1>

        {tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => {
              const isTag = typeof tag === 'object' && tag !== null && 'name' in tag;
              const name = isTag ? (tag as Tag).name : (tag as string);
              const color = isTag ? (tag as Tag).color : undefined;
              return (
                <span
                  key={`${idx}-${name}`}
                  className="tag"
                  style={
                    color
                      ? { backgroundColor: `${color}15`, color }
                      : undefined
                  }
                >
                  {name}
                </span>
              );
            })}
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

        {/* Social Share */}
        <div className="mt-12 pt-8 border-t border-ink-700 flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-mist-500 mr-2">
            {t('Share:', 'Bagikan:')}
          </span>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label={t('Share', 'Bagikan')}
          >
            <Share2 size={14} aria-hidden="true" />
            {t('Share', 'Bagikan')}
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert(t('Link copied!', 'Tautan disalin!')))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label={t('Copy link', 'Salin tautan')}
          >
            <Copy size={14} aria-hidden="true" />
            {t('Copy', 'Salin')}
          </button>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-lg font-semibold text-mist-50 mb-6">
              {t('Related Posts', 'Tulisan Terkait')}
            </h2>
            <div className="space-y-4">
              {relatedPosts.map((rp, i) => (
                <Reveal key={rp.id} delay={i * 60}>
                  <article className="card card-hover overflow-hidden p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {rp.published_at && (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-mist-600">
                          <CalendarDays size={12} aria-hidden="true" />
                          {formatDate(rp.published_at, lang)}
                        </span>
                      )}
                      {rp.category && (
                        <span className="px-2 py-0.5 text-xs font-mono bg-accent/10 text-accent rounded">
                          {rp.category.name}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-base font-medium text-mist-50">
                      <Link to={`/blog/${rp.slug}`} className="hover:text-accent">
                        {rp.title}
                      </Link>
                    </h3>
                    {rp.excerpt && (
                      <p className="mt-1 text-sm leading-relaxed text-mist-400 line-clamp-2">
                        {rp.excerpt}
                      </p>
                    )}
                    <Link
                      to={`/blog/${rp.slug}`}
                      className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-accent"
                    >
                      {t('read more', 'baca selengkapnya')}
                      <ArrowLeft size={12} aria-hidden="true" />
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </Reveal>
    </article>
  );
}
