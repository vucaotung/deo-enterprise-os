# PROJECT_MANAGER_README_V1_DEO.md

Cập nhật: 2026-04-08
Trạng thái: draft-v1
Mục đích: file index cho toàn bộ bộ tài liệu **Project Manager / ERP core** của Dẹo Enterprise OS.

---

## 1. Bộ tài liệu này để làm gì

Đây là bộ blueprint chuẩn bị build module **Project Manager / ERP core** cho Dẹo Enterprise OS.

Bộ này được xây dựa trên 3 nguồn:
- schema enterprise hiện có trong repo `enterprise-os`
- bài học UI/UX và cách đóng gói sản phẩm từ sheet demo/dashboard demo
- định hướng AI-native workflow riêng của Dẹo OS

### Mục tiêu của bộ docs
- chốt hướng sản phẩm trước khi code
- tránh build UI đẹp nhưng data model sai
- tránh PM app thường, quên mất AI jobs / approvals / audit
- tạo package đủ sạch để coding agent hoặc dev người triển khai

---

## 2. Nên đọc theo thứ tự nào

### Nếu muốn đọc nhanh bản tổng hợp
1. `PROJECT_MANAGER_MASTER_PLAN_V1_DEO.md`

### Nếu muốn đọc đầy đủ theo logic thiết kế
1. `PROJECT_MANAGER_MODULE_SPEC_V1_DEO.md`
2. `PROJECT_MANAGER_SCHEMA_REVIEW_V1_DEO.md`
3. `PROJECT_MANAGER_SCHEMA_PATCHES_V1_DEO.md`
4. `PROJECT_MANAGER_WIREFRAMES_V1_DEO.md`
5. `PROJECT_MANAGER_API_CONTRACTS_V1_DEO.md`
6. `PROJECT_MANAGER_EXECUTION_PLAN_V1_DEO.md`
7. `PROJECT_MANAGER_MASTER_PLAN_V1_DEO.md`

---

## 3. Mô tả từng file

### `PROJECT_MANAGER_MODULE_SPEC_V1_DEO.md`
Bản định nghĩa module ở cấp sản phẩm:
- mục tiêu
- phạm vi
- actors
- module map
- UI/UX direction
- KPI
- success criteria

### `PROJECT_MANAGER_SCHEMA_REVIEW_V1_DEO.md`
Bản rà schema hiện tại:
- cái gì giữ
- cái gì thiếu
- cái gì cần chỉnh
- chỗ nào đang lệch model

### `PROJECT_MANAGER_SCHEMA_PATCHES_V1_DEO.md`
Bản chốt 4 hạng mục con của bước schema:
- `project_members`
- `roles / permissions`
- dictionaries + semantics
- cleanup model cũ/mới

### `PROJECT_MANAGER_WIREFRAMES_V1_DEO.md`
Wireframe text-based cho các màn chính:
- Dashboard
- Projects
- Project Detail
- Task Center
- Workers
- Approvals
- Activity
- AI Jobs

### `PROJECT_MANAGER_API_CONTRACTS_V1_DEO.md`
API contract cho MVP:
- dashboard
- projects
- tasks
- workers
- approvals
- activity
- ai jobs
- documents lite
- notifications lite

### `PROJECT_MANAGER_EXECUTION_PLAN_V1_DEO.md`
Execution plan triển khai thực chiến:
- workstreams
- build order
- sprint order
- backend/frontend/data backlog
- risks
- MVP release criteria

### `PROJECT_MANAGER_MASTER_PLAN_V1_DEO.md`
Bản canonical tổng hợp toàn bộ định hướng PM module.
Đây là file nên đọc đầu tiên nếu cần bức tranh lớn.

---

## 4. Cách dùng bộ docs này

### Dùng để review nội bộ
Đọc `MASTER_PLAN` trước, rồi soi các file chi tiết.

### Dùng để giao coding agent
Đưa trọn bộ 7 file.

### Dùng để bắt đầu code tay
Đi theo thứ tự:
1. schema patches
2. API contracts
3. wireframes
4. execution plan

### Dùng để push GitHub
Nên coi file này là **index**, còn `MASTER_PLAN` là **entrypoint nội dung**.

---

## 5. Khuyến nghị cấu trúc repo docs

### Phương án giữ nguyên nhanh gọn
Giữ toàn bộ file ngay trong:
- `enterprise-os/docs/`

### Phương án sạch hơn về sau
Tạo thư mục:
- `enterprise-os/docs/project-manager/`

và đặt tên ngắn lại:
- `README.md`
- `master-plan.md`
- `module-spec.md`
- `schema-review.md`
- `schema-patches.md`
- `wireframes.md`
- `api-contracts.md`
- `execution-plan.md`

---

## 6. Nguyên tắc canonical

Khi update sau này:
- `MASTER_PLAN` là nguồn truth ở mức chiến lược
- các file còn lại là supporting docs
- nếu có thay đổi lớn về scope/UI/API/schema thì cập nhật đồng bộ cả `MASTER_PLAN` và file chuyên đề liên quan

---

## 7. Chốt một câu

Bộ docs này là nền để build Project Manager của Dẹo Enterprise OS theo đúng tinh thần:
- dễ dùng như business dashboard tốt
- nhưng lõi dữ liệu, approvals, AI jobs, audit phải chuẩn enterprise hơn demo rất nhiều.
