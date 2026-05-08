$env:ENTERPRISE_OS_MCP_TOKEN = 'change-this-mcp-service-token'
$env:ENTERPRISE_OS_API_URL = 'https://api.enterpriseos.bond/api'
$env:AGENT_RUNTIME_TYPE = 'claude-code'
$env:CLAUDE_CODE_WORKDIR_ROOT = 'C:\Users\Admin\.openclaw\workspace\repos\deo-enterprise-os'
node scripts/openclaw-claude-runner.js
