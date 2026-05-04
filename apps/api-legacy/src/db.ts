import pool from './config/database';

/**
 * Legacy compatibility layer.
 *
 * Canonical target for v0.3.0 is: ./config/database
 * This file stays temporarily so older routes/services importing `../db`
 * do not break while the import graph is cleaned up.
 */

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database error', { text, params, error });
    throw error;
  }
}

export async function getClient() {
  return pool.connect();
}

export async function close() {
  await pool.end();
}

export { pool };
export default pool;
