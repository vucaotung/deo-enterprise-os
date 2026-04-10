#!/bin/bash
# ============================================================
# Dẹo Enterprise OS — Health Check
# ============================================================
set -euo pipefail

echo "🏥 Dẹo OS Health Check"
echo "================================================"

# Docker containers
echo "🐳 Containers:"
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "   docker-compose not running"

echo ""

# API
echo "🔌 API:"
API_RESPONSE=$(curl -sf http://localhost:3001/api/health 2>/dev/null || echo "UNREACHABLE")
echo "   Status: $API_RESPONSE"

# Database
echo "💾 Database:"
DB_STATUS=$(docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U deo 2>/dev/null && echo "READY" || echo "NOT READY")
echo "   Status: $DB_STATUS"

# Redis
echo "📦 Redis:"
REDIS_STATUS=$(docker compose -f docker-compose.prod.yml exec -T redis redis-cli ping 2>/dev/null || echo "NOT READY")
echo "   Status: $REDIS_STATUS"

# ChromaDB (Brain vector store)
echo "🧠 ChromaDB:"
CHROMA_STATUS=$(curl -sf http://localhost:8000/api/v1/heartbeat 2>/dev/null && echo "RUNNING" || echo "NOT RUNNING")
echo "   Status: $CHROMA_STATUS"

# Brain sync (last run)
echo "🔄 Brain Sync:"
SYNC_LOG=$(ls -t /opt/deo-brain/sync/logs/$(date +%Y-%m)/brain-sync.log 2>/dev/null | head -1)
if [ -n "$SYNC_LOG" ]; then
  LAST_SYNC=$(tail -1 "$SYNC_LOG" 2>/dev/null | cut -d']' -f1 | tr -d '[')
  echo "   Last sync: ${LAST_SYNC:-unknown}"
else
  echo "   Last sync: no log found"
fi

# GDrive mirror
echo "📁 GDrive Mirror:"
GDRIVE_FILES=$(find /opt/deo-data/gdrive-mirror/DEO-OS -type f 2>/dev/null | wc -l)
echo "   Files mirrored: $GDRIVE_FILES"

# Vault
echo "📓 Obsidian Vault:"
VAULT_NOTES=$(find /opt/deo-brain/vault -name "*.md" 2>/dev/null | wc -l)
echo "   Notes: $VAULT_NOTES"

# Disk
echo "💿 Disk:"
df -h / | tail -1 | awk '{print "   Used: " $3 "/" $2 " (" $5 ")"}'
echo "   Brain Hub: $(du -sh /opt/deo-brain 2>/dev/null | cut -f1)"
echo "   Data Dir:  $(du -sh /opt/deo-data  2>/dev/null | cut -f1)"

# Memory
echo "🧠 Memory:"
free -h | grep Mem | awk '{print "   Used: " $3 "/" $2}'

echo "================================================"
