import { useEffect, useState } from 'react';
import { Mail, MailOpen, Trash2 } from 'lucide-react';

import { api, apiData } from '@/lib/api';
import type { ContactMessage } from '@/lib/types';
import { Spinner, EmptyState, ErrorState } from '@/components/ui';

export default function ContactsPage() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiData<ContactMessage[]>('/admin/contacts', { auth: true })
      .then((d) => setItems(d || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id: string) => {
    try {
      await api(`/admin/contacts/${id}/read`, { method: 'PUT', auth: true });
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: true } : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui.');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Hapus pesan ini?')) return;
    try {
      await api(`/admin/contacts/${id}`, { method: 'DELETE', auth: true });
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus.');
    }
  };

  const fmt = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 className="mb-6 text-xl font-medium text-mist-50">Messages</h1>

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && items.length === 0 && <EmptyState message="Belum ada pesan masuk." />}

      <div className="space-y-3">
        {items.map((m) => (
          <article
            key={m.id}
            className={`card p-5 ${!m.is_read ? 'border-accent/30' : ''}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {!m.is_read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="Belum dibaca" />
                  )}
                  <h2 className="truncate text-sm font-medium text-mist-50">{m.name}</h2>
                </div>
                <a
                  href={`mailto:${m.email}`}
                  className="font-mono text-xs text-mist-400 hover:text-accent"
                >
                  {m.email}
                </a>
              </div>
              <span className="font-mono text-[11px] text-mist-600">{fmt(m.created_at)}</span>
            </div>

            {m.subject && <p className="mt-3 text-sm text-mist-200">{m.subject}</p>}

            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-mist-400">
              {m.message}
            </p>

            <div className="mt-4 flex items-center gap-2">
              {!m.is_read && (
                <button
                  onClick={() => markRead(m.id)}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-ink-700 px-3 font-mono text-xs text-mist-400 hover:border-accent/40 hover:text-accent"
                >
                  <MailOpen size={13} aria-hidden="true" />
                  tandai dibaca
                </button>
              )}
              <a
                href={`mailto:${m.email}`}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-ink-700 px-3 font-mono text-xs text-mist-400 hover:border-accent/40 hover:text-accent"
              >
                <Mail size={13} aria-hidden="true" />
                balas
              </a>
              <button
                onClick={() => remove(m.id)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-ink-700 px-3 font-mono text-xs text-mist-400 hover:border-red-500/40 hover:text-red-300"
              >
                <Trash2 size={13} aria-hidden="true" />
                hapus
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
