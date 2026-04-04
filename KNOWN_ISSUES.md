# KNOWN ISSUES

## 1. Source-of-truth chưa chốt
### Mô tả
Hiện code đang bị lệch giữa:
- local desktop project
- VPS production
- runtime patch của OpenClaw agents local

### Ảnh hưởng
- khó versioning
- khó rollback
- khó audit thay đổi

### Ưu tiên
P0

---

## 2. `agent-jobs` route chưa đồng nhất contract hiện tại
### Mô tả
Luồng orchestration/job hiện còn dùng logic/schema đời cũ ở một số phần, trong khi production task flow đã được vá theo hướng khác.

### Triệu chứng
- tạo job qua `/api/agent-jobs` có thể fail
- phải bypass tạm thời sang `/api/tasks`

### Ưu tiên
P0

---

## 3. Frontend/backend contract debt
### Mô tả
Đã từng xuất hiện mismatch về:
- auth flow
- task status
- id type
- dashboard summary response shape

### Trạng thái
Một phần đã vá ở production, nhưng cần audit lại toàn bộ để chốt `v0.3.0`.

### Ưu tiên
P1

---

## 4. Runtime patch của Agent Admin đang nằm ngoài app repo chính
### Mô tả
Các vá quan trọng cho `agent-admin` hiện nằm ở workspace OpenClaw local, không nằm trọn trong repo app chính.

### Ảnh hưởng
- khó tái tạo môi trường
- khó onboard hoặc deploy lại
- dễ quên patch khi sync code

### Ưu tiên
P1

---

## 5. Chưa có GitHub repo chính thức
### Mô tả
Hiện chưa có remote GitHub làm chuẩn version history.

### Ảnh hưởng
- không có commit log sạch
- không có release tags chuẩn
- khó theo dõi thay đổi theo version

### Ưu tiên
P0

---

## 6. Webapp chat/orchestration chưa verify end-to-end đầy đủ
### Mô tả
Chat Center, Clarifications, Agents pages có scaffold nhưng chưa được verify production end-to-end theo kiến trúc Phase 2.

### Ưu tiên
P2

---

## 7. Packaging / CI/CD / release discipline chưa làm
### Mô tả
Thiếu pipeline release, package hóa shared modules, và quy tắc phát hành bài bản.

### Ưu tiên
P2
