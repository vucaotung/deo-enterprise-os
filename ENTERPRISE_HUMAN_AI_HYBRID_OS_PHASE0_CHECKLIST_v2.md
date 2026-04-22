# Enterprise Human-AI Hybrid OS — Phase 0 Implementation Checklist v2

> Version 2 — cập nhật sau khi chốt 12 ADR.
> Thay đổi so với v1: bổ sung observability, testing stack, deployment baseline, service token readiness, RLS setup, chat scope rõ ràng, backup, bỏ `packages/prompts`.

---

## Phase 0 Goal

Build **foundation kernel** của hệ thống mới — đã usable trong real work trước khi CRM, attendance, finance, knowledge, và advanced automation đến.

**Phase 0 deliverable:**
- Users có thể đăng nhập
- Users có thể tạo và quản lý projects và tasks
- Dashboard hiển thị real data
- Chat/thread data model tồn tại ở mức basic (admin/internal only)
- Audit trail tồn tại
- Structured logging + health endpoint hoạt động
- Hệ thống sẵn sàng về cấu trúc để tích hợp OpenClaw, n8n, Google Drive ở Phase 1+

---

## 1. Repo / Monorepo Setup

### 1.1 Initialize repo structure
- [ ] Tạo root folder structure:
  - [ ] `apps/api`
  - [ ] `apps/web`
  - [ ] `apps/worker`
  - [ ] `packages/shared`
  - [ ] `packages/sdk`
  - [ ] `integrations/openclaw` ← client/transport layer
  - [ ] `integrations/n8n`
  - [ ] `integrations/google-drive`
  - [ ] `infrastructure/postgres`
  - [ ] `infrastructure/redis`
  - [ ] `infrastructure/docker`
  - [ ] `infrastructure/nginx`
  - [ ] `docs/architecture`
  - [ ] `docs/runbooks`
  - [ ] `docs/decisions`
- [ ] Thêm root `README.md`
- [ ] Thêm root `.gitignore`
- [ ] Thêm root `.editorconfig`
- [ ] Thêm root `.env.example`
- [ ] Chọn package manager — **pnpm** recommended
- [ ] Thêm workspace config (`pnpm-workspace.yaml`)

> **ADR-04:** `integrations/` ở root = reusable clients/adapters. Business logic integration nằm trong `apps/api/src/integrations/`.

### 1.2 Tooling baseline
- [ ] TypeScript configured across apps/packages
- [ ] ESLint configured
- [ ] Prettier configured
- [ ] Scripts thêm vào root:
  - [ ] `dev`
  - [ ] `build`
  - [ ] `lint`
  - [ ] `typecheck`
  - [ ] `test`
- [ ] Shared tsconfig base tạo

---

## 2. Infrastructure Setup

### 2.1 Docker baseline
- [ ] Tạo `docker-compose.yml`
- [ ] Thêm services:
  - [ ] `postgres`
  - [ ] `redis`
  - [ ] `api`
  - [ ] `web`
  - [ ] `worker` (optional Phase 0)
- [ ] Xác nhận `docker compose up` chạy được local
- [ ] Thêm persistent volumes
- [ ] Thêm healthchecks cho Postgres và Redis

### 2.2 Database bootstrap
- [ ] Tạo initial SQL migration folder
- [ ] Add extension/setup migration nếu cần
- [ ] Schema name: **`deo`** (ADR-03)
- [ ] Script cho migration apply/reset trong local dev

### 2.3 Redis baseline
- [ ] Redis config nếu cần custom settings
- [ ] Verify API và worker có thể connect

### 2.4 Deployment baseline (ADR-07)
- [ ] Xác định VPS target
- [ ] Setup nginx hoặc Caddy reverse proxy config
- [ ] Tạo GitHub Actions CI workflow (lint + typecheck + test)
- [ ] Tạo manual deploy script hoặc workflow cho production
- [ ] Document environment strategy: `dev` và `prod`

### 2.5 Database backup (ADR-07)
- [ ] Setup automated Postgres backup script (daily minimum)
- [ ] Verify backup restore procedure một lần
- [ ] Document backup location và retention policy

---

## 3. Shared Contracts Package

### 3.1 `packages/shared`
- [ ] Base domain types:
  - [ ] auth
  - [ ] org
  - [ ] projects
  - [ ] tasks
  - [ ] chat
  - [ ] audit
  - [ ] automation (minimal)
  - [ ] drive artifacts (minimal)
- [ ] Shared enums:
  - [ ] `task_status`
  - [ ] `task_priority`
  - [ ] `project_status`
  - [ ] `channel_type`
  - [ ] `actor_type`
- [ ] Response envelope types (ADR-05):
  ```ts
  { success, data?, error?: { code, message, details? }, meta? }
  ```
- [ ] Export DTOs cho create/update actions

### 3.2 `packages/sdk`
- [ ] Typed API client skeleton
- [ ] Auth client
- [ ] Projects client
- [ ] Tasks client
- [ ] Dashboard client

---

## 4. Database Schema — Phase 0 Scope

### 4.1 Core tables
- [ ] `companies`
- [ ] `users`
- [ ] `user_identities`
- [ ] `projects`
- [ ] `tasks`
- [ ] `task_assignments`
- [ ] `task_comments`
- [ ] `chat_threads`
- [ ] `chat_messages`
- [ ] `chat_linked_entities`
- [ ] `audit_events`

### 4.2 Required columns / rules
- [ ] Mọi business entity có `company_id`
- [ ] `projects`: owner/status/priority basics
- [ ] `tasks`: project link, assignee, status, priority, due date, source fields
- [ ] `chat_threads`: channel + external_chat_id
- [ ] `chat_messages`: source trace + sender type + actor_type
- [ ] `audit_events`: actor/entity/action/timestamps/correlation_id

### 4.3 Indexes / constraints
- [ ] PKs và FKs sạch
- [ ] Unique constraint cho external identity mapping
- [ ] Indexes:
  - [ ] `tasks(company_id, status)`
  - [ ] `projects(company_id, status)`
  - [ ] `chat_threads(company_id, channel, external_chat_id)`
  - [ ] `chat_messages(thread_id, created_at)`
  - [ ] `audit_events(company_id, created_at)`

### 4.4 Row-Level Security (ADR-02)
- [ ] Enable RLS trên các sensitive tables:
  - [ ] `projects`
  - [ ] `tasks`
  - [ ] `chat_threads`
  - [ ] `chat_messages`
  - [ ] `drive_artifacts`
  - [ ] `audit_events`
- [ ] Define RLS policies cho `company_id` isolation
- [ ] Test RLS isolation với 2 companies khác nhau

---

## 5. API App Foundation

### 5.1 Base app structure
- [ ] API app skeleton
- [ ] Config loader cho env vars
- [ ] DB connection layer (schema: `deo`)
- [ ] Redis connection layer
- [ ] **Pino logger** (ADR-08)
- [ ] Response envelope utility (ADR-05 format)
- [ ] Error middleware với error codes
- [ ] Request validation middleware
- [ ] Auth middleware skeleton
- [ ] **Correlation ID middleware** (`X-Correlation-ID` header) (ADR-08)
- [ ] **Tenant context middleware** (inject `company_id` vào request context) (ADR-02)

### 5.2 Architectural rules
- [ ] Route → Service → Repository pattern
- [ ] Không có raw SQL trong route handlers
- [ ] Modules tự chứa theo domain
- [ ] Mọi repository method require tenant context

---

## 6. Observability Baseline (ADR-08 — bắt buộc Phase 0)

- [ ] **`GET /health`** endpoint — trả về status 200 + JSON basic
- [ ] **`GET /ready`** endpoint — trả về DB + Redis connectivity status
- [ ] Pino structured logging setup:
  - [ ] Request log (method, path, status, duration, correlation_id)
  - [ ] Error log (error code, stack, correlation_id)
  - [ ] Startup log
- [ ] Correlation ID (`X-Correlation-ID`) được pass qua logs và audit_events
- [ ] Sentry setup nếu có (hoặc documented là "pending") (ADR-08)
- [ ] Verify: một request lỗi có đủ context để debug mà không cần console.log

---

## 7. Auth Module (ADR-01)

### 7.1 Backend
- [ ] `POST /api/v1/auth/login`
- [ ] `POST /api/v1/auth/logout`
- [ ] `POST /api/v1/auth/refresh`
- [ ] `GET /api/v1/auth/me`

### 7.2 Token strategy
- [ ] Access token: JWT, expiry 15 phút
- [ ] Refresh token: 7 ngày, stored in DB (revocable)
- [ ] Refresh token rotation on use
- [ ] Role/permission basics

### 7.3 Service token (ADR-01 — cho OpenClaw Phase 1)
- [ ] Define service token format (static API key hoặc service JWT)
- [ ] Define header convention: `X-Service-Token` hoặc `Authorization: Bearer <service-jwt>`
- [ ] Middleware nhận biết và xác thực service token
- [ ] Document contract trong `docs/architecture/openclaw-auth.md`

> Service token không cần fully wired trong Phase 0 nhưng middleware và contract phải sẵn sàng cho Phase 1.

### 7.4 Seed data
- [ ] Seed 1 company
- [ ] Seed 1 admin user
- [ ] Seed 1 demo member user

### 7.5 Verification
- [ ] Login trả valid token
- [ ] `/auth/me` trả current user
- [ ] Unauthorized requests bị block
- [ ] Expired token bị reject
- [ ] Refresh flow hoạt động

---

## 8. Organization Module

### 8.1 Backend
- [ ] `GET /api/v1/org/me`
- [ ] `GET /api/v1/org/members`
- [ ] minimal company settings read endpoint

### 8.2 Data model
- [ ] user ↔ company relation verified
- [ ] identity mapping table sẵn sàng cho Telegram/Zalo/OpenClaw actors

---

## 9. Projects Module

### 9.1 Backend
- [ ] `GET /api/v1/projects`
- [ ] `POST /api/v1/projects`
- [ ] `GET /api/v1/projects/:id`
- [ ] `PATCH /api/v1/projects/:id`
- [ ] `DELETE /api/v1/projects/:id` hoặc archive

### 9.2 Features
- [ ] Basic status handling
- [ ] Owner assignment
- [ ] Due date support
- [ ] Audit event ghi khi tạo/sửa

### 9.3 Verification
- [ ] Create project works
- [ ] Update project works
- [ ] List/detail trả real data
- [ ] Company isolation: user A không thấy project của company B

---

## 10. Tasks Module

### 10.1 Backend
- [ ] `GET /api/v1/tasks`
- [ ] `POST /api/v1/tasks`
- [ ] `GET /api/v1/tasks/:id`
- [ ] `PATCH /api/v1/tasks/:id`
- [ ] `POST /api/v1/tasks/:id/status`
- [ ] `POST /api/v1/tasks/:id/comments`

### 10.2 Features
- [ ] Task linked to project
- [ ] Status transitions
- [ ] Priority field
- [ ] Assigned user basic support
- [ ] **Source fields** sẵn sàng cho chat-created tasks (ADR-10)
- [ ] Audit event ghi khi tạo/sửa/comment

### 10.3 Verification
- [ ] Create task works
- [ ] Change status works
- [ ] Add comment works
- [ ] List by project/status works
- [ ] Company isolation verified

---

## 11. Chat Core Module — Admin/Internal Only (ADR-10)

### 11.1 Backend
- [ ] `GET /api/v1/chat/threads`
- [ ] `GET /api/v1/chat/threads/:id`
- [ ] `GET /api/v1/chat/threads/:id/messages`
- [ ] `POST /api/v1/chat/threads/:id/messages` (internal/admin use only)

### 11.2 Scope control (ADR-10 — Option B)
- [ ] Endpoint có nhưng chỉ cho internal/admin use trong Phase 0
- [ ] Không implement OpenClaw/webhook ingestion trong Phase 0
- [ ] Không implement auto-actions từ chat trong Phase 0
- [ ] `chat_linked_entities` table tồn tại nhưng dùng tối thiểu

### 11.3 Verification
- [ ] Có thể tạo/load thread records
- [ ] Có thể insert/load messages
- [ ] Message order và source trace đúng
- [ ] Schema validated đủ để Phase 1 bridge vào

---

## 12. Audit Module

### 12.1 Core requirement
- [ ] Mọi key mutations ghi vào `audit_events`
- [ ] `correlation_id` được ghi vào audit_events

### 12.2 Minimum audited actions
- [ ] login/logout
- [ ] project create/update
- [ ] task create/update/status change
- [ ] task comment create
- [ ] org settings update

### 12.3 Verification
- [ ] Mỗi mutation để lại audit row
- [ ] Audit rows có actor + entity + action + timestamp + correlation_id

---

## 13. Dashboard Summary

### 13.1 Backend
- [ ] `GET /api/v1/dashboard/summary`

### 13.2 Minimum payload
- [ ] total projects
- [ ] active projects
- [ ] total tasks
- [ ] tasks by status
- [ ] overdue tasks count
- [ ] recent activity summary

### 13.3 Verification
- [ ] Dashboard trả real DB data
- [ ] Không có fake/mock data trong production payload

---

## 14. Web App Foundation

### 14.1 Base setup
- [ ] React + Vite initialized
- [ ] Tailwind configured
- [ ] Router configured
- [ ] **TanStack Query** configured (server state) (ADR-11)
- [ ] **Zustand** configured (UI state) (ADR-11)
- [ ] Auth state store (Zustand)

### 14.2 Phase 0 pages
- [ ] `/login`
- [ ] `/` (dashboard)
- [ ] `/projects`
- [ ] `/projects/:id`
- [ ] `/tasks`
- [ ] `/chat` (basic, read-only/admin)
- [ ] `/settings` (basic)

### 14.3 UI requirements
- [ ] Login page works
- [ ] Dashboard dùng real API
- [ ] Projects list/detail dùng real API
- [ ] Tasks page có list view (board view optional)
- [ ] **Dashboard frontend verified** (INC-04 fix — thêm vào testing checklist)
- [ ] Không có hardcoded fake data trong Phase 0 deliverable

---

## 15. Worker App (Skeleton Only)

### 15.1 Worker setup
- [ ] Worker app structure
- [ ] Connect to Redis
- [ ] Base consumer loop
- [ ] Logger/error handling với Pino

### 15.2 Phase 0 scope
- [ ] Không có complex jobs
- [ ] Chỉ prove worker có thể consume một simple internal job
- [ ] Chuẩn bị structure cho future jobs

---

## 16. Integration Readiness (No Full Bridge Yet)

### 16.1 OpenClaw readiness (ADR-01)
- [ ] Định nghĩa service token format và header convention
- [ ] Định nghĩa correlation ID header: `X-Correlation-ID`
- [ ] Viết placeholder integration docs: `docs/architecture/openclaw-auth.md`
- [ ] Viết placeholder: cách task creation từ chat sẽ gọi API
- [ ] Middleware sẵn sàng nhận service token (dù chưa fully wired)

### 16.2 n8n readiness (ADR-09)
- [ ] Định nghĩa callback/webhook pattern
- [ ] Định nghĩa event payload shape cho future workflows
- [ ] Ghi chú: n8n self-hosted, tích hợp thật từ Phase 2

### 16.3 Google Drive readiness
- [ ] Định nghĩa artifact registry model draft
- [ ] Định nghĩa folder policy draft theo company/module

---

## 17. Documentation

- [ ] `docs/architecture/system-overview.md`
- [ ] `docs/architecture/module-boundaries.md`
- [ ] `docs/architecture/openclaw-auth.md` ← mới (ADR-01)
- [ ] `docs/architecture/multi-tenancy.md` ← mới (ADR-02)
- [ ] `docs/runbooks/local-dev.md`
- [ ] `docs/runbooks/db-reset.md`
- [ ] `docs/runbooks/seed-data.md`
- [ ] `docs/runbooks/backup-restore.md` ← mới (ADR-07)
- [ ] `docs/api/phase0-endpoints.md`
- [ ] `docs/decisions/` ← link sang ARCHITECTURE_DECISIONS.md

---

## 18. Testing / Verification Checklist (ADR-06)

### Backend
- [ ] typecheck passes (`tsc --noEmit`)
- [ ] build passes
- [ ] Auth endpoints tested (Vitest + Supertest)
- [ ] Projects endpoints tested
- [ ] Tasks endpoints tested
- [ ] Dashboard summary tested
- [ ] Audit insertion tested
- [ ] **Tenant isolation tested** (user A không thấy data của company B) (ADR-02)
- [ ] **Service token middleware tested** (ADR-01)
- [ ] **Health + ready endpoints tested** (ADR-08)

### Frontend (Playwright smoke)
- [ ] Login flow tested
- [ ] Dashboard renders live data
- [ ] Projects CRUD basic tested
- [ ] Tasks CRUD basic tested

### Infra
- [ ] `docker compose up` works cleanly
- [ ] Postgres persists data (schema `deo`)
- [ ] Redis reachable bởi API và worker
- [ ] Backup script chạy được (ADR-07)

### Observability
- [ ] `/health` trả 200
- [ ] `/ready` trả DB + Redis status
- [ ] Request log có correlation_id
- [ ] Error log có đủ context để debug (ADR-08)

---

## 19. Phase 0 Exit Criteria

Phase 0 hoàn thành khi **tất cả** các điều kiện sau đều đúng:

- [ ] User có thể đăng nhập thành công
- [ ] User có thể tạo, sửa, xem projects
- [ ] User có thể tạo, sửa, comment, và cập nhật tasks
- [ ] Dashboard hiển thị real summary data
- [ ] Chat thread/message tables tồn tại và work ở mức basic (admin/internal)
- [ ] Audit trail tồn tại cho các mutations quan trọng
- [ ] Frontend connected to real APIs
- [ ] Worker skeleton đang chạy
- [ ] `/health` và `/ready` endpoints hoạt động
- [ ] Structured logging với correlation ID active
- [ ] RLS enabled cho sensitive tables
- [ ] Tenant isolation verified bằng test
- [ ] Service token middleware sẵn sàng (documented nếu chưa wired)
- [ ] Backup strategy documented và tested
- [ ] Repo structure sẵn sàng cho OpenClaw / n8n / Drive integration ở Phase 1+

---

## 20. Explicitly Out of Scope cho Phase 0

**Không** để các item sau làm bloat foundation phase:

- [ ] CRM full implementation
- [ ] Attendance module
- [ ] Finance module
- [ ] Knowledge embeddings
- [ ] Advanced RAG
- [ ] Plugin system runtime
- [ ] Full OpenClaw bridge (webhook ingestion, production chat)
- [ ] Full n8n bridge
- [ ] Dream/reflection jobs
- [ ] Zalo/Telegram production ingestion
- [ ] SSO / OAuth
- [ ] Full APM / metrics platform (Phase 8)

Schema hoặc contracts có thể chuẩn bị sớm, nhưng implementation đầy đủ thuộc phase sau.

---

*Checklist v2 — Cập nhật sau ADR-01 đến ADR-12 — 2026-04-12*
