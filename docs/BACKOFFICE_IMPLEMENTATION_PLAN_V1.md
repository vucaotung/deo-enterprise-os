# BACKOFFICE IMPLEMENTATION PLAN V1

**Ngày:** 2026-04-05  
**Mục tiêu:** Chuyển cụm docs back office từ mức architecture/spec sang implementation plan thực dụng để có thể build theo phase, ít debt và bám sát hướng workflow-first, Google-native.

---

## 1. Scope V1

Back office V1 nên đủ để làm được 2 loại flow chính:
1. tạo tài liệu theo mẫu/template
2. tạo tài liệu/sheet theo yêu cầu mới từ chat/context

### Đồng thời phải có tối thiểu
- workflow registry seed
- folder resolution
- file naming standard
- callback + metadata record
- linking về thread/project/task

### Chưa cần ở V1
- e-signature hoàn chỉnh
- document diff/revision sâu
- approval engine quá phức tạp
- search semantic xuyên toàn bộ file store

---

## 2. Sơ đồ module / implementation path

```text
apps/api/src/
  constants/backoffice.ts
  routes/backoffice.ts
  services/backoffice-registry.service.ts
  services/backoffice-files.service.ts
  services/backoffice-folder.service.ts
  services/backoffice-dispatch.service.ts
infrastructure/postgres/
  006_backoffice_foundation.sql
```

---

## 3. Deliverables chính

### Architecture / definition
- workflow registry cho back office
- folder & naming standard
- callback & metadata model

### Data layer
- `workflow_definitions` seeds cho back office
- `backoffice_files` metadata table
- links từ file → project/task/thread nếu cần bảng riêng

### Execution layer
- `drive.resolve-folder.v1`
- `docs.from-template.v1`
- `drive.share-for-review.v1`
- `docs.draft-from-context.v1`
- `docs.materialize.v1`

### Application layer
- callback endpoint
- result application rules
- append result vào thread
- link file record vào object layer

---

## 3. Phase breakdown

## Phase 0 — Foundations
### Mục tiêu
Khóa standard trước khi code.

### Nên có
- `BACKOFFICE_GOOGLE_WORKSPACE_GENERATION_V1.md`
- `BACKOFFICE_WORKFLOW_REGISTRY_SEED_V1.md`
- `GOOGLE_DRIVE_FOLDER_AND_NAMING_STANDARD_V1.md`
- `BACKOFFICE_CALLBACK_AND_METADATA_MODEL_V1.md`

### Deliverable
Source-of-truth đủ rõ để build.

---

## Phase 1 — Registry + metadata base
### Mục tiêu
Dựng nền dữ liệu tối thiểu.

### Nên làm
- seed `workflow_definitions`
- tạo `backoffice_files`
- chuẩn bị callback/result application service

### Deliverable
Hệ có thể nhận callback và lưu file metadata.

---

## Phase 2 — Drive foundation
### Mục tiêu
Giải quyết chỗ lưu file trước khi tạo file thật.

### Nên làm
- `drive.resolve-folder.v1`
- `drive.ensure-folder-tree.v1`
- áp naming standard vào folder paths

### Deliverable
Workflow biết phải đặt file vào đâu.

---

## Phase 3 — Template-based docs usable
### Mục tiêu
Cho flow hồ sơ theo mẫu chạy được end-to-end.

### Nên làm
- `docs.from-template.v1`
- `drive.share-for-review.v1`
- callback link về thread/project/task

### Deliverable
Có thể tạo Google Doc từ template và share review.

---

## Phase 4 — Context-based docs usable
### Mục tiêu
Cho flow văn bản mới từ chat/context chạy được.

### Nên làm
- `docs.draft-from-context.v1`
- review checkpoint trong chat/app
- `docs.materialize.v1`
- callback + metadata link back

### Deliverable
Có thể biến thảo luận thành draft rồi materialize thành Google Doc.

---

## Phase 5 — Sheets usable
### Mục tiêu
Cho flow bảng theo dõi / sheet mới chạy được.

### Nên làm
- `sheets.schema-from-context.v1`
- `sheets.materialize.v1`
- `sheets.from-template.v1`

### Deliverable
Tạo được cả sheet mới lẫn sheet theo mẫu.

---

## 4. Build order ưu tiên thực dụng

Nếu muốn làm nhanh mà vẫn đúng hướng, Dẹo đề xuất thứ tự:

1. `workflow_definitions` seed cho back office
2. callback contract + `backoffice_files`
3. `drive.resolve-folder.v1`
4. `docs.from-template.v1`
5. `drive.share-for-review.v1`
6. `docs.draft-from-context.v1`
7. `docs.materialize.v1`
8. `sheets.schema-from-context.v1`
9. `sheets.materialize.v1`
10. `sheets.from-template.v1`

---

## 5. API / integration surface gợi ý

### Internal APIs / services nên có
- `dispatchBackofficeWorkflow()`
- `handleBackofficeCallback()`
- `upsertBackofficeFileRecord()`
- `linkBackofficeFileToContext()`
- `appendBackofficeResultToThread()`

### Workflow entrypoints logical
- docs generation
- sheets generation
- drive operations

---

## 6. Minimal UI/read model về sau

Chưa cần build ngay, nhưng nên hình dung trước:
- file list theo project
- file list theo thread
- file list theo client/hồ sơ
- trạng thái review/final/archive
- quick open Google link

---

## 7. Risk notes

## Risk 1
Tạo file rác quá nhiều khi context chưa chốt.
### Giảm thiểu
review checkpoint trước khi materialize với context-based docs.

## Risk 2
Naming/folder drift.
### Giảm thiểu
mọi workflow đi qua `drive.resolve-folder.v1` + naming standard chung.

## Risk 3
Tạo được file nhưng không link lại vào hệ.
### Giảm thiểu
callback + metadata model bắt buộc từ đầu.

## Risk 4
Agent gọi workflow ad-hoc.
### Giảm thiểu
registry validation + dispatch service duy nhất.

---

## 8. Suggested first use cases để pilot

### Use case 1
Tạo hợp đồng/báo giá từ template rồi share review.

### Use case 2
Từ nhóm chat, tạo đề xuất / biên bản họp draft → materialize thành Google Doc.

### Use case 3
Từ nhóm chat, tạo sheet theo dõi công việc cơ bản cho một project/job.

---

## 9. One-line conclusion

**BACKOFFICE_IMPLEMENTATION_PLAN_V1 chốt cách build nhánh back office theo phase: dựng registry + metadata + folder foundation trước, rồi làm template-based docs, sau đó mở sang context-based docs và sheets — để có kết quả usable sớm mà không phá vỡ hướng workflow-first, Google-native đã chốt.**
