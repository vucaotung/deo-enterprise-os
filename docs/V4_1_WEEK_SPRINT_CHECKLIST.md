# DEO Enterprise OS v4 — Sprint 1 Tuần (Paperclip Fork + OpenClaw Integration)

> **Mục tiêu**: hoàn thành P0' + P1' + P2' rút gọn trong 7 ngày — đủ để 1 user nhắn Telegram/Zalo, OpenClaw agent reply, mọi hoạt động log vào Paperclip UI.
>
> **Definition of Done sprint**: 1 user gửi tin Telegram/Zalo → tin tạo Paperclip Issue → assign agent CEO → OpenClaw execute (gọi Claude/GPT theo per-agent config) → reply về Telegram/Zalo → Activity Log có row → Budget tracking phản ánh cost → toàn bộ chạy trên VPS Docker.

Plan đầy đủ: `ENTERPRISE_HUMAN_AI_HYBRID_OS_PLAN_v4_PAPERCLIP_OPENCLAW.md`

---

## Tiền đề (chuẩn bị TRƯỚC ngày 1 — không tính vào 7 ngày)

- [ ] VPS đã sẵn sàng: 4+ vCPU, 16GB+ RAM, 200GB SSD, Ubuntu 22.04+
- [ ] Domain `os.deo.vn` (hoặc subdomain tương đương) trỏ về VPS
- [ ] Telegram bot đã tạo qua @BotFather, có `TELEGRAM_BOT_TOKEN`
- [ ] Zalo bot tạo qua [bot.zaloplatforms.com](https://bot.zaloplatforms.com), có `ZALO_BOT_TOKEN`
- [ ] (Optional) WhatsApp Business API account
- [ ] Anthropic API key (`ANTHROPIC_API_KEY`)
- [ ] OpenAI API key (`OPENAI_API_KEY`) cho fallback
- [ ] (Optional) Google Gemini API key
- [ ] GitHub repo access (`vucaotung/deo-enterprise-os`)
- [ ] SSH key VPS đã setup
- [ ] Docker + Docker Compose đã cài trên VPS

---

## Day 1 — Fork & Bootstrap (P0')

**Goal**: Repo mới deo-os-v4 đã fork từ Paperclip, build được local.

### Morning (4h)
- [ ] Tạo repo mới `deo-os-v4` trên GitHub (private hoặc public)
- [ ] Fork `paperclipai/paperclip` vào `deo-os-v4` (hoặc clone + push)
- [ ] Clone về máy dev local
- [ ] Đọc `paperclip/README.md` + `paperclip/CONTRIBUTING.md` + `paperclip/docs/` (tổng quan 1-2h)
- [ ] Chạy `pnpm install` ở root
- [ ] Chạy `pnpm smoke:openclaw-docker-ui` — bootstrap full stack local (Paperclip + OpenClaw Docker + embedded Postgres)
- [ ] Verify UI accessible tại `http://localhost:3000`
- [ ] Tạo company "Dẹo Enterprise" qua UI
- [ ] Hire CEO agent với `claude_local` adapter (smoke test)

### Afternoon (4h)
- [ ] Tạo namespace `deo/` ở root repo
- [ ] Tạo `pnpm-workspace.yaml` thêm `deo/apps/*`, `deo/packages/*`
- [ ] Setup `.env.example` với mọi env var (Paperclip + OpenClaw + DEO)
- [ ] Tạo `OPENCLAW_VERSION.md` pin version OpenClaw upstream
- [ ] Tạo `PAPERCLIP_UPSTREAM.md` track upstream commits
- [ ] Rebrand UI cơ bản: thay logo + title "Dẹo Enterprise OS" trong `paperclip/ui/`
- [ ] Commit initial state, push lên `main` branch của `deo-os-v4`

### EOD checkpoint
- [ ] `pnpm dev` chạy được
- [ ] Login Paperclip UI thành công
- [ ] Có ít nhất 1 company + 1 agent đã hire qua UI
- [ ] Smoke task end-to-end pass

---

## Day 2 — OpenClaw Multi-Agent Setup (P1' phần 1)

**Goal**: OpenClaw config đầy đủ với multi-agent multi-provider, gateway-only mode.

### Morning (4h)
- [ ] Đọc `docs.openclaw.ai/concepts/multi-agent.md` + `gateway/config-agents.md` (1h)
- [ ] Tạo `deo/infrastructure/openclaw/openclaw.json` với:
  - `automation.cron.enabled: false`
  - `automation.standingOrders.enabled: false`
  - `automation.taskflow.enabled: false`
  - `automation.backgroundTasks.enabled: false`
  - `gateway.heartbeat.mode: "keepalive-only"`
  - `dreaming.autoSchedule: false`
- [ ] Define `agents.list[]`:
  - `ceo` → `anthropic/claude-opus-4-7` (chiến lược)
  - `crm-agent` → `openai/gpt-5.5` (cost-effective worker)
  - `finance-agent` → `anthropic/claude-sonnet-4-6`
  - `hr-agent` → `openai/gpt-5.4-mini`
  - `support-agent` → `openai/gpt-5.4-mini`
- [ ] Mỗi agent: workspace path riêng, fallback chain riêng
- [ ] Setup secrets cho mỗi provider qua Paperclip Secrets UI

### Afternoon (4h)
- [ ] Configure `openclaw_gateway` adapter trong Paperclip cho từng agent:
  - URL: `ws://openclaw:18789`
  - `sessionKeyStrategy: "issue"`
  - Persisted `devicePrivateKeyPem`
  - `disableDeviceAuth: false`
- [ ] Generate OpenClaw invite prompt qua Paperclip UI cho mỗi agent
- [ ] Approve hire qua Paperclip board
- [ ] Verify mỗi agent có row trong Org Chart, status active
- [ ] Smoke test: assign issue cho từng agent → confirm OpenClaw execute với đúng provider/model

### EOD checkpoint
- [ ] 5 agents đã hire xong, mỗi agent dùng provider khác nhau
- [ ] Verify per-agent workspace tại `~/.openclaw/agents/<id>/`
- [ ] Verify per-agent auth profile isolated
- [ ] Run `openclaw cron list` → empty (drift verification)

---

## Day 3 — Channels Native (Telegram + Zalo) (P2' rút gọn)

**Goal**: Telegram + Zalo inbound + outbound chạy native qua OpenClaw, hook vào Paperclip Issue.

### Morning (4h)
- [ ] Đọc `docs.openclaw.ai/channels/telegram.md` + `channels/zalo.md` (30 phút)
- [ ] Set env `TELEGRAM_BOT_TOKEN`, `ZALO_BOT_TOKEN` trong OpenClaw secrets
- [ ] Cấu hình `channels.telegram.accounts.default.botToken` trong OpenClaw config
- [ ] Cấu hình `channels.zalo.accounts.default.botToken` (DM-only, pairing default)
- [ ] Restart OpenClaw, verify channel status:
  - `openclaw channels status --probe`
  - `openclaw pairing list zalo` (chờ pairing code)
- [ ] Pair với Zalo bot (gửi tin nhắn từ user → approve pairing)
- [ ] Test direct Telegram inbound → confirm OpenClaw nhận

### Afternoon (4h)
- [ ] Setup OpenClaw hook `onChannelMessage` POST tới Paperclip:
  - Endpoint: `http://paperclip:3000/api/internal/channel-event` (hoặc port phù hợp)
  - Auth: shared `PAPERCLIP_INTERNAL_TOKEN`
- [ ] Build endpoint `POST /api/internal/channel-event` trong Paperclip (extension):
  - Validate auth token
  - Tạo Issue với `metadata.channel`, `metadata.peer`
  - Auto-assign `ceo` agent (hoặc routing rule based on keyword)
  - Trigger heartbeat qua adapter
- [ ] Test E2E:
  - Gửi tin "hello" qua Telegram → tạo Issue → CEO agent reply → tin reply về Telegram
  - Tương tự với Zalo

### EOD checkpoint
- [ ] Telegram + Zalo bidirectional hoạt động
- [ ] Mỗi tin nhắn → 1 Issue trong Paperclip board
- [ ] Activity Log hiển thị: inbound message → agent run → outbound reply
- [ ] Cost event ghi vào Budget dashboard

---

## Day 4 — Memory + Skills + DEO Domain Setup (P3' rút gọn + P5' bắt đầu)

**Goal**: Memory engine cấu hình, port DEO skills, biz-api skeleton expose MCP.

### Morning (4h)
- [ ] Cấu hình OpenClaw memory backend `builtin` (SQLite default) cho mọi agent
- [ ] Verify `memory_search` + `memory_get` tools available
- [ ] Test: gửi "Remember tôi prefer tiếng Việt cho mọi reply" → check `MEMORY.md` của ceo agent
- [ ] Test recall: hỏi "tôi prefer ngôn ngữ gì?" → verify recall đúng
- [ ] Port `goclaw/skills/*.md` (từ DEO repo cũ) sang OpenClaw skill format:
  - Copy 3 skill quan trọng nhất: `crm-helper`, `finance-helper`, `hr-helper`
  - Đặt vào `deo/openclaw-skills/`
  - Mount volume vào OpenClaw container

### Afternoon (4h)
- [ ] Tạo `deo/apps/biz-api/` skeleton (Express + TypeScript)
- [ ] Tạo migration `deo_biz` schema (chỉ table cốt lõi: `leads`, `clients`, `expenses`)
- [ ] Expose `biz-api` như MCP server (theo Paperclip how-to "Add MCP Server to Agent")
- [ ] Đăng ký MCP server trong agent config (cho `crm-agent`, `finance-agent`)
- [ ] Test: agent gọi `get_leads` qua MCP → return mock data

### EOD checkpoint
- [ ] Memory L0/L1/L2 hoạt động qua OpenClaw native
- [ ] 3 DEO skill đã port + agents nhận đúng
- [ ] biz-api lên local + expose MCP
- [ ] Agent test: "list leads của tôi" → call MCP → return result

---

## Day 5 — VPS Deployment + Production Stack

**Goal**: Toàn bộ stack chạy trên VPS prod với HTTPS.

### Morning (4h)
- [ ] Build Docker images:
  - `deo-os-v4:latest` (Paperclip + DEO additions)
  - `deo-biz-api:latest`
- [ ] Push images tới registry (Docker Hub hoặc GitHub Container Registry)
- [ ] SSH vào VPS, setup folder structure:
  - `/opt/deo-os/` (compose + configs)
  - `/opt/deo-os/secrets/` (token files, mode 0600)
  - `/opt/deo-os/data/postgres/`
- [ ] Tạo `docker-compose.deo.yml` ở `/opt/deo-os/`:
  - caddy, paperclip, openclaw, biz-api, postgres, redis, n8n
  - networks: internal + public
  - volumes persistent
- [ ] Setup Caddyfile với routing:
  - `os.deo.vn` → paperclip
  - `app.deo.vn` → biz-web (placeholder)
  - `api.deo.vn` → biz-api
  - `hooks.deo.vn` → openclaw HTTP receiver

### Afternoon (4h)
- [ ] `docker compose up -d` lần đầu, check logs
- [ ] Verify TLS certs từ Caddy (Let's Encrypt auto)
- [ ] Restore Paperclip company từ local export (companies.sh)
- [ ] Setup webhook URL của Telegram/Zalo bot trỏ về `https://hooks.deo.vn/...`
- [ ] Test E2E từ user thật:
  - Gửi tin Telegram → reply
  - Gửi tin Zalo → reply
  - Login Paperclip UI tại `https://os.deo.vn`
- [ ] Setup automated daily Postgres backup (cron + pg_dump → upload Drive/S3)

### EOD checkpoint
- [ ] Production VPS chạy, HTTPS xanh
- [ ] Telegram + Zalo flow E2E pass từ end user thật
- [ ] Backup chạy lúc 2am hàng ngày, verify file tạo
- [ ] Health endpoint xanh cho cả 3 service

---

## Day 6 — Hardening + Drift Verification + Test Coverage

**Goal**: Verify zero drift, viết test cơ bản, security pass.

### Morning (4h)
- [ ] Drift verification (CRITICAL):
  - [ ] `docker exec openclaw openclaw cron list` → empty
  - [ ] `docker exec openclaw openclaw tasks list` → only Paperclip-triggered
  - [ ] Tắt Paperclip Routine 30 phút → verify OpenClaw không tự run
  - [ ] Verify mọi run có `runId` trong cả OpenClaw log + Paperclip Activity Log
  - [ ] Stress test: 50 Routine ticks/min → verify no double-execution
- [ ] Configure Paperclip Routines mẫu:
  - Daily standup 9am
  - Weekly report Sunday 6pm
  - Dream sweep Sunday 2am (trigger OpenClaw dreaming)
- [ ] Verify Routine fire đúng giờ, OpenClaw nhận đúng task

### Afternoon (4h)
- [ ] Setup Vitest cho `deo/apps/biz-api/`:
  - Unit test cho 1 endpoint (GET /leads)
  - 60% coverage target (tối thiểu)
- [ ] Setup Playwright cho E2E:
  - Login flow
  - Dashboard load
  - Create issue
- [ ] CI/CD: setup `.github/workflows/ci.yml`:
  - lint + typecheck + test
  - Run trên PR
- [ ] Security audit:
  - Verify OpenClaw gateway port 18789 KHÔNG public
  - Verify Postgres + Redis KHÔNG public
  - Verify secrets không trong git (gitleaks scan)

### EOD checkpoint
- [ ] Drift checklist 100% pass
- [ ] CI green trên feature branch
- [ ] Security scan clean
- [ ] 3 Routines chạy đúng schedule

---

## Day 7 — Documentation + Demo + Handoff

**Goal**: Doc đầy đủ, demo cho stakeholder, sprint retrospective.

### Morning (4h)
- [ ] Update `CHANGELOG.md` với v4.0.0 entry
- [ ] Viết `docs/V4_DEPLOYMENT_RUNBOOK.md`:
  - VPS setup
  - Docker compose up/down
  - Backup/restore
  - Troubleshooting (5 lỗi thường gặp)
- [ ] Viết `docs/V4_USER_GUIDE_VN.md`:
  - Login Paperclip UI tiếng Việt
  - Hire agent qua UI
  - Tạo Routine
  - Approve action
  - Xem Budget
- [ ] Update `README.md` root:
  - Architecture diagram
  - Quick start
  - Link tới plan + sprint checklist

### Afternoon (4h)
- [ ] Demo prep:
  - Reset to clean state (snapshot)
  - Prepare demo script (5 phút)
  - Test 3 lần liên tiếp pass
- [ ] Live demo cho stakeholder:
  - User gửi Telegram → agent reply (Anthropic Claude)
  - User gửi Zalo → agent CRM reply (OpenAI GPT) gọi MCP biz-api
  - Mở Paperclip dashboard → show budget + activity
  - Trigger Routine manual → show heartbeat run
  - Show drift verification
- [ ] Retrospective:
  - What worked
  - What didn't
  - Backlog cho sprint 2

### EOD checkpoint
- [ ] Doc complete
- [ ] Demo pass
- [ ] Tag `v4.0.0-sprint1` trên git
- [ ] PR merged vào main

---

## Risk register cho sprint 1 tuần

| Risk | Severity | Mitigation |
|---|---|---|
| Paperclip schema name không config được | High | Day 1 verify đầu tiên; nếu không → dùng schema mặc định, đẩy `deo_biz` qua DB riêng |
| OpenClaw bundled Zalo plugin không stable | Medium | Có sẵn fallback dùng `zalouser` (Zalo personal) hoặc Telegram-only sprint 1 |
| API key rate limit khi dev | Low | Setup API key rotation từ Day 2; có Anthropic + OpenAI dual |
| Hook OpenClaw → Paperclip timeout | Medium | Day 3 add retry + idempotency; test chịu tải |
| Migration data cũ v0.2.3 | DEFERRED | Sprint 2 — sprint này chỉ green-field |
| Demo VPS down | Medium | Day 6 backup snapshot; có rollback plan |

---

## Out of scope sprint 1 tuần (đẩy sang sprint 2)

- ❌ CRM/HR/Finance/Attendance domain modules (chỉ skeleton)
- ❌ Migration data v0.2.3 → v4
- ❌ i18n Paperclip UI tiếng Việt đầy đủ
- ❌ WhatsApp channel (chỉ Telegram + Zalo)
- ❌ Multi-channel multi-account (1 account / channel)
- ❌ Honcho/QMD/LanceDB memory backends (chỉ builtin)
- ❌ Memory Wiki layer
- ❌ n8n workflow nâng cao (chỉ skeleton container)
- ❌ Multi-tenant cho nhiều company (chỉ "Dẹo Enterprise")

---

## Daily standup template

Mỗi ngày 9am, post lên Telegram channel internal:

```
📅 Day {N}/7 — DEO v4 Sprint
✅ Hôm qua: ...
🎯 Hôm nay: ...
🚧 Blocker: ...
📊 % Done: ...%
```
