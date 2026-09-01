import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, Eye, FileText, Wand2 } from 'lucide-react';

import { api, apiData } from '@/lib/api';
import { Spinner, EmptyState, ErrorState } from '@/components/ui';
import { renderMarkdown } from '@/lib/markdown';
import { useLang } from '@/lib/lang';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface TagItem {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface PostRow {
  id: string;
  title_en: string;
  title_id: string;
  slug: string;
  excerpt_en: string;
  excerpt_id: string;
  content_en: string;
  content_id: string;
  cover_image: string;
  tags: string;
  is_published: number | boolean;
  published_at: string | null;
  category_id: string | null;
  category?: Category;
  view_count: number;
}

type Tab = 'en' | 'id';

const BLANK: Record<string, any> = {
  title_en: '',
  title_id: '',
  slug: '',
  excerpt_en: '',
  excerpt_id: '',
  content_en: '',
  content_id: '',
  cover_image: '',
  tags: '',
  category_id: '',
  is_published: true,
  published_at: '',
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function postStatus(row: PostRow): { label: string; cls: string } {
  const published = row.is_published === 1 || row.is_published === true;
  if (!published) return { label: 'draft', cls: 'text-mist-600 border-ink-700' };
  if (row.published_at && new Date(row.published_at).getTime() > Date.now()) {
    return { label: 'terjadwal', cls: 'text-amber-300 border-amber-500/40' };
  }
  return { label: 'terbit', cls: 'text-accent border-accent/40' };
}

function fmtPub(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function PostsPage() {
  const { t } = useLang();
  const [rows, setRows] = useState<PostRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PostRow | null>(null);
  const [form, setForm] = useState<Record<string, any>>(BLANK);
  const [tab, setTab] = useState<Tab>('en');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadCategories = async () => {
    try {
      const data = await apiData<Category[]>('/categories');
      if (data) setCategories(data);
    } catch (e) {
      // ignore
    }
  };

  const loadTags = async () => {
    try {
      const data = await apiData<TagItem[]>('/tags');
      if (data) setAllTags(data);
    } catch (e) {
      // ignore
    }
  };

  const load = () => {
    setLoading(true);
    setError('');
    apiData<PostRow[]>('/admin/posts', { auth: true })
      .then((d) => setRows(d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
    loadTags();
    load();
  }, []);

  const openCreate = () => {
    setForm({ ...BLANK });
    setEditing(null);
    setSelectedTagIds([]);
    setTab('en');
    setPreview(false);
    setFormError('');
    setOpen(true);
  };

  const openEdit = (row: PostRow) => {
    const filled: Record<string, any> = { ...BLANK };
    for (const key of Object.keys(BLANK)) {
      if (key === 'is_published') {
        filled[key] = row.is_published === 1 || row.is_published === true;
      } else if (key === 'published_at') {
        filled[key] = row.published_at ? toLocalInput(row.published_at) : '';
      } else {
        filled[key] = (row as any)[key] ?? '';
      }
    }
    setForm(filled);
    setEditing(row);
    setSelectedTagIds([]);
    apiData<TagItem[]>(`/posts/${row.slug}/tags`)
      .then((d) => setSelectedTagIds((d || []).map((tg) => tg.id)))
      .catch(() => setSelectedTagIds([]));
    setTab('en');
    setPreview(false);
    setFormError('');
    setOpen(true);
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const title = tab === 'en' ? form.title_en : form.title_id || form.title_en;
    if (!String(form.title_en || form.title_id || '').trim()) {
      setFormError('Judul (EN atau ID) wajib diisi.');
      return;
    }

    let slug = String(form.slug || '').trim();
    if (!slug) slug = slugify(String(form.title_en || title || ''));
    if (!slug) {
      setFormError('Slug wajib diisi.');
      return;
    }
    set('slug', slug);

    const pubAt = String(form.published_at || '').trim();
    const payload = {
      title_en: form.title_en,
      title_id: form.title_id,
      slug,
      excerpt_en: form.excerpt_en,
      excerpt_id: form.excerpt_id,
      content_en: form.content_en,
      content_id: form.content_id,
      cover_image: form.cover_image,
      tags: form.tags,
      category_id: form.category_id || null,
      is_published: form.is_published,
      published_at: pubAt ? pubAt.replace('T', ' ') + ':00' : '',
    };

    setSaving(true);
    try {
      let postId = editing ? editing.id : '';
      if (editing) {
        await api(`/admin/posts/${editing.id}`, {
          method: 'PUT',
          auth: true,
          body: JSON.stringify(payload),
        });
      } else {
        const created = await api<{ id?: string }>('/admin/posts', {
          method: 'POST',
          auth: true,
          body: JSON.stringify(payload),
        });
        postId = created?.id || '';
      }
      if (postId) {
        await api(`/admin/posts/${postId}/tags`, {
          method: 'PUT',
          auth: true,
          body: JSON.stringify({ tag_ids: selectedTagIds }),
        });
      }
      setOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: PostRow) => {
    if (!window.confirm(`Hapus postingan "${row.title_en}"?`)) return;
    try {
      await api(`/admin/posts/${row.id}`, { method: 'DELETE', auth: true });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus.');
    }
  };

  const activeContent = tab === 'en' ? form.content_en : form.content_id;
  const previewHTML = useMemo(
    () => (preview ? renderMarkdown(String(activeContent || '')) : ''),
    [preview, activeContent]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-mist-50">Blog</h1>
          <p className="mt-1 font-mono text-xs text-mist-600">
            {rows.filter((r) => postStatus(r).label === 'terbit').length} terbit ·{' '}
            {rows.filter((r) => postStatus(r).label === 'terjadwal').length} terjadwal ·{' '}
            {rows.filter((r) => postStatus(r).label === 'draft').length} draft
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={15} aria-hidden="true" />
          Tulis
        </button>
      </div>

      {loading && <Spinner />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState message="Belum ada postingan. Tulis yang pertama!" />
      )}

      {!loading && rows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-700">
                <th className="px-4 py-3 font-mono text-xs font-normal text-mist-600">judul</th>
                <th className="hidden px-4 py-3 font-mono text-xs font-normal text-mist-600 md:table-cell">
                  slug
                </th>
                <th className="px-4 py-3 font-mono text-xs font-normal text-mist-600">status</th>
                <th className="hidden px-4 py-3 font-mono text-xs font-normal text-mist-600 sm:table-cell">
                  tanggal
                </th>
                <th className="px-4 py-3 text-right font-mono text-xs font-normal text-mist-600">
                  aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const st = postStatus(row);
                return (
                  <tr key={row.id} className="border-b border-ink-700/60 last:border-0">
                    <td className="px-4 py-3 text-mist-200">
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="shrink-0 text-accent/70" aria-hidden="true" />
                        <span className="truncate">{row.title_en || row.title_id || '—'}</span>
                      </div>
                    </td>
                    <td className="hidden max-w-[200px] truncate px-4 py-3 font-mono text-xs text-mist-600 md:table-cell">
                      /blog/{row.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`tag border ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-mist-600 sm:table-cell">
                      {fmtPub(row.published_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(row)}
                          aria-label="Edit"
                          className="flex h-9 w-9 items-center justify-center rounded-md text-mist-400 hover:bg-ink-700 hover:text-accent"
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => remove(row)}
                          aria-label="Hapus"
                          className="flex h-9 w-9 items-center justify-center rounded-md text-mist-400 hover:bg-ink-700 hover:text-red-300"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-lg border border-ink-700 bg-ink-900">
            <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
              <h2 className="text-sm font-medium text-mist-50">
                {editing ? `Edit ${editing.title_en || ''}` : 'Tulis postingan baru'}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="flex h-9 w-9 items-center justify-center rounded-md text-mist-400 hover:text-mist-50"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Language tabs */}
            <div className="flex gap-1 border-b border-ink-700 px-5 pt-3">
              {(['en', 'id'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setPreview(false);
                  }}
                  className={`min-h-[40px] rounded-t-md px-4 font-mono text-xs transition-colors ${
                    tab === t ? 'bg-ink-800 text-accent' : 'text-mist-600 hover:text-mist-200'
                  }`}
                  aria-pressed={tab === t}
                >
                  {t === 'en' ? 'English' : 'Indonesia'}
                </button>
              ))}
            </div>

            <form onSubmit={save} className="space-y-4 p-5" noValidate>
              {/* Per-language fields */}
              <div>
                <label htmlFor="f-title" className="mb-1.5 block font-mono text-xs text-mist-400">
                  Judul <span className="text-accent">*</span>
                </label>
                <input
                  id="f-title"
                  className="input"
                  placeholder={tab === 'en' ? 'Post title' : 'Judul tulisan'}
                  value={form[`title_${tab}`] ?? ''}
                  onChange={(e) => set(`title_${tab}`, e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="f-excerpt" className="mb-1.5 block font-mono text-xs text-mist-400">
                  Ringkasan
                </label>
                <textarea
                  id="f-excerpt"
                  rows={2}
                  className="input resize-y"
                  placeholder={tab === 'en' ? 'Short summary shown on the blog list' : 'Ringkasan singkat di daftar blog'}
                  value={form[`excerpt_${tab}`] ?? ''}
                  onChange={(e) => set(`excerpt_${tab}`, e.target.value)}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="f-content" className="block font-mono text-xs text-mist-400">
                    Isi (Markdown)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreview((v) => !v)}
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-mist-600 hover:text-accent"
                  >
                    <Eye size={12} aria-hidden="true" />
                    {preview ? 'tulis' : 'pratinjau'}
                  </button>
                </div>
                {preview ? (
                  <div
                    className="markdown-body max-h-80 overflow-y-auto rounded-md border border-ink-700 bg-ink-950 p-4"
                    dangerouslySetInnerHTML={{ __html: previewHTML }}
                  />
                ) : (
                  <textarea
                    id="f-content"
                    rows={12}
                    className="input resize-y font-mono text-[13px] leading-relaxed"
                    placeholder={'# Heading\n\nMarkdown **supported**'}
                    value={activeContent ?? ''}
                    onChange={(e) => set(`content_${tab}`, e.target.value)}
                  />
                )}
              </div>

              {/* Shared fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="f-slug" className="mb-1.5 block font-mono text-xs text-mist-400">
                    Slug
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="f-slug"
                      className="input"
                      placeholder="nama-postingan"
                      value={form.slug ?? ''}
                      onChange={(e) => set('slug', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => set('slug', slugify(String(form.title_en || '')))}
                      aria-label="Generate slug dari judul"
                      title="Generate dari judul EN"
                      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-md border border-ink-700 text-mist-400 hover:border-accent/50 hover:text-accent"
                    >
                      <Wand2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="f-category" className="mb-1.5 block font-mono text-xs text-mist-400">
                    Kategori
                  </label>
                  <select
                    id="f-category"
                    className="input"
                    value={form.category_id ?? ''}
                    onChange={(e) => set('category_id', e.target.value)}
                  >
                    <option value="">{t('Pilih kategori', 'Pilih kategori')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="f-tags" className="mb-1.5 block font-mono text-xs text-mist-400">
                    Tag
                  </label>
                  {allTags.length === 0 ? (
                    <p className="text-xs text-mist-500">
                      Belum ada tag — buat dulu di menu Tags.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => {
                        const on = selectedTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() =>
                              setSelectedTagIds(
                                on
                                  ? selectedTagIds.filter((x) => x !== tag.id)
                                  : [...selectedTagIds, tag.id]
                              )
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              on
                                ? 'border-accent/60 bg-accent/15 text-accent'
                                : 'border-ink-700 text-mist-400 hover:border-mist-500 hover:text-mist-200'
                            }`}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: tag.color || '#4ADE80' }}
                            />
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="f-cover" className="mb-1.5 block font-mono text-xs text-mist-400">
                  URL Gambar Sampul
                </label>
                <input
                  id="f-cover"
                  className="input"
                  placeholder="https://…"
                  value={form.cover_image ?? ''}
                  onChange={(e) => set('cover_image', e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label
                  htmlFor="f-pub"
                  className="flex min-h-[44px] cursor-pointer items-center gap-3"
                >
                  <input
                    id="f-pub"
                    type="checkbox"
                    checked={!!form.is_published}
                    onChange={(e) => set('is_published', e.target.checked)}
                    className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-accent"
                  />
                  <span className="text-sm text-mist-200">Publikasikan</span>
                </label>

                <div>
                  <label htmlFor="f-pubat" className="mb-1.5 block font-mono text-xs text-mist-400">
                    Jadwalkan (opsional)
                  </label>
                  <input
                    id="f-pubat"
                    type="datetime-local"
                    className="input"
                    value={form.published_at ?? ''}
                    onChange={(e) => set('published_at', e.target.value)}
                  />
                  <p className="mt-1 font-mono text-[11px] text-mist-600">
                    kosongkan = langsung tampil setelah disimpan
                  </p>
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-300" role="alert">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-outline">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function toLocalInput(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}
