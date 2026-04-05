# N8N WORKFLOW `docs.materialize.v1` SPEC

**Ngày:** 2026-04-05  
**Mục tiêu:** Định nghĩa spec node-by-node cho workflow `docs.materialize.v1`, dùng để materialize một văn bản đã được draft/chốt nội dung thành Google Doc thật, đặt đúng folder, share reviewer nếu cần và callback về Work OS.

---

## 1. Khi nào dùng workflow này

Workflow này dùng khi:
- nội dung văn bản đã được agent soạn hoặc user chốt
- không còn là bước “draft trong chat” nữa
- cần tạo Google Doc thật để review/edit/finalize

### Ví dụ use cases
- tạo đề xuất từ draft đã duyệt
- tạo biên bản họp từ outline đã chốt
- tạo memo nội bộ từ content final
- tạo kế hoạch từ text đã thống nhất

---

## 2. Khác gì với `docs.from-template.v1`

## `docs.from-template.v1`
- copy template có sẵn
- replace placeholders
- hợp với form cố định

## `docs.materialize.v1`
- tạo doc từ final content
- không phụ thuộc template placeholder
- hợp với văn bản mới từ chat/context

---

## 3. Input contract

### Trường quan trọng nhất
- `invocation_id`
- `workflow_key = docs.materialize.v1`
- `objective`
- `context`
- `payload.title`
- `payload.final_content`
- `payload.target_folder`
- `payload.document_type`
- `payload.status`
- `payload.version`
- `reviewers`
- `callback.url`
- `callback.token`

---

## 4. Output contract

### Success callback
- `status=completed`
- `generated_title`
- `file_id`
- `file_url`
- `folder_id`
- `folder_path`
- `generation_mode=draft_from_context`
- `document_type`
- `reviewer_emails`
- `permission_mode`

### Failure callback
- `status=failed`
- `error_message`
- `workflow_key`
- `invocation_id`

---

## 5. Assumptions cho V1

### Assumption 1
Final content đã được chốt ở Work OS / agent layer trước khi gọi workflow.

### Assumption 2
Payload đã có `target_folder` hoặc Work OS đã resolve folder trước.

### Assumption 3
n8n có credential dùng được với Google Drive + Google Docs.

---

## 6. Node-by-node flow

## Node 1 — Webhook Trigger
### Loại node
`Webhook`

### Method
`POST`

### Path gợi ý
`/backoffice/docs/materialize`

### Validation tối thiểu
- `workflow_key === docs.materialize.v1`
- có `invocation_id`
- có `payload.title`
- có `payload.final_content`
- có `callback.url`

---

## Node 2 — Auth / Guard Check
### Loại node
`IF` hoặc `Code`

### Vai trò
Verify auth header nếu có yêu cầu.

---

## Node 3 — Normalize Input
### Loại node
`Code`

### Output normalized nên có
```json
{
  "invocation_id": "...",
  "workflow_key": "docs.materialize.v1",
  "title": "2026.04.05_de xuat_he thong quan tri_draft_v1",
  "final_content": "...",
  "folder_path": "Deo Workspace/03_ho so theo yeu cau/2026/de xuat",
  "folder_name": "de xuat",
  "document_type": "de xuat",
  "reviewers": ["abc@example.com"],
  "callback_url": "https://.../api/backoffice/workflows/callback",
  "callback_token": "...",
  "status": "draft",
  "version": "v1"
}
```

---

## Node 4 — Ensure Folder Exists
### Loại node
`Google Drive` hoặc `Code + Google Drive`

### Vai trò
Đảm bảo folder đích tồn tại.

### Kết quả cần có
- `target_folder_id`
- `target_folder_path`

---

## Node 5 — Create Empty Google Doc
### Loại node
`Google Docs` hoặc `Google Drive`

### Vai trò
Tạo Google Doc mới với tên `title` trong folder đích.

### Output cần giữ
- `new_file_id`
- `new_file_name`
- `webViewLink`

---

## Node 6 — Insert Final Content
### Loại node
`HTTP Request` tới Google Docs API hoặc node Docs nếu có

### Vai trò
Đưa toàn bộ `final_content` vào document.

### Gợi ý cách làm V1
- tạo doc rỗng
- dùng Docs API `batchUpdate` với `insertText`
- optional: thêm newline/header nhẹ nếu cần

---

## Node 7 — Optional Basic Formatting
### Loại node
`Code` + Docs API

### Vai trò
Nếu muốn V1 đẹp hơn chút, có thể:
- bold title dòng đầu
- set heading đơn giản
- normalize line breaks

### Lưu ý
V1 không cần formatting quá sâu nếu chưa cần.

---

## Node 8 — Optional Reviewer Sharing
### Loại node
`IF` + `Google Drive`

### Rule
- nếu có reviewers → set permission mặc định `commenter`

### Output
- `shared_reviewer_emails`
- `permission_mode`

---

## Node 9 — Build Success Callback Payload
### Loại node
`Code`

### Payload gợi ý
```json
{
  "invocation_id": "...",
  "workflow_key": "docs.materialize.v1",
  "status": "completed",
  "generated_title": "2026.04.05_de xuat_he thong quan tri_draft_v1",
  "file_id": "...",
  "file_type": "gdoc",
  "file_url": "https://docs.google.com/document/d/.../edit",
  "folder_id": "...",
  "folder_path": "Deo Workspace/03_ho so theo yeu cau/2026/de xuat",
  "generation_mode": "draft_from_context",
  "document_type": "de xuat",
  "version": "v1",
  "reviewer_emails": ["abc@example.com"],
  "permission_mode": "commenter",
  "output_summary": "Google Doc da duoc materialize tu final content.",
  "completed_at": "{{$now}}"
}
```

---

## Node 10 — POST Success Callback
### Loại node
`HTTP Request`

### Method
`POST`

### URL
`callback.url`

### Headers
- `Content-Type: application/json`
- `X-Backoffice-Callback-Token: callback.token`
- `X-Invocation-Id: invocation_id`
- `X-Backoffice-Workflow-Key: docs.materialize.v1`

---

## Node 11 — Failure Handler Branch
### Loại node
Error branch / `Code` + `HTTP Request`

### Vai trò
Nếu lỗi ở bất kỳ node nào, build failure callback và POST ngược về Work OS.

---

## 7. Node order rút gọn

```text
1. Webhook Trigger
2. Auth / Guard Check
3. Normalize Input
4. Ensure Folder Exists
5. Create Empty Google Doc
6. Insert Final Content
7. Optional Basic Formatting
8. Optional Reviewer Sharing
9. Build Success Callback Payload
10. POST Success Callback
11. Failure Handler Branch
```

---

## 8. Acceptance criteria V1

Workflow `docs.materialize.v1` được xem là đạt khi:
- nhận request đúng contract
- tạo được Google Doc mới
- ghi được final content vào doc
- đặt file đúng folder
- share được reviewer nếu có
- callback success về Work OS
- `backoffice_files` upsert đúng metadata

---

## 9. One-line conclusion

**`docs.materialize.v1` là workflow biến final content thành Google Doc thật: nó không fill template mà materialize nội dung đã chốt vào file mới, đặt đúng folder, share reviewer và callback chuẩn về Work OS để hoàn tất context-based document flow.**
