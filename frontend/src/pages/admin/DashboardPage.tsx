import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Briefcase, Wrench, Mail, FileText } from 'lucide-react';

import { apiData } from '@/lib/api';
import type { Stats } from '@/lib/types';
import { Spinner, ErrorState } from '@/components/ui';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiData<Stats>('/admin/stats', { auth: true })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const cards = [
    { label: 'Projects', value: stats?.projects ?? 0, to: '/admin/projects', Icon: FolderKanban },
    { label: 'Experience', value: stats?.experiences ?? 0, to: '/admin/experiences', Icon: Briefcase },
    { label: 'Skills', value: stats?.skills ?? 0, to: '/admin/skills', Icon: Wrench },
    {
      label: 'Messages',
      value: stats?.contacts ?? 0,
      badge: stats?.contacts_unread ?? 0,
      to: '/admin/contacts',
      Icon: Mail,
    },
    {
      label: 'Blog',
      value: stats?.posts ?? 0,
      badge:
        stats && stats.posts > 0 && stats.posts_published === stats.posts
          ? 0
          : (stats?.posts ?? 0) - (stats?.posts_published ?? 0),
      to: '/admin/posts',
      Icon: FileText,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-medium text-mist-50">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(({ label, value, badge, to, Icon }) => (
          <Link key={label} to={to} className="card card-hover p-5">
            <div className="mb-3 flex items-center justify-between">
              <Icon size={16} className="text-accent" aria-hidden="true" />
              {!!badge && badge > 0 && (
                <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] text-ink-950">
                  {badge} baru
                </span>
              )}
            </div>
            <p className="font-mono text-2xl text-mist-50">{value}</p>
            <p className="mt-1 font-mono text-xs text-mist-600">{label}</p>
          </Link>
        ))}
      </div>

      <div className="card mt-8 p-6">
        <h2 className="mono-label mb-3">catatan</h2>
        <p className="text-sm leading-relaxed text-mist-400">
          Semua konten di situs publik dibaca langsung dari database. Perubahan yang Anda simpan di
          sini langsung tampil tanpa perlu deploy ulang.
        </p>
      </div>
    </div>
  );
}
