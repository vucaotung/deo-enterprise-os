# ROADMAP NEXT

## Mục tiêu gần nhất
Đưa `deo-enterprise-os` từ trạng thái **repo có nhiều hướng phát triển song song và production drift** về trạng thái **source-of-truth rõ, contract sạch hơn, implementation planning khóa chặt hơn**, để bước tiếp theo không bị xây trên nền lệch.

---

## P0 — Giữ hệ không loạn thêm

### 1. Chốt source-of-truth giữa repo và production
- xác định rõ phần nào đang chạy thật trên VPS
- xác định patch nào đã có trong repo, patch nào mới chỉ sống ở runtime
- dừng việc để critical runtime knowledge sống ngoài docs quá lâu

### 2. Tiếp tục cleanup contract frontend/backend
Ưu tiên:
- auth contract
- task/project response shape
- canonical task statuses
- project-scoped vs global task views

### 3. Giảm drift ở web app
- giảm mock/demo fallback ở các page hub quan trọng
- ưu tiên runtime-first
- giữ fallback chỉ là bridge tạm thời

### 4. Giữ docs là source-of-truth thật
Những doc đã chốt phải được dùng để dẫn implementation, không để architecture nói một đằng code chạy một nẻo.

---

## P1 — Hoàn tất web foundation hiện tại

### 5. Canonical task/project cleanup
- backend `tasks.ts` nói cùng ngôn ngữ với frontend
- lọc/filter canonical statuses chuẩn
- giảm dần normalization bridge khi backend sạch hơn

### 6. Project management runtime usable hơn
- `/projects`
- `/projects/:id`
- `/projects/:id/tasks`
- sau đó mở dần sang clarifications / notebooks

### 7. Giải quyết web TypeScript debt theo batch
- batch types / badge / shared contracts
- batch chat / crm / agents / notebooks / clarifications
- batch finance / dashboard / expenses

---

## P2 — Orchestration foundations

### 8. Chat / thread foundations
Build theo `docs/CHAT_V1_IMPLEMENTATION_PLAN.md`:
- chat schema tối thiểu
- Telegram ingest core
- thread state engine
- coordinator actions tối thiểu

### 9. Agent foundations
Build theo `docs/AGENT_V1_IMPLEMENTATION_PLAN.md`:
- `agent_definitions`
- `agent_runtime_states`
- `agent_bindings`
- `agent_invocations`

### 10. n8n integration foundations
Build theo `docs/N8N_INTEGRATION_IMPLEMENTATION_PLAN.md`:
- workflow registry
- dispatch layer
- callback endpoint
- result application traces

---

## P3 — Control plane + traceability

### 11. Agent Admin basics
- registry view
- runtime state view
- invocation explorer
- basic retry/cancel

### 12. Execution trace basics
- workflow dispatches
- workflow callbacks
- result applications
- timeline by invocation

### 13. Workflow governance
- registry validation
- lifecycle status
- rollout stages
- disable/pause/deprecate flows có chủ đích

---

## P4 — End-to-end usability

### 14. Telegram group as Work OS usable
- mention → context → action → result loop
- create project/task/clarification/note từ thread
- callback kết quả về đúng thread

### 15. Specialist invocation usable
- coordinator summon specialist theo policy
- context packaging đủ gọn
- result envelopes chuẩn

### 16. Object linkage usable
- thread ↔ project
- thread ↔ task
- task ↔ clarification
- project ↔ notebooks / finance / CRM về sau

---

## Tài liệu đã chốt làm nền cho roadmap này

### Web / canonicalization
- `docs/WEB_APP_CANONICALIZATION_PLAN.md`
- `docs/PROJECT_MANAGEMENT_DOMAIN_V1.md`
- `docs/PROJECT_MANAGEMENT_WEB_STRUCTURE.md`
- `docs/PROJECT_TASK_CANONICAL_UPDATE_2026-04-05.md`

### Orchestration stack
- `docs/ORCHESTRATION_STACK_V1.md`
- `docs/CHAT_V1_IMPLEMENTATION_PLAN.md`
- `docs/AGENT_DOMAIN_V1.md`
- `docs/N8N_ROLE_IN_ENTERPRISE_OS.md`
- `docs/AGENT_TO_N8N_EXECUTION_PATTERN.md`
- `docs/N8N_WORKFLOW_REGISTRY_V1.md`
- `docs/AGENT_ADMIN_MODEL_V1.md`
- `docs/AGENT_RUN_AND_CALLBACK_TRACE_MODEL.md`
- `docs/AGENT_V1_IMPLEMENTATION_PLAN.md`
- `docs/N8N_INTEGRATION_IMPLEMENTATION_PLAN.md`

---

## Nguyên tắc vận hành từ đây
1. Không mở feature mới mà không rõ source-of-truth
2. Không gọi workflow ad-hoc ngoài registry nếu đã vào nhánh orchestration mới
3. Không để control plane và domain truth lẫn vào nhau
4. Không để production drift tích tụ âm thầm
5. Mọi bước lớn nên có doc hoặc implementation plan đi kèm

---

## Một câu chốt
**Roadmap tiếp theo của Dẹo Enterprise OS là: làm sạch nền đang có, khóa contract và source-of-truth, rồi build orchestration stack theo phase — thay vì vừa build vừa đổi triết lý giữa chừng.**
