# PROJECT_MANAGER_MASTER_PLAN_V1_DEO.md

Cập nhật: 2026-04-08
Trạng thái: canonical-draft-v1
Mục tiêu: bản tổng hợp chuẩn hoá toàn bộ định hướng build module **Project Manager / ERP core** cho Dẹo Enterprise OS, sẵn để commit/push GitHub.

---

## 1. Bối cảnh

Dẹo Enterprise OS đang có:
- schema enterprise tương đối tốt ở `infra/postgres/001_init_schema.sql`
- app web hiện mới là scaffold
- app api/worker mới có phần hạ tầng cơ bản

Trong khi đó, sheet demo + dashboard demo bên ngoài cho thấy một thứ rất đáng học:
- cách chia module
- cảm giác UI/UX business app
- cách đóng gói sản phẩm để người dùng thấy ngay giá trị

### Kết luận chiến lược
Không copy sheet demo làm data model.
Thay vào đó:
- lấy **schema thật** từ repo hiện tại
- lấy **UI/UX direction** từ demo sheet/dashboard
- ghép thêm **AI-native workflow** để ra Project Manager module đúng chất Dẹo OS

---

## 2. Tầm nhìn module

Project Manager của Dẹo Enterprise OS không phải PM app thường.
Nó là lớp điều phối công việc lõi cho:
- human staff
- AI staff
- approvals
- activity
- documents
- jobs/output

### Mục tiêu
- quản lý nhiều dự án cùng lúc
- theo dõi task theo project / người / AI / deadline / priority
- đưa approval vào luồng vận hành thật
- hiển thị activity đáng tin
- biến AI jobs thành thứ quan sát/điều phối được

---

## 3. Bài học chắt lọc từ sheet demo / dashboard demo

### Nên học
- module map dễ hiểu: Dashboard, Projects, Tasks, Users, Chat, Update
- business UI clean, dễ scan
- dashboard có KPI + cards + danh sách việc nóng
- project/task presentation trực quan

### Không nên bê nguyên
- JSON blob trong cell
- password plain text
- data model mock
- logic tiến độ đơn giản quá
- dữ liệu demo không sạch

### Triết lý áp dụng
- **Demo dạy mình cách trình bày sản phẩm**
- **Repo hiện tại dạy mình cách dựng lõi dữ liệu**

---

## 4. Canonical module scope v1

### In scope
- Dashboard
- Projects
- Tasks
- Workers (human + AI)
- Approvals
- Activity
- AI Jobs
- Documents lite

### Out of scope v1
- CRM full
- accounting ERP full
- HRM sâu
- chat real-time full
- procurement/inventory
- analytics quá sâu

---

## 5. Actor model

### Owner/Admin
- toàn quyền điều phối
- thấy toàn bộ hệ

### Manager
- quản lý project/task/team được giao

### Staff
- xử lý task và cập nhật tiến độ

### AI Agent
- nhận jobs, trả output, escalate khi cần

---

## 6. Canonical screen map

1. Dashboard
2. Projects List
3. Project Detail
4. Task Center
5. Workers
6. Approvals
7. Activity
8. AI Jobs
9. Documents (lite)

---

## 7. Canonical UI/UX direction

### Layout
- sidebar trái cố định
- topbar có search + quick create + context
- main content ưu tiên card + table + drawer

### Style
- business clean
- sáng, gọn, dễ đọc
- ít màu nhưng màu trạng thái rõ
- ưu tiên desktop web trước

### UX rules
- quản lý hiểu hệ trong 5 giây
- giảm click
- quick actions rõ
- detail mở dạng drawer/modal
- dashboard phải bám data thật

---

## 8. Canonical data strategy

### Giữ lõi schema hiện tại
- companies
- workers
- human_workers
- ai_agents
- projects
- tasks
- task_assignments
- task_comments
- task_events
- documents
- approvals
- agent_jobs
- activity_logs
- notifications
- reminders

### Bổ sung cần thiết
- project_members
- roles
- permissions
- role_permissions
- worker_roles

### Có thể bổ sung sau
- roadmap_items
- conversations
- conversation_messages
- saved_views

### Quy tắc dữ liệu
- không JSON blob khó query
- mỗi entity quan trọng có id + timestamps + actor + status
- approval và AI jobs phải audit được
- frontend dùng DTO rõ ràng, không kéo raw schema bừa

---

## 9. Canonical semantics

### Projects
- owner là người chịu trách nhiệm cuối
- status chuẩn: planning / active / on_hold / at_risk / completed / cancelled / archived

### Tasks
- owner_worker_id = người chịu trách nhiệm cuối
- current_assignee_worker_id = người/AI đang xử lý bước hiện tại
- closed_at = mốc task thoát lifecycle active
- status chuẩn bám enum task hiện có

### AI jobs
- không là hộp đen
- phải nhìn được trạng thái, log, output, liên kết với task

### Approvals
- là phần của luồng business thật
- không phải checkbox trang trí

---

## 10. Canonical dashboard requirements

Dashboard phải trả lời được ngay:
- có bao nhiêu project active
- có bao nhiêu task open / overdue / blocked
- có gì đang chờ duyệt
- ai đang quá tải
- AI nào đang chạy/lỗi
- activity gần đây là gì

### KPI bắt buộc
- Active Projects
- Open Tasks
- Overdue Tasks
- Blocked Tasks
- Pending Approvals
- Running AI Jobs

### Widgets bắt buộc
- Priority Projects
- Due Soon / Overdue Tasks
- Approval Queue
- Activity Feed
- Workload Snapshot
- AI Operations

---

## 11. Canonical API surface v1

### Dashboard
- `/api/v1/dashboard/summary`
- `/api/v1/dashboard/priority-projects`
- `/api/v1/dashboard/tasks-due`
- `/api/v1/dashboard/approvals`
- `/api/v1/dashboard/activity`
- `/api/v1/dashboard/workload`
- `/api/v1/dashboard/ai-ops`

### Projects
- `/api/v1/projects`
- `/api/v1/projects/:projectId`
- `/api/v1/projects/:projectId/members`
- `/api/v1/projects/:projectId/activity`
- `/api/v1/projects/:projectId/approvals`
- `/api/v1/projects/:projectId/documents`
- `/api/v1/projects/:projectId/ai-jobs`

### Tasks
- `/api/v1/tasks`
- `/api/v1/tasks/:taskId`
- `/api/v1/tasks/:taskId/assign`
- `/api/v1/tasks/:taskId/status`
- `/api/v1/tasks/:taskId/comments`
- `/api/v1/tasks/:taskId/timeline`
- `/api/v1/tasks/:taskId/documents`
- `/api/v1/tasks/:taskId/approvals`
- `/api/v1/tasks/:taskId/ai-jobs`

### Workers
- `/api/v1/workers`
- `/api/v1/workers/:workerId`
- `/api/v1/workers/:workerId/tasks`
- `/api/v1/workers/:workerId/workload`

### Approvals
- `/api/v1/approvals`
- `/api/v1/approvals/:approvalId`
- `/api/v1/approvals/:approvalId/approve`
- `/api/v1/approvals/:approvalId/reject`
- `/api/v1/approvals/:approvalId/request-info`

### Activity
- `/api/v1/activity`

### AI Jobs
- `/api/v1/ai-jobs`
- `/api/v1/ai-jobs/:jobId`
- `/api/v1/ai-jobs/:jobId/logs`
- `/api/v1/ai-jobs/:jobId/outputs`
- `/api/v1/tasks/:taskId/ai-jobs`

---

## 12. Canonical build order

### Phase 1 — Data foundation
- schema patches
- cleanup legacy model
- seed clean v1
- constants dictionaries

### Phase 2 — PM backend core
- dashboard summary
- projects APIs
- tasks APIs
- assign/status flow
- workers basic APIs

### Phase 3 — PM frontend core
- app shell
- dashboard
- projects list/detail
- task center

### Phase 4 — Approval + AI jobs
- approvals APIs/UI
- AI jobs APIs/UI
- link task <-> approval <-> AI

### Phase 5 — Activity + polish
- activity feed
- documents lite
- notifications/search/quick create
- seed scenarios + polish

---

## 13. Definition of MVP success

### Product success
- quản lý nhìn dashboard là hiểu tình hình
- có thể tạo/giao/theo dõi task thật
- approval flow usable
- AI jobs visible và debug được

### Technical success
- schema khớp docs
- API khớp contracts
- frontend bám DTO rõ
- data seed đủ thật để test/review

### UX success
- không còn cảm giác scaffold rỗng
- không phải click loạn mới ra việc
- states/loading/errors đủ tử tế

---

## 14. Canonical doc set cho GitHub push

Để update dự án Deo OS trên GitHub, bộ PM docs chuẩn nên gồm:

1. `PROJECT_MANAGER_MODULE_SPEC_V1_DEO.md`
2. `PROJECT_MANAGER_SCHEMA_REVIEW_V1_DEO.md`
3. `PROJECT_MANAGER_SCHEMA_PATCHES_V1_DEO.md`
4. `PROJECT_MANAGER_WIREFRAMES_V1_DEO.md`
5. `PROJECT_MANAGER_API_CONTRACTS_V1_DEO.md`
6. `PROJECT_MANAGER_EXECUTION_PLAN_V1_DEO.md`
7. `PROJECT_MANAGER_MASTER_PLAN_V1_DEO.md` ← file tổng hợp canonical

---

## 15. Khuyến nghị tiếp theo sau khi push

### Bước kế
1. tạo migrations patch schema
2. cleanup legacy model references trong repo
3. dựng web app shell thật
4. build dashboard + projects + tasks trước
5. sau đó approvals + AI jobs

### Khi bắt đầu code
Nên giao coding agent theo package docs phía trên để tránh build lệch hướng.

---

## 16. Chốt cuối

Project Manager của Dẹo Enterprise OS nên được build như sau:
- **giao diện dễ hiểu như demo business dashboard**
- **schema và audit chuẩn enterprise hơn hẳn demo**
- **AI jobs, approvals, activity được coi là lõi, không phải tính năng phụ**

Đây là module đủ quan trọng để trở thành lớp điều phối trung tâm của Deo OS.
