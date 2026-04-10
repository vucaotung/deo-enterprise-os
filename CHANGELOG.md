# CHANGELOG

## [1.2.0] — Planned (May 2026)

### 🧠 2nd Brain Integration
- **Google Drive** làm primary file storage với cấu trúc folder chuẩn
- **VPS Brain Hub** tại `/opt/deo-brain/` — trung tâm xử lý knowledge
- **Obsidian Vault** sync với VPS qua git, local sync tự động
- **ChromaDB** vector store cho RAG queries
- **rclone** sync GDrive ↔ VPS mirror tự động mỗi 15 phút

### New Features
- `POST /api/brain/capture` — Capture note vào Obsidian inbox
- `GET /api/brain/search` — Semantic search qua RAG
- `GET /api/storage/files` — Browse GDrive files qua API
- `POST /api/storage/upload` — Upload trực tiếp lên GDrive
- Daily note tự động tạo lúc 6am mỗi ngày
- Agent context tự động enriched với brain data

### Database
- Migration 006: `brain_notes`, `brain_chunks`, `gdrive_files`, `sync_log`

### Infrastructure
- `/opt/deo-brain/` — Brain Hub directory structure
- `/opt/deo-data/` — Persistent data directory
- ChromaDB service trong docker-compose
- Cron jobs: gdrive sync, vault sync, embed sync, daily note

### Docs
- `docs/BRAIN_SETUP.md` — Setup guide cho 2nd brain
- `docs/OBSIDIAN_GUIDE.md` — Hướng dẫn dùng Obsidian hàng ngày
- `docs/GDRIVE_STRUCTURE.md` — Cấu trúc Google Drive

---

## [1.0.0] — April 3, 2026

### Initial Production Release
- Backend API: Express.js + TypeScript (80 endpoints)
- Frontend: React + Vite + TailwindCSS (9 trang)
- Database: PostgreSQL 16 (23+ tables)
- Cache: Redis 7
- Agent orchestration: task queue + worker daemon
- Real-time: WebSocket via Socket.io
- Docker containerization
- Cloudflare Tunnel deployment
