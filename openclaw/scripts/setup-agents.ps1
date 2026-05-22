# setup-agents.ps1
# Adds 12 department agents to OpenClaw for Deo Enterprise OS
# Run from PowerShell: .\setup-agents.ps1
# Prerequisite: openclaw gateway must be running

$ErrorActionPreference = "Stop"
$OPENCLAW_STATE = "$env:USERPROFILE\.openclaw"
$CONFIG_FILE = "$OPENCLAW_STATE\openclaw.json"
$REPO_ROOT = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$AGENTS_SRC = "$REPO_ROOT\openclaw\agents"

Write-Host "=== Deo Enterprise OS - Agent Setup ===" -ForegroundColor Cyan
Write-Host "Source: $AGENTS_SRC"
Write-Host "State:  $OPENCLAW_STATE"
Write-Host "Config: $CONFIG_FILE"
Write-Host ""

# --- Step 1: Update main agent (Deo) workspace ---
Write-Host "--- Updating main agent (Deo) workspace ---" -ForegroundColor Yellow
$deoWorkspace = "$OPENCLAW_STATE\workspace-main"
if (-not (Test-Path $deoWorkspace)) {
    New-Item -ItemType Directory -Path $deoWorkspace -Force | Out-Null
}
Copy-Item -Path "$AGENTS_SRC\deo\*" -Destination $deoWorkspace -Recurse -Force
Write-Host "main workspace updated" -ForegroundColor Green
Write-Host ""

# --- Step 2: Define new agents with model assignments ---
$agentDefs = @(
    @{ id = "office-agent";          model = "openai-codex/gpt-5.4";            fallbacks = @("claude-cli/claude-sonnet-4-6", "9router/Combo1") },
    @{ id = "hr-agent";              model = "claude-cli/claude-sonnet-4-6";     fallbacks = @("9router/Combo1", "nvidia/google/gemma-4-31b-it") },
    @{ id = "finance-agent";         model = "claude-cli/claude-sonnet-4-6";     fallbacks = @("9router/Combo1", "nvidia/google/gemma-4-31b-it") },
    @{ id = "crm-agent";             model = "openai-codex/gpt-5.4";            fallbacks = @("9router/Combo1", "nvidia/google/gemma-4-31b-it") },
    @{ id = "it-dev-agent";          model = "claude-cli/claude-sonnet-4-6";     fallbacks = @("openai-codex/gpt-5.4", "9router/Combo1") },
    @{ id = "office-admin-agent";    model = "9router/Combo1";                  fallbacks = @("nvidia/google/gemma-4-31b-it") },
    @{ id = "marketing-agent";       model = "openai-codex/gpt-5.4";            fallbacks = @("claude-cli/claude-sonnet-4-6", "9router/Combo1") },
    @{ id = "legal-agent";           model = "claude-cli/claude-sonnet-4-6";     fallbacks = @("openai-codex/gpt-5.4", "9router/Combo1") },
    @{ id = "project-manager-agent"; model = "openai-codex/gpt-5.4";            fallbacks = @("claude-cli/claude-sonnet-4-6", "9router/Combo1") },
    @{ id = "researcher-agent";      model = "openai-codex/gpt-5.4";            fallbacks = @("claude-cli/claude-sonnet-4-6", "9router/Combo1") },
    @{ id = "dream-agent";           model = "claude-cli/claude-sonnet-4-6";     fallbacks = @("openai-codex/gpt-5.4") },
    @{ id = "ops-admin";             model = "claude-cli/claude-sonnet-4-6";     fallbacks = @("openai-codex/gpt-5.4", "9router/Combo1") }
)

# --- Step 3: Copy workspace files for each agent ---
Write-Host "--- Copying workspace files ---" -ForegroundColor Yellow
foreach ($def in $agentDefs) {
    $id = $def.id
    $workspacePath = "$OPENCLAW_STATE\workspace-$id"

    if (-not (Test-Path $workspacePath)) {
        New-Item -ItemType Directory -Path $workspacePath -Force | Out-Null
    }

    $srcPath = "$AGENTS_SRC\$id"
    if (Test-Path $srcPath) {
        Copy-Item -Path "$srcPath\*" -Destination $workspacePath -Recurse -Force
        $count = (Get-ChildItem $workspacePath).Count
        Write-Host "  [$id] $count files" -ForegroundColor Green
    } else {
        Write-Host "  [$id] WARN: no source at $srcPath" -ForegroundColor Yellow
    }
}
Write-Host ""

# --- Step 4: Update openclaw.json directly ---
Write-Host "--- Updating openclaw.json ---" -ForegroundColor Yellow

# Backup first
$backup = "$CONFIG_FILE.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $CONFIG_FILE $backup
Write-Host "Backup: $backup" -ForegroundColor DarkGray

# Load config
$config = Get-Content $CONFIG_FILE -Raw | ConvertFrom-Json

# Get existing agent IDs
$existingIds = @($config.agents.list | ForEach-Object { $_.id })
Write-Host "Existing agents: $($existingIds -join ', ')"

# Add missing agents
$added = @()
foreach ($def in $agentDefs) {
    if ($existingIds -notcontains $def.id) {
        $entry = [PSCustomObject]@{
            id = $def.id
            model = [PSCustomObject]@{
                primary   = $def.model
                fallbacks = $def.fallbacks
            }
        }
        $config.agents.list += $entry
        $added += $def.id
        Write-Host "  + $($def.id)" -ForegroundColor Green
    } else {
        Write-Host "  = $($def.id) already exists, skipped" -ForegroundColor DarkYellow
    }
}

# Save config
$config | ConvertTo-Json -Depth 10 | Set-Content $CONFIG_FILE -Encoding UTF8
Write-Host ""

if ($added.Count -gt 0) {
    Write-Host "Added $($added.Count) agents to openclaw.json" -ForegroundColor Green
} else {
    Write-Host "No new agents added (all already present)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done! Next steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Restart gateway to pick up new agents:"
Write-Host "   openclaw gateway --force"
Write-Host ""
Write-Host "2. Verify:"
Write-Host "   openclaw agents list"
Write-Host "   openclaw status"
Write-Host ""
Write-Host "3. Set up Telegram group bindings per agent:"
Write-Host "   openclaw agents bind AGENT_ID --channel telegram --group GROUP_CHAT_ID"
Write-Host "   Example: openclaw agents bind hr-agent --channel telegram --group -1001234567890"
