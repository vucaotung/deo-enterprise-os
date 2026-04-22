# N8N INTEGRATION IMPLEMENTATION PLAN

**Ngày:** 2026-04-05  
**Mục tiêu:** Chuyển cụm docs `n8n` từ mức architecture/spec sang implementation plan thực dụng cho V1.

---

## 1. Phạm vi V1

n8n V1 nên đủ để:
- làm integration bus cho external events
- làm execution target cho một số agent actions
- có workflow registry tối thiểu
- có dispatch contract rõ
- có callback endpoint rõ
- trace được từ invocation tới callback/result

### Chưa cần ở V1
- encode full domain logic trong n8n
- dựng quá nhiều workflows từ đầu
- multi-env workflow governance phức tạp

---

## 2. Deliverables chính

### Registry
- bảng `workflow_definitions`
- seed 3-5 workflows đầu tiên

### Dispatch
- internal dispatch service từ Work OS sang n8n
- validation qua workflow registry

### Callback
- callback endpoint từ n8n về Work OS
- update invocation/dispatch/result traces

### Traces
- `workflow_dispatches`
- `workflow_callbacks`
- `result_applications`

---

## 3. Build order đề xuất

## Phase 0 — Registry foundation
- tạo bảng `workflow_definitions`
- service `getWorkflowByKey()`
- validation: enabled/context/agent eligibility

## Phase 1 — Dispatch layer
- create dispatch request
- map invocation → workflow key
- post sang n8n entrypoint

## Phase 2 — Callback layer
- secure callback endpoint
- parse callback payload
- update traces + invocation status

## Phase 3 — Result application
- append thread event
- create/update object nếu cần
- store result refs

## Phase 4 — First useful workflows
- `project.bootstrap.v1`
- `file.ingest.extract.v1`
- `conversation.summary.refresh.v1`
- `task.followup.notify.v1`

---

## 4. Operational notes

- workflow key phải versioned
- callback contract phải stable
- failures phải gắn stage rõ: dispatch/workflow/callback/result_application
- không để n8n tự viết domain truth lung tung ngoài API contracts

---

## 5. Risks

- workflow sprawl nếu không qua registry
- callback shape drift giữa các flow
- automation chạy được nhưng không trace được lineage

---

## 6. One-line conclusion

**N8N V1 nên bắt đầu từ registry + dispatch + callback + trace, rồi mới mở rộng số lượng workflow và mức độ automation phức tạp.**
