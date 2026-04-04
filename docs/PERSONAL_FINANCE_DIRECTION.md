# PERSONAL FINANCE DIRECTION

**Ngày chốt:** 2026-04-04  
**Quyết định:** Lùi module `Expenses` kiểu generic / doanh nghiệp, chuyển ưu tiên sang **theo dõi thu chi cá nhân cho sếp**.

---

## 1. Quyết định chính thức

Từ mốc này:
- `apps/web/src/pages/Expenses.tsx` **không còn là ưu tiên active ngay**
- không coi `Expenses.tsx` là canonical financial UI trong ngắn hạn
- hướng tài chính ngắn hạn của hệ là:
  - ghi nhận thu chi cá nhân
  - theo dõi giao dịch cá nhân của sếp
  - ưu tiên integration với quy trình thực tế sếp đang dùng

---

## 2. Ý nghĩa thực tế

Điều này có nghĩa:
- chưa cần wiring `Expenses.tsx` vào app router lúc này
- chưa cần cleanup sâu theo hướng expense workflow doanh nghiệp (`pending/approved/rejected`)
- thay vào đó, tài chính nên bám nhu cầu thực của sếp:
  - nhập giao dịch cá nhân
  - phân loại chi tiêu cá nhân
  - tổng hợp theo ngày/tuần/tháng
  - có thể nối với bill, chuyển khoản, sheet chi tiêu hiện có

---

## 3. Vì sao đổi hướng

`Expenses.tsx` hiện phản ánh một workflow kiểu hệ thống expense management tổng quát/doanh nghiệp hơn là use case cá nhân của sếp.

Trong khi nhu cầu thật hiện tại là:
- theo dõi thu chi cá nhân
- ghi nhanh giao dịch
- sync/đối chiếu với quy trình vận hành tài chính cá nhân đang có

Nên nếu cố active `Expenses.tsx` bây giờ sẽ dễ:
- lệch use case
- mất thời gian cleanup sai hướng
- làm hệ cồng kềnh trước khi chạm đúng nhu cầu thật

---

## 4. Tác động tới roadmap

### Không làm ngay
- không mount `Expenses.tsx` vào router production-local hiện tại
- không ưu tiên refactor workflow `pending/approved/rejected`
- không coi expense module generic là mốc tiếp theo của `v0.3.0`

### Chuyển ưu tiên sang
- thiết kế **Personal Finance flow**
- xác định canonical data model cho giao dịch cá nhân
- gắn với hệ sheet/expense tracking thực tế của sếp nếu phù hợp

---

## 5. Cách hiểu đúng về file `Expenses.tsx`

Hiện tại file này nên được xem là:
- runtime snapshot/import từ production
- tài sản tham khảo kỹ thuật
- chưa phải quyết định sản phẩm cuối cho domain tài chính cá nhân

---

## 6. Hướng tiếp theo được khuyến nghị

Thay vì làm tiếp `Expenses.tsx`, nên làm một nhánh mới cho:

### Personal Finance v1
- transaction model cho cá nhân
- category cá nhân
- account/source of payment
- note/vendor
- daily/weekly/monthly summary
- hook với bill/image/text input về sau

---

## 7. Một câu chốt

**Module `Expenses` generic được lùi lại; hướng đúng hiện tại cho domain tài chính là xây flow theo dõi thu chi cá nhân cho sếp, vì đó mới là use case thực chiến cần ưu tiên.**
