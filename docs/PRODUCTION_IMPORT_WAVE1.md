# PRODUCTION IMPORT WAVE 1

**Ngày:** 2026-04-04  
**Mục tiêu:** Ghi nhận nhóm file runtime-critical đầu tiên đã được xác nhận là tồn tại ở production VPS nhưng chưa nằm đúng cấu trúc trong repo local/GitHub.

---

## 1. Wave 1 scope

Nhóm file critical đã được xác định từ production VPS:

1. `apps/api/src/routes/telegram.ts`
2. `apps/api/src/config/database.ts`
3. `apps/web/src/api/client.ts`
4. `apps/web/src/vite-env.d.ts`
5. `apps/web/src/types.ts`

---

## 2. Ý nghĩa của nhóm này

Đây là nhóm file chạm trực tiếp tới runtime behavior hiện đang chạy thật ngoài production, cụ thể:
- Telegram webhook flow
- database config runtime
- frontend API client contract
- Vite env typing/runtime build support
- frontend type contract đời production

Nếu không kéo và hợp nhất đúng nhóm file này, repo sẽ tiếp tục phản ánh sai hoặc thiếu một phần hành vi production thực tế.

---

## 3. Trạng thái sau bước 18

### Đã làm
- Xác nhận 5 file trên tồn tại ở production VPS.
- Xác nhận local repo hiện tại không có các file này ở cùng path tương ứng.
- Tạo snapshot extraction an toàn từ production để phục vụ merge có kiểm soát ở bước tiếp theo.

### Chưa làm trong bước này
- Chưa overwrite trực tiếp local repo bằng nội dung production.
- Chưa merge file-by-file vào nhánh chính.
- Chưa chuẩn hóa path/layout khác biệt giữa local và production.

---

## 4. Vì sao không overwrite thẳng ngay

Vì hiện repo local và production đang lệch cả:
- nội dung file
- vị trí file
- cấu trúc thư mục
- contract giữa frontend/backend

Overwrite thẳng trong giai đoạn này có nguy cơ:
- đưa thêm drift mới
- ghi đè mất governance-local structure
- làm repo khó hiểu hơn thay vì sạch hơn

Do đó, hướng đúng là:
1. import theo wave
2. đối chiếu vai trò từng file
3. merge có chủ đích
4. commit theo nhóm chức năng

---

## 5. Mapping sơ bộ cần xử lý tiếp

### Production-only hoặc khác path
- `apps/api/src/routes/telegram.ts` → local repo chưa có route tương ứng
- `apps/api/src/config/database.ts` → local repo dùng cấu trúc `src/db.ts`
- `apps/web/src/api/client.ts` → local repo dùng `src/lib/api.ts`
- `apps/web/src/vite-env.d.ts` → local repo chưa có file tương ứng
- `apps/web/src/types.ts` → local repo dùng `src/types/index.ts`

---

## 6. Hướng merge khuyến nghị ở bước sau

### A. API runtime layer
- đối chiếu `database.ts` với `src/db.ts`
- đối chiếu `telegram.ts` với các route hiện có
- xác định file nào là production truth, file nào là architecture truth

### B. Frontend runtime layer
- đối chiếu `src/api/client.ts` với `src/lib/api.ts`
- đối chiếu `src/types.ts` với `src/types/index.ts`
- đưa `vite-env.d.ts` vào repo nếu thực sự cần cho build/runtime chuẩn

---

## 7. Deliverable của bước 18

Bước 18 được coi là hoàn tất ở mức audit/import-safe khi:
- wave-1 file list đã được chốt
- đã có ghi nhận trong repo
- đã tránh overwrite bừa
- đã chuẩn bị rõ cho merge function-by-function ở bước kế tiếp

---

## 8. One-line summary

**Wave 1 đã xác định xong nhóm file production-critical đầu tiên; từ bước tiếp theo, việc cần làm không còn là “đoán file nào lệch” nữa, mà là merge có kiểm soát từng vùng runtime để tiến tới source-of-truth alignment thật sự.**
