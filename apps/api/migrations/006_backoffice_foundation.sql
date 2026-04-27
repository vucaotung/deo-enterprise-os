BEGIN;

CREATE TABLE IF NOT EXISTS deo.workflow_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    purpose TEXT NOT NULL,
    domain_type TEXT NOT NULL,
    trigger_mode TEXT NOT NULL,
    execution_style TEXT NOT NULL,
    suitable_for_agents JSONB NOT NULL DEFAULT '[]',
    allowed_context_types JSONB NOT NULL DEFAULT '[]',
    allowed_actions JSONB NOT NULL DEFAULT '[]',
    input_schema_key TEXT,
    output_schema_key TEXT,
    callback_schema_key TEXT,
    n8n_workflow_id TEXT,
    n8n_entrypoint_url TEXT,
    lifecycle_status TEXT NOT NULL DEFAULT 'draft',
    rollout_stage TEXT NOT NULL DEFAULT 'experimental',
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_domain_type ON deo.workflow_definitions(domain_type);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_lifecycle_status ON deo.workflow_definitions(lifecycle_status);

CREATE TABLE IF NOT EXISTS deo.backoffice_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invocation_id UUID,
    workflow_key TEXT,
    google_file_id TEXT NOT NULL UNIQUE,
    google_file_type TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    document_type TEXT,
    generation_mode TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    version TEXT,
    folder_id TEXT,
    folder_path TEXT,
    source_thread_id TEXT,
    source_message_id TEXT,
    linked_project_id UUID REFERENCES deo.projects(id),
    linked_task_id UUID REFERENCES deo.tasks(id),
    linked_client_id UUID REFERENCES deo.clients(id),
    linked_case_id UUID,
    owner_user_id UUID REFERENCES deo.users(id),
    reviewer_emails JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_backoffice_files_workflow_key ON deo.backoffice_files(workflow_key);
CREATE INDEX IF NOT EXISTS idx_backoffice_files_generation_mode ON deo.backoffice_files(generation_mode);
CREATE INDEX IF NOT EXISTS idx_backoffice_files_status ON deo.backoffice_files(status);
CREATE INDEX IF NOT EXISTS idx_backoffice_files_project_id ON deo.backoffice_files(linked_project_id);
CREATE INDEX IF NOT EXISTS idx_backoffice_files_task_id ON deo.backoffice_files(linked_task_id);
CREATE INDEX IF NOT EXISTS idx_backoffice_files_thread_id ON deo.backoffice_files(source_thread_id);

CREATE TRIGGER trg_workflow_definitions_updated BEFORE UPDATE ON deo.workflow_definitions
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();
CREATE TRIGGER trg_backoffice_files_updated BEFORE UPDATE ON deo.backoffice_files
    FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp();

INSERT INTO deo.workflow_definitions (
    workflow_key, name, description, purpose, domain_type, trigger_mode, execution_style,
    suitable_for_agents, allowed_context_types, allowed_actions,
    input_schema_key, callback_schema_key, lifecycle_status, rollout_stage, is_enabled
) VALUES
    ('drive.resolve-folder.v1', 'Drive Resolve Folder', 'Resolve target Google Drive folder path for backoffice outputs.', 'Resolve folder path from context', 'files', 'sync', 'direct', '["backoffice_agent","project_coordinator","writer_agent"]', '["thread","project","task","client","general"]', '["resolve_folder"]', 'schema.drive-resolve-folder.input.v1', NULL, 'active', 'internal', true),
    ('drive.ensure-folder-tree.v1', 'Drive Ensure Folder Tree', 'Ensure required folder tree exists on Google Drive.', 'Ensure folder tree exists', 'files', 'async', 'callback', '["backoffice_agent","project_coordinator"]', '["project","client","general"]', '["ensure_folder_tree"]', 'schema.drive-ensure-folder-tree.input.v1', 'schema.drive-ensure-folder-tree.callback.v1', 'draft', 'experimental', true),
    ('drive.share-for-review.v1', 'Drive Share For Review', 'Share file with reviewers on Google Drive.', 'Set file review permissions', 'files', 'async', 'callback', '["backoffice_agent","writer_agent","project_coordinator"]', '["thread","project","task","client","general"]', '["share_file"]', 'schema.drive-share-for-review.input.v1', 'schema.drive-share-for-review.callback.v1', 'active', 'internal', true),
    ('docs.from-template.v1', 'Docs From Template', 'Create Google Doc from template and placeholder data.', 'Generate document from template', 'files', 'async', 'callback', '["backoffice_agent","writer_agent","project_coordinator"]', '["thread","project","task","client","general"]', '["create_doc_from_template"]', 'schema.docs-from-template.input.v1', 'schema.docs-from-template.callback.v1', 'active', 'internal', true),
    ('docs.draft-from-context.v1', 'Docs Draft From Context', 'Generate draft text from context before materialization.', 'Generate draft from context', 'files', 'sync', 'direct', '["backoffice_agent","writer_agent","knowledge_agent"]', '["thread","project","task","general"]', '["draft_doc_from_context"]', 'schema.docs-draft-from-context.input.v1', NULL, 'draft', 'experimental', true)
ON CONFLICT (workflow_key) DO NOTHING;

COMMIT;
