-- Schema for novanurachman.my.id personal profile site
-- MVP modules: Profile, Projects, Experience, Skills, Contact

CREATE DATABASE IF NOT EXISTS nova_profile
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE nova_profile;

-- Admin users (single user in practice, but table keeps auth generic)
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(64)  NOT NULL PRIMARY KEY,
  email         VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(191) NOT NULL,
  created_at    TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Single-row profile (hero / about content)
CREATE TABLE IF NOT EXISTS profile (
  id           VARCHAR(64)  NOT NULL PRIMARY KEY,
  name         VARCHAR(191) NOT NULL,
  headline     VARCHAR(255) NULL,
  tagline      VARCHAR(255) NULL,
  bio          TEXT         NULL,
  avatar       VARCHAR(255) NULL,
  location     VARCHAR(191) NULL,
  email        VARCHAR(191) NULL,
  phone        VARCHAR(64)  NULL,
  resume_url   VARCHAR(255) NULL,
  available    TINYINT(1)   NOT NULL DEFAULT 1,
  github_url   VARCHAR(255) NULL,
  linkedin_url VARCHAR(255) NULL,
  x_url        VARCHAR(255) NULL,
  website_url  VARCHAR(255) NULL,
  created_at   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS projects (
  id           VARCHAR(64)  NOT NULL PRIMARY KEY,
  title        VARCHAR(191) NOT NULL,
  slug         VARCHAR(191) NOT NULL UNIQUE,
  summary      VARCHAR(500) NULL,
  description  TEXT         NULL,
  cover_image  VARCHAR(255) NULL,
  tech_stack   VARCHAR(500) NULL,   -- comma separated
  repo_url     VARCHAR(255) NULL,
  live_url     VARCHAR(255) NULL,
  year         VARCHAR(16)  NULL,
  featured     TINYINT(1)   NOT NULL DEFAULT 0,
  order_no     INT          NOT NULL DEFAULT 0,
  is_published TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_projects_pub (is_published, deleted_at, order_no)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS experiences (
  id           VARCHAR(64)  NOT NULL PRIMARY KEY,
  role         VARCHAR(191) NOT NULL,
  company      VARCHAR(191) NOT NULL,
  company_url  VARCHAR(255) NULL,
  location     VARCHAR(191) NULL,
  employment   VARCHAR(64)  NULL,   -- Full-time / Freelance / Contract
  start_date   VARCHAR(32)  NULL,   -- free text, e.g. "Jan 2023"
  end_date     VARCHAR(32)  NULL,   -- NULL/empty = present
  is_current   TINYINT(1)   NOT NULL DEFAULT 0,
  description  TEXT         NULL,
  order_no     INT          NOT NULL DEFAULT 0,
  is_published TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_exp_pub (is_published, deleted_at, order_no)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skills (
  id           VARCHAR(64)  NOT NULL PRIMARY KEY,
  name         VARCHAR(191) NOT NULL,
  category     VARCHAR(96)  NOT NULL DEFAULT 'Other',
  level        VARCHAR(32)  NULL,   -- Beginner / Intermediate / Advanced
  icon         VARCHAR(96)  NULL,
  order_no     INT          NOT NULL DEFAULT 0,
  is_published TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP    NULL DEFAULT NULL,
  INDEX idx_skills_pub (is_published, deleted_at, category, order_no)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contacts (
  id         VARCHAR(64)  NOT NULL PRIMARY KEY,
  name       VARCHAR(191) NOT NULL,
  email      VARCHAR(191) NOT NULL,
  subject    VARCHAR(255) NULL,
  message    TEXT         NOT NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  ip_address VARCHAR(64)  NULL,
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contacts_read (is_read, created_at)
) ENGINE=InnoDB;

-- Per-route SEO meta, consumed by the Go meta-injection handler
CREATE TABLE IF NOT EXISTS seo_meta (
  id           VARCHAR(64)  NOT NULL PRIMARY KEY,
  path         VARCHAR(191) NOT NULL UNIQUE,
  title        VARCHAR(255) NULL,
  description  VARCHAR(500) NULL,
  og_image     VARCHAR(255) NULL,
  created_at   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  id         VARCHAR(64)  NOT NULL PRIMARY KEY,
  `key`      VARCHAR(191) NOT NULL UNIQUE,
  value      TEXT         NULL,
  created_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
