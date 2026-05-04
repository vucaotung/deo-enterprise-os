# @deo/api

Backend API cho Dẹo Enterprise OS — Phase 0 v2 rebuild (ADR-13).

## Stack

- Express 4 + TypeScript (Node ≥ 20.10)
- Pino structured logging với correlation ID middleware (ADR-08)
- Postgres (`pg`) + Redis (`ioredis`)
- Zod runtime validation
- Vitest + Supertest cho integration tests (ADR-06)

## Phase 0 status — currently shipped

- ✅ Express app factory với DI deps (`logger`, `pool`, `redis`)
- ✅ `correlationIdMiddleware` — đọc/sinh `X-Correlation-ID`
- ✅ `errorHandler` chuyển `HttpError` + `ZodError` thành response envelope ADR-05
- ✅ `GET /health` — process alive
- ✅ `GET /ready` — DB + Redis health
- ✅ Pino HTTP logger với redact authorization/service-token/password
- ✅ Vitest smoke tests cho health endpoints

## Phase 0 status — pending

- [ ] Auth module (login/refresh/me) — Sprint D-3
- [ ] Service token middleware (ADR-01) — Sprint D-3
- [ ] Tenant context middleware (ADR-02) — Sprint D-3
- [ ] Projects CRUD — Sprint D-4
- [ ] Tasks CRUD — Sprint D-4
- [ ] Audit module — Sprint D-4
- [ ] Dashboard summary — Sprint D-4
- [ ] Chat threads (admin/internal only, ADR-10) — Sprint D-5
- [ ] RLS migration (ADR-02) — Sprint D-5

## Local dev

```bash
cp .env.example .env
pnpm install
pnpm --filter @deo/api dev
```
