-- 008_visitor_stats_daily.sql
-- Agregasi harian visitor_logs sebelum raw lama dihapus oleh retention policy.
-- Menjaga histori lifetime (total_views/total_visitors) tetap akurat setelah raw > 90 hari dipurge.
CREATE TABLE IF NOT EXISTS visitor_stats_daily (
  stat_date        DATE      NOT NULL PRIMARY KEY,
  visits           INT       NOT NULL DEFAULT 0,
  unique_visitors  INT       NOT NULL DEFAULT 0,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
