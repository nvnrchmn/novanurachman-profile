#!/usr/bin/env bash
# Retention policy visitor_logs: agregasi harian dulu, lalu purge raw lama.
# Histori lifetime disimpan di visitor_stats_daily (abadi, ~365 baris/tahun).
# Konfigurasi: RETENTION_DAYS (default 90).
set -euo pipefail

BASE=/www/wwwroot/novanurachman.my.id
ENV_FILE="$BASE/backend/.env"
LOG="$BASE/scripts/cleanup-visitor-logs.log"
RETENTION_DAYS="${RETENTION_DAYS:-90}"

# Ambil kredensial DB dari .env backend (hanya kunci DB_*, tanpa source file penuh)
get_env() {
  grep "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true
}
DB_HOST=$(get_env DB_HOST);   DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=$(get_env DB_PORT);   DB_PORT=${DB_PORT:-3306}
DB_USER=$(get_env DB_USER);   DB_USER=${DB_USER:-root}
DB_PASS=$(get_env DB_PASSWORD)
DB_NAME=$(get_env DB_NAME);   DB_NAME=${DB_NAME:-nova_profile}

MYSQL=(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER")
[ -n "$DB_PASS" ] && MYSQL+=(-p"$DB_PASS")
MYSQL+=("$DB_NAME")

echo "$(date -Is) start retention=${RETENTION_DAYS}d" >> "$LOG"

# 1) Agregasi hari penuh di luar window retention → stats harian (idempotent via PK + NOT IN)
"${MYSQL[@]}" -e "
INSERT INTO visitor_stats_daily (stat_date, visits, unique_visitors)
SELECT DATE(created_at), COUNT(*), COUNT(DISTINCT ip_address)
FROM visitor_logs
WHERE created_at < DATE_SUB(CURDATE(), INTERVAL ${RETENTION_DAYS} DAY)
  AND DATE(created_at) NOT IN (SELECT stat_date FROM visitor_stats_daily)
GROUP BY DATE(created_at);" >> "$LOG" 2>&1

# 2) Purge raw lebih tua dari retention (loop LIMIT biar lock singkat)
for _ in $(seq 1 10); do
  DELETED=$("${MYSQL[@]}" -N -e "
    DELETE FROM visitor_logs
    WHERE created_at < NOW() - INTERVAL ${RETENTION_DAYS} DAY
    LIMIT 50000;
    SELECT ROW_COUNT();" 2>>"$LOG")
  [ "${DELETED:-0}" -lt 50000 ] && break
done

echo "$(date -Is) done, deleted=${DELETED:-0}" >> "$LOG"
