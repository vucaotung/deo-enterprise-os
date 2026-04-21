# Enterprise Human-AI Hybrid OS — Plan v2

> Version 2 — cập nhật sau khi chốt 12 Architecture Decision Records (ADR-01 đến ADR-12).
> Xem `ARCHITECTURE_DECISIONS.md` để biết lý do từng quyết định.

---

## 0. Tuyên ngôn hệ thống

`Enterprise Human-AI Hybrid OS` là bản kiến trúc mới cho Dẹo Enterprise OS theo hướng **hybrid**: giữ **OpenClaw local** làm lớp điều phối agent và automation, dùng **app business riêng** làm hệ thống nghiệp vụ, dùng **Google Drive** làm kho tài liệu an toàn/human-readable, và dùng **n8n** làm workflow/integration bus.

Đây **không** phải chỉ là một app CRUD có gắn AI. Đây là một **operating system for work** nơi:
- Con người làm việc qua chat + web
- Agent hỗ trợ, nhắc việc, suy nghĩ nền, tự động hóa
- Dữ liệu cấu trúc nằm trong DB sạch
- Tài liệu/đầu ra quan trọng được đẩy về Google Drive
- Automation được chia đúng vai giữa OpenClaw, n8n, và worker nội bộ

---

## 1. Quyết định nền tảng

### 1.1 Giữ OpenClaw local
OpenClaw **không bị loại bỏ**. Nó là lớp điều phối cục bộ của hệ thống.

**Vai trò của OpenClaw local:**
- Chat runtime cho Telegram / Zalo / các kênh khác
- Session-aware assistant memory
- Cron jobs / heartbeat / follow-up reminders
- Tool orchestration
- Proactive assistant behaviors
- Reflection / dream jobs
- Cầu nối linh hoạt giữa con người ↔ AI ↔ hệ thống business

### 1.2 Google Drive là durable storage quan trọng
- DB giữ **structured truth**
- Drive giữ **human-readable durable artifacts**
- Workspace local giữ **working state / transient state**

### 1.3 n8n là integration & workflow layer
Self-hosted. Tích hợp sâu từ Phase 2. Xử lý: webhook workflows, file/document workflows, sync jobs với dịch vụ ngoài, approval flows, multi-step automations, notification fan-out.

### 1.4 App business cần greenfield rebuild
Phần app business (API + web + worker + DB) build lại sạch để loại bỏ scope creep và technical debt của v0.2.3.

---

## 2. Mục tiêu cốt lõi

1. **Human-AI Collaborative Work OS** — người và agent cùng làm việc trên cùng một hệ
2. **Chat-first + Web-operable** — chat là mặt tiền, web là nơi quản trị/quan sát/chỉnh sửa
3. **Automation-first** — cron, reminder, workflow, follow-up là first-class
4. **Data-safe by design** — DB sạch, Drive an toàn, local có kiểm soát
5. **Modular expansion** — kiến trúc cho phép mở rộng CRM, chấm công, tài chính, helpdesk, knowledge, compliance
6. **Reflection-capable** — hệ có thể tổng hợp, review, dream, distill memory thay vì chỉ phản hồi bị động

---

## 3. Kiến trúc tổng thể

```text
Telegram / Zalo / Web / Internal events
                ↓
          OpenClaw local
(chat runtime, cron, heartbeat, reminders, tools, dream, agent orchestration)
                ↓
      Enterprise OS API + Worker
(structured business logic, data access, domain modules)
                ↓
          Postgres (schema: deo) + Redis
                ↓
      Google Drive  ↔  n8n workflows (self-hosted)
```

### Vai trò từng lớp

#### A. OpenClaw local = Agent Operating Layer
- Nhận và gửi tin nhắn
- Chạy cron / heartbeat
- Triệu hồi tool / agent flows
- Làm reflection / dream / proactive nudges
- Gọi API của Enterprise OS (dùng service token riêng)

#### B. Enterprise OS API/Web/Worker = Business System Layer
- Quản lý nghiệp vụ chuẩn hóa
- Expose API typed cho frontend và automation
- Chạy worker cho internal jobs deterministic
- Bảo đảm rules dữ liệu, permission, audit

#### C. Google Drive = Durable Artifact Layer
- Lưu docs, exports, SOP, report, evidence, generated files
- Làm knowledge input layer cho AI
- Cho phép người dùng đọc/chỉnh/sắp xếp ngoài app

#### D. n8n = Integration & Workflow Layer (self-hosted, active từ Phase 2)
- Nối Drive / Docs / Sheet / webhook / external apps
- Thực hiện workflow nhiều bước, retry, branching

#### E. Postgres (schema: `deo`) + Redis = Structured System Core
- Postgres giữ structured truth
- Redis giữ queue / cache / event fanout nội bộ

---

## 4. Nguyên tắc phân vai automation

### 4.1 OpenClaw dùng cho gì?
- reminders theo chat/session
- heartbeat định kỳ
- follow-up chủ động
- assistant-facing automations
- dream/reflection jobs
- logic có ngữ cảnh hội thoại và cần persona

### 4.2 n8n dùng cho gì?
- approval pipelines
- Google Drive / Docs / Sheets automations
- scheduled sync với external systems
- workflow kéo-thả nhiều bước
- webhook bridges
- document processing flows

### 4.3 Worker nội bộ dùng cho gì?
- indexing
- denormalization
- summary recompute
- event handlers nội bộ
- deterministic jobs gắn chặt với DB schema

### 4.4 Không dùng sai vai
- Không biến OpenClaw thành nơi giữ business truth
- Không biến n8n thành nơi thay business logic lõi
- Không biến worker thành chat assistant thô cứng

---

## 5. Monorepo structure

```text
aurora-enterprise-os/
├── apps/
│   ├── api/                     # Express/Nest-lite + TypeScript
│   │   └── src/
│   │       ├── config/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── org/
│   │       │   ├── projects/
│   │       │   ├── tasks/
│   │       │   ├── chat/
│   │       │   ├── agents/
│   │       │   ├── automation/
│   │       │   ├── drive/
│   │       │   ├── knowledge/
│   │       │   ├── audit/
│   │       │   └── admin/
│   │       ├── integrations/       # business-facing integration logic
│   │       │   ├── openclaw/
│   │       │   ├── n8n/
│   │       │   ├── google-drive/
│   │       │   ├── telegram/
│   │       │   └── zalo/
│   │       ├── middleware/
│   │       └── lib/
│   │
│   ├── web/                     # React + Vite + Tailwind
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── api/
│   │       └── store/           # Zustand stores
│   │
│   └── worker/                  # internal deterministic jobs
│       └── src/
│           ├── consumers/
│           ├── handlers/
│           └── lib/
│
├── packages/
│   ├── shared/                  # types, enums, dto contracts
│   └── sdk/                     # typed client cho internal calls
│
├── integrations/                # reusable clients + SDK wrappers (transport layer)
│   ├── openclaw/
│   ├── n8n/
│   └── google-drive/
│
├── infrastructure/
│   ├── postgres/
│   ├── redis/
│   ├── docker/
│   └── nginx/
│
├── docs/
│   ├── architecture/
│   ├── product/
│   ├── runbooks/
│   ├── automations/
│   └── decisions/
│
└── scripts/
```

> **Lưu ý ADR-04:** `integrations/` ở root = transport/client layer (reusable). `apps/api/src/integrations/` = business-facing logic. Không để business logic ở root integrations.
>
> **Lưu ý:** `packages/prompts` đã được bỏ khỏi Phase 0 scope.

---

## 6. Auth & Security (ADR-01 + ADR-02)

### 6.1 Auth mechanism
- Human users: JWT access token (15 phút) + refresh token (7 ngày, revocable store)
- OpenClaw → App: dedicated internal service token (không dùng chung user JWT)
- SSO / OAuth: defer sang phase sau

### 6.2 Multi-tenancy enforcement
- Mọi business entity có `company_id`
- Primary enforcement: application layer (tenant-aware middleware + repository)
- Secondary enforcement: Postgres RLS cho sensitive tables
- Early RLS coverage: `projects`, `tasks`, `chat_threads`, `chat_messages`, `drive_artifacts`, `audit_events`
- Privileged bypass phải explicit và auditable

---

## 7. Data & Storage Policy

### Schema: `deo` (PostgreSQL)

#### Postgres
- users, projects, tasks, clients, deals
- expenses, attendance records, approvals
- agent invocations metadata, audit events

#### Redis
- queue jobs, caches, event fanout tạm thời, ephemeral coordination state

#### Google Drive
- contracts / reports / generated docs
- uploaded source documents, exports
- SOP / handbook / policy / template
- knowledge library source, evidence / attachments

#### OpenClaw local workspace
- memory files, temporary work files
- generated intermediate outputs
- automation notes / heartbeat state / dream artifacts

#### n8n internal state
- workflow state và execution logs của integration layer
- **không** giữ business truth chính

---

## 8. Domain model cốt lõi (v1 kernel)

### 8.1 Bắt buộc trong v1
- Auth / Users / Roles
- Companies / Organizations
- Projects
- Tasks
- Chat threads / messages / linked entities cơ bản
- Automation registry tối thiểu
- Agent invocation log tối thiểu
- Audit events
- Drive artifact registry

### 8.2 Nên làm sớm nhưng không cần ôm hết trong Phase 0
- Knowledge documents registry
- Reminder / follow-up model
- Clarifications
- Notification outbox

---

## 9. Database Schema định hướng

Schema: **`deo`**

### Core enums
- `task_status`: todo | in_progress | blocked | in_review | completed | cancelled
- `task_priority`: low | medium | high | urgent
- `project_status`: planning | active | on_hold | completed | cancelled
- `channel_type`: telegram | zalo | web | internal
- `actor_type`: user | agent | system
- `invocation_status`: queued | running | completed | failed | cancelled
- `automation_kind`: openclaw_cron | openclaw_heartbeat | n8n_workflow | internal_job
- `artifact_type`: document | report | export | evidence | template | knowledge_source

### Core tables
`companies`, `users`, `user_identities`, `projects`, `tasks`, `task_assignments`, `task_comments`, `chat_threads`, `chat_messages`, `chat_linked_entities`, `reminders`, `clarifications`, `agent_invocations`, `automations_registry`, `automation_runs`, `drive_artifacts`, `knowledge_documents`, `audit_events`

### Thiết kế cần nhớ
- Mọi entity nghiệp vụ phải có `company_id`
- Những gì phát sinh từ chat phải trace ngược được về thread/message nguồn
- Những file ở Drive phải có metadata mapping trong DB
- Những gì agent làm phải audit được

---

## 10. API Surface

Prefix: `/api/v1`

### Response envelope (ADR-05)
```ts
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    page?: number;
    total?: number;
    [key: string]: any;
  };
}
```

### Core API
`/auth/*`, `/org/*`, `/projects/*`, `/tasks/*`, `/chat/*`, `/agents/*`, `/automation/*`, `/drive/*`, `/audit/*`

### Extended API (phase sau)
`/crm/*`, `/attendance/*`, `/finance/*`, `/knowledge/*`, `/helpdesk/*`, `/documents/*`, `/compliance/*`

### Versioning policy (ADR-12)
Breaking change → cần version mới. Non-breaking → không cần. Transition window: 30–90 ngày.

---

## 11. OpenClaw Integration Contract

### 11.1 Auth
OpenClaw gọi API bằng **dedicated service token** — không dùng user JWT. Token cần được config riêng trong OpenClaw và có thể revoke độc lập.

Header: `X-Service-Token: <token>` hoặc `Authorization: Bearer <service-jwt>`

### 11.2 OpenClaw gọi app khi nào?
- tạo task từ chat
- query task/project/deal status
- tạo clarification
- tạo reminder
- lấy dashboard summary
- đăng ký artifact vào Drive registry
- kích hoạt internal workflows

### 11.3 App gọi lại OpenClaw khi nào?
- gửi proactive update về chat
- tạo reminder theo session/chat
- trigger dream/reflection job
- gửi follow-up sau khi job nội bộ hoàn tất

### 11.4 Interface
- REST API typed cho phần nghiệp vụ
- event/webhook nhẹ cho callback automation
- idempotency keys cho automation calls
- correlation ID (`X-Correlation-ID`) xuyên suốt luồng

---

## 12. n8n Integration Contract

### n8n nên đảm nhiệm
- Google Docs templating
- Google Sheet sync jobs
- approval workflows
- multi-recipient notifications
- Drive folder automation
- inbound webhook transformations

### n8n không nên đảm nhiệm
- status truth của tasks/projects
- business rules lõi
- permission logic trung tâm
- memory/assistant persona logic

### Pattern
- App phát event / queue / webhook → n8n
- n8n xử lý → callback về app nếu cần persist kết quả
- artifact tạo ra phải đăng ký lại trong `drive_artifacts`

---

## 13. Google Drive Operating Policy

### Drive nên chứa
source documents, generated docs, reports, exports, policy files, templates, approved versions

### Drive không nên chứa
dữ liệu quan hệ lõi thay cho DB, transient execution state, queue state

### Cần có trong app
- artifact registry table
- folder mapping per company/module
- sync metadata
- `created_by` / `source_thread_id` / `linked_entity` fields

---

## 14. Dream / Reflection Layer

### Là gì?
Lớp xử lý nền mang tính tổng hợp/chiêm nghiệm:
- daily reflection
- weekly synthesis
- unresolved items scan
- next-best-actions suggestion
- memory distillation
- anomaly spotting
- strategic review summaries

### Chạy ở đâu?
Qua **OpenClaw cron / heartbeat / agent turns** — cần session context, persona, khả năng báo lại qua chat.

### Output đi đâu?
- chat summary cho sếp
- memory files / curated notes
- optional Drive report exports
- optional DB tables nếu cần structured insights

---

## 15. Frontend Pages

### V1
`/login`, `/`, `/projects`, `/projects/:id`, `/tasks`, `/chat`, `/automations`, `/agents`, `/drive`, `/settings`

### Phase sau
`/crm/clients`, `/crm/deals`, `/attendance`, `/attendance/reports`, `/finance/expenses`, `/finance/accounts`, `/knowledge`, `/helpdesk`, `/documents`, `/audit`

### Frontend stack
React + Vite + Tailwind + TanStack Query (server state) + Zustand (UI state)

---

## 16. Observability (ADR-08 — bắt buộc từ Phase 0)

- **Pino** — structured logging
- **`GET /health`** — mandatory
- **`GET /ready`** — recommended
- **Request ID / Correlation ID** — phải có trong logs (`X-Correlation-ID`)
- **Sentry** — error tracking (nếu có); nếu không, structured error logging vẫn bắt buộc
- DB và Redis health visibility

---

## 17. Testing Strategy (ADR-06)

| Layer | Tool | Scope |
|---|---|---|
| Backend unit/integration | Vitest + Supertest | Services + API endpoints |
| Frontend smoke | Playwright | Login, dashboard, projects, tasks |
| DB migration | Script-based | Apply/reset/rollback |
| Type safety gate | `tsc --noEmit` | Compile-time |

CI pipeline: lint → typecheck → backend tests → frontend validation/smoke

---

## 18. Build Phases

### Phase 0 — Foundation Kernel
Init monorepo, Postgres (`deo`) + Redis + Docker, shared types + typed API client, Auth + Org module, Projects + Tasks end-to-end, Chat threads/messages (admin/internal only), Audit events, Observability baseline (Pino + health + correlation ID), Web pages: login, dashboard, tasks, projects.

**Deliverable:** Đăng nhập, tạo task/project, xem dashboard thật, mọi thay đổi có audit, hệ thống có thể debug được.

### Phase 1 — OpenClaw + Automation Bridge
Enterprise OS API integration contract với OpenClaw (service token auth, correlation ID), Task create/query từ chat, Reminder model + OpenClaw cron bridge, Automation registry basic, Agent invocation log basic, Proactive notifications.

**Deliverable:** Chat tạo task được, hệ biết nhắc việc, có log automation runs.

### Phase 2 — Google Drive + n8n Integration Layer
n8n self-hosted setup, Drive artifact registry, Folder policies theo module, n8n workflow bridge, docs/export pipeline, Google Sheets/Docs use cases đầu tiên.

**Deliverable:** Output quan trọng đẩy về Drive, workflow nhiều bước chạy qua n8n.

### Phase 3 — Reflection / Dream Layer
daily digest, weekly review, unresolved actions scan, memory distillation jobs, optional Drive export.

**Deliverable:** Hệ không chỉ phản ứng mà còn biết tổng hợp/chủ động.

### Phase 4 — CRM Module
clients / leads / deals / interactions, linked tasks / chat / reminders, dashboard pipeline cards.

### Phase 5 — Attendance / Workforce Module
employees / shifts / check-in/out / leave requests, attendance reports.

### Phase 6 — Finance Module
expenses / accounts / invoices / debts, expense capture via chat, digests, Drive exports.

### Phase 7 — Knowledge & Helpdesk
document registry + search, helpdesk/tickets, clarification-assisted workflows.

### Phase 8 — Production Hardening
rate limiting, full observability/APM, backup strategy (formalized), replay-safe automation, performance tuning, security review.

---

## 19. Migration Strategy từ v0.2.3

### Dữ liệu đáng migrate
companies, users, projects, tasks, clients (nếu có giá trị), expenses/leads tuỳ mức sạch

### Không migrate thẳng
- các log tạp không còn đúng scope
- conversation model cũ nếu khác hoàn toàn
- workflow tables thử nghiệm

### Chiến lược (với cutover criteria rõ)
1. Freeze và chụp snapshot hệ cũ
2. Rename schema cũ thành `legacy`
3. Dựng schema `deo` mới song song
4. Viết migration scripts theo từng domain
5. Spot-check counts + semantics
6. Chạy parallel tối đa **2 tuần**
7. Cutover criteria: data count match ≥ 99%, smoke test pass, không có critical bug mở
8. Cutover có rollback plan — rollback decision owner: Tung

---

## 20. Technical Principles

- Modular monolith trước, đừng plugin hóa quá sớm
- Route → Service → Repository là đủ, tránh ceremony thừa
- Typed contracts giữa frontend/backend/integrations (shared `packages/sdk`)
- Idempotent automation writes
- Trace everything back to source (correlation ID)
- Zero fake production data
- Human-readable outputs ưu tiên đẩy về Drive
- Agent actions phải explainable và auditable
- Structured logging từ ngày đầu (Pino)
- Tenant isolation phải explicit, không implicit

---

## 21. Success Criteria

### Kernel success
- Login, tạo/sửa task/project, xem dashboard thật
- Audit trail usable
- Health endpoint trả lời
- Structured logs có correlation ID

### Hybrid success
- Drive artifact registry hoạt động
- n8n workflow bridge hoạt động
- OpenClaw ↔ app ↔ Drive ↔ n8n nói chuyện được với service token auth

### Automation success
- Reminder/follow-up/scheduled jobs thật
- Dream/reflection output usable
- Không phụ thuộc manual chạy tay cho các flow cốt lõi

### Expansion success
- Có thể thêm CRM / chấm công / finance mà không phá kernel
- Mỗi module mới tuân thủ cùng integration + audit + artifact policy

---

## 22. Kết luận

`Enterprise Human-AI Hybrid OS` v2 là bản tái thiết theo triết lý:
- **giữ OpenClaw local** làm hệ thần kinh điều phối
- **dùng app business mới** làm khung nghiệp vụ sạch
- **dùng Google Drive** làm kho tài liệu an toàn
- **dùng n8n (self-hosted)** làm lớp automation/integration nhiều bước
- **giữ chỗ chính thức cho dream/reflection** như một năng lực lõi
- **mở rộng bằng module** như CRM, chấm công, tài chính, helpdesk, knowledge, compliance

Với **12 ADR đã được chốt**, hệ thống có đủ nền tảng quyết định để bắt đầu Phase 0 implementation.

---

*Plan v2 — Cập nhật sau ADR-01 đến ADR-12 — 2026-04-12*
