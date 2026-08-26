USE nova_profile;

INSERT INTO profile (id, name, headline, tagline, bio, location, email, available, github_url, linkedin_url)
SELECT 'pf-1', 'Nova Nurachman',
  'Full-stack Developer',
  'Membangun web yang cepat, rapi, dan mudah dirawat.',
  'Saya developer yang fokus pada Go, React, dan infrastruktur. Terbiasa menangani produk dari database sampai deployment, termasuk CI/CD dan optimasi performa.',
  'Jakarta, Indonesia',
  'novanurachman98@gmail.com',
  1,
  'https://github.com/nvnrchmn',
  ''
WHERE NOT EXISTS (SELECT 1 FROM profile LIMIT 1);

INSERT IGNORE INTO seo_meta (id, path, title, description) VALUES
('sm-1', '/', 'Nova Nurachman — Full-stack Developer', 'Personal profile, proyek, dan pengalaman kerja Nova Nurachman.'),
('sm-2', '/projects', 'Proyek — Nova Nurachman', 'Kumpulan proyek yang pernah saya bangun.'),
('sm-3', '/experience', 'Pengalaman — Nova Nurachman', 'Riwayat pengalaman kerja dan proyek profesional.'),
('sm-4', '/skills', 'Keahlian — Nova Nurachman', 'Teknologi dan tools yang saya gunakan sehari-hari.'),
('sm-5', '/contact', 'Kontak — Nova Nurachman', 'Hubungi saya untuk kolaborasi atau pertanyaan.');
