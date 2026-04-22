# Enterprise OS Scaffold — Dẹo

## Mục tiêu
Scaffold này là bộ khung cho hệ:
- VPS = não + DB + dashboard
- Drive = kho output/share
- Local OpenClaw = runtime executor
- Human staff + AI staff cùng làm việc trên cùng task system

## Cấu trúc

```text
enterprise-os/
  docker-compose.yml
  .env.example
  README.md
  infra/
    postgres/
      001_init_schema.sql
    nginx/
      default.conf
  docs/
    SYSTEM_ARCHITECTURE_V1_DEO.md
    DATABASE_SCHEMA_V1_DEO.md
    WORKFLOW_MAP_V1_DEO.md
    ERD_AND_RELATIONS_V1_DEO.md
  apps/
    api/
    web/
    worker/
  packages/
    shared/
```

## Chạy local dev
1. Copy `.env.example` thành `.env`
2. Sửa password/db nếu cần
3. Chạy:

```bash
docker compose up -d
```

## Services mặc định
- Web dashboard: `http://localhost:3000`
- API: `http://localhost:3001`
- Postgres: `127.0.0.1:5432`
- Redis: `127.0.0.1:6379`

## Ghi chú
- `apps/*` mới là scaffold trống, chưa có app logic hoàn chỉnh
- DB schema đã có file SQL thật ở `infra/postgres/001_init_schema.sql`
- Docs kiến trúc và workflow nằm ở workspace root và có thể copy vào `docs/`
