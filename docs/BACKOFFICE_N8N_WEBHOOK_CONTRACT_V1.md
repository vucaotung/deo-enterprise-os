# BACKOFFICE N8N WEBHOOK CONTRACT V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt contract V1 giữa Work OS back office layer và n8n execution layer, để các workflow như `drive.resolve-folder`, `docs.from-template`, `docs.materialize` có input/output/callback shape rõ ràng và không bị ad-hoc.

---

## 1. Phạm vi

Contract này áp dụng cho các workflow back office gọi từ Work OS sang n8n, đặc biệt:
- `drive.resolve-folder.v1`
- `drive.ensure-folder-tree.v1`
- `drive.share-for-review.v1`
- `docs.from-template.v1`
- `docs.materialize.v1`
- `sheets.materialize.v1`

---

## 2. Flow tổng quát

```text
Work OS /api/backoffice/*
→ dispatchBackofficeWorkflow()
→ n8n webhook entrypoint
→ n8n workflow execution
→ callback về /api/backoffice/workflows/callback
→ Work OS update metadata / trace / links
```

---

## 3. Dispatch request contract

```ts
interface BackofficeWorkflowDispatchRequest {
  invocation_id: string;
  workflow_key: string;
  objective: string;

  invoked_by: {
    type: 'human' | 'agent' | 'system';
    id?: string;
  };

  context: {
    type?: 'thread' | 'project' | 'task' | 'client' | 'general';
    thread_id?: string;
    message_id?: string;
    project_id?: string;
    task_id?: string;
    client_id?: string;
    conversation_id?: string;
  };

  payload: Record<string, any>;
  reviewers?: string[];

  callback: {
    url: string;
    token?: string;
  };
}
```

---

## 4. Dispatch headers

Khi Work OS gọi n8n webhook, nên gửi:

```text
Content-Type: application/json
Authorization: Bearer <BACKOFFICE_N8N_API_KEY>   # nếu có
X-Backoffice-Workflow-Key: <workflow_key>
X-Invocation-Id: <invocation_id>
```

---

## 5. Callback request contract

```ts
interface BackofficeWorkflowCallbackRequest {
  invocation_id: string;
  workflow_key: string;
  status: 'completed' | 'failed' | 'partial' | 'cancelled';

  generated_title?: string;
  file_id?: string;
  file_type?: 'gdoc' | 'gsheet' | 'gfolder' | 'other';
  file_url?: string;
  folder_id?: string;
  folder_path?: string;

  generation_mode?: 'template_based' | 'draft_from_context' | 'drive_operation';
  document_type?: string;
  version?: string;

  source_thread_id?: string;
  source_message_id?: string;
  linked_project_id?: string;
  linked_task_id?: string;
  linked_client_id?: string;
  owner_user_id?: string;

  reviewer_emails?: string[];
  permission_mode?: 'viewer' | 'commenter' | 'editor';

  output_summary?: string;
  output_payload?: Record<string, any>;
  result_refs?: Array<{ entity_type: string; entity_id: string }>;
  error_message?: string;
  completed_at: string;
}
```

---

## 6. Callback headers

n8n callback về Work OS nên gửi:

```text
Content-Type: application/json
X-Backoffice-Callback-Token: <BACKOFFICE_CALLBACK_TOKEN>
X-Invocation-Id: <invocation_id>
X-Backoffice-Workflow-Key: <workflow_key>
```

---

## 7. `docs.from-template.v1` payload chuẩn

```json
{
  "template_key": "hop_dong_dich_vu_v1",
  "template_id": "google-doc-template-id-optional",
  "title": "2026.04.05_hop dong_cong ty abc_ban nhap_v1",
  "data": {
    "ten_ben_a": "Cong ty ABC",
    "ten_ben_b": "Cong ty XYZ",
    "gia_tri": "50000000"
  },
  "target_folder": {
    "folder_path": "Deo Workspace/02_ho so theo mau/2026/hop dong",
    "folder_name": "hop dong",
    "naming_standard_version": "v1"
  },
  "status": "draft",
  "version": "v1"
}
```

---

## 8. `drive.resolve-folder.v1` output chuẩn

```json
{
  "folder_name": "hop dong",
  "folder_path": "Deo Workspace/02_ho so theo mau/2026/hop dong",
  "naming_standard_version": "v1"
}
```

---

## 9. Success callback ví dụ

```json
{
  "invocation_id": "b1a2c3d4-e5f6-7890-abcd-ef1234567890",
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
  "linked_project_id": "proj_001",
  "reviewer_emails": ["abc@example.com"],
  "permission_mode": "commenter",
  "output_summary": "Google Doc da duoc tao tu template va share cho reviewer.",
  "completed_at": "2026-04-05T05:30:00.000Z"
}
```

---

## 10. Failure callback ví dụ

```json
{
  "invocation_id": "b1a2c3d4-e5f6-7890-abcd-ef1234567890",
  "workflow_key": "docs.from-template.v1",
  "status": "failed",
  "generation_mode": "template_based",
  "document_type": "hop dong",
  "error_message": "Google Drive permission denied for target folder.",
  "completed_at": "2026-04-05T05:31:00.000Z"
}
```

---

## 11. Rule xử lý ở Work OS

Sau callback:
1. validate token/header
2. update trace/invocation state
3. nếu có file → upsert `backoffice_files`
4. link file vào thread/project/task/client
5. nếu là request từ thread → append result về chat/thread
6. nếu fail → trả error stage rõ ràng

---

## 12. One-line conclusion

**BACKOFFICE_N8N_WEBHOOK_CONTRACT_V1 chốt shape chính thức cho dispatch và callback giữa Work OS và n8n, để nhánh back office có thể nối execution thật mà không bị payload drift hay callback rời rạc.**
