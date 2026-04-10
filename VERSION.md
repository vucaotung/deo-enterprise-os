# Version

## Current: 1.2.0-dev
**Branch:** main
**Date:** April 2026
**Status:** In Development — Sprint 1 (Infrastructure)

---

## Changelog Summary

### v1.2.0-dev (current)
- Infrastructure: Google Drive + VPS Brain Hub + Obsidian Vault
- New: `scripts/setup-brain.sh` — automated brain hub setup
- New: `scripts/brain-sync.sh` — vault git sync + embed trigger (cron every 5m)
- New: `scripts/embed-sync.py` — Obsidian vault → ChromaDB vector store
- New: `infrastructure/postgres/007_brain_gdrive.sql` — brain tables
- New: `infrastructure/brain/` — ChromaDB config, Obsidian templates
- Updated: `docker-compose.prod.yml` — ChromaDB service added
- Updated: `.env.example` — brain, gdrive, openai, chroma vars
- Updated: `scripts/health-check.sh` — brain services monitoring
- Docs: `docs/VERSION_1.2_PLAN.md`, `docs/BRAIN_SETUP.md`, `docs/OBSIDIAN_GUIDE.md`

### v1.0.0 — April 3, 2026
- Initial production release
- Backend API: Express.js + TypeScript (80 endpoints)
- Frontend: React + Vite + TailwindCSS (9 pages)
- Database: PostgreSQL 16 (23+ tables)
- Docker + Cloudflare Tunnel

---

## Roadmap

| Version | Focus                              | Status        |
|---------|------------------------------------|---------------|
| 1.0.0   | Core API + Dashboard + Agents      | ✅ Done       |
| 1.2.0   | 2nd Brain: GDrive + Obsidian + RAG | 🚧 In Dev     |
| 1.3.0   | Telegram bot full sync             | 📋 Planned    |
| 1.4.0   | n8n automation workflows           | 📋 Planned    |
| 2.0.0   | Mobile app (React Native)          | 🔮 Future     |
