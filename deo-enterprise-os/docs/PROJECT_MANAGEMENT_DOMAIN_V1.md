# PROJECT MANAGEMENT DOMAIN V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Định nghĩa domain **Project Management** cho Dẹo Enterprise OS theo hướng gắn chặt với **Task Management**, để sau này triển khai UI/API/data model có cùng ngôn ngữ nghiệp vụ.

---

## 1. Tư duy chốt

Trong OS này, **Project Management không đứng riêng khỏi Task**.

Thay vào đó:
- **Project** là lớp tổ chức công việc ở mức cao
- **Task** là đơn vị vận hành thực thi bên trong project
- **Clarification / Conversation / Notebook / Finance** là lớp phụ trợ xoay quanh project và task

### Một câu chốt
> **Project là khung quản trị. Task là đơn vị thực thi.**

---

## 2. Vai trò của domain Project Management

Domain này phải trả lời được các câu hỏi:
- Công ty đang chạy những project nào?
- Mỗi project đang ở giai đoạn nào?
- Project có những task nào?
- Task nào block, task nào quá hạn, task nào cần clarification?
- Project đang tiêu tốn nguồn lực ra sao?
- Project gắn với client nào, agent nào, team nào?

---

## 3. Scope của v1

Project Management v1 nên đủ để làm được:
- tạo và quản lý project
- gán task vào project
- nhìn task theo project
- nhìn tiến độ project theo task status
- xem owner / assignee / due date / priority
- xem clarification liên quan project
- xem notebooks liên quan project
- liên kết project với client/company

### Chưa cần ở v1
- gantt chart xịn
- dependency graph phức tạp
- resource planning sâu
- sprint/epic đầy đủ kiểu Jira
- workload forecasting sâu

---

## 4. Thực thể cốt lõi

## A. Project
### Vai trò
Container quản lý công việc ở cấp business/operational.

### Trường đề xuất
- `id`
- `company_id`
- `client_id` (nullable)
- `name`
- `code`
- `description`
- `status` (`planning`, `active`, `on_hold`, `completed`, `cancelled`)
- `priority` (`low`, `medium`, `high`)
- `owner_id`
- `start_date`
- `due_date`
- `completed_at` (nullable)
- `created_at`
- `updated_at`

### Ý nghĩa
- 1 project có thể có nhiều task
- 1 project có thể gắn 1 client hoặc nhiều object phụ trợ về sau

---

## B. Task
### Vai trò
Đơn vị thực thi nằm trong hoặc ngoài project.

### Trường nên giữ/chuẩn hóa
- `id`
- `company_id`
- `project_id` (nullable)
- `title`
- `description`
- `status` (`todo`, `in_progress`, `completed`, `cancelled`)
- `priority` (`low`, `medium`, `high`)
- `assigned_to`
- `created_by`
- `due_date`
- `completed_at` (nullable)
- `has_clarification`
- `clarification_count`
- `created_at`
- `updated_at`

### Ý nghĩa
- task có thể sống độc lập
- nhưng khi gắn project thì phải trở thành phần của project execution view

---

## C. ProjectMember (v1 hoặc v1.1)
### Vai trò
Map người/agent vào project.

### Trường đề xuất
- `id`
- `project_id`
- `member_type` (`user`, `agent`)
- `member_id`
- `role` (`owner`, `manager`, `contributor`, `watcher`)
- `created_at`

### Lý do
Về lâu dài project không chỉ có owner một người, mà còn cần team view.

---

## D. ProjectNotebookLink
### Vai trò
Nối notebooks vào project.

### Trường đề xuất
- `id`
- `project_id`
- `notebook_id`
- `relation_type` (`spec`, `meeting_note`, `research`, `decision`, `other`)
- `created_at`

---

## E. ProjectClarificationView
Không nhất thiết là bảng riêng; có thể là view/query từ clarifications.

### Vai trò
Cho thấy project đang bị block bởi bao nhiêu clarification.

---

## 5. Quan hệ chính

- `company` 1-n `projects`
- `client` 1-n `projects`
- `project` 1-n `tasks`
- `project` 1-n `project_members`
- `project` 1-n linked notebooks
- `project` 1-n clarifications (qua tasks hoặc trực tiếp về sau)

---

## 6. Góc nhìn UI nên có

## A. Project Hub
Route đề xuất:
- `/projects`

### Nên hiển thị
- list project
- status
- owner
- due date
- progress snapshot
- task counts theo status

---

## B. Project Detail
Route đề xuất:
- `/projects/:id`

### Nên có tabs/sections
- Overview
- Tasks
- Clarifications
- Notes / Notebooks
- Members
- Finance snapshot (về sau)

---

## C. Task View by Project
Route đề xuất:
- `/projects/:id/tasks`

### Vai trò
Cho phép nhìn task theo context project, không chỉ global tasks list.

---

## 7. Kết hợp Project và Task như thế nào

### Không nên làm
- Project riêng một cục, Task riêng một cục, không liên kết sâu

### Nên làm
- Global tasks view vẫn tồn tại
- nhưng project detail phải có task subview mạnh
- progress project được tính từ task execution

### Công thức progress v1 đơn giản
Ví dụ:
- `completed / total tasks`
- có thể weight theo priority ở v1.1

---

## 8. Trạng thái nên dùng

## Project status
- `planning`
- `active`
- `on_hold`
- `completed`
- `cancelled`

## Task status
- `todo`
- `in_progress`
- `completed`
- `cancelled`

### Lưu ý
Không nên để Project status và Task status nói hai ngôn ngữ hoàn toàn khác nhau nếu không cần.

---

## 9. Route map đề xuất cho domain này

- `/projects`
- `/projects/:id`
- `/projects/:id/tasks`
- `/projects/:id/clarifications`
- `/projects/:id/notebooks`
- `/projects/:id/finance` *(về sau)*

### Liên kết với routes hiện có
- `/tasks` = global task view
- `/clarifications` = global clarification view
- `/notebooks` = global notebook view
- `/finance` = global finance hub

### Còn `/projects/*`
= project-scoped operational view

---

## 10. File/page direction đề xuất

### Ngắn hạn
- giữ `Tasks.tsx` cho global tasks
- thêm về sau:
  - `Projects.tsx`
  - `ProjectDetail.tsx`
  - `ProjectTasks.tsx`

### Dài hạn
Project domain sẽ là cầu nối giữa:
- CRM
- Tasks
- Clarifications
- Knowledge
- Finance

---

## 11. Definition of Done cho Project Management v1

Được coi là đạt khi:
- có list project
- có detail project
- task có thể gắn project
- xem task theo project được
- progress project được tính từ tasks
- project có owner và due date
- project có thể nối client/company

---

## 12. Một câu chốt

**Project Management v1 của Dẹo Enterprise OS phải được xây theo kiểu project là khung quản trị và task là đơn vị thực thi, để toàn bộ hệ sau này (CRM, clarifications, knowledge, finance, agents) đều có thể xoay quanh project một cách tự nhiên.**
