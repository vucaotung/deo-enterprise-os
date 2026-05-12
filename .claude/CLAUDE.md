# Quy trình làm việc trong deo-enterprise-os (v4 — Paperclip + Hermes)

This file is loaded automatically by Claude Code CLI at the repo root. Follow
it unless the operator explicitly says otherwise.

## Project context

- **Lớp điều phối:** [Paperclip](https://github.com/paperclipai/paperclip)
  được clone vào `paperclip/` bởi `scripts/bootstrap.sh` (gitignored). Chạy
  ở `http://localhost:3100`. Sở hữu companies, org structure, goals,
  projects, issues, approvals, agents, adapters, routines, secrets.
  Reference: `docs/PAPERCLIP_API.md`.
- **Lớp vận hành:** Hermes Agent (Nous Research) cài bằng
  `scripts/install-hermes.sh`. Paperclip gọi vào qua adapter `hermes_local`.
  Adapter phụ `claude_local` (Claude Code CLI) cho agent thiên về coding.
- **Webapp:** `apps/web` là **Worker Console** — Vite + React + TanStack
  Query. Gọi vào Paperclip API qua same-origin (Vite proxy dev / nginx
  prod). KHÔNG có Express API riêng nữa.
- **Adapters config:** `adapters/hermes-local.json`,
  `adapters/claude-local.json` — paste vào Paperclip UI (Settings →
  Adapters) khi cài. Secret refs dùng schema
  `{ type: "secret_ref", secretId, version: "latest" }`.

## Phase 1 — Think before code

1. **`/dev:brainstorming`** — pin scope qua Socratic questions trước khi
   viết plan.
2. **`/dev:writing-plans`** — plan có acceptance criteria + out-of-scope.
   Save vào `/tmp/plans/` nếu spans nhiều session.

## Phase 2 — Code

3. **`/dev:test-driven-development`** — Red → Green → Refactor.
4. **`/dev:executing-plans`** — work plan top-to-bottom, mark task xong
   ngay khi xong; không batch.
5. **Bash discipline:** dùng `rtk <cmd>` cho command lặp (git, pnpm, tsc).
6. **Đừng patch Paperclip upstream.** Nếu cần thay đổi logic Paperclip
   server, mở plugin theo `paperclip/doc/plugins/PLUGIN_SPEC.md`, đừng sửa
   trực tiếp `paperclip/` — nó sẽ bị overwrite ở lần `bootstrap.sh` tiếp
   theo.

## Phase 3 — Debug

7. **`/dev:systematic-debugging`** — viết hypothesis trước khi sửa code.
8. Sau khi resolve issue non-trivial → append vào
   `.claude/troubleshooting.md`.

## Phase 4 — Verify & ship

9. **`/dev:verification-before-completion`** — typecheck, build,
   smoke Worker Console + Paperclip UI, eyeball diff.
10. **`/dev:requesting-code-review`** — PR description từ acceptance
    criteria, không phải enumeration của diff.
11. **`/dev:finishing-a-development-branch`** — clean dead code, drop
    debug logs.

## Local invariants — break carefully

- **`paperclip/` là pinned bởi `paperclip.lock`.** Đừng commit thay đổi
  trong đó. Bump commit pin chỉ sau khi smoke test end-to-end pass.
- **Không thêm Postgres migration vào repo này nữa.** Schema thuộc về
  Paperclip; nếu cần thêm bảng custom thì dùng Paperclip plugin.
- **Worker Console không lưu auth token.** Cookie session của
  Paperclip (better-auth) chảy qua Vite proxy / reverse proxy.
- **Mutations trong issue runs cần header `X-Paperclip-Run-Id`.** Worker
  Console (human actor) chỉ set khi proxying thay agent.
- **Issue lifecycle:** dùng `POST /api/issues/:id/checkout` thay vì
  `PATCH … {status: in_progress}` — direct PATCH bị race.
- **`@mention agent-name` trong comment tự động wake agent.** Đây là
  primary handoff signal, không cần endpoint phụ.
- **`adapters/*.json` là config tham chiếu**, không phải thứ Paperclip
  đọc trực tiếp — phải paste qua UI hoặc dùng `POST /api/adapters/install`.
- **Hermes daemon chạy local.** Nếu Paperclip không tìm thấy `hermes`
  command thì check PATH (cài qua `~/.hermes/bin`).

## Conventions

- Vietnamese OK cho prose; code identifier, commit, PR title vẫn English.
- Commit format: `type(scope): summary`.
- PR nhỏ, focused. Ba concern → ba PR.
