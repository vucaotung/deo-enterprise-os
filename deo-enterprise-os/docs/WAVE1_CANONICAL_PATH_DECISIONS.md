# WAVE 1 CANONICAL PATH DECISIONS

**Ngày:** 2026-04-04  
**Mục tiêu:** Chốt quyết định định hướng cho các cặp path bị trùng vai trò sau khi import wave 1 runtime files từ production vào repo.

---

## 1. Executive Summary

Sau bước 19, repo hiện tồn tại song song các cặp file cùng vai trò nhưng khác path/cấu trúc. Ở bước 20, mục tiêu không phải refactor toàn bộ ngay trong đêm, mà là:
- audit import graph
- xác định file nào đang được code local dùng
- xác định file nào phản ánh runtime production hơn
- chốt **canonical target path** cho các bước cleanup tiếp theo của `v0.3.0`

---

## 2. Kết quả audit nhanh

### Backend
Hiện phần lớn API local đang import từ:
- `apps/api/src/db.ts`

Trong khi production wave 1 mang về:
- `apps/api/src/config/database.ts`

### Frontend API layer
Hiện phần lớn frontend local đang dùng:
- `apps/web/src/lib/api.ts`

Trong khi production wave 1 mang về:
- `apps/web/src/api/client.ts`

### Frontend types layer
Hiện phần lớn frontend local đang dùng:
- `apps/web/src/types/index.ts`

Trong khi production wave 1 mang về:
- `apps/web/src/types.ts`

---

## 3. Quyết định canonical target

## A. Backend database layer
### Hiện trạng
- `db.ts` đang là file được import nhiều trong code local.
- `config/database.ts` phản ánh production runtime mới hơn.

### Quyết định
**Canonical target dài hạn:** `apps/api/src/config/database.ts`

### Lý do
- tên path rõ nghĩa hơn
- khớp với runtime production đã vá
- phù hợp hơn nếu về sau mở rộng config layer

### Trạng thái hiện tại
- `db.ts` chưa xóa ngay
- tạm xem `db.ts` là **legacy compatibility layer** cho đến khi refactor import xong

---

## B. Frontend API client layer
### Hiện trạng
- `lib/api.ts` đang được import bởi auth flow local hiện tại
- `api/client.ts` phản ánh production runtime path mới hơn

### Quyết định
**Canonical target dài hạn:** `apps/web/src/api/client.ts`

### Lý do
- tách riêng rõ API client khỏi generic lib
- khớp production runtime đã import về
- dễ làm contract cleanup hơn cho auth/tasks/dashboard

### Trạng thái hiện tại
- `lib/api.ts` chưa xóa ngay
- tạm xem `lib/api.ts` là **legacy/compat path** cho tới khi auth flow được refactor sạch

---

## C. Frontend types layer
### Hiện trạng
- `types/index.ts` đang là path local cũ
- `types.ts` phản ánh production runtime path mới hơn và gọn hơn

### Quyết định
**Canonical target dài hạn:** `apps/web/src/types.ts`

### Lý do
- đơn giản hơn
- sát runtime production hơn
- dễ chuẩn hóa import path hơn trong bước cleanup tiếp theo

### Trạng thái hiện tại
- `types/index.ts` chưa xóa ngay
- tạm xem là legacy path cho tới khi import graph được chuyển hết

---

## 4. Điều chưa làm ở bước 20

Bước 20 **chưa refactor import graph hàng loạt**. Cụ thể chưa làm:
- chưa đổi tất cả import từ `db.ts` sang `config/database.ts`
- chưa đổi tất cả import từ `lib/api.ts` sang `api/client.ts`
- chưa đổi tất cả import từ `types/index.ts` sang `types.ts`
- chưa test build sau refactor path hàng loạt

Lý do:
- auth flow local và production vẫn đang khác contract
- refactor path hàng loạt lúc này dễ sinh regression dây chuyền
- cần làm sau khi chốt cleanup theo từng lớp

---

## 5. Hướng thực thi tiếp theo

### Priority 1 — Backend DB adapter cleanup
Tạo bridge/adapter rõ ràng giữa:
- `db.ts`
- `config/database.ts`

Mục tiêu:
- chuyển dần import về `config/database.ts`
- giữ compatibility tạm thời

### Priority 2 — Frontend auth/API cleanup
Audit kỹ:
- `apps/web/src/lib/api.ts`
- `apps/web/src/api/client.ts`
- `apps/web/src/hooks/useAuth.ts`
- `apps/web/src/pages/Login.tsx`

Mục tiêu:
- chốt token key
- chốt login payload
- chốt canonical API layer

### Priority 3 — Frontend types cleanup
- chuyển import dần về `types.ts`
- rồi mới deprecate `types/index.ts`

---

## 6. Canonical path table

| Layer | Local legacy path | Production-style path | Canonical target |
|---|---|---|---|
| Backend DB | `apps/api/src/db.ts` | `apps/api/src/config/database.ts` | `apps/api/src/config/database.ts` |
| Frontend API | `apps/web/src/lib/api.ts` | `apps/web/src/api/client.ts` | `apps/web/src/api/client.ts` |
| Frontend Types | `apps/web/src/types/index.ts` | `apps/web/src/types.ts` | `apps/web/src/types.ts` |

---

## 7. One-line conclusion

**Bước 20 đã chốt được canonical target cho 3 cặp path quan trọng của wave 1; từ đây các bước cleanup tiếp theo có thể refactor có định hướng, thay vì vừa sửa vừa đoán file nào mới là file chuẩn.**
