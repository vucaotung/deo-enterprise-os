# PROJECT_MANAGER_SCHEMA_REVIEW_V1_DEO.md

Cập nhật: 2026-04-08
Trạng thái: draft-v1
Phạm vi: rà schema hiện tại của `enterprise-os` để chuẩn bị build module **Project Manager / ERP core**.

---

## 1. Kết luận nhanh

Schema hiện tại của Dẹo Enterprise OS **đi đúng hướng enterprise và tốt hơn rất nhiều** so với sheet demo.

### Chốt 1 câu
- **Giữ khung schema hiện tại làm nền**
- **Không copy data model của sheet demo**
- **Bổ sung một số bảng/phần chuẩn hóa để phục vụ UI/UX và PM module tốt hơn**

Nếu ví repo hiện tại là xương sống, thì:
- xương sống **ổn**
- còn thiếu vài khớp để đi đứng mượt
- có một ít chỗ naming/model cũ và mới đang **lệch nhau**

---

## 2. Đánh giá tổng thể schema hiện tại

## 2.1 Điểm mạnh lớn
Schema hiện tại đã có gần đủ các nhóm cốt lõi cho Enterprise OS:

### Core business
- `companies`
- `projects`
- `tasks`

### Worker model
- `workers`
- `human_workers`
- `ai_agents`

### Assignment / collaboration
- `task_assignments`
- `task_comments`
- `task_events`

### Documents / approvals
- `documents`
- `document_versions`
- `document_links`
- `approvals`
- `approval_steps`

### AI-native layer
- `agent_jobs`
- `agent_job_outputs`
- `agent_run_logs`
- `agent_skills`

### Notifications / reminders / intake / ops
- `notifications`
- `reminders`
- `integration_accounts`
- `intake_items`
- `mailbox_events`
- `activity_logs`

### Mở rộng ERP sau này
- `attendance_events`
- `finance_entries`
- `legal_items`

=> nghĩa là repo hiện tại **không hề non về schema**, mà thực ra đã là một bộ khung enterprise khá ổn.

---

## 2.2 Vấn đề chính hiện tại
Không phải “thiếu sạch từ đầu”, mà là 4 nhóm vấn đề:

1. **Thiếu vài bảng hỗ trợ UI/UX PM module**
2. **Một số status/text field còn quá mở**
3. **Có model/seed cũ lệch với model mới**
4. **Chưa tối ưu riêng cho màn Project Manager**

---

## 3. Bảng nào nên GIỮ nguyên làm lõi

## 3.1 Giữ nguyên gần như hoàn toàn

### `companies`
Dùng tốt làm tenant / business unit gốc.

### `workers`
Đây là bảng cực quan trọng và nên giữ làm trục trung tâm.
Điểm mạnh là gom human + AI về cùng một khái niệm `worker`.

### `human_workers`
Giữ. Hợp lý để mở rộng HR-lite mà không làm bẩn bảng `workers`.

### `ai_agents`
Giữ. Đây là lõi khác biệt của Dẹo OS so với PM app thường.

### `projects`
Giữ. Cấu trúc hiện tại đủ tốt cho v1.

### `tasks`
Giữ. Đây là bảng trung tâm của PM module.
Cấu trúc hiện tại đã khá chuẩn.

### `task_assignments`
Giữ. Nên tồn tại riêng thay vì chỉ nhét current assignee trong `tasks`.
Giúp trace lịch sử giao việc.

### `task_comments`
Giữ. Dùng cho collaboration nội bộ gọn và đúng bài.

### `task_events`
Giữ. Quan trọng cho timeline theo task.

### `documents`, `document_versions`, `document_links`
Giữ. Không cần làm sâu thêm ở MVP, nhưng cấu trúc này đúng hướng.

### `approvals`, `approval_steps`
Giữ. Đây là phần rất quan trọng để từ PM tool nâng thành Enterprise OS.

### `agent_jobs`, `agent_job_outputs`, `agent_run_logs`
Giữ. Đây là lớp AI operations lõi.

### `notifications`, `reminders`
Giữ. Có thể dùng cho dashboard + channel delivery + Aurora.

### `activity_logs`
Giữ. Rất quan trọng cho audit feed toàn hệ.

---

## 4. Bảng nào nên GIỮ nhưng cần CHỈNH / bổ sung nhẹ

## 4.1 `projects`
Hiện có:
- company_id
- code
- name
- description
- status
- priority
- owner_worker_id
- start_date
- due_date
- drive_folder_url
- source_channel

### Nhận xét
Ổn cho v1, nhưng nếu build PM UI thì nên bổ sung:
- `completed_at`
- `archived_at`
- `risk_level`
- `health_status`
- `progress_percent` (có thể là cache/derived field, không bắt buộc)
- `created_by_worker_id`

### Kết luận
**Giữ bảng, bổ sung metadata quản trị dự án.**

---

## 4.2 `tasks`
Hiện đã có nhiều field đúng bài:
- project_id
- parent_task_id
- title
- description
- status
- priority
- due_at
- owner/current_assignee
- approval flag

### Nhận xét
Đây là bảng mạnh nhất của schema hiện tại.

### Đề xuất bổ sung
- `start_at`
- `estimated_effort`
- `actual_effort`
- `completed_at` dùng rõ hơn (đã có `closed_at`, nhưng cần thống nhất nghĩa)
- `sort_order` cho board/list
- `progress_percent` nếu muốn track task lớn
- `is_milestone` boolean

### Điểm cần chốt
Hiện có cả:
- `status`
- `closed_at`

Cần định nghĩa rõ:
- `done` là business completion
- `closed_at` là closed timestamp

### Kết luận
**Giữ bảng, chuẩn hóa semantics + bổ sung vài field hỗ trợ UX.**

---

## 4.3 `task_comments`
### Nhận xét
Ổn cho v1, nhưng nếu muốn dùng như lớp chat nhẹ theo task thì nên thêm:
- `edited_at`
- `parent_comment_id` (nếu muốn thread)
- `attachments_json` hoặc link sang documents

### Kết luận
**Giữ, mở rộng sau nếu cần.**

---

## 4.4 `task_events`
### Nhận xét
Đúng bài, nhưng `event_type` đang là text mở.

### Đề xuất
Chưa cần enum DB ngay, nhưng cần chuẩn hóa event dictionary ở app layer:
- task_created
- task_assigned
- task_status_changed
- task_priority_changed
- approval_requested
- approval_decided
- agent_job_linked
- comment_added
- document_linked

### Kết luận
**Giữ, nhưng phải có event taxonomy chuẩn.**

---

## 4.5 `activity_logs`
### Nhận xét
Rất tốt cho feed toàn hệ.

### Đề xuất
Nên coi `activity_logs` là **feed cross-entity**, còn `task_events` là **timeline mức task**.

Cần bổ sung chuẩn app-layer cho:
- action_type dictionary
- object_type dictionary
- summary rendering rules

### Kết luận
**Giữ và dùng mạnh cho dashboard/activity page.**

---

## 4.6 `notifications`
### Nhận xét
Bảng này đúng hướng, nhưng hiện hơi generic.

### Đề xuất thêm
- `delivery_provider` (dashboard, telegram, zalo, email)
- `external_delivery_ref`
- `failure_reason`
- `dedupe_key`

Nếu không thêm ngay DB thì ít nhất app layer phải có semantic rõ.

### Kết luận
**Giữ, vì sẽ rất quan trọng cho Aurora + PM alerts.**

---

## 5. Bảng nào đang thiếu cho PM module và NÊN THÊM

## 5.1 `project_members`
Hiện có owner dự án, nhưng chưa có bảng member của project.

### Vì sao cần
UI Project Detail thường cần:
- ai thuộc dự án này
- vai trò của họ trong dự án
- ai được xem/chỉnh/sở hữu

### Gợi ý cấu trúc
- id
- project_id
- worker_id
- membership_role (owner, manager, contributor, viewer)
- joined_at

### Kết luận
**Nên thêm sớm.**

---

## 5.2 `roles` và `permissions`
Hiện role đang nằm rải trong `workers.role_name` hoặc app-level logic.

### Vì sao cần
V1 PM module cần quyền rõ hơn:
- manage_projects
- assign_tasks
- approve_items
- run_ai_jobs
- view_reports

### Tối thiểu nên có
- `roles`
- `permissions`
- `role_permissions`
- `worker_roles`

Nếu chưa muốn làm full RBAC, có thể làm bản light.

### Kết luận
**Thiếu và rất nên thêm trước khi UI lớn lên.**

---

## 5.3 `roadmap_items` hoặc tương đương
Demo sheet có tab `Update`, khá hữu ích cho backlog tính năng.

### Dùng để làm gì
- theo dõi ý tưởng tính năng
- update nội bộ
- plan version

### Không bắt buộc cho PM core v1
Nhưng nếu muốn giữ tinh thần demo và có trang “Update” đẹp thì nên thêm.

### Kết luận
**Nên thêm sau PM core hoặc gắn tạm bằng tasks loại product-backlog.**

---

## 5.4 `conversations` / `conversation_messages`
Hiện repo chưa thấy chat model chuẩn.

### Thực tế
V1 PM module không nhất thiết cần chat full như Slack.
Có thể dùng:
- `task_comments` cho discussion theo task
- `activity_logs` cho feed

### Nhưng nếu muốn có module “Chat” như demo
Thì nên thêm riêng:
- `conversations`
- `conversation_participants`
- `conversation_messages`

### Kết luận
**Không bắt buộc cho MVP PM, nhưng thiếu nếu muốn bám sát demo UI.**

---

## 5.5 `saved_views`
Cho task center/dashboard về sau.

### Vì sao đáng nghĩ sớm
Khi task nhiều lên, quản lý sẽ cần:
- view của tôi
- overdue
- waiting approval
- AI jobs failed

### Kết luận
**Chưa cần ngay DB ở vòng đầu, nhưng nên có trong roadmap.**

---

## 6. Chỗ nào nên đổi tên / chuẩn hóa

## 6.1 `workers.role_name`
Hiện field này hữu ích để hiển thị, nhưng không nên dùng làm permission source.

### Khuyến nghị
- giữ `role_name` như label hiển thị
- phân quyền thật chuyển qua `roles/permissions`

---

## 6.2 `tasks.owner_worker_id` vs `current_assignee_worker_id`
Cần định nghĩa thật rõ:
- `owner_worker_id` = người chịu trách nhiệm cuối
- `current_assignee_worker_id` = người/agent đang trực tiếp xử lý bước hiện tại

Nếu không chốt kỹ, UI sẽ loạn.

### Kết luận
**Không cần đổi tên, nhưng phải ghi semantic chuẩn trong docs/API.**

---

## 6.3 `closed_at` trong `tasks`
Tên này hơi generic.

### Gợi ý
Hoặc:
- giữ `closed_at` và định nghĩa rõ = thời điểm task kết thúc luồng sống

Hoặc:
- đổi thành `completed_at` nếu business muốn đơn giản

Dẹo nghiêng về giữ `closed_at` nếu sau này có reopen/cancel/archive.

### Kết luận
**Giữ được, nhưng phải thống nhất nghĩa.**

---

## 6.4 `status` text ở nhiều bảng
Một số bảng đang để `status TEXT` thay vì enum.

### Nhận xét
Điều này giúp linh hoạt, nhưng rủi ro:
- app mỗi nơi dùng một kiểu
- dashboard khó tin cậy

### Khuyến nghị
Không cần enum hoá tất cả ngay trong DB, nhưng phải có:
- status dictionary chuẩn ở app/docs
- validation layer

### Kết luận
**Chưa cần đụng mạnh DB, nhưng phải chuẩn hóa app contract.**

---

## 7. Chỗ nào đang có model lệch / nợ kỹ thuật

## 7.1 Seed file `006_seed_aurora_live_registry.sql`
File này đang nói theo model cũ:
- `deo.users`
- `deo.agent_assignments`

Trong khi schema đọc ở `001_init_schema.sql` lại dùng model mới:
- `workers`
- `human_workers`
- `ai_agents`

### Nghĩa là gì
Có dấu hiệu repo đang có **2 lớp mô hình**:
- lớp cũ: users/agent_assignments
- lớp mới: workers/ai_agents

### Đây là việc phải xử lý
Nếu không sẽ gây:
- seed sai target
- docs lệch schema
- API code lẫn mô hình cũ/mới

### Kết luận
**Đây là một nợ kỹ thuật thật, cần dọn sớm.**

---

## 8. Mapping schema hiện tại với PM module

## 8.1 Dashboard
Dùng được từ:
- `projects`
- `tasks`
- `approvals`
- `agent_jobs`
- `activity_logs`
- `notifications`

### Kết luận
**Schema hiện tại đủ để build dashboard v1.**

---

## 8.2 Project List + Project Detail
Dùng được từ:
- `projects`
- `tasks`
- `task_events`
- `task_comments`
- `documents`
- `approvals`
- `agent_jobs`

### Thiếu nhẹ
- `project_members`

### Kết luận
**Build được, nhưng nên thêm project_members để UI hợp lý hơn.**

---

## 8.3 Task Center
Dùng được từ:
- `tasks`
- `task_assignments`
- `task_comments`
- `task_events`

### Thiếu nhẹ
- `sort_order`
- labels hoặc tags usage rõ hơn
- saved views (sau)

### Kết luận
**Build được khá tốt ngay.**

---

## 8.4 Worker screen
Dùng được từ:
- `workers`
- `human_workers`
- `ai_agents`
- `tasks`
- `task_assignments`
- `agent_jobs`

### Đây là điểm mạnh của schema hiện tại
Nó hơn hẳn demo ở chỗ đã nghĩ tới AI như worker thật.

### Kết luận
**Nên coi đây là selling point chính của Dẹo OS.**

---

## 8.5 Approval screen
Dùng được từ:
- `approvals`
- `approval_steps`
- `tasks`
- `documents`
- `workers`

### Kết luận
**Đủ nền cho approval UI ngon.**

---

## 8.6 AI Jobs screen
Dùng được từ:
- `agent_jobs`
- `agent_job_outputs`
- `agent_run_logs`
- `workers`
- `ai_agents`

### Kết luận
**Schema hiện tại rất hợp để làm màn AI Jobs xịn.**

---

## 9. Đề xuất thay đổi theo mức ưu tiên

## 9.1 Phải làm sớm
1. Dọn model lệch cũ/mới (`users/agent_assignments` vs `workers/ai_agents`)
2. Bổ sung `project_members`
3. Chốt dictionary chuẩn cho statuses/event types/action types
4. Chốt semantics của `owner_worker_id` / `current_assignee_worker_id` / `closed_at`
5. Chốt role/permission strategy (ít nhất bản light)

## 9.2 Nên làm trong vòng MVP
1. Thêm `roles/permissions` hoặc layer tương đương
2. Bổ sung field hỗ trợ UI cho projects/tasks
3. Chuẩn hóa notifications/reminders để hỗ trợ dashboard + Aurora + multi-channel
4. Quy hoạch comments/documents/approvals linkage rõ ràng

## 9.3 Làm sau MVP
1. Chat tables riêng
2. Roadmap/update module riêng
3. Saved views / advanced filters
4. Workload analytics sâu
5. Predictive/project health scoring

---

## 10. Final recommendation

### Giữ nguyên làm nền
- companies
- workers
- human_workers
- ai_agents
- projects
- tasks
- task_assignments
- task_comments
- task_events
- documents*
- approvals*
- agent_jobs*
- activity_logs
- notifications
- reminders

(* cực quan trọng cho bản Enterprise OS thật)

### Cần bổ sung
- project_members
- roles
- permissions
- worker_roles / role_permissions
- roadmap_items (optional, phase sau)
- conversations/messages (optional, phase sau)

### Cần chuẩn hóa
- status dictionaries
- event dictionaries
- task field semantics
- notification delivery semantics
- naming/model cũ vs mới

---

## 11. Chốt một câu

Schema hiện tại của Dẹo Enterprise OS **đủ tốt để build Project Manager v1**, và thực ra **mạnh hơn sheet demo rất nhiều**.

Việc đúng bây giờ không phải làm lại từ đầu, mà là:
1. giữ lõi schema hiện tại
2. vá vài lỗ phục vụ PM UX
3. dọn nợ kỹ thuật model cũ/mới
4. rồi đi tiếp sang wireframe + API contract
