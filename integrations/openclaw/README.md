# integrations/openclaw

> Tên giữ nguyên `openclaw` theo ADR-04 nhưng thực tế GoClaw là agent layer. Sẽ rename sang `goclaw-client` ở Sprint D-3.

Client/transport layer cho GoClaw gateway. Reusable, không chứa business logic (ADR-04).

## Scope

- HTTP client + service token auth (ADR-01)
- Hook callback signature verify
- Webhook payload types
- MCP tool wrappers (officecli, markitdown, postgres)

## Status

🚧 Skeleton only. Hooks implementation Sprint C/D-3.
