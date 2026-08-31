import { useEffect, useState } from 'react';
import { Mail, MapPin, Send, Github, Linkedin, Check } from 'lucide-react';

import { api, apiData } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { Reveal, SectionHeading } from '@/components/ui';
import { useLang } from '@/lib/lang';

export default function ContactPage() {
  const { t, lang } = useLang();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiData<Profile | null>('/profile')
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [lang]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError(t('Name, email, and message are required.', 'Nama, email, dan pesan wajib diisi.'));
      return;
    }

    setSending(true);
    try {
      await api('/contact', { method: 'POST', body: JSON.stringify(form) });
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal mengirim pesan.', 'Failed to send message.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="container-content py-16">
      <Reveal>
        <SectionHeading
          label={t('contact', 'kontak')}
          title={t('Contact Me', 'Hubungi Saya')}
          description={t(
            'Open for collaboration, projects, or just a technical discussion.',
            'Terbuka untuk kolaborasi, proyek, atau sekadar diskusi teknis.'
          )}
        />
      </Reveal>

      <div className="grid gap-10 md:grid-cols-[1fr_1.3fr]">
        <Reveal>
          <div className="space-y-3">
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="card card-hover flex items-center gap-3 p-4">
                <Mail size={16} className="text-accent" aria-hidden="true" />
                <span className="text-sm text-mist-200">{profile.email}</span>
              </a>
            )}

            {profile?.location && (
              <div className="card flex items-center gap-3 p-4">
                <MapPin size={16} className="text-accent" aria-hidden="true" />
                <span className="text-sm text-mist-400">{profile.location}</span>
              </div>
            )}

            {profile?.github_url && (
              <a href={profile.github_url} target="_blank" rel="noreferrer noopener" className="card card-hover flex items-center gap-3 p-4">
                <Github size={16} className="text-accent" aria-hidden="true" />
                <span className="text-sm text-mist-200">GitHub</span>
              </a>
            )}

            {profile?.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer noopener" className="card card-hover flex items-center gap-3 p-4">
                <Linkedin size={16} className="text-accent" aria-hidden="true" />
                <span className="text-sm text-mist-200">LinkedIn</span>
              </a>
            )}
          </div>
        </Reveal>

        <Reveal delay={80}>
          {sent ? (
            <div className="card border-accent/30 p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-glow">
                <Check size={20} className="text-accent" aria-hidden="true" />
              </div>
              <p className="text-base font-medium text-mist-50">{t('Pesan terkirim', 'Message sent')}</p>
              <p className="mt-2 text-sm text-mist-400">{t('Thank you, I will reply soon.', 'Terima kasih, saya akan segera membalas.')}</p>
              <button onClick={() => setSent(false)} className="btn-outline mt-6">
                {t('Send another', 'Kirim pesan lain')}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
              <div>
                <label htmlFor="name" className="mb-1.5 block font-mono text-xs text-mist-400">
                  {t('Name', 'Nama')} <span className="text-accent">*</span>
                </label>
                <input id="name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block font-mono text-xs text-mist-400">
                  Email <span className="text-accent">*</span>
                </label>
                <input id="email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required />
              </div>

              <div>
                <label htmlFor="subject" className="mb-1.5 block font-mono text-xs text-mist-400">
                  {t('Subject', 'Subjek')}
                </label>
                <input id="subject" className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block font-mono text-xs text-mist-400">
                  {t('Message', 'Pesan')} <span className="text-accent">*</span>
                </label>
                <textarea id="message" rows={5} className="input resize-y" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>

              {error && <p className="text-sm text-red-300" role="alert">{error}</p>}

              <button type="submit" disabled={sending} className="btn-primary w-full disabled:opacity-50">
                {sending ? t('Mengirim…', 'Sending…') : t('Send Message', 'Kirim Pesan')}
                {!sending && <Send size={15} aria-hidden="true" />}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
