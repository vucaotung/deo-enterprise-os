-- ============================================================
-- Dẹo Enterprise OS — 004 Many-to-Many Relations
-- Chạy SAU 002 + 003
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS deo.business_lines (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(128) NOT NULL UNIQUE,
    code        VARCHAR(32) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deo.company_business_lines (
    company_id       UUID NOT NULL REFERENCES deo.companies(id) ON DELETE CASCADE,
    business_line_id UUID NOT NULL REFERENCES deo.business_lines(id) ON DELETE CASCADE,
    is_primary       BOOLEAN NOT NULL DEFAULT false,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (company_id, business_line_id)
);

CREATE TABLE IF NOT EXISTS deo.agent_assignments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name   VARCHAR(64) NOT NULL,
    company_id   UUID REFERENCES deo.companies(id) ON DELETE CASCADE,
    scope        VARCHAR(128),
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(agent_name, company_id)
);

CREATE TABLE IF NOT EXISTS deo.staff_assignments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES deo.users(id) ON DELETE CASCADE,
    company_id   UUID NOT NULL REFERENCES deo.companies(id) ON DELETE CASCADE,
    role         VARCHAR(64) NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_cbl_company ON deo.company_business_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_cbl_bl ON deo.company_business_lines(business_line_id);
CREATE INDEX IF NOT EXISTS idx_agent_assign ON deo.agent_assignments(agent_name);
CREATE INDEX IF NOT EXISTS idx_staff_assign ON deo.staff_assignments(user_id);

CREATE TRIGGER trg_business_lines_updated BEFORE UPDATE ON deo.business_lines
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();
CREATE TRIGGER trg_agent_assignments_updated BEFORE UPDATE ON deo.agent_assignments
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();
CREATE TRIGGER trg_staff_assignments_updated BEFORE UPDATE ON deo.staff_assignments
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();

INSERT INTO deo.business_lines (name, code) VALUES
    ('Thương mại hàng hóa nông sản', 'nong_san'),
    ('Đầu tư bất động sản', 'bat_dong_san'),
    ('Xây dựng', 'xay_dung'),
    ('Thiết kế & Quản lý dự án', 'thiet_ke_qlda'),
    ('Kinh doanh online', 'kinh_doanh_online')
ON CONFLICT (code) DO NOTHING;

COMMIT;

SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'deo' ORDER BY tablename;
