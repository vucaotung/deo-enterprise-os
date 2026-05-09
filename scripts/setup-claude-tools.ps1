# Enterprise OS — Claude Code productivity stack installer (Windows native)
#
# Idempotent. Re-running is safe. Each step prints "ok" or "skip <reason>".
#
# Tools wired:
#   1. code-review-graph (MCP)        — Tree-sitter SQLite graph; reduces
#      review tokens 6.8–49x by surfacing only blast-radius files.
#   2. RTK (token saver)              — Bash hook that filters shell output
#      60–90%. **Auto-rewrite is WSL-only**; native Windows install is
#      noted but the daemon does not benefit. Useful for the operator's
#      interactive sessions.
#   3. Superpowers (Claude plugin)    — 14 `/dev:*` skills for disciplined
#      workflow. Plugin install MUST be run interactively from inside
#      Claude Code (`/plugin install superpowers@claude-plugins-official`);
#      this script only prints the instruction.
#
# Usage:
#   PS> .\scripts\setup-claude-tools.ps1
#   PS> .\scripts\setup-claude-tools.ps1 -WorkspaceDir 'C:\path\to\repo'
#   PS> .\scripts\setup-claude-tools.ps1 -SkipRtk -SkipBuildGraph

[CmdletBinding()]
param(
    [string]$WorkspaceDir = (Split-Path $PSScriptRoot -Parent),
    [switch]$SkipCodeReviewGraph,
    [switch]$SkipRtk,
    [switch]$SkipBuildGraph
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    ok: $msg"   -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "    skip: $msg" -ForegroundColor Yellow }
function Write-Warn2($msg){ Write-Host "    warn: $msg" -ForegroundColor Magenta }
function Test-Cmd($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

# ---------------------------------------------------------------------------
# 1. Prerequisites
# ---------------------------------------------------------------------------
Write-Step '1. Prereq check'

if (Test-Cmd 'python') {
    $pyVersion = (& python --version 2>&1).ToString()
    Write-Ok "python found: $pyVersion"
} else {
    throw 'python not found. Install Python 3.10+ from https://python.org or `winget install Python.Python.3.12`, then re-run.'
}

if (Test-Cmd 'cargo') {
    Write-Ok 'cargo found (RTK installable)'
} else {
    Write-Warn2 'cargo not found. RTK install will be skipped. Install Rust via `winget install Rustlang.Rust.MSVC` if you want it.'
    $SkipRtk = $true
}

if ((Test-Cmd 'claude') -or (Test-Path "$env:USERPROFILE\.local\bin\claude.exe")) {
    Write-Ok 'claude.exe present'
} else {
    Write-Warn2 'claude.exe not on PATH. The daemon and Superpowers install need it. Continuing anyway.'
}

# ---------------------------------------------------------------------------
# 2. code-review-graph
# ---------------------------------------------------------------------------
if ($SkipCodeReviewGraph) {
    Write-Step '2. code-review-graph (skipped)'
} else {
    Write-Step '2. code-review-graph'

    & python -m pip install --upgrade --quiet code-review-graph
    if ($LASTEXITCODE -ne 0) { throw 'pip install code-review-graph failed' }
    Write-Ok 'pip install code-review-graph'

    $crgCmd = (Get-Command code-review-graph -ErrorAction SilentlyContinue)
    if (-not $crgCmd) {
        throw 'code-review-graph CLI not on PATH after install. Check pip user scripts dir.'
    }
    $crgExe = $crgCmd.Source
    Write-Ok "code-review-graph at $crgExe"

    # Configure MCP for Claude Code (Windows native).
    # We merge into ~/.claude.json instead of overwriting, so user settings
    # for other MCP servers survive.
    $claudeJson = "$env:USERPROFILE\.claude.json"
    $config = $null
    if (Test-Path $claudeJson) {
        $raw = Get-Content $claudeJson -Raw
        if (-not [string]::IsNullOrWhiteSpace($raw)) {
            $config = $raw | ConvertFrom-Json
        }
    }
    if ($null -eq $config) {
        $config = [PSCustomObject]@{}
    }

    # Ensure mcpServers object exists.
    if (-not $config.PSObject.Properties.Match('mcpServers').Count) {
        $config | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([PSCustomObject]@{})
    }

    $serverEntry = [PSCustomObject]@{
        command = $crgExe
        args    = @('serve', '--repo', $WorkspaceDir)
        env     = [PSCustomObject]@{ PYTHONUTF8 = '1' }
    }

    if ($config.mcpServers.PSObject.Properties.Match('code-review-graph').Count) {
        $config.mcpServers.'code-review-graph' = $serverEntry
        Write-Ok '~/.claude.json: code-review-graph entry updated'
    } else {
        $config.mcpServers | Add-Member -NotePropertyName 'code-review-graph' -NotePropertyValue $serverEntry
        Write-Ok '~/.claude.json: code-review-graph entry added'
    }

    $config | ConvertTo-Json -Depth 20 | Out-File -FilePath $claudeJson -Encoding utf8

    if (-not $SkipBuildGraph) {
        Write-Step "   -> code-review-graph build (workspace=$WorkspaceDir)"
        Push-Location $WorkspaceDir
        try {
            & $crgExe build
            if ($LASTEXITCODE -ne 0) {
                Write-Warn2 'code-review-graph build returned non-zero. Verify with `code-review-graph status` later.'
            } else {
                Write-Ok 'graph built'
            }
        } finally {
            Pop-Location
        }
    } else {
        Write-Skip 'graph build (use -SkipBuildGraph=$false to enable, or run manually)'
    }
}

# ---------------------------------------------------------------------------
# 3. RTK
# ---------------------------------------------------------------------------
if ($SkipRtk) {
    Write-Step '3. RTK (skipped)'
} else {
    Write-Step '3. RTK'

    if (Test-Cmd 'rtk') {
        $rtkVer = (& rtk --version 2>&1).ToString()
        Write-Ok "rtk already installed: $rtkVer"
    } else {
        & cargo install --git https://github.com/rtk-ai/rtk
        if ($LASTEXITCODE -ne 0) { throw 'cargo install rtk failed' }
        Write-Ok 'cargo install rtk'
    }

    Write-Warn2 'RTK auto-rewrite (PreToolUse Bash hook) is WSL/Bash-only.'
    Write-Warn2 'Native Windows daemon spawns claude.exe directly without a shell, so the hook will not fire.'
    Write-Warn2 'For the operator''s interactive sessions, run `setup-claude-tools.sh` inside WSL.'
}

# ---------------------------------------------------------------------------
# 4. Superpowers (interactive)
# ---------------------------------------------------------------------------
Write-Step '4. Superpowers'
Write-Host ''
Write-Host '   Plugin install must run interactively inside Claude Code:' -ForegroundColor White
Write-Host '       claude' -ForegroundColor Gray
Write-Host '       /plugin install superpowers@claude-plugins-official' -ForegroundColor Gray
Write-Host ''
Write-Host '   Restart your Claude Code session afterwards. /help should list /dev:* commands.' -ForegroundColor White

# ---------------------------------------------------------------------------
# 5. Summary
# ---------------------------------------------------------------------------
Write-Step '5. Summary'
Write-Host ''
Write-Host "Workspace: $WorkspaceDir"
if (-not $SkipCodeReviewGraph) {
    Write-Host '  code-review-graph: installed; MCP entry written; graph built (unless -SkipBuildGraph).'
    Write-Host '    Verify: code-review-graph status'
}
if (-not $SkipRtk) {
    Write-Host '  RTK: installed (Windows native, manual invocation only — no auto-rewrite hook here).'
}
Write-Host '  Superpowers: install manually inside Claude Code.'
Write-Host ''
Write-Host 'See docs/CLAUDE_TOOLS.md for end-to-end verification steps.'
