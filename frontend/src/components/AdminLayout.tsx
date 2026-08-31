import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  Wrench,
  Mail,
  User,
  LogOut,
  ExternalLink,
} from 'lucide-react';

import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/lang';

const LINKS = [
  { to: '/admin', labelKey: 'dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/profile', labelKey: 'profile', Icon: User },
  { to: '/admin/projects', labelKey: 'projects', Icon: FolderKanban },
  { to: '/admin/experiences', labelKey: 'experience', Icon: Briefcase },
  { to: '/admin/skills', labelKey: 'skills', Icon: Wrench },
  { to: '/admin/contacts', labelKey: 'messages', Icon: Mail },
];

const LABELS = {
  en: { dashboard: 'Dashboard', profile: 'Profile', projects: 'Projects', experience: 'Experience', skills: 'Skills', messages: 'Messages', viewSite: 'view site', logout: 'logout' },
  id: { dashboard: 'Dasbor', profile: 'Profil', projects: 'Proyek', experience: 'Pengalaman', skills: 'Keahlian', messages: 'Pesan', viewSite: 'lihat situs', logout: 'keluar' },
};

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { lang } = useLang();
  const labels = LABELS[lang];
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-mist-50">admin</span>
            <span className="font-mono text-xs text-mist-600">/ {user?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md px-3 font-mono text-xs text-mist-400 hover:text-accent"
            >
              {labels.viewSite}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-ink-700 px-3 font-mono text-xs text-mist-400 hover:border-red-500/40 hover:text-red-300"
            >
              <LogOut size={13} aria-hidden="true" />
              {labels.logout}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-5 py-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-1" aria-label={lang === 'id' ? 'Menu admin' : 'Admin menu'}>
            {LINKS.map(({ to, labelKey, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-[42px] items-center gap-2.5 rounded-md px-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-ink-800 text-accent'
                      : 'text-mist-400 hover:bg-ink-800/60 hover:text-mist-50'
                  }`
                }
              >
                <Icon size={15} aria-hidden="true" />
                {labels[labelKey as keyof typeof labels]}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
