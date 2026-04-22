# V0.3.0 PLAN — CONTRACT CLEANUP

**Target version:** `v0.3.0`  
**Tên milestone:** Contract Cleanup  
**Mục tiêu:** Đưa Dẹo Enterprise OS từ trạng thái production demo usable sang baseline kỹ thuật sạch hơn, giảm drift, và thống nhất contract giữa frontend, backend, production runtime, và agent runtime.

---

## 1. Vì sao cần v0.3.0

Ở `v0.2.3`, hệ thống đã chạy được thật ở mức nội bộ:
- frontend login được
- task flow chạy được
- Agent Admin tạo task thật được
- production repo/version governance đã được thiết lập

Nhưng vẫn còn 4 cụm nợ kỹ thuật lớn:
1. source-of-truth drift
2. frontend/backend contract debt
3. `agent-jobs` không khớp production reality
4. runtime patch quan trọng đang sống ngoài app repo

`v0.3.0` tồn tại để xử lý đúng 4 cụm đó.

---

## 2. Definition of Done cho v0.3.0

`v0.3.0` được coi là xong khi:
- local repo phản ánh sát hơn production đang chạy thật
- auth contract được chốt rõ và không còn workaround mơ hồ
- task/dashboard contract được chốt rõ
- `agent-jobs` được sửa hoặc deprecate có chủ đích
- các runtime patch quan trọng của Agent Admin được kéo vào repo/docs tái tạo
- changelog/version/tag được cập nhật đúng chuẩn

---

## 3. Scope chính của v0.3.0

### Scope A — Source-of-truth alignment
- so sánh repo local với production VPS
- lập danh sách file lệch
- kéo các production hotfix quan trọng về repo
- cập nhật `docs/PRODUCTION_DRIFT.md` tương ứng

### Scope B — Auth contract cleanup
- chốt payload login
- chốt token storage key
- chốt `/auth/me` behavior
- chốt protected route flow frontend

### Scope C — Task/Dashboard contract cleanup
- chuẩn hóa `Task` type
- chuẩn hóa status enum
- chuẩn hóa dashboard summary response
- chuẩn hóa ID type (UUID/string)

### Scope D — Orchestration decision
- quyết định giữ/sửa/deprecate `agent-jobs`
- nếu giữ: sửa cho đúng schema + đúng production usage
- nếu deprecate tạm: document rõ bridge qua `/api/tasks`

### Scope E — Agent runtime sync
- gom patch quan trọng của `agent-admin`
- tài liệu hóa cách tái tạo runtime
- nếu cần, chuẩn hóa pattern cho các agent khác

---

## 4. Checklist thực thi

## A. Source-of-truth alignment
- [ ] Diff repo local với `/opt/deo-enterprise-os` trên VPS
- [ ] Ghi file nào chỉ có ở production
- [ ] Ghi file nào local có nhưng production chưa phản ánh
- [ ] Chọn phần nào kéo từ production về repo
- [ ] Cập nhật `docs/PRODUCTION_DRIFT.md`

### Deliverable
- bản diff tóm tắt
- repo local sát production hơn

---

## B. Auth cleanup
- [ ] Kiểm tra `apps/api/src/routes/auth.ts`
- [ ] Kiểm tra `apps/api/src/middleware/auth.ts`
- [ ] Kiểm tra `apps/web/src/hooks/useAuth.ts`
- [ ] Kiểm tra `apps/web/src/lib/api.ts`
- [ ] Chốt naming/token storage thống nhất
- [ ] Test login → refresh → giữ session → logout

### Deliverable
- 1 auth flow rõ ràng, không còn lệch tên field/key

---

## C. Task + dashboard contract cleanup
- [ ] Kiểm tra `apps/api/src/routes/tasks.ts`
- [ ] Kiểm tra `apps/api/src/routes/dashboard.ts`
- [ ] Kiểm tra `apps/web/src/types/index.ts`
- [ ] Kiểm tra `apps/web/src/pages/Tasks.tsx`
- [ ] Kiểm tra `apps/web/src/pages/Dashboard.tsx`
- [ ] Chốt status enum thống nhất
- [ ] Chốt shape response thống nhất

### Deliverable
- frontend/backend không còn mismatch về task/dashboard

---

## D. `agent-jobs` decision
- [ ] Đọc lại `apps/api/src/routes/agent-jobs.ts`
- [ ] Đối chiếu với schema thật của production DB
- [ ] Quyết định:
  - [ ] Fix hoàn chỉnh
  - [ ] Hoặc deprecate tạm thời
- [ ] Nếu deprecate: cập nhật docs và bridge logic rõ ràng
- [ ] Nếu fix: test create/list/detail/retry/message flow

### Deliverable
- không còn vùng xám “thiết kế nói một đằng, production chạy một nẻo”

---

## E. Agent runtime sync
- [ ] Audit `agent-admin` runtime patch hiện tại
- [ ] Xác định logic nào phải đưa vào repo/docs
- [ ] Ghi cách tái tạo `job-client.js` production bridge
- [ ] Quyết định có áp dụng pattern tương tự cho các agent khác không

### Deliverable
- patch quan trọng không còn chỉ nằm trong máy hiện tại

---

## 5. Thứ tự thực hiện khuyến nghị

### Bước 1
Source-of-truth alignment

### Bước 2
Auth cleanup

### Bước 3
Task + dashboard contract cleanup

### Bước 4
`agent-jobs` decision và implementation

### Bước 5
Agent runtime sync + docs

### Bước 6
Update changelog + version → tag `v0.3.0`

---

## 6. Những gì KHÔNG nên nhét vào v0.3.0

Để tránh milestone bị phình, **không nên** nhét thêm các việc sau vào `v0.3.0`:
- xây toàn bộ chat center realtime hoàn chỉnh
- polish CRM lớn
- mobile responsive toàn hệ
- recurring tasks
- package hóa sâu toàn repo
- n8n workflows hoàn chỉnh

Các việc đó nên để sau khi contract đã sạch.

---

## 7. Rủi ro nếu bỏ qua v0.3.0

Nếu tiếp tục thêm feature mà không làm `v0.3.0`, rất dễ gặp:
- drift tăng nhanh
- production fix xong nhưng repo không phản ánh
- agent runtime càng ngày càng lệch
- bug auth/task/dashboard quay lại khi mở rộng chức năng
- khó onboarding người khác hoặc chuyển máy/deploy lại

---

## 8. Tiêu chí để bump từ v0.2.3 lên v0.3.0

Chỉ bump khi:
- repo đã phản ánh phần lớn production reality
- contract auth/task/dashboard đã chốt
- `agent-jobs` không còn mập mờ
- docs drift/runtime/release đã cập nhật theo thực tế mới
- có changelog entry rõ cho `v0.3.0`

---

## 9. Một câu chốt

**`v0.3.0` không phải version thêm nhiều tính năng mới; nó là version dọn nền móng, chốt contract, kéo production reality về lại repo, để từ đó Phase 1/2/3 mới phát triển tiếp mà không bị nợ kỹ thuật bóp cổ.**
