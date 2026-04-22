# N8N NODE BUILD CHECKLIST `docs.materialize.v1`

**Ngày:** 2026-04-05  
**Mục tiêu:** Checklist thao tác trong n8n để dựng workflow `docs.materialize.v1` theo thứ tự node-by-node, dùng cho flow materialize final content thành Google Doc thật.

---

## 1. Tạo workflow mới

- [ ] Mở n8n
- [ ] Create workflow mới
- [ ] Đặt tên: `docs.materialize.v1`
- [ ] Thêm note mô tả: `Backoffice context-based Google Docs materialization`

---

## 2. Node 1 — Webhook Trigger

- [ ] Thêm node `Webhook`
- [ ] Method = `POST`
- [ ] Path = `/backoffice/docs/materialize`
- [ ] Dùng sample payload theo contract back office materialize

### Verify
- [ ] có `invocation_id`
- [ ] có `workflow_key = docs.materialize.v1`
- [ ] có `payload.title`
- [ ] có `payload.final_content`

---

## 3. Node 2 — Guard / Validate Request

- [ ] Thêm node `IF` hoặc `Code`
- [ ] Check `workflow_key === docs.materialize.v1`
- [ ] Nếu thiếu `final_content` thì reject
- [ ] Nếu có auth Bearer thì verify luôn

---

## 4. Node 3 — Normalize Input

- [ ] Thêm node `Code`
- [ ] Extract các field:
  - [ ] `invocation_id`
  - [ ] `title`
  - [ ] `final_content`
  - [ ] `target_folder`
  - [ ] `document_type`
  - [ ] `reviewers`
  - [ ] `callback_url`
  - [ ] `callback_token`
  - [ ] `status`
  - [ ] `version`

### Verify
- [ ] output normalized dễ đọc và ít nested

---

## 5. Node 4 — Ensure Folder Exists

- [ ] Thêm node `Google Drive` hoặc `Code + Drive`
- [ ] Parse `target_folder.folder_path`
- [ ] Tìm từng level folder
- [ ] Nếu chưa có thì create
- [ ] Giữ `target_folder_id`

### Verify
- [ ] folder tồn tại đúng cây
- [ ] không tạo duplicate vô lý khi rerun

---

## 6. Node 5 — Create Empty Google Doc

- [ ] Thêm node `Google Docs` hoặc `Google Drive`
- [ ] Tạo file mới tên = `title`
- [ ] Parent folder = `target_folder_id`

### Verify
- [ ] doc mới được tạo đúng tên
- [ ] doc nằm đúng folder
- [ ] lấy được `file_id`

---

## 7. Node 6 — Insert Final Content

- [ ] Thêm node `HTTP Request` tới Google Docs API hoặc node Docs phù hợp
- [ ] Dùng `insertText` hoặc `batchUpdate`
- [ ] Insert toàn bộ `final_content`

### Verify
- [ ] mở doc ra thấy nội dung final content thật sự đã vào
- [ ] line breaks không bể quá nặng

---

## 8. Node 7 — Optional Basic Formatting

- [ ] Nếu cần, thêm formatting nhẹ:
  - [ ] title heading
  - [ ] normalize đoạn
  - [ ] bold dòng đầu

### Lưu ý
- [ ] V1 không cần over-format

---

## 9. Node 8 — Optional Reviewer Sharing

- [ ] Nếu có reviewers thì set permissions
- [ ] Permission mode mặc định = `commenter`
- [ ] Nếu không có reviewers thì bỏ qua branch này

### Verify
- [ ] reviewer xem/comment được

---

## 10. Node 9 — Build Success Callback Payload

- [ ] Thêm node `Code`
- [ ] Build payload gồm:
  - [ ] `invocation_id`
  - [ ] `workflow_key`
  - [ ] `status=completed`
  - [ ] `generated_title`
  - [ ] `file_id`
  - [ ] `file_url`
  - [ ] `folder_id`
  - [ ] `folder_path`
  - [ ] `generation_mode=draft_from_context`
  - [ ] `document_type`
  - [ ] `reviewer_emails`
  - [ ] `permission_mode`
  - [ ] `completed_at`

---

## 11. Node 10 — POST Success Callback

- [ ] Thêm node `HTTP Request`
- [ ] POST về `callback_url`
- [ ] Gửi header:
  - [ ] `X-Backoffice-Callback-Token`
  - [ ] `X-Invocation-Id`
  - [ ] `X-Backoffice-Workflow-Key: docs.materialize.v1`

### Verify
- [ ] Work OS trả `ok: true`
- [ ] file record được upsert vào `backoffice_files`

---

## 12. Failure branch

- [ ] Tạo branch lỗi riêng
- [ ] Build failure callback payload
- [ ] POST fail callback về Work OS

### Verify
- [ ] lỗi create doc callback được
- [ ] lỗi insert content callback được
- [ ] lỗi permission callback được

---

## 13. Test sequence nên chạy

- [ ] test với final content ngắn
- [ ] test với final content dài hơn
- [ ] test folder chưa tồn tại
- [ ] test không có reviewer
- [ ] test có reviewer
- [ ] test callback token sai
- [ ] test lỗi quyền ghi folder

---

## 14. Done criteria

Workflow được xem là dựng xong usable khi:
- [ ] tạo được Google Doc mới
- [ ] ghi được final content vào doc
- [ ] đặt doc đúng folder
- [ ] share reviewer nếu có
- [ ] callback success về Work OS
- [ ] metadata file xuất hiện trong `backoffice_files`

---

## One-line conclusion

**Checklist này là bản lắp ráp từng node cho `docs.materialize.v1`: cứ bám đúng chuỗi Webhook → Validate → Normalize → Ensure Folder → Create Doc → Insert Content → Share → Callback là dựng được workflow materialize usable cho flow văn bản từ chat/context.**
