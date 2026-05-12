# Adapters

Configuration snippets for the two Paperclip adapters this workspace relies
on. Both are installed through Paperclip's UI (Settings → Adapters); the
JSON below is what we paste into the **Configuration** field for an
**agent** of the given type.

| Adapter | Role |
| --- | --- |
| `hermes_local` | Default executor for all agents (persistent memory, 80+ skills, MCP client). |
| `claude_local` | Backup executor for agents that need raw Claude Code CLI access — e.g. coding agents that pair with our git worktree workflow. |

The adapter packages themselves are pulled in by Paperclip:

- `hermes_local` → npm `hermes-paperclip-adapter@^0.2.0` (declared in
  `paperclip/server/package.json`, see Paperclip server registry).
- `claude_local` → bundled as `@paperclipai/adapter-claude-local` inside
  the Paperclip monorepo.

Prereqs:

- `scripts/install-hermes.sh` runs the Nous installer (`hermes` on PATH).
- `claude` CLI installed (`npm i -g @anthropic-ai/claude-code`).
- Secret `ANTHROPIC_API_KEY` registered in Paperclip's secret store
  (Settings → Secrets) — both adapters reference it.

Per-agent overrides (e.g. CEO opus vs worker sonnet) go on the agent
config, not the adapter default.
