# Rebuild: deo-enterprise-os → Paperclip + Hermes-local

Branch: `claude/paperclip-hermes-rebuild-c1hjk`.

## Why

deo-enterprise-os had its own orchestrator (Express API + Redis worker + 4
runtimes: claude-code / openclaw / n8n / internal + Windows local runner
daemon). That orchestrator overlapped almost 1-1 with
[Paperclip](https://docs.paperclip.ing/) — same job model (companies →
goals → projects → issues → agent runs), same adapter pattern, same
heartbeat-based lifecycle. Maintaining two of them was waste.

The rebuild replaces our orchestrator with Paperclip and adopts the
official `hermes_local` adapter for AI execution. Worker Console (a small
React app) fills the one gap Paperclip's own UI doesn't cover: a focused
human-worker ↔ AI-agent interaction surface.

## What changed

### Removed

- `apps/api/` — the entire Express + Postgres worker.
- `scripts/openclaw-claude-runner.js` + `start-local-runner.ps1` — the
  Windows daemon that polled `/api/agent-runner/*`.
- `infrastructure/` — Postgres migrations, n8n config, brain pipeline,
  nginx config. Paperclip owns its own schema and deployment.
- `goclaw/`, `memory/`, nested `deo-enterprise-os/` legacy snapshot,
  `docker-compose.prod.yml`, miscellaneous legacy `.md` plans
  (`DEO_ENTERPRISE_OS_MASTER_PLAN.md`, `ENTERPRISE_HUMAN_AI_HYBRID_OS_*`,
  etc.).
- Most of `apps/web` — auth provider, all old pages (CRM/Finance/
  Notebooks/Requests/Tasks/Projects-legacy/Dashboard-legacy/Agents-legacy).

### Added

- `paperclip.lock` — pin commit + verification date for the Paperclip
  clone.
- `scripts/bootstrap.sh` — clones Paperclip into `paperclip/`
  (gitignored), runs `pnpm install`, `pnpm db:migrate`, installs Worker
  Console deps.
- `scripts/install-hermes.sh` — wraps the official Nous installer + sanity
  check.
- `scripts/dev.sh` — runs Paperclip (`:3100`) and the Worker Console
  (`:5173`) together.
- `adapters/hermes-local.json` and `adapters/claude-local.json` —
  reference configs (paste into Paperclip UI when installing each
  adapter). Use the secret-ref shape
  `{ "type": "secret_ref", "secretId": <uuid>, "version": "latest" }`.
- `apps/web` rewritten as **Worker Console**:
  - `apps/web/src/api/paperclip.ts` — typed fetch client, same-origin
    cookie auth.
  - `apps/web/src/lib/live-events.ts` — WebSocket subscription that
    invalidates React Query caches on `heartbeat.run.*` / `agent.status`
    / `activity.logged` events.
  - `apps/web/src/lib/active-company.ts` — persistent active company
    switcher.
  - Pages: `Dashboard`, `Goals`, `Projects`, `ProjectDetail`, `Issues`,
    `IssueDetail` (chat thread + composer + run timeline), `Approvals`
    (approve / request revision / reject), `Agents`, `AgentDetail`.
- `docs/PAPERCLIP_API.md` — full endpoint reference, the source of truth
  for the Worker Console client.
- `docs/WORKER_CONSOLE.md` — feature map.

### Untouched

- The Paperclip codebase. We never patch upstream; if behaviour needs to
  change we ship a Paperclip plugin instead.

## How the pieces wire up

```
   Browser (Worker Console, port 5173)
   │  fetch /api/* and ws://…/api/companies/:id/events/ws
   ▼  (Vite proxy in dev, reverse-proxy in prod — same origin so
   │   better-auth cookies flow through)
   Paperclip server (port 3100)
   │  ├─ HTTP API + WebSocket realtime
   │  └─ adapter registry (claude_local, hermes_local, …)
   ▼
   hermes_local adapter → launches Hermes Agent daemon (~/.hermes/)
   claude_local adapter → spawns `claude` CLI in a git worktree
```

Single source of truth: Paperclip's Postgres. No deo-specific database.

## Verification

Smoke test (manual, end to end):

1. `scripts/bootstrap.sh` — Paperclip clones to `paperclip/`, deps
   installed, schema migrated.
2. `scripts/install-hermes.sh` — `hermes --version` prints.
3. `scripts/dev.sh` — both servers up.
4. Browse to `http://localhost:3100` → log in (better-auth) → create
   company **Acme Test** with goal *Reach $10k MRR by Q3*.
5. Paperclip UI → Settings → Adapters → install **hermes_local** and
   **claude_local**; paste configs from `adapters/*.json`. Register
   `ANTHROPIC_API_KEY` (+ `OPENROUTER_API_KEY` for Hermes) under Secrets
   and replace the secretId placeholders.
6. Hire a CEO agent (`claude_local`, opus) and an engineer agent
   (`hermes_local`, sonnet). CEO proposes strategy.
7. Switch to **Worker Console** (`http://localhost:5173`) → company
   switcher resolves to *Acme Test* automatically.
8. Inbox `/approvals` shows the CEO strategy approval → click
   **Approve**.
9. Project board appears at `/projects/:id`; pick the first issue.
10. On `/issues/:id` see the agent run timeline. Post a comment containing
    `@engineer-1 please add unit tests`. The agent wakes up (server-side
    `@mention` handling). Watch the heartbeat run frames stream in via
    WebSocket and refresh the timeline.
11. When the issue moves to `done`, the parent goal eventually flips to
    `achieved` (`/goals`).
12. `pnpm --filter web typecheck && pnpm --filter web build` (or `cd
    apps/web && npm run typecheck && npm run build`) — both pass.

If any of steps 8–11 fail (the human ↔ agent surface) the rebuild is not
"done" — that's the delta value.

## Open items / future work

- **Multi-user auth on Worker Console** — currently piggybacks on
  Paperclip's session. If we need RBAC distinct from Paperclip's board
  membership, add a Paperclip plugin.
- **CRM / Finance / Notebooks / Requests** — these business domain
  modules from v3 were removed wholesale. They're a separate effort: a
  Paperclip plugin (`@deo/business-hubs`) is the obvious shape.
- **Production deployment topology** — when we move past local dev,
  publish a docker-compose with Paperclip + Hermes + nginx that serves
  the Worker Console behind the same origin as Paperclip's API.
- **Existing deo Postgres data** — if any v3 data needs preserving,
  export before deleting `paperclip/` data dirs and re-import via a
  Paperclip plugin migration. Out of scope for this rebuild.
