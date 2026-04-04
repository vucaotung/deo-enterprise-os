# PROJECT MANAGEMENT WEB STRUCTURE

**Ngày:** 2026-04-05  
**Mục tiêu:** Chuyển `PROJECT_MANAGEMENT_DOMAIN_V1.md` thành cấu trúc web app cụ thể để sau này implement không bị trôi giữa domain thinking và UI routing.

---

## 1. Mục tiêu của web structure này

Tài liệu này trả lời các câu hỏi:
- Project Management sẽ sống ở route nào?
- Cần những page nào trước?
- Quan hệ giữa `Projects` và `Tasks` trên web app nên như thế nào?
- Nên build theo thứ tự nào để không phá Phase 1 canonicalization?

---

## 2. Nguyên tắc thiết kế

### Nguyên tắc 1
`/tasks` vẫn phải tồn tại như **global task view**.

### Nguyên tắc 2
`/projects/*` sẽ là **project-scoped operational view**.

### Nguyên tắc 3
Không nhét toàn bộ project management vào một page khổng lồ.

### Nguyên tắc 4
Project detail phải lấy **task execution** làm trung tâm, không chỉ là info card.

---

## 3. Route structure đề xuất

## A. Global routes
- `/tasks`
- `/clarifications`
- `/notebooks`
- `/finance`

### Vai trò
Các route này là view toàn cục theo domain.

---

## B. Project routes
- `/projects`
- `/projects/:id`
- `/projects/:id/tasks`
- `/projects/:id/clarifications`
- `/projects/:id/notebooks`
- `/projects/:id/overview` *(optional alias của detail overview)*

### Ghi chú
Trong v1 có thể để `/projects/:id` chính là overview tab.

---

## 4. Page inventory đề xuất

## A. `Projects.tsx`
### Route
- `/projects`

### Vai trò
Project hub / project list page.

### Nên hiển thị
- danh sách project
- project status
- owner
- due date
- progress %
- số task theo status
- số clarification đang mở

### Actions nên có
- tạo project mới
- lọc theo status
- lọc theo owner
- search theo tên/code

---

## B. `ProjectDetail.tsx`
### Route
- `/projects/:id`

### Vai trò
Trang trung tâm của từng project.

### Nên có sections
- header summary
- progress snapshot
- health indicators
- recent activity
- task summary
- clarification summary
- linked notes summary

### Header nên có
- project name
- code
- status
- priority
- owner
- due date
- client/company

---

## C. `ProjectTasks.tsx`
### Route
- `/projects/:id/tasks`

### Vai trò
Task view theo project.

### Nên có
- kanban/list toggle
- filter status
- filter assignee
- filter overdue
- create task in current project
- quick links sang task detail khi có

### Điểm quan trọng
Đây là nơi gắn mạnh nhất giữa Project Management và Task Management.

---

## D. `ProjectClarifications.tsx`
### Route
- `/projects/:id/clarifications`

### Vai trò
Xem mọi clarification liên quan project.

### Nguồn dữ liệu
- clarification trực tiếp của project (về sau)
- clarification phát sinh từ tasks thuộc project

---

## E. `ProjectNotebooks.tsx`
### Route
- `/projects/:id/notebooks`

### Vai trò
Knowledge view theo project.

### Nên có
- spec docs
- meeting notes
- research notes
- decision logs

---

## 5. Component structure đề xuất

## Core page components
- `ProjectList`
- `ProjectCard`
- `ProjectHeader`
- `ProjectHealthBar`
- `ProjectProgressCard`
- `ProjectTaskSummary`
- `ProjectClarificationSummary`
- `ProjectNotebookSummary`
- `ProjectMemberList`

## Task-related reusable components
- tận dụng từ task domain khi có thể
- tránh clone một bản task UI riêng chỉ cho project

### Quy tắc
**Task UI nên reusable giữa global task view và project-scoped task view.**

---

## 6. Navigation direction

## Sidebar / main nav
### Nên thêm mục mới
- `Projects`

### Vị trí hợp lý
Một trong 2 hướng:
1. đặt gần `Tasks`
2. đặt gần `CRM`

### Khuyến nghị
Đặt gần `Tasks`, vì project-task là cặp operational gần nhau nhất.

---

## 7. Data loading direction

## `Projects.tsx`
Nên gọi:
- list projects
- summary counts cho từng project

## `ProjectDetail.tsx`
Nên gọi:
- project detail
- task summary by status
- clarification summary
- linked notebook summary

## `ProjectTasks.tsx`
Nên gọi:
- tasks của project theo `project_id`

### Quan trọng
Không để mỗi widget tự fetch một kiểu lộn xộn nếu có thể gom vào query strategy rõ ràng.

---

## 8. UI states cần chuẩn bị

Mỗi page nên có:
- loading state
- empty state
- error state
- populated state

### Đặc biệt với `/projects`
Empty state phải đẩy user sang hành động:
- tạo project đầu tiên
- hoặc gán task vào project hiện có

---

## 9. Build order đề xuất

## Phase A — route + shell
- thêm route `/projects`
- thêm nav item `Projects`
- tạo `Projects.tsx`
- dựng project list mock/canonical shell trước

## Phase B — detail
- thêm `ProjectDetail.tsx`
- vào được `/projects/:id`
- có summary/header rõ ràng

## Phase C — task integration
- thêm `ProjectTasks.tsx`
- lọc task theo `project_id`
- cho tạo task trong project context

## Phase D — supporting views
- `ProjectClarifications.tsx`
- `ProjectNotebooks.tsx`

---

## 10. Mối quan hệ với code hiện tại

### Hiện tại đã có
- `Tasks.tsx` cho global tasks
- route shell qua `App.tsx`
- `Layout.tsx` + `Sidebar.tsx`

### Sẽ cần thêm
- route mới trong `App.tsx`
- nav item mới trong `Sidebar.tsx`
- page files mới trong `apps/web/src/pages/`
- type mở rộng cho `Project`

---

## 11. Type direction đề xuất

Nên thêm type:
- `Project`
- `ProjectStatus`
- `ProjectPriority`
- `ProjectSummary`
- `ProjectMember`

### `ProjectSummary` có thể gồm
- `total_tasks`
- `todo_tasks`
- `in_progress_tasks`
- `completed_tasks`
- `cancelled_tasks`
- `open_clarifications`
- `progress_percent`

---

## 12. v1 implementation boundary

### Có thể làm ngay
- project list page
- project detail page
- project task tab/page
- basic progress metrics từ tasks

### Chưa cần làm ngay
- gantt chart
- dependency timeline
- project finance sâu
- multi-level portfolio view

---

## 13. File structure đề xuất

### Pages
- `apps/web/src/pages/Projects.tsx`
- `apps/web/src/pages/ProjectDetail.tsx`
- `apps/web/src/pages/ProjectTasks.tsx`
- `apps/web/src/pages/ProjectClarifications.tsx`
- `apps/web/src/pages/ProjectNotebooks.tsx`

### Components (nếu tách)
- `apps/web/src/components/projects/ProjectCard.tsx`
- `apps/web/src/components/projects/ProjectHeader.tsx`
- `apps/web/src/components/projects/ProjectProgressCard.tsx`
- `apps/web/src/components/projects/ProjectTaskSummary.tsx`

---

## 14. Kết luận thực thi

Nếu cần build ngay theo kiểu ít rủi ro nhất, thứ tự tốt nhất là:
1. thêm `Projects` vào navigation + routing
2. tạo `Projects.tsx` làm project hub
3. tạo `ProjectDetail.tsx`
4. nối `ProjectTasks.tsx` vào task domain hiện tại

---

## 15. Một câu chốt

**Trên web app, Project Management không nên là một module trang trí; nó phải là lớp điều hướng công việc theo ngữ cảnh project, còn Task Management là lớp thực thi nằm bên trong ngữ cảnh đó.**
