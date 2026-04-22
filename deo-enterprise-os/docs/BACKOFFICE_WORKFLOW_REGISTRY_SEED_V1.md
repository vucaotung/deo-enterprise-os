# BACKOFFICE WORKFLOW REGISTRY SEED V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Seed bộ workflow registry V1 cho nhánh `agent back office` theo hướng **workflow-first, Google-native**, để các tác vụ tạo tài liệu/hồ sơ/bảng tính không bị gọi ad-hoc mà đi qua các workflow key, contract và callback rõ ràng.

---

## 1. Phạm vi

Registry seed này tập trung cho các tác vụ back office liên quan đến:
- Google Docs
- Google Sheets
- Google Drive
- document generation
- sheet generation
- folder resolution / organization
- review / sharing / archiving

### Không bao gồm ở V1
- e-signature flow hoàn chỉnh
- OCR pipeline sâu
- email send flow đầy đủ
- multi-provider document engines

---

## 2. Nguyên tắc seed workflow

1. Mỗi workflow phải có `workflow_key` versioned rõ ràng.
2. Mỗi workflow phải map được tới use case business cụ thể.
3. Không gom quá nhiều trách nhiệm vào một workflow duy nhất.
4. Các workflow back office phải tương thích với:
   - thread-based requests
   - project-based requests
   - client/hoso-based requests
5. Callback phải trả về metadata đủ để link lại vào Work OS.

---

## 3. Workflow groups

## Nhóm A — Drive organization
- `drive.resolve-folder.v1`
- `drive.ensure-folder-tree.v1`
- `drive.archive-file.v1`
- `drive.share-for-review.v1`

## Nhóm B — Template-based generation
- `docs.from-template.v1`
- `sheets.from-template.v1`

## Nhóm C — Context-based generation
- `docs.draft-from-context.v1`
- `docs.materialize.v1`
- `sheets.schema-from-context.v1`
- `sheets.materialize.v1`

---

## 4. Seed entries

## A. `drive.resolve-folder.v1`
### Purpose
Tìm folder đích đúng theo context hiện tại.

### Trigger mode
`sync`

### Execution style
`direct`

### Suitable agents
- `backoffice_agent`
- `project_coordinator`
- `writer_agent`

### Allowed context types
- `thread`
- `project`
- `task`
- `client`
- `general`

### Input
- folder domain (`templates`, `ho_so_theo_mau`, `ho_so_theo_yeu_cau`, `du_an`, `khach_hang`, ...)
- linked project/client if any
- document type
- year

### Output
- resolved folder id
- resolved folder path
- naming rule used

---

## B. `drive.ensure-folder-tree.v1`
### Purpose
Tạo đủ cây thư mục nếu chưa tồn tại.

### Trigger mode
`async`

### Execution style
`callback`

### Suitable agents
- `backoffice_agent`
- `project_coordinator`

### Allowed context types
- `project`
- `client`
- `general`

### Input
- target folder tree spec
- parent folder id
- naming standard version

### Output
- created folder ids
- final folder path

---

## C. `drive.archive-file.v1`
### Purpose
Chuyển file sang khu vực lưu trữ / archive theo policy.

### Trigger mode
`async`

### Execution style
`callback`

### Suitable agents
- `backoffice_agent`
- `agent_health_watcher`

### Allowed context types
- `project`
- `client`
- `general`

### Input
- file id
- archive reason
- archive target

### Output
- archived folder id
- new file path
- archive timestamp

---

## D. `drive.share-for-review.v1`
### Purpose
Set permission review/edit/comment cho reviewer và trả link.

### Trigger mode
`sync` hoặc `async`

### Execution style
`direct` hoặc `callback`

### Suitable agents
- `backoffice_agent`
- `writer_agent`
- `project_coordinator`

### Allowed context types
- `thread`
- `project`
- `task`
- `client`
- `general`

### Input
- file id
- reviewers
- permission mode (`viewer`, `commenter`, `editor`)

### Output
- file url
- permission summary
- reviewer list

---

## E. `docs.from-template.v1`
### Purpose
Copy Google Doc template và fill data vào placeholders.

### Trigger mode
`async`

### Execution style
`callback`

### Suitable agents
- `backoffice_agent`
- `writer_agent`
- `project_coordinator`

### Allowed context types
- `thread`
- `project`
- `task`
- `client`
- `general`

### Input
- template key / template id
- title
- data payload
- target folder spec
- status/version seed

### Output
- file id
- Google Doc URL
- folder id
- generated title

---

## F. `sheets.from-template.v1`
### Purpose
Copy Google Sheet template và fill cells/ranges.

### Trigger mode
`async`

### Execution style
`callback`

### Suitable agents
- `backoffice_agent`
- `finance_agent`
- `project_coordinator`

### Allowed context types
- `thread`
- `project`
- `task`
- `client`
- `finance`
- `general`

### Input
- template key / template id
- title
- cell mapping or ranges
- target folder spec

### Output
- file id
- Google Sheet URL
- sheet names created

---

## G. `docs.draft-from-context.v1`
### Purpose
Sinh draft nội dung tài liệu từ thread/project/context mà chưa nhất thiết tạo file final ngay.

### Trigger mode
`sync` hoặc `async`

### Execution style
`direct`

### Suitable agents
- `backoffice_agent`
- `writer_agent`
- `knowledge_agent`

### Allowed context types
- `thread`
- `project`
- `task`
- `general`

### Input
- source context snapshot
- document type
- tone/style
- audience
- optional title

### Output
- suggested title
- outline
- draft text
- open questions
- recommendation: materialize now or review first

---

## H. `docs.materialize.v1`
### Purpose
Tạo Google Doc mới từ final draft content đã được chốt.

### Trigger mode
`async`

### Execution style
`callback`

### Suitable agents
- `backoffice_agent`
- `writer_agent`
- `project_coordinator`

### Allowed context types
- `thread`
- `project`
- `task`
- `client`
- `general`

### Input
- title
- final content
- target folder spec
- status/version
- reviewers optional

### Output
- file id
- Google Doc URL
- folder id
- share status

---

## I. `sheets.schema-from-context.v1`
### Purpose
Sinh schema đề xuất cho Google Sheet mới từ context thực tế.

### Trigger mode
`direct`

### Execution style
`direct`

### Suitable agents
- `backoffice_agent`
- `finance_agent`
- `project_coordinator`

### Allowed context types
- `thread`
- `project`
- `task`
- `finance`
- `general`

### Input
- source context snapshot
- sheet purpose
- desired columns optional

### Output
- suggested tabs
- headers
- basic formulas
- review notes

---

## J. `sheets.materialize.v1`
### Purpose
Tạo Google Sheet mới từ schema đã chốt.

### Trigger mode
`async`

### Execution style
`callback`

### Suitable agents
- `backoffice_agent`
- `finance_agent`
- `project_coordinator`

### Allowed context types
- `thread`
- `project`
- `task`
- `finance`
- `general`

### Input
- title
- schema
- initial rows optional
- target folder spec
- reviewers optional

### Output
- file id
- Google Sheet URL
- tabs created
- folder id

---

## 5. Suggested schema keys

### Docs / template
- `schema.docs-from-template.input.v1`
- `schema.docs-from-template.callback.v1`

### Sheets / template
- `schema.sheets-from-template.input.v1`
- `schema.sheets-from-template.callback.v1`

### Docs / context
- `schema.docs-draft-from-context.input.v1`
- `schema.docs-materialize.input.v1`
- `schema.docs-materialize.callback.v1`

### Sheets / context
- `schema.sheets-schema-from-context.input.v1`
- `schema.sheets-materialize.input.v1`
- `schema.sheets-materialize.callback.v1`

### Drive ops
- `schema.drive-resolve-folder.input.v1`
- `schema.drive-resolve-folder.output.v1`
- `schema.drive-share-for-review.input.v1`
- `schema.drive-share-for-review.output.v1`

---

## 6. Mapping workflow ↔ generation mode

### `template_based`
- `drive.resolve-folder.v1`
- `docs.from-template.v1` hoặc `sheets.from-template.v1`
- `drive.share-for-review.v1`

### `draft_from_context`
- `docs.draft-from-context.v1` hoặc `sheets.schema-from-context.v1`
- review checkpoint
- `drive.resolve-folder.v1`
- `docs.materialize.v1` hoặc `sheets.materialize.v1`
- `drive.share-for-review.v1`

---

## 7. Callback requirements tối thiểu

Mọi callback từ workflow back office nên trả ít nhất:
- `invocation_id`
- `workflow_key`
- `status`
- `file_id` nếu có
- `url` nếu có
- `folder_id` nếu có
- `generated_title`
- `result_refs`
- `error_message` nếu fail

---

## 8. Build order đề xuất

1. `drive.resolve-folder.v1`
2. `docs.from-template.v1`
3. `drive.share-for-review.v1`
4. `docs.draft-from-context.v1`
5. `docs.materialize.v1`
6. `sheets.schema-from-context.v1`
7. `sheets.materialize.v1`
8. `drive.ensure-folder-tree.v1`
9. `drive.archive-file.v1`
10. `sheets.from-template.v1`

### Lý do
- docs thường là nhu cầu cấp bách hơn sheet
- folder resolution là nền
- review sharing là bắt buộc để usable thật

---

## 9. One-line conclusion

**BACKOFFICE_WORKFLOW_REGISTRY_SEED_V1 là danh mục seed chính thức cho nhánh agent back office: mọi tác vụ tạo docs/sheets/folder/share phải đi qua workflow keys rõ ràng, có input/output/callback contract tối thiểu, để sau này build, trace và vận hành không bị ad-hoc.**
