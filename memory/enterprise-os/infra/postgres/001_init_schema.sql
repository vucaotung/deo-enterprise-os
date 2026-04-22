CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
    CREATE TYPE worker_type_enum AS ENUM ('human', 'ai');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM ('new', 'triaged', 'queued', 'in_progress', 'waiting_info', 'waiting_approval', 'blocked', 'done', 'cancelled', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE priority_enum AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE approval_status_enum AS ENUM ('pending', 'approved', 'rejected', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE agent_job_status_enum AS ENUM ('queued', 'running', 'waiting_approval', 'done', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE notification_status_enum AS ENUM ('queued', 'sent', 'failed', 'read');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE worker_runtime_enum AS ENUM ('openclaw-local', 'server-worker', 'external');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_code TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    description TEXT,
    primary_contact_name TEXT,
    primary_contact_phone TEXT,
    primary_contact_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_type worker_type_enum NOT NULL,
    code TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role_name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    timezone TEXT DEFAULT 'Asia/Bangkok',
    email TEXT,
    phone TEXT,
    chat_identity TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS human_workers (
    worker_id UUID PRIMARY KEY REFERENCES workers(id) ON DELETE CASCADE,
    employment_type TEXT,
    title TEXT,
    manager_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    external_field_role BOOLEAN NOT NULL DEFAULT FALSE,
    can_approve BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS ai_agents (
    worker_id UUID PRIMARY KEY REFERENCES workers(id) ON DELETE CASCADE,
    agent_key TEXT NOT NULL UNIQUE,
    runtime_type worker_runtime_enum NOT NULL DEFAULT 'openclaw-local',
    execution_mode TEXT,
    default_model TEXT,
    capabilities_summary TEXT,
    can_send_external BOOLEAN NOT NULL DEFAULT FALSE,
    approval_policy TEXT,
    last_seen_at TIMESTAMPTZ,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    priority priority_enum NOT NULL DEFAULT 'normal',
    owner_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    start_date DATE,
    due_date DATE,
    drive_folder_url TEXT,
    source_channel TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT,
    source_type TEXT,
    source_ref TEXT,
    status task_status_enum NOT NULL DEFAULT 'new',
    priority priority_enum NOT NULL DEFAULT 'normal',
    due_at TIMESTAMPTZ,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    owner_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    current_assignee_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    assigned_to_worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
    assigned_by_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    assignment_type TEXT NOT NULL DEFAULT 'executor',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unassigned_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'internal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_type TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    color TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tag_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    object_type TEXT NOT NULL,
    object_id UUID NOT NULL,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    document_type TEXT,
    mime_type TEXT,
    source_type TEXT,
    source_ref TEXT,
    drive_url TEXT,
    drive_file_id TEXT,
    version_no INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    confidentiality_level TEXT NOT NULL DEFAULT 'internal',
    created_by_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL,
    drive_url TEXT,
    drive_file_id TEXT,
    change_summary TEXT,
    created_by_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(document_id, version_no)
);

CREATE TABLE IF NOT EXISTS document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    linked_object_type TEXT NOT NULL,
    linked_object_id UUID NOT NULL,
    relationship_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_type TEXT NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    requested_by_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    approver_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    status approval_status_enum NOT NULL DEFAULT 'pending',
    summary TEXT,
    decision_note TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    approver_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    status approval_status_enum NOT NULL DEFAULT 'pending',
    decided_at TIMESTAMPTZ,
    note TEXT,
    UNIQUE(approval_id, step_order)
);

CREATE TABLE IF NOT EXISTS agent_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
    job_type TEXT NOT NULL,
    input_payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    status agent_job_status_enum NOT NULL DEFAULT 'queued',
    priority priority_enum NOT NULL DEFAULT 'normal',
    queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS agent_job_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_job_id UUID NOT NULL REFERENCES agent_jobs(id) ON DELETE CASCADE,
    output_type TEXT NOT NULL,
    output_ref TEXT,
    output_text TEXT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_run_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_job_id UUID NOT NULL REFERENCES agent_jobs(id) ON DELETE CASCADE,
    level TEXT NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    skill_key TEXT NOT NULL,
    permission_level TEXT NOT NULL DEFAULT 'execute',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    UNIQUE(agent_worker_id, skill_key)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    related_object_type TEXT,
    related_object_id UUID,
    channel TEXT NOT NULL DEFAULT 'dashboard',
    title TEXT NOT NULL,
    body TEXT,
    status notification_status_enum NOT NULL DEFAULT 'queued',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    target_worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL,
    remind_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_by_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    account_label TEXT NOT NULL,
    account_identity TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS intake_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL,
    source_sender TEXT,
    raw_title TEXT,
    raw_body TEXT,
    attachment_count INTEGER NOT NULL DEFAULT 0,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    classification_status TEXT NOT NULL DEFAULT 'unclassified',
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mailbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_account_id UUID NOT NULL REFERENCES integration_accounts(id) ON DELETE CASCADE,
    external_message_id TEXT,
    subject TEXT,
    sender TEXT,
    received_at TIMESTAMPTZ,
    linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    linked_document_id UUID REFERENCES documents(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attendance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    source_type TEXT,
    note TEXT
);

CREATE TABLE IF NOT EXISTS finance_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    entry_type TEXT NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'VND',
    occurred_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    source_ref TEXT,
    note TEXT,
    created_by_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    legal_type TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    due_at TIMESTAMPTZ,
    responsible_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    object_type TEXT NOT NULL,
    object_id UUID,
    summary TEXT,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type TEXT NOT NULL,
    owner_id UUID,
    token_label TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_company_status ON projects(company_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status_due ON tasks(project_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(current_assignee_worker_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status_queued ON agent_jobs(status, queued_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_status_sched ON notifications(recipient_worker_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_documents_project_type ON documents(project_id, document_type);
CREATE INDEX IF NOT EXISTS idx_tag_links_object ON tag_links(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_object_created ON activity_logs(object_type, object_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at_status ON reminders(remind_at, status);
CREATE INDEX IF NOT EXISTS idx_intake_items_classification ON intake_items(classification_status, received_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_workers_updated_at ON workers;
CREATE TRIGGER trg_workers_updated_at BEFORE UPDATE ON workers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_integration_accounts_updated_at ON integration_accounts;
CREATE TRIGGER trg_integration_accounts_updated_at BEFORE UPDATE ON integration_accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
