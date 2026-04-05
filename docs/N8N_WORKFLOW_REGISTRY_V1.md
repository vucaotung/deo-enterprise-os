# N8N WORKFLOW REGISTRY V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Định nghĩa registry V1 cho các workflow n8n trong Dẹo Enterprise OS, để agent/work orchestration không gọi workflow theo kiểu tự phát mà có danh mục chính thức, contract rõ ràng, và traceability tốt.

---

## 1. Tư duy lõi

Nếu không có workflow registry, hệ sẽ nhanh chóng bị loạn:
- agent gọi workflow bằng tên tự chế
- không biết workflow nào còn sống
- input/output schema không nhất quán
- callback không chuẩn
- admin khó debug và quản lý quyền gọi

### Một câu chốt
> **Workflow registry là bảng danh mục chính thức của automation layer, giống như agent definitions là bảng danh mục chính thức của agent layer.**

---

## 2. Registry này dùng để làm gì

Workflow registry phải trả lời được các câu hỏi:
- hệ hiện có những workflow n8n nào?
- workflow nào dùng cho mục đích gì?
- workflow nào được agent nào gọi?
- workflow đó chạy sync hay async?
- input/output shape kỳ vọng là gì?
- callback về đâu?
- workflow đang bật hay tắt?
- workflow nào là production-ready, workflow nào experimental?

---

## 3. Vai trò của registry trong kiến trúc

## Agent layer
- reason
- chọn workflow phù hợp

## Registry layer
- xác thực workflow key
- cung cấp metadata/contract
- kiểm soát enablement/policy

## n8n layer
- thực thi flow thật

## Work OS layer
- dispatch
- callback handling
- result application

### Kết luận
Registry nằm giữa **agent/orchestration** và **n8n execution**.

---

## 4. Workflow registry là source-of-truth cho cái gì

Registry nên là source-of-truth cho:
- `workflow_key`
- `name`
- `description`
- `purpose`
- `trigger_mode`
- `agent eligibility`
- `input schema key`
- `output schema key`
- `callback expectation`
- `status / lifecycle`
- `environment readiness`

### Registry không phải source-of-truth cho
- run history chi tiết
- thread/project state
- domain object truth
- agent identity truth

---

## 5. Workflow definition schema đề xuất

```ts
interface WorkflowDefinition {
  id: string;
  workflow_key: string;
  name: string;
  description: string;
  purpose: string;

  domain_type:
    | 'general'
    | 'project'
    | 'task'
    | 'conversation'
    | 'crm'
    | 'finance'
    | 'knowledge'
    | 'research'
    | 'files'
    | 'ops';

  trigger_mode: 'sync' | 'async' | 'scheduled' | 'webhook';
  execution_style: 'direct' | 'callback' | 'approval_required' | 'event_driven';

  suitable_for_agents: string[];
  allowed_context_types: string[];
  allowed_actions: string[];

  input_schema_key?: string;
  output_schema_key?: string;
  callback_schema_key?: string;

  n8n_workflow_id?: string;
  n8n_entrypoint_url?: string;

  lifecycle_status: 'draft' | 'testing' | 'active' | 'paused' | 'deprecated';
  rollout_stage: 'experimental' | 'internal' | 'production';

  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 6. Field explanations

## `workflow_key`
Tên định danh ổn định mà Work OS/agent dùng để gọi workflow.

### Ví dụ tốt
- `project.bootstrap.v1`
- `file.ingest.extract.v1`
- `thread.summary.digest.v1`
- `finance.reconcile.v1`
- `crm.lead.intake.v1`

### Không nên
- tên quá cảm tính
- tên gắn chặt với UI button ngẫu hứng
- tên không version hóa

---

## `trigger_mode`
Cho biết workflow được gọi theo kiểu gì.

### Giá trị
- `sync`
- `async`
- `scheduled`
- `webhook`

---

## `execution_style`
Cho biết workflow phản hồi kiểu nào.

### Giá trị
- `direct` = xong ngay, trả nhanh
- `callback` = chạy nền, callback sau
- `approval_required` = có bước chờ duyệt
- `event_driven` = kích hoạt từ event ngoài

---

## `suitable_for_agents`
Workflow nào phù hợp với agent nào.

### Ví dụ
- `project.bootstrap.v1` → `project_agent`, `conversation_coordinator`
- `file.ingest.extract.v1` → `knowledge_agent`, `research_agent`
- `finance.reconcile.v1` → `finance_agent`

---

## `allowed_context_types`
Workflow này được gọi trong context nào.

### Ví dụ
- `thread`
- `project`
- `task`
- `client`
- `workspace`
- `general`

---

## 7. Naming convention đề xuất

### Pattern
`<domain>.<purpose>.<version>`

### Ví dụ
- `project.bootstrap.v1`
- `project.archive.v1`
- `task.followup.notify.v1`
- `crm.lead.enrich.v1`
- `files.drive.store.v1`
- `conversation.summary.refresh.v1`

### Lợi ích
- rõ domain
- rõ purpose
- version hóa được
- dễ query/search/filter

---

## 8. Workflow categories nên có cho V1

## A. Conversation / Thread workflows
- `conversation.summary.refresh.v1`
- `conversation.pending-actions.extract.v1`
- `conversation.note.capture.v1`

## B. Project workflows
- `project.bootstrap.v1`
- `project.folder.setup.v1`
- `project.digest.weekly.v1`

## C. Task workflows
- `task.followup.notify.v1`
- `task.overdue.alert.v1`
- `task.assignment.sync.v1`

## D. File workflows
- `file.ingest.extract.v1`
- `file.drive.store.v1`
- `file.ocr.pipeline.v1`

## E. CRM workflows
- `crm.lead.intake.v1`
- `crm.lead.enrich.v1`
- `crm.followup.sequence.v1`

## F. Finance workflows
- `finance.reconcile.v1`
- `finance.expense.capture.v1`
- `finance.approval.flow.v1`

---

## 9. Minimal schemas registry nên tham chiếu

V1 không nhất thiết phải có schema engine quá đẹp, nhưng nên có key references.

### Ví dụ
- `schema.project-bootstrap.input.v1`
- `schema.project-bootstrap.output.v1`
- `schema.file-extract.callback.v1`
- `schema.finance-reconcile.output.v1`

### Mục tiêu
- để agent dispatch biết cần gửi gì
- để callback handler biết mong đợi gì
- để admin/dev debug dễ hơn

---

## 10. Suggested registry storage model

Có thể lưu trong DB bảng kiểu:

```sql
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY,
  workflow_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  purpose TEXT NOT NULL,
  domain_type TEXT NOT NULL,
  trigger_mode TEXT NOT NULL,
  execution_style TEXT NOT NULL,
  suitable_for_agents JSONB NOT NULL DEFAULT '[]',
  allowed_context_types JSONB NOT NULL DEFAULT '[]',
  allowed_actions JSONB NOT NULL DEFAULT '[]',
  input_schema_key TEXT,
  output_schema_key TEXT,
  callback_schema_key TEXT,
  n8n_workflow_id TEXT,
  n8n_entrypoint_url TEXT,
  lifecycle_status TEXT NOT NULL DEFAULT 'draft',
  rollout_stage TEXT NOT NULL DEFAULT 'experimental',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 11. API/use cases của registry

Registry nên support tối thiểu:
- list workflows
- get workflow by key
- validate workflow exists and enabled
- check if agent is allowed to call workflow
- get dispatch contract metadata

### Internal use cases
- coordinator chọn workflow
- admin xem workflows active
- dispatch service validate call
- callback handler map result về đúng workflow contract

---

## 12. Dispatch validation rules

Trước khi Work OS dispatch sang n8n, nên check:
- workflow có tồn tại không
- workflow có `is_enabled = true` không
- agent gọi có nằm trong `suitable_for_agents` không
- context hiện tại có thuộc `allowed_context_types` không
- payload action có vượt quyền không

### Nếu fail
Không dispatch; trả lỗi rõ từ orchestration layer.

---

## 13. Lifecycle management

## `draft`
workflow mới định nghĩa, chưa dùng production.

## `testing`
đang test nội bộ / staging.

## `active`
được phép gọi trong production.

## `paused`
tạm khóa, không cho dispatch mới.

## `deprecated`
workflow cũ, giữ để trace nhưng không dùng nữa.

---

## 14. Rollout stages

### `experimental`
- chỉ test vài case
- chưa mở rộng

### `internal`
- dùng được trong nội bộ team
- đã có monitoring cơ bản

### `production`
- có thể gọi ổn định từ orchestration layer chính
- suitable cho real workflows

---

## 15. Example registry entries

## Example 1 — Project bootstrap
```json
{
  "workflow_key": "project.bootstrap.v1",
  "name": "Project Bootstrap",
  "domain_type": "project",
  "trigger_mode": "async",
  "execution_style": "callback",
  "suitable_for_agents": ["project_agent", "conversation_coordinator"],
  "allowed_context_types": ["thread", "project", "general"],
  "allowed_actions": ["create_project", "setup_folder", "notify_team"],
  "input_schema_key": "schema.project-bootstrap.input.v1",
  "output_schema_key": "schema.project-bootstrap.output.v1",
  "callback_schema_key": "schema.project-bootstrap.callback.v1",
  "lifecycle_status": "active",
  "rollout_stage": "internal",
  "is_enabled": true
}
```

## Example 2 — File extract
```json
{
  "workflow_key": "file.ingest.extract.v1",
  "name": "File Ingest Extract",
  "domain_type": "files",
  "trigger_mode": "async",
  "execution_style": "callback",
  "suitable_for_agents": ["knowledge_agent", "research_agent"],
  "allowed_context_types": ["thread", "project", "task"],
  "allowed_actions": ["fetch_file", "extract_text", "return_structured_content"],
  "lifecycle_status": "active",
  "rollout_stage": "internal",
  "is_enabled": true
}
```

## Example 3 — Task follow-up notify
```json
{
  "workflow_key": "task.followup.notify.v1",
  "name": "Task Follow-up Notify",
  "domain_type": "task",
  "trigger_mode": "scheduled",
  "execution_style": "event_driven",
  "suitable_for_agents": ["task_agent", "task_watchdog"],
  "allowed_context_types": ["task", "project"],
  "allowed_actions": ["check_overdue", "notify_thread", "notify_owner"],
  "lifecycle_status": "testing",
  "rollout_stage": "experimental",
  "is_enabled": true
}
```

---

## 16. Relationship với agent registry

Workflow registry không thay agent registry.

### Agent registry trả lời
- agent nào tồn tại
- agent làm được gì
- agent đang ở trạng thái nào

### Workflow registry trả lời
- workflow nào tồn tại
- workflow dùng để làm gì
- agent nào có thể gọi workflow đó

### Một câu chốt
> **Agent registry quản actor; workflow registry quản execution recipes.**

---

## 17. Relationship với Agent → n8n execution pattern

Registry là lớp hỗ trợ để pattern đó hoạt động ổn định.

### Thay vì
agent nói kiểu:
- “gọi cái workflow tạo project gì đó”

### Thì sẽ là
agent/choreography gọi:
- `project.bootstrap.v1`

và biết rõ:
- context nào hợp lệ
- payload schema nào dùng
- callback nào expected

---

## 18. V1 implementation priority

Nếu build thật, Dẹo đề xuất làm theo thứ tự:
1. bảng `workflow_definitions`
2. internal service `getWorkflowByKey()`
3. dispatch validation using registry
4. seed 3-5 workflow đầu tiên
5. admin read view cho workflows

### Seed đầu tiên nên có
- `project.bootstrap.v1`
- `file.ingest.extract.v1`
- `conversation.summary.refresh.v1`
- `task.followup.notify.v1`
- `finance.expense.capture.v1`

---

## 19. One-line conclusion

**N8N Workflow Registry V1 nên là danh mục chính thức của automation layer, nơi mọi workflow có key, contract, eligibility, lifecycle và rollout stage rõ ràng, để agent/orchestration gọi workflow một cách có kiểm soát thay vì theo kiểu ad-hoc khó debug và khó scale.**
