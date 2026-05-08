$env:ENTERPRISE_OS_MCP_TOKEN = 'change-this-mcp-service-token'
$env:ENTERPRISE_OS_API_URL = 'https://api.enterpriseos.bond/api'
$env:AGENT_RUNTIME_TYPE = 'claude-code'
$env:AGENT_COMPANY_ID = 'b1f6384d-4ac0-40f1-91b9-95b8cfeb0712'
$env:CLAUDE_CODE_COMMAND = 'C:\Users\Admin\.local\bin\claude.exe'
$env:CLAUDE_CODE_WORKDIR_ROOT = 'C:\Users\Admin\.openclaw\workspace\repos\deo-enterprise-os'
node scripts/openclaw-claude-runner.js
