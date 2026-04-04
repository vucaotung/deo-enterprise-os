# FINANCE DIRECTION

**Ngày chốt:** 2026-04-04  
**Quyết định hiện tại:** Domain tài chính của Dẹo Enterprise OS sẽ đi theo hướng **kế toán + tài chính cho các project và company**, không ưu tiên flow thu chi cá nhân ở giai đoạn này.

---

## 1. Quyết định chính thức

Từ mốc này, hướng đúng cho khối Finance là:
- theo dõi tài chính theo **company**
- theo dõi tài chính theo **project**
- quản lý expense / budget / dòng tiền / đối soát ở mức vận hành doanh nghiệp
- ưu tiên thiết kế để phục vụ nhiều project, nhiều line vận hành, nhiều thực thể công ty

### Không phải hướng ưu tiên hiện tại
- personal expense tracker cho một cá nhân
- flow thu chi cá nhân đơn lẻ
- expense page chỉ để ghi tiêu vặt cá nhân

---

## 2. Ý nghĩa đối với codebase hiện tại

### `Expenses.tsx`
File này **không bị bỏ nữa**, nhưng cũng **chưa được coi là canonical hoàn chỉnh**.

Nó hiện được xem là:
- runtime snapshot/import từ production
- một điểm khởi đầu cho finance UI
- cần được refactor để tiến về mô hình kế toán + tài chính theo project/company

### `Finance.tsx`
`Finance.tsx` nên được xem là ứng viên tốt hơn cho:
- finance hub
- dashboard tài chính tổng quan
- nơi điều phối sang các màn:
  - expenses
  - budget
  - cashflow
  - receivables/payables
  - project finance summary

---

## 3. Hướng product đúng cho domain Finance

### Finance v1 nên hỗ trợ
- expense records theo company/project
- category tài chính chuẩn hơn
- account/source of payment
- project-level financial summary
- company-level financial summary
- trạng thái khoản chi / duyệt / thanh toán
- báo cáo tổng hợp theo ngày / tuần / tháng

### Finance v2 có thể mở rộng
- budget vs actual
- payable / receivable tracking
- reconciliation
- debt / installment / obligation tracking
- file chứng từ / bill / attachment mapping

---

## 4. Tác động tới roadmap hiện tại

### Không làm theo hướng
- tối ưu `Expenses.tsx` cho use case cá nhân
- xây personal finance tracker độc lập trước

### Sẽ làm theo hướng
- xem lại `Finance.tsx` như hub chính
- đánh giá `Expenses.tsx` như sub-page hoặc module con
- refactor model tài chính để bám `company_id`, `project_id`, `account`, `category`, `status`

---

## 5. Quyết định kiến trúc tạm thời

### Canonical direction cho domain tài chính
**Finance = accounting + project/company finance**

### Working interpretation hiện tại
- `Finance.tsx` = ứng viên hub chính
- `Expenses.tsx` = module con / runtime reference
- chưa active `Expenses.tsx` trực tiếp nếu chưa refactor đúng domain

---

## 6. Việc tiếp theo được khuyến nghị

### Priority A
Audit `Finance.tsx` để xem có thể nâng thành finance hub tới đâu

### Priority B
Audit `Expenses.tsx` để bóc ra phần nào còn hữu ích cho company/project expense flow

### Priority C
Thiết kế canonical finance data model cho:
- company
- project
- expense
- account
- category
- payment status

---

## 7. One-line conclusion

**Khối Finance của Dẹo Enterprise OS được chốt lại theo hướng kế toán + tài chính cho project và company; personal expense tracking không còn là hướng ưu tiên hiện tại.**
