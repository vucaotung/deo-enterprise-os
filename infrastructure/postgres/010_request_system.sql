-- Migration 010: Request / Pull / Comment system
-- Replaces free-form chat as the primary human→agent interaction channel.
-- Append-only; never edit this file after shipping.

CREATE TABLE IF NOT EXISTS deo.requests (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    type           VARCHAR(32)  NOT NULL DEFAULT 'general',
    -- general | task_request | review | data_pull | clarification
    status         VARCHAR(32)  NOT NULL DEFAULT 'open',
    -- open | in_progress | approved | rejected | resolved | closed
    priority       VARCHAR(16)  NOT NULL DEFAULT 'normal',
    -- low | normal | high | urgent
    company_id     UUID NOT NULL REFERENCES deo.companies(id),
    created_by     UUID NOT NULL REFERENCES deo.users(id),
    assigned_agent UUID REFERENCES deo.agents(id),
    -- NULL until user "pulls" an agent in
    context_type   VARCHAR(32),   -- task | project | expense | null
    context_id     UUID,          -- polymorphic ref; no FK enforced (cross-table)
    metadata       JSONB NOT NULL DEFAULT '{}',
    resolved_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deo.request_comments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id    UUID NOT NULL REFERENCES deo.requests(id) ON DELETE CASCADE,
    author_type   VARCHAR(16) NOT NULL CHECK (author_type IN ('user','agent')),
    author_id     VARCHAR(128) NOT NULL,   -- user UUID or agent name/id
    content       TEXT NOT NULL,
    content_type  VARCHAR(16) NOT NULL DEFAULT 'text',
    -- text | markdown | action_result
    action_result JSONB,                   -- structured agent output
    parent_id     UUID REFERENCES deo.request_comments(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_company
  ON deo.requests(company_id);
CREATE INDEX IF NOT EXISTS idx_requests_status
  ON deo.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_context
  ON deo.requests(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_requests_agent
  ON deo.requests(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_request_comments_request
  ON deo.request_comments(request_id);
CREATE INDEX IF NOT EXISTS idx_request_comments_parent
  ON deo.request_comments(parent_id);
