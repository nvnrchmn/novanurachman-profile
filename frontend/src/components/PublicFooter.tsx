import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail } from 'lucide-react';
import type { Profile } from '@/lib/types';

export function PublicFooter({ profile }: { profile: Profile | null }) {
  const year = new Date().getFullYear();

  const socials = [
    { url: profile?.github_url, Icon: Github, label: 'GitHub' },
    { url: profile?.linkedin_url, Icon: Linkedin, label: 'LinkedIn' },
    { url: profile?.email ? `mailto:${profile.email}` : '', Icon: Mail, label: 'Email' },
  ].filter((s) => s.url);

  return (
    <footer className="mt-24 border-t border-ink-700">
      <div className="container-content flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-sm text-mist-200">{profile?.name || 'Nova Nurachman'}</p>
          <p className="mt-1 font-mono text-xs text-mist-600">
            © {year} · Built with Go &amp; React
          </p>
        </div>

        <div className="flex items-center gap-3">
          {socials.map(({ url, Icon, label }) => (
            <a
              key={label}
              href={url!}
              target={url!.startsWith('mailto:') ? undefined : '_blank'}
              rel="noreferrer noopener"
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-ink-700
                         text-mist-400 transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Icon size={16} aria-hidden="true" />
            </a>
          ))}
          <Link
            to="/admin"
            className="ml-1 font-mono text-xs text-mist-600 transition-colors hover:text-mist-400"
          >
            admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
