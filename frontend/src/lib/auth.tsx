import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken, clearToken } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  name: string;
}

interface AuthValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from a stored token on first mount.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api<{ success: boolean; user: AdminUser }>('/admin/me', { auth: true })
      .then((r) => setUser(r.user))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api<{ success: boolean; token: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
