# KNOWN ISSUES

## 1. Source-of-truth — duplicate tree (RESOLVED 2026-05-04)
### Mô tả
Sau khi convert submodule → regular dir (commit `2248ef4`), repo có 2 cây code trùng nhau: root và `/deo-enterprise-os/` nested. Nested copy mới hơn (có v3.1.0 changelog + HOOKS_PLAN.md).

### Resolution
- Promote `CHANGELOG.md`, `VERSION.md`, `goclaw/config/HOOKS_PLAN.md` từ nested lên root.
- Xóa toàn bộ `deo-enterprise-os/` nested directory.
- `.env.local` đã leak GoClaw token vào git — rotate token, thêm `.env.local` vào `.gitignore`.

### Ưu tiên
~~P0~~ ✅ Done

---

## 1b. Source-of-truth — local vs VPS production drift
### Mô tả
Code đang bị lệch giữa local repo và VPS production (runtime hotfix agent-admin nằm ngoài repo).

### Resolution path
ADR-13 (rebuild) — code cũ đóng băng tại `legacy/v1.2.0-dev`, production v0.2.3 chạy song song không thêm feature, cutover khi monorepo mới đạt Phase 0 Exit Criteria.

### Ưu tiên
P1 (giảm từ P0 sau ADR-13)

---

## 2. `agent-jobs` route — DEPRECATED bởi rebuild (ADR-13)
### Mô tả
Luồng orchestration/job hiện còn dùng logic/schema đời cũ. Production task flow đã được vá theo hướng khác.

### Resolution
ADR-13: không port `agent-jobs` sang monorepo mới. Bridge `/api/tasks` được formalize trong API mới theo Phase 0 v2 contract.

### Ưu tiên
~~P0~~ ✅ Decided (deprecated)

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

## 5. GitHub repo (RESOLVED)
### Mô tả
Đã có remote `vucaotung/deo-enterprise-os`. Branch chính + version tags chuẩn từ `v3.1.0`.

### Ưu tiên
~~P0~~ ✅ Done

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
