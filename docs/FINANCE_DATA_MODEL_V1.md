# FINANCE DATA MODEL V1

**Ngày:** 2026-04-04  
**Mục tiêu:** Chốt mô hình dữ liệu v1 cho domain **kế toán + tài chính theo project/company** trong Dẹo Enterprise OS.

---

## 1. Mục tiêu thiết kế

Finance model v1 phải đủ để hỗ trợ:
- theo dõi tài chính theo **company**
- theo dõi tài chính theo **project**
- quản lý **expense records**
- quản lý **account / nguồn tiền**
- quản lý **category**
- theo dõi **payment status**
- tạo nền cho các lớp sau như:
  - budget vs actual
  - receivable / payable
  - debt / obligation
  - reconciliation

---

## 2. Nguyên tắc mô hình hóa

1. **Company là scope gốc** cho phần lớn dữ liệu tài chính.
2. **Project là scope con tùy chọn** nhưng rất quan trọng cho báo cáo/project accounting.
3. Một giao dịch tài chính không nhất thiết chỉ là “expense”; về dài hạn cần hỗ trợ cả inflow/outflow.
4. v1 có thể bắt đầu từ `expense-centric model`, nhưng phải chừa đường nâng lên `transaction-centric model`.
5. Không trộn domain tài chính doanh nghiệp với thu chi cá nhân.

---

## 3. Thực thể cốt lõi của v1

## A. FinanceAccount
Đại diện cho nơi phát sinh hoặc chứa dòng tiền.

### Mục đích
- tài khoản ngân hàng công ty
- ví tiền mặt
- tài khoản thanh toán riêng cho project
- tài khoản trung gian

### Trường đề xuất
- `id`
- `company_id`
- `name`
- `type` (`bank`, `cash`, `wallet`, `virtual`, `other`)
- `currency`
- `account_number_masked`
- `bank_name`
- `owner_name`
- `is_active`
- `created_at`
- `updated_at`

### Ghi chú
- V1 chưa cần lưu số tài khoản đầy đủ nếu chưa cần.
- Có thể thêm `opening_balance` ở v1.1 nếu cần.

---

## B. FinanceCategory
Danh mục phân loại chi phí / dòng tiền.

### Mục đích
- marketing
- payroll
- operations
- technology
- rent
- travel
- tax
- other

### Trường đề xuất
- `id`
- `company_id`
- `name`
- `code`
- `type` (`expense`, `income`, `mixed`)
- `parent_id` (nullable)
- `is_active`
- `created_at`
- `updated_at`

### Ghi chú
- hỗ trợ cây category về sau
- đủ cho project/company reporting

---

## C. FinanceTransaction
Đây là thực thể nên xem là **trung tâm dài hạn**.

### Vai trò
- ghi nhận một dòng tiền hoặc nghiệp vụ tài chính
- về ngắn hạn có thể dùng chủ yếu cho expense
- về dài hạn có thể mở rộng cho income, transfer, adjustment

### Trường đề xuất
- `id`
- `company_id`
- `project_id` (nullable)
- `account_id`
- `category_id`
- `transaction_type` (`expense`, `income`, `transfer`, `adjustment`)
- `amount`
- `currency`
- `description`
- `counterparty_name` (nullable)
- `occurred_at`
- `recorded_at`
- `created_by`
- `status` (`draft`, `submitted`, `approved`, `paid`, `cancelled`, `rejected`)
- `payment_status` (`unpaid`, `partial`, `paid`, `refunded`, `waived`)
- `reference_code` (nullable)
- `attachment_url` (nullable)
- `notes` (nullable)
- `created_at`
- `updated_at`

### Ghi chú
- Nếu v1 muốn đi nhanh, có thể map bảng `expenses` hiện có thành `FinanceTransaction` kiểu `expense`.
- Nhưng docs nên chốt từ đầu rằng `FinanceTransaction` là hướng lâu dài.

---

## D. FinanceExpense
Nếu muốn giữ backward compatibility với hệ hiện tại, có thể giữ `expenses` như một lớp cụ thể hóa từ `FinanceTransaction`.

### Hai lựa chọn
#### Option 1 — Giữ bảng `expenses` hiện tại và dần nâng
- nhanh hơn cho migration
- ít đụng code cũ hơn

#### Option 2 — Đổi tư duy sang `finance_transactions`
- đúng mô hình hơn
- sạch hơn về lâu dài
- nhưng tốn migration/cleanup hơn

### Khuyến nghị hiện tại
**v1 nên giữ bảng `expenses` để tương thích**, nhưng tài liệu hóa rõ rằng:
- về thiết kế, nó chỉ là một lát cắt của transaction model

---

## E. FinanceBudget
Không nhất thiết phải build ngay, nhưng nên chốt model sớm.

### Trường đề xuất
- `id`
- `company_id`
- `project_id` (nullable)
- `category_id` (nullable)
- `period_type` (`monthly`, `quarterly`, `yearly`, `custom`)
- `period_start`
- `period_end`
- `planned_amount`
- `currency`
- `status`
- `created_at`
- `updated_at`

---

## F. FinanceReceivable / FinancePayable
Có thể chưa làm ngay trong v1 implementation, nhưng nên khóa tên miền sớm.

### Receivable
- khoản phải thu từ client/project

### Payable
- khoản phải trả cho vendor/partner/staff/obligation

### Nếu chưa tách bảng riêng
Có thể mô hình hóa tạm bằng transaction + status + direction.

---

## 4. Quan hệ thực thể

### Core relations
- `company` 1-n `finance_accounts`
- `company` 1-n `finance_categories`
- `company` 1-n `finance_transactions`
- `project` 1-n `finance_transactions`
- `finance_account` 1-n `finance_transactions`
- `finance_category` 1-n `finance_transactions`
- `user` 1-n `finance_transactions.created_by`

### Optional future relations
- `finance_transactions` 1-n attachments
- `finance_transactions` n-1 payable entity
- `finance_transactions` n-1 receivable entity

---

## 5. Scope bắt buộc cho UI v1

Finance UI v1 cần xem được:
- tổng chi theo company
- tổng chi theo project
- tổng chi theo category
- giao dịch gần đây
- filter theo khoảng thời gian
- filter theo account
- filter theo category
- filter theo project
- filter theo status/payment_status

---

## 6. Mapping với code hiện tại

### Hiện code đang có gì
- `Finance.tsx` = finance hub mock
- `Expenses.tsx` = runtime snapshot của expense page
- type `Expense` trong code còn đơn giản

### Mapping đề xuất
- ngắn hạn: tiếp tục để `Expense` là entry point UI
- trung hạn: refactor dần `Expense` theo fields gần với `FinanceTransaction`
- dài hạn: chuyển center-of-gravity sang `FinanceTransaction`

---

## 7. Trường tối thiểu nên chốt ngay trong v1 implementation

Nếu cần đi nhanh, transaction/expense record tối thiểu nên có:
- `id`
- `company_id`
- `project_id` (nullable)
- `account_id`
- `category_id`
- `amount`
- `currency`
- `description`
- `occurred_at`
- `created_by`
- `status`
- `payment_status`
- `attachment_url` (nullable)
- `created_at`
- `updated_at`

---

## 8. Những gì cố tình chưa nhét vào v1

Không nên nhồi hết vào v1:
- double-entry accounting đầy đủ
- tax engine
- invoicing hoàn chỉnh
- payroll đầy đủ
- reconciliation engine chuẩn ngân hàng
- forecasting quá sâu

V1 chỉ cần đủ mạnh để:
- quản lý được chi phí và tài chính theo project/company
- làm hub điều hành tài chính cơ bản
- mở đường cho v1.1 / v1.2

---

## 9. Quyết định dữ liệu quan trọng

### Canonical scope
**company-first, project-aware**

### Canonical finance center
**Finance hub trước, expense submodule sau**

### Canonical domain direction
**Accounting + finance for project/company**, không phải personal finance

---

## 10. Một câu chốt

**Finance data model v1 của Dẹo Enterprise OS nên được thiết kế theo hướng company-first, project-aware, bắt đầu thực dụng từ expense records nhưng phải mở đường rõ ràng để tiến lên transaction-centric accounting model trong các version tiếp theo.**
