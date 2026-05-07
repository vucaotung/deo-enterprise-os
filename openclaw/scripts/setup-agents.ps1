# setup-agents.ps1
# Adds 12 department agents to OpenClaw for Deo Enterprise OS
# Run from PowerShell: .\setup-agents.ps1
# Prerequisite: openclaw gateway must be running (openclaw gateway --force)

$ErrorActionPreference = "Stop"
$OPENCLAW_STATE = "$env:USERPROFILE\.openclaw"
$REPO_ROOT = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$AGENTS_SRC = "$REPO_ROOT\openclaw\agents"

Write-Host "=== Deo Enterprise OS — Agent Setup ===" -ForegroundColor Cyan
Write-Host "Source: $AGENTS_SRC"
Write-Host "State:  $OPENCLAW_STATE"
Write-Host ""

# Check gateway is running
$health = openclaw health 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: OpenClaw gateway is not running." -ForegroundColor Red
    Write-Host "Start it first: openclaw gateway --force"
    exit 1
}
Write-Host "Gateway: OK" -ForegroundColor Green
Write-Host ""

# Step 1: Update workspace-main with latest deo files
Write-Host "--- Updating main agent (Deo) workspace ---" -ForegroundColor Yellow
$deoSrc = "$AGENTS_SRC\deo"
$deoWorkspace = "$OPENCLAW_STATE\workspace-main"
if (Test-Path $deoSrc) {
    if (-not (Test-Path $deoWorkspace)) {
        New-Item -ItemType Directory -Path $deoWorkspace -Force | Out-Null
    }
    Copy-Item -Path "$deoSrc\*" -Destination $deoWorkspace -Recurse -Force
    Write-Host "main workspace updated from repo" -ForegroundColor Green
} else {
    Write-Host "WARN: $deoSrc not found, skipping" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Get existing agents
$existingRaw = openclaw agents list 2>&1
Write-Host "Current agents: $existingRaw"
Write-Host ""

# Step 3: Add department agents
$agents = @(
    "office-agent",
    "hr-agent",
    "finance-agent",
    "crm-agent",
    "it-dev-agent",
    "office-admin-agent",
    "marketing-agent",
    "legal-agent",
    "project-manager-agent",
    "researcher-agent",
    "dream-agent",
    "ops-admin"
)

foreach ($agentId in $agents) {
    Write-Host "--- $agentId ---" -ForegroundColor Yellow

    # Add agent
    $addOutput = openclaw agents add $agentId 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Added: $addOutput" -ForegroundColor Green
    } else {
        # May already exist
        Write-Host "Note: $addOutput" -ForegroundColor DarkYellow
    }

    # Find workspace path (OpenClaw creates workspace-<id>)
    $workspacePath = "$OPENCLAW_STATE\workspace-$agentId"
    if (-not (Test-Path $workspacePath)) {
        New-Item -ItemType Directory -Path $workspacePath -Force | Out-Null
        Write-Host "Created workspace: $workspacePath" -ForegroundColor Green
    }

    # Copy workspace files from repo
    $srcPath = "$AGENTS_SRC\$agentId"
    if (Test-Path $srcPath) {
        Copy-Item -Path "$srcPath\*" -Destination $workspacePath -Recurse -Force
        $fileCount = (Get-ChildItem $workspacePath).Count
        Write-Host "Workspace files: $fileCount files copied" -ForegroundColor Green
    } else {
        Write-Host "WARN: No source files at $srcPath" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Done! Next steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add model assignments to openclaw.json (agents.list):"
Write-Host "   See: $REPO_ROOT\openclaw\config\openclaw-agents-patch.json"
Write-Host "   Edit: $OPENCLAW_STATE\openclaw.json"
Write-Host ""
Write-Host "2. Enable cron in openclaw.json:"
Write-Host '   Set: "cron": { "enabled": true }'
Write-Host ""
Write-Host "3. Restart gateway to pick up new agents:"
Write-Host "   openclaw gateway --force"
Write-Host ""
Write-Host "4. Verify agents loaded:"
Write-Host "   openclaw agents list"
Write-Host "   openclaw status"
Write-Host ""
Write-Host "5. Set up Telegram group bindings:"
Write-Host "   openclaw agents bind <agent-id> --channel telegram --group <group-id>"
Write-Host "   Example: openclaw agents bind hr-agent --channel telegram --group -1001234567890"
Write-Host ""
Write-Host "6. Check security warnings:"
Write-Host "   openclaw security audit"
