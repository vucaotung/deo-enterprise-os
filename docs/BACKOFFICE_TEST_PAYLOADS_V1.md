# BACKOFFICE TEST PAYLOADS V1

**Ngày:** 2026-04-05

## 1. Test resolve folder

### Request
```json
{
  "generation_mode": "template_based",
  "document_type": "hop dong",
  "year": 2026,
  "project_slug": "du an crm noi bo",
  "client_slug": "cong ty abc"
}
```

---

## 2. Test dispatch docs.from-template

### Endpoint
`POST /api/backoffice/docs/from-template`

### Request body
```json
{
  "objective": "generate hop dong from template",
  "template_key": "hop_dong_dich_vu_v1",
  "title": "2026.04.05_hop dong_cong ty abc_ban nhap_v1",
  "document_type": "hop dong",
  "year": 2026,
  "project_slug": "du an crm noi bo",
  "client_slug": "cong ty abc",
  "data": {
    "ten_ben_a": "Cong ty ABC",
    "ten_ben_b": "Cong ty XYZ",
    "gia_tri": "50000000"
  },
  "context": {
    "type": "project",
    "project_id": "proj_001",
    "thread_id": "th_001",
    "message_id": "msg_001",
    "client_id": "client_001"
  },
  "reviewers": ["abc@example.com"]
}
```

---

## 3. Test callback success

### Endpoint
`POST /api/backoffice/workflows/callback`

### Headers
```text
X-Backoffice-Callback-Token: <BACKOFFICE_CALLBACK_TOKEN>
```

### Body
```json
{
  "invocation_id": "11111111-2222-3333-4444-555555555555",
  "workflow_key": "docs.from-template.v1",
  "status": "completed",
  "generated_title": "2026.04.05_hop dong_cong ty abc_ban nhap_v1",
  "file_id": "1AbCdEfGhIjKlMn",
  "file_type": "gdoc",
  "file_url": "https://docs.google.com/document/d/1AbCdEfGhIjKlMn/edit",
  "folder_id": "folder_123",
  "folder_path": "Deo Workspace/02_ho so theo mau/2026/hop dong/du an du an crm noi bo/khach hang cong ty abc",
  "generation_mode": "template_based",
  "document_type": "hop dong",
  "version": "v1",
  "source_thread_id": "th_001",
  "source_message_id": "msg_001",
  "linked_project_id": "00000000-0000-0000-0000-000000000001",
  "linked_task_id": null,
  "linked_client_id": "00000000-0000-0000-0000-000000000002",
  "reviewer_emails": ["abc@example.com"],
  "permission_mode": "commenter",
  "output_summary": "Google Doc da duoc tao va share cho reviewer.",
  "completed_at": "2026-04-05T05:30:00.000Z"
}
```

---

## 4. Test callback failed

### Body
```json
{
  "invocation_id": "11111111-2222-3333-4444-555555555555",
  "workflow_key": "docs.from-template.v1",
  "status": "failed",
  "generation_mode": "template_based",
  "document_type": "hop dong",
  "error_message": "Google Drive permission denied for target folder.",
  "completed_at": "2026-04-05T05:31:00.000Z"
}
```
