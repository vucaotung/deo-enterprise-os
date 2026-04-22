# Enterprise Human-AI Hybrid OS — Architecture Decisions

> Tài liệu ghi nhận quyết định kiến trúc chính thức trước khi bắt đầu Phase 0.
> Tất cả 12 ADR đã được chốt. Cập nhật plan và checklist tương ứng.

**Trạng thái:** ✅ Fully resolved — 2026-04-12

---

## Tóm tắt trạng thái

| # | Quyết định | Trạng thái | Chốt |
|---|---|---|---|
| ADR-01 | Auth mechanism | ✅ Resolved | JWT 15m + Refresh 7d + Service token riêng |
| ADR-02 | Multi-tenancy enforcement | ✅ Resolved | Hybrid (app-layer default + RLS cho bảng nhạy cảm) |
| ADR-03 | Schema name | ✅ Resolved | `deo` |
| ADR-04 | Integration code location | ✅ Resolved | Split: root `integrations/` client layer + `apps/api/src/integrations/` business logic |
| ADR-05 | Error taxonomy + response format | ✅ Resolved | Extended structured envelope |
| ADR-06 | Testing strategy + tools | ✅ Resolved | Vitest + Supertest + Playwright smoke |
| ADR-07 | Deployment target + CI/CD | ✅ Resolved | VPS + Docker Compose + GitHub Actions + manual deploy |
| ADR-08 | Observability minimum | ✅ Resolved | Pino + `/health` + correlation ID + optional Sentry — bắt đầu từ Phase 0 |
| ADR-09 | n8n hosting model | ✅ Resolved | Self-hosted, tích hợp sâu từ Phase 2 |
| ADR-10 | Chat module Phase 0 scope | ✅ Resolved | Option B — endpoint thật, admin/internal only |
| ADR-11 | Frontend state management | ✅ Resolved | TanStack Query + Zustand |
| ADR-12 | API versioning + breaking change policy | ✅ Resolved | `/api/v1` + policy đã chốt |

---

## ADR-01 — Auth Mechanism

**Quyết định:**

Dùng **JWT stateless access token với expiry 15 phút** + **refresh token với expiry 7 ngày** cho human users.

Dùng **service token riêng biệt** cho OpenClaw gọi API nội bộ — không dùng chung user JWT.

Quy tắc Phase 0:
- Human users authenticate bằng email/password
- Access token lifetime = 15 phút
- Refresh token lifetime = 7 ngày
- Refresh tokens phải được lưu trong revocable store (DB hoặc tương đương)
- OpenClaw authenticate bằng dedicated internal service token
- SSO / OAuth defer sang phase sau

**Lý do:** Cân bằng giữa security, revocability, và implementation simplicity. Tách rõ machine-to-machine auth (OpenClaw) khỏi human user auth tránh coupling sai.

---

## ADR-02 — Multi-tenancy Enforcement

**Quyết định:**

Dùng **hybrid tenant isolation strategy**.

- Primary enforcement: **application layer** — tenant-aware middleware + repository/service design
- Secondary enforcement: **Postgres Row-Level Security (RLS)** cho sensitive tables, áp dụng sớm và mở rộng dần

Rules bắt buộc:
- Mọi business entity phải có `company_id`
- Mọi business query phải tenant-aware theo mặc định
- Repository methods phải require tenant context trừ khi explicitly privileged
- Privileged bypass path phải explicit và auditable

Early RLS coverage (Phase 0): `projects`, `tasks`, `chat_threads`, `chat_messages`, `drive_artifacts`, `audit_events`

**Lý do:** Pure app-layer dễ bị bỏ sót theo thời gian. Full RLS ngay từ đầu quá phức tạp. Hybrid cho safety mà không overload Phase 0.

---

## ADR-03 — Database Schema Name

**Quyết định:** Dùng **`deo`** làm PostgreSQL schema name trên toàn bộ migrations, SQL, code, scripts, và docs.

**Lý do:** Ngắn, rõ, nhất quán với system identity, thực tế hơn các lựa chọn dài hơn.

---

## ADR-04 — Integration Code Location

**Quyết định:** Dùng cấu trúc **split**:

- **Root `integrations/`** — reusable clients, SDK wrappers, protocol adapters (transport/client layer)
- **`apps/api/src/integrations/`** — app-specific business integration orchestration (business-facing logic)

Shared low-level clients ở root → có thể dùng từ API, worker, và future tools.
Business integration logic gần domain logic → ở app.

**Lý do:** Tránh confusion, giữ reusability, không để business logic lẫn với transport layer.

---

## ADR-05 — Error Taxonomy + API Response Format

**Quyết định:** Dùng extended structured response envelope:

```ts
{
  success: boolean;
  data?: T;
  error?: {
    code: string;                        // machine-readable
    message: string;                     // human-readable
    details?: Record<string, string[]>;  // field-level validation
  };
  meta?: {
    page?: number;
    total?: number;
    [key: string]: any;
  };
}
```

Dùng HTTP status codes chuẩn cùng với envelope.

Error codes chuẩn:
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `TASK_NOT_FOUND`
- `PROJECT_NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

**Lý do:** Envelope cũ quá shallow cho real frontend forms và reliable error handling. Version này vẫn đơn giản nhưng production-usable.

---

## ADR-06 — Testing Strategy + Tools

**Quyết định:**

| Layer | Tool | Scope |
|---|---|---|
| Backend unit/integration | Vitest + Supertest | Services + API endpoints |
| Frontend smoke | Playwright | Login, dashboard, project list, task list |
| DB migration | Script-based apply/reset | Schema apply/rollback |
| Type safety gate | `tsc --noEmit` | Compile-time safety |

Phase 0 minimum test coverage:
- Auth endpoints
- Project CRUD basics
- Task CRUD, status, comments basics
- Dashboard summary
- Basic tenant isolation behavior
- Frontend smoke: login, dashboard, project list, task list

CI phải chạy: lint → typecheck → backend tests → frontend validation/smoke

**Lý do:** Minimum viable automated safety net giữ được speed của early stage.

---

## ADR-07 — Deployment Target + CI/CD

**Quyết định:**

- Deploy business app lên **VPS**
- Orchestration: **Docker Compose**
- CI: **GitHub Actions**
- Deploy production: **manual deploy workflow** cho early releases

Environment policy:
- Phase 0/1: `dev` + `prod`
- Staging thêm sau nếu cần

Assumptions:
- OpenClaw vẫn local
- Business app chạy trên VPS
- Reverse proxy: nginx hoặc Caddy
- Database backup phải có sớm

**Lý do:** Thực tế và lowest-friction nhất cho operating style hiện tại. Tránh platform complexity quá sớm trong khi vẫn production-capable.

---

## ADR-08 — Observability Minimum (Phase 0)

**Quyết định:** Observability minimum là **bắt buộc từ Phase 0**, không defer sang Phase 8.

Minimum baseline:
- **Pino** cho structured logging
- **`GET /health`** endpoint — bắt buộc
- Request ID / correlation ID phải có trong logs
- **Sentry** cho error tracking nếu có sẵn; nếu không, structured error logging vẫn bắt buộc

Recommended additions:
- `GET /ready` endpoint
- DB và Redis dependency health visibility

**Lý do:** Chạy real users mà không có structured logs và health visibility là debugging trap. Đây là operational hygiene bắt buộc, không phải optional polish.

---

## ADR-09 — n8n Hosting Model

**Quyết định:**

Dùng **self-hosted n8n**.

- Defer deeper workflow integration đến **Phase 2**
- Architecture hỗ trợ cả local self-hosted (workflows nhạy cảm) lẫn VPS-hosted (server-side execution) sau này
- n8n chưa cần embed vào Phase 0 Docker stack

**Lý do:** Giữ full control, nhất quán với hybrid/local-first architecture, tránh cloud cost không cần thiết, giữ infra decision flexible đến khi workflow classes rõ hơn.

---

## ADR-10 — Chat Module Phase 0 Scope

**Quyết định:** **Option B** — build real chat thread/message endpoints cho admin/internal use only.

Không implement production OpenClaw/webhook ingestion cho đến Phase 1.

Chat Phase 0 tồn tại để:
- Validate schema
- Validate persistence và ordering
- Support internal test/demo data
- Chuẩn bị path cho OpenClaw bridge
- Support early UI work cho chat page

**Lý do:** Schema-only quá yếu để validate model. Full webhook/production ingestion kéo Phase 1 complexity vào Phase 0.

---

## ADR-11 — Frontend State Management

**Quyết định:**

- **TanStack Query** — server state (data fetching, caching, sync)
- **Zustand** — lightweight global UI state

Zustand dùng cho: sidebar state, modal visibility, UI filters, ephemeral notifications, auth/session UI state.

**Lý do:** Middle ground thực tế. Tránh Redux-level ceremony, đồng thời tránh overuse Context cho mọi thứ.

---

## ADR-12 — API Versioning + Breaking Change Policy

**Quyết định:**

Prefix: `/api/v1`

**Breaking change** (cần version mới):
- Xóa response field
- Rename field
- Đổi kiểu dữ liệu field
- Xóa endpoint
- Thay đổi behavior làm break existing clients

**Non-breaking change** (không cần version mới):
- Thêm optional response fields
- Thêm endpoint mới
- Thêm optional query params
- Thêm compatible optional behavior

Backward compatibility: giữ ít nhất 1 transition window khi introduce version mới — **30 đến 90 ngày** tùy impact và client usage.

**Lý do:** Stable contract model mà không overcomplicates early API evolution.

---

## Checklist cập nhật plan sau khi chốt ADR

- [x] Thống nhất schema name → `deo` (ADR-03)
- [x] Bỏ `packages/prompts` khỏi Phase 0 tree
- [x] Thống nhất integration code location (ADR-04)
- [x] Bổ sung observability vào Phase 0 (ADR-08)
- [x] Bổ sung service token contract vào Phase 0 integration readiness (ADR-01)
- [x] Cập nhật response envelope format (ADR-05)
- [x] Làm rõ chat module scope Phase 0 (ADR-10)
- [x] Bổ sung RLS coverage list (ADR-02)
- [x] Bổ sung testing stack vào Phase 0 checklist (ADR-06)
- [x] Bổ sung deployment + backup ghi chú (ADR-07)

---

*Version: 2.0 — Fully resolved — 2026-04-12*
