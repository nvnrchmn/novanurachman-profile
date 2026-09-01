import { useState } from 'react';
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
  FileText,
  BarChart3,
  MoreHorizontal,
  Terminal,
  X,
  Tags,
  FolderTree,
} from 'lucide-react';

import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/lang';

interface NavItem {
  to: string;
  labelKey: string;
  Icon: typeof LayoutDashboard;
  end?: boolean;
}

interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    titleKey: 'main',
    items: [
      { to: '/admin', labelKey: 'dashboard', Icon: LayoutDashboard, end: true },
      { to: '/admin/analytics', labelKey: 'analytics', Icon: BarChart3 },
    ],
  },
  {
    titleKey: 'content',
    items: [
      { to: '/admin/posts', labelKey: 'blog', Icon: FileText },
      { to: '/admin/categories', labelKey: 'categories', Icon: FolderTree },
      { to: '/admin/tags', labelKey: 'tags', Icon: Tags },
      { to: '/admin/projects', labelKey: 'projects', Icon: FolderKanban },
      { to: '/admin/experiences', labelKey: 'experience', Icon: Briefcase },
      { to: '/admin/skills', labelKey: 'skills', Icon: Wrench },
    ],
  },
  {
    titleKey: 'other',
    items: [
      { to: '/admin/contacts', labelKey: 'messages', Icon: Mail },
      { to: '/admin/profile', labelKey: 'profile', Icon: User },
    ],
  },
];

const LABELS: Record<string, Record<string, string>> = {
  en: {
    main: 'Main',
    content: 'Content',
    other: 'Other',
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    blog: 'Blog',
    categories: 'Categories',
    tags: 'Tags',
    projects: 'Projects',
    experience: 'Experience',
    skills: 'Skills',
    messages: 'Messages',
    profile: 'Profile',
    viewSite: 'view site',
    logout: 'logout',
    more: 'More',
  },
  id: {
    main: 'Utama',
    content: 'Konten',
    other: 'Lainnya',
    dashboard: 'Dasbor',
    analytics: 'Analytics',
    blog: 'Blog',
    categories: 'Kategori',
    tags: 'Tag',
    projects: 'Proyek',
    experience: 'Pengalaman',
    skills: 'Keahlian',
    messages: 'Pesan',
    profile: 'Profil',
    viewSite: 'lihat situs',
    logout: 'keluar',
    more: 'Lainnya',
  },
};

// 5 slots max on the mobile bottom bar; the rest live in the "more" sheet.
const BOTTOM_NAV: NavItem[] = [
  { to: '/admin', labelKey: 'dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/posts', labelKey: 'blog', Icon: FileText },
  { to: '/admin/projects', labelKey: 'projects', Icon: FolderKanban },
  { to: '/admin/contacts', labelKey: 'messages', Icon: Mail },
  { to: '', labelKey: 'more', Icon: MoreHorizontal },
];

const MORE_ITEMS: NavItem[] = [
  { to: '/admin/analytics', labelKey: 'analytics', Icon: BarChart3 },
  { to: '/admin/categories', labelKey: 'categories', Icon: FolderTree },
  { to: '/admin/tags', labelKey: 'tags', Icon: Tags },
  { to: '/admin/experiences', labelKey: 'experience', Icon: Briefcase },
  { to: '/admin/skills', labelKey: 'skills', Icon: Wrench },
  { to: '/admin/profile', labelKey: 'profile', Icon: User },
];

function NavLinkItem({ to, labelKey, Icon, end, labels }: NavItem & { labels: Record<string, string> }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex min-h-[42px] items-center gap-2.5 rounded-md px-3 text-sm transition-colors ${
          isActive
            ? 'bg-accent/10 font-medium text-accent'
            : 'text-mist-400 hover:bg-ink-800/60 hover:text-mist-50'
        }`
      }
    >
      <Icon size={15} aria-hidden="true" />
      {labels[labelKey]}
    </NavLink>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { lang } = useLang();
  const labels = LABELS[lang];
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const initials = (user?.name || 'A')
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const closeMore = () => setMoreOpen(false);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950/95 backdrop-blur md:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-mono text-sm text-mist-50">
            <Terminal size={15} className="text-accent" aria-hidden="true" />
            <span>nova</span>
            <span className="text-mist-600">/admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-md text-mist-400 hover:text-red-300"
            aria-label={labels.logout}
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-ink-700 bg-ink-900/40 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-ink-700 px-5 font-mono text-sm text-mist-50">
          <Terminal size={16} className="text-accent" aria-hidden="true" />
          <span>nova</span>
          <span className="text-mist-600">/admin</span>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label={lang === 'id' ? 'Menu admin' : 'Admin menu'}>
          {GROUPS.map((group) => (
            <div key={group.titleKey}>
              <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-[0.16em] text-mist-600">
                {labels[group.titleKey]}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLinkItem key={item.to} {...item} labels={labels} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-ink-700 p-3">
          <a
            href="/"
            className="flex min-h-[42px] items-center gap-2.5 rounded-md px-3 text-sm text-mist-400 hover:bg-ink-800/60 hover:text-accent"
          >
            <ExternalLink size={15} aria-hidden="true" />
            {labels.viewSite}
          </a>
          <button
            onClick={handleLogout}
            className="flex min-h-[42px] w-full items-center gap-2.5 rounded-md px-3 text-sm text-mist-400 hover:bg-ink-800/60 hover:text-red-300"
          >
            <LogOut size={15} aria-hidden="true" />
            {labels.logout}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700 bg-ink-950/95 backdrop-blur md:hidden"
        aria-label={lang === 'id' ? 'Navigasi admin' : 'Admin navigation'}
      >
        <div className="mx-auto flex max-w-md items-stretch">
          {BOTTOM_NAV.map((item) =>
            item.to ? (
              <NavLink
                key={item.labelKey}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-accent' : 'text-mist-600 hover:text-mist-200'
                  }`
                }
              >
                <item.Icon size={18} aria-hidden="true" />
                <span className="text-[10px]">{labels[item.labelKey]}</span>
              </NavLink>
            ) : (
              <button
                key={item.labelKey}
                onClick={() => setMoreOpen(true)}
                className="flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 text-mist-600 transition-colors hover:text-mist-200"
                aria-label={labels.more}
                aria-expanded={moreOpen}
              >
                <MoreHorizontal size={18} aria-hidden="true" />
                <span className="text-[10px]">{labels.more}</span>
              </button>
            )
          )}
        </div>
      </nav>

      {/* "More" sheet (mobile) */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={closeMore}
            aria-label="Tutup"
            tabIndex={-1}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-ink-700 bg-ink-900 p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-sm text-mist-50">
                {labels.more}
                <span className="ml-2 text-mist-600">/ {user?.name}</span>
              </p>
              <button
                onClick={closeMore}
                className="flex h-10 w-10 items-center justify-center rounded-md text-mist-400 hover:text-mist-50"
                aria-label="Tutup"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-1">
              {MORE_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMore}
                  className={({ isActive }) =>
                    `flex min-h-[46px] items-center gap-3 rounded-md px-3 text-sm transition-colors ${
                      isActive ? 'bg-accent/10 text-accent' : 'text-mist-400 hover:bg-ink-800/60 hover:text-mist-50'
                    }`
                  }
                >
                  <item.Icon size={16} aria-hidden="true" />
                  {labels[item.labelKey]}
                </NavLink>
              ))}
            </div>

            <div className="mt-3 flex gap-2 border-t border-ink-700 pt-4">
              <a
                href="/"
                className="btn-outline flex-1"
              >
                <ExternalLink size={14} aria-hidden="true" />
                {labels.viewSite}
              </a>
              <button onClick={handleLogout} className="btn-outline flex-1">
                <LogOut size={14} aria-hidden="true" />
                {labels.logout}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 md:pl-72 md:pr-8">
        {/* Desktop user chip */}
        <div className="mb-8 hidden items-center justify-end gap-3 md:flex">
          <span className="font-mono text-xs text-mist-600">{user?.name}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 font-mono text-xs text-accent">
            {initials}
          </span>
        </div>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
