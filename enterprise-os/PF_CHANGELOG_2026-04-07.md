# PF Changelog — 2026-04-07

## Scope
Personal Finance OS workbook build-out, formula stabilization, dashboards, quick-entry intake, weekly digest, and debt reminder scaffolding.

## Workbook live
- Title: `Personal Finance OS`
- Spreadsheet ID: `1tsSsM3n_oHOeoBMTjRZ4VlE7S2mwV4kK9OcFLccl3RA`
- Timezone: `Asia/Bangkok`
- Locale root-cause fixed: formulas must use `vi_VN` syntax (`;` separator)

## Completed work

### A1 — Timezone
- Updated live sheet timezone to `Asia/Bangkok`.

### A2 — Selective migration from legacy sheet
- Synced real accounts, categories, and active debt from legacy sheet `So chi tieu - Deo`.
- Explicitly did **not** force legacy receivable into debt schema; future `Receivables` module remains a v2 item.

### A3 — Data-path validation
- Inserted representative test transactions covering:
  - expense
  - income
  - debt payment
  - transfer
- Used test run to expose formula compatibility issues after Excel → Google Sheets conversion.

### A4 / A4.1 / A4.2 — Formula stabilization
- Identified true root cause: sheet locale is `vi_VN`, so US-style commas broke formulas.
- Rebuilt core formula layer to Google Sheets native style:
  - Transactions helper fields
  - account/debt rollups
  - dashboard overview
- Verified live values now compute correctly.

### A5 — Production cleanup
- Removed 5 validation/test transactions from `Transactions` after formula verification.
- Workbook returned to clean production state with formulas preserved.

### A6 — Manual entry UX
- Added `Quick Entry` sheet as lightweight intake layer.
- Included lookup columns, default scope/status, ready-check, and transaction id preview.

### A7 — Dashboard pass
- Rebuilt/verified:
  - Dashboard Overview
  - Dashboard Cashflow
  - Dashboard Accounts
  - Dashboard Debts
  - Dashboard Investments
- Dashboards now read from live workbook state, not dead scaffold values.

### A8 — Polish
- Fixed broken Vietnamese labels/notes in categories, settings, accounts, and investments.
- Corrected several starter rule mappings to align with actual category/account ids.

### A9 — Quick Entry append runner
- Added local script: `pf_quick_entry_append.py`
- Dry-run verified against live sheet.
- Purpose: move `Quick Entry` rows into `Transactions`, write `Import Logs`, and mark source rows as posted.

### A10 — Intake automation foundation
- Prepared operational path for recurring Quick Entry intake.
- Added cron job to check and commit ready rows every 15 minutes.

### A11 — Weekly digest migration
- Added local script: `pf_weekly_digest.py`
- Weekly digest now targets `Personal Finance OS` instead of legacy expense sheet.
- Added weekly cron for Monday 08:00 (Asia/Bangkok).

### A12 — Debt reminder foundation
- Added local script: `pf_debt_scan.py`
- Detects overdue / due-soon debts from `Debts` sheet.
- Added daily cron for 09:00 (Asia/Bangkok).

### A13 — Chat/text/bill intake to Quick Entry
- Added local script: `pf_intake_to_quick_entry.py`
- Supports three intake modes:
  - `--text`
  - `--text-file`
  - `--image` (OCR via Tesseract)
- Parses candidate fields:
  - date
  - amount
  - inferred type
  - category/account guess
  - vendor/description
- Applies starter rule matching from `Rules` and appends into `Quick Entry` when `--commit` is used.
- Safety choice: intake lands in `Quick Entry` first, not directly in `Transactions`, to reduce bad OCR auto-post risk.

## Cron jobs created
- `PF Quick Entry Intake`
- `PF Weekly Digest`
- `PF Debt Reminder Scan`

## Current V1 status
- Core workbook: usable
- Core formulas: usable
- Dashboards: usable
- Manual entry: usable
- Quick-entry append path: built
- Weekly digest: migrated to new workbook
- Debt reminder: scaffolded and scheduled
- Full chat/bill OCR intake: not complete yet
- Full independence from legacy sheet: close, but automation polish still remains

### A14.1 — Zalo personal assistant spec
- Added spec file: `enterprise-os/A14_1_ZALO_PERSONAL_ASSISTANT_SPEC.md`
- Locked role split:
  - Dẹo = CEO/orchestrator
  - Zalo bot = soft frontline personal assistant
- Locked tone/persona, intent map, safety rules, and v1 definition of done.

### A14.2 — Zalo webhook skeleton
- Replaced API scaffold with a real webhook skeleton in `enterprise-os/apps/api/src/server.js`
- Added endpoints:
  - `GET /health`
  - `GET /zalo/webhook`
  - `POST /zalo/webhook`
- Added generic webhook body parsing, high-level intent detection, and soft-reply draft generation.
- Added README for env/config: `enterprise-os/apps/api/src/README_ZALO_WEBHOOK.md`
- Current A14.2 behavior is safe-by-default:
  - receives webhook calls
  - routes intents
  - logs reply drafts
  - does **not** yet call final official send-message endpoint until endpoint mapping is confirmed
- Local test passed for endpoint liveliness and webhook routing. Note: local PowerShell UTF-8 behavior may distort Vietnamese diacritics during console tests, so production validation should be done with real UTF-8 webhook traffic.

### A14.3 — Zalo webhook to real executors
- Extended `enterprise-os/apps/api/src/server.js` so webhook intents now trigger real local actions instead of draft-only routing.
- Implemented executor behaviors:
  - `note_capture` -> saves note into local assistant note store
  - `reminder_create` -> saves reminder into local assistant reminder store
  - `expense_capture` -> calls `pf_intake_to_quick_entry.py --commit`
  - `finance_query` -> calls `pf_month_overview.py`, `pf_weekly_digest.py`, or `pf_debt_scan.py` depending on query
  - `agenda_query` -> summarizes pending local reminders
  - `booking_prep` -> returns safe prep stub for now
- Added helper script: `pf_month_overview.py`
- Local end-to-end tests passed for note capture, expense capture, and finance query through webhook route.
- During test, one sample expense row was written into `Quick Entry`; it was immediately cleared to keep production data clean.
- Send-back to real Zalo API is still intentionally deferred; A14.3 logs reply drafts while real execution now happens behind the webhook.

### A14.5 — Dedicated OpenClaw agent for Zalo assistant
- Created a new isolated OpenClaw agent:
  - `agent-tro-ly-zalo`
  - identity: `🌷 Mây`
  - workspace: `C:\openclaw\workspaces\agent-tro-ly-zalo`
- Added workspace memory/persona files:
  - `IDENTITY.md`
  - `SOUL.md`
  - `USER.md`
  - `AGENTS.md`
  - `MEMORY.md`
  - `HEARTBEAT.md`
  - `TOOLS.md`
  - `CRONS.md`
  - `SKILLS.md`
  - `memory/2026-04-07.md`
- Bound Zalo channel routing to this dedicated agent via `openclaw agents bind --agent agent-tro-ly-zalo --bind zalo`.
- Agent scope explicitly covers personal-assistant operations for Vincent using the `vucaotung@gmail.com` Google surface (Gmail, Calendar, Docs, Sheets, Drive, Maps context) plus Personal Finance OS workflows.
- Current cron behavior is documented in the workspace (`CRONS.md`). Existing service-level finance crons already exist; agent-specific cron execution policy can be tightened further in later steps if needed.

### A14.5r — Aurora registered in Enterprise OS control plane
- Re-read repo architecture and corrected course: canonical agent registration belongs in the Enterprise OS control plane, not only in OpenClaw runtime.
- Added repo documentation:
  - `docs/A14_5R_AURORA_AGENT_REGISTRATION.md`
- Added future-facing scaffold seed:
  - `infra/postgres/002_seed_aurora_agent.sql`
  - targets the newer `workers / ai_agents / agent_skills` schema from the scaffold
- Added current-live-db seed:
  - `infra/postgres/006_seed_aurora_live_registry.sql`
  - targets the running `deo` schema (`users`, `agent_assignments`, `agent_jobs` family)
- Applied the live seed successfully into local Postgres:
  - created/updated Vincent in `deo.users`
  - registered `agent-tro-ly-zalo` in `deo.agent_assignments`
- Verified live rows exist for:
  - `vucaotung@gmail.com` in `deo.users`
  - `agent-tro-ly-zalo` with scope `personal-assistant:zalo:vucaotung@gmail.com` in `deo.agent_assignments`
- Result: Aurora now exists both as an OpenClaw runtime agent **and** as a control-plane actor in the current Enterprise OS database model.

### A14.7 — Aurora connected to current control-plane job model
- Added `enterprise-os/apps/api/src/deo-db.js` as a minimal bridge from API/webhook layer into the live `deo.agent_jobs` queue.
- Added API routes:
  - `GET /api/aurora/jobs`
  - `POST /api/aurora/jobs`
- Extended Zalo/webhook intent handling so Aurora can now queue real control-plane jobs for capabilities such as:
  - Gmail assist
  - Calendar assist
  - Sheets assist
  - Drive assist
  - Docs assist
  - Maps assist
- These jobs are created with assignee `agent-tro-ly-zalo` in `deo.agent_jobs`.
- Verified end-to-end:
  - querying `/api/aurora/jobs` returned empty queue initially
  - webhook test with message `kiem tra gmail cua anh` created a real pending `gmail_assist` job for Aurora
  - querying `/api/aurora/jobs` afterwards showed the live queued job in Postgres
- Updated `README_ZALO_WEBHOOK.md` to reflect the new control-plane bridge behavior.

### A14.8b — Quick Entry append repair + ledger truthfulness
- Repaired the `Quick Entry -> Transactions` commit path after the append runner started requiring an explicit `tx_rownum` for formula-safe writes but still had an old call site using the previous function signature.
- Changed the writer to compute explicit target rows in `Transactions!A:Y` instead of relying on ambiguous append placement.
- Reinforced an important finance truthfulness rule: a `Quick Entry` row marked `posted` is not enough to claim success; live verification in `Transactions` is required before saying the transaction reached the main ledger.
- Repaired and verified live ledger rows:
  - `TXN-20260406-QE-031` — income 2,000,000,000 VND, `CAT-INC-003 / Nhận tiền ứng`, destination `MB BANK`, scope `business`
  - `TXN-20260406-QE-032` — expense 499,000,000 VND from `MB BANK`, project advance, scope `business`
- Verified Dashboard Overview after repair: income 2,000,000,000; expense 499,000,000; net cashflow 1,501,000,000.

### A14.8c — Project-expense categorization cleanup
- Added business expense category `CAT-EXP-007 / Chi dự án` to the live workbook.
- Added rule-based mapping for project-related text patterns:
  - `THEP`
  - `VAT TU`
  - `CONG TRINH`
  - `DU AN`
- Recategorized existing rows from fallback bucket `Khác` into `Chi dự án` where appropriate:
  - `TXN-20260406-QE-032`
  - `TXN-20260406-QE-033`
  - `TXN-20260406-QE-034`
- Synced corresponding `Quick Entry` rows so category metadata looked cleaner in both intake and ledger layers.

### A14.8d — Salary / advance semantics, metadata sync, acceptance pass
- Added new business expense categories:
  - `CAT-EXP-008 / Chi lương`
  - `CAT-EXP-009 / Tạm ứng`
- Added new rules:
  - `TRA LUONG` -> `CAT-EXP-008`
  - `LUONG CHO` -> `CAT-EXP-008`
  - `TAM UNG` -> `CAT-EXP-009`
  - `UNG TRUOC` -> `CAT-EXP-009`
- Recategorized live rows so recent transactions now classify more meaningfully:
  - `TXN-20260406-QE-032` -> `Tạm ứng`
  - `TXN-20260406-QE-033` -> `Chi dự án`
  - `TXN-20260406-QE-034` -> `Chi dự án`
  - `TXN-20260406-QE-035` -> `Chi lương`
- Hardened `pf_intake_to_quick_entry.py`:
  - better distinction between salary expense vs salary income
  - do not let expense-style project rules override income semantics
  - recognize shorthand account mentions such as `TK MB`
  - parse larger amounts correctly (fixing the case where `2.000.000.000` was misread as `2026`)
- Improved `pf_quick_entry_append.py` so posted `Quick Entry` rows get metadata synchronized more cleanly after append (`category_id`, `category_name`, `scope`, status/post state, transaction id), instead of only partially updating status columns.
- Acceptance dry-run checks now pass for representative text samples covering:
  - salary expense
  - project advance
  - project/material expense
  - project advance income
- Reviewed PF cron health and confirmed the active jobs are healthy:
  - `PF Quick Entry Intake`
  - `PF Debt Reminder Scan`
  - `PF Weekly Digest`
- Remaining non-blocker after the morning PF session: OCR from images is still not robust enough to be considered done; text fallback remains the reliable path.

## Suggested next steps
1. A14.4/A14.6: wire official Zalo send-message endpoint + final event mapping into the dedicated agent path.
2. Connect real reminder creation to cron jobs for Aurora instead of local reminder store only.
3. Add real workers/executors to consume Aurora capability jobs from `deo.agent_jobs`.
4. Improve image OCR robustness for finance intake while keeping text fallback as the safe path.
5. Add recent-transactions / top-category widgets in dashboards.
6. Extend debt module with due-soon / overdue counters and payment timeline.
7. Add monthly digest for the new workbook.
8. Decide whether Quick Entry should remain human-facing only, or become shared intake for n8n + agent flows.
