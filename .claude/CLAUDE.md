# Quy trình làm việc trong deo-enterprise-os

This file is loaded automatically by Claude Code CLI when the workspace is at
the root of this repo. It encodes the discipline the team has agreed to use
on every non-trivial task. Follow it unless the operator explicitly tells you
otherwise.

## Project context

- **API:** `apps/api` — Express + pg + Redis. Worker (`apps/api/src/worker.ts`)
  consumes `jobs:queue:<runtime_type>:<company_id>` for **vps-inline runtimes
  only** (`internal`, `n8n`). `claude-code` and `openclaw` are listed in
  `EXTERNAL_RUNNER_RUNTIMES` (env, default `claude-code`); the local runner
  daemon owns those.
- **Web:** `apps/web` — Vite + React + react-query.
- **Schema:** `infrastructure/postgres/00*.sql` — apply in numerical order.
  Migrations are append-only; never edit a shipped migration.
- **Local runner:** `scripts/openclaw-claude-runner.js` (Windows daemon),
  `start-local-runner.ps1` (starter). See `docs/LOCAL_RUNNER.md`.
- **Auth:** `/api/agent-runner/*` uses shared `AGENT_RUNNER_TOKEN` via
  `X-Service-Token` (or `Authorization: Bearer`). Webapp uses JWT.

## Phase 1 — Think before code

1. **`/dev:brainstorming`** — pin scope via Socratic questions before writing
   any plan. Stop guessing requirements; ask the operator.
2. **`/dev:writing-plans`** — produce a plan with explicit acceptance
   criteria and an out-of-scope list. Save under `/tmp/plans/` if it spans
   multiple sessions.

## Phase 2 — Code

3. **`/dev:test-driven-development`** — Red → Green → Refactor. Write the
   failing test first, then the minimum code to pass, then clean up.
4. **`/dev:executing-plans`** — work the plan top-to-bottom. Mark tasks
   complete in your todo list as you finish them; don't batch.
5. **Bash discipline:** when running shell commands repeatedly (git, npm
   test, tsc, psql), prefer `rtk <cmd>` to filter output. RTK auto-rewrite
   only fires inside WSL/Bash; in the Windows daemon there is no shell hook,
   so explicit `rtk` calls are still useful but not required.
6. **Code review graph:** before you ask for context across many files
   ("which files touch X?"), call the MCP graph. Examples:
   `query_graph_tool` for callers, `detect_changes_tool` for blast radius.
   This is the cheap way to avoid grepping 27k files. If the graph looks
   stale, ask the operator to run `code-review-graph build`.

## Phase 3 — Debug

7. **`/dev:systematic-debugging`** — write the hypothesis before changing
   code. Reproduce → isolate → fix the root cause, not the symptom.
8. After resolving a non-trivial issue, append the lesson to
   `.claude/troubleshooting.md` (create if missing) so future sessions
   don't repeat it.

## Phase 4 — Verify & ship

9. **`/dev:verification-before-completion`** — run the checklist before
   declaring done: typecheck, build, smoke the affected endpoints, eyeball
   the diff once more.
10. **`/dev:requesting-code-review`** — write the PR description from the
    plan's acceptance criteria, not the diff. Reviewers want intent, not
    enumeration.
11. **`/dev:finishing-a-development-branch`** — clean up dead code, drop
    debug logs, rebase if needed.

## Local invariants — break carefully

- **Never edit a shipped migration.** Add `00N_<name>.sql` instead.
- **`agents` is platform-wide.** Don't add `company_id` to it without
  discussing — multi-tenant isolation lives at `task_executions.task_id →
  tasks.company_id`.
- **Don't enqueue Redis jobs for runtimes in `EXTERNAL_RUNNER_RUNTIMES`.**
  The local runner is the only claimant; doubling up causes the in-process
  worker to mark jobs done with mock output before the daemon sees them.
- **Cancel race:** `PATCH /api/agent-runner/jobs/:id/status` returns 409
  when the job is already terminal. Don't bypass that guard from the
  daemon — let cancels stick.
- **`bypassPermissions` mode:** when running inside the daemon's
  `claude.exe`, you have full access to `CLAUDE_CODE_WORKDIR_ROOT`. Don't
  step outside (the runner enforces this) and don't `git push` or deploy
  unless the task explicitly says so.

## Conventions

- Vietnamese is fine for prose; code identifiers, commits, and PR titles
  stay English.
- Commits follow the existing style: `type(scope): summary` (e.g.
  `fix(agent-runner): cancel race guard`).
- Keep PRs small and focused. Three concerns → three PRs.
