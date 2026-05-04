import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../../..', '.env') });

export const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'deo',
  password: process.env.POSTGRES_PASSWORD || 'DeoOS_2026_SecurePass!',
  database: process.env.POSTGRES_DB || 'deo_os',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Set timezone for all queries
pool.on('connect', (client) => {
  client.query("SET timezone TO 'Asia/Bangkok'");
});

// Test connection
pool.query('SELECT NOW() as time')
  .then((res) => {
    console.log('✓ Database connected:', res.rows[0].time);
  })
  .catch((err) => {
    console.error('✗ Database connection error:', err.message);
  });

export default pool;
