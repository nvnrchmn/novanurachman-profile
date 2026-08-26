USE nova_profile;

INSERT IGNORE INTO experiences
  (id, role, company, location, employment, start_date, end_date, is_current, description, order_no) VALUES
('ex-1', 'Full-stack Developer', 'Logika Kreatif Indonesia', 'Jakarta', 'Founder',
 'Jan 2025', '', 1,
 'Membangun dan mengelola produk web end-to-end: arsitektur backend Go, frontend React, pipeline CI/CD, hingga operasional server dan optimasi performa.', 1),

('ex-2', 'Web Developer', 'Freelance', 'Remote', 'Freelance',
 'Jan 2023', 'Dec 2024', 0,
 'Mengerjakan proyek website korporat dan aplikasi internal untuk berbagai klien, mulai dari perancangan database sampai deployment.', 2);

INSERT IGNORE INTO skills (id, name, category, level, order_no) VALUES
('sk-1',  'Go',            'Backend',        'Advanced',     1),
('sk-2',  'Fiber',         'Backend',        'Advanced',     2),
('sk-3',  'MySQL',         'Database',       'Advanced',     3),
('sk-4',  'PostgreSQL',    'Database',       'Intermediate', 4),
('sk-5',  'React',         'Frontend',       'Advanced',     5),
('sk-6',  'TypeScript',    'Frontend',       'Advanced',     6),
('sk-7',  'Tailwind CSS',  'Frontend',       'Advanced',     7),
('sk-8',  'React Native',  'Mobile',         'Intermediate', 8),
('sk-9',  'Expo',          'Mobile',         'Intermediate', 9),
('sk-10', 'Linux / VPS',   'Infrastructure', 'Advanced',     10),
('sk-11', 'nginx',         'Infrastructure', 'Advanced',     11),
('sk-12', 'Docker',        'Infrastructure', 'Intermediate', 12),
('sk-13', 'GitHub Actions','Infrastructure', 'Advanced',     13),
('sk-14', 'Git',           'Tools',          'Advanced',     14);
