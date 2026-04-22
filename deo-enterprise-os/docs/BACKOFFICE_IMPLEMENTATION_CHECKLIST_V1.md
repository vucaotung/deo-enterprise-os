# BACKOFFICE IMPLEMENTATION CHECKLIST V1

**Ngày:** 2026-04-05

## 5 task đầu tiên

- [x] Task 1 — Seed `workflow_definitions` cho back office
  - [x] tạo migration/table nếu thiếu
  - [x] seed workflow keys back office
  - [x] có service `getWorkflowByKey()`

- [x] Task 2 — Tạo `backoffice_files`
  - [x] tạo migration/table
  - [x] index chính
  - [x] type/model cơ bản

- [x] Task 3 — Tạo `handleBackofficeCallback()`
  - [x] callback route
  - [x] validate token/signature cơ bản
  - [x] update metadata record
  - [x] trả normalized response

- [x] Task 4 — Tạo `drive.resolve-folder.v1`
  - [x] folder naming rules constant
  - [x] resolve path theo generation mode
  - [x] expose endpoint/service

- [x] Task 5 — Tạo `docs.from-template.v1`
  - [x] endpoint dispatch
  - [x] registry validation
  - [x] dispatch payload chuẩn
  - [x] callback-ready flow

---

## Trạng thái hiện tại

5 task đầu tiên đã được **scaffold ở mức foundation/API surface** gồm:
- migration `006_backoffice_foundation.sql`
- constants `apps/api/src/constants/backoffice.ts`
- services registry / files / folder / dispatch
- route `apps/api/src/routes/backoffice.ts`
- API mount trong `apps/api/src/index.ts`

### Chưa làm xong end-to-end production
- chưa có n8n workflow thật
- chưa có Google Docs/Sheets/Drive integration thật
- chưa có invocation trace table riêng cho back office
- chưa có thread append/result application đầy đủ

---

## Module map gợi ý

```text
apps/api/src/
  constants/backoffice.ts
  routes/backoffice.ts
  services/backoffice-registry.service.ts
  services/backoffice-files.service.ts
  services/backoffice-folder.service.ts
  services/backoffice-dispatch.service.ts
infrastructure/postgres/006_backoffice_foundation.sql
```

---

## Ghi chú
Checklist này dùng để bám implementation thật, update dần khi code tiến triển.
