#!/bin/bash
# ============================================================
# Dẹo Brain Hub — Sync Script
# Chạy mỗi 5 phút qua cron
# Thực hiện: vault git pull → embed sync
# ============================================================
set -euo pipefail

BRAIN_DIR="/opt/deo-brain"
DATA_DIR="/opt/deo-data"
APP_DIR="/opt/deo-enterprise-os"
LOG_DIR="$BRAIN_DIR/sync/logs/$(date +%Y-%m)"
LOG_FILE="$LOG_DIR/brain-sync.log"
ENV_FILE="$APP_DIR/.env"

mkdir -p "$LOG_DIR"

ts() { date '+%Y-%m-%d %H:%M:%S'; }

log()  { echo "[$(ts)] $1" >> "$LOG_FILE"; }
logn() { echo "[$(ts)] $1"; echo "[$(ts)] $1" >> "$LOG_FILE"; }

log "──────────────────────────────────"
log "Brain sync started"

# Load env
[ -f "$ENV_FILE" ] && { set -a; source "$ENV_FILE"; set +a; }

ERRORS=0

# ─── 1. Git pull vault ────────────────────────────────────
VAULT="$BRAIN_DIR/vault"
if [ -d "$VAULT/.git" ] && [ -n "${BRAIN_GIT_REPO:-}" ]; then
  cd "$VAULT"
  if git pull origin main >> "$LOG_FILE" 2>&1; then
    log "✓ Vault git pull OK"
  else
    log "✗ Vault git pull failed"
    ERRORS=$((ERRORS + 1))
  fi
else
  log "~ Vault git pull skipped (no remote configured)"
fi

# ─── 2. Trigger embed sync (Python) ──────────────────────
EMBED_SCRIPT="$BRAIN_DIR/sync/embed-sync.py"
if [ -f "$EMBED_SCRIPT" ]; then
  if python3 "$EMBED_SCRIPT" --quick >> "$LOG_FILE" 2>&1; then
    log "✓ Embed sync OK"
  else
    log "✗ Embed sync failed (non-fatal)"
    # Not incrementing ERRORS — embed failure shouldn't block sync
  fi
else
  log "~ Embed sync skipped (script not found)"
fi

# ─── 3. Process brain captures ────────────────────────────
# Notify API to process pending captures
if curl -sf -X POST \
    "http://localhost:3001/api/brain/process-captures" \
    -H "Authorization: Bearer ${INTERNAL_TOKEN:-}" \
    -H "Content-Type: application/json" \
    >> "$LOG_FILE" 2>&1; then
  log "✓ Capture processing triggered"
else
  log "~ Capture processing skipped (API may be down)"
fi

# ─── Done ─────────────────────────────────────────────────
if [ $ERRORS -eq 0 ]; then
  log "Brain sync completed OK"
else
  log "Brain sync completed with $ERRORS error(s)"
fi

# Rotate logs: keep last 30 days per month folder
find "$BRAIN_DIR/sync/logs" -name "*.log" -mtime +30 -delete 2>/dev/null || true
