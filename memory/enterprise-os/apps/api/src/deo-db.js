const { execFile } = require('child_process');

const DOCKER_CONTAINER = process.env.DEO_DB_CONTAINER || 'deo-postgres';
const DB_NAME = process.env.DEO_DB_NAME || 'deo_os';
const DB_USER = process.env.DEO_DB_USER || 'deo';
const DB_PASSWORD = process.env.DEO_DB_PASSWORD || 'DeoOS_2026_SecurePass!';

function runPsql(sql) {
  return new Promise((resolve, reject) => {
    const args = [
      'exec',
      '-i',
      '-e', `PGPASSWORD=${DB_PASSWORD}`,
      DOCKER_CONTAINER,
      'psql',
      '-U', DB_USER,
      '-d', DB_NAME,
      '-v', 'ON_ERROR_STOP=1',
      '-q',
      '-At',
      '-F', '|',
      '-c', sql,
    ];

    execFile('docker', args, { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || error.message));
      }
      resolve((stdout || '').trim());
    });
  });
}

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function jsonb(v) {
  return `${esc(JSON.stringify(v || {}))}::jsonb`;
}

async function createAuroraJob({ jobType, createdBy = 'vincent', payload = {}, priority = 5, dueAt = null, tags = [], metadata = {}, companyId = null, projectId = null }) {
  const sql = `
    INSERT INTO deo.agent_jobs (
      job_type, priority, created_by, assigned_agent, company_id, project_id,
      payload, status, due_at, tags, metadata
    ) VALUES (
      ${esc(jobType)},
      ${Number(priority) || 5},
      ${esc(createdBy)},
      'agent-tro-ly-zalo',
      ${companyId ? esc(companyId) + '::uuid' : 'NULL'},
      ${projectId ? esc(projectId) + '::uuid' : 'NULL'},
      ${jsonb(payload)},
      'pending',
      ${dueAt ? esc(dueAt) + '::timestamptz' : 'NULL'},
      ${jsonb(tags)},
      ${jsonb(metadata)}
    )
    RETURNING id, job_type, assigned_agent, status, created_at;
  `;
  const out = await runPsql(sql);
  const [id, type, assignedAgent, status, createdAt] = out.split('|');
  return { id, job_type: type, assigned_agent: assignedAgent, status, created_at: createdAt };
}

async function listAuroraJobs(limit = 20, filters = {}) {
  const clauses = ["assigned_agent = 'agent-tro-ly-zalo'"];
  if (filters.status) clauses.push(`status = ${esc(filters.status)}`);
  if (filters.jobType) clauses.push(`job_type = ${esc(filters.jobType)}`);
  const sql = `
    SELECT id, job_type, status, created_by, due_at, created_at, payload, metadata
    FROM deo.agent_jobs
    WHERE ${clauses.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT ${Number(limit) || 20};
  `;
  const out = await runPsql(sql);
  if (!out) return [];
  return out.split(/\r?\n/).filter(Boolean).map(line => {
    const [id, job_type, status, created_by, due_at, created_at, payload, metadata] = line.split('|');
    let payloadObj = {};
    let metadataObj = {};
    try { payloadObj = JSON.parse(payload || '{}'); } catch {}
    try { metadataObj = JSON.parse(metadata || '{}'); } catch {}
    return { id, job_type, status, created_by, due_at, created_at, payload: payloadObj, metadata: metadataObj };
  });
}

async function listDueAuroraReminderJobs(limit = 20) {
  const sql = `
    SELECT id, job_type, status, created_by, due_at, created_at, payload
    FROM deo.agent_jobs
    WHERE assigned_agent = 'agent-tro-ly-zalo'
      AND status = 'pending'
      AND job_type = 'reminder_create'
      AND due_at IS NOT NULL
      AND due_at <= NOW()
    ORDER BY due_at ASC, created_at ASC
    LIMIT ${Number(limit) || 20};
  `;
  const out = await runPsql(sql);
  if (!out) return [];
  return out.split(/\r?\n/).filter(Boolean).map(line => {
    const [id, job_type, status, created_by, due_at, created_at, payload] = line.split('|');
    let payloadObj = {};
    try { payloadObj = JSON.parse(payload || '{}'); } catch {}
    return { id, job_type, status, created_by, due_at, created_at, payload: payloadObj };
  });
}

async function markAuroraJobDone(jobId, patch = {}) {
  const metadataSql = patch.metadata ? `metadata = COALESCE(metadata, '{}'::jsonb) || ${jsonb(patch.metadata)},` : '';
  const sql = `
    UPDATE deo.agent_jobs
    SET status = 'done',
        ${metadataSql}
        updated_at = NOW()
    WHERE id = ${esc(jobId)}::uuid
    RETURNING id, status, updated_at;
  `;
  const out = await runPsql(sql);
  const [id, status, updated_at] = (out || '').split('|');
  return { id, status, updated_at };
}

module.exports = {
  runPsql,
  createAuroraJob,
  listAuroraJobs,
  listDueAuroraReminderJobs,
  markAuroraJobDone,
};
