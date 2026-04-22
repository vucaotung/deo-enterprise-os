-- 002_seed_aurora_agent.sql
-- Canonical A14.5r seed for Aurora inside Enterprise OS control plane.

DO $$
DECLARE
    v_worker_id UUID;
BEGIN
    INSERT INTO workers (
        worker_type,
        code,
        display_name,
        role_name,
        status,
        timezone,
        email,
        chat_identity,
        is_active
    )
    VALUES (
        'ai',
        'ai-aurora',
        'Aurora',
        'Zalo Personal Assistant',
        'active',
        'Asia/Bangkok',
        'vucaotung@gmail.com',
        'zalo:default',
        TRUE
    )
    ON CONFLICT (code) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        role_name = EXCLUDED.role_name,
        status = EXCLUDED.status,
        timezone = EXCLUDED.timezone,
        email = EXCLUDED.email,
        chat_identity = EXCLUDED.chat_identity,
        is_active = EXCLUDED.is_active,
        updated_at = now()
    RETURNING id INTO v_worker_id;

    INSERT INTO ai_agents (
        worker_id,
        agent_key,
        runtime_type,
        execution_mode,
        default_model,
        capabilities_summary,
        can_send_external,
        approval_policy,
        notes
    )
    VALUES (
        v_worker_id,
        'aurora-zalo-pa',
        'openclaw-local',
        'frontline-assistant',
        '9router/Combo1',
        'Gentle Southern-Vietnamese personal assistant for Vincent. Handles reminders, notes, personal finance intake/query, schedule help, Gmail/Calendar/Docs/Sheets/Drive support on vucaotung@gmail.com, travel/booking prep, and lightweight coordination with humans/agents.',
        FALSE,
        'ask_before_external_commitment',
        'Canonical Enterprise OS registration for Aurora. Runtime currently routes through OpenClaw local agent agent-tro-ly-zalo; strategic escalation goes to Dẹo CEO.'
    )
    ON CONFLICT (agent_key) DO UPDATE SET
        runtime_type = EXCLUDED.runtime_type,
        execution_mode = EXCLUDED.execution_mode,
        default_model = EXCLUDED.default_model,
        capabilities_summary = EXCLUDED.capabilities_summary,
        can_send_external = EXCLUDED.can_send_external,
        approval_policy = EXCLUDED.approval_policy,
        notes = EXCLUDED.notes,
        last_seen_at = now();

    DELETE FROM agent_skills WHERE agent_worker_id = v_worker_id;

    INSERT INTO agent_skills (agent_worker_id, skill_key, permission_level, enabled, notes)
    VALUES
        (v_worker_id, 'reminder.create', 'execute', TRUE, 'Create and manage personal reminders for Vincent'),
        (v_worker_id, 'agenda.summary', 'execute', TRUE, 'Summarize today/tomorrow agenda and pending items'),
        (v_worker_id, 'note.capture', 'execute', TRUE, 'Capture and recall quick personal notes'),
        (v_worker_id, 'finance.intake', 'execute', TRUE, 'Capture expense/income candidate into Personal Finance OS intake flow'),
        (v_worker_id, 'finance.query', 'execute', TRUE, 'Answer personal finance questions from Personal Finance OS'),
        (v_worker_id, 'finance.digest.weekly', 'execute', TRUE, 'Weekly digest / debt reminder support'),
        (v_worker_id, 'gmail.assist', 'execute', TRUE, 'Assist on Gmail for vucaotung@gmail.com'),
        (v_worker_id, 'calendar.assist', 'execute', TRUE, 'Assist on Google Calendar for vucaotung@gmail.com'),
        (v_worker_id, 'docs.assist', 'execute', TRUE, 'Assist on Docs/Docs-adjacent work for vucaotung@gmail.com'),
        (v_worker_id, 'sheets.assist', 'execute', TRUE, 'Assist on Google Sheets including Personal Finance OS'),
        (v_worker_id, 'drive.assist', 'execute', TRUE, 'Assist on Google Drive operations for vucaotung@gmail.com'),
        (v_worker_id, 'maps.planning', 'execute', TRUE, 'Travel / route / location planning context'),
        (v_worker_id, 'booking.prep', 'execute', TRUE, 'Prepare booking options but do not finalize without confirmation'),
        (v_worker_id, 'coordination.light', 'execute', TRUE, 'Coordinate with humans/agents for lightweight personal tasks'),
        (v_worker_id, 'escalation.deo', 'execute', TRUE, 'Escalate sensitive or strategic tasks to Dẹo CEO');
END $$;
