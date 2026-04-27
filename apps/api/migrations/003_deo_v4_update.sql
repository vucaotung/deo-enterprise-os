-- ============================================================
-- Dẹo Enterprise OS — V4 Schema Update
-- File: 003_deo_v4_update.sql
-- Chạy SAU 002_deo_schema.sql
-- ============================================================

BEGIN;

-- ============================================================
-- COMPANIES — Đa công ty/pháp nhân
-- ============================================================
CREATE TABLE IF NOT EXISTS deo.companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(128) NOT NULL,
    legal_name      VARCHAR(255),
    code            VARCHAR(32) UNIQUE,
    tax_id          VARCHAR(32),
    business_line   VARCHAR(32) NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'active',
    address         TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEVICE_LOGS — Thiết bị ngoại vi (camera, sensor, IoT)
-- ============================================================
CREATE TABLE IF NOT EXISTS deo.device_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id       VARCHAR(64) NOT NULL,
    device_type     VARCHAR(32) NOT NULL,
    event_type      VARCHAR(64) NOT NULL,
    data            JSONB NOT NULL,
    company_id      UUID REFERENCES deo.companies(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_logs_device ON deo.device_logs(device_id, created_at DESC);

-- ============================================================
-- ATTENDANCE_LOGS — Chấm công
-- ============================================================
CREATE TABLE IF NOT EXISTS deo.attendance_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES deo.users(id),
    check_type      VARCHAR(8) NOT NULL,
    check_time      TIMESTAMPTZ NOT NULL,
    device_id       VARCHAR(64),
    location        VARCHAR(255),
    company_id      UUID REFERENCES deo.companies(id),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_user ON deo.attendance_logs(user_id, check_time DESC);

-- ============================================================
-- SOCIAL_LOGS — Social media monitoring
-- ============================================================
CREATE TABLE IF NOT EXISTS deo.social_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform        VARCHAR(32) NOT NULL,
    event_type      VARCHAR(64) NOT NULL,
    content         TEXT,
    author          VARCHAR(255),
    url             VARCHAR(512),
    sentiment       VARCHAR(16),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEADS — CRM Lead pipeline
-- ============================================================
CREATE TABLE IF NOT EXISTS deo.leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID REFERENCES deo.clients(id),
    source          VARCHAR(64) NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'new',
    score           INT DEFAULT 0,
    assigned_to     UUID REFERENCES deo.users(id),
    company_id      UUID REFERENCES deo.companies(id),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON deo.leads(status);

-- ============================================================
-- INTERACTIONS — Lịch sử tương tác với khách
-- ============================================================
CREATE TABLE IF NOT EXISTS deo.interactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID REFERENCES deo.clients(id),
    lead_id         UUID REFERENCES deo.leads(id),
    type            VARCHAR(32) NOT NULL,
    channel         VARCHAR(32) NOT NULL,
    content         TEXT,
    direction       VARCHAR(8) NOT NULL DEFAULT 'in',
    user_id         UUID REFERENCES deo.users(id),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATE projects: thêm company_id + business_line
-- ============================================================
ALTER TABLE deo.projects ADD COLUMN IF NOT EXISTS
    company_id UUID REFERENCES deo.companies(id);

ALTER TABLE deo.projects ADD COLUMN IF NOT EXISTS
    business_line VARCHAR(32);

-- ============================================================
-- UPDATE tasks: thêm company_id
-- ============================================================
ALTER TABLE deo.tasks ADD COLUMN IF NOT EXISTS
    company_id UUID REFERENCES deo.companies(id);

-- ============================================================
-- UPDATE expenses: thêm company_id
-- ============================================================
ALTER TABLE deo.expenses ADD COLUMN IF NOT EXISTS
    company_id UUID REFERENCES deo.companies(id);

-- ============================================================
-- TRIGGERS cho tables mới
-- ============================================================
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON deo.companies
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();

CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON deo.leads
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();

COMMIT;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT schemaname, tablename FROM pg_tables
WHERE schemaname = 'deo' ORDER BY tablename;
