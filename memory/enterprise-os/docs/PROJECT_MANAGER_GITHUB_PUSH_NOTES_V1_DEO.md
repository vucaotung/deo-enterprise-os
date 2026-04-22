# PROJECT_MANAGER_GITHUB_PUSH_NOTES_V1_DEO.md

Cập nhật: 2026-04-08
Trạng thái: draft-v1
Mục đích: ghi chú chuẩn bị đưa bộ docs Project Manager lên GitHub repo Deo OS.

---

## 1. File nên push

### Entry points
- `PROJECT_MANAGER_README_V1_DEO.md`
- `PROJECT_MANAGER_MASTER_PLAN_V1_DEO.md`

### Supporting docs
- `PROJECT_MANAGER_MODULE_SPEC_V1_DEO.md`
- `PROJECT_MANAGER_SCHEMA_REVIEW_V1_DEO.md`
- `PROJECT_MANAGER_SCHEMA_PATCHES_V1_DEO.md`
- `PROJECT_MANAGER_WIREFRAMES_V1_DEO.md`
- `PROJECT_MANAGER_API_CONTRACTS_V1_DEO.md`
- `PROJECT_MANAGER_EXECUTION_PLAN_V1_DEO.md`

---

## 2. Commit strategy gợi ý

### Nếu muốn 1 commit gọn
**Commit message:**
```text
docs(project-manager): add PM/ERP core planning pack for Deo Enterprise OS
```

### Nếu muốn 2 commit sạch hơn
#### Commit 1
```text
docs(project-manager): add module spec, schema review, and wireframes
```

#### Commit 2
```text
docs(project-manager): add API contracts, execution plan, and master plan
```

---

## 3. Pull request title gợi ý
```text
Add Project Manager / ERP core planning docs for Dẹo Enterprise OS
```

## 4. Pull request description gợi ý
```markdown
## Summary
Add the initial planning pack for the Project Manager / ERP core module of Dẹo Enterprise OS.

## Includes
- module scope and product direction
- schema review and schema patch recommendations
- text-based wireframes
- MVP API contracts
- execution plan
- canonical master plan

## Goal
Prepare a clean design foundation before implementing the PM web app and backend APIs.
```

---

## 5. Khuyến nghị repo hygiene

Trước khi push, nên:
- chỉ add các file docs PM liên quan
- không đẩy lẫn file tạm / memory / local workspace noise
- không commit token/config/secret

### Gợi ý add có chọn lọc
```powershell
git add enterprise-os/docs/PROJECT_MANAGER_*.md
```

---

## 6. Khuyến nghị bước tiếp sau khi push

1. tạo issue / milestone cho PM module
2. bắt đầu migration patches
3. build app shell + dashboard + project/task APIs trước
4. sau đó mới approvals + AI jobs

---

## 7. Chốt một câu

Bộ docs này đủ sạch để đưa lên GitHub như một **planning pack chính thức** cho PM/ERP core của Dẹo Enterprise OS.
