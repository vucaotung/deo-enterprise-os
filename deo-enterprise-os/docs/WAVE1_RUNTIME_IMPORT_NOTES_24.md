# WAVE 1 RUNTIME IMPORT NOTES — STEP 24

**Ngày:** 2026-04-04  
**Mục tiêu:** Ghi nhận việc kéo 2 file runtime-critical còn lại của wave 1 từ production vào repo local/GitHub.

---

## File đã import ở bước 24

### 1. `apps/api/src/routes/telegram.ts`
Vai trò:
- route webhook Telegram production
- xử lý `/task` cơ bản
- ghi task vào DB qua `config/database.ts`

### 2. `apps/web/src/pages/Expenses.tsx`
Vai trò:
- trang Expenses theo layout/runtime production hiện có
- dùng `../api/client` và `../types`

---

## Ý nghĩa
Sau bước 24, toàn bộ nhóm file critical ban đầu của wave 1 đã được đưa vào repo dưới dạng production-aware import.

Wave 1 giờ đã bao gồm:
- database runtime config
- frontend api client runtime
- frontend runtime types
- vite env typing
- telegram route runtime
- expenses page runtime

---

## Cảnh báo
Import xong không đồng nghĩa đã clean hoàn toàn.

Những vùng vẫn cần cleanup tiếp:
- wiring route Telegram vào `apps/api/src/index.ts`
- wiring page Expenses vào app/router nếu cần đối chiếu thêm
- audit import graph sau khi đã có đầy đủ runtime files
- review contract của Expenses page vì hiện vẫn mang dấu vết workflow cũ (`pending/approved/rejected`)

---

## Kết luận
Bước 24 hoàn tất việc **nhập đủ nhóm file critical wave 1** từ production vào repo. Từ bước kế tiếp, trọng tâm sẽ chuyển từ “import file” sang “gắn chúng vào codebase một cách sạch và nhất quán”.
