# WAVE 1 MERGE NOTES

**Ngày:** 2026-04-04  
**Mục tiêu:** Ghi nhận các cặp file đầu tiên đã được đưa từ production reality vào repo local dưới dạng merge an toàn.

---

## 1. Các cặp đã xử lý ở bước 19

### Pair 1
- Production: `apps/api/src/config/database.ts`
- Local cũ: `apps/api/src/db.ts`
- Kết quả: thêm `apps/api/src/config/database.ts` vào repo để phản ánh runtime production, chưa xóa `db.ts` cũ.

### Pair 2
- Production: `apps/web/src/api/client.ts`
- Local cũ: `apps/web/src/lib/api.ts`
- Kết quả: thêm `apps/web/src/api/client.ts` vào repo để phản ánh runtime production, chưa loại bỏ `lib/api.ts` cũ.

### Pair 3
- Production: `apps/web/src/types.ts`
- Local cũ: `apps/web/src/types/index.ts`
- Kết quả: thêm `apps/web/src/types.ts` vào repo để phản ánh runtime production, chưa loại bỏ `types/index.ts` cũ.

### Pair 4
- Production: `apps/web/src/vite-env.d.ts`
- Local cũ: chưa có file tương ứng rõ ràng
- Kết quả: thêm vào repo để hỗ trợ build/runtime contract của production-style frontend.

---

## 2. Vì sao merge theo kiểu additive

Ở giai đoạn này, mục tiêu là:
- giảm drift
- tăng độ phản ánh production vào repo
- tránh overwrite nhầm architecture/local layout cũ

Do đó, chiến lược là:
- **add production-runtime files trước**
- **xóa/gộp file cũ sau** khi đã audit kỹ import graph và build path

---

## 3. Kết luận bước 19

Bước 19 chưa phải refactor sạch hoàn toàn, nhưng đã làm được việc quan trọng:
- đưa 4 file runtime-critical của production vào repo local/GitHub
- tạo nền để bước kế tiếp audit import graph và quyết định file nào sẽ là canonical path

---

## 4. Việc tiếp theo được khuyến nghị

### Priority A
Audit import graph frontend:
- `src/api/client.ts` vs `src/lib/api.ts`
- `src/types.ts` vs `src/types/index.ts`

### Priority B
Audit import graph backend:
- `src/config/database.ts` vs `src/db.ts`

### Priority C
Kéo thêm file production-critical tiếp theo:
- `apps/api/src/routes/telegram.ts`
- `apps/web/src/pages/Expenses.tsx`

---

## 5. Một câu chốt

**Bước 19 là mốc đầu tiên repo bắt đầu nhận file runtime thật từ production vào bên trong codebase, thay vì chỉ dừng ở mức tài liệu audit.**
