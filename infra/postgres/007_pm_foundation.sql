-- ============================================================
-- Dẹo Enterprise OS — 007 Project Manager Foundation
-- Chạy SAU 006
-- Mục tiêu: workers model, project_members, RBAC, missing columns
-- ============================================================
BEGIN;

-- ============================================================
-- PART 1: Workers — unified identity cho human + AI
-- ============================================================

CREATE TABLE IF NOT EXISTS deo.workers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_type     VARCHAR(16) NOT NULL CHECK (worker_type IN ('human', 'ai')),
    display_name    VARCHAR(128) NOT NULL,
    avatar_url      TEXT,
    status          VARCHAR(32) NOT NULL DEFAULT 'active',
    -- FK links tới bảng gốc
    user_id         UUID REFERENCES deo.users(id) ON DELETE SET NULL,
    agent_id        UUID REFERENCES deo.agents(id) ON DELETE SET NULL,
    -- metadata
    company_id      UUID REFERENCES deo.companies(id) ON DELETE SET NULL,
    role_name       VARCHAR(64),
    email           VARCHAR(256),
    phone           VARCHAR(32),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- constraints
    CONSTRAINT chk_worker_link CHECK (
        (worker_type = 'human' AND user_id IS NOT NULL) OR
        (worker_type = 'ai' AND agent_id IS NOT NULL)
    ),
    CONSTRAINT uq_worker_user UNIQUE (user_id),
    CONSTRAINT uq_worker_agent UNIQUE (agent_id)
);

CREATE INDEX IF NOT EXISTS idx_workers_type ON deo.workers(worker_type);
CREATE INDEX IF NOT EXISTS idx_workers_company ON deo.workers(company_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON deo.workers(status);

CREATE TRIGGER trg_workers_updated BEFORE UPDATE ON deo.workers
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();

-- ============================================================
-- PART 2: Project Members
-- ============================================================

CREATE TABLE IF NOT EXISTS deo.project_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES deo.projects(id) ON DELETE CASCADE,
    worker_id       UUID NOT NULL REFERENCES deo.workers(id) ON DELETE CASCADE,
    membership_role VARCHAR(32) NOT NULL DEFAULT 'contributor',
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at         TIMESTAMPTZ,
    added_by        UUID REFERENCES deo.workers(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_member UNIQUE (project_id, worker_id),
    CONSTRAINT chk_membership_role CHECK (
        membership_role IN ('owner', 'manager', 'contributor', 'viewer', 'approver')
    )
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON deo.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_worker ON deo.project_members(worker_id);

CREATE TRIGGER trg_project_members_updated BEFORE UPDATE ON deo.project_members
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();

-- ============================================================
-- PART 3: RBAC — roles, permissions, role_permissions, worker_roles
-- ============================================================

-- Roles
CREATE TABLE IF NOT EXISTS deo.roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(64) NOT NULL UNIQUE,
    label       VARCHAR(128) NOT NULL,
    description TEXT,
    is_system   BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON deo.roles
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();

-- Permissions
CREATE TABLE IF NOT EXISTS deo.permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(64) NOT NULL UNIQUE,
    label       VARCHAR(128) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role <-> Permission mapping
CREATE TABLE IF NOT EXISTS deo.role_permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id         UUID NOT NULL REFERENCES deo.roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES deo.permissions(id) ON DELETE CASCADE,
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

-- Worker <-> Role assignment (with scope)
CREATE TABLE IF NOT EXISTS deo.worker_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id       UUID NOT NULL REFERENCES deo.workers(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES deo.roles(id) ON DELETE CASCADE,
    scope_type      VARCHAR(32) NOT NULL DEFAULT 'global',
    scope_id        UUID,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by     UUID REFERENCES deo.workers(id) ON DELETE SET NULL,
    CONSTRAINT chk_scope_type CHECK (scope_type IN ('global', 'project', 'company'))
);

-- Unique index cho global scope (scope_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_worker_role_global
    ON deo.worker_roles(worker_id, role_id, scope_type)
    WHERE scope_id IS NULL;

-- Unique index cho project/company scope (scope_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uq_worker_role_scoped
    ON deo.worker_roles(worker_id, role_id, scope_type, scope_id)
    WHERE scope_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_worker_roles_worker ON deo.worker_roles(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_roles_role ON deo.worker_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_worker_roles_scope ON deo.worker_roles(scope_type, scope_id);

-- ============================================================
-- PART 4: Missing columns — projects
-- ============================================================

ALTER TABLE deo.projects
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS priority VARCHAR(16) DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS owner_worker_id UUID REFERENCES deo.workers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS health_status VARCHAR(16) DEFAULT 'on_track',
    ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;

-- Chỉ add constraint nếu chưa tồn tại
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_project_priority'
    ) THEN
        ALTER TABLE deo.projects ADD CONSTRAINT chk_project_priority
            CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_project_health'
    ) THEN
        ALTER TABLE deo.projects ADD CONSTRAINT chk_project_health
            CHECK (health_status IN ('on_track', 'at_risk', 'off_track'));
    END IF;
END $$;

-- ============================================================
-- PART 5: Missing columns — tasks
-- ============================================================

ALTER TABLE deo.tasks
    ADD COLUMN IF NOT EXISTS progress_percentage INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS category VARCHAR(64),
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES deo.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS source VARCHAR(64) DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_task_progress'
    ) THEN
        ALTER TABLE deo.tasks ADD CONSTRAINT chk_task_progress
            CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
    END IF;
END $$;

-- ============================================================
-- PART 6: Activity log (nếu chưa có)
-- ============================================================

CREATE TABLE IF NOT EXISTS deo.activity_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action          VARCHAR(64) NOT NULL,
    actor_type      VARCHAR(16) NOT NULL,
    actor_id        UUID,
    entity_type     VARCHAR(32) NOT NULL,
    entity_id       UUID,
    project_id      UUID REFERENCES deo.projects(id) ON DELETE SET NULL,
    company_id      UUID REFERENCES deo.companies(id) ON DELETE SET NULL,
    summary         TEXT,
    diff_data       JSONB DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON deo.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project ON deo.activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON deo.activity_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON deo.activity_logs(actor_type, actor_id);

-- ============================================================
-- PART 7: Approvals table (nếu chưa có)
-- ============================================================

CREATE TABLE IF NOT EXISTS deo.approvals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(32) NOT NULL,
    entity_id       UUID NOT NULL,
    requested_by    UUID REFERENCES deo.workers(id) ON DELETE SET NULL,
    assigned_to     UUID REFERENCES deo.workers(id) ON DELETE SET NULL,
    status          VARCHAR(16) NOT NULL DEFAULT 'pending',
    decision_note   TEXT,
    decided_at      TIMESTAMPTZ,
    decided_by      UUID REFERENCES deo.workers(id) ON DELETE SET NULL,
    due_at          TIMESTAMPTZ,
    project_id      UUID REFERENCES deo.projects(id) ON DELETE SET NULL,
    company_id      UUID REFERENCES deo.companies(id) ON DELETE SET NULL,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_approval_status CHECK (
        status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')
    )
);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON deo.approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_assigned ON deo.approvals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_approvals_entity ON deo.approvals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approvals_project ON deo.approvals(project_id);

CREATE TRIGGER trg_approvals_updated BEFORE UPDATE ON deo.approvals
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();

COMMIT;

-- VERIFY
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'deo'
ORDER BY tablename;
