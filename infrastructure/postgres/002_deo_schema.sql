-- ============================================================
-- Dẹo Enterprise OS — Business Schema
-- File: 002_deo_schema.sql
-- Chạy: docker exec -i deo-postgres psql -U deo -d deo_os < 002_deo_schema.sql
-- ============================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS deo;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE deo.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(128) NOT NULL,
    email           VARCHAR(255) UNIQUE,
    phone           VARCHAR(20),
    telegram_id     VARCHAR(64) UNIQUE,
    role            VARCHAR(32) NOT NULL DEFAULT 'staff',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ACCOUNTS
-- ============================================================
CREATE TABLE deo.accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(64) NOT NULL,
    type            VARCHAR(32) NOT NULL DEFAULT 'bank',
    balance         BIGINT NOT NULL DEFAULT 0,
    currency        VARCHAR(3) NOT NULL DEFAULT 'VND',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE deo.categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(64) NOT NULL,
    type            VARCHAR(32) NOT NULL,
    parent_id       UUID REFERENCES deo.categories(id),
    icon            VARCHAR(8),
    color           VARCHAR(7),
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name, type)
);

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE deo.clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(128) NOT NULL,
    company         VARCHAR(128),
    email           VARCHAR(255),
    phone           VARCHAR(20),
    address         TEXT,
    tax_id          VARCHAR(32),
    contact_person  VARCHAR(128),
    tags            JSONB DEFAULT '[]',
    metadata        JSONB DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE deo.projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(128) NOT NULL,
    code            VARCHAR(32) UNIQUE,
    description     TEXT,
    status          VARCHAR(32) NOT NULL DEFAULT 'active',
    client_id       UUID REFERENCES deo.clients(id),
    owner_id        UUID REFERENCES deo.users(id),
    drive_folder_id VARCHAR(128),
    start_date      DATE,
    end_date        DATE,
    budget          BIGINT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE deo.expenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount          BIGINT NOT NULL,
    type            VARCHAR(8) NOT NULL DEFAULT 'out',
    category_id     UUID REFERENCES deo.categories(id),
    account_id      UUID REFERENCES deo.accounts(id),
    user_id         UUID REFERENCES deo.users(id),
    description     VARCHAR(255),
    note            TEXT,
    receipt_url     VARCHAR(512),
    tags            JSONB DEFAULT '[]',
    expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    source          VARCHAR(32) NOT NULL DEFAULT 'chat',
    raw_input       TEXT,
    confidence      REAL,
    n8n_execution_id VARCHAR(36),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON deo.expenses(expense_date DESC);
CREATE INDEX idx_expenses_category ON deo.expenses(category_id);
CREATE INDEX idx_expenses_account ON deo.expenses(account_id);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE deo.tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    status          VARCHAR(32) NOT NULL DEFAULT 'todo',
    priority        VARCHAR(16) NOT NULL DEFAULT 'medium',
    category_id     UUID REFERENCES deo.categories(id),
    project_id      UUID REFERENCES deo.projects(id),
    assigned_to     UUID REFERENCES deo.users(id),
    created_by      UUID REFERENCES deo.users(id),
    due_date        TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    tags            JSONB DEFAULT '[]',
    metadata        JSONB DEFAULT '{}',
    source          VARCHAR(32) NOT NULL DEFAULT 'chat',
    raw_input       TEXT,
    n8n_execution_id VARCHAR(36),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON deo.tasks(status);
CREATE INDEX idx_tasks_assigned ON deo.tasks(assigned_to);
CREATE INDEX idx_tasks_due ON deo.tasks(due_date);

-- ============================================================
-- FILES
-- ============================================================
CREATE TABLE deo.files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename        VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255),
    mime_type       VARCHAR(128),
    file_size       BIGINT,
    drive_file_id   VARCHAR(128),
    drive_url       VARCHAR(512),
    folder_path     VARCHAR(512),
    project_id      UUID REFERENCES deo.projects(id),
    uploaded_by     UUID REFERENCES deo.users(id),
    category_id     UUID REFERENCES deo.categories(id),
    tags            JSONB DEFAULT '[]',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTRACTS
-- ============================================================
CREATE TABLE deo.contracts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    contract_number VARCHAR(64) UNIQUE,
    client_id       UUID REFERENCES deo.clients(id),
    project_id      UUID REFERENCES deo.projects(id),
    status          VARCHAR(32) NOT NULL DEFAULT 'draft',
    type            VARCHAR(32),
    value           BIGINT,
    start_date      DATE,
    end_date        DATE,
    file_id         UUID REFERENCES deo.files(id),
    ai_review_status VARCHAR(32),
    ai_review_result JSONB,
    reviewed_by     UUID REFERENCES deo.users(id),
    signed_at       TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REMINDERS
-- ============================================================
CREATE TABLE deo.reminders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES deo.users(id),
    message         TEXT NOT NULL,
    remind_at       TIMESTAMPTZ NOT NULL,
    repeat_rule     VARCHAR(32),
    channel         VARCHAR(32) NOT NULL DEFAULT 'telegram',
    status          VARCHAR(16) NOT NULL DEFAULT 'pending',
    task_id         UUID REFERENCES deo.tasks(id),
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_pending ON deo.reminders(remind_at) WHERE status = 'pending';

-- ============================================================
-- QUOTES
-- ============================================================
CREATE TABLE deo.quotes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number    VARCHAR(32) UNIQUE,
    client_id       UUID NOT NULL REFERENCES deo.clients(id),
    project_id      UUID REFERENCES deo.projects(id),
    status          VARCHAR(32) NOT NULL DEFAULT 'draft',
    items           JSONB NOT NULL DEFAULT '[]',
    subtotal        BIGINT NOT NULL DEFAULT 0,
    tax_rate        REAL DEFAULT 0,
    tax_amount      BIGINT DEFAULT 0,
    total           BIGINT NOT NULL DEFAULT 0,
    currency        VARCHAR(3) NOT NULL DEFAULT 'VND',
    valid_until     DATE,
    note            TEXT,
    file_id         UUID REFERENCES deo.files(id),
    created_by      UUID REFERENCES deo.users(id),
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMMAND_LOG
-- ============================================================
CREATE TABLE deo.command_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES deo.users(id),
    source          VARCHAR(32) NOT NULL,
    raw_input       TEXT NOT NULL,
    parsed_intent   VARCHAR(64),
    parsed_params   JSONB,
    confidence      REAL,
    n8n_workflow_id VARCHAR(36),
    n8n_execution_id VARCHAR(36),
    status          VARCHAR(16) NOT NULL DEFAULT 'received',
    error_message   TEXT,
    response_text   TEXT,
    received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parsed_at       TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    duration_ms     INT
);

CREATE INDEX idx_command_log_intent ON deo.command_log(parsed_intent);
CREATE INDEX idx_command_log_status ON deo.command_log(status);

-- ============================================================
-- AI_USAGE_LOG
-- ============================================================
CREATE TABLE deo.ai_usage_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_log_id  UUID REFERENCES deo.command_log(id),
    model           VARCHAR(64) NOT NULL,
    purpose         VARCHAR(64) NOT NULL,
    input_tokens    INT NOT NULL DEFAULT 0,
    output_tokens   INT NOT NULL DEFAULT 0,
    total_tokens    INT NOT NULL DEFAULT 0,
    cost_usd        REAL,
    latency_ms      INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_date ON deo.ai_usage_log(created_at);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION deo.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'users','accounts','categories','expenses','tasks',
        'projects','contracts','clients','quotes'
    ]) LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON deo.%s FOR EACH ROW EXECUTE FUNCTION deo.update_timestamp()',
            t, t
        );
    END LOOP;
END $$;

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO deo.categories (name, type, icon, sort_order) VALUES
    ('Ăn uống',     'expense', '🍜', 1),
    ('Di chuyển',   'expense', '🚗', 2),
    ('Văn phòng',   'expense', '🏢', 3),
    ('Marketing',   'expense', '📣', 4),
    ('Phần mềm',   'expense', '💻', 5),
    ('Lương',       'expense', '💰', 6),
    ('Khác',        'expense', '📦', 99),
    ('Phát triển',  'task',    '⚙️', 1),
    ('Thiết kế',    'task',    '🎨', 2),
    ('Kinh doanh',  'task',    '📈', 3),
    ('Hành chính',  'task',    '📋', 4),
    ('Hợp đồng',   'file',    '📄', 1),
    ('Hoá đơn',    'file',    '🧾', 2),
    ('Báo cáo',    'file',    '📊', 3),
    ('Tài liệu',   'file',    '📁', 4);

INSERT INTO deo.accounts (name, type) VALUES
    ('VPBank',  'bank'),
    ('Cash',    'cash'),
    ('Momo',    'ewallet');

INSERT INTO deo.users (name, email, role) VALUES
    ('Boss', 'vucaotung@gmail.com', 'owner');

COMMIT;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'deo' ORDER BY tablename;
