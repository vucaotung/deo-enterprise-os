# PROJECT + TASK CANONICAL UPDATE — 2026-04-05

**Mục tiêu:** Chốt lại source-of-truth sau khi đã build liên tiếp `Projects`, `ProjectDetail`, `ProjectTasks` và cleanup `Tasks.tsx`, để docs không lệch khỏi code vừa triển khai.

---

## 1. Những gì đã được build thật

### Đã có thật trên web app
- `/tasks`
- `/projects`
- `/projects/:id`
- `/projects/:id/tasks`

### Files đã tồn tại và đang là runtime shell mới
- `apps/web/src/pages/Tasks.tsx`
- `apps/web/src/pages/Projects.tsx`
- `apps/web/src/pages/ProjectDetail.tsx`
- `apps/web/src/pages/ProjectTasks.tsx`

### Route shell đã nối
- `apps/web/src/App.tsx`
- `apps/web/src/components/Sidebar.tsx`

### Type layer đã mở rộng
- `apps/web/src/types.ts`
  - `Project`
  - `ProjectStatus`
  - `ProjectPriority`

---

## 2. Source-of-truth hiện tại cho task language

### Quyết định chốt
Task domain trên web app từ thời điểm này phải dùng **một ngôn ngữ canonical duy nhất**:
- `todo`
- `in_progress`
- `completed`
- `cancelled`

### Điều này áp dụng cho
- `Tasks.tsx`
- `ProjectTasks.tsx`
- task summary trong `Projects.tsx`
- task snapshot trong `ProjectDetail.tsx`
- `types.ts`
- helper/status display liên quan task

### Không xem là source-of-truth nữa
Ngôn ngữ cũ kiểu:
- `TODO`
- `IN_PROGRESS`
- `BLOCKED`
- `IN_REVIEW`
- `DONE`

chỉ nên coi là legacy / compatibility / imported debt, không phải hướng domain chuẩn cho phần task mới.

---

## 3. Source-of-truth hiện tại cho project domain

### Route truth
- `/projects` = project hub
- `/projects/:id` = project detail overview
- `/projects/:id/tasks` = project-scoped task execution view

### File truth
- `Projects.tsx` = canonical project hub page hiện tại
- `ProjectDetail.tsx` = canonical project detail shell hiện tại
- `ProjectTasks.tsx` = canonical project-scoped task view hiện tại

### Domain truth
Project Management hiện đang được chốt theo nguyên tắc:
- **Project = khung quản trị**
- **Task = đơn vị thực thi**

---

## 4. Ý nghĩa kiến trúc

Sau loạt thay đổi này, project và task không còn là hai cụm UI rời nhau.

### Thay vào đó
- `/tasks` = global execution layer
- `/projects/*` = execution by project context

### Nói cách khác
Task domain bây giờ có 2 góc nhìn hợp lệ:
1. **Global task view**
2. **Project-scoped task view**

Cả hai phải dùng cùng một task language và cùng type direction.

---

## 5. Tác động tới WEB APP CANONICALIZATION PLAN

### Phase 1
Đã làm thêm ngoài auth/app shell:
- project domain đã bắt đầu xuất hiện thật trên app
- task language đã được canonicalize mạnh hơn ở runtime layer

### Phase 2 / Phase 3
Thực tế đã bắt đầu chạm vào domain cleanup sớm hơn kế hoạch ban đầu, cụ thể ở:
- `Tasks.tsx`
- project-related child routes mới

### Kết luận vận hành
Plan cũ vẫn đúng tinh thần, nhưng execution thực tế hiện đã đi trước ở nhánh `Project + Task`.

---

## 6. Những gì còn chưa chốt

### Project supporting views chưa build
- `/projects/:id/clarifications`
- `/projects/:id/notebooks`

### Task detail chưa có route riêng canonical
- chưa có `/tasks/:id`
- chưa có project-task detail riêng

### Data/runtime thật chưa nối hoàn toàn
- các page hiện vẫn là shell + mock structure
- cần nối API/query strategy về sau

---

## 7. Quy tắc từ đây trở đi

### Với code mới liên quan task
- dùng task statuses canonical lowercase
- không tạo thêm page mới dựa trên status enum cũ
- không phát minh một task language thứ ba

### Với code mới liên quan project
- xem `/projects/*` là route tree chính thức
- không nhét project context ngược lại vào `/tasks` theo kiểu chắp vá

### Với docs mới
- phải xem các file vừa build là runtime reference hiện hành cho project-task domain

---

## 8. Bước tiếp theo hợp lý

Có 2 hướng hợp lệ:

### Hướng A — hoàn thiện project context
- `ProjectClarifications.tsx`
- `ProjectNotebooks.tsx`

### Hướng B — nối data/runtime thật
- query strategy cho `Projects.tsx`
- query strategy cho `ProjectDetail.tsx`
- query strategy cho `ProjectTasks.tsx`
- canonical task API usage thay cho mock shell

---

## 9. One-line conclusion

**Từ 2026-04-05, project-task domain của web app đã có runtime shell chính thức; source-of-truth cho task language là `todo / in_progress / completed / cancelled`, còn source-of-truth cho project routing là `/projects`, `/projects/:id`, `/projects/:id/tasks`.**
