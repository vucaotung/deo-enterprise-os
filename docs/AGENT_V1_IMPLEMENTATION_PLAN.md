# AGENT V1 IMPLEMENTATION PLAN

**Ngày:** 2026-04-05  
**Mục tiêu:** Chuyển cụm docs `Agent Domain` từ mức architecture/spec sang implementation plan thực dụng cho V1.

---

## 1. Phạm vi V1

Agent V1 nên đủ để:
- định nghĩa agent catalog
- lưu runtime states
- lưu bindings
- tạo invocation records
- attach coordinator/specalist vào context
- trace được agent gọi vì lý do gì và output đi đâu

### Chưa cần ở V1
- agent marketplace
- dynamic planning graph quá sâu
- self-improving runtime phức tạp
- distributed scheduling nâng cao

---

## 2. Deliverables chính

### Data layer
- `agent_definitions`
- `agent_runtime_states`
- `agent_bindings`
- `agent_invocations`

### Service layer
- list/get agents
- enable/disable agent
- bind/unbind agent
- create invocation
- update invocation status

### Admin layer
- agent registry list
- agent detail
- invocation explorer cơ bản

---

## 3. Build order đề xuất

## Phase 0 — Data model foundations
- tạo bảng `agent_definitions`
- tạo bảng `agent_runtime_states`
- tạo bảng `agent_bindings`
- tạo bảng `agent_invocations`

## Phase 1 — Catalog & runtime services
- API list/get agent definitions
- API update runtime state
- seed core agents ban đầu

## Phase 2 — Binding model
- attach coordinator vào thread
- attach project agent vào project
- unbind/pause flows

## Phase 3 — Invocation model
- create invocation from thread/project/task actions
- status transitions
- result summary fields

## Phase 4 — Admin basics
- registry page
- detail page
- invocation explorer

---

## 4. Core agents nên seed đầu tiên

- `conversation_coordinator`
- `project_coordinator`
- `task_agent`
- `clarification_agent`
- `knowledge_agent`
- `research_agent`
- `writer_agent`
- `finance_agent`

---

## 5. API surface gợi ý

- `GET /api/agents/definitions`
- `GET /api/agents/definitions/:id`
- `PATCH /api/agents/definitions/:id`
- `GET /api/agents/runtime`
- `POST /api/agents/bindings`
- `PATCH /api/agents/bindings/:id`
- `POST /api/agent-invocations`
- `GET /api/agent-invocations`
- `GET /api/agent-invocations/:id`

---

## 6. Risks

- lẫn lộn giữa old agent-jobs flow và new invocation model
- define agent quá rộng trước khi có real use cases
- admin UI nặng hơn data model

---

## 7. One-line conclusion

**Agent V1 nên bắt đầu từ catalog + runtime + bindings + invocations trước, rồi mới mở rộng sang admin và specialist sophistication.**
