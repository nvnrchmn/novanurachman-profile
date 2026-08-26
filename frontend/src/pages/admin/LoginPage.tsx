import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, LogIn } from 'lucide-react';

import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-ink-700 bg-ink-900">
            <Terminal size={18} className="text-accent" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-medium text-mist-50">Admin Portal</h1>
          <p className="mt-1 font-mono text-xs text-mist-600">novanurachman.my.id</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block font-mono text-xs text-mist-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block font-mono text-xs text-mist-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
            {busy ? 'Masuk…' : 'Masuk'}
            {!busy && <LogIn size={15} aria-hidden="true" />}
          </button>
        </form>
      </div>
    </div>
  );
}
