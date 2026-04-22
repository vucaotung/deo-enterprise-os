# WEB APP REFACTOR MAPPING

**Ngày:** 2026-04-05  
**Mục tiêu:** Map cụ thể từ cấu trúc route/file hiện tại sang cấu trúc mục tiêu theo domain để phục vụ refactor web app có kiểm soát.

---

## 1. Nguyên tắc đọc file này

File này không nhằm nói “xóa hết làm lại”, mà nhằm trả lời rõ:
- route nào đang có
- route nào nên giữ
- route nào nên đổi vai trò
- file nào là canonical
- file nào chỉ là compatibility / runtime reference / legacy

---

## 2. Route hiện tại → Route mục tiêu

## A. Dashboard
### Hiện tại
- `/` → `Dashboard.tsx`

### Mục tiêu
- giữ nguyên `/`
- `Dashboard.tsx` tiếp tục là dashboard entry chính

### Kết luận
**Giữ nguyên**

---

## B. Tasks / Operations
### Hiện tại
- `/tasks` → `Tasks.tsx`

### Mục tiêu
- `/tasks` → list view
- `/tasks/board` → kanban board
- `/tasks/:id` → detail

### Kết luận
- `Tasks.tsx` giữ vai trò core
- về sau cần tách thêm board/detail nếu UI đủ lớn

---

## C. Chat
### Hiện tại
- `/chat` → `Chat.tsx`

### Mục tiêu
Có 2 hướng hợp lệ:
1. giữ `/chat` như operational communication center
2. đổi thành `/conversations`

### Khuyến nghị
Ngắn hạn:
- giữ `/chat`

Trung hạn:
- có thể đổi thành `/conversations` nếu muốn sát domain hơn

### Kết luận
**Giữ tạm, refactor naming sau**

---

## D. Clarifications
### Hiện tại
- `/clarifications` → `Clarifications.tsx`

### Mục tiêu
- giữ `/clarifications`
- đây là route lõi cho operations/agent bridge

### Kết luận
**Giữ nguyên**

---

## E. CRM
### Hiện tại
- `/crm` → `CRM.tsx`

### Mục tiêu
Ngắn hạn:
- giữ `/crm`

Trung hạn:
- thêm:
  - `/clients`
  - `/clients/:id`
  - `/leads`
  - `/leads/:id`

### Kết luận
- `CRM.tsx` giữ vai trò overview/hub
- clients/leads nên tách ra sau

---

## F. Finance
### Hiện tại
- `/finance` → `Finance.tsx`
- chưa có route `/finance/transactions`
- chưa có route `/finance/accounts`
- chưa có route `/finance/categories`
- `Expenses.tsx` tồn tại nhưng chưa route

### Mục tiêu
- `/finance` → finance hub
- `/finance/transactions`
- `/finance/accounts`
- `/finance/categories`
- `/finance/projects`
- `/finance/reports`
- `/finance/budgets` *(sau)*
- `/finance/payables` *(sau)*
- `/finance/receivables` *(sau)*

### Kết luận
- `Finance.tsx` = **giữ và nâng lên hub chính**
- `Expenses.tsx` = **không mount vội**, chỉ làm runtime reference

---

## G. Agents
### Hiện tại
- `/agents` → `Agents.tsx`

### Mục tiêu
- `/agents`
- `/agents/:id`
- có thể thêm `/jobs` hoặc `/orchestration/jobs`

### Kết luận
- `Agents.tsx` giữ vai trò list/overview
- cần tách detail/orchestration views về sau

---

## H. Notebooks / Knowledge
### Hiện tại
- `/notebooks` → `Notebooks.tsx`

### Mục tiêu
- `/notebooks`
- `/notebooks/:id`

### Kết luận
- giữ `Notebooks.tsx` làm overview/list
- thêm detail route sau

---

## I. Audit / System
### Hiện tại
- chưa có route frontend riêng rõ cho audit/system ngoài vài dấu vết backend

### Mục tiêu
- `/audit`
- `/system/health`
- `/system/releases`
- `/system/integrations`

### Kết luận
- đây là nhóm route nên bổ sung sau khi core domains ổn định hơn

---

## 3. File hiện tại → Vai trò mục tiêu

## A. Pages

### `apps/web/src/pages/Dashboard.tsx`
- **Vai trò hiện tại:** dashboard home
- **Vai trò mục tiêu:** giữ nguyên
- **Trạng thái:** canonical

### `apps/web/src/pages/Tasks.tsx`
- **Vai trò hiện tại:** tasks page chính
- **Vai trò mục tiêu:** task list / entry point của Operations
- **Trạng thái:** canonical short-term

### `apps/web/src/pages/Chat.tsx`
- **Vai trò hiện tại:** chat/communication page
- **Vai trò mục tiêu:** operations conversation center hoặc conversation module
- **Trạng thái:** keep, naming may evolve later

### `apps/web/src/pages/Clarifications.tsx`
- **Vai trò hiện tại:** clarification page
- **Vai trò mục tiêu:** giữ làm clarification queue chính
- **Trạng thái:** canonical

### `apps/web/src/pages/CRM.tsx`
- **Vai trò hiện tại:** CRM hub
- **Vai trò mục tiêu:** giữ làm CRM overview/hub
- **Trạng thái:** canonical short-term

### `apps/web/src/pages/Finance.tsx`
- **Vai trò hiện tại:** finance mock/demo hub
- **Vai trò mục tiêu:** finance hub chính cho project/company accounting
- **Trạng thái:** canonical direction, needs refactor

### `apps/web/src/pages/Expenses.tsx`
- **Vai trò hiện tại:** imported production runtime page
- **Vai trò mục tiêu:** runtime reference / possible future finance sub-view
- **Trạng thái:** imported, not canonical, not active

### `apps/web/src/pages/Agents.tsx`
- **Vai trò hiện tại:** agents overview
- **Vai trò mục tiêu:** giữ làm agents hub/list
- **Trạng thái:** canonical short-term

### `apps/web/src/pages/Notebooks.tsx`
- **Vai trò hiện tại:** knowledge/notebook page
- **Vai trò mục tiêu:** giữ làm notebook list/hub
- **Trạng thái:** canonical short-term

### `apps/web/src/pages/Login.tsx`
- **Vai trò hiện tại:** login page
- **Vai trò mục tiêu:** auth entry page
- **Trạng thái:** canonical

---

## B. API layer

### `apps/web/src/lib/api.ts`
- **Vai trò hiện tại:** compatibility layer
- **Vai trò mục tiêu:** legacy adapter only
- **Trạng thái:** không phải canonical nữa

### `apps/web/src/api/client.ts`
- **Vai trò hiện tại:** production-style API client
- **Vai trò mục tiêu:** canonical API client nền
- **Trạng thái:** canonical

### Định hướng tiếp theo
Từ `client.ts` sẽ tách dần thành:
- `api/auth.ts`
- `api/tasks.ts`
- `api/crm.ts`
- `api/finance.ts`
- `api/agents.ts`
- ...

---

## C. Types layer

### `apps/web/src/types/index.ts`
- **Vai trò hiện tại:** compatibility layer
- **Vai trò mục tiêu:** legacy adapter only
- **Trạng thái:** không phải canonical nữa

### `apps/web/src/types.ts`
- **Vai trò hiện tại:** production-style canonical types file
- **Vai trò mục tiêu:** canonical type entry point ngắn hạn
- **Trạng thái:** canonical

### Định hướng tiếp theo
Sau khi contract ổn định hơn, có thể tách thành:
- `types/auth.ts`
- `types/task.ts`
- `types/crm.ts`
- `types/finance.ts`
- `types/agent.ts`
- `types/common.ts`

---

## D. Backend DB layer

### `apps/api/src/db.ts`
- **Vai trò hiện tại:** compatibility layer
- **Vai trò mục tiêu:** legacy adapter only
- **Trạng thái:** không phải canonical nữa

### `apps/api/src/config/database.ts`
- **Vai trò hiện tại:** production-style DB config
- **Vai trò mục tiêu:** canonical DB layer
- **Trạng thái:** canonical

---

## E. Backend route layer

### `apps/api/src/routes/telegram.ts`
- **Vai trò hiện tại:** production Telegram webhook route
- **Vai trò mục tiêu:** canonical Telegram webhook route
- **Trạng thái:** canonical, đã active trong `index.ts`

### `apps/api/src/routes/agent-jobs.ts`
- **Vai trò hiện tại:** orchestration route nhưng còn lệch contract
- **Vai trò mục tiêu:** cần quyết định fix hoặc deprecate có chủ đích
- **Trạng thái:** unstable / debt area

---

## 4. File state classification

## Canonical now
- `apps/api/src/config/database.ts`
- `apps/api/src/routes/telegram.ts`
- `apps/web/src/api/client.ts`
- `apps/web/src/types.ts`
- `apps/web/src/pages/Dashboard.tsx`
- `apps/web/src/pages/Tasks.tsx`
- `apps/web/src/pages/Clarifications.tsx`
- `apps/web/src/pages/Login.tsx`
- `apps/web/src/pages/Finance.tsx` *(canonical direction, not fully refactored yet)*

---

## Compatibility / legacy adapters
- `apps/api/src/db.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/types/index.ts`

---

## Imported runtime references, chưa canonical
- `apps/web/src/pages/Expenses.tsx`

---

## Debt / unclear / needs decision
- `apps/api/src/routes/agent-jobs.ts`
- naming/position của `Chat.tsx`
- scope tách riêng của CRM children routes
- structure cuối cùng của Finance subviews

---

## 5. Refactor order đề xuất

### Order 1 — giữ ổn định lõi
- Dashboard
- Tasks
- Clarifications
- Login/Auth
- DB layer
- API client layer

### Order 2 — chốt domain center
- Finance hub (`Finance.tsx`)
- Agents overview
- CRM hub
- Knowledge hub

### Order 3 — mở rộng subviews
- tasks board/detail
- clients/leads detail
- finance transactions/accounts/categories/projects
- agent detail/jobs
- notebook detail

---

## 6. Một câu chốt

**Refactor web app nên đi theo hướng: giữ ổn định các entry point hiện có, canonical hóa layer nền (db/api/types), rồi mới mở rộng route/file structure theo domain; trong đó Finance giữ `Finance.tsx` làm hub chính, còn `Expenses.tsx` chỉ là runtime reference chứ không phải đích sản phẩm.**
