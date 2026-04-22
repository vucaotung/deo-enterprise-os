# DẸO ENTERPRISE OS — KIẾN TRÚC CHÍNH THỨC

## Agent Orchestration Platform + Human–AI Workspace

**Version:** FINAL  
**Ngày:** 30/03/2026  
**Mục tiêu:** Deploy VPS → Webapp quản lý công việc → Nền tảng Human–AI qua chat native context

---

## 1. HIỆN TRẠNG THỰC TẾ

### 1.1. Codebase đang có

```
/home/admin_wsl2/deo-enterprise-os/

Backend (Express + TypeScript):
  ✅ /api/auth          — JWT login
  ✅ /api/dashboard      — summary data
  ✅ /api/tasks          — CRUD tasks
  ✅ /api/expenses       — CRUD expenses
  ✅ /api/clients        — CRUD clients
  ✅ /api/business-lines — CRUD business lines
  ✅ /api/agent-jobs     — Job queue (tạo, list, detail, update, messages, retry)

Frontend (React + TypeScript + Vite):
  ✅ Dashboard, Tasks, CRM pages (basic)

Infrastructure:
  ✅ docker-compose.yml + build/run/stop scripts
  ✅ PostgreSQL 16 (23+ tables schema deo.*)
  ✅ Redis 7
  ✅ Cloudflare Tunnel (enterpriseos.bond, 4 connections HKG)

OpenClaw (Windows):
  ✅ 4 agents: main, phap-che, ke-toan, dieu-phoi
  ✅ Telegram bot @condeobot bind main
  ⚠️ Gateway crash issue (đang fix)
  ⚠️ Multi-bot Telegram chưa ổn

Chưa sạch:
  ❌ Git chưa commit (no commits yet, all untracked)
  ❌ Local WSL networking loạn
  ❌ Worker automation chưa cài
  ❌ Chưa deploy VPS
```

### 1.2. Quyết định chiến lược

```
1. CHUYỂN LÊN VPS — không vật lộn WSL nữa
2. HỌC CLAWTASK — lấy primitive, build trong deo-os
3. HỌC VIET-ERP — lấy pattern, không bê nguyên
4. CHAT LÀ CHÍNH — webapp là bảng điều khiển phụ trợ
5. GIỮ NHẸ — Docker Compose trên 1 VPS, không K8s
```

---

## 2. KIẾN TRÚC MỤC TIÊU

### 2.1. Tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                 INTERACTION LAYER                        │
│  Telegram │ Zalo OA │ Webapp Chat │ Webapp UI │ Email   │
│  (80% tác vụ qua chat native)   (20% visual mgmt)      │
└────────────────────────┬────────────────────────────────┘
                         │ Unified Message Bus
┌────────────────────────▼────────────────────────────────┐
│                 INTELLIGENCE LAYER                       │
│  Dẹo Admin: Context Engine + Intent Parser + Router     │
│  + Clarification Manager + Template Manager             │
└────────┬───────────────┬────────────────┬───────────────┘
         │               │                │
┌────────▼───────┐ ┌─────▼──────┐ ┌───────▼──────────────┐
│ ORCHESTRATION  │ │ EXECUTION  │ │ DEVOPS               │
│                │ │            │ │                       │
│ Task Lifecycle │ │ AI Agents  │ │ Claude Code           │
│ Agent Registry │ │ (OpenClaw) │ │ (code/test/deploy)    │
│ Job Queue      │ │            │ │                       │
│ Worker Protocol│ │ Human Staff│ │ GitHub CI/CD          │
│ Clarifications │ │ (real)     │ │                       │
│ Notebooks      │ │            │ │                       │
│ Audit Events   │ │ n8n Flows  │ │                       │
└────────┬───────┘ └─────┬──────┘ └───────┬──────────────┘
         └───────────────┼────────────────┘
┌────────────────────────▼────────────────────────────────┐
│                 DATA LAYER                               │
│  Postgres (deo.*) │ Redis │ Google Drive │ Local files   │
└─────────────────────────────────────────────────────────┘
```

### 2.2. Nguyên tắc thiết kế

```
1. CHAT-FIRST
   Mọi tương tác bắt đầu từ chat. Webapp hiện thông tin,
   chat là nơi hành động. Cả hai sync realtime.

2. CONTEXT TỰ ĐỘNG
   Hệ thống tự gom context từ DB (client, project, history,
   files) — không bao giờ hỏi lại cái đã biết.

3. CLARIFICATION THAY VÌ ĐOÁN
   Agent thiếu data → tạo clarification → hỏi human →
   nhận answer → resume. Không đoán bừa.

4. 2-LAYER TASK STATES
   Workflow state (business: todo/blocked/review/done)
   tách khỏi execution state (tech: queued/running/failed).

5. PACKAGE HÓA DẦN
   Không nhồi hết vào 1 cục. Tách shared logic thành
   packages khi module đủ lớn.

6. EVENT-DRIVEN THINKING
   Mọi action phát event (DB-based trước, Redis/NATS sau).
   Notification, audit, analytics đều consume events.

7. AUDIT MỌI THỨ
   Ai làm gì, lúc nào, sửa gì, kết quả gì — trace được hết.
   Append-only, không xóa.
```

---

## 3. PACKAGE STRUCTURE (học từ Viet-ERP)

### 3.1. Từ 1 cục → modular dần

```
deo-enterprise-os/
├── apps/
│   ├── api/                    ← Express backend chính
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── dashboard.ts
│   │   │   │   ├── tasks.ts
│   │   │   │   ├── expenses.ts
│   │   │   │   ├── clients.ts
│   │   │   │   ├── business-lines.ts
│   │   │   │   ├── agent-jobs.ts      ← ĐÃ CÓ
│   │   │   │   ├── agents.ts          ← MỚI: registry + heartbeat
│   │   │   │   ├── clarifications.ts  ← MỚI
│   │   │   │   ├── notebooks.ts       ← MỚI
│   │   │   │   ├── conversations.ts   ← MỚI: chat API
│   │   │   │   └── audit.ts           ← MỚI
│   │   │   ├── services/              ← MỚI: business logic tách khỏi route
│   │   │   │   ├── task.service.ts
│   │   │   │   ├── agent-job.service.ts
│   │   │   │   ├── clarification.service.ts
│   │   │   │   ├── context.service.ts ← MỚI: context engine
│   │   │   │   └── event.service.ts   ← MỚI: event bus nội bộ
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts            ← ĐÃ CÓ
│   │   │   │   ├── rate-limit.ts      ← MỚI
│   │   │   │   ├── audit.ts           ← MỚI: auto-log actions
│   │   │   │   └── validate.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── web/                    ← React + Vite frontend
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx      ← ĐÃ CÓ
│       │   │   ├── Tasks.tsx          ← ĐÃ CÓ → nâng kanban
│       │   │   ├── CRM.tsx            ← ĐÃ CÓ → nâng pipeline
│       │   │   ├── Chat.tsx           ← MỚI: 3-cột chat center
│       │   │   ├── Agents.tsx         ← MỚI: agent status dashboard
│       │   │   ├── Clarifications.tsx ← MỚI: pending questions
│       │   │   ├── Notebooks.tsx      ← MỚI: knowledge base
│       │   │   └── Finance.tsx        ← expenses + reports
│       │   ├── components/
│       │   │   ├── ChatPanel.tsx      ← MỚI: chat widget
│       │   │   ├── ContextPanel.tsx   ← MỚI: context sidebar
│       │   │   ├── KanbanBoard.tsx
│       │   │   ├── LeadPipeline.tsx
│       │   │   └── AgentCard.tsx      ← MỚI
│       │   └── hooks/
│       │       ├── useChat.ts         ← MỚI: websocket chat
│       │       └── useContext.ts      ← MỚI: context engine client
│       └── package.json
│
├── packages/                   ← MỚI: shared logic (tách dần)
│   ├── auth/                   ← JWT, middleware, permissions
│   ├── audit/                  ← audit logging helpers
│   ├── events/                 ← event bus abstraction
│   └── vietnam/                ← VND format, timezone, tax rules
│
├── infrastructure/
│   ├── postgres/
│   │   ├── 002_deo_schema.sql
│   │   ├── 003_deo_v4_update.sql
│   │   ├── 004_many_to_many.sql
│   │   └── 005_orchestration_upgrade.sql  ← MỚI
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml  ← MỚI: production config
│   └── nginx/
│       └── default.conf
│
├── scripts/
│   ├── health-check.sh
│   ├── deploy.sh               ← MỚI: VPS deploy script
│   ├── backup.sh
│   └── worker.sh               ← MỚI: agent worker daemon
│
├── docs/
│   ├── ARCHITECTURE.md         ← tài liệu này
│   ├── DEPLOYMENT.md           ← MỚI: hướng dẫn deploy VPS
│   ├── AGENT_JOBS.md
│   ├── DECISIONS.md            ← MỚI: ADR (architecture decisions)
│   └── plans/
│       └── AGENT_ORCHESTRATION_V2.md
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. DATABASE SCHEMA — TOÀN BỘ

### 4.1. Sơ đồ quan hệ hoàn chỉnh

```
═══════════════════════════════════════════════════════════
                    CORE ENTITIES
═══════════════════════════════════════════════════════════

users ──────────────────────────────────── agents (registry)
  │                                            │
  ├──< staff_assignments >── companies ──< agent_assignments
  │                              │
  │                    company_business_lines
  │                              │
  │                        business_lines
  │
═══════════════════════════════════════════════════════════
                    WORK MANAGEMENT
═══════════════════════════════════════════════════════════

  tasks ────────────< subtasks (parent_task_id)
    │
    ├──── clarifications (agent ↔ human)
    │         │
    │         └── checkpoint_data (resume point)
    │
    ├──── notebooks (knowledge/context)
    │
    ├──── agent_jobs (execution queue)
    │         │
    │         └── job_messages (agent communication)
    │
    └──── audit_events (trace everything)

  projects ──< tasks
  projects ──< files
  projects ──< notebooks

═══════════════════════════════════════════════════════════
                    CRM + FINANCE
═══════════════════════════════════════════════════════════

  clients ──< leads ──< interactions
  clients ──< contracts
  clients ──< quotes
  
  accounts ──< expenses
  categories ──< expenses, tasks, files

═══════════════════════════════════════════════════════════
                    COMMUNICATION
═══════════════════════════════════════════════════════════

  conversations ──< messages
    │
    ├── link to: user, agent, task, company
    └── context: JSONB snapshot

═══════════════════════════════════════════════════════════
                    DEVICES + EXTERNAL
═══════════════════════════════════════════════════════════

  device_logs (camera, sensor, GPS)
  attendance_logs (chấm công)
  social_logs (facebook, zalo, tiktok)

═══════════════════════════════════════════════════════════
                    SYSTEM
═══════════════════════════════════════════════════════════

  command_log (mọi lệnh chat)
  ai_usage_log (token tracking)
  audit_events (mọi action)
  reminders
```

### 4.2. Task — 2 lớp state (học từ ClawTask)

```
WORKFLOW STATE (business, hiển thị cho người dùng):
  todo → in_progress → blocked → in_review → done
                         ↑                     │
                         └── (rejected) ───────┘

  blocked: khi có clarification chưa trả lời
  in_review: khi review_required=true và agent đã complete

EXECUTION STATE (technical, cho orchestration engine):
  idle → queued → picked → running → completed
                                        │
                                   ┌────┤
                                   │    └── failed → retry → queued
                                   │
                              cancelled

  idle: task mới tạo, chưa có agent nhận
  queued: đã gán agent, đợi agent poll
  picked: agent đã nhận, đang chuẩn bị
  running: đang xử lý
  completed: xong phần execution
  failed: lỗi, có thể retry

QUAN TRỌNG:
  scheduled_for ≠ due_date
  scheduled_for = "agent chỉ được pick task SAU thời điểm này"
  due_date = "deadline cho người dùng thấy"
```

### 4.3. Agent Registry (học từ ClawTask)

```
agents table:
  name:           "agent-phap-che"
  display_name:   "Luật sư Dẹo"
  type:           ai | human | hybrid | system
  status:         online | offline | sleeping | paused | error
  runtime_type:   openclaw | n8n | claude_code | manual
  capabilities:   ["contract_review", "legal_draft"]
  last_heartbeat: 2026-03-30T10:00:00Z
  heartbeat_interval_s: 300

STATUS TRANSITIONS:
  offline → online (heartbeat received)
  online → sleeping (no activity 30min)
  online → offline (miss 3 heartbeats)
  any → paused (admin pause)
  any → error (crash detected)
```

### 4.4. Clarification Flow (học từ ClawTask)

```
FLOW:
  1. Agent đang xử lý task
  2. Phát hiện thiếu data
  3. INSERT deo.clarifications:
     task_id, agent_id, question, blocks_execution=true,
     checkpoint_data={agent_state_at_this_point}
  4. UPDATE task: workflow_status → 'blocked'
  5. NOTIFY owner qua chat (Telegram/webapp)
  6. Owner trả lời (qua chat inline hoặc webapp /clarifications page)
  7. UPDATE clarification: answer, status='answered'
  8. UPDATE task: workflow_status → 'in_progress'
  9. Agent resume từ checkpoint_data
  10. Tiếp tục xử lý

VÍ DỤ:
  Agent Kế toán đang phân loại bill
  → OCR cho confidence 0.3
  → Tạo clarification: "Bill này category gì? Ảnh bị mờ"
  → Kèm ảnh bill trong checkpoint_data
  → Owner nhận Telegram: "❓ Kế toán hỏi: Bill này category gì? [Xem ảnh]"
  → Owner reply: "Ăn uống, quán phở Thìn"
  → Agent nhận answer → ghi expense với category "Ăn uống"
```

---

## 5. WEBAPP — THIẾT KẾ CHI TIẾT

### 5.1. Trang Chat — Trung tâm tương tác (trang quan trọng nhất)

```
/chat — 3 cột layout

COL 1: CONVERSATIONS (250px)
  Danh sách conversations, sort by last_message
  Filter: All | With agents | With staff | With clients
  Search
  + New conversation
  Badge: unread count

COL 2: CHAT THREAD (flex)
  Messages list (scroll, lazy load)
  Mỗi message:
    Avatar + sender name + timestamp
    Content (text/image/file/action result)
    Nếu là action: hiện card kết quả
      "✅ Đã ghi: Ăn sáng 50,000đ - VPBank"
    Nếu là clarification: hiện inline form
      "❓ Agent hỏi: Category gì?"
      [Input field] [Trả lời]
  
  Input bar:
    Text input | Attach file | Voice | Send
    Shortcut: @ mention agent, # link task

COL 3: CONTEXT PANEL (300px)
  Tự động hiện context liên quan conversation đang xem:
  
  IF conversation linked to client:
    Client card: name, company, contact
    Recent interactions (5)
    Active projects
    Open tasks
    Files
  
  IF conversation linked to task:
    Task card: title, status, assignee
    Subtasks
    Clarifications
    Notebooks
    Activity timeline
  
  IF conversation with agent:
    Agent card: status, capabilities
    Current tasks
    Token usage today
    Recent actions

SYNC:
  Telegram message → deo.messages → hiện trên webapp
  Webapp message → deo.messages → OpenClaw relay → Telegram
  Realtime qua WebSocket (socket.io)
```

### 5.2. Trang Tasks — Kanban + Detail

```
/tasks
  View toggle: Kanban | List | Calendar
  Filters: Company, Project, Assignee, Status, Agent

KANBAN: 5 columns
  TODO | IN PROGRESS | BLOCKED | IN REVIEW | DONE

TASK CARD:
  Title
  Assignee (avatar)
  Agent (if assigned)
  Priority badge
  Due date
  Company tag
  ❓ badge (if has open clarification)

CLICK TASK → SLIDE PANEL:
  Full detail: description, subtasks, files
  Clarifications section (answer inline)
  Notebooks section (view/create)
  Activity timeline (from audit_events)
  Chat thread (if linked conversation)
  [Open in chat] button
```

### 5.3. Trang Agents — Bảng điều khiển AI workforce

```
/agents
  Grid of agent cards:
    Status indicator (green/yellow/red)
    Name + emoji
    Capabilities tags
    Companies assigned
    Tasks: X active, Y completed today
    Tokens: used today / budget
    Last heartbeat
    [Chat] [Tasks] [Config] [Pause/Resume]

  Click agent → Detail:
    Performance metrics
    Task history
    Clarification history
    Token usage chart
    Notebooks created
    Config: SOUL.md preview
```

### 5.4. Trang Clarifications — Inbox cần trả lời

```
/clarifications
  PENDING tab (với badge count):
    Mỗi clarification:
      Agent hỏi (avatar + name)
      Question text
      Task link
      Context (ảnh, file nếu có)
      [Answer input] [Submit] [Skip]
      Priority + age

  ANSWERED tab:
    Recent answers (audit trail)

  Quan trọng: trang này cũng accessible từ Dashboard widget
  và từ Telegram inline (owner trả lời qua chat cũng được)
```

### 5.5. Trang Notebooks — Knowledge base

```
/notebooks
  Grid/List view
  Filter: Type (note/research/draft/knowledge), Project, Agent
  
  Notebook card:
    Title
    Type badge
    Linked entity (task/project/client)
    Created by (agent/user)
    Last updated
    Summary (nếu có)

  Click → Editor:
    Markdown editor
    Version history
    Tags
    Link to task/project/client
```

### 5.6. Trang Dashboard — Tổng quan

```
/dashboard
  Company selector
  Period selector

  Row 1: KPI cards
    Open tasks | Expenses total | New leads | Agents online
    Clarifications pending (click → /clarifications)

  Row 2: Charts
    Expense by category (pie)
    Task burn-down (line)
    Agent activity (bar)

  Row 3: Recent activity feed + Clarifications widget
```

---

## 6. API ROUTES — TOÀN BỘ

### 6.1. Hiện có (giữ nguyên + nâng cấp)

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/dashboard/summary
GET    /api/dashboard/charts

GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id

GET    /api/expenses
POST   /api/expenses
PATCH  /api/expenses/:id
GET    /api/expenses/summary

GET    /api/clients
POST   /api/clients
PATCH  /api/clients/:id

GET    /api/business-lines
POST   /api/business-lines

GET    /api/agent-jobs
POST   /api/agent-jobs
GET    /api/agent-jobs/:id
PATCH  /api/agent-jobs/:id
POST   /api/agent-jobs/:id/messages
POST   /api/agent-jobs/:id/retry
```

### 6.2. Mới — Orchestration

```
# Agent Registry
POST   /api/agents/register
POST   /api/agents/:id/heartbeat
GET    /api/agents
GET    /api/agents/:id
PATCH  /api/agents/:id
GET    /api/agents/:id/pull          ← agent poll tasks

# Worker Protocol (agent gọi)
POST   /api/tasks/:id/pick
POST   /api/tasks/:id/progress
POST   /api/tasks/:id/complete
POST   /api/tasks/:id/fail
POST   /api/tasks/:id/request-review

# Clarifications
GET    /api/clarifications?status=open
POST   /api/clarifications
PATCH  /api/clarifications/:id       ← human trả lời
GET    /api/clarifications/pending    ← dashboard widget

# Notebooks
GET    /api/notebooks?task_id=&project_id=
POST   /api/notebooks
GET    /api/notebooks/:id
PATCH  /api/notebooks/:id

# Chat / Conversations
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages
GET    /api/conversations/:id/context  ← context engine

# Audit
GET    /api/audit?entity_type=&entity_id=

# Leads + Interactions (CRM mở rộng)
GET    /api/leads
POST   /api/leads
PATCH  /api/leads/:id
GET    /api/interactions?client_id=
POST   /api/interactions
```

---

## 7. CONTEXT ENGINE — BỘ NÃO CỦA HỆ THỐNG

### 7.1. Cách hoạt động

```
KHI CÓ INPUT (chat message, webapp action, API call):

context.service.ts tự động gom:

1. WHO — Ai đang tương tác?
   → deo.users WHERE telegram_id = X
   → deo.staff_assignments (companies, roles)

2. ABOUT WHAT — Liên quan entity nào?
   → NLP extract: tên client, project code, keywords
   → Match: deo.clients, deo.projects, deo.tasks

3. HISTORY — Đã tương tác gì trước?
   → deo.interactions WHERE client_id = X (gần nhất)
   → deo.command_log WHERE user_id = X (pattern)
   → deo.conversations (chat history)

4. STATE — Tình trạng hiện tại?
   → deo.tasks WHERE project_id = X AND status != 'done'
   → deo.clarifications WHERE status = 'open'
   → deo.expenses summary cho period

5. FILES — Tài liệu liên quan?
   → deo.files WHERE project_id = X
   → deo.contracts WHERE client_id = X
   → deo.notebooks WHERE project_id = X

OUTPUT: context JSON
{
  "user": {...},
  "companies": [...],
  "related_client": {...},
  "related_project": {...},
  "open_tasks": [...],
  "recent_interactions": [...],
  "pending_clarifications": [...],
  "relevant_files": [...],
  "relevant_notebooks": [...]
}

→ Gửi cho AI agent khi parse command
→ Hiện ở Context Panel khi xem conversation
→ KHÔNG bao giờ hỏi lại cái đã biết
```

### 7.2. Context trong chat

```
Owner nhắn Telegram: "rà hợp đồng Valnex"

Context Engine tự động:
├── "Valnex" → match deo.clients WHERE name ILIKE '%valnex%'
├── Client Valnex → deo.projects WHERE client_id = valnex.id
├── Projects → deo.contracts WHERE project_id IN (...)
├── Latest contract → file URL, status, key terms
├── History → deo.interactions (lần cuối liên hệ)
└── Agent phù hợp → capabilities LIKE '%contract_review%'

Dẹo Admin nhận context + raw command:
→ Biết: Valnex là ai, project nào, HĐ nào, agent nào xử lý
→ Tạo task: "Rà hợp đồng Valnex Q2"
→ Assign: agent-phap-che
→ Attach: contract file
→ Không cần hỏi thêm gì
```

---

## 8. EVENT SYSTEM — BẮT ĐẦU ĐƠN GIẢN

### 8.1. Phase 1: DB-based events (làm ngay)

```typescript
// services/event.service.ts

interface DeoEvent {
  type: string;          // 'task.created', 'expense.added'
  actor: { type: string; id: string };
  entity: { type: string; id: string };
  data: any;
  timestamp: Date;
}

class EventService {
  async emit(event: DeoEvent) {
    // 1. INSERT audit_events
    await db.query(`INSERT INTO deo.audit_events ...`);
    
    // 2. Notify handlers (in-process)
    for (const handler of this.handlers[event.type] || []) {
      await handler(event);
    }
  }

  on(eventType: string, handler: Function) {
    this.handlers[eventType].push(handler);
  }
}

// Usage:
eventService.on('task.created', async (e) => {
  await notifyAssignee(e);
  await updateDashboardCache(e);
});

eventService.on('clarification.answered', async (e) => {
  await resumeAgentTask(e);
});

eventService.on('agent_job.failed', async (e) => {
  await alertOwner(e);
  await scheduleRetry(e);
});
```

### 8.2. Phase 2: Redis queue (khi cần)

```
Khi event handlers chậm hoặc cần async:
→ Emit event vào Redis queue (BullMQ)
→ Worker process consume và xử lý
→ Không block API response
```

### 8.3. Phase 3: NATS/RabbitMQ (khi scale)

```
Khi cần multi-service hoặc multi-VPS:
→ NATS JetStream hoặc RabbitMQ
→ Chỉ thay transport layer, logic giữ nguyên
```

---

## 9. VPS DEPLOYMENT

### 9.1. Target setup

```
VPS Ubuntu (DigitalOcean/Vultr $14-24/tháng):
├── Docker + Docker Compose
├── Postgres 16 (container)
├── Redis 7 (container)
├── deo-api (container)
├── deo-web (container)
├── deo-worker (container)       ← MỚI: agent worker daemon
├── Nginx (container, reverse proxy)
├── Cloudflare Tunnel (container)
└── n8n (container hoặc npm)

Domain: enterpriseos.bond
  dash.enterpriseos.bond → web:3000
  api.enterpriseos.bond  → api:3001
  n8n.enterpriseos.bond  → n8n:5678
```

### 9.2. docker-compose.prod.yml

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "256mb"]

  api:
    build: ./apps/api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres: { condition: service_healthy }

  web:
    build: ./apps/web
    restart: unless-stopped
    depends_on: [api]

  worker:
    build: ./apps/api
    restart: unless-stopped
    command: ["node", "dist/worker.js"]
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres: { condition: service_healthy }

  nginx:
    image: nginx:1.27-alpine
    ports: ["80:80"]
    volumes:
      - ./infrastructure/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on: [web, api]

  tunnel:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}

volumes:
  pg_data:
```

### 9.3. Deploy script

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

# 1. Pull latest
git pull origin main

# 2. Run migrations
for f in infrastructure/postgres/0*.sql; do
  echo "Running: $f"
  docker compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < "$f" 2>/dev/null || true
done

# 3. Build + restart
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 4. Health check
sleep 10
curl -sf http://localhost:3001/api/health || echo "API health check failed"
curl -sf http://localhost:3000 || echo "Web health check failed"

echo "Deploy complete"
```

---

## 10. ROLLOUT PLAN

### Phase 0 — Đóng gói + Deploy VPS (3 ngày)

```
□ Git: .gitignore → git add → commit → push GitHub
□ Fix: rà .env, cleanup code
□ VPS: mua + cài Docker
□ Clone repo → docker compose up
□ Cloudflare Tunnel → 3 hostnames
□ Verify: dash/api/n8n accessible từ internet
```

### Phase 1 — Orchestration DB + Agent Protocol (1 tuần)

```
□ Chạy 005_orchestration_upgrade.sql
□ API routes mới: agents, clarifications, notebooks, conversations
□ Service layer: task.service, context.service, event.service
□ Audit middleware
□ Test: agent register → heartbeat → poll → pick → complete
□ Test: clarification create → answer → resume
```

### Phase 2 — Webapp Chat Center (1 tuần)

```
□ /chat page: 3 cột (conversations, thread, context)
□ WebSocket realtime
□ Telegram ↔ webapp message sync
□ Clarification inline trong chat
□ Context panel auto-populate
□ /clarifications page
□ /agents page
```

### Phase 3 — Nâng Tasks + CRM (1 tuần)

```
□ Kanban nâng cấp: 5 columns, drag & drop
□ Task detail slide panel (subtasks, clarifications, notebooks, activity)
□ CRM lead pipeline
□ Interaction logging
□ Notebooks CRUD
□ Dashboard charts
```

### Phase 4 — Polish + Scale (liên tục)

```
□ Package hóa: auth, audit, events, vietnam
□ Worker daemon (background job processing)
□ Redis queue cho event handlers
□ Token budget tracking per agent per company
□ Recurring tasks
□ Zalo OA integration
□ Mobile responsive
□ Template system: owner → Dẹo → agents → review
□ n8n workflow cho expense, email intake, reminders
```

---

## 11. QUYẾT ĐỊNH KIẾN TRÚC (ADR)

```
ADR-001: Dùng DB-based job queue trước, không Redis/NATS
  Lý do: đơn giản, đủ cho <1000 jobs/ngày, dễ debug
  Khi nào upgrade: queue > 1000/ngày hoặc latency > 5s

ADR-002: Giữ Express, không chuyển NestJS
  Lý do: codebase đã có, team quen, đủ cho scope hiện tại
  Khi nào xét lại: khi cần DI phức tạp hoặc team > 5 dev

ADR-003: React + Vite, không Next.js
  Lý do: SPA đủ cho dashboard/webapp, deploy đơn giản hơn
  Frontend đã code bằng Vite rồi, giữ nguyên

ADR-004: 1 VPS Docker Compose, không K8s
  Lý do: 1 VPS đủ cho 1-2 năm đầu, K8s overkill
  Khi nào upgrade: cần multi-region hoặc auto-scaling

ADR-005: Audit trail dùng append-only table
  Lý do: đơn giản, query được, không cần hệ thống riêng
  Khi nào upgrade: khi cần search/analytics trên audit data

ADR-006: Context engine query trực tiếp DB
  Lý do: DB nhỏ, query nhanh, không cần cache layer
  Khi nào upgrade: khi context query > 100ms

ADR-007: Học ClawTask primitive, không dùng ClawTask service
  Lý do: giữ data ownership, không phụ thuộc platform ngoài
  Primitive lấy: clarification, notebook, 2-layer states, heartbeat

ADR-008: Học Viet-ERP pattern, không bê nguyên
  Lý do: quá nặng, quá nhiều dependency
  Pattern lấy: package hóa, audit, event-driven, vietnam layer
```

---

## TÓM TẮT 1 ĐOẠN

Dẹo Enterprise OS v5 là nền tảng vận hành doanh nghiệp kết hợp AI và con người, trong đó chat là giao diện chính (80% tương tác) và webapp là bảng điều khiển visual. Hệ thống học primitive từ ClawTask (clarification, notebook, 2-layer task states, agent heartbeat) và pattern từ Viet-ERP (package hóa, audit trail, event-driven, Vietnam layer) nhưng build tất cả trong deo-os, giữ data ownership. Agent không đoán khi thiếu data mà tạo clarification hỏi human. Context engine tự gom thông tin từ database — không bao giờ hỏi lại cái đã biết. Deploy trên 1 VPS Docker Compose, scale dần khi cần.
