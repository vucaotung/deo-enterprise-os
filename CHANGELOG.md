# CHANGELOG

## [4.0.0-plan] — 2026-05-05 (PLAN ONLY)

### 🎯 Strategic Pivot — Fork Paperclip + OpenClaw Upstream

Chuyển từ "build từ đầu" (plan v3 GoClaw) sang "fork + extend" để tiết kiệm 50-60% engineering effort.

#### Decision
- ❌ **DROP GoClaw fork** — quay lại OpenClaw upstream
- ✅ **Fork [paperclipai/paperclip](https://github.com/paperclipai/paperclip) (MIT)** làm orchestration core (UI + governance + budget + audit + multi-tenancy + scheduler)
- ✅ **OpenClaw upstream** làm agent runtime (multi-provider per-agent + native VN channels + memory engines + dreaming)
- ✅ **n8n** thu hẹp về workflow tĩnh (ETL không-AI)
- ✅ **VPS Docker** production, local Docker dev qua `pnpm smoke:openclaw-docker-ui`

#### Key findings từ docs research

**Paperclip native (0 code):** identity/login UI, multi-tenant Company, Issues board (Jira-like), Routines (cron + webhook), Approvals UI, Budget tracking dashboard, Activity Log, Skills library, Org Chart, Export/Import companies, Workspaces, Secrets UI.

**OpenClaw native (0 code):** Telegram + Zalo (cả Marketplace bot + Zalo personal) + WhatsApp + 20+ channels bundled plugins, multi-provider per-agent (Anthropic/OpenAI/Google/Codex/OpenCode/GLM/MiniMax/Qwen/local CLI), API key rotation, model failover chain với cooldown exponential, 4 memory engines (builtin/QMD/Honcho/LanceDB), 3-phase dreaming (Light/Deep/REM), per-agent isolated workspace + auth profile + sessions, SOUL.md/AGENTS.md/USER.md.

**Drift prevention rule**: Paperclip = single source of truth cho schedule. OpenClaw automation (cron/standing-orders/taskflow/background-tasks) **TẮT HẾT**. Hooks giữ cho channel inbound. Mọi heartbeat có `runId` Paperclip generate.

#### Effort estimate
- Plan v3 GoClaw: **5-7 tháng**
- Plan v4 Paperclip+OpenClaw: **3.5-5 tháng** (~50-60% saving)
- Sprint 1 tuần (P0' + P1' + P2' rút gọn): MVP working bot Telegram/Zalo + multi-provider agents

#### Docs added
- `docs/ENTERPRISE_HUMAN_AI_HYBRID_OS_PLAN_v4_PAPERCLIP_OPENCLAW.md` — Plan đầy đủ 933 dòng:
  - Paperclip out-of-box features (90% Phase 0 không cần code)
  - OpenClaw capabilities confirmed (multi-provider, channels, memory, dreaming)
  - Re-balance trách nhiệm Paperclip ↔ OpenClaw
  - Architecture diagram (VPS Docker 7-service stack)
  - Heartbeat/cron drift prevention quy tắc + verification
  - Phased plan 9 phases với estimate
  - Migration v0.2.3 → v4
  - 15 Open Questions cho product/dev decision
- `docs/V4_1_WEEK_SPRINT_CHECKLIST.md` — Sprint MVP 7 ngày:
  - Day 1: Fork & Bootstrap
  - Day 2: OpenClaw Multi-Agent Setup
  - Day 3: Channels Native (Telegram + Zalo)
  - Day 4: Memory + Skills + DEO Domain
  - Day 5: VPS Deployment + Production Stack
  - Day 6: Hardening + Drift Verification + Tests
  - Day 7: Documentation + Demo + Handoff

#### Status
- Plan: ✅ Approved by stakeholder
- Implementation: 🚀 Sprint 1 tuần bắt đầu

---

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

## [v3.0.0] - 2026-04-21

### Architecture Milestone — GoClaw Edition + Agents Registry

#### Added
- `docs/ENTERPRISE_HUMAN_AI_HYBRID_OS_PLAN_v3_GOCLAW.md` — kiến trúc v3 hoàn chỉnh với GoClaw làm Agent Operating Layer.
- `docs/ENTERPRISE_HUMAN_AI_HYBRID_OS_PLAN_v2.md` — plan v2 (intermediate, OpenClaw-based).
- `docs/ENTERPRISE_HUMAN_AI_HYBRID_OS_PHASE0_CHECKLIST_v2.md` — Phase 0 checklist đã cập nhật với 12 ADR decisions.
- `docs/ARCHITECTURE_DECISIONS.md` — 12 Architecture Decision Records đã chốt hoàn toàn.
- `docs/AUDIT_RECORD_HYBRID_OS_PLAN_v1.md` — audit record đầy đủ, trạng thái closed.
- `goclaw/agents/AGENTS_REGISTRY.md` — 11 agents đầy đủ với context files, tools, cron, delegation map.
- `goclaw/agents/enterprise-assistant/` — SOUL.md, IDENTITY.md, AGENTS.md.
- `goclaw/agents/dream-agent/SOUL.md` — reflection/synthesis agent persona.
- `goclaw/agents/ops-admin/SOUL.md` — full-access admin agent.
- `goclaw/agents/van-phong-agent/` — SOUL.md, IDENTITY.md (DOCX/XLSX/PPTX/PDF specialist).
- `goclaw/skills/SKILL_van_phong.md` — office document standards: typography, palettes, NĐ 30, QA checklist.
- `goclaw/cron/schedules.json5` — 11 cron jobs với IANA timezone (Asia/Ho_Chi_Minh).

#### Changed
- **Agent Operating Layer:** chuyển từ OpenClaw → **GoClaw** (multi-tenant AI agent gateway).
- **Dream/Reflection:** từ "custom build Phase 3" → **GoClaw L2 Dreaming native** (chỉ cần configure).
- **Knowledge base:** từ "custom RAG pipeline" → **GoClaw Knowledge Vault native**.
- **Integration pattern:** từ "custom REST bridge" → **MCP server + 7 lifecycle hooks**.
- **Schema name:** chốt `deo`.
- **Auth:** JWT 15m + refresh token 7d + service token riêng cho GoClaw.
- **Multi-tenancy:** hybrid app-layer + Postgres RLS cho sensitive tables.
- **Observability:** Pino + /health + /ready + correlation ID — bắt buộc từ Phase 0.
- **Testing:** Vitest + Supertest + Playwright smoke.
- **Deployment:** VPS + Docker Compose + GitHub Actions.

#### Architecture Decisions Chốt (12 ADRs)
- ADR-01: JWT + Refresh Token + Service Token riêng cho GoClaw
- ADR-02: Hybrid Multi-tenancy (app-layer + RLS)
- ADR-03: Schema name = `deo`
- ADR-04: Integration split (root = transport, apps/api = business logic)
- ADR-05: Extended error envelope `{ success, data, error: { code, message, details }, meta }`
- ADR-06: Vitest + Supertest + Playwright
- ADR-07: VPS + Docker Compose + GitHub Actions + manual deploy
- ADR-08: Pino + /health + correlation ID từ Phase 0
- ADR-09: n8n self-hosted, Phase 2
- ADR-10: Chat Phase 0 = admin/internal only (Option B)
- ADR-11: TanStack Query + Zustand
- ADR-12: /api/v1 + breaking change policy 30–90 ngày

#### Notes
- Đây là **architecture milestone**, không phải implementation milestone.
- Production app (v1.2.0-dev) vẫn đang chạy song song trong thời gian rebuild.
- Phase 0 implementation bắt đầu ở v3.1.0.

---

## [v0.2.3] - 2026-04-04

### Added
- Ghi nhận trạng thái production demo nội bộ hoạt động được.
- Agent Admin bridge sang production API bằng `lib/job-client.js`.
- Tự động login để refresh token khi Agent Admin tạo task thật.
- Format mô tả task dễ đọc hơn thay vì dump JSON raw.
- Tài liệu hóa current working state và roadmap tiếp theo.

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
