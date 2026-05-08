-- ============================================================
-- 008_agent_jobs_and_executions.sql
-- Tách "task nghiệp vụ" ↔ "lần chạy" ↔ "agent runtime artifact"
--
-- tasks            : việc nghiệp vụ (đã có)
-- task_executions  : mỗi lần thử chạy task (control plane)
-- agent_jobs       : từng agent runtime invocation (data plane,
--                    chứa logs/tokens/cost, payload Redis queue)
--
-- 1 task : N executions
-- 1 execution : 1+ agent_jobs (chain qua sequence_index)
--
-- Chạy SAU 005.
-- ============================================================
BEGIN;

-- TASK_EXECUTIONS
CREATE TABLE IF NOT EXISTS deo.task_executions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id             UUID NOT NULL REFERENCES deo.tasks(id) ON DELETE CASCADE,
    parent_execution_id UUID REFERENCES deo.task_executions(id),
    attempt_number      INT NOT NULL DEFAULT 1,
    status              VARCHAR(32) NOT NULL DEFAULT 'pending',
        -- pending | running | succeeded | failed | cancelled | needs_review
    triggered_by        UUID REFERENCES deo.users(id),
    trigger_reason      VARCHAR(64),
        -- manual | retry | scheduled | chain | webhook
    result              JSONB DEFAULT '{}',
    error               JSONB,
    started_at          TIMESTAMPTZ,
    finished_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_executions_task
    ON deo.task_executions(task_id, attempt_number DESC);
CREATE INDEX IF NOT EXISTS idx_task_executions_active
    ON deo.task_executions(status)
    WHERE status IN ('pending','running');

-- AGENT_JOBS
CREATE TABLE IF NOT EXISTS deo.agent_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id    UUID NOT NULL REFERENCES deo.task_executions(id) ON DELETE CASCADE,
    sequence_index  INT NOT NULL DEFAULT 0,
        -- thứ tự trong multi-agent chain (planner → coder → reviewer)
    agent_id        UUID REFERENCES deo.agents(id),
    runtime_type    VARCHAR(32) NOT NULL,
        -- claude-code | openclaw | n8n | internal
    queue_name      VARCHAR(128),
    queue_state     VARCHAR(32) NOT NULL DEFAULT 'queued',
        -- queued | claimed | running | done | dead | cancelled
    input           JSONB DEFAULT '{}',
    output          JSONB,
    logs_url        TEXT,
    log_tail        TEXT,
    tokens_in       INT,
    tokens_out      INT,
    cost_usd        NUMERIC(10,4),
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_execution
    ON deo.agent_jobs(execution_id, sequence_index);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_agent_state
    ON deo.agent_jobs(agent_id, queue_state);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_runtime_active
    ON deo.agent_jobs(runtime_type, queue_state)
    WHERE queue_state IN ('queued','claimed','running');

-- TRIGGERS (re-use deo.update_timestamp() từ 002)
CREATE TRIGGER trg_task_executions_updated BEFORE UPDATE ON deo.task_executions
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();
CREATE TRIGGER trg_agent_jobs_updated BEFORE UPDATE ON deo.agent_jobs
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();

COMMIT;

-- VERIFY
SELECT 'task_executions' AS tbl, count(*) FROM deo.task_executions
UNION ALL SELECT 'agent_jobs', count(*) FROM deo.agent_jobs;
