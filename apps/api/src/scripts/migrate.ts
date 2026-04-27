import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS deo;
    CREATE TABLE IF NOT EXISTS deo._migrations (
      id          SERIAL PRIMARY KEY,
      name        TEXT UNIQUE NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

// If a previous deploy seeded the schema via /docker-entrypoint-initdb.d
// (now removed) we won't have rows in _migrations even though the tables
// exist. Detect this and mark the original 001-007 files as applied so
// the runner doesn't try to re-create them.
async function bootstrapLegacy(client: Client) {
  const tracked = await client.query(`SELECT 1 FROM deo._migrations LIMIT 1`);
  if ((tracked.rowCount ?? 0) > 0) return; // fresh schema OR already tracked

  const hasUsers = await client.query(
    `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'deo' AND table_name = 'users'`
  );
  if (hasUsers.rowCount === 0) return; // truly fresh DB, runner will apply all

  const legacyFiles = [
    '001_init.sql',
    '002_deo_schema.sql',
    '003_deo_v4_update.sql',
    '004_many_to_many.sql',
    '005_orchestration_upgrade.sql',
    '006_backoffice_foundation.sql',
    '007_brain_gdrive.sql',
  ];
  console.log('Detected pre-existing schema; marking legacy migrations as applied.');
  for (const name of legacyFiles) {
    await client.query(
      `INSERT INTO deo._migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`,
      [name]
    );
  }
}

async function applyPending(client: Client) {
  const applied = await client.query<{ name: string }>(
    'SELECT name FROM deo._migrations'
  );
  const appliedSet = new Set(applied.rows.map((r) => r.name));

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log(`No migrations dir at ${MIGRATIONS_DIR}, skipping.`);
    return;
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let n = 0;
  for (const file of files) {
    if (appliedSet.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    process.stdout.write(`migrating ${file} ... `);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO deo._migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log('ok');
      n++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.log('FAIL');
      throw err;
    }
  }
  console.log(`Applied ${n} migration(s).`);
}

async function seedAdminUser(client: Client) {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@enterpriseos.bond').toLowerCase();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!adminPassword) {
    console.log('ADMIN_INITIAL_PASSWORD not set, skipping admin seed.');
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 12);

  const r = await client.query(
    `INSERT INTO deo.users (name, full_name, email, role, is_active, password_hash)
     VALUES ($1, $1, $2, 'admin', true, $3)
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           role = 'admin',
           is_active = true,
           updated_at = NOW()
     RETURNING id, email`,
    ['Admin', adminEmail, hash]
  );
  console.log(`Seeded admin user: ${r.rows[0].email} (id=${r.rows[0].id})`);

  // Ensure admin is linked to a default company
  const company = await client.query(
    `INSERT INTO deo.companies (name, code, business_line, status)
     VALUES ('Dẹo Enterprise', 'DEO', 'general', 'active')
     ON CONFLICT (code) DO UPDATE SET updated_at = NOW()
     RETURNING id`
  );
  const companyId = company.rows[0].id;

  await client.query(
    `INSERT INTO deo.staff_assignments (user_id, company_id, role, is_active)
     VALUES ($1, $2, 'admin', true)
     ON CONFLICT (user_id, company_id) DO UPDATE
       SET role = 'admin', is_active = true, updated_at = NOW()`,
    [r.rows[0].id, companyId]
  );
  console.log(`Linked admin to default company (id=${companyId})`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await ensureMigrationsTable(client);
    await bootstrapLegacy(client);
    await applyPending(client);
    await seedAdminUser(client);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
