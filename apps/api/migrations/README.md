# apps/api/migrations

Phase 0 v2 SQL migrations cho schema `deo` (ADR-03).

## Convention

- File name: `NNN_description.sql` (3-digit zero-padded, monotonic)
- Mỗi migration idempotent: dùng `CREATE … IF NOT EXISTS`, `ALTER … IF EXISTS`, etc.
- Migration runner: TBD (Sprint D-3 — sẽ chọn `node-pg-migrate` hoặc bare loader script)

## Migration list

| # | File | Mục đích |
|---|---|---|
| 001 | `001_agent_conversations.sql` | GoClaw `after_chat` hook log table (Sprint C) |

## Legacy migrations

Schema cũ ở `infrastructure/postgres/001_init.sql` → `007_brain_gdrive.sql`. Đông cứng theo ADR-13. KHÔNG chạy lại trên DB rebuild — `apps/api-legacy` dùng riêng.
