-- Migration 011: Task comments + global notifications
-- Replaces the requests/request_comments concept (deprecated, kept for data).
-- Append-only; never edit this file after shipping.

BEGIN;

CREATE TABLE IF NOT EXISTS deo.task_comments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id       UUID NOT NULL REFERENCES deo.tasks(id) ON DELETE CASCADE,
    parent_id     UUID REFERENCES deo.task_comments(id),
    author_type   VARCHAR(16) NOT NULL CHECK (author_type IN ('user','agent')),
    author_id     VARCHAR(128) NOT NULL,           -- user UUID or agent name/id (free-form)
    content       TEXT NOT NULL,
    content_type  VARCHAR(16) NOT NULL DEFAULT 'text',
    -- text | markdown | action_result
    action_result JSONB,
    mentions      UUID[] NOT NULL DEFAULT '{}',    -- mentioned user IDs (deo.users)
    source        VARCHAR(32) NOT NULL DEFAULT 'web',
    -- web | telegram | api | agent
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task
    ON deo.task_comments(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent
    ON deo.task_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_mentions
    ON deo.task_comments USING GIN (mentions);

CREATE TABLE IF NOT EXISTS deo.notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES deo.users(id) ON DELETE CASCADE,
    type         VARCHAR(32) NOT NULL,
    -- mention | assignment | agent_update | review_required | job_done | comment
    title        VARCHAR(255) NOT NULL,
    body         TEXT,
    link         VARCHAR(512),
    entity_type  VARCHAR(32),                      -- task | comment | job
    entity_id    UUID,
    read_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON deo.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_all
    ON deo.notifications(user_id, created_at DESC);

ALTER TABLE deo.users
    ADD COLUMN IF NOT EXISTS notify_via_telegram BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;
