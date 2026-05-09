-- Migration 009: user permissions, role validation, schema fixes
-- Append-only; never edit this file after shipping.

-- deo.users: add columns referenced by auth.ts that may be missing in older envs
ALTER TABLE deo.users
  ADD COLUMN IF NOT EXISTS password_hash   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS full_name       VARCHAR(128),
  ADD COLUMN IF NOT EXISTS avatar_url      TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS department      VARCHAR(128);

-- Validate role values in staff_assignments (5-tier hierarchy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'staff_assignments_role_check'
      AND conrelid = 'deo.staff_assignments'::regclass
  ) THEN
    ALTER TABLE deo.staff_assignments
      ADD CONSTRAINT staff_assignments_role_check
      CHECK (role IN ('owner','admin','manager','staff','viewer'));
  END IF;
END$$;

-- Backfill: rows with invalid role → 'staff' (safe default); owner users → 'owner'
UPDATE deo.staff_assignments sa
SET role = 'owner'
FROM deo.users u
WHERE sa.user_id = u.id
  AND u.role = 'owner'
  AND sa.role NOT IN ('owner','admin','manager','staff','viewer');

UPDATE deo.staff_assignments
SET role = 'staff'
WHERE role NOT IN ('owner','admin','manager','staff','viewer');

-- clarifications: add columns used by routes but absent from migration 005
ALTER TABLE deo.clarifications
  ADD COLUMN IF NOT EXISTS company_id      UUID REFERENCES deo.companies(id),
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES deo.conversations(id);

CREATE INDEX IF NOT EXISTS idx_clarifications_company
  ON deo.clarifications(company_id);
CREATE INDEX IF NOT EXISTS idx_clarifications_conversation
  ON deo.clarifications(conversation_id);
