# PROJECT_MANAGER_EXECUTION_PLAN_V1_DEO.md

Cập nhật: 2026-04-08
Trạng thái: draft-v1
Mục tiêu: kế hoạch triển khai thực tế module **Project Manager / ERP core** cho Dẹo Enterprise OS.

---

## 1. Mục tiêu của execution plan

Sau khi đã có:
- module spec
- schema review
- schema patches
- wireframes
- API contracts

thì execution plan này trả lời câu hỏi:
**build cái gì trước, theo thứ tự nào, ai làm gì, mốc nào ra được MVP xài được.**

---

## 2. Nguyên tắc triển khai

### 2.1 Không build cả thế giới ngay
PM/ERP là hố đen nếu ôm quá nhiều.
Triển khai theo lớp:
1. data foundation
2. backend API
3. web UI core
4. AI-native flows
5. polish + hardening

### 2.2 UI và schema phải đi cùng nhau
- không thiết kế UI quá xa schema thật
- không để schema “enterprise” nhưng UI không dùng được

### 2.3 MVP phải usable
MVP không chỉ là demo đẹp.
Nó phải thật sự làm được:
- tạo project
- tạo task
- assign
- update status
- approve
- xem AI jobs
- đọc dashboard cơ bản

---

## 3. Deliverables cần có

### 3.1 Backend
- migration/schema patch files
- seed/demo data chuẩn PM module
- REST APIs v1
- validation/business rules

### 3.2 Frontend
- app shell/layout
- dashboard
- project list/detail
- tasks center
- approvals
- AI jobs
- workers

### 3.3 Infra/ops
- local dev bootstrap chạy ổn
- env/config rõ
- logging cơ bản
- error handling cơ bản

### 3.4 Docs
- canonical PM docs index
- API contract docs
- schema patch docs
- implementation notes

---

## 4. Workstreams chính

## 4.1 Workstream A — Data foundation
### Mục tiêu
Làm sạch schema để đủ chắc cho PM module.

### Việc
1. bổ sung `project_members`
2. thêm `roles`, `permissions`, `role_permissions`, `worker_roles`
3. chốt dictionaries/status constants
4. dọn model cũ vs mới (`users` vs `workers`, `agent_assignments` vs `ai_agents`)
5. thêm field hỗ trợ UI nếu cần (`health_status`, `progress_percent`, v.v. theo chiến lược)

### Output
- migration SQL files
- seed v1 sạch
- schema docs cập nhật

---

## 4.2 Workstream B — Backend API
### Mục tiêu
Có API đủ để frontend PM chạy thật.

### Ưu tiên backend
#### Phase B1
- dashboard summary
- projects list/detail/create/update
- tasks list/detail/create/update
- assign task
- task status change

#### Phase B2
- approvals list/detail/decide
- workers list/detail/workload
- ai-jobs list/detail/create

#### Phase B3
- activity feed
- documents lite
- notifications lite
- search/quick-create

### Output
- API routes
- service layer
- DTO mappers
- validation
- integration tests cơ bản

---

## 4.3 Workstream C — Frontend PM UI
### Mục tiêu
Dựng app shell và các màn lõi.

### Phase C1
- app layout
- sidebar/topbar
- dashboard
- projects list

### Phase C2
- project detail
- task center table/board
- task drawer

### Phase C3
- approvals page
- ai jobs page
- workers page
- activity page

### Output
- reusable components
- page routes
- data hooks
- loading/error/empty states

---

## 4.4 Workstream D — AI-native behavior
### Mục tiêu
Làm rõ khác biệt Dẹo OS với PM app thường.

### Việc
1. tạo AI job từ task
2. hiển thị logs/output AI
3. link job -> task -> document -> approval
4. support waiting_approval khi AI ra output cần duyệt
5. hiển thị AI ops widget trên dashboard

### Output
- AI Jobs page usable
- dashboard AI ops widget
- task detail hiển thị AI jobs

---

## 4.5 Workstream E — Demo/seed data và UX truthfulness
### Mục tiêu
Có demo data sạch, đủ thật để test UI/UX, không fake kiểu sheet cũ.

### Việc
1. seed companies/workers/projects/tasks hợp logic
2. seed approvals/AI jobs/activity
3. tránh plain-text auth kiểu demo sheet
4. tránh dữ liệu ngày tháng mâu thuẫn
5. có 2-3 scenario demo chuẩn

### Demo scenarios đề xuất
- Scenario 1: dự án active có task quá hạn
- Scenario 2: task giao AI, output chờ duyệt
- Scenario 3: dự án at_risk vì blocked tasks

---

## 5. Thứ tự build đề xuất

## Phase 1 — Foundation
### Mục tiêu
Có schema usable + backend bootstrap đúng.

### Việc
- migrations patch schema
- cleanup model cũ/mới
- seed sạch
- constants dictionaries

### Definition of done
- DB migrate được từ đầu
- schema docs khớp DB
- không còn seed lệch model canonical

---

## Phase 2 — PM core backend
### Mục tiêu
Có API cho project/task/dashboard.

### Việc
- dashboard summary APIs
- projects CRUD lite
- tasks CRUD lite
- assign/status endpoints
- workers list/detail/workload

### Definition of done
- frontend có thể gọi data thật
- API response bám contract

---

## Phase 3 — PM core frontend
### Mục tiêu
Có web app usable cho quản lý.

### Việc
- app shell
- dashboard page
- projects list/detail
- tasks center
- task drawer

### Definition of done
- có thể tạo project/task và theo dõi từ UI
- có filter cơ bản
- có loading/error/empty states

---

## Phase 4 — Approval + AI jobs
### Mục tiêu
Làm ra màu Enterprise OS thật.

### Việc
- approvals page/flow
- AI Jobs page
- task detail tích hợp approvals + AI
- dashboard widgets liên quan

### Definition of done
- có thể request approval
- có thể duyệt/reject
- có thể tạo và xem AI jobs linked task

---

## Phase 5 — Activity + polish
### Mục tiêu
Tăng độ tin cậy và cảm giác “sống”.

### Việc
- activity feed chuẩn
- notifications lite
- documents lite
- search/quick create
- UX polish
- seed scenarios chuẩn

### Definition of done
- có demo end-to-end mượt
- có dữ liệu đủ đẹp để review/pitch/test

---

## 6. Backlog chi tiết theo team logic

## 6.1 Backend task list
### Core schema
- [ ] add project_members table
- [ ] add RBAC tables
- [ ] define dictionaries/constants
- [ ] cleanup legacy model references

### Project/task APIs
- [ ] GET /dashboard/summary
- [ ] GET /projects
- [ ] POST /projects
- [ ] GET /projects/:id
- [ ] PATCH /projects/:id
- [ ] GET /tasks
- [ ] POST /tasks
- [ ] GET /tasks/:id
- [ ] PATCH /tasks/:id
- [ ] POST /tasks/:id/assign
- [ ] POST /tasks/:id/status

### Worker/approval/AI APIs
- [ ] GET /workers
- [ ] GET /workers/:id
- [ ] GET /workers/:id/workload
- [ ] GET /approvals
- [ ] POST /approvals
- [ ] POST /approvals/:id/approve
- [ ] POST /approvals/:id/reject
- [ ] GET /ai-jobs
- [ ] POST /tasks/:id/ai-jobs
- [ ] GET /ai-jobs/:id/logs
- [ ] GET /ai-jobs/:id/outputs

---

## 6.2 Frontend task list
### App shell
- [ ] sidebar layout
- [ ] topbar
- [ ] route skeleton
- [ ] theme/tokens basic

### Dashboard
- [ ] KPI cards
- [ ] priority projects widget
- [ ] due tasks widget
- [ ] approvals widget
- [ ] AI ops widget
- [ ] workload widget

### Projects
- [ ] project list cards/table
- [ ] project filters
- [ ] project detail overview
- [ ] project members section
- [ ] project task tab

### Tasks
- [ ] task table view
- [ ] task board view
- [ ] task drawer
- [ ] assign flow
- [ ] status change flow

### Approval/AI/Workers
- [ ] approvals list + detail drawer
- [ ] ai jobs list + detail drawer
- [ ] workers list + detail
- [ ] activity feed page

---

## 6.3 Data/seed task list
- [ ] seed 1 company
- [ ] seed 2 managers, 3 staff, 2 AI agents
- [ ] seed 4-6 projects ở nhiều trạng thái
- [ ] seed 20-40 tasks hợp logic
- [ ] seed approvals pending/done/rejected
- [ ] seed AI jobs running/done/failed
- [ ] seed activity timeline đẹp

---

## 7. MVP release criteria

## 7.1 Functional
- tạo project được
- tạo task được
- assign task cho human/AI được
- cập nhật status được
- dashboard ra số liệu đúng
- approvals chạy được
- AI jobs hiển thị được

## 7.2 UX
- màn hình không bị scaffold thô sơ
- empty/loading/error states rõ
- thao tác chính không quá nhiều click
- drawer/detail flow mượt

## 7.3 Data quality
- seed không fake ngớ ngẩn
- dates/statuses hợp logic
- không có JSON blob kiểu sheet demo

## 7.4 Truthfulness
- dashboard số liệu bám query thật
- AI job status bám trạng thái thật
- approval queue bám approval records thật

---

## 8. Đề xuất implementation order thực chiến

### Sprint 1
- schema patches
- cleanup legacy model
- seed clean v1
- dashboard summary API
- projects/tasks basic APIs

### Sprint 2
- app shell
- dashboard page
- projects list/detail
- tasks center

### Sprint 3
- approvals APIs + UI
- AI jobs APIs + UI
- workers page

### Sprint 4
- activity page
- documents lite
- quick create/search
- polish + bugfix

---

## 9. Risk register ngắn

### Risk 1 — schema cũ/mới lẫn nhau
**Giảm thiểu:** cleanup sớm trước khi code nhiều.

### Risk 2 — UI đẹp nhưng API không ra đúng data shape
**Giảm thiểu:** bám chặt API contract docs.

### Risk 3 — ôm quá nhiều module ERP
**Giảm thiểu:** giữ đúng PM core + AI layer.

### Risk 4 — demo data quá giả làm review sai sản phẩm
**Giảm thiểu:** seed scenario logic, có tension thật.

---

## 10. Coding-agent handoff package

Khi giao coding agent build, nên đính kèm 5 file sau:
- `PROJECT_MANAGER_MODULE_SPEC_V1_DEO.md`
- `PROJECT_MANAGER_SCHEMA_REVIEW_V1_DEO.md`
- `PROJECT_MANAGER_SCHEMA_PATCHES_V1_DEO.md`
- `PROJECT_MANAGER_WIREFRAMES_V1_DEO.md`
- `PROJECT_MANAGER_API_CONTRACTS_V1_DEO.md`

Và thêm file này:
- `PROJECT_MANAGER_EXECUTION_PLAN_V1_DEO.md`

---

## 11. Chốt một câu

Execution plan cho thấy: module Project Manager của Dẹo Enterprise OS đã đủ rõ để bắt đầu build thật.
Từ đây, việc quan trọng là giữ phạm vi hẹp, build đúng thứ tự, và bám chặt nguyên tắc:
**schema thật + UI dễ dùng + AI-native workflow thật.**
