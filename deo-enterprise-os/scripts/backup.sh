#!/bin/bash
# ============================================================
# Dẹo Enterprise OS — Database Backup Script
# Usage: ./scripts/backup.sh
# Crontab: 0 2 * * * /opt/deo-enterprise-os/scripts/backup.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

source .env

BACKUP_DIR="/opt/deo-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/deo_os_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "💾 Backing up database..."
docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U "${POSTGRES_USER:-deo}" -d "${POSTGRES_DB:-deo_os}" --clean --if-exists \
    | gzip > "$BACKUP_FILE"

echo "✅ Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "deo_os_*.sql.gz" -mtime +30 -delete
echo "🧹 Old backups cleaned (keeping 30 days)"
