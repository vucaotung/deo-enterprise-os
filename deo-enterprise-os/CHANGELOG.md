# CHANGELOG

## [v3.1.0] — 2026-04-22

### 🤖 Agents Live — 13 Agents Deployed on GoClaw

#### Added

**13 agents fully configured với 8 context files mỗi agent:**
- `SOUL.md` — personality và behavioral guidelines
- `IDENTITY.md` — tên, role, trigger phrases
- `AGENTS.md` — delegation rules, quy trình nghiệp vụ
- `CAPABILITIES.md` — domain expertise (file mới, không có trong v3.0)
- `TOOLS.md` — MCP tools available per agent
- `USER_PREDEFINED.md` — shared user context per agent type (file mới)
- `BOOTSTRAP.md` — khởi động instructions
- `MEMORY.md` — initial memory state

**Agents deployed (GoClaw dashboard + context files uploaded):**
| Agent | Model | Channel |
|---|---|---|
| `deo` | gpt-5.4 → claude-sonnet-4-6* | Telegram |
| `office-agent` | gpt-5.4 → claude-sonnet-4-6* | Zalo |
| `hr-agent` | gemma-4-31b → claude-sonnet-4-6* | Zalo |
| `finance-agent` | minimax-m2.5 → claude-sonnet-4-6* | Zalo |
| `crm-agent` | gpt-4o → claude-sonnet-4-6* | Zalo |
| `it-dev-agent` | gpt-4o → claude-sonnet-4-6* | Telegram |
| `office-admin-agent` | gpt-4o → claude-sonnet-4-6* | Zalo |
| `marketing-agent` | gpt-5.4 → claude-sonnet-4-6* | Zalo |
| `legal-agent` | gpt-5.4 → claude-sonnet-4-6* | Zalo |
| `project-manager-agent` | gpt-5.4 → claude-sonnet-4-6* | Zalo |
| `researcher-agent` | minimax-m2.5 → claude-sonnet-4-6* | Telegram |
| `dream-agent` | gpt-4o → claude-opus-4-6* | Internal |
| `ops-admin` | minimax-m2.5 → claude-opus-4-6* | Zalo |

> *Target model sau khi có Anthropic API key

**New files:**
- `goclaw/agents/AGENTS_REGISTRY.md` v2.1 — 13 agents, model table, channel strategy, setup order
- `goclaw/agents/*/CAPABILITIES.md` — 13 files, domain expertise per agent
- `goclaw/agents/*/USER_PREDEFINED.md` — 13 files, shared user context per agent type
- `goclaw/config/MULTI_TENANCY.md` — updated channel strategy, port fix, n8n webhook
- `goclaw/config/HOOKS_PLAN.md` — Agent Hooks plan (5 hooks)

#### Changed

- **Channel strategy finalized:**
  - Telegram: `deo` (sếp only), `it-dev-agent`, `researcher-agent`
  - Zalo: tất cả business agents (hr, finance, crm, office, marketing, legal, project-manager, ops-admin)
  - Lý do: nhân viên chủ yếu tương tác qua Zalo; Telegram chỉ cho sếp + technical agents

- **Agent count:** 11 → 13 (thêm `crm-agent`, `marketing-agent`, `legal-agent`, `project-manager-agent`, `ops-admin` vào full registry)

- **Port correction:** 3777 → `18790` trong tất cả docs và commands (GoClaw Docker actual port)

- **AGENTS_REGISTRY.md v2.1:**
  - Thêm "Model thực tế" table (hiện tại vs target)
  - TODO migration note khi có Anthropic key
  - Channel mapping Telegram/Zalo rõ ràng

#### Infrastructure

- **GoClaw Standard Edition** running on `localhost:18790` (Docker)
- **Gateway token** configured: `.env.local` + `C:\goclaw\.env`
- **Context files** uploaded via `PUT /api/v1/agents/{key}/context-files` API (65 file uploads)
- **n8n cron** workflow setup: dream-agent `daily-reflection` trigger at 21:00

#### Known Issues

- 3 agents returning 500 on chat test: `crm-agent`, `it-dev-agent`, `office-admin-agent` — under investigation
- `dream-agent` persona: đang dùng gpt-4o + SOUL.md fix (gemma model không follow context files)
- Anthropic API key chưa có — tất cả agents tạm dùng OpenAI models

#### Hooks Plan (goclaw/config/HOOKS_PLAN.md)

5 hooks được plan cho v3.2.0:
1. **User Context Injection** (`before_chat`) — inject user profile từ EOS DB vào mỗi request
2. **Conversation Logger** (`after_chat`) — log tất cả conversations vào `agent_conversations` table
3. **Rate Limiter** (`before_chat`) — giới hạn staff 20 msg/giờ, management 100 msg/giờ
4. **Error Alerter** (`on_error`) — Telegram alert khi critical agents (deo/finance/hr) lỗi
5. **Off-hours Blocker** (`before_chat`) — hr/finance/legal từ chối ngoài giờ làm việc

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
