import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { PublicLayout } from '@/components/PublicLayout';
import { AdminLayout } from '@/components/AdminLayout';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui';
import { CrudPage } from '@/pages/admin/CrudPage';
import InstallPrompt from '@/components/InstallPrompt';

// Public pages
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const ProjectsPage = lazy(() => import('@/pages/public/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/public/ProjectDetailPage'));
const ExperiencePage = lazy(() => import('@/pages/public/ExperiencePage'));
const SkillsPage = lazy(() => import('@/pages/public/SkillsPage'));
const BlogPage = lazy(() => import('@/pages/public/BlogPage'));
const BlogDetailPage = lazy(() => import('@/pages/public/BlogDetailPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));

// Admin pages
const LoginPage = lazy(() => import('@/pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminProfilePage = lazy(() => import('@/pages/admin/ProfilePage'));
const ContactsPage = lazy(() => import('@/pages/admin/ContactsPage'));
const PostsPage = lazy(() => import('@/pages/admin/PostsPage'));
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'));

function Fallback() {
  return (
    <div className="container-content">
      <Spinner />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Fallback />;
  if (!user) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Fallback />;
  if (user) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

const TRUNC = (v: unknown, n = 40) => {
  const s = String(v ?? '');
  return s.length > n ? s.slice(0, n) + '…' : s || '—';
};

const YES_NO = (v: unknown) =>
  v === 1 || v === true ? <span className="text-accent">ya</span> : <span className="text-mist-600">tidak</span>;

export default function App() {
  return (
    <AuthProvider>
      <InstallPrompt />
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            <Route path="/experience" element={<ExperiencePage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* Admin login */}
          <Route
            path="/admin/login"
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />

          {/* Admin CMS */}
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />

            <Route
              path="projects"
              element={
                <CrudPage
                  title="Projects"
                  endpoint="admin/projects"
                  columns={[
                    { key: 'title', label: 'judul' },
                    { key: 'year', label: 'tahun' },
                    { key: 'featured', label: 'unggulan', render: (r) => YES_NO(r.featured) },
                    { key: 'is_published', label: 'tampil', render: (r) => YES_NO(r.is_published) },
                  ]}
                  fields={[
                    { key: 'title', label: 'Judul', required: true },
                    { key: 'slug', label: 'Slug', required: true, help: 'huruf kecil, pakai tanda hubung' },
                    { key: 'summary', label: 'Ringkasan', type: 'textarea' },
                    { key: 'description', label: 'Deskripsi', type: 'textarea' },
                    { key: 'tech_stack', label: 'Tech Stack', help: 'pisahkan dengan koma' },
                    { key: 'cover_image', label: 'URL Gambar' },
                    { key: 'live_url', label: 'URL Live' },
                    { key: 'repo_url', label: 'URL Repository' },
                    { key: 'year', label: 'Tahun' },
                    { key: 'order_no', label: 'Urutan', type: 'number' },
                    { key: 'featured', label: 'Tampilkan di halaman utama', type: 'checkbox' },
                    { key: 'is_published', label: 'Publikasikan', type: 'checkbox' },
                  ]}
                />
              }
            />

            <Route
              path="experiences"
              element={
                <CrudPage
                  title="Experience"
                  endpoint="admin/experiences"
                  columns={[
                    { key: 'role', label: 'posisi' },
                    { key: 'company', label: 'perusahaan' },
                    { key: 'start_date', label: 'mulai' },
                    { key: 'is_current', label: 'aktif', render: (r) => YES_NO(r.is_current) },
                  ]}
                  fields={[
                    { key: 'role', label: 'Posisi', required: true },
                    { key: 'company', label: 'Perusahaan', required: true },
                    { key: 'company_url', label: 'URL Perusahaan' },
                    { key: 'location', label: 'Lokasi' },
                    {
                      key: 'employment',
                      label: 'Jenis',
                      type: 'select',
                      options: ['Full-time', 'Part-time', 'Freelance', 'Contract', 'Internship', 'Founder'],
                    },
                    { key: 'start_date', label: 'Mulai', help: 'contoh: Jan 2025' },
                    { key: 'end_date', label: 'Selesai', help: 'kosongkan jika masih berjalan' },
                    { key: 'description', label: 'Deskripsi', type: 'textarea' },
                    { key: 'order_no', label: 'Urutan', type: 'number' },
                    { key: 'is_current', label: 'Masih berjalan', type: 'checkbox' },
                    { key: 'is_published', label: 'Publikasikan', type: 'checkbox' },
                  ]}
                />
              }
            />

            <Route
              path="skills"
              element={
                <CrudPage
                  title="Skills"
                  endpoint="admin/skills"
                  columns={[
                    { key: 'name', label: 'nama' },
                    { key: 'category', label: 'kategori' },
                    { key: 'level', label: 'level', render: (r) => TRUNC(r.level, 20) },
                    { key: 'is_published', label: 'tampil', render: (r) => YES_NO(r.is_published) },
                  ]}
                  fields={[
                    { key: 'name', label: 'Nama', required: true },
                    {
                      key: 'category',
                      label: 'Kategori',
                      type: 'select',
                      options: ['Backend', 'Frontend', 'Mobile', 'Database', 'Infrastructure', 'Tools', 'Other'],
                    },
                    {
                      key: 'level',
                      label: 'Level',
                      type: 'select',
                      options: ['Beginner', 'Intermediate', 'Advanced'],
                    },
                    { key: 'order_no', label: 'Urutan', type: 'number' },
                    { key: 'is_published', label: 'Publikasikan', type: 'checkbox' },
                  ]}
                />
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
