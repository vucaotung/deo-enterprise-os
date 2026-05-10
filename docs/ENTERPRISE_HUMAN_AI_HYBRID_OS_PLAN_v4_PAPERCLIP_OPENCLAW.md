# Kế hoạch: DEO Enterprise OS × Paperclip — Fork Strategy v4

## Context

DEO Enterprise OS đang ở milestone v3.0.0 (12 ADR đã chốt, Phase 0 chưa start) với production v0.2.3 chạy nhỏ/internal. Bottleneck lớn nhất là **agent orchestration layer (GoClaw)** — phần phức tạp nhất, đắt nhất để tự build. Đồng thời codebase có nhiều tech debt (no tests, no CI/CD, source-of-truth fragmentation, agent-jobs route P0 broken).

**Paperclip** (github.com/paperclipai/paperclip — MIT, 62k stars, mature) cung cấp đúng layer DEO đang đau: orchestration + governance + budget + audit + multi-tenancy + heartbeat + adapter pattern. Cùng tech stack (TS/Node/React/Postgres) → integrate được.

**Quyết định của user (cập nhật):**
1. Fork Paperclip làm nền (orchestration core)
2. Cân bằng — modular: Paperclip cho generic, DEO tự build VN-specific
3. Ưu tiên giải quyết agent layer trước
4. v0.2.3: chạy song song, cutover sau khi feature parity
5. **🆕 Bỏ GoClaw — quay lại OpenClaw upstream** (giảm fork debt, dùng `openclaw_gateway` adapter native của Paperclip)
6. **🆕 Channels Telegram + Zalo + WhatsApp chạy trong OpenClaw** (như skill/tool của agent), không phải plugin Paperclip riêng
7. **🆕 n8n chỉ dùng cho workflow cứng** (ETL, sync system, không phải driver cho AI)
8. **🆕 Paperclip deploy trên VPS Docker** (production), local Docker chỉ cho dev

**Kết quả mong muốn:** v4 với Paperclip core (orchestration + UI + scheduler) + OpenClaw runtime (agent execution + VN channels) + DEO domain modules (CRM/HR/Finance/Attendance) trên schema riêng + n8n cho workflow tĩnh. Tiết kiệm ước tính 12-16 tuần engineering vs build từ đầu theo plan v3.

---

## Paperclip — features dùng ngay (không cần code), theo nhu cầu Enterprise OS

> Nguồn: docs.paperclip.ing + paperclip GitHub. Phân loại:
> ✅ **READY** = cài + click UI là chạy
> ⚙️ **CONFIG-ONLY** = chỉ set env/yaml/secret, không viết code
> 🔧 **CODE MỎNG** = wrapper/plugin nhỏ (vài trăm LoC)
> ❌ **CUSTOM BUILD** = phải tự xây toàn bộ

### A. Foundation kernel (Phase 0 của DEO) → 90% dùng ngay

| Nhu cầu DEO Phase 0 | Paperclip out-of-box | Mức độ |
|---|---|---|
| Login admin + user management | Trang login, board users, invite flow, JWT short-lived run token, agent API key | ✅ READY |
| Multi-tenancy (company_id mọi entity) | Company entity native — mỗi company isolated data + agents + budget | ✅ READY |
| Project/Task CRUD | Issues page (Jira-like), lifecycle `backlog → todo → in_progress → in_review → done`, blocked/cancelled, atomic checkout chống double-work | ✅ READY |
| Dashboard summary | Trang Dashboard mặc định: agent roster, active tasks, budget, recent activity | ✅ READY |
| Audit trail | Activity Log UI — mọi mutating action + heartbeat + cost event + approval đều log durable | ✅ READY |
| Health/observability | /health endpoint, structured logging, transcript per heartbeat | ✅ READY |
| Schema migration | Postgres migration framework có sẵn (pnpm db:generate) | ✅ READY |
| Test stack | Vitest + Playwright preconfigured | ✅ READY |
| Docker Compose deploy | docker/ folder + scripts có sẵn | ✅ READY |
| Backup/restore | CLI `companies.sh export/import` — backup-restore-a-company guide | ✅ READY |
| Secrets management | Secrets UI (instance + company-scoped), encrypted storage | ✅ READY |

**→ Phase 0 Checklist v2 của DEO (~200 task) chỉ còn lại ~20 task thật sự cần làm** (rebrand, set company name "Dẹo", config Vietnam timezone, hook DEO domain Vietnamese strings).

### B. Agent layer (Phase 1 — bottleneck lớn nhất của DEO) → dùng ngay 80%

| Nhu cầu | Paperclip out-of-box | Mức độ |
|---|---|---|
| Agent registry (15+ agents: deo, crm-agent, hr-agent...) | Agents page — hire/configure/monitor từng agent qua UI | ✅ READY |
| Agent hierarchy (CEO → managers → workers) | Org Structure + Delegation — strict hierarchy với 1 manager mỗi agent | ✅ READY |
| Agent có manager + budget riêng | Built-in: mỗi agent có monthly budget, role, manager assignment | ✅ READY |
| Heartbeat / cron / scheduled wake-up | Heartbeats — trigger qua schedule / task assignment / @-mention / manual / approval resolution | ✅ READY |
| Run history + transcript per agent | Mỗi heartbeat log full transcript — agent detail page có run history viewer | ✅ READY |
| Skill library (SKILL.md) | Skills page — tạo skill qua UI (name/description/prompt), assign tới agent. Map 1-1 với SKILL.md hiện có của DEO | ✅ READY |
| MCP tool integration | Built-in: "Add an MCP Server to an Agent" how-to guide. stdio/SSE/HTTP support | ⚙️ CONFIG-ONLY |
| Claude Code adapter | `claude_local` adapter — Claude Code + ANTHROPIC_API_KEY env var | ⚙️ CONFIG-ONLY |
| **Tích hợp GoClaw (OpenClaw)** | **Adapter `openclaw_gateway` chính thức** — invite prompt qua UI, paste vào OpenClaw, approve hire. WebSocket native | ⚙️ CONFIG-ONLY |
| HTTP webhook agent | Adapter HTTP webhook — POST wake context → service trả 2xx | ⚙️ CONFIG-ONLY |
| Custom polling script | Pull-mode adapter — bearer API key + polling | ⚙️ CONFIG-ONLY |
| Agent budget enforcement (hard stop) | Built-in: overspend pause agent + cancel queued work tự động | ✅ READY |
| Agent permissions (RBAC) | Built-in: board users, agent API keys scoped, run JWT | ⚙️ CONFIG-ONLY |

**→ GoClaw không cần rebuild: chỉ cần connect qua OpenClaw adapter có sẵn.** Đây là điểm đau số 1 của DEO mà Paperclip giải quyết zero-code.

### C. Governance & operations → dùng ngay 100%

| Nhu cầu | Paperclip out-of-box | Mức độ |
|---|---|---|
| Approval workflow (board approve trước khi hire / spend) | Trang Approvals — review/approve/reject qua UI hoặc API. Built-in flow `hire_agent`, config changes, action approval | ✅ READY |
| Budget tracking (token, cost) per company/agent/project/model | Trang Costs & Budgets — chart real-time, threshold warning, hard-stop | ✅ READY |
| Cost events log | Built-in cost event audit log | ✅ READY |
| Execution Policy (review/approve stage) | Power feature — policy editor UI, no code | ✅ READY |
| Activity Log (immutable audit) | Day-to-day Activity Log với actor/action/timestamp/correlation | ✅ READY |
| Feedback & Voting | Built-in (cho dùng để vote outcome agent work) | ✅ READY |
| Export/Import company portability | CLI + UI export entire company (agents/skills/projects/routines/issues) — secret scrubbing + collision handling | ✅ READY |

**→ Toàn bộ ADR-08 (observability) + audit + approval — DEO không cần code 1 dòng.**

### D. Routines & integration → dùng ngay 70%

| Nhu cầu | Paperclip out-of-box | Mức độ |
|---|---|---|
| Cron / heartbeat schedule | Routines page — cron expression editor, trigger type (cron/webhook/API) | ✅ READY |
| Webhook trigger | Built-in routine trigger | ⚙️ CONFIG-ONLY |
| GitHub integration | "Connect an Agent to GitHub" how-to | ⚙️ CONFIG-ONLY |
| Slack / Discord notifications | "Wire Slack/Discord Notifications" how-to | ⚙️ CONFIG-ONLY |
| Workflow engine phức tạp (n8n) | Out of scope — phải gọi qua webhook routine | 🔧 CODE MỎNG |
| Google Drive | Không native — cần plugin | 🔧 CODE MỎNG (plugin) |
| **Telegram / Zalo / WhatsApp** | **Không native** — cần build channel adapter | 🔧 CODE MỎNG (plugin) |
| Email gateway | Không native | 🔧 CODE MỎNG |

### E. Workspace & runtime → dùng ngay 100%

| Nhu cầu | Paperclip out-of-box | Mức độ |
|---|---|---|
| Project workspace isolation | Workspace browser UI — git branches, file structure, preview | ✅ READY |
| Git worktree per agent | Built-in: agents work in isolated git worktrees + operator branches | ✅ READY |
| Dev server + preview URL | Built-in runtime services UI | ✅ READY |
| Goal tracking | Goals page — break company goal → tasks | ✅ READY |
| Terminal setup | Power feature — terminal config UI | ✅ READY |

### F. Domain modules VN (CRM/HR/Finance/Attendance) → 0% — phải tự build

| Module | Paperclip có | Cách build |
|---|---|---|
| CRM (leads, deals, clients, expenses) | ❌ Không | ❌ CUSTOM BUILD trong schema `deo_biz` (port từ DEO v3 hiện tại) |
| HR (users, org, leave) | Một phần (Org chart cho agents — nhưng không cho human employees) | ❌ CUSTOM BUILD (separate from agents) |
| Finance (expense, invoice, budget) | Có Budget cho AI cost — không có invoice/expense biz | ❌ CUSTOM BUILD |
| Attendance (checkin, shifts) | ❌ Không | ❌ CUSTOM BUILD |
| Knowledge Vault | Skills library tương đương | 🔧 CODE MỎNG (plugin gọi Drive) |
| Vietnamese channels | ❌ Không | 🔧 CODE MỎNG (3 plugin) |

**→ Đây là phần value-add Vietnamese SMB của DEO. Paperclip không thay thế — chỉ giải phóng năng lực để DEO tập trung vào đây.**

---

## Tổng kết "không cần code quá nhiều"

**Cài + cấu hình là chạy ngay (~70% feature DEO Phase 0-3 cần):**
1. `npx paperclipai onboard --yes` — bootstrap Paperclip + embedded Postgres
2. Tạo Company "Dẹo Enterprise" qua UI
3. Hire CEO agent với adapter `claude_local` (Claude Code) hoặc `openclaw_gateway` (kết nối GoClaw hiện tại) — chỉ điền form
4. Add các agents khác qua UI (crm-agent, finance-agent, hr-agent...) hoặc import qua YAML
5. Tạo Skills cho từng agent (paste content từ DEO `goclaw/skills/*.md` hiện tại)
6. Set Routines (cron) cho daily standup, dream cycle, knowledge sync — qua UI
7. Set Budget per agent — qua UI
8. Configure Slack/Discord notification — theo how-to guide
9. Add MCP server cho agent (DEO biz API là MCP server) — theo how-to guide
10. Setup Approval Policy cho hire/spend/risky action — qua UI
→ **0 dòng code mới**. Có ngay: dashboard, issues, approvals, budget, activity log, agent management, skills, routines, workspaces, secrets, export/import.

**Phải code mỏng (~3-4 plugin, ước tính 1500-3000 LoC):**
- `channel-telegram` plugin (HTTP webhook adapter wrapper) — ~500 LoC
- `channel-zalo` plugin — ~500 LoC
- `channel-whatsapp` plugin — ~500 LoC
- `storage-google-drive` plugin (cho Knowledge Vault) — ~800 LoC
- `workflow-n8n` bridge (webhook routine wrapper) — ~200 LoC

**Phải custom build (DEO Domain — không tránh được):**
- biz-api: CRM + HR + Finance + Attendance routes/services (port từ DEO hiện tại) — schema `deo_biz`
- biz-web: domain pages (port từ apps/web hiện tại)
- Migration script v0.2.3 → v4

**Ước tính effort sau khi tận dụng Paperclip:**
- Phase 0 (Foundation): từ 6-8 tuần → **1-2 tuần** (chỉ rebrand + onboard)
- Phase 1 (Agent layer): từ 8-12 tuần → **2-3 tuần** (config OpenClaw adapter + skill import)
- Phase 2 (Channel + Drive + n8n): **3-4 tuần plugin code mỏng**
- Phase 3-7 (CRM/HR/Finance/Attendance): không thay đổi, vẫn ~16-20 tuần (đây là biz logic độc nhất của DEO)

**Tổng tiết kiệm: ~12-16 tuần engineering** (3-4 tháng) chỉ riêng Phase 0+1.

---

## Architecture đích (v4 — drop GoClaw, dùng OpenClaw upstream)

```
       Web Admin (Paperclip UI)        Web BizApp (DEO)
              │                                │
              │   HTTPS                        │  HTTPS
              ▼                                ▼
┌────────────────────────────────────────────────────────────┐
│ VPS PROD (Docker Compose)                                  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ PAPERCLIP CORE (forked) — SCHEDULER & CONTROL PLANE │ │
│  │  Identity • Companies • Org/Agents • Work/Issues    │ │
│  │  ✦ Heartbeat scheduler (timer/assignment/manual)    │ │
│  │  ✦ Routines (cron + webhook trigger)                │ │
│  │  Governance • Approvals • Budget • Activity Log     │ │
│  │  Secrets • Workspaces • Export/Import • Plugins     │ │
│  └────┬───────────────────────────┬─────────────────────┘ │
│       │ ws://openclaw:18789       │ HTTP                  │
│       │ (openclaw_gateway adapter)│ (MCP / REST)          │
│       ▼                           ▼                       │
│  ┌──────────────────────────┐  ┌────────────────────────┐ │
│  │ OPENCLAW (upstream)      │  │ DEO BIZ-API            │ │
│  │ — RUNTIME ONLY           │  │ (schema deo_biz)       │ │
│  │ ✦ Agent execution        │  │ CRM • HR • Finance     │ │
│  │ ✦ Channel skills:        │  │ Attendance • Knowledge │ │
│  │   - Telegram bot         │  │                        │ │
│  │   - Zalo OA              │  │ Exposed as MCP server  │ │
│  │   - WhatsApp Cloud       │  │ for Paperclip agents   │ │
│  │ ✦ Tool/skill library     │  └────────────────────────┘ │
│  │ ⚠ NO internal scheduler  │                             │
│  │   (Paperclip drives all) │                             │
│  └──────────────────────────┘                             │
│                                                            │
│  ┌──────────┐  ┌────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Postgres │  │ Redis  │  │ Caddy/   │  │ n8n         │  │
│  │ (shared) │  │        │  │ nginx    │  │ (workflow   │  │
│  │          │  │        │  │ TLS+vhost│  │  cứng only) │  │
│  └──────────┘  └────────┘  └──────────┘  └─────────────┘  │
└──────────────────┬─────────────────────────────────────────┘
                   │ HTTPS public
        ┌──────────┴───────────────────────────────┐
        │                                          │
   Telegram/Zalo/WhatsApp                    Google Drive
   webhooks → OpenClaw                       (OAuth)
   (channels skill receives)
```

**Đổi mới so với plan trước:**
1. **Bỏ GoClaw**, quay về OpenClaw upstream → giảm fork debt, dùng được `openclaw_gateway` adapter native của Paperclip không cần code adapter
2. **Channels (Telegram/Zalo/WhatsApp) chuyển từ Paperclip plugin → OpenClaw skill** — tận dụng OpenClaw có sẵn HTTP/webhook tooling, agent gọi như tool
3. **n8n thu hẹp scope** — chỉ chạy workflow tĩnh (Drive ETL, weekly report job, sync external system). Không drive AI work
4. **Deployment**: VPS Docker production + Local Docker dev (xem section "Deployment topology" bên dưới)

---

## OpenClaw — CAPABILITIES CONFIRMED (đọc kỹ docs.openclaw.ai)

> Phát hiện quan trọng: OpenClaw **mạnh hơn nhiều** so với assumption ban đầu. Nó không chỉ là "agent runtime" mà là full multi-channel/multi-agent/multi-provider gateway. Plan v4 phải re-balance trách nhiệm Paperclip ↔ OpenClaw.

### 1. Multi-provider PER-AGENT — **native, đầy đủ hơn GoClaw**

OpenClaw cho phép mỗi agent chọn model + provider riêng qua `agents.list[].model`:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.5", "google/gemini-2-pro"]
      }
    },
    list: [
      { id: "ceo",           model: { primary: "anthropic/claude-opus-4-6" } },
      { id: "crm-agent",     model: { primary: "openai/gpt-5.5" } },
      { id: "finance-agent", model: { primary: "google/gemini-2-pro", fallbacks: ["anthropic/claude-sonnet-4-6"] } },
      { id: "knowledge",     model: { primary: "opencode/claude-sonnet-4-6" } },
      { id: "support",       model: { primary: "openai/gpt-5.4-mini" } }
    ]
  }
}
```

Per agent có **đầy đủ isolation**:
- ✅ Workspace riêng (`~/.openclaw/agents/<agentId>/`)
- ✅ Auth profile riêng (`auth-profiles.json` per agent — API key + OAuth không cross-talk)
- ✅ Session store riêng (chat history isolated)
- ✅ Skills allowlist riêng (`agents.list[].skills`)
- ✅ Model + fallback chain riêng
- ✅ Memory store riêng (per-agent `MEMORY.md` + `memory/YYYY-MM-DD.md`)

**Built-in providers** (no extra config):
- `openai` (GPT 5.5, 5.4-mini)
- `anthropic` (Claude Opus 4.6, Sonnet 4.6)
- `openai-codex` (Codex OAuth)
- `opencode` / `opencode-go` (Zen + Go runtimes)
- `google` (Gemini)
- `glm` (Z.AI)
- `minimax`
- `qwen` (Alibaba DashScope)
- Local: `claude-cli`, `codex-cli`, `google-gemini-cli`, Ollama via local-models

**Auto-features cho mỗi provider:**
- API key rotation (`<PROVIDER>_API_KEYS` list, hoặc `_API_KEY_1`, `_2`...)
- Rate-limit cooldown (1m → 5m → 25m → 1h exponential backoff)
- Billing-disable detection
- OAuth refresh token auto
- Per-model context window override
- Per-model `fastMode`, `serviceTier`, `transport` config

**→ Xác nhận: OpenClaw đáp ứng đầy đủ và nhiều hơn nhu cầu "bind provider khác nhau cho agent khác nhau" của GoClaw.**

### 2. Channels VIỆT NAM — **bundled plugins NATIVE, 0 code**

OpenClaw ship sẵn các channel quan trọng cho VN market:

| Channel | OpenClaw native | Setup | Chú thích |
|---|---|---|---|
| **Telegram** | ✅ Bundled | `TELEGRAM_BOT_TOKEN` env | DM + groups |
| **Zalo (Marketplace bot)** | ✅ Bundled | `ZALO_BOT_TOKEN` env | DM only, pairing default |
| **Zalo personal** | ✅ Bundled | `openclaw channels login --channel zalouser` | Cho cá nhân |
| **WhatsApp** | ✅ Bundled | `openclaw channels login --channel whatsapp` | Phone link |
| Discord | ✅ Bundled | Bot token | DM + group |
| Slack | ✅ Bundled | Bot token | Workspace |
| Microsoft Teams | ✅ Bundled | OAuth | Enterprise |
| Google Chat | ✅ Bundled | Bot token | |
| iMessage | ✅ Bundled (BlueBubbles) | macOS bridge | |
| Matrix | ✅ Bundled | Server URL | Federation |
| Signal | ✅ Bundled | QR pair | E2E |
| Feishu, LINE, WeChat, Mattermost, IRC, Twitch, Nostr, QQ, Synology, Yuanbao | ✅ Bundled | | |

→ **Bỏ hoàn toàn ý tưởng build "channel-telegram skill" hay "channel-zalo plugin"** — OpenClaw đã có sẵn.

Config ví dụ Zalo:
```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: { botToken: "12345689:abc-xyz", dmPolicy: "pairing" }
      }
    }
  }
}
```

### 3. Memory engines — **4 backend, 0 code**

OpenClaw có sẵn 4 memory backend:

| Backend | Khi dùng | Built-in tools |
|---|---|---|
| **builtin** (default) | SQLite, keyword + vector + hybrid search | `memory_search`, `memory_get` |
| **QMD** | Local-first sidecar, reranking, query expansion, index ngoài workspace | Same |
| **Honcho** | AI-native cross-session, user modeling, multi-agent awareness | Same + plugin tools |
| **LanceDB** | Vector store, OpenAI embeddings, auto-recall, auto-capture, Ollama support | Same |
| Memory Wiki (companion) | Knowledge base với claims/evidence/dashboards | `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint` |

File structure mỗi agent:
- `MEMORY.md` — long-term durable
- `memory/YYYY-MM-DD.md` — daily notes
- `DREAMS.md` — dream diary
- `SOUL.md` — personality
- `AGENTS.md`, `USER.md`, `IDENTITY.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `TOOLS.md` — bootstrap context

→ **Map L0/L1/L2 của GoClaw**: dùng OpenClaw memory builtin (L0=session, L1=daily, L2=MEMORY.md). Không cần re-implement.

### 4. Dreaming NATIVE

OpenClaw có concept `dreaming` built-in (trước GoClaw):

- 3 phase: **Light** (stage candidates) → **Deep** (promote to MEMORY.md) → **REM** (themes, reflection)
- Background memory consolidation
- Dream Diary trong `DREAMS.md`
- Grounded historical backfill cho recovery
- Per-agent + per-channel scoping
- Opt-in (default disabled)

→ **Bỏ ý tưởng giữ "GoClaw dream cycle"** — OpenClaw có sẵn, dùng native.

### 5. Skills + SOUL.md NATIVE

- `concepts/soul.md` — personality guide qua `SOUL.md`
- `cli/skills.md` — skill management
- Skills loaded từ:
  - Per-agent workspace
  - Shared root `~/.openclaw/skills`
  - Filtered bằng `agents.list[].skills` allowlist hoặc default

→ Map `goclaw/skills/*.md` của DEO sang OpenClaw skill format trực tiếp.

### 6. Cron / Automation — **DRIFT RISK CAO**

OpenClaw có scheduler nội bộ rất mạnh — đây chính là điểm phải tắt khi dùng làm Paperclip gateway:

| OpenClaw automation feature | Trạng thái khi dùng với Paperclip |
|---|---|
| `cron-jobs.md` — built-in scheduler (`--at`, `--every`, `--cron`) | ❌ **TẮT** |
| `standing-orders.md` — recurring orders | ❌ **TẮT** |
| `taskflow.md` — task flow automation | ❌ **TẮT** |
| `tasks.md` — background tasks | ❌ **TẮT** |
| `hooks.md` — event hooks (channel inbound, etc.) | ✅ **GIỮ** (chỉ event-driven, không scheduler) |
| `gateway/heartbeat.md` — gateway heartbeat | ✅ **GIỮ** (only WebSocket keep-alive, không phải agent wake) |

**Tất cả schedule** (daily standup, dream cycle, knowledge sync, report) → chuyển sang Paperclip Routines.

### 7. Multi-channel multi-account NATIVE

OpenClaw hỗ trợ nhiều account cho cùng 1 channel:
```json5
channels: {
  whatsapp: {
    accounts: {
      sales: { phoneNumber: "+8490..." },
      support: { phoneNumber: "+8491..." }
    }
  }
}
bindings: [
  { agentId: "sales-agent", match: { channel: "whatsapp", account: "sales" } },
  { agentId: "support-agent", match: { channel: "whatsapp", account: "support" } }
]
```

→ Multi-tenancy DEO: mỗi company của Paperclip có thể có WhatsApp/Telegram/Zalo bot riêng, route qua `bindings`.

---

## Re-balance Paperclip ↔ OpenClaw responsibilities (CRITICAL)

Vì OpenClaw mạnh hơn dự kiến, nhiều capability trùng nhau với Paperclip. Phải định rõ "single source of truth" cho từng function để tránh drift:

| Function | Owner | Lý do | Bên còn lại |
|---|---|---|---|
| **Schedule / Cron** | Paperclip | UI Routine + governance | OpenClaw cron TẮT hoàn toàn |
| **Standing orders** | Paperclip Routine | UI thân thiện cho non-tech | OpenClaw standing-orders TẮT |
| **Background tasks** | Paperclip Issue | Audit + assignee + lifecycle | OpenClaw background tasks TẮT |
| **Channels inbound (Telegram/Zalo/WhatsApp)** | OpenClaw | NATIVE bundled plugins | Paperclip nhận event qua webhook hook |
| **Channels outbound (reply)** | OpenClaw | Native + idempotent | Paperclip ra lệnh qua adapter |
| **Multi-provider per agent** | OpenClaw | NATIVE `agents.list[].model` | Paperclip Org Chart sync agent registry |
| **API key + OAuth rotation** | OpenClaw | NATIVE auth profiles | Paperclip Secrets cho company-level secrets |
| **Memory L0/L1/L2** | OpenClaw | builtin/qmd/honcho engines | Paperclip Activity Log refer được |
| **Dreaming** | OpenClaw | NATIVE 3-phase | Paperclip Routine có thể trigger dream sweep |
| **Skills (SKILL.md)** | OpenClaw | NATIVE per-agent | Paperclip Skills UI = catalog view (read-only sync) |
| **SOUL.md / personality** | OpenClaw | NATIVE | — |
| **Workspace per agent** | OpenClaw | NATIVE `agentDir` | Paperclip Workspace UI = view-only |
| **Hooks (channel event)** | OpenClaw | NATIVE | Paperclip nhận via API call |
| **MCP server access** | Both | OpenClaw `cli/mcp` + Paperclip MCP config | DEO biz-api expose MCP, agents 2 bên đều dùng được |
| **Approvals UI** | Paperclip | Board UI cho human governance | OpenClaw không có UI approval |
| **Budget tracking dashboard** | Paperclip | UI + hard-stop | OpenClaw `usage-tracking` chạy nội bộ, sync data về Paperclip |
| **Issues / Tasks board** | Paperclip | Jira-like UI | OpenClaw nhận issue qua adapter request |
| **Multi-tenant Company** | Paperclip | NATIVE `Company` entity | OpenClaw multi-agent maps 1:1 với Company |
| **Activity Log + Audit** | Paperclip | UI compliance | OpenClaw run history sync về Activity |
| **Identity / Login (human)** | Paperclip | NATIVE board users | OpenClaw không có human-board |
| **Org chart hierarchy** | Paperclip | NATIVE strict tree | OpenClaw agent list flat — Paperclip giữ hierarchy metadata |
| **Export/Import company** | Paperclip | NATIVE `companies.sh` | OpenClaw `cli/backup` cho per-agent backup |

---

## Architecture điều chỉnh (sau khi re-balance)

```
                Web Admin (Paperclip UI)        Web BizApp (DEO)
                       │                                │
                       ▼                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ VPS PROD                                                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PAPERCLIP CORE — HUMAN CONTROL PLANE                        │ │
│  │  ✦ Multi-tenant Company + Org Chart hierarchy              │ │
│  │  ✦ Issues board (Jira-like)                                │ │
│  │  ✦ Routines (cron) — SINGLE SCHEDULER                      │ │
│  │  ✦ Approvals UI + Budget dashboard + Activity Log          │ │
│  │  ✦ Identity/board users (human login)                      │ │
│  │  ✦ Heartbeat → openclaw_gateway adapter                    │ │
│  └──────┬─────────────────────────────────┬────────────────────┘ │
│         │ ws://openclaw:18789             │ HTTP/MCP              │
│         ▼                                 ▼                        │
│  ┌────────────────────────────────┐  ┌────────────────────────┐  │
│  │ OPENCLAW — AI EXECUTION PLANE  │  │ DEO BIZ-API (MCP svr)  │  │
│  │  ✦ Multi-agent (per-agent      │  │  CRM • HR • Finance    │  │
│  │    model/auth/skills/memory)   │  │  Attendance • Knowl.   │  │
│  │  ✦ Native channels:            │  │  Schema: deo_biz       │  │
│  │    Telegram/Zalo/WhatsApp/etc. │  └────────────────────────┘  │
│  │  ✦ Memory engines (builtin/    │                              │
│  │    qmd/honcho/lancedb)         │                              │
│  │  ✦ Dreaming (3-phase)          │                              │
│  │  ✦ Skills + SOUL.md per agent  │                              │
│  │  ✦ Multi-provider failover     │                              │
│  │  ⚠ Cron/standing-orders/tasks  │                              │
│  │    automation = OFF            │                              │
│  └────────────────────────────────┘                              │
│                                                                  │
│  ┌──────────┐  ┌────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Postgres │  │ Redis  │  │ Caddy    │  │ n8n (workflow     │  │
│  │ +schemas │  │        │  │ TLS+vhost│  │  cứng — ETL only) │  │
│  └──────────┘  └────────┘  └──────────┘  └───────────────────┘  │
└──────┬───────────────────────────────────────────┬───────────────┘
       │ HTTPS                                     │
   Telegram Bot API                          Google Drive (OAuth)
   Zalo Bot/OA API                           Bank/Invoice API
   WhatsApp Cloud API                        Anthropic / OpenAI / Gemini
   (inbound + outbound qua OpenClaw native)
```

### Luồng channel inbound (CRITICAL)

**Khi user nhắn Telegram/Zalo bot:**
1. OpenClaw native channel plugin nhận message
2. OpenClaw hook (`channels/<channel>` → `hooks` config) gọi Paperclip API:
   - `POST /api/companies/{companyId}/issues` tạo Issue mới với:
     - `title`: trích từ message
     - `assigneeAgentId`: agent đã bind qua `bindings` config
     - `metadata.channel`: telegram/zalo
     - `metadata.peer`: sender info
3. Paperclip nhận → trigger Heartbeat → gọi `openclaw_gateway` adapter
4. OpenClaw nhận `req agent` → chạy turn → reply qua channel native (Telegram Bot API send)
5. OpenClaw return transcript → Paperclip Activity Log + Issue status update

**Lợi của flow này**: 
- ✅ Channel logic 100% trong OpenClaw (dùng plugin native)
- ✅ Governance/budget/audit trong Paperclip
- ✅ Schedule chỉ Paperclip (zero drift)
- ✅ Multi-agent: 1 OpenClaw gateway, n agents, mỗi agent có model/skill/memory riêng

### Cron drift prevention (cập nhật chi tiết hơn)

Config OpenClaw bắt buộc khi chạy gateway-only mode:

```json5
// ~/.openclaw/openclaw.json
{
  // Tắt mọi nguồn schedule nội bộ
  automation: {
    cron: { enabled: false },
    standingOrders: { enabled: false },
    taskflow: { enabled: false },
    backgroundTasks: { enabled: false }
  },
  // Tắt heartbeat tự thức (chỉ giữ WebSocket keep-alive)
  gateway: {
    heartbeat: { mode: "keepalive-only" }
  },
  // Hooks GIỮ — vì cần để channel inbound trigger Paperclip
  hooks: {
    enabled: true,
    onChannelMessage: {
      type: "http",
      url: "http://paperclip:3000/api/internal/channel-event",
      authToken: "${PAPERCLIP_INTERNAL_TOKEN}"
    }
  },
  // Dreaming: GIỮ nhưng chỉ trigger qua Paperclip Routine, không tự cron
  dreaming: { enabled: true, autoSchedule: false },
  // Multi-agent isolation
  agents: {
    list: [...]
  },
  // Channels native
  channels: {
    telegram: { enabled: true, ... },
    zalo: { enabled: true, ... },
    whatsapp: { enabled: true, ... }
  }
}
```

**Verification commands** sau khi deploy:
```bash
# Confirm không có cron job nội bộ
docker exec openclaw openclaw cron list  # → empty
docker exec openclaw openclaw tasks list # → only PAPERCLIP-triggered

# Confirm hooks chỉ event-driven
docker exec openclaw openclaw hooks list # → only onChannelMessage, no scheduled
```

### Drift detection (runtime)

- Mọi heartbeat phải có `runId` (Paperclip generate) đính kèm `idempotencyKey` qua adapter
- OpenClaw từ chối execute nếu request không có `runId` hợp lệ → đảm bảo không có path nào bypass Paperclip
- Activity Log của Paperclip ghi mọi run; nếu có execution OpenClaw không tương ứng row Activity → drift detected → alert

### n8n drift prevention

- n8n KHÔNG được trigger Paperclip agent trực tiếp → mọi trigger từ n8n phải đi qua **Paperclip Routine webhook** (signed URL)
- n8n cron chỉ dùng cho ETL không-AI (Drive sync, report export, system backup)
- Khi n8n cần AI: tạo Issue qua Paperclip API (`POST /api/companies/.../issues` với `assigneeAgentId`) → Paperclip wake agent qua adapter → OpenClaw execute → no drift

### Tóm tắt 1 dòng

> **Paperclip = scheduler + governance. OpenClaw = channels + agent runtime + memory. n8n = ETL không-AI. 3 không tự gọi nhau bypass Paperclip schedule.**

---

## Deployment topology

### Production: VPS Docker (recommended)

**1 VPS duy nhất** cho khởi đầu (~4-8 vCPU, 16-32GB RAM, 200GB SSD):

```yaml
# docker-compose.deo.yml (production)
services:
  caddy:                    # TLS terminate + vhost route
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes: [./Caddyfile, caddy_data]

  paperclip:                # Paperclip core (UI + API + scheduler)
    image: deo-os-v4:latest # forked + rebranded
    environment:
      - DATABASE_URL=postgres://...@postgres/paperclip
      - PUBLIC_URL=https://os.deo.vn
    depends_on: [postgres, redis]

  openclaw:                 # OpenClaw runtime (gateway-only)
    image: openclaw:latest  # upstream image
    environment:
      - OPENCLAW_MODE=gateway-only
      - OPENCLAW_GATEWAY_TOKEN_FILE=/run/secrets/openclaw_token
      - ANTHROPIC_API_KEY_FILE=/run/secrets/anthropic
      - TELEGRAM_BOT_TOKEN_FILE=/run/secrets/tg
      - ZALO_OA_TOKEN_FILE=/run/secrets/zalo
    networks: [internal]    # KHÔNG expose ra public

  biz-api:                  # DEO domain API
    image: deo-biz-api:latest
    environment:
      - DATABASE_URL=postgres://...@postgres/deo_biz
      - PAPERCLIP_API_URL=http://paperclip:3000
    depends_on: [postgres]

  postgres:
    image: postgres:16
    volumes: [pg_data]
    # 2 schema trên 1 DB: paperclip, deo_biz
    # backup nightly via pg_dump cron host

  redis:
    image: redis:7

  n8n:                      # workflow tĩnh only
    image: n8nio/n8n:latest
    environment:
      - WEBHOOK_URL=https://n8n.deo.vn
    networks: [internal, public]

networks:
  internal:                 # paperclip ↔ openclaw ↔ biz-api ↔ postgres
  public:
```

Caddyfile public routing:
```
os.deo.vn        → paperclip:3000      # admin UI + API
app.deo.vn       → biz-web:80          # DEO biz frontend
api.deo.vn       → biz-api:4000        # biz REST API
n8n.deo.vn       → n8n:5678
hooks.deo.vn     → openclaw:8080       # Telegram/Zalo webhook in
```

### Network rules

- OpenClaw gateway port (18789) **KHÔNG** expose public — chỉ Paperclip container reach qua docker network `internal`
- Telegram/Zalo/WhatsApp webhook in → Caddy → OpenClaw HTTP receiver (skill xử lý)
- Postgres & Redis **KHÔNG** expose public

### Dev: Local Docker

`pnpm smoke:openclaw-docker-ui` của Paperclip có sẵn — bootstrap toàn bộ stack local trong vài lệnh:
- Embedded Postgres (Paperclip mặc định)
- OpenClaw Docker với `OPENCLAW_DISABLE_DEVICE_AUTH=1` (chỉ dev)
- Hot reload server + UI
- Dev seed data

### VPS specs gợi ý

| Tier | vCPU | RAM | SSD | Use case |
|---|---|---|---|---|
| Dev/staging | 2 | 8GB | 80GB | 1-2 user test |
| Prod khởi đầu | 4 | 16GB | 200GB | <50 user, <10 agent active |
| Prod scale | 8 | 32GB | 500GB | 50-200 user, 20+ agent |

Khi scale > 200 user: tách Postgres ra managed DB (DigitalOcean/Supabase), OpenClaw ra VPS riêng, giữ Paperclip + biz-api ở app server.

---

## Map 12 ADR → Paperclip

| ADR | Paperclip status | Action |
|---|---|---|
| ADR-01 Auth (JWT 15m+7d+service token) | Partial — có JWT run token + agent API key | Thêm refresh-7d cho human admin, giữ Paperclip token cho agent |
| ADR-02 Multi-tenancy hybrid | **Solved** — multi-company native | Thêm RLS cho bảng VN domain |
| ADR-03 Schema `deo` | Conflict | Paperclip giữ schema upstream; DEO dùng **`deo_biz`** |
| ADR-04 Integration split | Partial — adapter pattern | Plugin (Telegram/Zalo) ở `deo/plugins/`; transport ở `packages/` |
| ADR-05 Error envelope | Verify | Middleware envelope-translator cho biz-api |
| ADR-06 Vitest+Supertest+Playwright | **Solved** — adopt nguyên xi | Win for free |
| ADR-07 VPS+Docker+GH Actions | **Solved** — adopt | Win for free |
| ADR-08 Pino+correlation ID | Partial — Activity Events | Wrap correlation ID vào Activity metadata |
| ADR-09 n8n self-hosted | Out of scope | Giữ n8n cho Drive automation phức tạp; Routines cho heartbeat schedule |
| ADR-10 Chat Phase 0 | **Solved** — Activity/Heartbeat | Map chat_threads → conversation entity |
| ADR-11 TanStack Query+Zustand | N/A — Paperclip có UI riêng | Hybrid: giữ DEO web cho domain VN; Paperclip UI cho governance/agent |
| ADR-12 `/api/v1` versioning | Verify | Domain endpoints prefix `/api/v1/biz/` |

**Tổng**: 5/12 ADR Paperclip cover trực tiếp; 4/12 partial; 3/12 cần extend.

---

## Phased plan v4 (revised — sau khi đọc kỹ docs OpenClaw)

| Phase | Mục tiêu | Estimate |
|---|---|---|
| **P0' Fork & Bootstrap** | Fork paperclipai/paperclip → `deo-os-v4` repo. Rebrand UI ("Dẹo Enterprise OS"). pnpm workspace. Dev env qua `pnpm smoke:openclaw-docker-ui`. | 1-2 tuần |
| **P1' OpenClaw Integration + Multi-Provider** | Deploy OpenClaw upstream Docker (gateway-only mode). Cấu hình `openclaw_gateway` adapter trên Paperclip. **Tắt** cron/standing-orders/tasks. Setup `agents.list[]` với model riêng cho mỗi role (Claude cho CEO, GPT cho CRM, Gemini cho Finance, ...). Hooks → Paperclip Issue creator. Smoke test. | **1-2 tuần** |
| **P2' VN Channels native** | Setup Telegram + Zalo (Marketplace + personal) + WhatsApp **trực tiếp qua OpenClaw bundled plugins** — chỉ cấu hình token/account. Test inbound flow: user nhắn → OpenClaw nhận → hook tạo Paperclip Issue → assign agent → OpenClaw reply. **0 dòng code channel adapter.** | **1 tuần** (giảm mạnh so với plan cũ 2-3 tuần) |
| **P3' Memory + Skills + Dreaming** | Cấu hình OpenClaw memory backend (builtin/QMD/Honcho — chọn 1). Port `goclaw/skills/*.md` → OpenClaw skill format. Setup SOUL.md per agent. Bật Dreaming với `autoSchedule: false` (Paperclip Routine trigger). | 2 tuần |
| **P4' n8n + Drive (workflow tĩnh)** | n8n Docker. Workflows tĩnh: Drive backup, weekly report PDF, expense ETL. Chỉ trigger từ Paperclip Routine webhook hoặc cron host (cho non-AI tasks). | 1-2 tuần |
| **P5' CRM module (DEO domain)** | `deo_biz` schema (leads/deals/clients/expenses). Biz-API expose như **MCP server** cho OpenClaw agents truy cập. Biz-Web UI giữ DEO hiện tại, rebrand. | 4-6 tuần |
| **P6' Attendance** | Checkin/shifts/leave + Paperclip Approvals UI cho leave request. | 2-3 tuần |
| **P7' Finance** | Expense/invoice/budget + Paperclip Budget & Cost Control cho AI spend (Paperclip native). | 3-4 tuần |
| **P8' Migration & Cutover** | Migrate v0.2.3 data → v4. Cutover 1 weekend. Sunset v0.2.3 sau Day 30. | 2-3 tuần |
| **P9' Upstream sync** | Quarterly merge Paperclip + OpenClaw upstream. Ongoing. | Continuous |

**Tổng**: 3.5-5 tháng cho 1-2 dev full-time. Tiết kiệm **~50-60%** effort vs plan v3.

**Lý do giảm thêm so với v4 cũ:**
- P2 từ 2-3 tuần → 1 tuần (channels native, không build skill)
- P3 từ 2-3 tuần → 2 tuần (memory + dreaming native, chỉ cấu hình)
- P4 từ 2 tuần → 1-2 tuần (n8n scope thu hẹp về ETL only)
- Bỏ hẳn build "channel-telegram", "channel-zalo", "channel-whatsapp" plugins — OpenClaw đã có
- Bỏ hẳn build memory L0/L1/L2 layer — OpenClaw memory engines covered
- Bỏ hẳn build dream cycle — OpenClaw Dreaming covered

---

## Thay đổi quan trọng: kiến trúc agent runtime

### Trước (plan v4 cũ)
```
Paperclip → adapter-goclaw plugin → GoClaw runtime (DEO maintain fork)
            └─ Channels: Telegram/Zalo plugin trong Paperclip ──┘
```
Vấn đề:
- DEO phải maintain GoClaw fork (~5-10k LoC) + theo upstream OpenClaw
- Paperclip plugin Telegram/Zalo phải reimplement bot logic
- 2 nguồn cron: GoClaw 8-stage timer + Paperclip Heartbeat → drift risk cao

### Sau (plan v4 mới)
```
Paperclip → openclaw_gateway adapter (NATIVE) → OpenClaw upstream
                                                ├─ Telegram skill
                                                ├─ Zalo skill
                                                └─ WhatsApp skill
```
Lợi:
- ✅ Không maintain fork OpenClaw — pull upstream theo release
- ✅ Channels là OpenClaw skill (1 file SKILL.md + small handler), reuse OpenClaw HTTP/webhook framework
- ✅ Drift = 0: chỉ Paperclip có scheduler, OpenClaw thuần executor
- ✅ Bug fix Telegram/Zalo có thể PR ngược OpenClaw nếu generic

### Trade-off cần biết

| Trước (GoClaw) | Sau (OpenClaw upstream) |
|---|---|
| L0/L1/L2 memory tự build | Phải re-implement bằng OpenClaw skill + Paperclip Activity (mất ~1-2 tuần) |
| 8-stage pipeline tự define | Paperclip Heartbeat lifecycle thay thế (đơn giản hơn nhưng less control) |
| Custom dream cycle | Paperclip Routine cron thay (mất nuance "dream" — cần verify product có cần thật không) |
| Knowledge Vault tự build | Paperclip Skills + OpenClaw skill loader thay |

> **Quyết định cần xác nhận**: nếu DEO Dream/Memory là USP đặc biệt (không thay được bằng Paperclip Heartbeat + Skill), giữ lại như **OpenClaw skill** (không phải GoClaw runtime). Nếu chỉ là implementation chi tiết → bỏ hẳn, dùng Paperclip primitives.

---

## Code organization

```
deo-os-v4/                          # forked from paperclipai/paperclip
├── (Paperclip upstream tree — KEEP intact)
│   ├── cli/  server/  ui/  packages/  skills/  tests/  docker/  scripts/
│
├── deo/                            # ALL DEO additions, single namespace
│   ├── apps/
│   │   ├── biz-api/                # CRM/HR/Finance/Attendance
│   │   │                           # exposed as MCP server cho OpenClaw agents
│   │   └── biz-web/                # giữ apps/web DEO hiện tại, rebrand
│   ├── packages/{shared,sdk}/
│   ├── infrastructure/
│   │   ├── postgres/migrations/    # CHỈ migrations cho deo_biz
│   │   │   ├── 100_deo_biz_init.sql
│   │   │   ├── 101_crm.sql / 102_hr.sql / 103_finance.sql / 104_attendance.sql
│   │   ├── docker/docker-compose.deo.yml   # full stack prod
│   │   ├── docker/docker-compose.dev.yml   # local dev
│   │   ├── caddy/Caddyfile
│   │   ├── openclaw/openclaw.json  # gateway-only config + agents.list + channels
│   │   └── n8n/workflows/          # workflow tĩnh (Drive sync, report, backup)
│   ├── openclaw-skills/            # CHỈ skill DEO-specific (port từ goclaw/skills)
│   │   ├── deo-crm-helper/SKILL.md
│   │   ├── deo-finance-helper/SKILL.md
│   │   ├── deo-hr-helper/SKILL.md
│   │   └── (channels native không cần — OpenClaw đã có)
│   └── docs/
│
├── pnpm-workspace.yaml             # +"deo/apps/*", "deo/packages/*"
├── OPENCLAW_VERSION.md             # pin OpenClaw upstream version
└── PAPERCLIP_UPSTREAM.md           # track Paperclip upstream version + diverged files
```

**Nguyên tắc vàng**: mọi file mới sống dưới `deo/`. Không edit upstream trừ khi (a) bug fix + PR ngược, hoặc (b) buộc patch — log vào `PAPERCLIP_UPSTREAM.md`.

---

## Critical files

### Phải đọc (Paperclip — sau khi clone)
- `paperclip/server/src/` — server entry, routing
- `paperclip/packages/` — adapter pattern (Claude Code adapter làm khuôn mẫu cho GoClaw adapter)
- `paperclip/docs/` — plugin spec, capability gates
- `paperclip/scripts/` — migration runner

### Giữ từ DEO (port vào `deo/`)
- `/home/user/deo-enterprise-os/apps/api/src/routes/{leads,clients,expenses,projects,tasks,business-lines,notebooks,clarifications,dashboard}.ts` → `deo/apps/biz-api/`
- `/home/user/deo-enterprise-os/apps/api/src/services/{backoffice-*,context.service,event.service}.ts` → port nguyên
- `/home/user/deo-enterprise-os/apps/web/src/` → `deo/apps/biz-web/`
- `/home/user/deo-enterprise-os/infrastructure/postgres/002_deo_schema.sql` → `007_brain_gdrive.sql` → refactor thành migrations cho `deo_biz`, drop tables overlap (users/companies/audit/agent_jobs)
- `goclaw/skills/*.md` → port sang `openclaw-skills/` format (OpenClaw skill schema)
- `goclaw/memory/L0-L1-L2-*.ts` → nếu giữ, port thành OpenClaw skill `deo-memory/`

### Drop hoàn toàn từ DEO
- `/home/user/deo-enterprise-os/goclaw/` toàn bộ runtime — ❌ **DROP** (thay bằng OpenClaw upstream)
- `apps/api/src/routes/auth.ts` → bỏ, dùng Paperclip Identity
- `apps/api/src/routes/{agents,agent-jobs}.ts` → replace bằng Paperclip Heartbeat + Org Chart
- `apps/api/src/routes/audit.ts` → replace bằng Paperclip Activity & Events
- `apps/api/src/routes/{conversations,telegram}.ts` → rewrite làm OpenClaw skill (không phải Paperclip plugin)
- `infrastructure/postgres/001_init.sql` → bỏ
- `infrastructure/postgres/005_orchestration_upgrade.sql` → bỏ phần overlap
- 8-stage pipeline custom của GoClaw → bỏ, dùng Paperclip Heartbeat lifecycle

---

## Migration v0.2.3 → v4

**Run-in-parallel**: v0.2.3 tiếp tục chạy production trên VPS. v4 build trên staging. Schema `deo_biz` + Paperclip schema riêng → no conflict.

**Mapping**:
```
deo.users           → paperclip.identity_users + deo_biz.user_profiles (zalo_id, phone)
deo.companies       → paperclip.companies
deo.projects        → paperclip.workspaces + deo_biz.projects
deo.tasks           → paperclip.work_items + deo_biz.task_extensions
deo.chat_threads/messages → paperclip.activities/activity_events
deo.audit_events    → paperclip.activity_events
deo.{leads,clients,expenses} → deo_biz.{leads,clients,expenses}
deo.agent_jobs      → paperclip.heartbeat_runs
```

**Cutover (1 weekend)**:
1. Freeze v0.2.3 writes (DNS → maintenance page)
2. Final delta dump → apply v4
3. Flip DNS to v4
4. v0.2.3 read-only 30 ngày
5. Sau Day 30: archive DB dump → Drive, sunset

**Rollback**: 7 ngày đầu sau cutover, nếu fail → DNS flip back v0.2.3.

---

## Tradeoff & risk

| Risk | Severity | Mitigation |
|---|---|---|
| Upstream divergence (Paperclip) | High | `deo/` namespace tách bạch; quarterly merge; CI check; `PAPERCLIP_UPSTREAM.md` |
| Upstream divergence (OpenClaw) | Medium | Pin version trong `OPENCLAW_VERSION.md`; chỉ thêm skill, không patch core; quarterly merge |
| **Heartbeat/cron drift Paperclip ↔ OpenClaw** | **High** | OpenClaw chạy `mode: gateway-only`, scheduler off; chỉ Paperclip có cron; xem section "Heartbeat/Cron drift prevention" |
| **n8n drift** | Medium | n8n chỉ workflow tĩnh; mọi trigger AI phải qua Paperclip Routine webhook |
| MIT license | Low | Giữ `LICENSE` upstream Paperclip + OpenClaw; thêm `LICENSE-DEO`; README ghi attribution cả 2 |
| Learning curve 2 hệ (Paperclip + OpenClaw) | Medium | P0'-P1' dành 2 tuần exploration; smoke test sẵn của Paperclip giảm friction |
| Lock-in data model | Medium | Schema `deo_biz` tách bạch. Dùng MCP layer thay vì FK trực tiếp với Paperclip tables |
| Performance overhead WebSocket gateway | Low | OpenClaw `sessionKeyStrategy: issue` reuse session; SLA <500ms ack chat, agent reply async |
| VN compliance (PDPL) | Medium | Self-host VPS VN. Paperclip + OpenClaw đều self-host native |
| Mất feature GoClaw đặc thù (8-stage, dream) | Medium | Verify với product có cần thật không. Nếu cần → port sang OpenClaw skill |
| Telegram/Zalo bot reliability | Medium | OpenClaw HTTP receiver là đơn giản; idempotency qua Paperclip `runId` |

---

## Tech debt fixes for free (Paperclip cover)

- ✅ Vitest + Playwright preconfigured (ADR-06)
- ✅ CI/CD scripts + likely .github/workflows/
- ✅ Schema migration framework (thay raw .sql)
- ✅ Multi-tenancy native (ADR-02)
- ✅ Audit trail durable (ADR-08)
- ✅ Heartbeat + budget enforcement (fix agent-jobs P0)
- ✅ Company Portability export/import → giải source-of-truth fragmentation
- ✅ Secrets & Storage encrypted (thay .env scatter)
- ✅ Governance & Approvals (cho leave request P5')
- ✅ Budget & Cost Control AI calls (P6')

---

## Verification / Acceptance Criteria

### Feature Parity (cutover gate)
- [ ] Login admin v4 + refresh 7d
- [ ] Telegram bot v4 nhận tin, route đúng agent (10 ca test)
- [ ] CRUD task qua web v4 — zero data loss vs v0.2.3
- [ ] CRM list leads/clients/deals — count match v0.2.3
- [ ] Finance expense entry → dashboard reflect
- [ ] Audit log: web action → row trong Paperclip Activity Events
- [ ] GoClaw 8-stage output identical cho 5 test prompts
- [ ] Drive upload qua agent → file đúng folder
- [ ] n8n workflow trigger từ Paperclip Routine → success

### Test Coverage
- Backend `deo/apps/biz-api/`: ≥60% line coverage
- Frontend Playwright: 5 happy path (login, dashboard, project list, task list, lead create)
- Plugin: mỗi channel adapter ≥3 inbound + 3 outbound
- Migration script: zero row loss trên shadow copy v0.2.3

### Performance Budget
- Telegram inbound → ack ≤500ms p95
- API CRUD biz ≤200ms p95
- Heartbeat tick drift ≤2s
- Agent reply roundtrip ≤8s p95
- DB query dashboard ≤50ms p95

### Operational
- Backup Postgres daily + 1 lần restore drill thành công
- /health 200 cho cả Paperclip core + biz-api + OpenClaw gateway
- Pino correlation_id ≥99% requests
- Sentry/alert configured cho 5xx

### Drift verification (CRITICAL — tránh Paperclip vs OpenClaw scheduler conflict)
- [ ] OpenClaw config có `mode: gateway-only`, `scheduler.enabled: false`
- [ ] `ps aux | grep openclaw` trong container — không có cron/scheduler process chạy
- [ ] Tắt Paperclip Routine 1 ngày → OpenClaw không có run nào trigger tự thân (zero drift)
- [ ] Mọi run trong OpenClaw log có `runId` từ Paperclip → match Activity Log row
- [ ] Test n8n: tạo workflow tĩnh → confirm n8n KHÔNG gọi OpenClaw trực tiếp, chỉ qua Paperclip Routine webhook
- [ ] Stress test: 100 Paperclip Routine ticks/min → OpenClaw queue process đúng thứ tự, không double-run cùng task

---

## Open Questions cần quyết định trước khi P0' bắt đầu

1. **Repo strategy**: fork Paperclip vào repo mới `deo-os-v4` (clean) hay merge vào `deo-enterprise-os`? Recommend **repo mới** — git history sạch.
2. **Paperclip schema name**: verify Paperclip có hỗ trợ custom schema không. Cần đọc Paperclip migration docs P0'.
3. **n8n scope**: chỉ workflow tĩnh (Drive sync, ETL, report). Không drive AI. → **Confirmed by user**.
4. **GoClaw**: ❌ **DROP** — dùng OpenClaw upstream + `openclaw_gateway` adapter. → **Confirmed by user**.
5. **Multi-provider per agent**: confirm matrix model assignment:
   - CEO agent: Anthropic Claude Opus 4.6/4.7 (chiến lược)
   - Worker agents (CRM/Finance/HR): mixed (Sonnet hoặc GPT-5.5 cho cost)
   - Knowledge/Memory agent: opencode hoặc local Ollama
   - Cần product team confirm budget allocation
6. **OpenClaw memory backend**: chọn 1 trong builtin/QMD/Honcho/LanceDB. Recommend **builtin** P0', migrate Honcho nếu cần multi-agent cross-recall.
7. **Dreaming**: bật hay tắt? Recommend bật cho CEO + knowledge agent, tắt cho worker.
8. **Channel inbound flow**: native OpenClaw bundled plugin (Telegram/Zalo/WhatsApp) — confirm token/account setup procedure mỗi company.
9. **Channel inbound → Paperclip Issue**: chỉ tạo Issue cho yêu cầu cần work (CRM update, finance entry), hay mọi tin nhắn đều tạo Issue (audit-heavy)? Recommend **escalation pattern**: chat thường log Activity, action escalate Issue.
10. **UI strategy**: hybrid (Paperclip UI cho governance/agent + DEO web cho domain VN) — confirm.
11. **i18n Paperclip UI tiếng Việt**: cần không? Ảnh hưởng scope ~1-2 tuần.
12. **Postgres**: dev embedded (Paperclip default), prod shared 1 Postgres + 2 schema (paperclip, deo_biz)? OpenClaw có dùng SQLite riêng cho memory backend?
13. **OpenClaw multi-instance vs single**: 1 instance đa-agent (recommend) hay nhiều instance để isolate failure?
14. **License**: Paperclip MIT + OpenClaw (check `LICENSE` upstream) + DEO proprietary. Verify P0'.
15. **Cutover target date**: Q3 2026? Confirm timeline.

---

## Verification — How to test plan end-to-end

1. **P0' done**: `pnpm dev` chạy được Paperclip core + DEO biz-api stub. Login admin OK. Test suite pass.
2. **P1' done**: Telegram bot test gửi tin → Paperclip plugin nhận → GoClaw adapter xử lý → reply. Activity log có entry.
3. **P4' done**: tạo lead qua biz-web → row trong `deo_biz.leads` → dashboard reflect.
4. **P7' done**: Migration script chạy trên shadow copy v0.2.3 → row count match → smoke E2E v4 pass với data migrated.
5. **Production cutover**: feature parity checklist 100% green → 1 weekend cutover → 30 ngày observation → sunset v0.2.3.
