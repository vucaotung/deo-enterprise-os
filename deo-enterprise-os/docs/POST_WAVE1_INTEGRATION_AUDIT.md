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
**Imported nhưng chưa active trong router hiện tại**

### Bằng chứng
Trong `apps/web/src/App.tsx` hiện tại:
- không import `Expenses`
- không có route `/expenses`
- vẫn còn route `/finance` trỏ sang `Finance.tsx`

### Ý nghĩa
Repo đã có Expenses page theo production runtime style, nhưng app router hiện tại vẫn xem `Finance.tsx` là màn tài chính chính.

### Định hướng hiện tại
Khối Finance không đi theo hướng thu chi cá nhân nữa, mà được chốt là:
- **kế toán + tài chính cho project và company**

Do đó:
- `Expenses.tsx` chưa nên mount vội nếu chưa refactor đúng domain
- `Finance.tsx` hợp lý hơn để giữ vai trò hub chính

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
- `apps/web/src/pages/Expenses.tsx`

## Imported và đã active ở integration layer sau bước 26A
- `apps/api/src/routes/telegram.ts`
  - đã được mount vào `apps/api/src/index.ts` qua `app.use('/api/telegram', telegramRoutes)`

---

## 5. Risk notes

### Risk A — Telegram route nhìn như có nhưng app chưa mount
Người đọc repo có thể tưởng Telegram integration đã active vì file route đã tồn tại, nhưng thực tế app index chưa wire route đó vào server hiện tại.

### Risk B — Finance domain nếu mount `Expenses.tsx` quá sớm sẽ lệch hướng
`Expenses.tsx` hiện vẫn mang dấu vết workflow expense management tổng quát. Nếu mount vội mà chưa refactor theo model company/project thì dễ drift tiếp.

### Risk C — Finance hub chưa được chốt rõ thành flow sản phẩm hoàn chỉnh
Hiện `Finance.tsx` đang là ứng viên hub, nhưng chưa có thiết kế tài chính hoàn chỉnh theo company/project.

---

## 6. Khuyến nghị bước tiếp theo

### Priority 1
Mount Telegram route vào `apps/api/src/index.ts`

### Priority 2
Audit `Finance.tsx` như finance hub chính

### Priority 3
Refactor `Expenses.tsx` theo model accounting/project/company trước khi cân nhắc mount vào router

---

## 7. One-line conclusion

**Wave 1 import đã xong; hiện Telegram route là imported-but-not-active cần wiring tiếp, còn `Expenses.tsx` tuy đã được import nhưng chưa nên active cho tới khi được refactor đúng hướng kế toán + tài chính cho project và company.**
