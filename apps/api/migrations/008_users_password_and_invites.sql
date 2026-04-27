-- 008: password auth + invite-code signup + role enum tightening
-- Idempotent: safe to re-run.

-- Password column on users
ALTER TABLE deo.users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE deo.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Display name alias (auth.ts reads user.full_name; users table only has name)
ALTER TABLE deo.users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
UPDATE deo.users SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;

-- Avatar (auth.ts /me references it)
ALTER TABLE deo.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- One-time invite codes for signup
CREATE TABLE IF NOT EXISTS deo.invites (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(64) UNIQUE NOT NULL,
    email        VARCHAR(255) NOT NULL,
    full_name    VARCHAR(255),
    company_id   UUID REFERENCES deo.companies(id) ON DELETE CASCADE,
    role         VARCHAR(64) NOT NULL DEFAULT 'staff'
                 CHECK (role IN ('admin', 'manager', 'staff', 'agent_handler')),
    created_by   UUID REFERENCES deo.users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    used_at      TIMESTAMPTZ,
    used_by      UUID REFERENCES deo.users(id)
);

CREATE INDEX IF NOT EXISTS idx_invites_code_unused
    ON deo.invites(code)
    WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invites_email
    ON deo.invites(email);

-- Email is required for password login; backfill where missing using name
UPDATE deo.users SET email = lower(name) || '@local'
WHERE email IS NULL AND name IS NOT NULL;
