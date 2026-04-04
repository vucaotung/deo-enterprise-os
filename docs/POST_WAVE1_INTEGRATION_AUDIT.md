# POST WAVE 1 INTEGRATION AUDIT

**Ngày:** 2026-04-04  
**Mục tiêu:** Chốt trạng thái integration sau khi đã import đủ nhóm file critical của wave 1 từ production vào repo.

---

## 1. Kết luận nhanh

Sau wave 1, repo đã có đủ một nhóm file runtime-critical từ production. Tuy nhiên, **không phải file nào import vào repo cũng đã được wiring active trong codebase hiện tại**.

Có 3 trạng thái cần phân biệt rõ:
1. **Imported + Active**
2. **Imported nhưng chưa active hoàn toàn**
3. **Imported nhưng còn cần refactor trước khi active**

---

## 2. Telegram route audit

### File
- `apps/api/src/routes/telegram.ts`

### Trạng thái
**Imported nhưng chưa active trong API index hiện tại**

### Bằng chứng
Trong `apps/api/src/index.ts` hiện tại:
- chưa có `import telegramRoutes from './routes/telegram'`
- chưa có `app.use('/api/telegram', telegramRoutes)`

### Ý nghĩa
Repo hiện đã chứa production Telegram route, nhưng local app index vẫn chưa mount route này. Nói cách khác:
- file đã có mặt
- nhưng integration chưa hoàn tất ở app layer

### Việc cần làm tiếp
- review `apps/api/src/index.ts`
- thêm route mount đúng cách
- xác định có cần auth hay không cho webhook path
- test lại route map production-style

---

## 3. Expenses page audit

### File
- `apps/web/src/pages/Expenses.tsx`

### Trạng thái
**Imported nhưng chưa được route vào App.tsx hiện tại**

### Bằng chứng
Trong `apps/web/src/App.tsx` hiện tại:
- không import `Expenses`
- không có route `/expenses`
- vẫn còn route `/finance` trỏ sang `Finance.tsx`

### Ý nghĩa
Repo đã có Expenses page theo production runtime style, nhưng app router hiện tại vẫn đang lấy Finance page làm màn tài chính chính.

### Việc cần làm tiếp
- quyết định canonical page cho khối tài chính:
  - giữ `Finance.tsx`
  - hay chuyển sang `Expenses.tsx`
  - hay để `Finance.tsx` làm hub và `Expenses.tsx` làm sub-page

---

## 4. Active vs Inactive summary

## Imported + active một phần qua compatibility layer
### Backend
- `apps/api/src/config/database.ts`
  - đã được nối gián tiếp qua `apps/api/src/db.ts`

### Frontend API
- `apps/web/src/api/client.ts`
  - đã được nối gián tiếp qua `apps/web/src/lib/api.ts`

### Frontend types
- `apps/web/src/types.ts`
  - đã được nối gián tiếp qua `apps/web/src/types/index.ts`

---

## Imported nhưng chưa active ở integration layer
- `apps/api/src/routes/telegram.ts`
- `apps/web/src/pages/Expenses.tsx`

---

## 5. Risk notes

### Risk A — Telegram route nhìn như có nhưng app chưa mount
Người đọc repo có thể tưởng Telegram integration đã active vì file route đã tồn tại, nhưng thực tế app index chưa wire route đó vào server hiện tại.

### Risk B — Expenses page nhìn như đã có nhưng chưa là route chính thức
Người đọc repo có thể tưởng `Expenses.tsx` đang là page production-ready được app dùng, nhưng thực tế router hiện chưa mount nó.

### Risk C — Finance vs Expenses ambiguity
Hiện có ít nhất 2 hướng UI cho khối tài chính:
- `Finance.tsx`
- `Expenses.tsx`

Nếu không chốt rõ, rất dễ tiếp tục drift ở frontend domain này.

---

## 6. Khuyến nghị bước tiếp theo

### Priority 1
Quyết định status của Telegram route:
- mount ngay vào `index.ts`
- hoặc để trạng thái imported-but-inactive và ghi chú rõ

### Priority 2
Quyết định canonical financial page:
- `Finance.tsx`
- `Expenses.tsx`
- hoặc mô hình hub/sub-page

### Priority 3
Sau khi chốt 2 quyết định trên, mới làm refactor wiring thật

---

## 7. One-line conclusion

**Wave 1 import đã xong, nhưng integration audit cho thấy mới chỉ có 3 lớp được active gián tiếp (database/api/types), còn Telegram route và Expenses page hiện mới tồn tại trong repo chứ chưa được wiring sạch vào app runtime hiện tại.**
