# BACKOFFICE DB SCHEMA V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Chốt shape dữ liệu V1 cho nhánh back office, đủ để support workflow registry seed, callback handling và file metadata tracking.

---

## 1. Bảng chính cần có

## A. `workflow_definitions`
Danh mục workflow chính thức cho automation layer.

### Field chính
- `id`
- `workflow_key`
- `name`
- `description`
- `purpose`
- `domain_type`
- `trigger_mode`
- `execution_style`
- `suitable_for_agents`
- `allowed_context_types`
- `allowed_actions`
- `input_schema_key`
- `output_schema_key`
- `callback_schema_key`
- `n8n_workflow_id`
- `n8n_entrypoint_url`
- `lifecycle_status`
- `rollout_stage`
- `is_enabled`
- timestamps

---

## B. `backoffice_files`
Metadata file/folder do back office workflows tạo ra hoặc quản lý.

### Field chính
- `id`
- `invocation_id`
- `workflow_key`
- `google_file_id`
- `google_file_type`
- `title`
- `url`
- `document_type`
- `generation_mode`
- `status`
- `version`
- `folder_id`
- `folder_path`
- `source_thread_id`
- `source_message_id`
- `linked_project_id`
- `linked_task_id`
- `linked_client_id`
- `linked_case_id`
- `owner_user_id`
- `reviewer_emails`
- timestamps

---

## 2. Logical relationships

```text
workflow_definitions
    ↓
workflow dispatch / invocation
    ↓
backoffice_files
    ↘
     thread / project / task / client / case links
```

---

## 3. Index priorities

### `workflow_definitions`
- unique index on `workflow_key`
- index on `domain_type`
- index on `lifecycle_status`

### `backoffice_files`
- unique index on `google_file_id`
- index on `workflow_key`
- index on `generation_mode`
- index on `status`
- index on `linked_project_id`
- index on `linked_task_id`
- index on `source_thread_id`

---

## 4. V1 design choice

V1 ưu tiên **giản dị nhưng usable**:
- link trực tiếp qua FK columns trong `backoffice_files`
- chưa cần generic file-entity links table quá sớm
- sau này nếu nhiều-to-nhiều tăng mạnh thì tách bảng phụ

---

## 5. One-line conclusion

**BACKOFFICE_DB_SCHEMA_V1 chốt 2 nền chính cho nhánh back office: `workflow_definitions` để quản execution recipes và `backoffice_files` để giữ metadata/truy vết file Google Workspace sinh ra từ workflows.**
