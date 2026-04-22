# N8N WORKFLOW `docs.from-template.v1` SPEC

**Ngày:** 2026-04-05  
**Mục tiêu:** Định nghĩa spec thực chiến, node-by-node, cho workflow n8n đầu tiên của nhánh back office: `docs.from-template.v1`.

Workflow này dùng để:
- nhận request từ Work OS
- copy Google Doc template
- điền dữ liệu vào placeholders
- đặt file vào folder đúng chuẩn
- share reviewer nếu có
- callback kết quả về Work OS

---

## 1. Mục tiêu vận hành

Đây là workflow đầu tiên nên build vì:
- nhu cầu business rõ
- ít ambiguity hơn context-based drafting
- giúp test toàn bộ loop:
  - dispatch
  - Google integration
  - callback
  - metadata

### Use cases đầu tiên
- tạo hợp đồng từ mẫu
- tạo báo giá từ mẫu
- tạo công văn mẫu
- tạo biên bản mẫu

---

## 2. Input contract

Workflow nhận payload theo `BACKOFFICE_N8N_WEBHOOK_CONTRACT_V1.md`.

### Trường quan trọng nhất
- `invocation_id`
- `workflow_key`
- `objective`
- `context`
- `payload.template_key`
- `payload.template_id` (optional nếu resolve từ template_key)
- `payload.title`
- `payload.data`
- `payload.target_folder`
- `reviewers`
- `callback.url`
- `callback.token`

---

## 3. Output contract

### Success callback
- `status=completed`
- `generated_title`
- `file_id`
- `file_url`
- `folder_id`
- `folder_path`
- `generation_mode=template_based`
- `document_type`
- `reviewer_emails`
- `permission_mode`

### Failure callback
- `status=failed`
- `error_message`
- `workflow_key`
- `invocation_id`

---

## 4. Assumptions cho V1

### Assumption 1
Template Google Docs đã tồn tại sẵn trong Drive.

### Assumption 2
`template_key` có thể map nội bộ sang `template_id`.

### Assumption 3
Folder đích đã được Work OS resolve trước hoặc payload đã có `target_folder.folder_path`.

### Assumption 4
n8n có credential dùng được với:
- Google Drive
- Google Docs

### Assumption 5
Placeholder format trong template là kiểu:
- `{{ten_ben_a}}`
- `{{gia_tri}}`
- `{{ngay_hieu_luc}}`

---

## 5. Node-by-node flow

## Node 1 — Webhook Trigger
### Loại node
`Webhook`

### Vai trò
Nhận request từ Work OS.

### Method
`POST`

### Path gợi ý
`/backoffice/docs/from-template`

### Cần lấy từ request
- body JSON
- headers:
  - `Authorization`
  - `X-Backoffice-Workflow-Key`
  - `X-Invocation-Id`

### Validation tối thiểu
- `workflow_key === docs.from-template.v1`
- có `invocation_id`
- có `payload.template_key` hoặc `payload.template_id`
- có `payload.title`
- có `payload.data`
- có `callback.url`

---

## Node 2 — Auth / Guard Check
### Loại node
`IF` hoặc `Code`

### Vai trò
Kiểm tra auth header nếu có yêu cầu.

### Rule gợi ý
- nếu hệ dùng `BACKOFFICE_N8N_API_KEY`, verify `Authorization: Bearer ...`
- nếu fail thì nhảy sang failure branch

---

## Node 3 — Normalize Input
### Loại node
`Code`

### Vai trò
Chuẩn hóa input thành biến dễ dùng trong workflow.

### Output normalized nên có
```json
{
  "invocation_id": "...",
  "workflow_key": "docs.from-template.v1",
  "template_key": "hop_dong_dich_vu_v1",
  "template_id": "...",
  "title": "2026.04.05_hop dong_cong ty abc_ban nhap_v1",
  "data": { "ten_ben_a": "..." },
  "folder_path": "Deo Workspace/...",
  "folder_name": "hop dong",
  "document_type": "hop dong",
  "reviewers": ["abc@example.com"],
  "callback_url": "https://.../api/backoffice/workflows/callback",
  "callback_token": "..."
}
```

---

## Node 4 — Resolve Template ID
### Loại node
`Code` hoặc `Data Store` / `Set`

### Vai trò
Nếu request chỉ có `template_key`, thì map sang `template_id`.

### V1 gợi ý
Dùng 1 map tạm trong node/code hoặc env/config cứng.

### Ví dụ map
```json
{
  "hop_dong_dich_vu_v1": "google-doc-template-id-1",
  "bao_gia_v1": "google-doc-template-id-2"
}
```

### Nếu không resolve được
nhảy sang failure callback.

---

## Node 5 — Ensure Folder Exists
### Loại node
`Google Drive` hoặc `Code + Google Drive`

### Vai trò
Đảm bảo folder đích tồn tại.

### V1 pragmatic
- nếu Work OS mới chỉ trả `folder_path`, n8n có thể:
  1. parse path segments
  2. tìm từng level folder
  3. nếu chưa có thì tạo

### Kết quả cần có
- `target_folder_id`
- `target_folder_path`

---

## Node 6 — Copy Template Document
### Loại node
`Google Drive`

### Action
`Copy file`

### Input
- source = `template_id`
- new name = `title`
- parent folder = `target_folder_id`

### Output cần giữ
- `new_file_id`
- `new_file_name`
- `webViewLink` nếu có

---

## Node 7 — Build Replace Requests
### Loại node
`Code`

### Vai trò
Từ `payload.data`, build list requests cho Docs API.

### Input
```json
{
  "ten_ben_a": "Cong ty ABC",
  "gia_tri": "50000000"
}
```

### Output gợi ý
```json
[
  {
    "replaceAllText": {
      "containsText": { "text": "{{ten_ben_a}}", "matchCase": true },
      "replaceText": "Cong ty ABC"
    }
  },
  {
    "replaceAllText": {
      "containsText": { "text": "{{gia_tri}}", "matchCase": true },
      "replaceText": "50000000"
    }
  }
]
```

---

## Node 8 — Apply Placeholder Replacements
### Loại node
`HTTP Request` hoặc Google Docs API node nếu có

### Endpoint
Google Docs `batchUpdate`

### Input
- `documentId = new_file_id`
- requests = output từ Node 7

### Kết quả
Template được fill dữ liệu.

---

## Node 9 — Optional Reviewer Sharing
### Loại node
`IF` + `Google Drive`

### Vai trò
Nếu có reviewers thì set permission.

### Rule
- nếu `reviewers.length > 0` → loop từng email hoặc batch theo khả năng node
- permission mode mặc định cho V1: `commenter`

### Output
- `shared_reviewer_emails`
- `permission_mode`

---

## Node 10 — Build Success Callback Payload
### Loại node
`Code`

### Vai trò
Build payload callback chuẩn gửi về Work OS.

### Payload gợi ý
```json
{
  "invocation_id": "...",
  "workflow_key": "docs.from-template.v1",
  "status": "completed",
  "generated_title": "2026.04.05_hop dong_cong ty abc_ban nhap_v1",
  "file_id": "...",
  "file_type": "gdoc",
  "file_url": "https://docs.google.com/document/d/.../edit",
  "folder_id": "...",
  "folder_path": "Deo Workspace/02_ho so theo mau/2026/hop dong",
  "generation_mode": "template_based",
  "document_type": "hop dong",
  "reviewer_emails": ["abc@example.com"],
  "permission_mode": "commenter",
  "output_summary": "Google Doc da duoc tao tu template va share cho reviewer.",
  "completed_at": "{{$now}}"
}
```

---

## Node 11 — POST Success Callback
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
- `X-Backoffice-Workflow-Key: docs.from-template.v1`

---

## Node 12 — Failure Handler Branch
### Loại node
Error branch / `Code` + `HTTP Request`

### Vai trò
Nếu lỗi ở bất kỳ node nào sau Node 1, build failure callback.

### Payload gợi ý
```json
{
  "invocation_id": "...",
  "workflow_key": "docs.from-template.v1",
  "status": "failed",
  "generation_mode": "template_based",
  "document_type": "hop dong",
  "error_message": "<error text>",
  "completed_at": "{{$now}}"
}
```

### Sau đó
POST ngược về Work OS callback URL.

---

## 6. Node order rút gọn

```text
1. Webhook Trigger
2. Auth / Guard Check
3. Normalize Input
4. Resolve Template ID
5. Ensure Folder Exists
6. Copy Template Document
7. Build Replace Requests
8. Apply Placeholder Replacements
9. Optional Reviewer Sharing
10. Build Success Callback Payload
11. POST Success Callback
12. Failure Handler Branch
```

---

## 7. Dữ liệu cấu hình ngoài workflow

Workflow này nên đọc thêm từ config/env:
- map `template_key -> template_id`
- default permission mode
- default Google Drive root folder
- callback timeout/retry policy

---

## 8. Retry rules gợi ý

## Retry được
- Google API timeout
- permission propagation delay nhẹ
- network errors tạm thời

## Không retry mù
- template key không tồn tại
- callback URL sai cấu hình
- folder permission bị cấm hẳn

---

## 9. Acceptance criteria V1

Workflow `docs.from-template.v1` được xem là đạt khi:
- nhận được request đúng contract
- copy được template thành file mới
- replace được placeholders
- đặt file đúng folder
- share được reviewer nếu có
- callback success về Work OS
- `backoffice_files` được upsert đúng metadata

---

## 10. One-line conclusion

**`docs.from-template.v1` là workflow n8n đầu tiên nên được build theo kiểu node-by-node rõ ràng: nhận request từ Work OS, resolve template/folder, copy Doc, fill placeholders, share reviewer, rồi callback chuẩn về Work OS để hoàn tất vòng execution của back office V1.**
