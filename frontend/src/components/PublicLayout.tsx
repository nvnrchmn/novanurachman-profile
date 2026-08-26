import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { PublicNav } from './PublicNav';
import { PublicFooter } from './PublicFooter';
import { apiData } from '@/lib/api';
import type { Profile } from '@/lib/types';

export function PublicLayout() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const location = useLocation();

  useEffect(() => {
    apiData<Profile | null>('/profile')
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  // Scroll to top on route change.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">
        <Outlet context={{ profile }} />
      </main>
      <PublicFooter profile={profile} />
    </div>
  );
}
