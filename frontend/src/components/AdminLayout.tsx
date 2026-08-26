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

const LINKS = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/profile', label: 'Profile', Icon: User },
  { to: '/admin/projects', label: 'Projects', Icon: FolderKanban },
  { to: '/admin/experiences', label: 'Experience', Icon: Briefcase },
  { to: '/admin/skills', label: 'Skills', Icon: Wrench },
  { to: '/admin/contacts', label: 'Messages', Icon: Mail },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // Send the admin to the public site, not back to the login form.
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
              lihat situs
              <ExternalLink size={12} aria-hidden="true" />
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-ink-700 px-3 font-mono text-xs text-mist-400 hover:border-red-500/40 hover:text-red-300"
            >
              <LogOut size={13} aria-hidden="true" />
              logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-5 py-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-1" aria-label="Menu admin">
            {LINKS.map(({ to, label, Icon, end }) => (
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
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — 6 items would be too many, so Messages is last. */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-ink-700 bg-ink-950/95 backdrop-blur md:hidden"
        aria-label="Menu admin mobile"
      >
        {LINKS.slice(0, 5).map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 py-2.5 ${
                isActive ? 'text-accent' : 'text-mist-600'
              }`
            }
          >
            <Icon size={17} aria-hidden="true" />
            <span className="font-mono text-[10px]">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="h-16 md:hidden" aria-hidden="true" />
    </div>
  );
}
