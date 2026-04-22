# BACKOFFICE E2E TEST PLAYBOOK V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Tạo playbook test thực chiến cho nhánh back office + n8n, theo thứ tự từ dễ đến khó, từ backend-only tới full end-to-end, để tránh test loạn và dễ xác định fail nằm ở lớp nào.

---

## 1. Nguyên tắc test

Test theo tầng, không nhảy cóc.

### Thứ tự đúng
1. backend-only
2. callback-only
3. registry/read model
4. dispatch → n8n webhook
5. n8n → callback
6. full end-to-end với Google Docs

### Mục tiêu
Mỗi vòng test chỉ cố xác minh **một lớp trách nhiệm chính**.

---

## 2. Các lớp cần test

## Layer A — Backend foundation
- route backoffice
- registry lookup
- folder resolve
- callback handler
- metadata upsert

## Layer B — Dispatch layer
- payload shape
- headers
- webhook URL config
- auth to n8n

## Layer C — n8n workflow layer
- webhook trigger
- node order
- template resolve
- folder handling
- docs update
- reviewer share

## Layer D — Callback/apply layer
- callback auth
- metadata record update
- file listing/readback

## Layer E — Full business flow
- request thật
- file thật trên Google Docs/Drive
- reviewer access thật
- link metadata thật

---

## 3. Test phases

## Phase 0 — Environment sanity check
### Mục tiêu
Xác minh môi trường đủ điều kiện test.

### Checklist
- [ ] API đang chạy
- [ ] DB có migration `006_backoffice_foundation.sql`
- [ ] `workflow_definitions` đã seed
- [ ] `.env` có các biến backoffice/n8n cần thiết
- [ ] n8n instance đang chạy
- [ ] Google credentials trong n8n đã sẵn sàng hoặc chuẩn bị sẵn

### Pass criteria
- API trả health ok
- list workflows thấy workflow back office

---

## Phase 1 — Backend-only tests
### Mục tiêu
Test backend mà chưa cần n8n chạy thật.

### Test 1.1 — Resolve folder
Dùng:
- `BACKOFFICE_CURL_TESTS_V1.md` → resolve folder

### Verify
- [ ] trả `folder_path`
- [ ] đúng naming standard
- [ ] đúng generation mode

### Test 1.2 — List workflows
### Verify
- [ ] thấy `docs.from-template.v1`
- [ ] thấy `drive.resolve-folder.v1`

### Test 1.3 — Dispatch without live n8n
Nếu chưa set `BACKOFFICE_N8N_WEBHOOK_URL` hoặc webhook chưa live.

### Verify
- [ ] backend trả `dispatch_status = queued` hoặc error có nghĩa
- [ ] không crash

### Pass criteria
- backend route surface hoạt động ổn định

---

## Phase 2 — Callback-only tests
### Mục tiêu
Xác minh callback path và metadata upsert mà chưa cần n8n thật.

### Test 2.1 — Success callback thủ công
Dùng curl callback success.

### Verify
- [ ] `ok: true`
- [ ] có `file` object
- [ ] record xuất hiện trong `backoffice_files`

### Test 2.2 — Failure callback thủ công
Dùng curl callback failed.

### Verify
- [ ] backend không crash
- [ ] không tạo file record giả nếu thiếu `file_id`
- [ ] lỗi đọc được từ response/log

### Pass criteria
- callback path usable
- metadata record upsert được

---

## Phase 3 — Dispatch to n8n only
### Mục tiêu
Xác minh backend gửi request đúng tới n8n webhook.

### Điều kiện
- đã set `BACKOFFICE_N8N_WEBHOOK_URL`
- n8n webhook trigger đang active

### Test 3.1 — Dispatch docs.from-template
### Verify ở backend
- [ ] trả `dispatch_status = dispatched`
- [ ] có `invocation_id`

### Verify ở n8n
- [ ] webhook node nhận request
- [ ] nhận đúng `workflow_key`
- [ ] nhận đúng `invocation_id`
- [ ] body đúng contract

### Pass criteria
- backend → n8n webhook thông suốt

---

## Phase 4 — n8n callback loop
### Mục tiêu
Xác minh n8n gọi callback ngược lại được.

### Test 4.1 — Fake success callback từ n8n workflow
Dùng workflow rất đơn giản trong n8n:
- nhận webhook
- bỏ qua Google steps
- callback success giả về backend

### Verify
- [ ] backend nhận callback
- [ ] `backoffice_files` upsert thành công
- [ ] response callback ok

### Pass criteria
- loop backend → n8n → backend đã kín

---

## Phase 5 — Google template copy test
### Mục tiêu
Test phần integration thật với Google Drive/Docs nhưng phạm vi hẹp.

### Test 5.1 — Copy template only
Tạm thời có thể chưa replace placeholder, chỉ copy được file trước.

### Verify
- [ ] template được copy thành file mới
- [ ] tên file đúng
- [ ] file nằm đúng folder

### Test 5.2 — Replace placeholders
### Verify
- [ ] placeholder được replace đúng
- [ ] file không còn token `{{...}}` nếu data đầy đủ

### Pass criteria
- Google integration cơ bản chạy thật

---

## Phase 6 — Reviewer sharing test
### Mục tiêu
Xác minh file share đúng quyền cho reviewer.

### Test 6.1
- tạo doc có reviewer

### Verify
- [ ] reviewer email được set permission
- [ ] mở link reviewer dùng được
- [ ] permission mode đúng (`commenter` / `editor`)

### Pass criteria
- flow usable với người thật

---

## Phase 7 — Full end-to-end happy path
### Mục tiêu
Xác minh toàn bộ flow `docs.from-template.v1` chạy thật từ đầu tới cuối.

### Flow
1. call `/api/backoffice/docs/from-template`
2. backend dispatch sang n8n
3. n8n copy template
4. n8n replace placeholders
5. n8n share reviewer
6. n8n callback success
7. backend upsert metadata
8. list files thấy record mới

### Pass criteria
- có file thật trên Google Docs
- có metadata thật trong backend
- callback thật chạy xong
- reviewer mở được link

---

## Phase 8 — Failure path tests
### Mục tiêu
Xác minh system fail có kiểm soát.

### Case 8.1 — Template key sai
### Verify
- [ ] workflow fail rõ
- [ ] callback fail rõ

### Case 8.2 — Folder permission denied
### Verify
- [ ] callback fail rõ
- [ ] không crash backend

### Case 8.3 — Callback token sai
### Verify
- [ ] backend trả 401
- [ ] n8n nhìn thấy lỗi callback

### Case 8.4 — Reviewer email lỗi
### Verify
- [ ] nếu workflow policy cho partial success, callback `partial`
- [ ] hoặc fail rõ nếu policy strict

---

## 4. Nếu fail thì khoanh lỗi ở đâu

## Nếu resolve folder sai
=> lỗi ở backend folder service hoặc naming rules.

## Nếu dispatch không tới n8n
=> lỗi ở env webhook URL / auth / network.

## Nếu n8n nhận request nhưng không tạo file
=> lỗi ở workflow nodes / Google credentials / template mapping.

## Nếu file tạo được nhưng callback fail
=> lỗi ở callback URL / token / backend callback handler.

## Nếu callback ok nhưng không thấy record
=> lỗi ở `upsertBackofficeFileRecord()` hoặc DB migration.

---

## 5. Minimal evidence nên capture mỗi phase

- request body sample
- response body
- screenshot n8n execution
- screenshot Google Drive/Doc kết quả
- DB row hoặc API `GET /api/backoffice/files` result
- error log nếu fail

---

## 6. Trình tự khuyên dùng trong buổi test thật

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6
8. Phase 7
9. Phase 8

### Không nên
nhảy thẳng Phase 7 khi callback path còn chưa test xong.

---

## 7. One-line conclusion

**Playbook này giúp test nhánh back office theo lớp: backend trước, callback sau, dispatch tiếp, rồi mới full Google Docs end-to-end — nhờ vậy khi fail sẽ biết fail ở đâu, sửa đúng chỗ và không test theo kiểu đoán mò.**
