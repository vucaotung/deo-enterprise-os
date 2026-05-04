# @deo/api

Backend API cho Dẹo Enterprise OS — Phase 0 v2 rebuild (ADR-13).

## Stack

- Express 4 + TypeScript (Node ≥ 20.10)
- Pino structured logging với correlation ID middleware (ADR-08)
- Postgres (`pg`) + Redis (`ioredis`)
- Zod runtime validation
- Vitest + Supertest cho integration tests (ADR-06)

## Phase 0 status — currently shipped

- ✅ Express app factory với DI deps (`logger`, `pool`, `redis`, `hookSecret`)
- ✅ `correlationIdMiddleware` — đọc/sinh `X-Correlation-ID`
- ✅ `errorHandler` chuyển `HttpError` + `ZodError` thành response envelope ADR-05
- ✅ `GET /health` — process alive
- ✅ `GET /ready` — DB + Redis health
- ✅ Pino HTTP logger với redact `authorization`/`x-service-token`/`x-hook-secret`/password
- ✅ **GoClaw hooks** (`HOOKS_PLAN.md` Phase 1+2+3):
  - `POST /hooks/before-chat` — Hook 1 user context inject (stub khi chưa có users table) + Hook 3 rate limit + Hook 5 off-hours
  - `POST /hooks/after-chat` — Hook 2 conversation logger (fire-and-forget)
  - `POST /hooks/on-error` — Hook 4 error alerter (Telegram push TODO)
- ✅ Vitest smoke tests cho health + hooks (auth, payload validation, off-hours, rate limit, fire-and-forget)
- ✅ Migration `001_agent_conversations.sql`

## Phase 0 status — pending

- [ ] Auth module (login/refresh/me) — Sprint D-3
- [ ] Service token middleware (ADR-01) — Sprint D-3
- [ ] Tenant context middleware (ADR-02) — Sprint D-3
- [ ] User identities lookup (wire Hook 1 với DB) — Sprint D-3
- [ ] Projects CRUD — Sprint D-4
- [ ] Tasks CRUD — Sprint D-4
- [ ] Audit module — Sprint D-4
- [ ] Dashboard summary — Sprint D-4
- [ ] Chat threads (admin/internal only, ADR-10) — Sprint D-5
- [ ] RLS migration (ADR-02) — Sprint D-5
- [ ] Telegram alert push trong Hook 4 — Sprint C-2

## Local dev

```bash
cp .env.example .env
pnpm install
pnpm --filter @deo/api dev
```
