-- ============================================================
-- Dẹo Enterprise OS — Migration 007
-- 2nd Brain: Obsidian vault tracking + Google Drive index
-- ============================================================

SET search_path = deo, public;

-- ─────────────────────────────────────────────
-- BRAIN NOTES: track Obsidian vault notes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deo.brain_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_path    TEXT NOT NULL UNIQUE,          -- relative path in vault e.g. "02-projects/foo/index.md"
  title         TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'note'   -- note | project | client | sop | wiki | journal | daily
                  CHECK (type IN ('note','project','client','sop','wiki','journal','daily','area','resource')),
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','archived','draft')),
  gdrive_path   TEXT,                          -- corresponding GDrive folder e.g. "DEO-OS/02_PROJECTS/foo"
  tags          TEXT[]   DEFAULT '{}',
  frontmatter   JSONB    DEFAULT '{}',         -- raw YAML frontmatter parsed
  content_hash  TEXT,                          -- sha256 of content, for change detection
  word_count    INTEGER  DEFAULT 0,
  embedded_at   TIMESTAMPTZ,                   -- when last embedded into vector store
  entity_type   TEXT,                          -- optional link to DB entity: task | client | project | lead
  entity_id     UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brain_notes_type    ON deo.brain_notes(type);
CREATE INDEX IF NOT EXISTS idx_brain_notes_status  ON deo.brain_notes(status);
CREATE INDEX IF NOT EXISTS idx_brain_notes_tags    ON deo.brain_notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_brain_notes_entity  ON deo.brain_notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_brain_notes_embed   ON deo.brain_notes(embedded_at) WHERE embedded_at IS NULL;

-- ─────────────────────────────────────────────
-- BRAIN CHUNKS: text chunks for RAG
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deo.brain_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id       UUID NOT NULL REFERENCES deo.brain_notes(id) ON DELETE CASCADE,
  chunk_index   INTEGER NOT NULL,              -- 0-based chunk position within note
  content       TEXT NOT NULL,
  chroma_id     TEXT,                          -- ChromaDB document ID
  token_count   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (note_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_brain_chunks_note   ON deo.brain_chunks(note_id);
CREATE INDEX IF NOT EXISTS idx_brain_chunks_chroma ON deo.brain_chunks(chroma_id);

-- ─────────────────────────────────────────────
-- GDRIVE FILES: Google Drive file index
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deo.gdrive_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gdrive_id     TEXT NOT NULL UNIQUE,          -- Google Drive file ID
  name          TEXT NOT NULL,
  gdrive_path   TEXT NOT NULL,                 -- full path e.g. "DEO-OS/01_CLIENTS/Foo/contracts/bar.pdf"
  folder_path   TEXT NOT NULL,                 -- parent folder path
  mime_type     TEXT,
  size_bytes    BIGINT DEFAULT 0,
  web_view_url  TEXT,
  web_content_url TEXT,
  -- optional link to DB entity
  entity_type   TEXT,                          -- task | client | project | expense | lead
  entity_id     UUID,
  -- metadata
  gdrive_created_at   TIMESTAMPTZ,
  gdrive_modified_at  TIMESTAMPTZ,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdrive_files_path     ON deo.gdrive_files(gdrive_path);
CREATE INDEX IF NOT EXISTS idx_gdrive_files_folder   ON deo.gdrive_files(folder_path);
CREATE INDEX IF NOT EXISTS idx_gdrive_files_entity   ON deo.gdrive_files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_gdrive_files_mime     ON deo.gdrive_files(mime_type);

-- ─────────────────────────────────────────────
-- SYNC LOG: track all sync operations
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deo.sync_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type         TEXT NOT NULL               -- gdrive_mirror | vault_git | embed_sync | daily_note
                      CHECK (sync_type IN ('gdrive_mirror','vault_git','embed_sync','daily_note','manual')),
  direction         TEXT                        -- up | down | bidirectional
                      CHECK (direction IN ('up','down','bidirectional')),
  status            TEXT NOT NULL DEFAULT 'running'
                      CHECK (status IN ('running','success','failed','partial')),
  records_processed INTEGER DEFAULT 0,
  files_synced      INTEGER DEFAULT 0,
  error_message     TEXT,
  meta              JSONB DEFAULT '{}',         -- extra info (counts, paths, etc.)
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_log_type   ON deo.sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON deo.sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_time   ON deo.sync_log(started_at DESC);

-- ─────────────────────────────────────────────
-- BRAIN CAPTURES: quick capture queue
-- (Telegram /capture, API POST /brain/capture)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deo.brain_captures (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT NOT NULL,
  source      TEXT DEFAULT 'api'               -- api | telegram | web | manual
                CHECK (source IN ('api','telegram','web','manual')),
  tags        TEXT[] DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'pending'  -- pending | processed | discarded
                CHECK (status IN ('pending','processed','discarded')),
  note_id     UUID REFERENCES deo.brain_notes(id) ON DELETE SET NULL,  -- set when processed
  created_by  UUID REFERENCES deo.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_brain_captures_status ON deo.brain_captures(status);
CREATE INDEX IF NOT EXISTS idx_brain_captures_time   ON deo.brain_captures(created_at DESC);

-- ─────────────────────────────────────────────
-- TRIGGERS: updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION deo.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_brain_notes_updated_at ON deo.brain_notes;
CREATE TRIGGER trg_brain_notes_updated_at
  BEFORE UPDATE ON deo.brain_notes
  FOR EACH ROW EXECUTE FUNCTION deo.update_updated_at();

-- ─────────────────────────────────────────────
-- VIEWS: useful queries
-- ─────────────────────────────────────────────

-- Notes chưa được embed vào vector store
CREATE OR REPLACE VIEW deo.v_brain_pending_embed AS
SELECT id, vault_path, title, type, content_hash, updated_at
FROM deo.brain_notes
WHERE status = 'active'
  AND (embedded_at IS NULL OR embedded_at < updated_at)
ORDER BY updated_at DESC;

-- Summary sync status
CREATE OR REPLACE VIEW deo.v_sync_status AS
SELECT
  sync_type,
  COUNT(*) FILTER (WHERE status = 'success') AS success_count,
  COUNT(*) FILTER (WHERE status = 'failed')  AS failed_count,
  MAX(started_at) FILTER (WHERE status = 'success') AS last_success,
  MAX(started_at) FILTER (WHERE status = 'failed')  AS last_failure
FROM deo.sync_log
GROUP BY sync_type;

-- ─────────────────────────────────────────────
-- SEED: initial vault structure notes
-- ─────────────────────────────────────────────
INSERT INTO deo.brain_notes (vault_path, title, type, status, tags, frontmatter)
VALUES
  ('_INDEX.md',                              'Brain Vault Index',     'resource', 'active', '{}',               '{"pinned": true}'),
  ('03-areas/tech/deo-enterprise-os.md',     'Dẹo Enterprise OS',     'area',     'active', '{"tech","system"}', '{}'),
  ('03-areas/business/5balance-overview.md', '5Balance Overview',     'area',     'active', '{"business"}',      '{}'),
  ('04-resources/sops/agent-task-creation.md','SOp: Agent Task Flow', 'sop',      'active', '{"sop","agent"}',   '{}')
ON CONFLICT (vault_path) DO NOTHING;

-- ─────────────────────────────────────────────
COMMENT ON TABLE deo.brain_notes    IS 'Obsidian vault note index — tracks all .md files in the vault';
COMMENT ON TABLE deo.brain_chunks   IS 'Text chunks from notes, ready for vector embedding via ChromaDB';
COMMENT ON TABLE deo.gdrive_files   IS 'Google Drive file index — mirrors DEO-OS/ folder structure';
COMMENT ON TABLE deo.sync_log       IS 'Audit log for all sync operations (gdrive, vault, embed)';
COMMENT ON TABLE deo.brain_captures IS 'Quick capture queue — inbox items before processing into vault';
