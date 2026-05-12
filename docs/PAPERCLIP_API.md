# Paperclip API surface — reference for Worker Console

Sources, in order of trust:

1. Official docs at `https://docs.paperclip.ing/reference/api/*` (fetched
   during Phase 0).
2. Server source at `paperclipai/paperclip@c445e59…` cloned into
   `/tmp/paperclip-ref` for cross-checking line numbers.

Base URL: `http://localhost:3100/api` in dev. All endpoints below are
relative to that prefix.

## Conventions

- `Content-Type: application/json` for request and response bodies.
- Error envelope: `{ "error": "...", "details"?: ... }`.
- Mutating requests during agent runs MUST carry the
  `X-Paperclip-Run-Id` header — the server reads it for issue comments and
  checkout operations. Worker Console (human actor) only sets it when
  proxying on behalf of a run.
- Status codes used: 400 validation, 401 no identity, 403 forbidden, 404
  not in company scope, 409 conflicting state, 422 business-rule reject,
  503 DB unreachable.

## Authentication

Two identity types, both via `Authorization: Bearer <token>`:

| Identity | Token | How issued |
| --- | --- | --- |
| Board (human/operator) | session cookie OR `pcp_board_*` opaque key | session via better-auth in `authenticated` mode; key via CLI flow `POST /api/cli-auth/challenges` then `POST /api/cli-auth/revoke-current` |
| Agent (runtime) | long-lived API key OR local agent JWT | `POST /api/agents/:id/keys` returns once; JWTs minted by the runtime |

Deployment mode matters:

- `local_trusted` — no bearer needed, implicit board identity. Default for
  `scripts/dev.sh`.
- `authenticated` — browser session cookie resolves to board actor; CLI/
  external callers use `pcp_board_*`.

**Worker Console strategy**: same-origin to Paperclip via Vite proxy in
dev. Cookie session from `:3100/auth/...` flows through `/api/*` and the
WS endpoint, so no token storage in the React app. Prod: reverse-proxy
both behind one host.

## Endpoints used by Worker Console

Verified against the official reference; server line numbers cite
`/tmp/paperclip-ref/server/src/routes/*.ts`.

### Companies (`routes/companies.ts`)

- `GET    /companies` — list. (90)
- `GET    /companies/stats` — list + stats. (101)
- `GET    /companies/:companyId` — detail. (122)
- `POST   /companies` — create (board only). (267)
- `PATCH  /companies/:companyId` — update. (298)
- `POST   /companies/:companyId/archive` (380), `DELETE /companies/:companyId` (400).

### Goals (`routes/goals.ts`)

Levels: `company | team | agent | task`. Statuses: `planned | active | achieved | cancelled`. Required: `title`.

- `GET    /companies/:companyId/goals` (14).
- `GET    /goals/:id` (21).
- `POST   /companies/:companyId/goals` (32) — body: `{ title, description?, level?, status?, parentId?, ownerAgentId? }`.
- `PATCH  /goals/:id` (54).
- `DELETE /goals/:id` (83).

### Projects (`routes/projects.ts`)

Statuses: `backlog | planned | in_progress | completed | cancelled`. Required: `name`. Use `goalIds: []` (prefer) over legacy `goalId`.

- `GET    /companies/:companyId/projects` (100).
- `GET    /projects/:id` (107) — accepts UUID or shortname.
- `POST   /companies/:companyId/projects` (118).
- `PATCH  /projects/:id` (186).
- `GET    /projects/:id/workspaces` (246).
- `POST   /projects/:id/workspaces` (258) — source: `local_path | git_repo | remote_managed | non_git_path`; needs `cwd` or `repoUrl`.
- `POST   /projects/:id/workspaces/:workspaceId/runtime-services/:action` (617) — start/stop/restart.

### Issues (`routes/issues.ts`)

Statuses: `backlog | todo | in_progress | in_review | blocked | done | cancelled`.

Lifecycle endpoints — **always prefer checkout/release over direct PATCH to `in_progress`** (race-prone):

- `POST   /issues/:id/checkout` — atomic claim by agent. Body must include
  `expectedStatuses: []` and the caller must set `X-Paperclip-Run-Id`.
- `POST   /issues/:id/release` — return to `todo`, clear assignment.

CRUD + tree:

- `GET    /companies/:companyId/issues` (1363) — filters: search, status, label, etc.
- `GET    /companies/:companyId/labels` (1461) — `POST` same path to create (1468).
- `GET    /issues/:id` (1633) — full record + related objects.
- `POST   /companies/:companyId/issues` (2291).
- `POST   /issues/:id/children` (2381).
- `PATCH  /issues/:id` (2526) — update; can optionally bundle a comment.

Comments (the chat surface):

- `GET    /issues/:id/comments` (3590) — paginated.
- `POST   /issues/:id/comments` (4102) — `@mentions` in the body trigger
  agent wakeups server-side. This is the primary human↔agent channel.
- `GET    /issues/:id/comments/:commentId` (3939).
- `DELETE /issues/:id/comments/:commentId` (3956).

Documents / work products / attachments:

- `GET    /issues/:id/work-products` (1692), `POST` same (1988).
- `PATCH  /work-products/:id` (2020), `DELETE` (2054).
- `GET    /issues/:id/documents` (1704), `GET …/:key` (1718),
  `PUT …/:key` (1739), `DELETE …/:key` (1919).
- `GET    /issues/:id/documents/:key/revisions` (1821).
- `POST   /companies/:companyId/issues/:issueId/attachments` — upload file.
- `GET    /attachments/:attachmentId/content` — download.

Inbox / read state:

- `POST /issues/:id/read` (2088), `DELETE` same (2120).
- `POST /issues/:id/inbox-archive` (2152), `DELETE` same (2184).

Issue-approval link:

- `GET    /issues/:id/approvals` (2216).
- `POST   /issues/:id/approvals` (2228).
- `DELETE /issues/:id/approvals/:approvalId` (2261).

Heartbeat retry helpers:

- `POST   /issues/:id/monitor/check-now` (2467).
- `POST   /issues/:id/scheduled-retry/retry-now` (2488).

### Runs / activity (`routes/activity.ts`, `routes/agents.ts`)

- `GET  /companies/:companyId/activity` (activity.ts:35) — append-only feed,
  no pagination. Filters: `agentId`, `entityType`, `entityId`.
- `POST /companies/:companyId/activity` (50) — board-only, log custom event:
  `{ actorId, action, entityType, entityId, details? }`.
- `GET  /issues/:id/activity` (62).
- `GET  /issues/:id/runs` (74).
- `GET  /heartbeat-runs/:runId/issues` (86).
- `GET  /companies/:companyId/heartbeat-runs` (agents.ts:3091).
- `GET  /companies/:companyId/live-runs` (3101).
- `GET  /heartbeat-runs/:runId` (3186).
- `GET  /heartbeat-runs/:runId/events` (3263).
- `GET  /heartbeat-runs/:runId/log` (3285).
- `POST /heartbeat-runs/:runId/cancel` (3203).
- `GET  /issues/:issueId/active-run` (3394).
- `GET  /issues/:issueId/live-runs` (3340).

### Approvals (`routes/approvals.ts`)

Types: `hire_agent | approve_ceo_strategy | budget_override_required | request_board_approval`. Lifecycle: `pending → approved/rejected`, or `pending → revision_requested → pending`.

- `GET  /companies/:companyId/approvals` (52) — supports status filter.
- `GET  /approvals/:id` (60).
- `POST /companies/:companyId/approvals` (71).
- `GET  /approvals/:id/issues` (124).
- `POST /approvals/:id/approve` (136) — board only.
- `POST /approvals/:id/reject` (232) — board only.
- `POST /approvals/:id/request-revision` (257) — board only.
- `POST /approvals/:id/resubmit` (284) — original agent or board.
- `GET  /approvals/:id/comments` (322).
- `POST /approvals/:id/comments` (334).

### Agents (`routes/agents.ts`)

- `GET  /companies/:companyId/agents` (1603).
- `GET  /companies/:companyId/org` (1685), `…/org.svg` (1693), `…/org.png` (1705).
- `GET  /agents/me` (1724).
- `GET  /agents/me/inbox-lite` (1737) — compact assignment list at heartbeat start.
- `GET  /agents/me/inbox/mine` (1774).
- `GET  /agents/:id` (1792).
- `GET  /agents/:id/runtime-state` (1886).
- `GET  /agents/:id/task-sessions` (1901).
- `POST /companies/:companyId/agent-hires` (1951).
- `POST /companies/:companyId/agents` (2124) — board only.
- `PATCH /agents/:id` (2546).
- `POST /agents/:id/pause` (2700) / `resume` (2726) / `approve` (2750) / `terminate` (2785).
- `DELETE /agents/:id` (2811).
- `POST /agents/:id/wakeup` (2974) — queue work with context payload.
- `POST /agents/:id/heartbeat/invoke` (2981) — manual tick.
- Agent keys: `GET /agents/:id/keys` (2835), `POST` (2846), `DELETE …/:keyId` (2868).

### Adapters (`routes/adapters.ts`)

- `GET    /adapters` (200) — list installed.
- `POST   /adapters/install` (229) — install (e.g. `@henkey/hermes-paperclip-adapter@0.3.0`).
- `PATCH  /adapters/:type` (361), `PATCH /adapters/:type/override` (396).
- `DELETE /adapters/:type` (424).
- `POST   /adapters/:type/reload` (499), `…/reinstall` (551).
- `GET    /adapters/:type/config-schema` (624).

### Dashboard (`routes/dashboard.ts`)

- `GET /companies/:companyId/dashboard` (10) — single read-only snapshot:
  agent counts (active / running / paused / error), task distribution,
  monthly cost-over-budget ratio, budget incident summary.

### Routines (`routes/routines.ts`)

A routine is the scheduling layer; the run it spawns links to an
execution issue. Trigger types: `schedule` (cron + tz), `webhook` (public
URL, bearer / HMAC / GitHub signing), `api` (manual).

- `GET    /companies/:companyId/routines` — list.
- `GET    /routines/:routineId`.
- `POST   /companies/:companyId/routines`.
- `PATCH  /routines/:routineId`.
- `POST   /routines/:routineId/triggers` — add trigger.
- `PATCH  /routine-triggers/:triggerId`, `DELETE` same.
- `POST   /routine-triggers/:triggerId/rotate-secret`.
- `POST   /routines/:routineId/run` — manual fire.
- `POST   /routine-triggers/public/:publicId/fire` — external webhook fire.
- `GET    /routines/:routineId/runs` — run history.

The Worker Console surfaces routines on a `/routines` view (list +
last-run status); detail view links into the issue spawned by the most
recent run.

### Secrets (`routes/secrets.ts`)

The Console does **not** manage secrets directly (CRUD stays in
Paperclip's own UI). It only needs to know the **reference shape** when
generating adapter configs:

```json
{
  "env": {
    "ANTHROPIC_API_KEY": {
      "type": "secret_ref",
      "secretId": "secret-uuid",
      "version": "latest"
    }
  }
}
```

`"latest"` follows rotations; numeric versions pin. Plaintext never
leaves the server. List endpoints used to populate dropdowns:

- `GET /companies/:companyId/secrets` — metadata only.
- `GET /companies/:companyId/secret-providers` — list available providers
  (e.g. `local_encrypted`).

## Realtime — WebSocket

`ws://localhost:3100/api/companies/:companyId/events/ws`
(`server/src/realtime/live-events-ws.ts`). Auth: session cookie OR
`Authorization: Bearer <agentApiKey>`.

Frame: `{ id, companyId, type, createdAt, payload }`. Event types from
`packages/shared/src/constants.ts:563`:

```
heartbeat.run.queued
heartbeat.run.status
heartbeat.run.event
heartbeat.run.log
agent.status
activity.logged
plugin.ui.updated
plugin.worker.crashed
plugin.worker.restarted
```

The Worker Console subscribes to one company at a time and demultiplexes
by `type` + `payload.issueId` / `payload.runId` to drive the IssueDetail
timeline.

Note: the activity REST endpoint is described as "no real-time delivery"
in the official docs; live updates ride the WebSocket above as
`activity.logged` frames, not as polling on the REST feed.

## Decision recap

- Worker Console uses same-origin cookie auth via Vite proxy (dev) and
  reverse proxy (prod). No token storage.
- Posting a comment with `@agent-name` is the primary way to interrupt an
  agent — it triggers a wakeup server-side, no extra call needed.
- Checking out an issue from the UI flows through `POST /issues/:id/checkout`
  with `X-Paperclip-Run-Id` set, not direct `PATCH`.
- Approvals inbox uses `GET /companies/:companyId/approvals?status=pending`
  + `POST /approvals/:id/{approve,reject,request-revision}`.

## Things we do NOT use

- `routes/plugins.ts` — plugin host backend.
- `routes/environments.ts`, `execution-workspaces.ts` — workspace
  lifecycle stays in Paperclip's own UI.
- `routes/secrets.ts` — Paperclip secret store managed in its UI.
- `routes/instance-*.ts` — instance admin only.
