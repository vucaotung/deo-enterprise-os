# Brain Hub Setup Guide
**Version:** 1.2.0
**VPS:** 173.249.51.69
**File này hướng dẫn setup 2nd Brain từ đầu trên VPS**

---

## 1. Prerequisites

```bash
# Trên VPS, cần có:
- Ubuntu 20.04+
- Docker + Docker Compose
- Git
- Python 3.10+
- Node.js 18+
- rclone (cài bên dưới)
- Ít nhất 50GB disk trống
```

---

## 2. Cấu Trúc Thư Mục VPS

```bash
# Tạo thư mục data
sudo mkdir -p /opt/deo-brain/{vault,vector-store/chroma,sync/logs,exports}
sudo mkdir -p /opt/deo-data/{postgres,redis,uploads,backups/{daily,weekly,monthly},gdrive-mirror/DEO-OS,logs}

# Permissions
sudo chown -R $USER:$USER /opt/deo-brain
sudo chown -R $USER:$USER /opt/deo-data
```

---

## 3. Setup rclone + Google Drive

```bash
# Cài rclone
curl https://rclone.org/install.sh | sudo bash

# Config (interactive)
rclone config
# → Chọn: n (new remote)
# → Name: gdrive
# → Type: 18 (Google Drive)
# → Điền client_id, client_secret từ Google Console
# → Scope: 1 (full access)
# → Follow OAuth flow

# Test
rclone ls gdrive:DEO-OS/

# Tạo cron sync (15 phút)
# Thêm vào crontab:
# */15 * * * * rclone sync gdrive:DEO-OS /opt/deo-data/gdrive-mirror/DEO-OS --log-file=/opt/deo-data/logs/rclone.log
```

---

## 4. Setup Obsidian Vault trên VPS

```bash
# Khởi tạo vault
cd /opt/deo-brain/vault
git init
git remote add origin git@github.com:vucaotung/deo-brain-vault.git

# Tạo cấu trúc thư mục
mkdir -p 00-inbox 01-notes 02-projects 03-areas/{business,tech,finance,personal}
mkdir -p 04-resources/{clients,sops,vendors} 05-archive
mkdir -p 06-journal/2026 07-wiki/{business,tech,market}

# Tạo .obsidian config
mkdir -p .obsidian

# Index note
cat > _INDEX.md << 'EOF'
# Dẹo Enterprise OS — Brain Vault Index

## Quick Links
- [[00-inbox/_index|📥 Inbox]]
- [[06-journal/2026|📅 Journal 2026]]
- [[07-wiki/_index|📚 Wiki]]

## Areas
- [[03-areas/business/5balance-overview|🏢 5Balance]]
- [[03-areas/tech/deo-enterprise-os|⚙️ Dẹo OS]]
- [[03-areas/finance/_index|💰 Finance]]

## Recent
> Auto-updated bởi brain-sync script
EOF

git add .
git commit -m "init: vault structure"
git push -u origin main
```

---

## 5. Setup ChromaDB (Vector Store)

```yaml
# Thêm vào docker-compose.prod.yml:
chromadb:
  image: chromadb/chroma:latest
  restart: unless-stopped
  ports:
    - "8000:8000"
  volumes:
    - /opt/deo-brain/vector-store/chroma:/chroma/chroma
  environment:
    - CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER=chromadb.auth.token.TokenConfigServerAuthCredentialsProvider
    - CHROMA_SERVER_AUTH_PROVIDER=chromadb.auth.token.TokenAuthServerProvider
    - CHROMA_SERVER_AUTH_CREDENTIALS=${CHROMA_AUTH_TOKEN}
```

---

## 6. Sync Script

```bash
# /opt/deo-brain/sync/brain-sync.sh
#!/bin/bash
set -e

LOG=/opt/deo-brain/sync/logs/$(date +%Y-%m)/sync.log
mkdir -p $(dirname $LOG)

echo "[$(date)] Starting brain sync..." >> $LOG

# 1. Pull latest vault từ git
cd /opt/deo-brain/vault
git pull origin main >> $LOG 2>&1

# 2. Sync GDrive mirror
rclone sync gdrive:DEO-OS /opt/deo-data/gdrive-mirror/DEO-OS \
  --log-file=$LOG --log-level INFO

# 3. Trigger embed sync (nếu có notes mới)
python3 /opt/deo-brain/sync/embed-sync.py >> $LOG 2>&1

echo "[$(date)] Brain sync complete." >> $LOG
```

---

## 7. Obsidian Local — Plugin Setup

Trên máy local, cài Obsidian và config:

**Plugins cần thiết:**
- `obsidian-git` — Sync vault với VPS qua git
- `dataview` — Query notes như database
- `templater` — Templates cho notes
- `calendar` — Navigate daily notes

**Obsidian Git config:**
```
Remote: git@github.com:vucaotung/deo-brain-vault.git
Auto pull interval: 10 minutes
Auto push interval: 10 minutes  
```

---

## 8. Crontab đầy đủ trên VPS

```bash
crontab -e

# Thêm:
# GDrive sync - mỗi 15 phút
*/15 * * * * rclone sync gdrive:DEO-OS /opt/deo-data/gdrive-mirror/DEO-OS --log-file=/opt/deo-data/logs/rclone-$(date +\%Y-\%m).log

# Brain sync (vault + embed) - mỗi 5 phút
*/5 * * * * /opt/deo-brain/sync/brain-sync.sh

# DB Backup - mỗi ngày 2am
0 2 * * * /opt/deo-enterprise-os/scripts/backup.sh

# Daily note tạo mỗi sáng 6am
0 6 * * * curl -s -X POST http://localhost:3001/api/brain/daily-note -H "Authorization: Bearer $INTERNAL_TOKEN"

# Health check - mỗi 5 phút
*/5 * * * * /opt/deo-enterprise-os/scripts/health-check.sh
```

---

## 9. Kiểm Tra Hoàn Tất

```bash
# Kiểm tra rclone
rclone ls gdrive:DEO-OS/ | head -20

# Kiểm tra vault sync
ls /opt/deo-brain/vault/

# Kiểm tra ChromaDB
curl http://localhost:8000/api/v1/heartbeat

# Kiểm tra data dirs
du -sh /opt/deo-brain/
du -sh /opt/deo-data/
```

---

**Tài liệu liên quan:**
- `VERSION_1.2_PLAN.md` — Kế hoạch tổng thể
- `OBSIDIAN_GUIDE.md` — Cách dùng Obsidian vault hàng ngày
