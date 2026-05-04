-- Phase 0 v2 — first migration in apps/api/migrations/.
-- Backs Hook 2 (Conversation Logger) per HOOKS_PLAN.md Phase 3.
--
-- Note: schema `deo` is created/owned by separate bootstrap migration (TODO Sprint D-3).
-- This migration assumes schema exists.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS deo;

CREATE TABLE IF NOT EXISTS deo.agent_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          VARCHAR(100) NOT NULL,
  user_id           VARCHAR(200) NOT NULL,
  channel           VARCHAR(40)  NOT NULL,
  tenant_id         UUID,
  user_message      TEXT NOT NULL,
  agent_response    TEXT NOT NULL,
  tokens_prompt     INT,
  tokens_completion INT,
  tokens_total      INT,
  latency_ms        INT,
  correlation_id    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_conversations_agent_created_idx
  ON deo.agent_conversations (agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_conversations_user_created_idx
  ON deo.agent_conversations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_conversations_tenant_created_idx
  ON deo.agent_conversations (tenant_id, created_at DESC)
  WHERE tenant_id IS NOT NULL;

COMMENT ON TABLE deo.agent_conversations IS
  'GoClaw agent conversation log via after_chat hook. See HOOKS_PLAN.md Phase 3.';
