import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Rss, Filter, X } from 'lucide-react';

import { apiData } from '@/lib/api';
import type { Post, Category, Tag } from '@/lib/types';
import { Reveal, SectionHeading, Spinner, EmptyState, ErrorState } from '@/components/ui';
import { useLang } from '@/lib/lang';
import { formatDate } from '@/lib/markdown';

export default function BlogPage() {
  const { t, lang } = useLang();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCategories = async () => {
    try {
      const data = await apiData<Category[]>('/categories');
      if (data) setCategories(data);
    } catch (e) {
      // ignore
    }
  };

  const load = () => {
    setLoading(true);
    setError('');
    const url = selectedCategory ? `/posts?category=${selectedCategory}` : '/posts';
    apiData<Post[]>(url)
      .then((d) => setPosts(d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, [lang]);

  useEffect(() => {
    load();
  }, [lang, selectedCategory]);

  const tagsOf = (p: Post): (string | Tag)[] => {
    if (p.tags_list && p.tags_list.length) {
      return p.tags_list;
    }
    return p.tags
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  };

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

      {/* Category Filter */}
      {(categories.length > 0 || selectedCategory) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Filter className="text-mist-500" size={16} aria-hidden="true" />
          <span className="text-sm font-medium text-mist-400">
            {t('Category:', 'Kategori:')}
          </span>
          <button
            className={`px-3 py-1.5 rounded-full text-sm font-mono transition-colors ${
              !selectedCategory
                ? 'bg-accent/15 text-accent'
                : 'bg-slate-800 text-mist-400 hover:bg-slate-700'
            }`}
            onClick={() => setSelectedCategory('')}
          >
            {t('All', 'Semua')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`px-3 py-1.5 rounded-full text-sm font-mono transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-accent/15 text-accent'
                  : 'bg-slate-800 text-mist-400 hover:bg-slate-700'
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
          {selectedCategory && (
            <button
              className="p-1.5 rounded-full hover:bg-slate-700 text-mist-500"
              onClick={() => setSelectedCategory('')}
              aria-label={t('Clear filter', 'Hapus filter')}
            >
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>
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
                  {p.category && (
                    <span className="px-2 py-0.5 text-xs font-mono bg-accent/10 text-accent rounded">
                      {p.category.name}
                    </span>
                  )}
                  {tagsOf(p).map((tag, idx) => {
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
