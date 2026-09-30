import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard DATABASE_URL for Dokploy or fallback for local dev
const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgrespassword@localhost:5432/karang_taruna_db';

export const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === 'production' && process.env.PGSSLMODE === 'require'
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function checkDbConnection(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT NOW()');
    return !!res.rows[0];
  } catch (err) {
    console.warn('PostgreSQL connection check failed:', (err as Error).message);
    return false;
  }
}

export async function initDb() {
  const isConnected = await checkDbConnection();
  if (!isConnected) {
    console.warn('Skipping DB schema init: database unreachable at current connectionString.');
    return false;
  }

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('PostgreSQL schema initialized successfully.');
    }

    return true;
  } catch (err) {
    console.error('Error initializing PostgreSQL schema:', err);
    return false;
  }
}

export async function ensureDefaultAdmin() {
  try {
    const countAdmin = await pool.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(countAdmin.rows[0].count, 10) === 0) {
      await pool.query(
        `INSERT INTO admin_users (id, username, password_hash, nama_lengkap, role)
         VALUES 
           ('user-1', 'admin', 'katar2026', 'Administrator Utama', 'admin'),
           ('user-2', 'pengurus', 'pengurus2026', 'Staff Pengurus Harian', 'pengurus')
         ON CONFLICT (username) DO NOTHING`
      );
    }
  } catch (err) {
    console.error('Error creating default admin:', err);
  }
}
