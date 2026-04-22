# WEB APP STRUCTURE MAP

**Ngày:** 2026-04-05  
**Mục tiêu:** Map lại cấu trúc web app theo domain nghiệp vụ để làm chuẩn cho việc refactor, mở rộng module, và cleanup route/file structure trong các bước tiếp theo.

---

## 1. Tư duy tổng

Web app của Dẹo Enterprise OS nên được tổ chức theo **domain nghiệp vụ**, không tổ chức theo kiểu “đang có file nào thì để file đó làm trung tâm”.

### 7 domain chính
1. **Dashboard**
2. **Operations**
3. **CRM**
4. **Finance**
5. **Agents**
6. **Knowledge**
7. **System**

---

## 2. Dashboard

### Vai trò
Màn tổng quan điều hành.

### Mục tiêu
- xem snapshot hệ thống
- nhìn KPI nhanh
- thấy cảnh báo quan trọng
- nhảy nhanh sang domain cần xử lý

### Route đề xuất
- `/` → Dashboard home

### Widget nên có
- tasks cần chú ý
- clarifications pending
- lead/client updates
- finance snapshot
- agent status
- recent activities

---

## 3. Operations

### Vai trò
Trung tâm vận hành công việc.

### Mục tiêu
- quản lý task
- điều phối tiến độ
- xử lý clarification
- theo dõi conversation liên quan task/agent

### Route đề xuất
- `/tasks`
- `/tasks/board`
- `/tasks/:id`
- `/clarifications`
- `/conversations`

### Thuộc domain này
- task lifecycle
- assignment
- due date
- blockers
- clarification queue
- operational conversations

---

## 4. CRM

### Vai trò
Quản lý lead, client, và đối tượng kinh doanh.

### Mục tiêu
- theo dõi khách hàng
- quản lý lead funnel
- liên kết client với project / tài chính / task về sau

### Route đề xuất
- `/crm`
- `/clients`
- `/clients/:id`
- `/leads`
- `/leads/:id`

### Thuộc domain này
- lead source
- lead status
- client profile
- contact history
- business relationship tracking

---

## 5. Finance

### Vai trò
**Kế toán + tài chính cho project và company**

### Mục tiêu
- theo dõi tài chính theo company
- theo dõi tài chính theo project
- quản lý transaction/account/category/budget/reporting theo domain doanh nghiệp

### Route đề xuất
- `/finance` → Finance hub
- `/finance/transactions`
- `/finance/accounts`
- `/finance/categories`
- `/finance/projects`
- `/finance/reports`
- `/finance/budgets` *(về sau)*
- `/finance/payables` *(về sau)*
- `/finance/receivables` *(về sau)*

### Thuộc domain này
- company finance summary
- project finance summary
- transaction records
- account / source of funds
- finance categories
- payable / receivable direction
- reporting / budgeting direction

### Quyết định kiến trúc
- `Finance.tsx` nên là **finance hub chính**
- Không coi `Expenses.tsx` là submodule chính thức trong hướng product hiện tại
- Nếu cần tái sử dụng logic từ `Expenses.tsx`, chỉ xem nó là **runtime reference**, không phải cấu trúc sản phẩm chính thức

### Ngoài phạm vi OS này
- tài chính cá nhân
- thu chi cá nhân
- personal expense tracker

**Quy ước chốt:** phần tài chính cá nhân của sếp sẽ được build ở hệ/nhánh riêng, không thuộc Dẹo Enterprise OS này.

---

## 6. Agents

### Vai trò
Điều phối agent và orchestration.

### Mục tiêu
- xem trạng thái agent
- theo dõi orchestration
- quản lý workload / heartbeat / escalation

### Route đề xuất
- `/agents`
- `/agents/:id`
- `/jobs` hoặc `/orchestration/jobs`
- `/clarifications`
- `/audit`

### Thuộc domain này
- heartbeat / status
- capability
- active jobs/tasks
- escalation
- action visibility

---

## 7. Knowledge

### Vai trò
Kho tri thức nội bộ và ghi chú vận hành.

### Mục tiêu
- lưu knowledge
- lưu research
- lưu meeting notes
- chia sẻ context cho agent và team

### Route đề xuất
- `/notebooks`
- `/notebooks/:id`
- `/knowledge` *(nếu tách riêng sau)*

### Thuộc domain này
- notebooks
- SOP/reference
- internal notes
- contextual knowledge

---

## 8. System

### Vai trò
Audit, config, health, integration, release visibility.

### Mục tiêu
- theo dõi trạng thái hệ thống
- xem audit trail
- nhìn integration status
- nhìn release/version info

### Route đề xuất
- `/audit`
- `/settings`
- `/system/health`
- `/system/releases`
- `/system/integrations`

### Thuộc domain này
- audit logs
- config summary
- integration status
- release info
- operational visibility

---

## 9. Mapping file hiện tại → domain đúng

### Dashboard
- `Dashboard.tsx` → Dashboard

### Operations
- `Tasks.tsx` → Operations
- `Chat.tsx` → Operations / Agents bridge
- `Clarifications.tsx` → Operations / Agents bridge

### CRM
- `CRM.tsx` → CRM

### Finance
- `Finance.tsx` → Finance hub
- `Expenses.tsx` → runtime reference only, chưa là product module chính thức

### Agents
- `Agents.tsx` → Agents

### Knowledge
- `Notebooks.tsx` → Knowledge

### Auth
- `Login.tsx` → Auth / entry flow

---

## 10. Route map đề xuất

### Core routes
- `/login`
- `/`
- `/tasks`
- `/tasks/board`
- `/tasks/:id`
- `/clarifications`
- `/crm`
- `/clients`
- `/clients/:id`
- `/leads`
- `/leads/:id`
- `/finance`
- `/finance/transactions`
- `/finance/accounts`
- `/finance/categories`
- `/finance/projects`
- `/finance/reports`
- `/agents`
- `/agents/:id`
- `/notebooks`
- `/notebooks/:id`
- `/audit`

---

## 11. Component structure đề xuất

### Layout layer
- `components/Layout`
- `components/Sidebar`
- `components/Topbar`
- `components/Breadcrumbs`

### Shared UI
- `components/Card`
- `components/Table`
- `components/Modal`
- `components/StatCard`
- `components/FilterBar`

### Domain components
#### Operations
- `components/tasks/...`
- `components/clarifications/...`

#### CRM
- `components/crm/...`

#### Finance
- `components/finance/FinanceSummaryCards`
- `components/finance/TransactionTable`
- `components/finance/AccountList`
- `components/finance/CategoryBreakdown`
- `components/finance/ProjectFinanceSummary`
- `components/finance/BudgetWidgets`

#### Agents
- `components/agents/...`

#### Knowledge
- `components/notebooks/...`

---

## 12. Data layer đề xuất

### API clients theo domain
- `api/auth.ts`
- `api/tasks.ts`
- `api/crm.ts`
- `api/finance.ts`
- `api/agents.ts`
- `api/notebooks.ts`
- `api/system.ts`

### Ghi chú ngắn hạn
Hiện canonical API direction đang là:
- `apps/web/src/api/client.ts`

Có thể giữ file này làm client nền, rồi tách domain clients dần sau khi contract ổn định hơn.

---

## 13. Type layer đề xuất

### Đích dài hạn
- `types/auth.ts`
- `types/task.ts`
- `types/crm.ts`
- `types/finance.ts`
- `types/agent.ts`
- `types/notebook.ts`
- `types/common.ts`

### Ghi chú ngắn hạn
Hiện canonical path đang dần chuyển về:
- `apps/web/src/types.ts`

---

## 14. Kết luận chốt

### Finance
- `Finance.tsx` = hub chính
- `Expenses.tsx` = runtime reference, chưa phải module sản phẩm chính thức
- domain = accounting + finance cho project/company
- tài chính cá nhân = ngoài scope

### Agents / Orchestration
- là domain riêng
- không nên trộn lẫn vào CRM hay Finance

### Operations
- task + clarification là lõi vận hành

---

## 15. Một câu chốt

**Web app của Dẹo Enterprise OS nên được tổ chức theo 7 domain: Dashboard, Operations, CRM, Finance, Agents, Knowledge, System; trong đó Finance được chốt là khối kế toán + tài chính cho project/company, còn tài chính cá nhân sẽ được build ở hệ riêng.**
