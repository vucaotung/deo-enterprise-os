# BACKOFFICE CURL TESTS V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Cung cấp bộ lệnh test nhanh bằng `curl` để bắn thử API back office và callback flow sau khi import/cấu hình workflow n8n.

---

## 1. Biến nên set trước

```bash
export API_BASE="https://YOUR_API_BASE_URL"
export API_TOKEN="YOUR_JWT_TOKEN"
export CALLBACK_TOKEN="YOUR_BACKOFFICE_CALLBACK_TOKEN"
```

Trên PowerShell có thể set kiểu:

```powershell
$env:API_BASE="https://YOUR_API_BASE_URL"
$env:API_TOKEN="YOUR_JWT_TOKEN"
$env:CALLBACK_TOKEN="YOUR_BACKOFFICE_CALLBACK_TOKEN"
```

---

## 2. Test resolve folder

### curl
```bash
curl -X POST "$API_BASE/api/backoffice/folders/resolve" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generation_mode": "template_based",
    "document_type": "hop dong",
    "year": 2026,
    "project_slug": "du an crm noi bo",
    "client_slug": "cong ty abc"
  }'
```

### Kỳ vọng
- trả `folder_path`
- trả `folder_name`
- trả `naming_standard_version`

---

## 3. Test list workflows back office

```bash
curl "$API_BASE/api/backoffice/workflows" \
  -H "Authorization: Bearer $API_TOKEN"
```

### Kỳ vọng
- thấy `docs.from-template.v1`
- thấy `drive.resolve-folder.v1`

---

## 4. Test dispatch `docs.from-template.v1`

```bash
curl -X POST "$API_BASE/api/backoffice/docs/from-template" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
      "project_id": "00000000-0000-0000-0000-000000000001",
      "thread_id": "th_001",
      "message_id": "msg_001",
      "client_id": "00000000-0000-0000-0000-000000000002"
    },
    "reviewers": ["abc@example.com"]
  }'
```

### Kỳ vọng
- trả `invocation_id`
- trả `workflow_key = docs.from-template.v1`
- trả `dispatch_status = queued|dispatched`
- trả `resolved_folder`

---

## 5. Test callback success thủ công

Dùng để test backend callback path ngay cả khi n8n chưa chạy full.

```bash
curl -X POST "$API_BASE/api/backoffice/workflows/callback" \
  -H "Content-Type: application/json" \
  -H "X-Backoffice-Callback-Token: $CALLBACK_TOKEN" \
  -d '{
    "invocation_id": "11111111-2222-3333-4444-555555555555",
    "workflow_key": "docs.from-template.v1",
    "status": "completed",
    "generated_title": "2026.04.05_hop dong_cong ty abc_ban nhap_v1",
    "file_id": "1AbCdEfGhIjKlMn",
    "file_type": "gdoc",
    "file_url": "https://docs.google.com/document/d/1AbCdEfGhIjKlMn/edit",
    "folder_id": "folder_123",
    "folder_path": "Deo Workspace/02_ho so theo mau/2026/hop dong",
    "generation_mode": "template_based",
    "document_type": "hop dong",
    "version": "v1",
    "source_thread_id": "th_001",
    "source_message_id": "msg_001",
    "linked_project_id": "00000000-0000-0000-0000-000000000001",
    "linked_client_id": "00000000-0000-0000-0000-000000000002",
    "reviewer_emails": ["abc@example.com"],
    "permission_mode": "commenter",
    "output_summary": "Google Doc da duoc tao va share cho reviewer.",
    "completed_at": "2026-04-05T05:30:00.000Z"
  }'
```

### Kỳ vọng
- trả `ok: true`
- có `file` object trong response
- record xuất hiện trong `deo.backoffice_files`

---

## 6. Test callback fail thủ công

```bash
curl -X POST "$API_BASE/api/backoffice/workflows/callback" \
  -H "Content-Type: application/json" \
  -H "X-Backoffice-Callback-Token: $CALLBACK_TOKEN" \
  -d '{
    "invocation_id": "11111111-2222-3333-4444-555555555555",
    "workflow_key": "docs.from-template.v1",
    "status": "failed",
    "generation_mode": "template_based",
    "document_type": "hop dong",
    "error_message": "Google Drive permission denied for target folder.",
    "completed_at": "2026-04-05T05:31:00.000Z"
  }'
```

### Kỳ vọng
- backend không crash
- trả response lỗi chuẩn hoặc `ok` theo callback handling hiện tại
- không tạo file record giả nếu không có `file_id`

---

## 7. Test list backoffice files

```bash
curl "$API_BASE/api/backoffice/files" \
  -H "Authorization: Bearer $API_TOKEN"
```

### Kỳ vọng
- thấy record vừa callback success tạo ra

---

## 8. One-line conclusion

**Bộ curl này cho phép test lần lượt: resolve folder → dispatch docs.from-template → callback success/fail → read metadata, để validate gần như toàn bộ loop back office trước cả khi workflow n8n live hoàn thiện 100%.**
