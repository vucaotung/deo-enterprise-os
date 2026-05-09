# Local Claude Code runner

The local runner is a Node.js daemon that lets the VPS dispatch
`runtime_type=claude-code` agent_jobs to a Windows machine where the Claude
Code CLI is already authenticated. It is the bridge between
`agent_jobs.queue_state='queued'` (sitting in Postgres) and `claude.exe`
(running in the operator's repo checkout).

```
[VPS API + Postgres]                         [Windows machine]
  │                                            │
  │   POST /agent-runner/claim                 │
  │ ◄──────────────────────────────────────────┤  scripts/openclaw-claude-runner.js
  │                                            │  spawns claude.exe in
  │   POST /agent-runner/jobs/:id/logs         │  CLAUDE_CODE_WORKDIR_ROOT
  │   PATCH /agent-runner/jobs/:id/status      │
  │ ◄──────────────────────────────────────────┤
  │   POST /agents/:id/heartbeat               │
  │ ◄──────────────────────────────────────────┤
```

## Why pull, not webhook

- No inbound port on the operator's machine. Outbound HTTPS only.
- No public URL or tunnel needed. Survives NAT and laptop sleep.
- VPS does not need to hold the Claude Code session token.
- If the runner dies, jobs stay `queued`; no retry queue to babysit.

The trade-off is latency: jobs wait up to `AGENT_RUNNER_POLL_MS` (default 5s)
before the daemon picks them up. Acceptable for ops work; for true real-time
add a webhook bell later.

## Files

| Path | Role |
|---|---|
| `scripts/openclaw-claude-runner.js` | The daemon. Polls, claims, spawns `claude.exe`, callbacks. |
| `start-local-runner.ps1` | PowerShell starter — sets env vars, then `node scripts/openclaw-claude-runner.js`. |
| `scripts/local-runner.env.example` | Documented env template (copy/edit as needed). |
| `docs/LOCAL_RUNNER.md` | This file. |

VPS-side counterparts (already deployed):

| Path | Role |
|---|---|
| `apps/api/src/routes/agent-runner.ts` | `/api/agent-runner/claim`, `/jobs/:id/logs`, `/jobs/:id/status`. |
| `apps/api/src/middleware/service-auth.ts` | Validates `X-Service-Token` (or `Authorization: Bearer`) against `AGENT_RUNNER_TOKEN`. |
| `apps/api/src/worker.ts` | `EXTERNAL_RUNNER_RUNTIMES` env var (default `claude-code`) tells the in-process worker to skip those runtimes so the runner is the only claimant. |

## Setup (Windows)

1. **Prereqs:** Node 20+, `claude.exe` already authenticated, repo cloned at
   `C:\Users\<you>\.openclaw\workspace\repos\deo-enterprise-os`.
2. **Get the runner token** from the VPS admin (matches `AGENT_RUNNER_TOKEN`
   on the VPS api process; rotated out of band).
3. **Edit `start-local-runner.ps1`** with the token and your real paths, or
   set the same env vars in PowerShell. Use `scripts/local-runner.env.example`
   as the source of truth for variable names and defaults.
4. **Optional:** Look up the agent UUID in Postgres
   (`SELECT id FROM deo.agents WHERE name='it-dev-agent'`) and set
   `AGENT_ID` in the env. Without it the daemon still claims jobs but cannot
   pulse `last_heartbeat`, so the webapp will show the agent as offline.
5. **Run:**
   ```powershell
   .\start-local-runner.ps1
   ```
   Console should print `Enterprise OS local runner online: <api_url>,
   runtime=claude-code`.

To stop, `Ctrl+C`. The daemon does not currently kill an in-flight
`claude.exe` on shutdown; let it finish or kill it manually.

## End-to-end smoke

1. Boot the runner on Windows.
2. In the webapp, open a task and click **Chạy mới** with
   `runtime_type=claude-code`. The Executions tab should show a row with
   status `pending` → `running` within ≤5s.
3. Within the row, the AgentJobCard polls every 2s and surfaces `log_tail`
   from the runner's stdout/stderr.
4. When `claude.exe` exits 0, the daemon PATCHes `queue_state='done'`. The
   row flips to `succeeded`; `tasks.execution_status='success'`.
5. **Cancel race:** while the daemon is still spawning `claude.exe`, click
   Cancel in the webapp. The user-side PATCH sets the job to `cancelled`.
   When `claude.exe` finally exits and the daemon callbacks `done`, the
   API returns **HTTP 409** (`agent_job already in terminal state`). The
   daemon logs the warning and moves on to the next job; the cancel sticks.

## Troubleshooting

- `Missing ENTERPRISE_OS_MCP_TOKEN or AGENT_RUNNER_TOKEN` → token env var not
  set. Fix in `start-local-runner.ps1` (or your shell).
- `Service token is not configured` (HTTP 503) → the **VPS** is missing the
  env var. The VPS admin must set `AGENT_RUNNER_TOKEN` (or
  `ENTERPRISE_OS_MCP_TOKEN`) and restart the api process.
- `Invalid service token` (HTTP 401) → token mismatch between local
  and VPS. Refresh both.
- `workdir <path> outside CLAUDE_CODE_WORKDIR_ROOT` → either the job's
  `agent.config.workdir` / `input.workdir` points outside the configured
  root, or `CLAUDE_CODE_WORKDIR_ROOT` is set to the wrong location. The
  runner refuses to escape the configured root by design.
- Jobs sit `queued` forever → check the VPS worker is running with
  `EXTERNAL_RUNNER_RUNTIMES=claude-code` (otherwise the in-process stub will
  beat the runner to the job and mark it done with mock output). Also check
  the daemon console for claim errors.
- `tasks.execution_status='failed'` but the job's `output` looks fine →
  `claude.exe` exited non-zero or hit `CLAUDE_CODE_TIMEOUT_MS`. Inspect
  `agent_jobs.log_tail` and `agent_jobs.output.error` in the webapp.

## Security notes

- The runner runs `claude.exe --permission-mode bypassPermissions`. Anything
  inside `CLAUDE_CODE_WORKDIR_ROOT` is fair game. Keep the root scoped to
  the project checkout only — do not point it at `C:\` or `%USERPROFILE%`.
- The runner token is a shared secret. Anyone with it can claim jobs and
  patch their state. Treat as production credential.
- The daemon never `git push` or deploys. Reviewing the diff and pushing is
  the operator's job.

## Out of scope (for now)

- Per-agent API keys (revocable, scoped). Currently one shared token across
  all runners; rotate manually.
- Webhook bell to short-circuit the 5s poll.
- Sandbox per-job workspace (`worktree` + auto-branch + auto-PR).
- Multiple concurrent jobs on a single daemon. The runner serializes.
- Watchdog auto-restart on crash. Use `pm2`, NSSM, or Task Scheduler if
  you need that.
