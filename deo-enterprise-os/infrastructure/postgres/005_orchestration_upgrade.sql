-- ============================================================
-- 005_orchestration_upgrade.sql
-- Nâng deo-os từ job queue lên orchestration platform
-- Chạy SAU 002 + 003 + 004
-- ============================================================
BEGIN;

-- AGENTS REGISTRY
CREATE TABLE IF NOT EXISTS deo.agents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(64) NOT NULL UNIQUE,
    display_name    VARCHAR(128) NOT NULL,
    type            VARCHAR(32) NOT NULL DEFAULT 'ai',
    status          VARCHAR(32) NOT NULL DEFAULT 'offline',
    runtime_type    VARCHAR(32),
    capabilities    JSONB DEFAULT '[]',
    config          JSONB DEFAULT '{}',
    last_heartbeat  TIMESTAMPTZ,
    heartbeat_interval_s INT DEFAULT 300,
    api_key_hash    VARCHAR(128),
    api_key_prefix  VARCHAR(16),
    api_key_expires TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agents_status ON deo.agents(status);

-- TASKS V2 COLUMNS
ALTER TABLE deo.tasks ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(32) DEFAULT 'todo';
ALTER TABLE deo.tasks ADD COLUMN IF NOT EXISTS execution_status VARCHAR(32) DEFAULT 'idle';
ALTER TABLE deo.tasks ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE deo.tasks ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES deo.agents(id);
ALTER TABLE deo.tasks ADD COLUMN IF NOT EXISTS review_required BOOLEAN DEFAULT false;
ALTER TABLE deo.tasks ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES deo.users(id);
ALTER TABLE deo.tasks ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE deo.tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES deo.tasks(id);
ALTER TABLE deo.tasks ADD COLUMN IF NOT EXISTS recurring_rule JSONB;
ALTER TABLE deo.tasks ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}';

-- CLARIFICATIONS
CREATE TABLE IF NOT EXISTS deo.clarifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID REFERENCES deo.tasks(id) ON DELETE CASCADE,
    agent_id        UUID REFERENCES deo.agents(id),
    assigned_to     UUID REFERENCES deo.users(id),
    question        TEXT NOT NULL,
    answer          TEXT,
    status          VARCHAR(16) NOT NULL DEFAULT 'open',
    blocks_execution BOOLEAN NOT NULL DEFAULT true,
    checkpoint_data JSONB DEFAULT '{}',
    channel         VARCHAR(32),
    priority        VARCHAR(16) DEFAULT 'normal',
    due_at          TIMESTAMPTZ,
    answered_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clarifications_open ON deo.clarifications(status, assigned_to) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_clarifications_task ON deo.clarifications(task_id);

-- NOTEBOOKS
CREATE TABLE IF NOT EXISTS deo.notebooks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    content         TEXT,
    content_type    VARCHAR(16) DEFAULT 'markdown',
    task_id         UUID REFERENCES deo.tasks(id),
    project_id      UUID REFERENCES deo.projects(id),
    client_id       UUID REFERENCES deo.clients(id),
    company_id      UUID REFERENCES deo.companies(id),
    agent_id        UUID REFERENCES deo.agents(id),
    notebook_type   VARCHAR(32) DEFAULT 'note',
    visibility      VARCHAR(16) DEFAULT 'internal',
    tags            JSONB DEFAULT '[]',
    summary         TEXT,
    created_by      UUID REFERENCES deo.users(id),
    updated_by      UUID REFERENCES deo.users(id),
    version         INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notebooks_task ON deo.notebooks(task_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_project ON deo.notebooks(project_id);

-- AUDIT EVENTS
CREATE TABLE IF NOT EXISTS deo.audit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(64) NOT NULL,
    actor_type      VARCHAR(16) NOT NULL,
    actor_id        VARCHAR(128),
    entity_type     VARCHAR(32),
    entity_id       UUID,
    company_id      UUID REFERENCES deo.companies(id),
    data            JSONB NOT NULL DEFAULT '{}',
    channel         VARCHAR(32),
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON deo.audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_type ON deo.audit_events(event_type, created_at DESC);

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS deo.conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel         VARCHAR(32) NOT NULL,
    channel_id      VARCHAR(128),
    user_id         UUID REFERENCES deo.users(id),
    agent_id        UUID REFERENCES deo.agents(id),
    task_id         UUID REFERENCES deo.tasks(id),
    company_id      UUID REFERENCES deo.companies(id),
    status          VARCHAR(16) DEFAULT 'active',
    context         JSONB DEFAULT '{}',
    last_message_at TIMESTAMPTZ,
    message_count   INT DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON deo.conversations(user_id, status);

-- MESSAGES
CREATE TABLE IF NOT EXISTS deo.messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES deo.conversations(id) ON DELETE CASCADE,
    role            VARCHAR(16) NOT NULL,
    sender_type     VARCHAR(16) NOT NULL,
    sender_id       VARCHAR(128),
    content         TEXT NOT NULL,
    content_type    VARCHAR(16) DEFAULT 'text',
    intent          VARCHAR(64),
    parsed_params   JSONB,
    action_result   JSONB,
    attachments     JSONB DEFAULT '[]',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON deo.messages(conversation_id, created_at);

-- TRIGGERS
CREATE TRIGGER trg_agents_updated BEFORE UPDATE ON deo.agents
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();
CREATE TRIGGER trg_clarifications_updated BEFORE UPDATE ON deo.clarifications
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();
CREATE TRIGGER trg_notebooks_updated BEFORE UPDATE ON deo.notebooks
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();
CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON deo.conversations
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();

-- SEED AGENTS
INSERT INTO deo.agents (name, display_name, type, runtime_type, capabilities) VALUES
    ('deo-admin', 'Dẹo Admin', 'ai', 'openclaw', '["parse_command","route","coordinate","monitor"]'),
    ('agent-phap-che', 'Luật sư Dẹo', 'ai', 'openclaw', '["contract_review","legal_draft","compliance_check"]'),
    ('agent-ke-toan', 'Kế toán Dẹo', 'ai', 'openclaw', '["expense_classify","tax_report","reconciliation"]'),
    ('agent-dieu-phoi', 'Điều phối Dẹo', 'ai', 'openclaw', '["task_manage","reminder","briefing","follow_up"]')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- VERIFY
SELECT 'agents' as tbl, count(*) FROM deo.agents
UNION ALL SELECT 'clarifications', count(*) FROM deo.clarifications
UNION ALL SELECT 'notebooks', count(*) FROM deo.notebooks
UNION ALL SELECT 'audit_events', count(*) FROM deo.audit_events
UNION ALL SELECT 'conversations', count(*) FROM deo.conversations
UNION ALL SELECT 'messages', count(*) FROM deo.messages;
