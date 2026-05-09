# Claude Code productivity stack

Three tools wired into the operator's Claude Code CLI to cut context waste
and keep work disciplined:

| Tool | What it does | Effective in daemon? | Effective in operator's interactive session? |
|---|---|---|---|
| **code-review-graph** | Tree-sitter SQLite graph of every function/class/import. Claude calls it as an MCP server to compute "blast radius" instead of guessing across 27k files. | ✓ (loads from `~/.claude.json` MCP config) | ✓ |
| **RTK (token saver)** | Filters shell command output 60–90% via a Bash PreToolUse hook (`git status` → `rtk git status`). | ✗ The Windows daemon spawns `claude.exe` directly without a shell — the hook never fires. | ✓ (WSL/macOS/Linux only) |
| **Superpowers** | Claude Code plugin: 14 `/dev:*` skills (brainstorming, writing-plans, TDD, executing-plans, systematic-debugging, verification-before-completion, requesting-code-review, finishing-a-development-branch, …). | ✓ (plugin auto-loads) | ✓ |

**Bottom line:** the daemon benefits from 2 of 3 tools (graph + Superpowers).
RTK is for the operator's own typing. The project `.claude/CLAUDE.md` at the
repo root tells Claude (in either context) when to reach for each.

## Files

| Path | Role |
|---|---|
| `.claude/CLAUDE.md` | Project workflow rules. Auto-loaded by Claude Code when the workspace is at the repo root — applies to both daemon runs and operator sessions. |
| `scripts/setup-claude-tools.ps1` | Idempotent Windows-native installer (for the daemon machine). |
| `scripts/setup-claude-tools.sh` | Idempotent WSL/macOS/Linux installer (for operator's interactive session). |
| `docs/CLAUDE_TOOLS.md` | This file. |

## Setup — Windows native (daemon machine)

Run from the repo root in PowerShell:

```powershell
.\scripts\setup-claude-tools.ps1
```

Optional flags:

```powershell
.\scripts\setup-claude-tools.ps1 -WorkspaceDir 'C:\path\to\repo'
.\scripts\setup-claude-tools.ps1 -SkipRtk -SkipBuildGraph
```

What it does:

1. Verifies `python` (3.10+), `cargo` (for RTK), and the presence of `claude.exe`.
2. `pip install --upgrade code-review-graph`.
3. Merges a `code-review-graph` entry into `~/.claude.json`'s `mcpServers`,
   pointing at the absolute `.exe` path with `PYTHONUTF8=1`. Other MCP servers
   in the file are preserved.
4. `code-review-graph build` against the workspace dir (skip with
   `-SkipBuildGraph`).
5. Installs RTK via `cargo install --git`. **Note:** RTK auto-rewrite is
   WSL-only; on native Windows it's installed but inert for the daemon.
6. Prints the manual command for Superpowers (must run inside Claude Code).

Then run the manual step **once**:

```
claude
/plugin install superpowers@claude-plugins-official
```

Restart Claude Code; `/help` should list `/dev:*` commands.

## Setup — WSL / macOS / Linux (operator interactive)

```bash
./scripts/setup-claude-tools.sh
WORKSPACE_DIR=/path/to/repo ./scripts/setup-claude-tools.sh
SKIP_RTK=1 ./scripts/setup-claude-tools.sh
```

Same five steps, but uses `pipx` (preferred) or `pip --user` for
code-review-graph, and `brew`/`cargo`/upstream installer for RTK plus
`rtk init -g` to wire the PreToolUse hook globally.

Restart your shell after RTK install so the rewrite hook activates.

## End-to-end verification

After running the installer:

```bash
# 1. graph status
code-review-graph status     # expect: nodes > 0, edges > 0
```

Inside Claude Code (interactive):

```
> Build the code review graph for this project
> Which files most likely need to change for a bug in agent_jobs INSERT?
```

Expect Claude to call `query_graph_tool` / `detect_changes_tool` (visible in
the tool-use transcript) and surface a short list of files, not a guess.

```
> /help
```

Expect to see `/dev:brainstorming`, `/dev:writing-plans`,
`/dev:test-driven-development`, … under the Superpowers namespace.

Inside the daemon (Windows):

1. Boot the daemon (`./start-local-runner.ps1`).
2. Create a `runtime_type=claude-code` task in the webapp with prompt
   like *"List the 3 files most relevant to the agent_jobs INSERT path"*.
3. Inspect the agent_job's `log_tail` in the webapp: it should reference
   `query_graph_tool` calls and produce concrete file paths
   (`apps/api/src/routes/agent-jobs.ts`, etc.).

WSL-only RTK check:

```bash
git status                 # expect: filtered output (way fewer lines)
type rtk-git || rtk --help # depending on shell, the rewrite alias is visible
```

## Troubleshooting

- **`code-review-graph` not on PATH after `pip install`** → `pip` user-scripts
  dir not on PATH. macOS: add `~/Library/Python/3.X/bin`. Linux: `~/.local/bin`.
  Windows: `%APPDATA%\Python\Python3X\Scripts`. Or use `pipx`.
- **MCP server fails to start in Claude Code** → on Windows, ensure
  `~/.claude.json` has the entry pointing at the **absolute** `.exe` path
  (not `python -m ...`) and `env.PYTHONUTF8 = "1"`. The installer does this
  for you; if you edited manually, double-check.
- **`/dev:*` commands not visible** → Superpowers plugin not installed yet.
  Run `/plugin install superpowers@claude-plugins-official` in an
  interactive Claude Code session, then restart.
- **RTK hook didn't fire in WSL** → make sure `~/.bashrc` (or `~/.zshrc`)
  was reloaded; `rtk init -g` patches the rc file. `echo $RTK_INSTALLED`
  should be set after sourcing.
- **Graph stale after big merge** → `code-review-graph build` again. For
  continuous re-indexing, run `code-review-graph daemon start` (out of
  scope for this PR).

## Out of scope

- Auto-installing Superpowers (plugin marketplace requires interactive
  confirm; we just print the command).
- Running `code-review-graph daemon start` automatically. Manual rebuild
  on big merges is fine for now.
- Per-agent CLAUDE.md (e.g. one for `it-dev-agent` vs `project-manager`).
  Currently a single project-level file applies to all daemon runs.
- Custom Dẹo skills (`/dev:deo-review`, `/dev:dieu-phoi-handoff`). Use the
  stock Superpowers set first; design custom ones once the patterns are
  clear from real use.
