# Version

## Architecture Version: v3.1.0 — Agents Live
**Date:** April 22, 2026
**Status:** 13 agents deployed on GoClaw. Context files uploaded. n8n cron active. Hooks plan ready.
- 13 agents fully configured + context files (8 files/agent)
- Channel strategy finalized: Telegram (deo, it-dev, researcher) / Zalo (business agents)
- n8n cron: dream-agent daily-reflection running
- Agent Hooks plan documented (5 hooks)
- Previous: `docs/ENTERPRISE_HUMAN_AI_HYBRID_OS_PLAN_v3_GOCLAW.md`

---

## App Version: 1.2.0-dev
**Branch:** main
**Date:** April 2026
**Status:** In Development — Sprint 1 (Infrastructure)

---

## Changelog Summary

### v3.0.0 — Architecture (2026-04-21)
- GoClaw agent layer + 11 agents registry
- van-phong-agent: DOCX/XLSX/PPTX/PDF specialist
- 12 ADRs: auth, schema, multi-tenancy, testing, deployment
- Cron: 11 scheduled jobs (Asia/Ho_Chi_Minh)

### v1.2.0-dev (current app)
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

| Version | Focus | Status |
|---|---|---|
| 1.0.0 | Core API + Dashboard + Agents | ✅ Done |
| 1.2.0 | 2nd Brain: GDrive + Obsidian + RAG | 🚧 In Dev |
| v3.0.0 | Architecture: GoClaw + Agents + ADRs | ✅ Documented |
| v3.1.0 | Agents Live + Hooks Plan | ✅ Done |
| v3.2.0 | Hooks Implementation + EOS API Bridge | 🔜 Next |
