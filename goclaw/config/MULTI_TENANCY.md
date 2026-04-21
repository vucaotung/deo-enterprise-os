# GoClaw Multi-Tenancy — Dẹo Enterprise OS

> Hướng dẫn vận hành dựa trên docs.goclaw.sh/multi-tenancy

---

## Deployment Mode: Personal Mode (Single-Tenant)

Dẹo Enterprise OS dùng **Personal Mode** — một tenant duy nhất (master tenant), nhiều users trong cùng công ty. Không cần cấu hình multi-tenant SaaS.

```
Telegram/Zalo users
        ↓
  GoClaw Gateway (Personal Mode)
        ↓
  Master Tenant (UUID: 0193a5b0-7000-7000-8000-000000000001)
        ↓
  Per-user isolation (sessions, memory, context files)
        ↓
  13 Agents
```

---

## ⚠️ CRITICAL: Edition Requirement

**Phải dùng Standard Edition — không phải Lite.**

| Feature | Lite | Standard | Dẹo OS cần |
|---|---|---|---|
| Max agents | **5** | unlimited | **13 agents** |
| Max teams | 1 | unlimited | 1+ |
| Max subagent concurrent | 2 | unlimited | cần > 2 |
| Max subagent depth | **1** | unlimited | **depth 2** (deo → office-agent → researcher-agent) |
| Knowledge graph | ✗ | ✓ | ✓ |
| RBAC | ✗ | ✓ | ✓ |
| Vector search | ✗ | ✓ | ✓ (Vault search) |

**Subagent depth quan trọng:** `deo` → `office-agent` = depth 1. Nếu `office-agent` gọi `researcher-agent` = depth 2. Lite edition sẽ block điều này.

---

## User Identity & Session Isolation

GoClaw không tự authenticate users. Identity được truyền qua `X-GoClaw-User-Id` header.

**Với chat channels (Telegram, Zalo):** GoClaw tự động dùng Telegram user ID làm `user_id`. Mỗi user = session riêng biệt, memory riêng biệt.

**Với API calls từ Enterprise OS backend:**
```bash
curl -X POST http://localhost:3777/v1/chat/completions \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -H "X-GoClaw-User-Id: {eos_user_id}" \
  -H "X-GoClaw-Agent-Id: deo" \
  -H "Content-Type: application/json" \
  -d '{"model": "agent:deo", "messages": [...]}'
```

**Mapping user ID:**
```
Telegram user → X-GoClaw-User-Id: tg_{telegram_user_id}
Zalo user     → X-GoClaw-User-Id: zl_{zalo_user_id}
Web dashboard → X-GoClaw-User-Id: web_{eos_user_id}
Cron/system   → X-GoClaw-User-Id: system
```

---

## What Gets Isolated Per User

| Data | Isolation |
|---|---|
| Sessions & conversation history | Per user per agent per channel |
| Memory (L0/L1/L2) | Per user per agent |
| Context files (USER.md, USER_PREDEFINED.md) | Per user |
| Workspace files | Per agent |
| MCP credentials | Per user (override server-level) |

→ Nhân viên A check-in không ảnh hưởng session của nhân viên B.
→ Sếp dùng `deo` có memory riêng, không lẫn với staff khác dùng agent khác.

---

## Channel Access Control

### Telegram Channel Config (per agent)

| Agent | DM Policy | Group Policy | dm_scope |
|---|---|---|---|
| `deo` | `allowlist` [sếp] | `disabled` | `per-sender` |
| `ops-admin` | `allowlist` [sếp, admin] | `disabled` | `per-sender` |
| `hr-agent` | `allowlist` [all staff] | `allowlist` [HR group] | `per-sender` |
| `finance-agent` | `allowlist` [finance team, sếp] | `disabled` | `per-sender` |
| `crm-agent` | `allowlist` [sales team, sếp] | `allowlist` [sales group] | `per-sender` |
| `it-dev-agent` | `allowlist` [all staff] | `allowlist` [IT group] | `per-sender` |
| `office-agent` | `allowlist` [all staff] | `disabled` | `per-sender` |
| `office-admin-agent` | `allowlist` [all staff] | `allowlist` [admin group] | `per-sender` |
| `marketing-agent` | `allowlist` [marketing, sếp] | `disabled` | `per-sender` |
| `legal-agent` | `allowlist` [management, sếp] | `disabled` | `per-sender` |
| `project-manager-agent` | `allowlist` [project team, sếp] | `allowlist` [project group] | `per-sender` |
| `researcher-agent` | `allowlist` [analysts, sếp] | `disabled` | `per-sender` |
| `dream-agent` | `disabled` | `disabled` | — (cron only) |

**`dm_scope: per-sender`** = mỗi người dùng Telegram có session riêng. Đây là default và đúng cho mọi agent.

### Allowlist setup

Sau khi tạo agent trên dashboard, vào **Channels → Telegram → Edit**:
1. DM Policy: `allowlist`
2. Thêm Telegram user IDs của người được phép
3. Để trống = allow all (không khuyến nghị cho production)

---

## Session Scoping

GoClaw config.json5 — section channels:
```json5
{
  "channels": {
    "telegram": {
      "dm_scope": "per-sender",        // mỗi user có session riêng
      "group_scope": "per-chat",       // mỗi group chat có session riêng
    }
  }
}
```

**`per-sender`** là default và đúng cho Dẹo OS — không cần thay đổi.

---

## API Key Setup

### 1. Gateway Token
Dùng cho: Admin dashboard, system operations, cron jobs.
```bash
# .env.local
GOCLAW_GATEWAY_TOKEN=goclaw_gw_xxxxx
GOCLAW_OWNER_IDS=system,tung  # user IDs có cross-tenant access
```

### 2. Tenant API Key (cho Enterprise OS backend)
Tạo từ Dashboard → Settings → API Keys:
```json
{
  "name": "eos-backend",
  "scopes": ["operator.read", "operator.write"],
  "tenant_id": null  // null = master tenant
}
```

Lưu key vào `.env` của Enterprise OS API:
```bash
GOCLAW_API_KEY=goclaw_sk_xxxxx
GOCLAW_BASE_URL=http://localhost:3777
```

### 3. Cron Jobs (dream-agent)
```bash
# Cron gọi GoClaw với system user
X-GoClaw-User-Id: system
X-GoClaw-Agent-Id: dream-agent
```

---

## Enterprise OS → GoClaw Integration

### MCP Server Pattern

Enterprise OS expose MCP server cho GoClaw:
```
GET  /mcp/tools          # list available tools
POST /mcp/call           # execute tool
```

Auth: Service token (xem ADR-01). GoClaw gọi MCP với service token trong header.

### n8n Webhook → GoClaw

Khi n8n cần trigger GoClaw:
```json
{
  "url": "http://localhost:3777/v1/chat/completions",
  "headers": {
    "Authorization": "Bearer {{GOCLAW_API_KEY}}",
    "X-GoClaw-User-Id": "system",
    "X-GoClaw-Agent-Id": "report-agent"
  }
}
```

---

## Subagent Delegation — Depth Rules

```
deo (depth 0 — top-level)
  └── office-agent (depth 1)
        └── researcher-agent (depth 2) ← cần Standard Edition
  └── crm-agent (depth 1)
        └── marketing-agent (depth 2)  ← cần Standard Edition
  └── project-manager-agent (depth 1)
        └── hr-agent (depth 2)         ← cần Standard Edition
```

**Rule:** Chỉ `deo` và `ops-admin` được khởi tạo delegation chains. Agents chuyên biệt chỉ delegate sang agents khác khi thực sự cần thiết (không phải mọi request).

---

## USER_PREDEFINED.md — Shared User Context

Mỗi predefined agent có `USER_PREDEFINED.md` chứa thông tin chung về users của agent đó. File này shared giữa tất cả users — khác với `USER.md` là per-user.

Template được tạo trong `goclaw/agents/{agent}/USER_PREDEFINED.md`.

---

## Checklist trước khi go-live

- [ ] GoClaw Standard Edition đang chạy (verify: có thể tạo > 5 agents)
- [ ] Gateway token đã set trong `.env.local`
- [ ] `GOCLAW_OWNER_IDS` đã bao gồm user ID của sếp
- [ ] Mỗi Telegram channel đã config allowlist
- [ ] Enterprise OS API key đã tạo và lưu vào `.env`
- [ ] Test: gửi message từ Telegram → verify đúng agent respond
- [ ] Test: gửi message từ 2 user khác nhau → verify session isolated
- [ ] Cron jobs đã test với `X-GoClaw-User-Id: system`
- [ ] MCP server health check: `/health` trả về 200

---

*Ref: docs.goclaw.sh/multi-tenancy | Dẹo Enterprise OS v3.0*
