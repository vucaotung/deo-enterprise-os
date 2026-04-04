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
**Imported nhưng không ưu tiên active lúc này**

### Bằng chứng
Trong `apps/web/src/App.tsx` hiện tại:
- không import `Expenses`
- không có route `/expenses`
- vẫn còn route `/finance` trỏ sang `Finance.tsx`

### Ý nghĩa
Repo đã có Expenses page theo production runtime style, nhưng đây **không còn là hướng ưu tiên product trong ngắn hạn**.

Định hướng mới đã chốt là:
- lùi `Expenses.tsx`
- ưu tiên xây flow **thu chi cá nhân cho sếp**

### Cách hiểu đúng
`Expenses.tsx` hiện nên được xem là:
- runtime snapshot tham khảo từ production
- chưa phải canonical financial UI tiếp theo của sản phẩm

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

## Imported nhưng tạm thời không active theo product direction
- `apps/web/src/pages/Expenses.tsx`

---

## 5. Risk notes

### Risk A — Telegram route nhìn như có nhưng app chưa mount
Người đọc repo có thể tưởng Telegram integration đã active vì file route đã tồn tại, nhưng thực tế app index chưa wire route đó vào server hiện tại.

### Risk B — Expenses page nhìn như đã có nhưng không còn là hướng ưu tiên ngắn hạn
Người đọc repo có thể tưởng `Expenses.tsx` là page tiếp theo cần active, trong khi thực tế hướng đúng hiện tại là **personal finance flow** cho sếp.

### Risk C — Finance domain cần chốt lại theo use case thật
Hiện có các dấu vết của 2 hướng:
- generic expense management
- personal finance tracking

Nếu không chốt sớm, frontend domain tài chính sẽ tiếp tục drift.

---

## 6. Khuyến nghị bước tiếp theo

### Priority 1
Mount Telegram route vào `apps/api/src/index.ts`

### Priority 2
Tách riêng một nhánh thiết kế cho **personal finance** thay vì tiếp tục wiring `Expenses.tsx`

### Priority 3
Giữ `Expenses.tsx` như snapshot tham khảo cho tới khi quyết định rõ có tái sử dụng một phần nào đó hay không

---

## 7. One-line conclusion

**Wave 1 import đã xong; hiện chỉ còn Telegram route là imported-but-not-active cần wiring tiếp, còn `Expenses.tsx` được giữ như runtime snapshot nhưng không còn là ưu tiên active vì domain tài chính đã chuyển hướng sang theo dõi thu chi cá nhân cho sếp.**
