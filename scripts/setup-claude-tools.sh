#!/usr/bin/env bash
# Enterprise OS — Claude Code productivity stack installer (Linux / WSL / macOS).
#
# Idempotent. Re-running is safe. RTK auto-rewrite (PreToolUse Bash hook) only
# works in this environment, NOT in the Windows-native daemon, so this script
# is for the operator's interactive Claude Code sessions.
#
# Usage:
#   ./scripts/setup-claude-tools.sh
#   WORKSPACE_DIR=/path/to/repo ./scripts/setup-claude-tools.sh
#   SKIP_RTK=1 ./scripts/setup-claude-tools.sh
#   SKIP_BUILD_GRAPH=1 ./scripts/setup-claude-tools.sh

set -euo pipefail

WORKSPACE_DIR="${WORKSPACE_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
SKIP_CODE_REVIEW_GRAPH="${SKIP_CODE_REVIEW_GRAPH:-0}"
SKIP_RTK="${SKIP_RTK:-0}"
SKIP_BUILD_GRAPH="${SKIP_BUILD_GRAPH:-0}"

step() { printf '\033[36m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[32m    ok: %s\033[0m\n' "$*"; }
skip() { printf '\033[33m    skip: %s\033[0m\n' "$*"; }
warn() { printf '\033[35m    warn: %s\033[0m\n' "$*"; }

have() { command -v "$1" >/dev/null 2>&1; }

# ---------------------------------------------------------------------------
# 1. Prereqs
# ---------------------------------------------------------------------------
step '1. Prereq check'

if have python3; then
    ok "python3 found: $(python3 --version)"
elif have python; then
    ok "python found: $(python --version)"
else
    echo 'python3 not found. Install Python 3.10+ first.' >&2
    exit 1
fi

PIPX_AVAILABLE=0
if have pipx; then
    ok 'pipx found (preferred installer)'
    PIPX_AVAILABLE=1
else
    warn 'pipx not found; will fall back to `pip install --user`. Install pipx for cleaner tool isolation.'
fi

if have cargo; then
    ok 'cargo found (RTK installable)'
elif [[ "$SKIP_RTK" != '1' ]] && have brew; then
    ok 'brew found (RTK installable via brew)'
elif [[ "$SKIP_RTK" != '1' ]]; then
    warn 'No cargo or brew. RTK install will fall back to upstream install.sh.'
fi

if have claude; then
    ok 'claude CLI present'
else
    warn 'claude CLI not found. Superpowers install needs it; install Claude Code first.'
fi

# ---------------------------------------------------------------------------
# 2. code-review-graph
# ---------------------------------------------------------------------------
if [[ "$SKIP_CODE_REVIEW_GRAPH" == '1' ]]; then
    step '2. code-review-graph (skipped)'
else
    step '2. code-review-graph'

    if [[ "$PIPX_AVAILABLE" == '1' ]]; then
        pipx install --force code-review-graph
    else
        python3 -m pip install --user --upgrade --quiet code-review-graph
    fi
    ok 'installed'

    if ! have code-review-graph; then
        warn 'code-review-graph not on PATH after install.'
        warn 'pipx users: try `pipx ensurepath` and restart shell.'
        warn 'pip --user users: ensure ~/.local/bin (Linux) or ~/Library/Python/<ver>/bin (macOS) is in PATH.'
    fi

    # Configure MCP for Claude Code (Linux/macOS/WSL).
    CLAUDE_JSON="$HOME/.claude.json"
    CRG_BIN="$(command -v code-review-graph || true)"
    if [[ -z "$CRG_BIN" ]]; then
        warn 'skipping ~/.claude.json patch (binary not on PATH yet)'
    else
        # Use python to merge JSON safely. jq could work but python is already a prereq.
        python3 - "$CLAUDE_JSON" "$CRG_BIN" "$WORKSPACE_DIR" <<'PYEOF'
import json, os, sys
path, crg, workspace = sys.argv[1], sys.argv[2], sys.argv[3]
if os.path.exists(path):
    with open(path) as f:
        try:
            cfg = json.load(f)
        except json.JSONDecodeError:
            print(f"warn: existing {path} is not valid JSON; refusing to overwrite", file=sys.stderr)
            sys.exit(2)
else:
    cfg = {}
servers = cfg.setdefault('mcpServers', {})
servers['code-review-graph'] = {
    'command': crg,
    'args': ['serve', '--repo', workspace],
    'env': {'PYTHONUTF8': '1'},
}
with open(path, 'w') as f:
    json.dump(cfg, f, indent=2)
print(f"  ~/.claude.json: code-review-graph entry written ({path})")
PYEOF
        ok '~/.claude.json patched'
    fi

    if [[ "$SKIP_BUILD_GRAPH" != '1' ]] && [[ -n "$CRG_BIN" ]]; then
        step "   -> code-review-graph build (workspace=$WORKSPACE_DIR)"
        (cd "$WORKSPACE_DIR" && "$CRG_BIN" build) || warn 'build returned non-zero; check `code-review-graph status` later'
        ok 'graph build attempted'
    else
        skip 'graph build'
    fi
fi

# ---------------------------------------------------------------------------
# 3. RTK
# ---------------------------------------------------------------------------
if [[ "$SKIP_RTK" == '1' ]]; then
    step '3. RTK (skipped)'
else
    step '3. RTK'

    if have rtk; then
        ok "rtk already installed: $(rtk --version 2>/dev/null || echo unknown)"
    elif have brew; then
        brew install rtk
        ok 'brew install rtk'
    elif have cargo; then
        cargo install --git https://github.com/rtk-ai/rtk
        ok 'cargo install rtk'
    else
        curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
        ok 'rtk install.sh'
    fi

    # Wire the PreToolUse hook + RTK.md. Per upstream README this also
    # patches the Claude Code settings.json with the hook binding.
    if have rtk; then
        rtk init -g || warn 'rtk init -g returned non-zero; re-run manually if needed'
        ok 'rtk init -g (Bash hook + RTK.md installed)'
        warn 'Restart your shell (or `source ~/.bashrc`/`~/.zshrc`) so the rewrite hook activates.'
    fi
fi

# ---------------------------------------------------------------------------
# 4. Superpowers (interactive)
# ---------------------------------------------------------------------------
step '4. Superpowers'
echo
echo '   Plugin install must run interactively inside Claude Code:'
echo '       claude'
echo '       /plugin install superpowers@claude-plugins-official'
echo
echo '   Restart your Claude Code session afterwards. /help should list /dev:* commands.'

# ---------------------------------------------------------------------------
# 5. Summary
# ---------------------------------------------------------------------------
step '5. Summary'
echo
echo "Workspace: $WORKSPACE_DIR"
[[ "$SKIP_CODE_REVIEW_GRAPH" != '1' ]] && echo '  code-review-graph: installed; MCP entry written; graph build attempted.'
[[ "$SKIP_RTK"               != '1' ]] && echo '  RTK: installed; PreToolUse hook configured (restart shell to activate).'
echo '  Superpowers: install manually inside Claude Code.'
echo
echo 'See docs/CLAUDE_TOOLS.md for end-to-end verification steps.'
