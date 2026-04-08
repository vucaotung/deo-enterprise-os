# PROJECT_MANAGER_SCHEMA_PATCHES_V1_DEO.md

Cập nhật: 2026-04-08
Trạng thái: draft-v1
Mục tiêu: chốt 4 hạng mục con cần hoàn thiện sau review schema để Project Manager module build mượt.

---

## 1. Hạng mục A — Bổ sung `project_members`

### 1.1 Vì sao cần
Schema hiện có `projects.owner_worker_id`, nhưng chưa có bảng thể hiện:
- ai là member của dự án
- người đó đóng vai gì trong dự án
- ai chỉ được xem, ai được thao tác

Nếu không có `project_members`, UI Project Detail sẽ bị thiếu:
- danh sách thành viên
- vai trò thành viên
- filter task theo member của project
- quyền theo project

### 1.2 Đề xuất bảng
```sql
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    membership_role TEXT NOT NULL DEFAULT 'contributor',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    left_at TIMESTAMPTZ,
    added_by_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    UNIQUE(project_id, worker_id)
);
```

### 1.3 Membership roles bản đầu
- owner
- manager
- contributor
- viewer
- approver

### 1.4 Ảnh hưởng UI
#### Project Detail
- tab/section “Thành viên dự án”
- avatar stack ở header
- filter task theo member

#### Project List
- hiển thị member count / member avatars

---

## 2. Hạng mục B — Chiến lược role / permission bản đầu

### 2.1 Vấn đề hiện tại
`workers.role_name` chỉ đủ để hiển thị, không đủ để làm quyền thật.

### 2.2 Mục tiêu
Cần một lớp quyền đủ gọn cho MVP nhưng không quá sơ sài.

### 2.3 Đề xuất bảng
```sql
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS worker_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    scope_type TEXT NOT NULL DEFAULT 'global',
    scope_id UUID,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    UNIQUE(worker_id, role_id, scope_type, scope_id)
);
```

### 2.4 Roles v1 đề xuất
- owner_admin
- operations_manager
- project_manager
- staff
- viewer
- ai_agent_system

### 2.5 Permission groups v1
- dashboard.view
- projects.view
- projects.manage
- tasks.view
- tasks.manage
- tasks.assign
- workers.view
- workers.manage
- approvals.view
- approvals.decide
- ai_jobs.view
- ai_jobs.run
- documents.view
- documents.manage
- settings.manage

### 2.6 Scope strategy
#### Global scope
Dùng cho owner/admin.

#### Project scope
Dùng cho project manager / contributor / viewer theo từng project.

### 2.7 Nguyên tắc
- `role_name` ở `workers` vẫn giữ để hiển thị
- quyền thật đi qua `worker_roles` + `role_permissions`

---

## 3. Hạng mục C — Chuẩn hóa dictionary và semantics

### 3.1 Project statuses chuẩn
Không nên để mỗi nơi gọi mỗi kiểu.

#### Đề xuất
- planning
- active
- on_hold
- at_risk
- completed
- cancelled
- archived

### 3.2 Task statuses chuẩn
Bám enum hiện có, coi đây là chuẩn PM v1:
- new
- triaged
- queued
- in_progress
- waiting_info
- waiting_approval
- blocked
- done
- cancelled
- archived

### 3.3 Approval statuses
Bám enum hiện có:
- pending
- approved
- rejected
- expired
- cancelled

### 3.4 Agent job statuses
Bám enum hiện có:
- queued
- running
- waiting_approval
- done
- failed
- cancelled

### 3.5 Task event types chuẩn app-layer
Không cần enum DB ngay, nhưng phải có registry:
- task_created
- task_updated
- task_assigned
- task_unassigned
- task_status_changed
- task_priority_changed
- task_due_changed
- task_blocked
- task_unblocked
- comment_added
- approval_requested
- approval_decided
- document_linked
- agent_job_created
- agent_job_status_changed

### 3.6 Activity action types chuẩn app-layer
- project_created
- project_updated
- task_created
- task_updated
- task_status_changed
- worker_added_to_project
- approval_requested
- approval_approved
- approval_rejected
- agent_job_started
- agent_job_finished
- agent_job_failed
- document_uploaded
- reminder_scheduled
- notification_sent

### 3.7 Semantics cần chốt
#### `owner_worker_id`
Người chịu trách nhiệm cuối cùng với project/task.

#### `current_assignee_worker_id`
Người/AI đang thực hiện bước hiện tại.

#### `closed_at`
Mốc task thoát active lifecycle. Có thể là done/cancelled/archived.

#### `status = done`
Business completion.

### 3.8 Kết luận
Phải có một file dictionary chuẩn ở docs hoặc app constants, nếu không dashboard/UI sẽ loạn dần theo thời gian.

---

## 4. Hạng mục D — Dọn model cũ vs model mới

### 4.1 Vấn đề
Đã thấy file seed dùng model kiểu cũ:
- `users`
- `agent_assignments`

Trong khi schema PM/Enterprise OS mới đi theo:
- `workers`
- `human_workers`
- `ai_agents`

### 4.2 Rủi ro
- seed lỗi hoặc insert sai nơi
- API code đọc nhầm bảng
- docs lệch schema
- dev sau này không biết model nào là canonical

### 4.3 Quyết định kiến trúc đề xuất
**Canonical model từ nay phải là:**
- `workers`
- `human_workers`
- `ai_agents`

### 4.4 Hướng xử lý
1. Audit toàn repo tìm các chỗ còn gọi:
   - `users`
   - `agent_assignments`
2. Chia làm 3 loại:
   - docs cũ
   - seed cũ
   - code cũ
3. Replace hoặc mark deprecated
4. Tạo migration/seed mới đúng model canonical

### 4.5 Nguyên tắc mapping
#### Human user cũ
`users` -> `workers` + `human_workers`

#### Agent assignment cũ
`agent_assignments` -> `workers` + `ai_agents` + `worker_roles/project_members` tùy scope

### 4.6 Deliverable nên có sau cleanup
- 1 file note: `LEGACY_MODEL_CLEANUP_PLAN_V1_DEO.md`
- migration/seed mới chuẩn
- docs schema chỉ còn một hệ ngôn ngữ

---

## 5. Chốt thứ tự làm thực tế

### Làm ngay trước khi build UI thật
1. thêm `project_members`
2. chốt role/permission strategy
3. chốt dictionaries/status semantics
4. audit + cleanup model cũ/mới

### Sau đó mới build an tâm
- wireframe
- API contracts
- UI thật

---

## 6. Chốt một câu

4 hạng mục con của Bước 2 không phải “nice to have”.
Chúng là lớp giúp schema hiện tại đi từ **đủ tốt để tồn tại** sang **đủ sạch để build Project Manager tử tế**.
