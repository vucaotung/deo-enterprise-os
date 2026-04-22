# PROJECT_MANAGER_MODULE_SPEC_V1_DEO.md

Cập nhật: 2026-04-08
Trạng thái: draft-v1
Chủ đích: định nghĩa module **Project Manager / ERP core** cho Dẹo Enterprise OS.

---

## 1. Mục tiêu

Module này là lõi điều phối công việc của Dẹo Enterprise OS.
Nó không chỉ là app quản lý dự án thông thường, mà là nơi:

- human staff và AI staff cùng làm việc trên cùng task system
- project, task, approval, document, activity, AI job được nối vào một luồng thống nhất
- dashboard giúp sếp hoặc quản lý nhìn 5 giây là hiểu hệ đang chạy thế nào

### Mục tiêu cụ thể
- Quản lý nhiều dự án cùng lúc
- Quản lý task theo project / người / agent / hạn chót / trạng thái
- Theo dõi workload của human và AI
- Gắn approval vào đúng bước cần duyệt
- Hiển thị activity feed đáng tin
- Làm nền để nối thêm tài liệu, lịch, tài chính, CRM về sau

---

## 2. Nguyên tắc thiết kế

### 2.1 Product principle
- UI phải dễ hiểu với người không kỹ thuật
- Backend phải đủ chuẩn để scale và audit
- Trạng thái phải thật, không được “đẹp UI nhưng số liệu giả”
- Human và AI là hai loại worker khác nhau nhưng cùng nằm trong một hệ điều phối

### 2.2 Những gì học từ sheet demo
**Giữ:**
- cách chia module dễ hiểu: Dashboard, Dự án, Nhiệm vụ, Người dùng, Chat, Update
- dashboard kiểu business app: KPI, project cards, task list, activity
- luồng dùng trực quan cho quản lý

**Không bê nguyên:**
- nhét JSON task/log/chat vào một cell
- user/password kiểu mock
- logic tiến độ quá đơn giản
- dữ liệu demo lẫn dữ liệu vận hành

### 2.3 Tuyên ngôn kiến trúc
- **Schema thật** lấy từ Enterprise OS repo
- **UI/UX tinh thần** học từ demo sheet/dashboard
- **AI-native workflow** là khác biệt cốt lõi của Dẹo Enterprise OS

---

## 3. Phạm vi module Project Manager / ERP core

### In scope cho v1
- Dashboard điều hành
- Project management
- Task management
- Worker management (human + AI)
- Approval queue
- Activity feed
- AI job tracking

### Out of scope cho v1
- CRM đầy đủ
- Accounting/finance ERP đầy đủ
- Procurement / inventory
- HRM sâu (chấm công, lương, bảo hiểm)
- Chat real-time full-featured như Slack
- Document management quá sâu kiểu DMS enterprise

---

## 4. Actor chính

### 4.1 Admin / Chủ hệ
- Xem toàn bộ hệ thống
- Tạo/sửa project
- Tạo/sửa worker
- Giao việc cho human hoặc AI
- Xem approvals, jobs, reports
- Can thiệp task bị block

### 4.2 Quản lý
- Quản lý project được giao
- Tạo và phân task
- Theo dõi tiến độ, deadline
- Duyệt một số bước theo quyền
- Xem activity và workload đội nhóm

### 4.3 Nhân viên
- Xem task được giao
- Cập nhật tiến độ
- Bình luận / thêm kết quả / gửi duyệt
- Xem project liên quan

### 4.4 AI Agent
- Nhận agent jobs từ task system
- Trả output, logs, status
- Escalate khi cần approval / thiếu data / blocked
- Không có quyền tự ý “đánh dấu xong” sai trạng thái

---

## 5. Module map

### 5.1 Dashboard
Hiển thị sức khỏe vận hành của hệ.

### 5.2 Projects
Danh sách dự án, trạng thái, owner, deadline, progress, chi tiết dự án.

### 5.3 Tasks
Trung tâm task: list/board, filter, assign, status flow, due tracking.

### 5.4 Workers
Quản lý nhân sự và AI agents theo cùng một khung nhìn điều phối.

### 5.5 Approvals
Những việc đang chờ duyệt, đã duyệt, bị từ chối, quá hạn.

### 5.6 Activity
Feed sự kiện toàn hệ hoặc theo project/task.

### 5.7 AI Jobs
Theo dõi công việc giao cho AI: queued, running, done, failed, waiting approval.

### 5.8 Documents (phase sau v1 nhẹ)
Gắn tài liệu vào project/task/output.

---

## 6. User goals theo màn hình

### 6.1 Dashboard
Người dùng muốn biết ngay:
- có bao nhiêu dự án active
- có bao nhiêu task open / overdue / blocked
- có gì cần duyệt hôm nay
- ai đang quá tải
- AI job nào đang chạy / lỗi
- activity gần đây là gì

### 6.2 Project List
Người dùng muốn:
- xem tất cả dự án
- filter theo status, owner, priority
- thấy nhanh progress, due date, risk
- mở nhanh chi tiết dự án

### 6.3 Project Detail
Người dùng muốn:
- xem overview dự án
- xem task theo trạng thái / assignee
- xem timeline activity
- xem documents và approvals liên quan
- tạo task mới nhanh

### 6.4 Task Center
Người dùng muốn:
- xem task theo board hoặc table
- lọc theo status / assignee / project / priority / due date
- cập nhật tiến độ
- giao việc nhanh cho người/AI
- thấy task nào blocked hoặc chờ duyệt

### 6.5 Workers
Người dùng muốn:
- biết ai đang gánh bao nhiêu việc
- ai rảnh / ai quá tải
- human khác AI ở đâu
- mỗi worker đang giữ những task nào

### 6.6 Approvals
Người dùng muốn:
- thấy queue cần duyệt
- duyệt nhanh theo batch hoặc từng việc
- biết việc nào quá hạn duyệt

### 6.7 AI Jobs
Người dùng muốn:
- thấy agent nào đang làm gì
- output từ AI là gì
- lỗi ở đâu
- có cần approval/clarification không

---

## 7. UI/UX direction

### 7.1 Phong cách
- business clean
- sáng, rõ, dễ scan
- card + table + drawer/modal
- màu trạng thái rõ ràng nhưng không loè loẹt
- ưu tiên desktop web trước

### 7.2 Layout chuẩn
#### Sidebar trái
- Dashboard
- Projects
- Tasks
- Workers
- Approvals
- Activity
- AI Jobs
- Documents
- Settings

#### Topbar
- search toàn cục
- quick create
- filter theo company/project
- notifications
- profile / role context

#### Main content
- KPI row
- filter bar
- card/list/table/board
- right detail drawer cho thao tác nhanh

### 7.3 Nguyên tắc UX
- quản lý phải hiểu tình hình trong 5 giây
- giảm số click
- ưu tiên quick actions
- detail mở nhanh mà không mất context
- mọi status hiển thị phải bám dữ liệu thật

### 7.4 Thành phần UI cần có
- KPI cards
- status chips
- progress bar
- due-date badges
- assignee avatars
- activity timeline
- approval cards
- AI job status pills
- filters mạnh (chips + dropdown + saved views sau này)

---

## 8. Dashboard spec

### 8.1 KPI bắt buộc
- Dự án active
- Task open
- Task overdue
- Task blocked
- Approval pending
- AI jobs running

### 8.2 Khu vực chính
#### A. Priority projects
- top dự án active quan trọng nhất
- status, owner, progress, due date

#### B. Due soon / overdue tasks
- task quá hạn
- task đến hạn hôm nay / 3 ngày tới
- quick open

#### C. Approval queue
- số lượng pending
- top việc cần duyệt gấp

#### D. Activity feed
- ai làm gì, trên object nào, lúc nào

#### E. AI operations
- job đang chạy
- job failed gần đây
- waiting approval

#### F. Workload snapshot
- worker quá tải
- worker rảnh
- AI agents active/inactive

### 8.3 Không nên làm ở dashboard v1
- biểu đồ cầu kỳ quá nhiều
- analytics dài dòng khó đọc
- chat nhét thẳng vào dashboard nếu chưa có use case mạnh

---

## 9. Project module spec

### 9.1 Project list fields
- code
- name
- company
- owner
- priority
- status
- start date
- due date
- progress summary
- open tasks count
- overdue tasks count

### 9.2 Project detail sections
- Header overview
- Task summary
- Task list / board
- Activity timeline
- Approvals
- Documents
- AI jobs linked

### 9.3 Project statuses đề xuất
- planning
- active
- on_hold
- at_risk
- completed
- cancelled
- archived

### 9.4 Project quick actions
- tạo task
- đổi owner
- đổi status
- add follower/member
- link document
- request approval

---

## 10. Task module spec

### 10.1 Task fields tối thiểu
- title
- description
- project_id
- parent_task_id (nếu có)
- task_type
- status
- priority
- due_at
- created_by
- owner
- current_assignee
- requires_approval
- created_at
- updated_at
- closed_at

### 10.2 Task views
- Table view
- Board view theo status
- List theo assignee
- List theo due date

### 10.3 Task statuses đề xuất
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

### 10.4 Task actions
- assign cho human/AI
- đổi status
- set priority
- thêm comment
- thêm event/log
- gắn document
- request approval
- create AI job

### 10.5 Task detail UI
- title + status + priority + due
- assignee + owner
- description
- comments
- timeline
- linked documents
- approvals
- agent jobs

---

## 11. Worker module spec

### 11.1 Worker types
- human
- ai

### 11.2 Worker list cần hiển thị
- display name
- worker type
- role/title
- current active tasks
- overdue tasks count
- blocked tasks count
- last seen / active status

### 11.3 Worker detail cần có
- profile summary
- assigned tasks
- completed tasks
- approvals involvement
- workload chart nhẹ
- event history

### 11.4 Vì sao module này quan trọng
Đây là điểm khác biệt của Dẹo OS:
- human và AI phải cùng xuất hiện trong một màn điều phối
- quản lý không chỉ hỏi “nhân viên nào đang bận” mà còn hỏi “agent nào đang chạy gì”

---

## 12. Approval module spec

### 12.1 Approval use cases
- duyệt task quan trọng
- duyệt output AI
- duyệt document/phiên bản
- duyệt hành động đối ngoại
- duyệt quyết định ảnh hưởng tài chính/vận hành

### 12.2 Approval list fields
- approval type
- summary
- related project/task/document
- requested by
- approver
- status
- requested at
- expires at

### 12.3 Approval actions
- approve
- reject
- request more info
- view timeline

---

## 13. Activity feed spec

### 13.1 Activity phải trả lời được
- ai làm gì
- lúc nào
- trên project/task/document/job nào
- kết quả gì

### 13.2 Activity types ví dụ
- project_created
- task_created
- task_assigned
- task_status_changed
- comment_added
- approval_requested
- approval_decided
- agent_job_started
- agent_job_finished
- document_linked

### 13.3 Feed filters
- all
- projects
- tasks
- approvals
- ai jobs
- documents
- worker specific

---

## 14. AI Jobs module spec

### 14.1 Mục đích
Cho quản lý thấy AI đang làm gì trong hệ, thay vì AI hoạt động như hộp đen.

### 14.2 Fields cần hiển thị
- agent name
- linked task
- job type
- status
- priority
- queued_at
- started_at
- finished_at
- error_message (nếu có)
- output summary

### 14.3 Statuses
- queued
- running
- waiting_approval
- done
- failed
- cancelled

### 14.4 Màn AI Jobs phải có
- list tất cả job gần đây
- filter theo agent/status/project/task
- quick open output
- xem job nào bị stuck/failed

---

## 15. Data model alignment với repo hiện tại

### 15.1 Bảng đang có và nên tận dụng
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
- approval_steps
- agent_jobs
- agent_job_outputs

### 15.2 Có thể cần bổ sung trong bước sau
- roles
- permissions
- project_members
- conversations
- conversation_messages
- roadmap_items
- saved_views
- notifications

### 15.3 Quy tắc dữ liệu
- không nhét task/chat/log thành JSON blob khó query
- mọi entity quan trọng phải có id, timestamps, actor, status
- activity và approval phải audit được
- AI output phải link lại task/document/job rõ ràng

---

## 16. Role / permission bản đầu đề xuất

### 16.1 Roles
- Owner/Admin
- Manager
- Staff
- Viewer
- AI Agent (system role)

### 16.2 Permission groups
- manage_projects
- manage_tasks
- assign_tasks
- manage_workers
- request_approval
- approve_items
- manage_documents
- run_ai_jobs
- view_reports
- admin_settings

---

## 17. KPI và công thức gợi ý

### 17.1 KPI nên dùng ở v1
- Active projects = count(project status in active/planning/on_hold/at_risk)
- Open tasks = count(task status not in done/cancelled/archived)
- Overdue tasks = due_at < now && status not done/cancelled/archived
- Blocked tasks = status = blocked
- Pending approvals = approval status = pending
- Running AI jobs = agent_job status = running

### 17.2 KPI chưa nên làm quá sớm
- health score phức tạp
- predictive completion
- advanced burnup/burndown
- effort estimates nếu chưa có dữ liệu tốt

---

## 18. MVP v1 đề xuất

### 18.1 Màn hình bắt buộc
1. Dashboard
2. Projects list
3. Project detail
4. Tasks center
5. Workers
6. Approvals
7. AI Jobs

### 18.2 Flow bắt buộc
1. tạo project
2. tạo task
3. assign task cho human/AI
4. update status task
5. add comment/event
6. request approval
7. run AI job
8. xem output AI

### 18.3 Không làm ngay trong MVP
- chat real-time full
- gantt chart cầu kỳ
- kanban advanced automation
- docs versioning quá sâu
- mobile app native

---

## 19. Success criteria cho v1

### Về sản phẩm
- quản lý nhìn dashboard là hiểu tình hình trong 5 giây
- có thể tìm task quá hạn và blocked rất nhanh
- biết ai/agent nào đang giữ việc gì
- approval queue rõ ràng
- AI jobs không còn là hộp đen

### Về kỹ thuật
- UI bám schema thật
- dữ liệu queryable, không JSON blob bừa bãi
- activity audit rõ ràng
- role/permission đủ để không vỡ mô hình

---

## 20. Roadmap ngay sau spec này

### Bước 2
Rà schema hiện tại và đánh dấu:
- giữ nguyên
- cần bổ sung
- cần đổi tên / chuẩn hóa

### Bước 3
Viết screen map + wireframe text cho:
- Dashboard
- Projects
- Project detail
- Tasks
- Workers
- Approvals
- AI Jobs

### Bước 4
Định nghĩa API contracts cho MVP

### Bước 5
Bắt đầu build web app thật cho module Project Manager

---

## 21. Chốt một câu

Project Manager của Dẹo Enterprise OS phải là:
- **PM tool nhìn dễ dùng như demo sheet/dashboard**
- **nhưng data model, audit, approvals, AI jobs phải chuẩn enterprise hơn hẳn demo**

Nó là lớp điều phối công việc lõi cho cả human lẫn AI trong Dẹo Enterprise OS.
