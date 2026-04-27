-- 009: agent token auth + event log + ingest support

-- Token for agent → API auth (no JWT for machines)
ALTER TABLE deo.agents ADD COLUMN IF NOT EXISTS api_token UUID DEFAULT gen_random_uuid();
UPDATE deo.agents SET api_token = gen_random_uuid() WHERE api_token IS NULL;
ALTER TABLE deo.agents ALTER COLUMN api_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_api_token ON deo.agents(api_token);

-- Identity slot expected by goclaw bridge (e.g. 'office-agent', 'hr-agent')
ALTER TABLE deo.agents ADD COLUMN IF NOT EXISTS slug VARCHAR(64) UNIQUE;

-- Event log: every heartbeat, task completion, error
CREATE TABLE IF NOT EXISTS deo.agent_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id     UUID NOT NULL REFERENCES deo.agents(id) ON DELETE CASCADE,
    company_id   UUID REFERENCES deo.companies(id) ON DELETE CASCADE,
    type         VARCHAR(32) NOT NULL CHECK (type IN (
        'heartbeat','task_started','task_completed','task_failed',
        'clarification_asked','log','error','metric'
    )),
    task_id      UUID REFERENCES deo.tasks(id) ON DELETE SET NULL,
    payload      JSONB DEFAULT '{}',
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_events_agent_time
    ON deo.agent_events(agent_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_company_time
    ON deo.agent_events(company_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_task
    ON deo.agent_events(task_id) WHERE task_id IS NOT NULL;

-- Seed the 3 priority agents if they don't exist (no company yet — staff-tied later)
INSERT INTO deo.agents (slug, name, display_name, type, status)
VALUES
    ('office-agent', 'office-agent', 'Office Agent', 'ai', 'offline'),
    ('hr-agent', 'hr-agent', 'HR Agent', 'ai', 'offline'),
    ('finance-agent', 'finance-agent', 'Finance Agent', 'ai', 'offline')
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    display_name = EXCLUDED.display_name;
