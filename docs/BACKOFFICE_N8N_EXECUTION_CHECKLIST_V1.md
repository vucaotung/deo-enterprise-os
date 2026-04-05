# BACKOFFICE N8N EXECUTION CHECKLIST V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Checklist thực chiến để nối nhánh back office với n8n thật theo thứ tự ít mò, ít lệch contract và dễ test end-to-end.

---

## Phase 0 — Chuẩn bị biến môi trường

- [ ] set `BACKOFFICE_N8N_WEBHOOK_URL`
- [ ] set `BACKOFFICE_N8N_API_KEY` nếu dùng auth Bearer
- [ ] set `BACKOFFICE_CALLBACK_URL`
- [ ] set `BACKOFFICE_CALLBACK_TOKEN`
- [ ] set `BACKOFFICE_GOOGLE_DRIVE_ROOT_NAME` nếu muốn override root mặc định
- [ ] confirm VPS/API public URL để n8n callback được

---

## Phase 1 — Chuẩn bị n8n side

- [ ] tạo workflow nhận webhook chung cho back office hoặc riêng cho `docs.from-template.v1`
- [ ] map request body theo `BACKOFFICE_N8N_WEBHOOK_CONTRACT_V1.md`
- [ ] đọc được headers:
  - [ ] `X-Backoffice-Workflow-Key`
  - [ ] `X-Invocation-Id`
  - [ ] `Authorization` nếu có
- [ ] cấu hình callback node POST ngược về Work OS
- [ ] callback gửi `X-Backoffice-Callback-Token`

---

## Phase 2 — Test `drive.resolve-folder.v1`

- [ ] gọi `POST /api/backoffice/folders/resolve`
- [ ] verify output path đúng chuẩn naming
- [ ] verify phân biệt được:
  - [ ] `template_based`
  - [ ] `draft_from_context`
- [ ] verify path có year / document type / project/client slug nếu có

---

## Phase 3 — Test dispatch `docs.from-template.v1`

- [ ] gọi `POST /api/backoffice/docs/from-template`
- [ ] verify API trả `invocation_id`
- [ ] verify payload gửi sang n8n đúng shape contract
- [ ] verify `resolved_folder` được inject nếu user không truyền `target_folder`

---

## Phase 4 — Test callback success path

- [ ] n8n callback về `/api/backoffice/workflows/callback`
- [ ] verify token callback hợp lệ
- [ ] verify record được upsert vào `deo.backoffice_files`
- [ ] verify `workflow_key`, `file_id`, `url`, `folder_path` lưu đúng
- [ ] verify response normalized trả về `ok: true`

---

## Phase 5 — Test callback failure path

- [ ] gửi callback `status=failed`
- [ ] verify API không crash
- [ ] verify trace/log đọc được lỗi
- [ ] verify không tạo file record giả nếu `file_id` không có

---

## Phase 6 — Test Google Docs materialization thật

- [ ] copy template thành công
- [ ] placeholder replace thành công
- [ ] file được đặt đúng folder
- [ ] file được đặt đúng title chuẩn
- [ ] reviewer permissions được set đúng
- [ ] callback có `file_url` mở được thật

---

## Phase 7 — Chuẩn bị bước tiếp theo

- [ ] append result về thread/project/task
- [ ] seed thêm `docs.materialize.v1`
- [ ] seed thêm `drive.share-for-review.v1`
- [ ] tính tiếp `sheets.from-template.v1`

---

## One-line conclusion

**Checklist này là đường chạy thật cho nhánh back office: có env, có n8n webhook, có dispatch, có callback, có metadata record và có test path rõ ràng cho `docs.from-template.v1`.**
