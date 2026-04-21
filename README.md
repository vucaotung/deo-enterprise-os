# Dẹo Enterprise OS

**v3.0.0 — Enterprise Human-AI Hybrid OS (GoClaw Edition)**

Work OS định hướng **Human-AI hybrid** cho vận hành doanh nghiệp, nơi:
- **GoClaw** là agent operating layer (chat, memory, cron, knowledge vault, reflection)
- **Telegram / Zalo / WhatsApp** là mặt tiền tự nhiên cho con người
- **Web app** là lớp quản trị / trực quan / object management
- **Enterprise OS API** là business system layer — source of truth
- **n8n** là workflow engine + integration fabric
- **Google Drive** là kho tài liệu bền vững / human-readable

> **Con người làm việc qua chat + web. Agent hiểu ngữ cảnh, nhắc việc, tổng hợp, tự động hóa. Business truth nằm trong DB. Tài liệu nằm trong Drive. Orchestration nằm trong GoClaw.**

---

## Trạng thái hiện tại

**Current version:** v3.0.0 — Architecture milestone
**Status:** 12 ADR chốt xong. Phase 0 implementation sắp bắt đầu.
**Production v0.2.3:** vẫn đang chạy trong thời gian rebuild.

---

## Kiến trúc v3.0 — Tổng quát

```text
Telegram / Zalo / WhatsApp / Discord / Slack / WebSocket
                        ↓
              ┌─────────────────────────────────┐
              │         GoClaw Gateway          │
              │  - 8-stage agent pipeline       │
              │  - L0/L1/L2 Memory (Dreaming)   │
              │  - Knowledge Vault              │
              │  - Cron / Heartbeat             │
              │  - Team Task Board              │
              │  - Skills / SKILL.md            │
              │  - 7 Lifecycle Hooks            │
              │  - MCP Tool Integration         │
              └──────────────┬──────────────────┘
                             │ MCP + Hooks
                             ↓
              ┌─────────────────────────────────┐
              │    Enterprise OS API + Worker   │
              │  Auth, Projects, Tasks, CRM,    │
              │  Finance, Attendance, Audit...  │
              └──────┬──────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    Postgres (deo)           Redis
          │
    Google Drive  ↔  n8n (self-hosted)
```

### Tại sao GoClaw

| Tính năng | Trước (OpenClaw) | Sau (GoClaw) |
|---|---|---|
| Dream / Reflection | Custom build | **L2 Dreaming — native** |
| Memory 3 tầng | Custom | **L0/L1/L2 — native** |
| Knowledge base | Custom RAG | **Knowledge Vault — native** |
| Cron / scheduling | Custom | **Native + IANA timezone** |
| Integration hooks | Custom webhook | **7 lifecycle hooks — native** |
| MCP tools | Hạn chế | **stdio / SSE / HTTP native** |
| Channels | Telegram, Zalo | **Telegram, Zalo, WhatsApp, Discord, Slack** |
| Security | Basic | **AES-256-GCM + RBAC + injection detection** |

---

## 12 Architecture Decisions đã chốt

| ADR | Quyết định |
|---|---|
| ADR-01 | JWT 15m + Refresh 7d + Service token riêng cho GoClaw |
| ADR-02 | Hybrid multi-tenancy: app-layer + Postgres RLS |
| ADR-03 | Schema name: `deo` |
| ADR-04 | Integration: root = transport client / apps/api = business logic |
| ADR-05 | Error envelope: `{ success, data, error: { code, message, details }, meta }` |
| ADR-06 | Testing: Vitest + Supertest + Playwright smoke |
| ADR-07 | Deploy: VPS + Docker Compose + GitHub Actions |
| ADR-08 | Observability: Pino + /health + /ready + correlation ID (từ Phase 0) |
| ADR-09 | n8n: self-hosted, tích hợp sâu từ Phase 2 |
| ADR-10 | Chat Phase 0: admin/internal only (schema + endpoint, no production ingestion) |
| ADR-11 | Frontend state: TanStack Query + Zustand |
| ADR-12 | API: /api/v1, breaking change policy 30–90 ngày |

Xem chi tiết: [`docs/ARCHITECTURE_DECISIONS.md`](docs/ARCHITECTURE_DECISIONS.md)

---

## Build Phases

```text
Phase 0  → Foundation Kernel (Auth, Org, Projects, Tasks, Chat basic, Audit, Observability)
Phase 1  → GoClaw Bridge (MCP server + Hooks + Cron + Skills)
Phase 2  → Google Drive + n8n Integration
Phase 3  → Dream / Reflection (GoClaw L2 config + cron schedules)
Phase 4  → CRM Module
Phase 5  → Attendance / Workforce Module
Phase 6  → Finance Module
Phase 7  → Knowledge + Helpdesk (GoClaw Vault + Helpdesk tickets)
Phase 8  → Production Hardening
```

---

## Tài liệu quan trọng đọc trước

### Architecture v3 (mới — đọc đây trước)
- [`docs/ENTERPRISE_HUMAN_AI_HYBRID_OS_PLAN_v3_GOCLAW.md`](docs/ENTERPRISE_HUMAN_AI_HYBRID_OS_PLAN_v3_GOCLAW.md) — **Main plan v3**
- [`docs/ARCHITECTURE_DECISIONS.md`](docs/ARCHITECTURE_DECISIONS.md) — 12 ADR đã chốt
- [`docs/ENTERPRISE_HUMAN_AI_HYBRID_OS_PHASE0_CHECKLIST_v2.md`](docs/ENTERPRISE_HUMAN_AI_HYBRID_OS_PHASE0_CHECKLIST_v2.md) — Phase 0 checklist
- [`docs/AUDIT_RECORD_HYBRID_OS_PLAN_v1.md`](docs/AUDIT_RECORD_HYBRID_OS_PLAN_v1.md) — Audit record (closed)

### Legacy docs (v0.2.x — giữ cho reference)
- `docs/ORCHESTRATION_STACK_V1.md`
- `docs/AGENT_DOMAIN_V1.md`
- `docs/N8N_ROLE_IN_ENTERPRISE_OS.md`
- `docs/BACKOFFICE_IMPLEMENTATION_PLAN_V1.md`

---

## Repo Structure

```text
apps/
  api/          Express + TypeScript — Business OS API
  web/          React + Vite + Tailwind — Web dashboard
  worker/       Internal deterministic jobs

packages/
  shared/       Types, enums, DTO contracts
  sdk/          Typed API client

integrations/   Reusable transport clients (GoClaw, n8n, Drive)

goclaw/         GoClaw config, agent context files, skills, cron
  config/
  agents/
  skills/
  cron/

infrastructure/
  postgres/     SQL migrations (schema: deo)
  redis/
  docker/
  nginx/

docs/           Architecture, product, implementation planning
scripts/        Deploy / backup / health check helpers
```

---

## Core Principles (v3)

- **GoClaw là nervous system** — orchestration, memory, cron, reflection
- **Enterprise OS là business brain** — domain rules, structured truth, audit
- **Drive là durable memory** — artifacts, documents, human-readable outputs
- **n8n là integration glue** — multi-step workflows, approvals, external sync
- **Mọi agent action phải auditable** — correlation ID xuyên suốt
- **Business truth không nằm trong GoClaw memory** — chỉ nằm trong DB
- **Observability từ ngày đầu** — không debug mù trong production
- **Tenant isolation là bắt buộc** — không để data leak giữa companies

---

## Deployment

- Xem: [`DEPLOYMENT_GUIDE_VN.md`](DEPLOYMENT_GUIDE_VN.md)
- Enterprise OS: VPS + Docker Compose
- GoClaw: Docker Compose riêng (cùng VPS hoặc riêng tùy scale)
- CI/CD: GitHub Actions + manual deploy workflow

---

## License

Private / Proprietary

---

**Last updated:** 2026-04-18 | **Version:** v3.0.0
