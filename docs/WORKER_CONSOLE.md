# Worker Console — feature map

Why this app exists, what each page does, what it deliberately doesn't.

## Mission

Paperclip's own UI is built for **operators** (people configuring agents,
adapters, secrets, workspaces, budgets). What it doesn't centre on is
**human workers** who need to:

1. See what AI agents are working on, right now.
2. Drop a comment / instruction into a specific issue's thread and trust
   that the right agent will pick it up.
3. Read the agent's reply and the artifacts it produced.
4. Approve or reject CEO-level proposals without learning the rest of
   Paperclip's surface.

Everything else (adapter config, secret rotation, workspace runtime
control, plugin install) is delegated back to Paperclip's UI via the
"Paperclip UI" link in the sidebar.

## Pages

### `/` — Dashboard

Read-only health snapshot: agent state distribution, task counts,
month-to-date spend vs. budget, budget incidents. Data:
`GET /api/companies/:id/dashboard`.

### `/goals` — Goals

Goals grouped by level (company / team / agent / task), each with status
badge. Data: `GET /api/companies/:id/goals`. Mutations stay in
Paperclip UI.

### `/projects` — Projects index

Grid view of every project, status, target date. Data:
`GET /api/companies/:id/projects`.

### `/projects/:id` — Project board

Issues laid out by status column (`backlog` → `done`). Each card links
into the issue chat. Data: `GET /api/projects/:id` +
`GET /api/companies/:id/issues?projectId=…`.

### `/issues` — Issue inbox

Free-form search + status filter across the entire company's issues.
Designed for "find that thing the agent mentioned yesterday."

### `/issues/:id` — **Primary page** (the delta value)

Three-column layout:

- Left top: issue description.
- Left middle: **merged timeline** of comments and heartbeat runs in
  chronological order. Comments render with author chip (agent vs human),
  runs render as compact event rows.
- Left bottom: **composer**. `@agent-name` in the body triggers a
  Paperclip-side wakeup of that agent — no extra round-trip required.
  Ctrl/Cmd+Enter sends.
- Right sidebar: assigned agent + last 5 heartbeat runs.

Live updates via `ws://…/api/companies/:id/events/ws`; we listen for
`heartbeat.run.*` and invalidate React Query caches for the open issue.

### `/approvals` — Inbox

Pending approvals only. Each row shows type
(`hire_agent` / `approve_ceo_strategy` / `budget_override_required` /
`request_board_approval`), the JSON payload, and three actions: Approve,
Request revision, Reject. Notes captured via inline `prompt()` for the
non-approve flows — sufficient for v1, replace with a proper dialog
later if the friction shows up.

### `/agents` + `/agents/:id`

Roster + per-agent detail (manager, adapter, last heartbeat). Actions:
pause / resume / wake. Anything that mutates the agent's adapter config
sends the user to Paperclip's UI.

## What's deliberately NOT here

- Adapter install / edit.
- Secret CRUD.
- Workspace lifecycle (start/stop runtime services, create worktrees).
- Plugin management.
- Budget configuration.
- Company creation / deletion.
- Instance admin.

All of the above is one click away via the **Paperclip UI** link at the
bottom of the sidebar. Reproducing them here would just be a worse copy.

## Implementation notes

- **No auth provider, no token storage.** Same-origin cookie session from
  Paperclip's better-auth. If the API returns 401, the client redirects
  to `/auth/login?redirect=…`.
- **No socket.io / axios.** Plain `fetch` + browser `WebSocket`. Smaller
  surface, smaller bundle.
- **No business types beyond `apps/web/src/types.ts`.** That file mirrors
  the response shapes from `docs/PAPERCLIP_API.md`. If Paperclip changes a
  shape, update both.
- **React Query keys** are flat and predictable:
  `['issue', id]`, `['issue-comments', id]`, `['issue-runs', id]`,
  `['approvals', companyId, status]`, `['agents', companyId]`, etc. The
  live-events hook uses those keys directly when invalidating.
