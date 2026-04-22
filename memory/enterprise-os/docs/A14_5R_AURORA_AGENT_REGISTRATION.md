# A14.5r — Aurora Agent Registration (Enterprise OS Control Plane)

## Why this exists
Aurora was first created as an OpenClaw runtime agent so Zalo routing could work immediately.

However, the **project architecture** treats OpenClaw as the execution plane, while the Enterprise OS repo/database is the control plane / source of truth. Therefore Aurora also needs a canonical registration inside the project layer.

## Current repo reality
There are **two agent models** visible in the repo/history:

1. **Future scaffold model** in `infra/postgres/001_init_schema.sql`
   - `workers`
   - `ai_agents`
   - `agent_skills`
   - `agent_jobs`

2. **Current live DB model** already running on local Docker (`schema deo`)
   - `users`
   - `agent_assignments`
   - `agent_jobs`
   - `agent_job_runs`
   - `agent_job_messages`

A14.5r registers Aurora against the **current live DB model** so the running system can see the agent now, while also keeping a future-facing seed for the scaffold model.

---

## Aurora canonical identity
- Runtime/OpenClaw agent id: `agent-tro-ly-zalo`
- Public persona name: `Aurora`
- Role: Zalo personal assistant for Vincent
- Execution plane: OpenClaw local
- Primary Google surface: `vucaotung@gmail.com`

## Scope
Aurora covers:
- reminders
- agenda summary
- note capture
- personal finance intake/query
- Gmail / Calendar / Docs / Sheets / Drive assistance
- Maps/travel planning context
- booking preparation
- lightweight coordination with humans/agents

## Approval boundary
Aurora must ask before:
- booking/paying for anything real
- committing to external people
- sensitive outbound communication

## Files added
### Future scaffold seed
- `infra/postgres/002_seed_aurora_agent.sql`

### Current live DB seed
- `infra/postgres/006_seed_aurora_live_registry.sql`

---

## Operational note
OpenClaw routing and Zalo binding already point to Aurora at runtime.
This A14.5r step adds the **project-side registry layer** so Aurora is no longer only a runtime persona, but also a named control-plane actor in Enterprise OS.
