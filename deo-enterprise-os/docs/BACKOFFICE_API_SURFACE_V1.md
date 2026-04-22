# BACKOFFICE API SURFACE V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt API surface V1 cho nhánh back office để backend có mặt cắt rõ ràng giữa:
- request từ app/chat/orchestration layer
- workflow dispatch
- callback từ n8n
- metadata/read models cho file back office

---

## 1. Sơ đồ tổng thể back office flow

```text
Telegram/Web/App request
→ Thread / project / task context
→ backoffice_agent / writer_agent / coordinator
→ workflow registry validation
→ n8n execution layer
→ Google Docs / Sheets / Drive
→ callback về Work OS
→ metadata / trace / linking
→ result trả về chat / project / task / file list
```

---

## 2. Sơ đồ module / implementation path

```text
apps/api/src/
  routes/
    backoffice.ts              # HTTP surface cho back office
  services/
    backoffice-registry.service.ts
    backoffice-dispatch.service.ts
    backoffice-files.service.ts
    backoffice-folder.service.ts
  constants/
    backoffice.ts              # workflow keys / statuses / generation modes
```

---

## 3. Luồng API tổng quát

```text
Telegram/Web/App request
→ /api/backoffice/*
→ validate + build context
→ dispatchBackofficeWorkflow()
→ n8n / workflow execution
→ /api/backoffice/workflows/callback
→ upsert backoffice_files + link + trace
→ result trả về thread/object/UI
```

---

## 3. Write endpoints V1

## POST `/api/backoffice/workflows/dispatch`
### Purpose
Dispatch generic back office workflow qua registry.

### Input
- `workflow_key`
- `objective`
- `context`
- `payload`
- `reviewers?`

### Output
- `invocation_id`
- `workflow_key`
- `dispatch_status`
- `dispatched_to`

---

## POST `/api/backoffice/workflows/callback`
### Purpose
Nhận callback từ n8n/workflow layer.

### Input
- callback payload theo contract back office

### Output
- `ok: true`
- normalized metadata summary

---

## POST `/api/backoffice/folders/resolve`
### Purpose
Resolve folder path theo standard back office.

### Input
- `generation_mode`
- `document_type`
- `year?`
- `project_slug?`
- `client_slug?`

### Output
- `folder_path`
- `folder_name`
- `naming_standard_version`

---

## POST `/api/backoffice/docs/from-template`
### Purpose
Kick off template-based docs workflow.

### Input
- `template_key`
- `title`
- `data`
- `context`
- `reviewers?`

### Output
- dispatch result

---

## 4. Read endpoints V1

## GET `/api/backoffice/files`
### Purpose
List file metadata records.

### Filters gợi ý
- `generation_mode`
- `status`
- `document_type`
- `project_id`
- `task_id`
- `thread_id`

---

## GET `/api/backoffice/files/:id`
### Purpose
Lấy chi tiết một file metadata record.

---

## GET `/api/backoffice/workflows`
### Purpose
List workflow definitions thuộc back office.

---

## GET `/api/backoffice/workflows/:key`
### Purpose
Lấy chi tiết 1 workflow definition.

---

## 5. V1 non-goals

- full file manager UI APIs quá chi tiết
- revision history sâu
- review approval engine hoàn chỉnh
- e-signature endpoints

---

## 6. One-line conclusion

**BACKOFFICE_API_SURFACE_V1 chốt mặt cắt API tối thiểu để nhánh back office có thể nhận request, dispatch workflow, nhận callback, lưu metadata và expose read models cơ bản mà không bị route ad-hoc.**
