import { Pool } from 'pg';
import type { Env } from './config/env.js';

export const createDbPool = (env: Pick<Env, 'DATABASE_URL' | 'DB_SCHEMA'>): Pool => {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    application_name: 'deo-api',
  });
  pool.on('connect', (client) => {
    void client.query(`SET search_path TO ${env.DB_SCHEMA}, public`);
  });
  return pool;
};

export const pingDb = async (pool: Pool): Promise<boolean> => {
  try {
    const res = await pool.query('SELECT 1 AS ok');
    return res.rows[0]?.ok === 1;
  } catch {
    return false;
  }
};
