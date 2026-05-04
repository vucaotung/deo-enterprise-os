# Architecture Decision Records (ADRs)

13 ADRs đã chốt — xem [`/ARCHITECTURE_DECISIONS.md`](../../ARCHITECTURE_DECISIONS.md) (canonical).

Folder này dùng cho ADR mới phát sinh trong Phase 0+ implementation, mỗi ADR một file `NNNN-title.md`.

## Index

| # | Title | Status |
|---|---|---|
| 01 | Auth mechanism | ✅ JWT 15m + Refresh 7d + Service token |
| 02 | Multi-tenancy | ✅ Hybrid app-layer + RLS |
| 03 | Schema name | ✅ `deo` |
| 04 | Integration code location | ✅ Split root + apps |
| 05 | Error envelope | ✅ Extended structured |
| 06 | Testing | ✅ Vitest + Supertest + Playwright |
| 07 | Deployment | ✅ VPS + Docker + GH Actions |
| 08 | Observability | ✅ Pino + /health + correlation ID |
| 09 | n8n hosting | ✅ Self-hosted, Phase 2 |
| 10 | Chat Phase 0 scope | ✅ Admin/internal only |
| 11 | Frontend state | ✅ TanStack Query + Zustand |
| 12 | API versioning | ✅ /api/v1 + 30-90d policy |
| 13 | Phase 0 track | ✅ Rebuild monorepo |
