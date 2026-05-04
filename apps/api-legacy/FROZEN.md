# apps/api-legacy

⚠️ **FROZEN — DO NOT MODIFY**

Codebase v1.2.0-dev cũ. Đóng băng theo ADR-13.

- **Tag git:** `v1.2.0-dev-frozen` (commit `b67d6b2`)
- **Lý do giữ:** Reference khi port logic sang `apps/api` mới (Phase 0 v2 rebuild)
- **Production v0.2.3** vẫn deploy từ branch `main` cho đến khi monorepo mới đạt Phase 0 Exit Criteria → cutover

Nguyên tắc:
- ❌ Không thêm feature mới
- ❌ Không refactor
- ✅ Hotfix khẩn cấp được phép (commit message bắt đầu `hotfix(api-legacy):`)
- ✅ Đọc làm reference khi viết route mới ở `apps/api`

Xem [`apps/api-legacy/README.md`](./README.md) phía dưới cho doc gốc.

---
