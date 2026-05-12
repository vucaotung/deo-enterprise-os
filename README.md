# deo-enterprise-os

**v4 — Paperclip + Hermes rebuild.**

Lớp điều phối AI agent ([Paperclip](https://docs.paperclip.ing/)) chạy cạnh
một executor AI ([Hermes Agent](https://hermes-agent.nousresearch.com/)), với
một **Worker Console** React tối giản phục vụ tương tác giữa con người và
agent — phần Paperclip's own UI chưa làm tốt.

```
   Paperclip (Node.js + Postgres)           Hermes Agent (Nous Research)
   ├─ companies / org / goals / projects    ├─ persistent memory (FTS5)
   ├─ issues / runs / approvals    ◀──────▶ ├─ 80+ skills, MCP client
   ├─ adapters: hermes_local + claude_local │  multi-provider routing
   └─ HTTP API + WebSocket  (port 3100)     └─ daemon on localhost

                  ▲ /api/* + /api/companies/:id/events/ws
                  │
        Worker Console (apps/web, Vite, port 5173)
        ├─ Goals / Projects / Issues
        ├─ Issue chat (human ↔ agent) — the main thing Paperclip is missing
        └─ Approvals inbox
```

Toàn bộ orchestrator tự viết của các phiên bản trước (Express API, Redis
worker, runtimes `claude-code` / `openclaw` / `n8n` / `internal`, Windows
local runner) đã được xóa. Paperclip thay thế đầy đủ.

## Yêu cầu

- Node.js 20+
- pnpm 9.15+
- Postgres (Paperclip có thể embed local sqlite-equivalent — xem `paperclip/.env.example`)
- `claude` CLI (`npm i -g @anthropic-ai/claude-code`) cho `claude_local` adapter
- `ANTHROPIC_API_KEY` (và tuỳ chọn `OPENROUTER_API_KEY`)

## Quickstart

```bash
scripts/bootstrap.sh        # clone Paperclip, install deps, migrate DB
scripts/install-hermes.sh   # cài Hermes daemon
scripts/dev.sh              # chạy Paperclip + Worker Console
```

- Paperclip UI: <http://localhost:3100>
- Worker Console: <http://localhost:5173>

Lần đầu chạy: vào Paperclip UI tạo company, install hai adapter
`hermes_local` + `claude_local` (dán config từ `adapters/*.json`), hire CEO
agent. Worker Console sẽ tự fetch dữ liệu qua proxy.

## Cấu trúc

| Đường dẫn | Vai trò |
| --- | --- |
| `paperclip/` | Vendored bởi `scripts/bootstrap.sh` (gitignored). Pinned ở `paperclip.lock`. |
| `apps/web/` | Worker Console — React app gọi Paperclip API. |
| `adapters/` | Config JSON cho `hermes_local` + `claude_local`. |
| `scripts/` | bootstrap / install-hermes / dev. |
| `docs/` | `REBUILD.md`, `PAPERCLIP_API.md`, `WORKER_CONSOLE.md`. |

## Tài liệu

- [`docs/REBUILD.md`](docs/REBUILD.md) — what changed và tại sao.
- [`docs/PAPERCLIP_API.md`](docs/PAPERCLIP_API.md) — bề mặt HTTP/WS mà
  Worker Console gọi vào.
- [`docs/WORKER_CONSOLE.md`](docs/WORKER_CONSOLE.md) — feature map.
