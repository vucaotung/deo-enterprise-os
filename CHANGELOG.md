# Changelog

All notable changes to Dẹo Enterprise OS will be documented in this file.

Format gần theo Keep a Changelog + Semantic Versioning nhẹ cho giai đoạn pre-1.0.

---

## [v0.2.3] - 2026-04-04
### Added
- Ghi nhận trạng thái production demo nội bộ hoạt động được.
- Agent Admin bridge sang production API bằng `lib/job-client.js`.
- Tự động login để refresh token khi Agent Admin tạo task thật.
- Format mô tả task dễ đọc hơn thay vì dump JSON raw.
- Tài liệu hóa current working state và roadmap tiếp theo.

### Changed
- Agent Admin không còn phụ thuộc `localhost:3001` cho luồng tạo task thật.
- Luồng tạo việc thực tế tạm thời đi thẳng qua `/api/tasks` thay vì phụ thuộc hoàn toàn vào `/api/agent-jobs`.
- Quy ước version hiện tại được chốt ở mức `v0.2.3`.

### Fixed
- Fix frontend login/dashboard trắng.
- Fix auth state sync phía frontend.
- Fix production API URL của frontend.
- Fix dashboard summary response mismatch.
- Fix Telegram/webhook wiring ở mức đủ để test production.
- Fix Agent Admin có thể tạo task thật vào production DB.

### Known Issues
- `agent-jobs` route chưa đồng nhất hoàn toàn với schema/task contract hiện tại.
- Source code local, VPS production, và runtime patch của agents vẫn còn lệch nhau.
- Chưa có repo GitHub chính thức làm source-of-truth.

---

## [v0.2.2] - 2026-04-04
### Added
- Multi-bot Telegram webhook integration.
- Route webhook theo bot name cho production API.
- Luồng test bot → API → DB ở mức cơ bản.

### Fixed
- Wiring webhook production.
- Một phần lỗi bot trả lời nhưng chưa ghi DB.

### Notes
- Đây là mốc tích hợp Telegram production trước khi vá agent-admin bridge.

---

## [v0.2.1] - 2026-04-04
### Fixed
- Frontend/Auth hotfix để dashboard usable.
- API base URL production.
- Login flow và một số mismatch frontend/backend.

### Notes
- Mốc này tập trung cứu production UI để dùng được.

---

## [v0.2.0] - 2026-04-04
### Added
- Deploy production lên VPS Contabo.
- Domain/dashboard/API hoạt động qua production stack.
- Dockerized production services.

### Notes
- Đây là mốc bootstrap production environment.

---

## [v0.1.0] - 2026-03-30
### Added
- Kiến trúc nền tảng Dẹo Enterprise OS.
- SQL schema và orchestration upgrade plan.
- API/web scaffolding ban đầu.
- Tài liệu kiến trúc, deployment, và roadmap phase.

### Notes
- Architecture baseline, chưa phải production-stable.
