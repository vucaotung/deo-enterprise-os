# Dẹo Enterprise OS

Work OS định hướng **chat-first + orchestration-first** cho vận hành doanh nghiệp, nơi:
- **Telegram group** là mặt tiền tự nhiên cho con người
- **Web app** là lớp quản trị / trực quan / object management
- **Agent layer** là nơi hiểu ngữ cảnh và quyết định hành động
- **n8n** là workflow engine + integration fabric để chạy automation có cấu trúc

> **Human-native frontstage ở chat/thread, orchestration ở agent layer, structured execution ở workflow/integration layer, và domain truth nằm trong Work OS core.**

---

## Trạng thái hiện tại

**Current status:** architecture + canonicalization in progress  
**Repository focus:** làm sạch source-of-truth, giảm drift, khóa architecture trước khi build sâu tiếp

Repo hiện có 2 nhánh tư duy lớn đã được chốt tài liệu khá rõ:

### 1. Web app canonicalization / Project-Task foundation
- canonicalize contract frontend/backend
- đưa `Project Management` và `Task Management` về cùng language
- giảm lệ thuộc mock/demo fallback
- chuẩn hóa runtime-first direction

### 2. Chat / Agent / n8n orchestration stack
- Telegram group như frontstage tự nhiên
- thread context model
- coordinator + specialist model
- agent domain
- n8n workflow role
- workflow registry
- admin/control plane
- execution trace

---

## Kiến trúc tổng quát

```text
Human chat / external events
→ Thread context layer
→ Agent orchestration layer
→ Workflow / integration layer (n8n)
→ Domain objects (projects, tasks, clarifications, notebooks, CRM, finance)
→ Admin / trace / control plane
```

### Các tầng chính

#### 1) Frontstage
- Telegram group
- về sau có thể thêm Zalo / web chat
- web app views cho project/task/admin

#### 2) Thread / context layer
- summaries
- pending actions
- open questions
- linked entities
- current objective

#### 3) Agent layer
- coordinators
- specialists
- watchers
- bindings
- invocations

#### 4) Workflow / integration layer
- n8n workflows
- external connectors
- callbacks
- scheduled jobs

#### 5) Domain object layer
- projects
- tasks
- clarifications
- notebooks
- CRM
- finance

#### 6) Control plane
- Agent Admin
- workflow registry
- execution traces
- retry / cancel / inspect

---

## Core principles

- **Telegram-first, không ép user bỏ công cụ quen thuộc**
- **Project = khung quản trị, Task = đơn vị thực thi**
- **Agent là actor thực thi có ngữ cảnh, không chỉ là chatbot avatar**
- **Truth ở OS, flow ở n8n**
- **Workflow phải đi qua registry, không gọi ad-hoc**
- **Execution trace là hạ tầng bắt buộc, không phải đồ debug phụ**
- **Runtime-first với fallback tạm thời, nhưng không lấy fallback làm source-of-truth**

---

## Tài liệu quan trọng nên đọc trước

### Web / product / canonicalization
- `docs/WEB_APP_CANONICALIZATION_PLAN.md`
- `docs/PROJECT_MANAGEMENT_DOMAIN_V1.md`
- `docs/PROJECT_MANAGEMENT_WEB_STRUCTURE.md`
- `docs/PROJECT_TASK_CANONICAL_UPDATE_2026-04-05.md`

### Chat / orchestration
- `docs/TELEGRAM_GROUP_AS_WORK_OS_V1.md`
- `docs/THREAD_CONTEXT_AND_AGENT_INVOCATION_MODEL.md`
- `docs/TELEGRAM_GROUP_TO_PROJECT_TASK_MAPPING.md`
- `docs/LOW_TOKEN_CHAT_ORCHESTRATION_STRATEGY.md`
- `docs/CHAT_THREAD_DATA_MODEL_V1.md`
- `docs/CHAT_ORCHESTRATION_API_V1.md`
- `docs/CHAT_V1_IMPLEMENTATION_PLAN.md`
- `docs/ORCHESTRATION_STACK_V1.md`

### Agent / n8n / control plane
- `docs/AGENT_DOMAIN_V1.md`
- `docs/N8N_ROLE_IN_ENTERPRISE_OS.md`
- `docs/AGENT_TO_N8N_EXECUTION_PATTERN.md`
- `docs/N8N_WORKFLOW_REGISTRY_V1.md`
- `docs/AGENT_ADMIN_MODEL_V1.md`
- `docs/AGENT_RUN_AND_CALLBACK_TRACE_MODEL.md`
- `docs/AGENT_V1_IMPLEMENTATION_PLAN.md`
- `docs/N8N_INTEGRATION_IMPLEMENTATION_PLAN.md`

---

## Repo structure

```text
apps/
  api/        Express + TypeScript backend
  web/        React + Vite frontend

docs/         Product, architecture, implementation planning
infrastructure/
  postgres/   SQL migrations
scripts/      Deploy / backup / health check helpers
```

---

## Hiện tại build gì trước?

### Near-term priorities
1. tiếp tục cleanup contract frontend/backend
2. giữ source-of-truth rõ giữa repo và production
3. hoàn tất canonical task/project direction
4. khi quay lại orchestration: build theo implementation plans đã chốt

---

## Roadmap ngắn gọn

### Now
- contract cleanup
- production drift reduction
- web app canonicalization
- architecture locking

### Next
- agent V1 foundations
- n8n integration foundations
- workflow registry + callback traces
- Telegram/thread ingest foundations

### Later
- coordinator/specalist flows usable end-to-end
- admin/control plane usable
- deeper CRM/finance/notebook integration

---

## Deployment

- Xem: `DEPLOYMENT_GUIDE_VN.md`
- Lưu ý thực tế hiện tại: môi trường VPS đang được cập nhật theo hướng **archive/scp/rsync/deploy**, vì thư mục production hiện không mặc định là git working copy sạch để `git pull` trực tiếp.

---

## Ghi chú quan trọng

README này phản ánh **direction hiện tại của repo**, không cố giả vờ mọi module đã production-ready hoàn chỉnh.  
Một phần lớn repo hiện ở trạng thái **architecture locked / implementation staged**, và các docs trong `docs/` là source-of-truth quan trọng để quay lại build không bị lệch.

---

## License

Private / Proprietary

---

**Last updated:** 2026-04-05
