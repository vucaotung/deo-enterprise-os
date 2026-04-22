# WEB APP CANONICALIZATION PLAN

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt kế hoạch canonicalization cho web app theo từng phase nhỏ, để refactor có kiểm soát dựa trên các tài liệu đã có:
- `WEB_APP_STRUCTURE_MAP.md`
- `WEB_APP_REFACTOR_MAPPING.md`
- `WAVE1_CANONICAL_PATH_DECISIONS.md`

---

## 1. Mục tiêu tổng

Canonicalization không có nghĩa là làm lại web app từ đầu.

Nó có nghĩa là:
- chốt file/path nào là chuẩn
- chốt route nào là chuẩn
- chốt page nào là hub chính
- giảm dần compatibility layers
- biến repo từ “có nhiều đời file cùng sống” thành “một cấu trúc rõ ràng, ít mập mờ”

---

## 2. Definition of Done

Web app canonicalization được coi là đạt nếu:
- các compatibility layer chỉ còn là lớp tạm, không còn là nơi business logic chính nằm đó
- các route chính theo domain đã rõ
- file canonical cho db/api/types/auth/finance đã rõ và được code thật dùng
- imported runtime references được phân loại rõ: active / inactive / archive
- docs và code không còn nói hai thứ khác nhau về cấu trúc web app

---

## 3. Phase plan

## Phase 1 — Canonicalize nền tảng
### Mục tiêu
Chốt các lớp nền đã xác định canonical path.

### Scope
- DB layer
- API client layer
- types layer
- auth flow layer

### Việc cần làm
- giữ `config/database.ts` là canonical DB layer
- giữ `api/client.ts` là canonical API layer
- giữ `types.ts` là canonical type entry
- review `useAuth.ts` để chắc nó khớp `api/client.ts`
- ghi rõ compatibility layer nào còn tạm sống:
  - `db.ts`
  - `lib/api.ts`
  - `types/index.ts`

### Deliverable
- nền tảng đủ ổn để các page mới không tiếp tục import nhầm legacy paths

---

## Phase 2 — Canonicalize route hubs
### Mục tiêu
Chốt page nào là entry point chính theo từng domain.

### Canonical hubs cần chốt
- Dashboard → `Dashboard.tsx`
- Operations → `Tasks.tsx`, `Clarifications.tsx`
- CRM → `CRM.tsx`
- Finance → `Finance.tsx`
- Agents → `Agents.tsx`
- Knowledge → `Notebooks.tsx`
- Auth → `Login.tsx`

### Việc cần làm
- review `App.tsx`
- loại bỏ mập mờ route nếu có
- xác định route nào giữ tạm, route nào sẽ đổi tên về sau

### Deliverable
- `App.tsx` phản ánh đúng hub structure của app

---

## Phase 3 — Domain cleanup: Operations / CRM / Agents / Knowledge
### Mục tiêu
Dọn các page hub đang tồn tại để mỗi page đúng domain hơn.

### Scope
- `Tasks.tsx`
- `Chat.tsx`
- `Clarifications.tsx`
- `CRM.tsx`
- `Agents.tsx`
- `Notebooks.tsx`

### Việc cần làm
- xác định page nào là hub, page nào sẽ tách child views sau
- tránh để 1 page vừa làm hub vừa ôm quá nhiều logic rời rạc

### Deliverable
- mỗi domain có hub rõ ràng
- roadmap tách subviews rõ ràng

---

## Phase 4 — Finance canonicalization
### Mục tiêu
Chốt `Finance.tsx` là hub chính theo domain accounting/project/company.

### Scope
- `Finance.tsx`
- `Expenses.tsx`
- finance types / finance API shape / finance model docs

### Việc cần làm
- giữ `Finance.tsx` làm hub
- không mount `Expenses.tsx` như page chính thức ở giai đoạn này
- nếu cần giữ `Expenses.tsx`, chỉ dùng như runtime reference
- dần map UI Finance vào model từ `FINANCE_DATA_MODEL_V1.md`

### Deliverable
- finance domain có 1 hub rõ ràng
- không còn hiểu nhầm finance = personal expense tracker

---

## Phase 5 — Route expansion có kiểm soát
### Mục tiêu
Mở rộng từ hub pages sang child routes mà không làm loạn app structure.

### Candidate expansions
- `/tasks/board`
- `/tasks/:id`
- `/clients`
- `/clients/:id`
- `/leads`
- `/leads/:id`
- `/finance/transactions`
- `/finance/accounts`
- `/finance/categories`
- `/finance/projects`
- `/agents/:id`
- `/notebooks/:id`

### Deliverable
- route tree phát triển có logic, không chắp vá

---

## 4. Compatibility layer strategy

## Giữ tạm nhưng không mở rộng thêm
- `apps/api/src/db.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/types/index.ts`

### Quy tắc
- không viết logic mới vào compatibility layer
- code mới phải dùng canonical path
- chỉ giữ compatibility layer để tránh bể hệ trong giai đoạn chuyển tiếp

---

## 5. Imported runtime reference strategy

## `Expenses.tsx`
### Trạng thái
- imported runtime reference
- chưa là canonical page
- chưa mount như route chính thức

### Quy tắc
- không xem là source-of-truth cho Finance domain
- chỉ dùng làm tài liệu kỹ thuật / nguồn tham khảo khi refactor finance subviews

---

## 6. Refactor order đề xuất

### Order A — nền tảng
1. `useAuth.ts`
2. `api/client.ts`
3. `types.ts`
4. `db.ts` / `config/database.ts`

### Order B — route hubs
5. `App.tsx`
6. `Dashboard.tsx`
7. `Tasks.tsx`
8. `CRM.tsx`
9. `Finance.tsx`
10. `Agents.tsx`
11. `Notebooks.tsx`

### Order C — route expansion
12. child routes theo domain

---

## 7. Những gì không nên làm trong canonicalization phase

Không nên nhét quá nhiều thứ vào cùng lúc:
- redesign UI toàn bộ
- build full realtime chat system
- build full finance accounting engine
- xóa compatibility layer quá sớm
- mount imported production pages vội vàng chỉ vì “đã có file”

---

## 8. Tiêu chí ưu tiên khi có xung đột

Nếu có xung đột giữa:
- file local cũ
- file imported từ production
- docs domain map

thì thứ tự ưu tiên nên là:
1. **domain direction đúng**
2. **canonical path decision**
3. **runtime production truth**
4. **legacy compatibility**

Không để legacy path quyết định kiến trúc dài hạn.

---

## 9. One-line conclusion

**Web app canonicalization nên đi theo 5 phase: chốt nền tảng → chốt route hubs → dọn domain hubs → canonicalize finance → mở rộng child routes; làm như vậy sẽ giúp hệ chuyển từ trạng thái nhiều lớp drift sang một cấu trúc app rõ ràng và bền hơn.**
