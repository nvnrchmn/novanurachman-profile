import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Terminal } from 'lucide-react';

import { LanguageSwitcher } from './LanguageSwitcher';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/experience', label: 'Experience' },
  { to: '/skills', label: 'Skills' },
  { to: '/contact', label: 'Contact' },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled ? 'border-ink-700 bg-ink-950/90 backdrop-blur-md' : 'border-transparent bg-transparent'
      }`}
    >
      <div className="container-content flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-mono text-sm text-mist-50">
          <Terminal size={16} className="text-accent" aria-hidden="true" />
          <span>nova</span>
          <span className="animate-blink text-accent" aria-hidden="true">
            _
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          <nav className="hidden items-center gap-7 md:flex" aria-label="Navigasi utama">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `font-mono text-[13px] transition-colors ${
                  isActive ? 'text-accent' : 'text-mist-400 hover:text-mist-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          </nav>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-mist-200 md:hidden"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-ink-700 bg-ink-950 md:hidden" aria-label="Navigasi mobile">
          <div className="container-content flex flex-col py-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center font-mono text-sm ${
                    isActive ? 'text-accent' : 'text-mist-400'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 px-3 py-2">
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
