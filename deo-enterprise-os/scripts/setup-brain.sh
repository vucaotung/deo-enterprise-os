#!/bin/bash
# ============================================================
# Dẹo Enterprise OS — Brain Hub Setup
# Chạy lần đầu để setup toàn bộ 2nd Brain trên VPS
# Usage: bash scripts/setup-brain.sh
# ============================================================
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step()    { echo -e "\n${CYAN}═══ $1 ═══${NC}"; }

# ─── Config ───────────────────────────────────────────────
APP_DIR="/opt/deo-enterprise-os"
BRAIN_DIR="/opt/deo-brain"
DATA_DIR="/opt/deo-data"
ENV_FILE="$APP_DIR/.env"

echo ""
echo -e "${CYAN}🧠 Dẹo Enterprise OS — Brain Hub Setup v1.2${NC}"
echo "════════════════════════════════════════════"
echo ""

# ─── Load .env ────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  error ".env not found at $ENV_FILE. Run deploy.sh first."
fi
set -a; source "$ENV_FILE"; set +a
info "Loaded .env from $ENV_FILE"

# ─────────────────────────────────────────────────────────
step "1. Create directory structure"
# ─────────────────────────────────────────────────────────

# Brain Hub
mkdir -p "$BRAIN_DIR"/{vault,vector-store/chroma,sync/logs,exports}
success "Brain Hub dirs: $BRAIN_DIR"

# Data dirs (nếu chưa có)
mkdir -p "$DATA_DIR"/{postgres,redis,uploads,logs}
mkdir -p "$DATA_DIR"/backups/{daily,weekly,monthly}
mkdir -p "$DATA_DIR"/gdrive-mirror/DEO-OS
success "Data dirs: $DATA_DIR"

# ─────────────────────────────────────────────────────────
step "2. Install rclone"
# ─────────────────────────────────────────────────────────

if command -v rclone &>/dev/null; then
  success "rclone already installed: $(rclone --version | head -1)"
else
  info "Installing rclone..."
  curl -fsSL https://rclone.org/install.sh | bash
  success "rclone installed: $(rclone --version | head -1)"
fi

# ─────────────────────────────────────────────────────────
step "3. Install Python dependencies for brain scripts"
# ─────────────────────────────────────────────────────────

if command -v python3 &>/dev/null; then
  PYTHON_VER=$(python3 --version)
  info "Python: $PYTHON_VER"
else
  info "Installing Python3..."
  apt-get install -y python3 python3-pip
fi

# Install packages cần cho embed-sync
pip3 install --quiet \
  chromadb \
  openai \
  python-frontmatter \
  pyyaml \
  requests \
  watchdog \
  2>/dev/null || warn "Some Python packages may have failed — check manually"
success "Python deps installed"

# ─────────────────────────────────────────────────────────
step "4. Setup Obsidian Vault"
# ─────────────────────────────────────────────────────────

VAULT="$BRAIN_DIR/vault"

if [ -d "$VAULT/.git" ]; then
  info "Vault git repo already exists — pulling latest..."
  cd "$VAULT" && git pull origin main 2>/dev/null || warn "Git pull failed — may be empty repo"
else
  info "Initializing vault..."
  cd "$VAULT"
  git init
  git config user.email "${GIT_EMAIL:-vucaotung@gmail.com}"
  git config user.name "${GIT_NAME:-Tung Vu Ca}"

  # Nếu có BRAIN_GIT_REPO thì add remote
  if [ -n "${BRAIN_GIT_REPO:-}" ]; then
    git remote add origin "$BRAIN_GIT_REPO"
    git pull origin main 2>/dev/null || info "Remote repo empty or unreachable — starting fresh"
  fi
fi

# Tạo cấu trúc thư mục vault
cd "$VAULT"
mkdir -p \
  00-inbox \
  01-notes \
  "02-projects/.templates" \
  "03-areas/business" \
  "03-areas/tech" \
  "03-areas/finance" \
  "03-areas/personal" \
  "04-resources/clients" \
  "04-resources/sops" \
  "04-resources/vendors" \
  05-archive \
  "06-journal/$(date +%Y)" \
  "07-wiki/business" \
  "07-wiki/tech" \
  "07-wiki/market" \
  .obsidian

# Tạo _INDEX.md nếu chưa có
if [ ! -f "_INDEX.md" ]; then
cat > "_INDEX.md" << 'MDEOF'
---
title: Brain Vault Index
type: resource
pinned: true
---

# 🧠 Dẹo Enterprise OS — Brain Vault

## Quick Access
- [[00-inbox/_capture-template|📥 New Capture]]
- [[06-journal/index|📅 Today's Journal]]
- [[07-wiki/index|📚 Wiki]]

## Areas
- [[03-areas/business/5balance-overview|🏢 5Balance]]
- [[03-areas/tech/deo-enterprise-os|⚙️ Dẹo OS]]
- [[03-areas/finance/index|💰 Finance]]

## Active Projects
> Query auto-updates via Dataview plugin

```dataview
TABLE status, gdrive FROM "02-projects"
WHERE status = "active"
SORT date DESC
```

---
*Vault managed by Dẹo Enterprise OS v1.2*
MDEOF
  success "Created _INDEX.md"
fi

# Tạo Obsidian app.json config cơ bản
if [ ! -f ".obsidian/app.json" ]; then
cat > ".obsidian/app.json" << 'JSONEOF'
{
  "legacyEditor": false,
  "livePreview": true,
  "defaultViewMode": "source",
  "strictLineBreaks": false,
  "smartIndentList": true,
  "newFileLocation": "folder",
  "newFileFolderPath": "00-inbox",
  "attachmentFolderPath": "04-resources/_attachments"
}
JSONEOF
  success "Created .obsidian/app.json"
fi

# Tạo daily note hôm nay
TODAY=$(date +%Y-%m-%d)
YEAR=$(date +%Y)
DAILY_PATH="06-journal/$YEAR/$TODAY.md"
if [ ! -f "$DAILY_PATH" ]; then
cat > "$DAILY_PATH" << MDEOF
---
title: "Daily $TODAY"
date: $TODAY
type: daily
tags: [journal]
---

## 🎯 Priorities
- [ ] 
- [ ] 

## 📋 Notes

## 📊 EOD Review
**Done:** 
**Tomorrow:** 
MDEOF
  success "Created today's daily note: $DAILY_PATH"
fi

# Tạo note gốc cho Dẹo OS area
if [ ! -f "03-areas/tech/deo-enterprise-os.md" ]; then
cat > "03-areas/tech/deo-enterprise-os.md" << 'MDEOF'
---
title: Dẹo Enterprise OS
type: area
status: active
tags: [tech, system, core]
gdrive: "DEO-OS/06_SYSTEM"
---

# Dẹo Enterprise OS

## Overview
Business management platform kết hợp AI + Human.
Version: 1.2.0
VPS: 173.249.51.69
Domain: dash.enterpriseos.bond

## Stack
- Backend: Express + TypeScript
- Frontend: React + Vite
- DB: PostgreSQL 16 + Redis 7
- Brain: Obsidian + ChromaDB + Google Drive

## Links
- [GitHub](https://github.com/vucaotung/deo-enterprise-os)
- [[03-areas/tech/agent-architecture|Agent Architecture]]
- [[04-resources/sops/agent-task-creation|SOP: Agent Tasks]]
MDEOF
  success "Created deo-enterprise-os.md area note"
fi

# Git commit vault state
cd "$VAULT"
git add -A
git commit -m "chore: brain hub setup $(date +%Y-%m-%d)" 2>/dev/null || true
if [ -n "${BRAIN_GIT_REPO:-}" ]; then
  git push origin main 2>/dev/null || warn "Could not push vault to remote — check SSH key"
fi
success "Vault ready at $VAULT"

# ─────────────────────────────────────────────────────────
step "5. Setup rclone Google Drive config"
# ─────────────────────────────────────────────────────────

RCLONE_CONF="$HOME/.config/rclone/rclone.conf"
mkdir -p "$(dirname "$RCLONE_CONF")"

if rclone listremotes 2>/dev/null | grep -q "^gdrive:"; then
  success "rclone 'gdrive' remote already configured"
else
  if [ -n "${GDRIVE_CLIENT_ID:-}" ] && [ -n "${GDRIVE_CLIENT_SECRET:-}" ] && [ -n "${GDRIVE_REFRESH_TOKEN:-}" ]; then
    info "Writing rclone gdrive config from .env..."
    cat >> "$RCLONE_CONF" << CONFEOF

[gdrive]
type = drive
client_id = ${GDRIVE_CLIENT_ID}
client_secret = ${GDRIVE_CLIENT_SECRET}
scope = drive
token = {"access_token":"","token_type":"Bearer","refresh_token":"${GDRIVE_REFRESH_TOKEN}","expiry":"2020-01-01T00:00:00Z"}
CONFEOF
    success "rclone gdrive remote configured"
  else
    warn "GDRIVE_CLIENT_ID / SECRET / REFRESH_TOKEN not set in .env"
    warn "Skipping rclone config — run 'rclone config' manually to add 'gdrive' remote"
    warn "Required keys in .env: GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN"
  fi
fi

# ─────────────────────────────────────────────────────────
step "6. Deploy sync scripts"
# ─────────────────────────────────────────────────────────

# Copy scripts từ repo
cp "$APP_DIR/scripts/brain-sync.sh"   "$BRAIN_DIR/sync/brain-sync.sh"
cp "$APP_DIR/scripts/embed-sync.py"   "$BRAIN_DIR/sync/embed-sync.py"
chmod +x "$BRAIN_DIR/sync/brain-sync.sh"
chmod +x "$BRAIN_DIR/sync/embed-sync.py"
success "Sync scripts deployed"

# ─────────────────────────────────────────────────────────
step "7. Setup crontab"
# ─────────────────────────────────────────────────────────

# Backup crontab hiện tại
crontab -l 2>/dev/null > /tmp/crontab_backup || true

# Kiểm tra xem đã có deo-brain cron chưa
if crontab -l 2>/dev/null | grep -q "deo-brain"; then
  warn "Brain cron jobs already set — skipping"
else
  info "Adding cron jobs..."
  (crontab -l 2>/dev/null; cat << 'CRONEOF'

# ── Dẹo Brain Hub ──────────────────────────────────────
# GDrive mirror sync - every 15 min
*/15 * * * * rclone sync gdrive:DEO-OS /opt/deo-data/gdrive-mirror/DEO-OS --log-file=/opt/deo-data/logs/rclone.log 2>&1

# Brain sync (vault git pull + embed) - every 5 min
*/5 * * * * /opt/deo-brain/sync/brain-sync.sh >> /opt/deo-brain/sync/logs/cron.log 2>&1

# Daily note - 6am every day
0 6 * * * curl -sf -X POST http://localhost:3001/api/brain/daily-note -H "Authorization: Bearer ${INTERNAL_TOKEN:-changeme}" >> /opt/deo-brain/sync/logs/daily-note.log 2>&1

# DB Backup - 2am every day (if not already set)
0 2 * * * /opt/deo-enterprise-os/scripts/backup.sh >> /opt/deo-data/logs/backup.log 2>&1
CRONEOF
  ) | crontab -
  success "Cron jobs added"
fi

# ─────────────────────────────────────────────────────────
step "8. Verify ChromaDB"
# ─────────────────────────────────────────────────────────

info "Checking ChromaDB service..."
if curl -sf http://localhost:8000/api/v1/heartbeat >/dev/null 2>&1; then
  success "ChromaDB is running"
else
  warn "ChromaDB not running — starting with docker compose..."
  cd "$APP_DIR"
  docker compose -f docker-compose.prod.yml up -d chromadb 2>/dev/null || \
    warn "ChromaDB start failed — check docker-compose.prod.yml"
  sleep 3
  if curl -sf http://localhost:8000/api/v1/heartbeat >/dev/null 2>&1; then
    success "ChromaDB started"
  else
    warn "ChromaDB still not responding — check logs: docker compose logs chromadb"
  fi
fi

# ─────────────────────────────────────────────────────────
step "9. Test GDrive sync"
# ─────────────────────────────────────────────────────────

if rclone listremotes 2>/dev/null | grep -q "^gdrive:"; then
  info "Testing GDrive connection..."
  if rclone lsd gdrive:DEO-OS/ --max-depth 1 2>/dev/null; then
    success "GDrive connection OK"
    info "Running initial sync..."
    rclone sync gdrive:DEO-OS/ "$DATA_DIR/gdrive-mirror/DEO-OS/" \
      --progress --log-file="$DATA_DIR/logs/rclone-initial.log" 2>&1 | tail -5
    success "Initial GDrive sync complete"
  else
    warn "Could not list gdrive:DEO-OS/ — folder may not exist yet"
    warn "Create 'DEO-OS' folder in your Google Drive root first"
  fi
else
  warn "No gdrive remote configured — skipping GDrive test"
fi

# ─────────────────────────────────────────────────────────
step "10. Summary"
# ─────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Brain Hub Setup Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "📁 Brain Hub:      $BRAIN_DIR"
echo "   ├── vault/      Obsidian vault (git)"
echo "   ├── vector-store/ ChromaDB data"
echo "   └── sync/       Sync scripts + logs"
echo ""
echo "📁 Data:           $DATA_DIR"
echo "   ├── gdrive-mirror/ GDrive local mirror"
echo "   ├── uploads/    File uploads"
echo "   └── backups/    DB backups"
echo ""
echo "🔄 Cron Jobs:"
echo "   • GDrive sync:  every 15 min"
echo "   • Brain sync:   every 5 min"
echo "   • Daily note:   6am daily"
echo "   • DB backup:    2am daily"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"

if ! rclone listremotes 2>/dev/null | grep -q "^gdrive:"; then
  echo -e "  ${RED}1.${NC} Configure Google Drive:"
  echo "     • Add to .env: GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN"
  echo "     • Or run: rclone config  (add remote named 'gdrive')"
  echo "     • Create folder 'DEO-OS' in Google Drive root"
  echo ""
fi

if [ -z "${BRAIN_GIT_REPO:-}" ]; then
  echo -e "  ${YELLOW}2.${NC} Setup vault git remote (optional but recommended):"
  echo "     • Create private repo: github.com/vucaotung/deo-brain-vault"
  echo "     • Add to .env: BRAIN_GIT_REPO=git@github.com:vucaotung/deo-brain-vault.git"
  echo "     • Setup SSH key on VPS for GitHub"
  echo ""
fi

echo -e "  ${GREEN}3.${NC} Open Obsidian locally:"
echo "     • Install Obsidian: https://obsidian.md"
echo "     • Clone vault repo or sync via rclone"
echo "     • Install plugins: obsidian-git, dataview, templater"
echo ""
echo -e "  ${GREEN}4.${NC} Test capture:"
echo "     curl -X POST http://localhost:3001/api/brain/capture \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -H 'Authorization: Bearer \$JWT_TOKEN' \\"
echo "       -d '{\"content\": \"Test capture\", \"tags\": [\"test\"]}'"
echo ""
