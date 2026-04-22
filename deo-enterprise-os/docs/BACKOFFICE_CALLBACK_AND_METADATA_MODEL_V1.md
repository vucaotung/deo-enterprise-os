# BACKOFFICE CALLBACK AND METADATA MODEL V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt model callback và metadata cho nhánh `agent back office`, để mọi workflow tạo docs/sheets/folder/share trên Google Workspace đều callback về Work OS theo contract rõ ràng và được link lại đúng vào thread / project / task / hồ sơ.

---

## 1. Tư duy lõi

Tạo được file chưa đủ.  
Điều quan trọng là sau khi workflow chạy xong, hệ phải biết:
- file nào đã được tạo
- do invocation nào tạo
- sinh từ thread/context nào
- nằm ở folder nào
- đang ở trạng thái gì
- ai review
- link vào object nào trong Work OS

### Một câu chốt
> **File trên Google Drive là vật liệu làm việc; metadata trong Work OS mới là lớp điều phối và truy vết.**

---

## 2. Callback cần giải quyết việc gì

Callback từ workflow back office phải đủ để:
- update invocation status
- update workflow dispatch/callback trace
- tạo hoặc cập nhật file metadata record
- link file vào thread/project/task/hồ sơ liên quan
- append kết quả về chat nếu request đến từ thread
- phát hiện fail stage rõ ràng

---

## 3. Khi nào cần callback

## Bắt buộc callback với
- `docs.from-template.v1`
- `sheets.from-template.v1`
- `docs.materialize.v1`
- `sheets.materialize.v1`
- `drive.ensure-folder-tree.v1`
- `drive.archive-file.v1`

## Có thể direct output không cần callback dài với
- `drive.resolve-folder.v1`
- `docs.draft-from-context.v1`
- `sheets.schema-from-context.v1`

### Nhưng
Ngay cả direct result cũng vẫn nên có metadata record nếu kết quả sẽ dùng tiếp trong flow.

---

## 4. Callback payload tối thiểu

```ts
interface BackofficeWorkflowCallbackPayload {
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

  result_refs?: Array<{
    entity_type: string;
    entity_id: string;
  }>;

  reviewer_emails?: string[];
  permission_mode?: 'viewer' | 'commenter' | 'editor';

  output_summary?: string;
  output_payload?: any;
  error_message?: string;
  completed_at: string;
}
```

---

## 5. Metadata record cho file

Mỗi file quan trọng sinh ra từ back office nên có metadata record trong Work OS.

```ts
interface BackofficeFileRecord {
  id: string;
  invocation_id?: string;
  workflow_key?: string;

  google_file_id: string;
  google_file_type: 'gdoc' | 'gsheet' | 'gfolder' | 'other';
  title: string;
  url: string;

  document_type?: string;
  generation_mode: 'template_based' | 'draft_from_context' | 'drive_operation';
  status: 'draft' | 'review' | 'final' | 'signed' | 'archived';
  version?: string;

  folder_id?: string;
  folder_path?: string;

  source_thread_id?: string;
  source_message_id?: string;
  linked_project_id?: string;
  linked_task_id?: string;
  linked_client_id?: string;
  linked_case_id?: string;

  owner_user_id?: string;
  reviewer_emails?: string[];

  created_at: string;
  updated_at: string;
}
```

---

## 6. Linking model

Một file back office có thể cần link về nhiều chỗ.

### Tối thiểu nên link được với
- `thread`
- `project`
- `task`
- `client`
- `ho_so/case`

### Ví dụ
- tài liệu sinh ra từ nhóm chat → link `thread_id`
- tài liệu liên quan dự án → link `project_id`
- tài liệu là output của task → link `task_id`
- báo giá cho khách → link `client_id`

---

## 7. Review state model

Để user review thật sự usable, metadata nên có state tối thiểu:
- `draft`
- `review`
- `final`
- `signed`
- `archived`

### Gợi ý transition
#### Template-based
`draft` → `review` → `final` → `signed/archived`

#### Context-based
`draft` → `review` → `final` → `archived`

---

## 8. Result application rules

Sau callback, Work OS nên làm các bước:

### Step 1
Update `agent_invocation` / `workflow_dispatch` / `workflow_callback`

### Step 2
Upsert `backoffice_file_record`

### Step 3
Create/update entity links

### Step 4
Nếu request từ chat/thread thì append message dạng:
- đã tạo Google Doc
- đã tạo Google Sheet
- đã share cho reviewer
- đã archive file

### Step 5
Nếu fail thì gắn error stage rõ vào trace model

---

## 9. Minimal database shape gợi ý

Có thể dùng bảng kiểu:
- `backoffice_files`
- `backoffice_file_links`
- hoặc gộp một phần vào bảng metadata có sẵn nếu repo sau này muốn unify file records

### Gợi ý bảng file
```sql
CREATE TABLE backoffice_files (
  id UUID PRIMARY KEY,
  invocation_id UUID,
  workflow_key TEXT,
  google_file_id TEXT NOT NULL,
  google_file_type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  document_type TEXT,
  generation_mode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  version TEXT,
  folder_id TEXT,
  folder_path TEXT,
  source_thread_id TEXT,
  source_message_id TEXT,
  linked_project_id UUID,
  linked_task_id UUID,
  linked_client_id UUID,
  linked_case_id UUID,
  owner_user_id UUID,
  reviewer_emails JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 10. Metadata bắt buộc vs nên có

## Bắt buộc
- `google_file_id`
- `title`
- `url`
- `generation_mode`
- `status`
- `created_at`

## Nên có mạnh
- `document_type`
- `folder_id`
- `folder_path`
- `source_thread_id`
- `linked_project_id`
- `linked_task_id`
- `reviewer_emails`
- `version`

---

## 11. Failure model

Nếu workflow fail:
- callback vẫn nên trả `invocation_id`, `workflow_key`, `status=failed`, `error_message`
- Work OS update trace
- không tạo file record giả nếu file chưa tồn tại
- nếu file đã được tạo dang dở, có thể tạo record với `status=draft` hoặc `status=failed_partial` trong metadata phụ nếu cần

---

## 12. Build order đề xuất

1. callback payload contract
2. `backoffice_files` metadata model
3. result application rules
4. thread/project/task linking
5. review state transitions
6. UI/read model cho file lists về sau

---

## 13. One-line conclusion

**BACKOFFICE_CALLBACK_AND_METADATA_MODEL_V1 chốt lớp truy vết và liên kết cho nhánh tài liệu/back office: workflow phải callback đủ thông tin để Work OS không chỉ biết “đã tạo file”, mà còn biết file đó thuộc context nào, trạng thái gì, ai review và phải hiển thị/kết nối nó vào đâu trong hệ.**
