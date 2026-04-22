-- 006_seed_aurora_live_registry.sql
-- Register Aurora in the CURRENT live Enterprise OS DB model (schema deo).

INSERT INTO deo.users (
    name,
    email,
    position,
    department,
    is_active
)
VALUES (
    'Vincent',
    'vucaotung@gmail.com',
    'Owner',
    'Personal Office',
    TRUE
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    position = EXCLUDED.position,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active,
    updated_at = now();

DELETE FROM deo.agent_assignments
WHERE agent_name = 'agent-tro-ly-zalo'
  AND company_id IS NULL;

INSERT INTO deo.agent_assignments (
    agent_name,
    company_id,
    scope,
    is_active
)
VALUES (
    'agent-tro-ly-zalo',
    NULL,
    'personal-assistant:zalo:vucaotung@gmail.com',
    TRUE
);

-- Optional queue sanity marker: Aurora is now a canonical assignee name in the live job queue system.
