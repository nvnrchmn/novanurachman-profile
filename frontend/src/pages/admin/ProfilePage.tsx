import { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';

import { api, apiData } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { Spinner, ErrorState } from '@/components/ui';

const TEXT_FIELDS: { key: keyof Profile; label: string; area?: boolean; help?: string }[] = [
  { key: 'name', label: 'Nama' },
  { key: 'headline', label: 'Headline', help: 'Contoh: Full-stack Developer' },
  { key: 'tagline', label: 'Tagline', help: 'Satu kalimat singkat di bawah nama' },
  { key: 'bio', label: 'Bio', area: true },
  { key: 'location', label: 'Lokasi' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telepon' },
  { key: 'avatar', label: 'URL Foto' },
  { key: 'resume_url', label: 'URL CV' },
  { key: 'github_url', label: 'GitHub' },
  { key: 'linkedin_url', label: 'LinkedIn' },
  { key: 'x_url', label: 'X / Twitter' },
  { key: 'website_url', label: 'Website' },
];

export default function ProfilePage() {
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    apiData<Profile | null>('/profile')
      .then((d) => setForm((d as unknown as Record<string, any>) || {}))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload: Record<string, any> = { available: !!form.available };
      for (const f of TEXT_FIELDS) payload[f.key] = form[f.key] ?? '';

      await api('/admin/profile', {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(payload),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (error && !Object.keys(form).length) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h1 className="mb-6 text-xl font-medium text-mist-50">Profile</h1>

      <form onSubmit={save} className="card space-y-4 p-6" noValidate>
        <label htmlFor="p-available" className="flex min-h-[44px] cursor-pointer items-center gap-3">
          <input
            id="p-available"
            type="checkbox"
            checked={!!form.available}
            onChange={(e) => setForm({ ...form, available: e.target.checked })}
            className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-accent"
          />
          <span className="text-sm text-mist-200">Tersedia untuk proyek baru</span>
        </label>

        {TEXT_FIELDS.map((f) => (
          <div key={f.key as string}>
            <label htmlFor={`p-${f.key}`} className="mb-1.5 block font-mono text-xs text-mist-400">
              {f.label}
            </label>
            {f.area ? (
              <textarea
                id={`p-${f.key}`}
                rows={5}
                className="input resize-y"
                value={form[f.key] ?? ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            ) : (
              <input
                id={`p-${f.key}`}
                className="input"
                value={form[f.key] ?? ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            )}
            {f.help && <p className="mt-1 font-mono text-[11px] text-mist-600">{f.help}</p>}
          </div>
        ))}

        {error && (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Menyimpan…' : 'Simpan'}
            {!saving && <Save size={15} aria-hidden="true" />}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-accent" role="status">
              <Check size={13} aria-hidden="true" />
              tersimpan
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
