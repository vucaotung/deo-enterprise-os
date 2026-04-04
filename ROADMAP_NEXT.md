# ROADMAP NEXT

## Mục tiêu gần nhất
Đưa Dẹo Enterprise OS từ trạng thái **production demo nội bộ (v0.2.3)** sang **baseline ổn định hơn cho phát triển tiếp (v0.3.0)**.

---

## P0 — Làm ngay

### 1. Chốt source-of-truth
- Chọn production code / trạng thái đang chạy thật làm chuẩn đối chiếu.
- So sánh lại local repo hiện tại với production VPS.
- Ghi rõ phần nào là patch production nhưng chưa nằm trong repo.

**Kết quả mong muốn:**
- không còn mơ hồ local nào là đúng
- có danh sách drift cần sync

---

### 2. Audit lại contract frontend/backend
Các contract cần rà kỹ:
- auth login / token storage / auth me
- dashboard summary response
- tasks response shape
- task status enum
- id type (UUID/string)

**Kết quả mong muốn:**
- có 1 contract thống nhất
- frontend không còn vá kiểu chữa cháy

---

### 3. Dọn `agent-jobs`
Hiện tại `agent-jobs` chưa đồng nhất với flow production đang dùng.

Cần quyết định 1 trong 2:
- sửa `agent-jobs` để trở lại là đường orchestration chuẩn
- hoặc chính thức hóa việc dùng `/api/tasks` như bridge tạm thời, có tài liệu rõ

**Kết quả mong muốn:**
- không còn tình trạng bot phải bypass âm thầm mà không ai biết

---

### 4. Kéo runtime patch quan trọng vào repo hoặc tài liệu hóa rõ
Đặc biệt với:
- `agent-admin`
- logic `job-client.js`
- rule phản hồi sau khi tạo task thật

**Kết quả mong muốn:**
- tái tạo môi trường được
- không phụ thuộc “trí nhớ nóng” nữa

---

## P1 — Làm ngay sau P0

### 5. Tạo docs phát triển chuẩn
Nên thêm:
- `docs/STATUS_AUDIT_2026-04-04.md`
- `docs/RELEASE_PROCESS.md`
- `docs/PRODUCTION_DRIFT.md`
- `docs/AGENT_RUNTIME_NOTES.md`

---

### 6. Chuẩn hóa release discipline
- Mỗi lần hotfix production phải có changelog entry
- Mỗi version có tag rõ ràng
- Có checklist trước khi release

---

### 7. Audit lại production config
Rà lại:
- `.env.example`
- `docker-compose.prod.yml`
- nginx config
- health check scripts
- tài liệu deploy

Mục tiêu là để người khác clone repo vẫn hiểu đường lên production.

---

## v0.3.0 — Contract Cleanup

### Mục tiêu version
**v0.3.0 = đồng bộ contract + giảm drift + ổn định flow orchestration cơ bản**

### Deliverables dự kiến
- Auth contract sạch
- Dashboard/task contract sạch
- `agent-jobs` được sửa hoặc deprecate có chủ đích
- Local repo khớp hơn với production
- Runtime patch quan trọng được kéo vào repo/docs
- Tài liệu release + known issues đầy đủ hơn

---

## P2 — Sau khi đạt v0.3.0

### 8. Phase 1 thật sự hoàn tất
- agent register / heartbeat / poll / pick / complete
- clarification create / answer / resume
- audit flow rõ ràng

### 9. Phase 2 thật sự hoàn tất
- chat center end-to-end
- clarification inline
- Telegram ↔ web sync rõ ràng
- context panel auto-populate thực chiến

### 10. Phase 3 nâng chất
- tasks kanban sạch hơn
- CRM usable hơn
- notebooks CRUD thật sự dùng được
- dashboard charts meaningful

---

## Nguyên tắc vận hành từ đây
1. Không hotfix production mà không ghi changelog
2. Không để runtime patch quan trọng sống ngoài repo quá lâu
3. Mỗi bước lớn phải có version/tag
4. Mọi roadmap tiếp theo phải bám trên source-of-truth đã chốt

---

## Một câu chốt
**Từ sau mốc v0.2.3, ưu tiên số 1 không phải thêm feature mới, mà là làm sạch contract, giảm drift, và chuẩn hóa release process để hệ này lớn lên không bị nát.**
