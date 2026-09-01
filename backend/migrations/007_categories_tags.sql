-- 007_categories_tags.sql — categories + tags tables + posts.category_id + M:N post_tags
-- Run: sudo -n mysql nova_profile < backend/migrations/007_categories_tags.sql

CREATE TABLE IF NOT EXISTS categories (
  id varchar(64) PRIMARY KEY,
  name_en varchar(100) NOT NULL,
  name_id varchar(100) NOT NULL,
  slug varchar(120) NOT NULL UNIQUE,
  description_en text,
  description_id text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at timestamp NULL,
  INDEX idx_categories_slug (slug),
  INDEX idx_categories_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
  id varchar(64) PRIMARY KEY,
  name varchar(80) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  color varchar(7) DEFAULT '#4ADE80',
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at timestamp NULL,
  INDEX idx_tags_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Junction table for posts <-> tags (many-to-many)
CREATE TABLE IF NOT EXISTS post_tags (
  post_id varchar(64) NOT NULL,
  tag_id varchar(64) NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  INDEX idx_post_tags_tag (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add category_id to posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS category_id varchar(64) NULL AFTER cover_image,
  ADD COLUMN IF NOT EXISTS view_count int NOT NULL DEFAULT 0 AFTER published_at,
  ADD INDEX IF NOT EXISTS idx_posts_category (category_id),
  ADD INDEX IF NOT EXISTS idx_posts_published_cat (is_published, published_at, category_id);

-- Seed default categories
INSERT IGNORE INTO categories (id, name_en, name_id, slug, description_en, description_id, sort_order) VALUES
  ('cat-1', 'Technology', 'Teknologi', 'technology', 'Software, hardware, and tech tutorials', 'Software, hardware, dan tutorial teknologi', 10),
  ('cat-2', 'Career', 'Karir', 'career', 'Career advice, interviews, and professional growth', 'Tips karir, wawancara, dan pengembangan profesional', 20),
  ('cat-3', 'Projects', 'Proyek', 'projects', 'Showcase and case studies of personal projects', 'Showcase dan studi kasus proyek pribadi', 30),
  ('cat-4', 'Thoughts', 'Pikiran', 'thoughts', 'Personal reflections and opinions', 'Refleksi dan opini pribadi', 40);

-- Seed some tags
INSERT IGNORE INTO tags (id, name, slug, color) VALUES
  ('tag-1', 'Go', 'go', '#00ADD8'),
  ('tag-2', 'React', 'react', '#61DAFB'),
  ('tag-3', 'TypeScript', 'typescript', '#3178C6'),
  ('tag-4', 'Fiber', 'fiber', '#00ADD8'),
  ('tag-5', 'Tailwind', 'tailwind', '#06B6D4'),
  ('tag-6', 'MySQL', 'mysql', '#4479A1'),
  ('tag-7', 'Docker', 'docker', '#2496ED'),
  ('tag-8', 'CI/CD', 'ci-cd', '#8B5CF6'),
  ('tag-9', 'DevOps', 'devops', '#F59E0B'),
  ('tag-10', 'AI', 'ai', '#EC4899');