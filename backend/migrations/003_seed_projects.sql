USE nova_profile;

INSERT IGNORE INTO projects
  (id, title, slug, summary, description, tech_stack, live_url, year, featured, order_no) VALUES
('pj-1', 'Livine Urban Manajemen', 'livine-urban-manajemen',
 'Website korporat untuk perusahaan pengelola properti, lengkap dengan CMS.',
 'Situs korporat dengan CMS penuh: hero dinamis, blog, portofolio proyek, galeri, dan FAQ. Backend Go Fiber dengan SPA meta injection untuk SEO, sitemap dinamis, dan optimasi performa (WebP, code splitting, cache header).',
 'Go, Fiber, React, TypeScript, Tailwind, MySQL', 'https://livinemanajemen.com', '2026', 1, 1),

('pj-2', 'Logika Kreatif Indonesia', 'logika-kreatif-indonesia',
 'Platform software house: manajemen proyek, invoice, dan pembayaran.',
 'Aplikasi bisnis untuk software house solo: pipeline proyek, order, invoice dengan pengingat otomatis, integrasi payment gateway, dan portal klien multi-tenant.',
 'Go, Fiber, React, MySQL, iPaymu', 'https://logikraf.id', '2026', 1, 2),

('pj-3', 'Lemburin', 'lemburin',
 'Aplikasi pencatat lembur pribadi sesuai PP 35/2021 — web dan Android.',
 'Aplikasi lintas platform dari satu basis kode Expo. Karyawan mencatat lembur pribadi, aplikasi menghitung upah sesuai regulasi, lalu membandingkannya dengan perhitungan perusahaan untuk menemukan selisih. Mendukung mode offline dan sinkronisasi.',
 'React Native, Expo, TypeScript, Supabase', 'https://lemburin.logikraf.id', '2026', 1, 3),

('pj-4', 'Smarthub', 'smarthub',
 'Portal layanan digital dengan dashboard klien.',
 'Portal untuk mengelola layanan digital: katalog layanan, pemesanan, tiket dukungan, dan dashboard klien.',
 'Go, Gin, React, MySQL', 'https://smarthub.logikraf.id', '2026', 0, 4);
