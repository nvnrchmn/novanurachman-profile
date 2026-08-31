-- Blog module: posts + SEO meta for the blog routes
USE nova_profile;

CREATE TABLE IF NOT EXISTS posts (
  id           VARCHAR(64)   NOT NULL PRIMARY KEY,
  slug         VARCHAR(191)  NOT NULL UNIQUE,
  title_en     VARCHAR(255)  NOT NULL,
  title_id     VARCHAR(255)  NULL,
  excerpt_en   TEXT          NULL,
  excerpt_id   TEXT          NULL,
  content_en   LONGTEXT      NULL,  -- markdown
  content_id   LONGTEXT      NULL,  -- markdown
  cover_image  VARCHAR(255)  NULL,
  tags         VARCHAR(500)  NULL,  -- comma separated
  is_published TINYINT(1)    NOT NULL DEFAULT 1,
  published_at TIMESTAMP     NULL DEFAULT NULL, -- NULL = live once published
  created_at   TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP     NULL DEFAULT NULL,
  INDEX idx_posts_pub (is_published, deleted_at, published_at)
) ENGINE=InnoDB;

-- Blog routes' SEO meta (en + id). Ids sm-11/sm-12: sm-6..sm-10 were already
-- taken by the bilingual rows of earlier routes.
INSERT INTO seo_meta (id, path, lang, title, description, og_image)
SELECT 'sm-11', '/blog', 'en',
       'Blog — Nova Nurachman',
       'Notes on web development, infrastructure, and what I build.',
       '/og-image.jpg'
WHERE NOT EXISTS (SELECT 1 FROM seo_meta WHERE path = '/blog' AND lang = 'en');

INSERT INTO seo_meta (id, path, lang, title, description, og_image)
SELECT 'sm-12', '/blog', 'id',
       'Blog — Nova Nurachman',
       'Tulisan tentang pengembangan web, infrastruktur, dan pengalaman teknis.',
       '/og-image.jpg'
WHERE NOT EXISTS (SELECT 1 FROM seo_meta WHERE path = '/blog' AND lang = 'id');

-- Sample post so the blog is alive from day one and proves the pipeline end to end.
INSERT INTO posts (id, slug, title_en, title_id, excerpt_en, excerpt_id,
                   content_en, content_id, tags, is_published, published_at)
SELECT 'po-demo', 'how-this-site-is-built',
  'How this site is built',
  'Bagaimana situs ini dibangun',
  'A tour of the stack behind novanurachman.my.id: Go Fiber, React, MySQL, and a CMS that edits the database directly — no rebuilds, no redeploys.',
  'Perjalanan stack di balik novanurachman.my.id: Go Fiber, React, MySQL, dan CMS yang mengedit database langsung — tanpa rebuild, tanpa deploy ulang.',
  '## Stack

The site runs on a small, boring stack on purpose:

- **Backend** — Go + Fiber v2, one binary, zero frameworks beyond Fiber itself.
- **Frontend** — React 18 + Vite + TypeScript + Tailwind, a single-page app.
- **Database** — MySQL, read at request time by the backend.
- **Deploy** — GitHub Actions builds both halves in CI, then rsyncs the artifacts to the VPS. Nothing is ever built on the server.

## CMS first

Every section — profile, projects, experience, skills — is editable from an admin panel. The admin writes to the database, and the public site reads from the database on every request, so an edit is live the moment you hit Save. No rebuild, no redeploy.

## Multi-language

Content is stored per-language (`title_en` / `title_id`, `content_en` / `content_id`). The backend picks the right column from a `?lang=` query parameter, and the frontend language switcher drives it.

## What was added recently

Visitor counter with per-page logs, a service worker for offline support, CSRF protection on the contact form, and rate limiting. All of it ships through the same CI pipeline.

```bash
git push origin main   # CI builds and deploys
```

If you are reading this on the live site, the whole pipeline worked end to end.',
  '## Stack

Situs ini sengaja dibangun di atas stack yang sederhana:

- **Backend** — Go + Fiber v2, satu binary, tanpa framework tambahan selain Fiber.
- **Frontend** — React 18 + Vite + TypeScript + Tailwind, single-page app.
- **Database** — MySQL, dibaca setiap request oleh backend.
- **Deploy** — GitHub Actions membangun kedua bagian di CI, lalu rsync ke VPS. Tidak ada yang di-build di server.

## CMS first

Setiap section — profil, proyek, pengalaman, keahlian — bisa diedit dari panel admin. Admin menulis ke database, dan situs publik membaca dari database setiap request, jadi edit langsung tampil begitu tombol Save ditekan. Tanpa rebuild, tanpa deploy ulang.

## Multi-bahasa

Konten disimpan per bahasa (`title_en` / `title_id`, `content_en` / `content_id`). Backend memilih kolom yang tepat dari parameter `?lang=`, dan language switcher di frontend yang mengendalikannya.

## Yang baru ditambahkan

Visitor counter dengan log per halaman, service worker untuk dukungan offline, proteksi CSRF di form kontak, dan rate limiting. Semuanya dikirim lewat pipeline CI yang sama.

```bash
git push origin main   # CI membangun dan deploy
```

Kalau Anda membaca ini di situs live, seluruh pipeline bekerja end to end.',
  'Go, React, DevOps, CMS', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM posts WHERE slug = 'how-this-site-is-built');
