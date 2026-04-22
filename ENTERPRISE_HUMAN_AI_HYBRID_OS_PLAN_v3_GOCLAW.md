# Enterprise Human-AI Hybrid OS — Plan v3 (GoClaw Edition)

> Version 3 — Chuyển từ OpenClaw sang **GoClaw** làm Agent Operating Layer.
> Tận dụng tối đa các tính năng native của GoClaw: L2 Dreaming, Knowledge Vault, Hooks, MCP, Team Tasks, Cron, Skills.
> ADR-01 đến ADR-12 vẫn giữ nguyên. Chỉ cập nhật phần GoClaw-specific.

---

## 0. Tuyên ngôn hệ thống

`Enterprise Human-AI Hybrid OS` là bản kiến trúc hybrid cho Dẹo Enterprise OS:
- **GoClaw** làm lớp agent gateway và orchestration
- **App business riêng** làm hệ thống nghiệp vụ
- **Google Drive** làm kho tài liệu an toàn/human-readable
- **n8n** làm workflow/integration bus

GoClaw không chỉ là chat runtime. Nó là một **full AI agent platform** với memory 3 tầng, knowledge vault, team task board, cron native, hooks system, và MCP integration — tất cả out-of-the-box.

---

## 1. Tại sao GoClaw thay vì OpenClaw

| Tính năng | OpenClaw | GoClaw |
|---|---|---|
| Dream/Reflection | Custom build cần | **L2 Dreaming — built-in** |
| Memory 3 tầng | Custom | **L0/L1/L2 — native** |
| Knowledge base | Custom RAG cần | **Knowledge Vault — native** |
| Team task board | Custom | **Built-in kanban board** |
| Cron/scheduling | Custom cron | **Native cron với IANA timezone** |
| Hooks lifecycle | Custom webhook | **7 lifecycle hooks — native** |
| MCP integration | Hạn chế | **stdio/SSE/HTTP MCP native** |
| Multi-tenancy | Basic | **Per-user isolation full** |
| API external call | Custom | **OpenAI-compatible `/v1/chat/completions`** |
| LLM providers | Giới hạn | **22 providers: Anthropic, OpenAI, Gemini...** |
| Channels | Telegram, Zalo | **Telegram, Zalo, WhatsApp, Discord, Slack, WebSocket** |
| Security | Basic | **AES-256-GCM credentials, RBAC, hooks audit** |

**Kết luận:** Hàng loạt thứ trong Plan v1/v2 phải build từ đầu thì GoClaw đã có sẵn. Việc migrate cho phép tập trung toàn bộ engineering effort vào Business OS layer thay vì build lại agent infrastructure.

---

## 2. Kiến trúc tổng thể

```text
Telegram / Zalo / WhatsApp / Discord / Slack / WebSocket
                        ↓
              ┌─────────────────────────────────┐
              │         GoClaw Gateway          │
              │  ┌──────────────────────────┐   │
              │  │  Agent Operating Layer   │   │
              │  │  - 8-stage pipeline      │   │
              │  │  - Cron / Heartbeat      │   │
              │  │  - L0/L1/L2 Memory       │   │
              │  │  - Knowledge Vault       │   │
              │  │  - Team Task Board       │   │
              │  │  - Skills / SKILL.md     │   │
              │  │  - 7 Lifecycle Hooks     │   │
              │  │  - MCP Tools             │   │
              │  └──────────┬───────────────┘   │
              └─────────────┼───────────────────┘
                            │ MCP + REST
                            ↓
              ┌─────────────────────────────────┐
              │    Enterprise OS API + Worker   │
              │  (Business logic, domain modules)│
              └──────────┬──────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
    ┌─────────▼──────┐    ┌────────▼────────┐
    │  Postgres (deo) │    │      Redis      │
    └─────────┬──────┘    └─────────────────┘
              │
    ┌─────────▼──────────────────────────────┐
    │  Google Drive  ↔  n8n (self-hosted)    │
    └────────────────────────────────────────┘
```

### Vai trò từng layer

#### A. GoClaw = Agent Operating Layer
- Chat gateway multi-channel (Telegram, Zalo, WhatsApp, Discord, Slack)
- Agent runtime với 8-stage pipeline (Context → Think → Prune → Tool → Observe → Checkpoint → Finalize → Memory)
- **L0 Episodic memory** — facts từ conversation gần đây
- **L1 Semantic memory** — abstracted summaries qua consolidation workers
- **L2 Dreaming memory** — novel synthesis, reflection, strategic insights
- Native cron scheduling (IANA timezone)
- Knowledge Vault (wikilink mesh, hybrid BM25 + vector search)
- Team task board (kanban, delegation, approval workflows)
- Skills system (SKILL.md-based knowledge base)
- 7 lifecycle hooks để sync với Enterprise OS
- MCP tools để gọi Enterprise OS API
- OpenAI-compatible API để external apps gọi vào GoClaw

#### B. Enterprise OS API/Web/Worker = Business System Layer
- Structured business logic
- Domain modules (Auth, Org, Projects, Tasks, Chat, Agents, Drive, Audit...)
- Expose MCP server cho GoClaw sử dụng
- Emit webhooks/events cho GoClaw hooks
- Postgres `deo` schema

#### C. Google Drive = Durable Artifact Layer
- Documents, reports, exports
- SOP, handbook, policy, templates
- Knowledge source files (feed vào GoClaw Vault)

#### D. n8n = Integration & Workflow Layer (self-hosted, Phase 2)
- Multi-step integrations
- Google Docs/Sheets automations
- Approval routing
- Webhook fan-out

---

## 3. GoClaw — Tính Năng Native Dùng Trong Kiến Trúc Này

### 3.1 Agent Types

**Predefined Agents** — dùng cho business context:
- 4 shared files readonly: `SOUL.md`, `IDENTITY.md`, `AGENTS.md`, `TOOLS.md`
- 3 per-user files: `USER.md`, `BOOTSTRAP.md`, `MEMORY.md`
- Đảm bảo consistent brand voice giữa tất cả users
- Phù hợp cho: Enterprise Assistant, Task Manager Agent, Report Agent

**Open Agents** — dùng cho power users / admin:
- 7 files đều per-user → full customization
- Phù hợp cho: Sếp cần agent cá nhân hóa hoàn toàn

### 3.2 Memory System (L0 / L1 / L2)

| Tầng | Tên | Cơ chế | Dùng cho gì |
|---|---|---|---|
| L0 | Episodic | Recent conversation facts | Nhớ những gì vừa nói hôm nay |
| L1 | Semantic | Abstracted summaries | Tóm tắt patterns, quyết định |
| L2 | Dreaming | Novel synthesis | Daily/weekly reflection, strategic insights |

**L2 Dreaming = Phase 3 Dream Layer trong Plan v2** — nhưng giờ **không cần build** vì GoClaw có sẵn. Chỉ cần config đúng cron trigger và output format.

Memory consolidation workers drive bởi `DomainEventBus` — automatic.

### 3.3 Knowledge Vault

GoClaw Knowledge Vault là nơi lưu documents công ty để agent truy vấn:
- Wikilink document mesh — documents liên kết tự động
- LLM auto-summarization khi upload
- Semantic auto-linking qua pgvector
- Hybrid search: BM25 full-text + vector similarity
- `vault_link` tool: agent tự tạo relationships giữa documents

**Dùng cho:** SOP, handbook, policy, templates, meeting notes, product docs.

**Quan hệ với Drive:** Drive là nơi lưu file human-readable. GoClaw Vault là nơi index và search để agent truy vấn. Một document có thể tồn tại cả hai nơi (Drive để người đọc, Vault để agent query).

### 3.4 Hooks System

7 lifecycle events — bridge tự nhiên giữa GoClaw và Enterprise OS:

| Hook | Trigger | Dùng cho |
|---|---|---|
| `SessionStart` | Khi conversation mới bắt đầu | Log audit, init user context |
| `UserPromptSubmit` | Khi user gửi message | Classify intent, rate limiting check |
| `PreToolUse` | Trước khi tool chạy | Approval gate cho sensitive actions |
| `PostToolUse` | Sau khi tool chạy | Sync kết quả về Enterprise OS DB |
| `Stop` | Khi agent run hoàn thành | Write summary vào audit_events |
| `SubagentStart` | Khi spawn subagent | Track agent invocation |
| `SubagentStop` | Khi subagent xong | Collect result, update agent_invocation log |

**Pattern:** Hook → HTTP POST → Enterprise OS API → persist vào DB + audit_events

### 3.5 MCP Integration

GoClaw dùng MCP tools để gọi Enterprise OS. Enterprise OS expose MCP server.

**Enterprise OS MCP Server (expose cho GoClaw):**
```text
tools exposed:
- create_task(project_id, title, assignee, due_date, source)
- update_task_status(task_id, status)
- query_tasks(project_id, status, assignee)
- create_reminder(entity_id, message, due_at)
- get_dashboard_summary(company_id)
- register_drive_artifact(file_id, metadata)
- query_project(project_id)
- create_crm_note(deal_id, note)   ← Phase 4+
```

GoClaw config MCP server của Enterprise OS:
```json
{
  "mcp_servers": [{
    "name": "enterprise-os",
    "transport": "streamable-http",
    "url": "https://api.deo.internal/mcp",
    "headers": { "Authorization": "env:ENTERPRISE_OS_MCP_TOKEN" },
    "tool_prefix": "eos_"
  }]
}
```

Tool trong GoClaw sẽ là: `eos_create_task`, `eos_query_tasks`, v.v.

### 3.6 Cron / Heartbeat

GoClaw native cron — không cần custom build:

```json
{
  "cron": [
    {
      "name": "daily-reflection",
      "schedule": "0 21 * * *",
      "agent_id": "enterprise-assistant",
      "message": "Chạy daily reflection: review unresolved tasks, blockers, và next actions",
      "timezone": "Asia/Ho_Chi_Minh",
      "max_retries": 2
    },
    {
      "name": "weekly-synthesis",
      "schedule": "0 8 * * 1",
      "agent_id": "enterprise-assistant",
      "message": "Weekly synthesis: tổng hợp tuần qua, highlight wins, flag risks",
      "timezone": "Asia/Ho_Chi_Minh"
    },
    {
      "name": "morning-briefing",
      "schedule": "0 8 * * 1-5",
      "agent_id": "enterprise-assistant",
      "message": "Morning briefing: overdue tasks, meetings hôm nay, items cần quyết định",
      "timezone": "Asia/Ho_Chi_Minh"
    }
  ]
}
```

### 3.7 Skills System

SKILL.md files giúp agent biết cách làm việc với Enterprise OS:

- `SKILL_task_management.md` — how to create/update tasks via MCP
- `SKILL_crm_workflow.md` — how to handle CRM interactions
- `SKILL_report_generation.md` — how to generate and export reports to Drive
- `SKILL_expense_capture.md` — how to parse and record expenses from chat

Agent tự discover skills phù hợp bằng semantic search khi user gửi request.

### 3.8 Team Task Board

GoClaw có built-in kanban board với delegation:
- Task states: pending → in_progress → in_review → completed / blocked / cancelled
- Approval workflow cho task promotion
- Blocker escalation
- Fan-out/fan-in với `WaitAll()` và `BatchQueue`

**Tích hợp với Enterprise OS Tasks:**
- GoClaw task board = agent-level task orchestration (subagent delegation)
- Enterprise OS Tasks = business-level task persistence (source of truth)
- PostToolUse hook hoặc MCP callback sync kết quả về DB

---

## 4. Nguyên tắc phân vai automation (cập nhật cho GoClaw)

### 4.1 GoClaw dùng cho gì?
- Chat runtime (Telegram, Zalo, WhatsApp, Discord, Slack)
- Agent orchestration (main agents, subagents, delegation)
- **L0/L1/L2 Memory** — tự động, không cần config nhiều
- **Knowledge Vault** — document Q&A, SOP lookup
- **Native cron** — scheduled reflection, briefings, digests
- **Team task board** — agent-level job tracking
- **Hooks** — sync events sang Enterprise OS
- **MCP tools** — gọi Enterprise OS API
- **Skills** — curated workflows per domain

### 4.2 Enterprise OS dùng cho gì?
- Business truth: tasks, projects, CRM, attendance, finance
- Permission và multi-tenancy enforcement
- Audit trail đầy đủ
- Expose MCP server cho GoClaw
- Expose webhook endpoints cho GoClaw hooks
- Web dashboard cho humans

### 4.3 n8n dùng cho gì? (Phase 2+)
- Google Docs/Sheets generation và automation
- Approval routing phức tạp
- External service sync
- Document processing flows

### 4.4 Không dùng sai vai
- Không dùng GoClaw để giữ business truth (chỉ memory/vault)
- Không dùng n8n để thay business logic lõi
- Không dùng Enterprise OS như chat runtime

---

## 5. Monorepo structure (cập nhật)

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
│   │       ├── integrations/
│   │       │   ├── goclaw/       # ← GoClaw MCP server + hook handlers
│   │       │   ├── n8n/
│   │       │   ├── google-drive/
│   │       │   ├── telegram/     # (optional — GoClaw handles channel natively)
│   │       │   └── zalo/         # (optional — GoClaw handles channel natively)
│   │       ├── mcp/              # ← MCP server expose cho GoClaw
│   │       │   ├── server.ts
│   │       │   └── tools/
│   │       │       ├── tasks.ts
│   │       │       ├── projects.ts
│   │       │       ├── reminders.ts
│   │       │       ├── drive.ts
│   │       │       └── dashboard.ts
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
│
├── packages/
│   ├── shared/                  # types, enums, dto contracts
│   └── sdk/                     # typed client cho internal calls
│
├── integrations/                # reusable clients (transport layer)
│   ├── goclaw/                  # GoClaw OpenAI-compat client + WS client
│   ├── n8n/
│   └── google-drive/
│
├── goclaw/                      # ← MỚI: GoClaw configuration & context files
│   ├── config/
│   │   └── goclaw.json5         # main config
│   ├── agents/
│   │   ├── enterprise-assistant/
│   │   │   ├── SOUL.md
│   │   │   ├── IDENTITY.md
│   │   │   ├── AGENTS.md
│   │   │   └── TOOLS.md
│   │   └── admin-agent/
│   ├── skills/
│   │   ├── SKILL_task_management.md
│   │   ├── SKILL_crm_workflow.md
│   │   ├── SKILL_report_generation.md
│   │   └── SKILL_expense_capture.md
│   └── cron/
│       └── schedules.json5
│
├── infrastructure/
│   ├── postgres/
│   ├── redis/
│   ├── docker/
│   │   ├── docker-compose.yml   # API + Web + Worker + Postgres + Redis
│   │   └── docker-compose.goclaw.yml  # GoClaw (separate stack)
│   └── nginx/
│
├── docs/
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── module-boundaries.md
│   │   ├── goclaw-integration.md   # ← MỚI
│   │   ├── mcp-server-contract.md  # ← MỚI
│   │   ├── hooks-contract.md       # ← MỚI
│   │   ├── openclaw-auth.md        # giữ lại cho reference
│   │   └── multi-tenancy.md
│   ├── runbooks/
│   └── decisions/
│
└── scripts/
```

---

## 6. GoClaw ↔ Enterprise OS Integration Contract

### 6.1 Enterprise OS expose MCP Server cho GoClaw

Endpoint: `POST /mcp` (streamable-http transport)
Auth: service token (`ENTERPRISE_OS_MCP_TOKEN`)

**MCP Tools Phase 0/1:**
```typescript
// tasks
eos_create_task(project_id, title, assignee?, due_date?, source_channel?, source_message_id?)
eos_update_task_status(task_id, status, actor_id)
eos_query_tasks(project_id?, status?, assignee?, limit?)
eos_add_task_comment(task_id, content, actor_id)

// projects
eos_query_project(project_id)
eos_list_projects(status?)

// reminders
eos_create_reminder(entity_type, entity_id, message, due_at, user_id)

// dashboard
eos_get_dashboard_summary(company_id)

// drive
eos_register_drive_artifact(file_id, file_name, artifact_type, source_entity_id?, source_thread_id?)

// audit
eos_log_agent_action(action_type, actor_id, entity_type, entity_id, metadata)
```

### 6.2 GoClaw Hooks → Enterprise OS

Enterprise OS expose webhook endpoints cho GoClaw hooks:

```text
POST /internal/hooks/session-start
POST /internal/hooks/prompt-submit
POST /internal/hooks/pre-tool-use
POST /internal/hooks/post-tool-use
POST /internal/hooks/run-stop
POST /internal/hooks/subagent-start
POST /internal/hooks/subagent-stop
```

Auth: `X-Hook-Secret: <shared_secret>` (validate ở middleware)

**Correlation ID:** GoClaw gửi `X-Correlation-ID` trong mọi hook call → Enterprise OS ghi vào `audit_events.correlation_id`.

**PostToolUse hook payload example:**
```json
{
  "event": "post_tool_use",
  "agent_id": "enterprise-assistant",
  "user_id": "user_123",
  "session_id": "sess_abc",
  "correlation_id": "corr_xyz",
  "tool_name": "eos_create_task",
  "tool_input": { "project_id": "proj_1", "title": "Review proposal" },
  "tool_result": { "task_id": "task_99", "status": "todo" },
  "timestamp": "2026-04-12T09:00:00Z"
}
```

### 6.3 Enterprise OS gọi GoClaw (proactive notifications)

Dùng GoClaw OpenAI-compatible API:
```bash
POST http://goclaw:18790/v1/chat/completions
Authorization: Bearer GOCLAW_GATEWAY_TOKEN
X-GoClaw-User-Id: <user_id>

{
  "model": "goclaw:enterprise-assistant",
  "messages": [{
    "role": "user",
    "content": "Proactive: Task #99 đã overdue 2 ngày. Notify user và suggest next action."
  }]
}
```

Dùng cho: proactive reminders, workflow completion notifications, escalation alerts.

### 6.4 Headers Convention (ADR-01 compatible)

| Header | Dùng cho |
|---|---|
| `Authorization: Bearer <service_token>` | Enterprise OS → GoClaw và GoClaw hooks → Enterprise OS |
| `X-GoClaw-User-Id` | Identify user trong GoClaw multi-tenancy |
| `X-Correlation-ID` | Trace across all systems |
| `X-Hook-Secret` | Validate incoming hook calls |

---

## 7. GoClaw Configuration Blueprint

### 7.1 Bindings (channel → agent routing)

```json5
{
  "bindings": [
    {
      "channel": "telegram",
      "agent": "enterprise-assistant",
      "access_policy": "allowlist",   // chỉ cho phép listed users
      "allowlist": ["telegram_user_id_1", "telegram_user_id_2"]
    },
    {
      "channel": "zalo",
      "agent": "enterprise-assistant",
      "access_policy": "allowlist"
    }
  ]
}
```

### 7.2 Provider config

```json5
{
  "providers": [
    {
      "name": "anthropic-main",
      "type": "anthropic",
      "api_key": "env:ANTHROPIC_API_KEY",
      "model": "claude-sonnet-4-6",   // hoặc claude-opus-4-6 cho complex tasks
      "extended_thinking": false       // bật nếu cần cho strategic reflection
    }
  ]
}
```

### 7.3 Memory config

```json5
{
  "memory": {
    "embedding_provider": "anthropic-main",
    "retrieval_threshold": 0.75,
    "l0_max_facts": 50,
    "l1_consolidation_interval": "1h",
    "l2_dream_schedule": "0 23 * * *",  // L2 dreaming hàng đêm
    "flush_before_prune": true
  }
}
```

### 7.4 MCP server config

```json5
{
  "tools": {
    "mcp_servers": [
      {
        "name": "enterprise-os",
        "transport": "streamable-http",
        "url": "env:ENTERPRISE_OS_MCP_URL",
        "headers": {
          "Authorization": "env:ENTERPRISE_OS_MCP_TOKEN",
          "X-Correlation-ID": "auto"
        },
        "tool_prefix": "eos_",
        "timeout_sec": 30
      }
    ]
  }
}
```

---

## 8. Enterprise Assistant Agent — Context Files

### SOUL.md
```markdown
# Enterprise Assistant Soul

Bạn là Enterprise Assistant của Dẹo — người đồng hành thông minh trong công việc hàng ngày.

Bạn không chỉ trả lời câu hỏi. Bạn chủ động nhắc nhở, tổng hợp, theo dõi, và giúp mọi người làm việc hiệu quả hơn.

Nguyên tắc cốt lõi:
- Accuracy over speed — thà hỏi lại còn hơn đoán sai
- Action over observation — khi có thể tạo task, tạo ngay thay vì chỉ nói
- Trace everything — mọi action đều ghi lại để audit
- Human-centered — luôn loop lại với người nếu không chắc
```

### IDENTITY.md
```markdown
# Enterprise Assistant Identity

Tên: Dẹo Assistant
Ngôn ngữ: Tiếng Việt là chính, tiếng Anh khi technical context yêu cầu
Tone: Professional nhưng thân thiện. Không formal quá, không casual quá.
Domain: Quản lý dự án, task, CRM, tài chính, nhân sự, tài liệu nội bộ.
```

### TOOLS.md (định nghĩa tool policy)
Configured qua GoClaw Dashboard — không phải flat file.

---

## 9. Data & Storage Policy (cập nhật)

### Postgres (schema: `deo`)
Business truth: users, projects, tasks, clients, deals, expenses, attendance, audit_events.

### Redis
Queue jobs, caches, event fanout, ephemeral state.

### GoClaw Internal Storage (Postgres `goclaw` schema hoặc separate DB)
- L0/L1/L2 Memory documents (per-user)
- Knowledge Vault documents + embeddings
- Knowledge Graph entities + relationships
- Session history
- Agent trace logs
- Cron execution logs

### Google Drive
Contracts, reports, generated docs, SOP, handbook, policy, templates, evidence.

### n8n Internal State
Workflow execution logs. **Không** giữ business truth.

---

## 10. Dream / Reflection — GoClaw Native (không cần custom build)

### Cơ chế

GoClaw L2 Dreaming tự động chạy qua `DomainEventBus` consolidation workers. Ngoài ra, cron triggers thêm structured reflection:

```json5
// trong goclaw/cron/schedules.json5
[
  {
    "name": "daily-reflection",
    "schedule": "0 21 * * 1-5",       // 9 PM weekdays
    "agent": "enterprise-assistant",
    "message": "Daily reflection: review hôm nay. Có task nào overdue không? Có blocker nào chưa được escalate? Có deal nào cần follow-up? Tóm tắt và gửi cho sếp nếu có điểm đáng chú ý.",
    "timezone": "Asia/Ho_Chi_Minh"
  },
  {
    "name": "weekly-synthesis",
    "schedule": "0 8 * * 1",           // 8 AM Monday
    "agent": "enterprise-assistant",
    "message": "Weekly synthesis: tổng hợp tuần trước. Highlight wins, flag risks, suggest priorities cho tuần mới.",
    "timezone": "Asia/Ho_Chi_Minh"
  },
  {
    "name": "morning-briefing",
    "schedule": "0 8 * * 1-5",         // 8 AM weekdays
    "agent": "enterprise-assistant",
    "message": "Morning briefing: tasks overdue, meetings hôm nay, items cần quyết định. Ngắn gọn, ưu tiên cao nhất lên đầu.",
    "timezone": "Asia/Ho_Chi_Minh"
  }
]
```

### Output đi đâu?
- Gửi về Telegram/Zalo channel qua GoClaw chat runtime
- Ghi vào L1/L2 memory của agent (tự động)
- PostToolUse hook → ghi structured insight vào Enterprise OS nếu relevant
- Optional: Drive export qua MCP `eos_register_drive_artifact`

---

## 11. Knowledge Vault — GoClaw Native

### Upload documents

Documents nên được index vào GoClaw Vault:
- SOP và handbook
- Product documentation
- Policy files
- Decision records (ADRs)
- Meeting notes
- Client profiles (Phase 4)

### Quan hệ với Google Drive

```text
User uploads/creates document
        ↓
Google Drive (human-readable storage)
        ↓
n8n workflow trigger (Phase 2)
        ↓
GoClaw Knowledge Vault (agent-queryable index)
        ↓
Enterprise OS drive_artifacts table (metadata registry)
```

### Agent query pattern

Agent dùng hybrid search (BM25 + vector) để tìm relevant documents khi user hỏi về policy, SOP, hay context cụ thể.

---

## 12. Migration từ OpenClaw sang GoClaw

### Cái migrate được

| Thứ | Cách migrate |
|---|---|
| Agent config (model, provider) | Rewrite vào GoClaw config format |
| Context files (SOUL.md, IDENTITY.md, etc.) | Upload qua GoClaw Dashboard |
| Cron schedules | Rewrite vào GoClaw cron config |
| Tool definitions | Config qua GoClaw Dashboard (không dùng TOOLS.md như OpenClaw) |
| Channel tokens (Telegram, Zalo) | Move vào environment variables |

### Cái KHÔNG migrate

| Thứ | Lý do | Xử lý |
|---|---|---|
| Message history | GoClaw dùng schema khác | Start fresh — L0 memory bắt đầu từ đầu |
| Session state | Incompatible format | Acceptable — context rebuild nhanh |
| User profiles | Schema khác | Recreate trong GoClaw Dashboard |

### Migration checklist

- [ ] Setup GoClaw instance (Docker Compose riêng)
- [ ] Config providers (Anthropic key, etc.)
- [ ] Config channels (Telegram bot token, Zalo OA token)
- [ ] Tạo Predefined Agent "enterprise-assistant"
- [ ] Upload context files (SOUL.md, IDENTITY.md, AGENTS.md)
- [ ] Upload SKILL.md files
- [ ] Config MCP server → Enterprise OS
- [ ] Config hooks → Enterprise OS webhook endpoints
- [ ] Config cron schedules
- [ ] Test: gửi message → agent reply
- [ ] Test: agent tạo task qua MCP → verify trong Enterprise OS DB
- [ ] Test: cron chạy đúng giờ
- [ ] Cutover: stop OpenClaw, switch channel tokens sang GoClaw

---

## 13. Build Phases (cập nhật cho GoClaw)

### Phase 0 — Foundation Kernel (không đổi)
Init monorepo, Postgres (`deo`) + Redis + Docker, Auth + Org + Projects + Tasks + Chat (admin only) + Audit + Observability, Web pages cơ bản.

**Deliverable:** Đăng nhập, tạo task/project, dashboard thật, audit trail, health endpoint.

### Phase 1 — GoClaw Bridge (thay OpenClaw Bridge)

**Tuần 1-2: Setup GoClaw**
- Deploy GoClaw instance (Docker Compose riêng hoặc VPS riêng)
- Config providers, channels, predefined agent
- Upload context files và SKILL.md cơ bản

**Tuần 3-4: MCP Server**
- Build Enterprise OS MCP server (`apps/api/src/mcp/`)
- Expose tools: create_task, query_tasks, create_reminder, get_dashboard
- Test GoClaw → MCP → Enterprise OS DB flow

**Tuần 5-6: Hooks**
- Build Enterprise OS hook endpoints (`/internal/hooks/*`)
- Wire PostToolUse → audit_events
- Wire SessionStart → user session log
- Test end-to-end: chat → agent → MCP → DB → hook → audit

**Deliverable:** Chat tạo task được, agent nhắc việc qua cron, mọi agent action có audit trail.

### Phase 2 — Google Drive + n8n Integration Layer (không đổi)
Drive artifact registry, n8n self-hosted setup, workflow bridge, Docs/Sheets automation.

**Thêm cho GoClaw:** Setup GoClaw Knowledge Vault sync pipeline từ Drive.

**Deliverable:** Output đẩy về Drive, workflow chạy qua n8n, Vault index documents từ Drive.

### Phase 3 — Dream / Reflection Config (đơn giản hơn nhiều!)

Với GoClaw, Phase 3 **không cần build** — chỉ cần configure:
- Enable L2 Dreaming trong memory config
- Setup cron jobs (daily reflection, weekly synthesis, morning briefing)
- Write SKILL_reflection.md để guide agent
- Test outputs và tune prompts

**Deliverable:** Daily reflection tự chạy, weekly synthesis gửi về chat, L2 memory active.

*So với Plan v2: Phase 3 từ 4-6 tuần build → còn ~1 tuần configure.*

### Phase 4 — CRM Module
clients / leads / deals / interactions, linked tasks / chat / reminders, dashboard pipeline.

**GoClaw:** Thêm MCP tools cho CRM. Thêm `SKILL_crm_workflow.md`. Cron follow-up reminders cho deals.

### Phase 5 — Attendance / Workforce Module
employees, shifts, check-in/out, leave requests, reports.

**GoClaw:** Chat check-in/out qua agent MCP tool. Digest báo cáo chấm công tự động.

### Phase 6 — Finance Module
expenses, accounts, invoices, debts.

**GoClaw:** Chat gửi bill → agent parse → `eos_create_expense` MCP → DB. Weekly financial digest qua cron.

### Phase 7 — Knowledge Base (đơn giản hơn với GoClaw Vault!)

GoClaw Vault đã có: hybrid search, auto-summarization, knowledge graph, semantic linking.

Phase 7 chủ yếu là:
- Build MCP tools để update Vault từ Enterprise OS
- Setup Drive → Vault sync pipeline
- Build Helpdesk module (ticket intake, SLA, escalation)
- Vault-backed helpdesk Q&A

*So với Plan v2: không cần build custom RAG pipeline — GoClaw Vault xử lý phần lớn.*

### Phase 8 — Production Hardening
Rate limiting, full APM, formalized backup, security review, performance tuning.

---

## 14. API Surface (không đổi từ v2)

Prefix: `/api/v1`

### Response envelope
```ts
{
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, string[]> };
  meta?: { page?: number; total?: number; [key: string]: any };
}
```

**Thêm mới cho GoClaw bridge:**

`/internal/hooks/*` — internal only, không expose public
`/mcp` — MCP server endpoint, auth bằng service token

---

## 15. Observability (giữ nguyên từ ADR-08, thêm GoClaw)

**Enterprise OS:** Pino + `/health` + `/ready` + Correlation ID + Sentry

**GoClaw:** Built-in OpenTelemetry export → cùng collector với Enterprise OS. GoClaw traces hiển thị qua GoClaw Dashboard.

**Unified correlation:** `X-Correlation-ID` đi từ GoClaw → hook → Enterprise OS → worker → Drive → n8n.

---

## 16. Security (cập nhật cho GoClaw)

**GoClaw built-in:**
- AES-256-GCM encrypted credentials (tốt hơn OpenClaw plaintext)
- RBAC (admin/operator/viewer)
- Prompt injection detection (warn/log/block)
- SSRF protection
- Session IDOR hardening
- Per-user rate limiting

**Enterprise OS:**
- JWT + refresh token (ADR-01)
- Multi-tenancy RLS (ADR-02)
- Service token cho GoClaw MCP + hooks

**Hook security:**
- `X-Hook-Secret` shared secret giữa GoClaw và Enterprise OS
- Validate secret ở hook middleware trước khi xử lý
- Rate limit hook endpoints

---

## 17. Success Criteria (cập nhật)

### Kernel success (Phase 0)
- Login, tạo/sửa task/project, dashboard thật
- Audit trail usable, structured logging active

### GoClaw Bridge success (Phase 1)
- Chat tạo task được → verify trong DB
- GoClaw cron chạy đúng giờ → message đến Telegram/Zalo
- PostToolUse hook ghi đúng vào audit_events
- Correlation ID trace xuyên suốt GoClaw → Enterprise OS

### Dream/Reflection success (Phase 3)
- Daily reflection cron chạy tự động mỗi tối
- Weekly synthesis gửi summary về chat thứ Hai
- L2 Dreaming active trong memory config

### Knowledge success (Phase 7)
- GoClaw Vault có documents công ty được index
- Agent tìm được SOP khi user hỏi về policy
- Drive → Vault sync hoạt động

### Full hybrid success
- GoClaw ↔ Enterprise OS ↔ Drive ↔ n8n nói chuyện được
- Mọi agent action đều traceable qua correlation ID
- Không có business truth nằm trong GoClaw memory (chỉ trong DB)

---

## 18. Technical Principles (cập nhật)

- Modular monolith trước
- Route → Service → Repository
- Typed contracts giữa frontend/backend/integrations
- Idempotent MCP tool calls (GoClaw có thể retry)
- Correlation ID xuyên suốt mọi system boundary
- Zero fake production data
- Human-readable outputs đẩy về Drive
- GoClaw L2 Dreaming cho reflection — không build custom
- GoClaw Knowledge Vault cho Q&A — không build custom RAG
- Agent actions explainable qua GoClaw trace + Enterprise OS audit

---

## 19. Deployment (cập nhật với GoClaw)

**Stack:**

```yaml
# docker-compose.yml — Enterprise OS
services:
  api:      # Enterprise OS API
  web:      # React web
  worker:   # Internal jobs
  postgres: # schema: deo
  redis:

# docker-compose.goclaw.yml — GoClaw (separate stack)
services:
  goclaw:   # GoClaw gateway
  postgres-goclaw: # GoClaw internal DB (hoặc dùng chung Postgres với schema riêng)
```

**VPS strategy:**
- Option A: Cùng VPS, network nội bộ
- Option B: GoClaw trên VPS riêng, API endpoint public

**Recommended:** Option A trong Phase 0/1 để giảm latency và infra complexity. Option B nếu GoClaw cần scale riêng sau này.

---

## 20. Kết luận

`Enterprise Human-AI Hybrid OS` v3 với GoClaw là bản tái thiết tối ưu nhất:

- **GoClaw** thay thế OpenClaw với capabilities mạnh hơn nhiều: L2 Dreaming, Knowledge Vault, Hooks, MCP, Cron, Skills — tất cả native
- **Dream/Reflection** không cần build riêng — GoClaw L2 + cron config là đủ
- **Knowledge Q&A** không cần build custom RAG — GoClaw Vault xử lý
- **Integration** sạch hơn — MCP server pattern + hooks thay vì custom REST bridge
- **Security tốt hơn** — AES-256-GCM credentials, prompt injection detection, SSRF protection

Engineering effort được tập trung đúng nơi: **Business OS layer** (domain logic, multi-tenancy, business rules) thay vì rebuild agent infrastructure.

---

*Plan v3 — GoClaw Edition — 2026-04-12*
*Dựa trên ADR-01 đến ADR-12 đã chốt trong ARCHITECTURE_DECISIONS.md*
*Tham khảo: https://docs.goclaw.sh/*
