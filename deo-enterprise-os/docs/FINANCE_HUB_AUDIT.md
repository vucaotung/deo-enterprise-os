# FINANCE HUB AUDIT

**Ngày:** 2026-04-04  
**Mục tiêu:** Audit `Finance.tsx` để đánh giá mức độ phù hợp của nó với hướng mới: **kế toán + tài chính cho project và company**.

---

## 1. Kết luận nhanh

`apps/web/src/pages/Finance.tsx` hiện **phù hợp hơn `Expenses.tsx` để làm finance hub**, nhưng **chưa đủ sạch để trở thành module accounting/project/company hoàn chỉnh**.

Nó đang ở trạng thái:
- tốt cho mockup/dashboard tài chính tổng quan
- chưa tốt cho dữ liệu thật và mô hình enterprise finance

---

## 2. Điểm phù hợp với hướng mới

### A. Có tính chất “hub” hơn là sub-form đơn lẻ
`Finance.tsx` đã có:
- tổng thu
- tổng chi
- số dư
- bảng giao dịch gần đây
- grouping theo category

Điều này hợp với vai trò:
- màn tài chính tổng quan
- finance overview cho project/company

### B. Dùng cấu trúc card + summary khá đúng hướng
Nó phù hợp để về sau mở rộng thêm:
- project summary
- company summary
- account summary
- payable/receivable widgets
- budget vs actual blocks

---

## 3. Những điểm chưa phù hợp với hướng accounting/project/company

### A. Đang dùng mock data cứng
Hiện `Finance.tsx` dùng `mockExpenses` hardcoded.

### B. Model expense còn quá đơn giản và cũ
Các field hiện tại thiên về demo UI, chưa phản ánh đủ domain:
- chưa có project-level aggregation rõ
- chưa có account status/payment state rõ
- chưa có budget context
- chưa có receivable/payable
- chưa có approval/accounting workflow rõ

### C. Chưa có company/project segmentation thật sự ở UI
Dù dữ liệu có `company_id`, màn hiện tại chưa thể hiện đúng:
- đang xem finance cho công ty nào
- đang xem finance cho project nào
- filter/scope theo company/project ở đâu

### D. Modal thêm chi phí còn là UI demo
Form thêm chi phí hiện mới là form mock đơn giản, chưa đủ cho accounting flow thật.

---

## 4. Đánh giá vai trò nên giao cho `Finance.tsx`

### Canonical role đề xuất
`Finance.tsx` nên là:

> **Finance Hub / Finance Overview Page**

Tức là:
- màn tổng quan tài chính chính
- không phải nơi gánh hết CRUD chi tiết
- không phải page expense workflow duy nhất

### Còn `Expenses.tsx` nên là gì?
- sub-page / child module / transactional view
- dùng khi cần xem hoặc xử lý danh sách expense chi tiết
- nhưng phải refactor theo domain accounting/project/company trước khi mount

---

## 5. Hướng refactor đề xuất cho `Finance.tsx`

### Finance Hub v1
Nên có:
- summary theo company
- summary theo project
- tổng thu / tổng chi / số dư
- top categories
- recent transactions
- filter company / project / period

### Finance Hub v2
Mở rộng thêm:
- budget vs actual
- payable / receivable
- cashflow trend
- debt/obligation widgets
- export/report

---

## 6. Quyết định tạm thời sau audit

### Chốt
- **Giữ `Finance.tsx` là hub chính cho domain tài chính**
- **Không mount `Expenses.tsx` trước khi refactor**
- `Expenses.tsx` hiện chỉ là runtime snapshot/reference

### Chưa làm ở bước này
- chưa sửa `Finance.tsx`
- chưa thay mock data bằng API thật
- chưa thiết kế finance data model mới

---

## 7. Một câu chốt

**Nếu Finance domain của OS này đi theo hướng kế toán + tài chính cho project/company, thì `Finance.tsx` nên được giữ làm hub chính, còn `Expenses.tsx` chỉ nên là module con sau khi được refactor đúng domain.**
