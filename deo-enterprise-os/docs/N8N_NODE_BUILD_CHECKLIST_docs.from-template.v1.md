# N8N NODE BUILD CHECKLIST `docs.from-template.v1`

**Ngày:** 2026-04-05  
**Mục tiêu:** Checklist thao tác thực tế trong n8n để dựng workflow `docs.from-template.v1` mà không cần suy nghĩ lại từ đầu về node order, field mapping và callback path.

---

## 1. Tạo workflow mới

- [ ] Mở n8n
- [ ] Create workflow mới
- [ ] Đặt tên: `docs.from-template.v1`
- [ ] Thêm note mô tả: `Backoffice template-based Google Docs generation`

---

## 2. Node 1 — Webhook Trigger

- [ ] Thêm node `Webhook`
- [ ] Method = `POST`
- [ ] Path = `/backoffice/docs/from-template`
- [ ] Response mode: theo flow hiện dùng trong n8n (có thể immediate ack nếu cần)
- [ ] Test bằng sample payload từ `BACKOFFICE_TEST_PAYLOADS_V1.md`

### Verify
- [ ] body nhận được `invocation_id`
- [ ] body nhận được `workflow_key`
- [ ] body nhận được `payload.title`
- [ ] header nhận được `X-Invocation-Id`

---

## 3. Node 2 — Guard / Validate Request

- [ ] Thêm node `IF` hoặc `Code`
- [ ] Check `workflow_key === docs.from-template.v1`
- [ ] Nếu có auth Bearer thì verify token/header
- [ ] Nếu fail → nhảy sang failure callback branch

### Verify
- [ ] request sai workflow_key bị reject
- [ ] request thiếu field quan trọng bị reject

---

## 4. Node 3 — Normalize Input

- [ ] Thêm node `Code`
- [ ] Trích các field sau vào output normalized:
  - [ ] `invocation_id`
  - [ ] `workflow_key`
  - [ ] `template_key`
  - [ ] `template_id`
  - [ ] `title`
  - [ ] `data`
  - [ ] `folder_path`
  - [ ] `folder_name`
  - [ ] `document_type`
  - [ ] `reviewers`
  - [ ] `callback_url`
  - [ ] `callback_token`

### Verify
- [ ] output node dễ đọc, không còn nested lộn xộn

---

## 5. Node 4 — Resolve Template ID

- [ ] Thêm node `Code` hoặc `Set`
- [ ] Tạo map `template_key -> template_id`
- [ ] Nếu request đã có `template_id` thì ưu tiên dùng luôn
- [ ] Nếu không resolve được thì nhảy failure branch

### Verify
- [ ] `hop_dong_dich_vu_v1` map đúng template id
- [ ] key lạ thì fail rõ

---

## 6. Node 5 — Ensure Folder Exists

- [ ] Thêm node `Google Drive` hoặc combo `Code + Drive`
- [ ] Parse `folder_path`
- [ ] Tìm từng level folder
- [ ] Nếu chưa có thì create
- [ ] Giữ output cuối:
  - [ ] `target_folder_id`
  - [ ] `target_folder_path`

### Verify
- [ ] folder tree được tạo đúng
- [ ] chạy lại lần 2 không tạo duplicate vô lý

---

## 7. Node 6 — Copy Template Document

- [ ] Thêm node `Google Drive`
- [ ] Action = `Copy file`
- [ ] Source = `template_id`
- [ ] New name = `title`
- [ ] Parent folder = `target_folder_id`

### Verify
- [ ] file copy ra đúng tên
- [ ] file nằm đúng folder
- [ ] lấy được `new_file_id`

---

## 8. Node 7 — Build Replace Requests

- [ ] Thêm node `Code`
- [ ] Loop qua `data`
- [ ] Build mảng requests kiểu `replaceAllText`
- [ ] Placeholder format = `{{key}}`

### Verify
- [ ] request array đúng format Docs API
- [ ] không bỏ sót key nào

---

## 9. Node 8 — Apply Placeholder Replacements

- [ ] Thêm node `HTTP Request` tới Google Docs API `batchUpdate`
- [ ] Auth dùng credential Google phù hợp
- [ ] `documentId = new_file_id`
- [ ] `requests = output từ Node 7`

### Verify
- [ ] placeholders được thay đúng
- [ ] text không còn `{{...}}` nếu data đầy đủ

---

## 10. Node 9 — Optional Reviewer Sharing

- [ ] Thêm node `IF`
- [ ] Nếu `reviewers.length > 0` → share
- [ ] Thêm node `Google Drive Permissions`
- [ ] Permission mode mặc định: `commenter`

### Verify
- [ ] reviewer nhận quyền đúng
- [ ] nếu không có reviewer thì workflow vẫn pass

---

## 11. Node 10 — Build Success Callback Payload

- [ ] Thêm node `Code`
- [ ] Build payload đúng contract đã chốt
- [ ] Có đủ:
  - [ ] `invocation_id`
  - [ ] `workflow_key`
  - [ ] `status=completed`
  - [ ] `generated_title`
  - [ ] `file_id`
  - [ ] `file_url`
  - [ ] `folder_id`
  - [ ] `folder_path`
  - [ ] `generation_mode=template_based`
  - [ ] `document_type`
  - [ ] `reviewer_emails`
  - [ ] `permission_mode`
  - [ ] `completed_at`

---

## 12. Node 11 — POST Success Callback

- [ ] Thêm node `HTTP Request`
- [ ] Method = `POST`
- [ ] URL = `callback_url`
- [ ] Headers:
  - [ ] `Content-Type: application/json`
  - [ ] `X-Backoffice-Callback-Token: callback_token`
  - [ ] `X-Invocation-Id: invocation_id`
  - [ ] `X-Backoffice-Workflow-Key: docs.from-template.v1`

### Verify
- [ ] Work OS trả `ok: true`
- [ ] `backoffice_files` upsert thành công

---

## 13. Failure branch

- [ ] Tạo branch lỗi dùng `Error Trigger`, `IF`, hoặc error handling phù hợp trong n8n
- [ ] Build payload fail với:
  - [ ] `invocation_id`
  - [ ] `workflow_key`
  - [ ] `status=failed`
  - [ ] `error_message`
  - [ ] `completed_at`
- [ ] POST callback fail về Work OS

### Verify
- [ ] lỗi template / folder / permission đều callback được
- [ ] Work OS không crash khi nhận fail callback

---

## 14. Test sequence nên chạy

- [ ] test happy path với template đơn giản
- [ ] test key không map được template
- [ ] test folder chưa tồn tại
- [ ] test reviewer có email hợp lệ
- [ ] test callback token sai
- [ ] test permission fail với folder không được ghi

---

## 15. Done criteria

Workflow được xem là dựng xong usable khi:
- [ ] tạo được doc thật từ template
- [ ] fill được placeholders
- [ ] đặt đúng folder
- [ ] share được reviewer
- [ ] callback success về Work OS
- [ ] file xuất hiện trong `backoffice_files`

---

## One-line conclusion

**Checklist này là bản lắp ráp từng node cho `docs.from-template.v1`: cứ bám đúng thứ tự Webhook → Validate → Normalize → Resolve Template → Ensure Folder → Copy → Replace → Share → Callback là dựng được workflow usable đầu tiên cho nhánh back office.**
