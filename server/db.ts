import { Pool } from 'pg';
import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

if (process.env.KATAR_STORAGE !== 'json') dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function hashSeedPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

// Standard DATABASE_URL for Dokploy or fallback for local dev only
const connectionString =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? undefined
    : 'postgres://postgres:postgres@localhost:5432/karang_taruna_db');

export const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === 'production' && process.env.PGSSLMODE === 'require'
      ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let schemaInitPromise: Promise<boolean> | null = null;

export async function checkDbConnection(): Promise<boolean> {
  if (process.env.KATAR_STORAGE === 'json') return false;
  try {
    const res = await pool.query('SELECT NOW()');
    return !!res.rows[0];
  } catch (err) {
    console.warn('PostgreSQL connection check failed:', (err as Error).message);
    return false;
  }
}

export function initDb(): Promise<boolean> {
  if (process.env.KATAR_STORAGE === 'json') return Promise.resolve(false);
  if (schemaInitPromise) return schemaInitPromise;

  schemaInitPromise = (async () => {
    const isConnected = await checkDbConnection();
    if (!isConnected) {
      console.warn('Skipping DB schema init: database unreachable at current connectionString.');
      return false;
    }

    try {
      const schemaCandidates = [
        path.join(process.cwd(), 'server', 'schema.sql'),
        path.join(__dirname, 'schema.sql'),
      ];
      const schemaPath = schemaCandidates.find((candidate) => fs.existsSync(candidate));
      if (!schemaPath) {
        console.warn('PostgreSQL schema file was not found.');
        return false;
      }

      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      await migratePlaintextPasswords();
      await ensureDefaultAdmin();
      console.log('PostgreSQL schema initialized successfully.');
      return true;
    } catch (err) {
      console.error('Error initializing PostgreSQL schema:', err);
      return false;
    }
  })().then(initialized => {
    if (!initialized) schemaInitPromise = null;
    return initialized;
  });

  return schemaInitPromise;
}

async function migratePlaintextPasswords() {
  try {
    const res = await pool.query(
      `SELECT id, password_hash FROM admin_users WHERE password_hash IS NOT NULL AND password_hash <> '' AND password_hash NOT LIKE 'scrypt:%'`
    );
    for (const row of res.rows) {
      await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [
        hashSeedPassword(row.password_hash),
        row.id,
      ]);
    }
    if (res.rows.length > 0) {
      console.log(`Migrated ${res.rows.length} legacy plaintext admin password(s) to scrypt.`);
    }
  } catch (err) {
    console.error('Error migrating plaintext passwords:', err);
  }
}

export async function ensureDefaultAdmin() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const superadminPassword = process.env.DEFAULT_SUPERADMIN_PASSWORD?.trim() || (isProduction ? '' : 'superadmin2026');
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD?.trim() || (isProduction ? '' : 'katar2026');
    const pengurusPassword = process.env.DEFAULT_PENGURUS_PASSWORD?.trim() || (isProduction ? '' : 'pengurus2026');

    const countAdmin = await pool.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(countAdmin.rows[0].count, 10) === 0) {
      if (adminPassword) {
        await pool.query(
          `INSERT INTO admin_users (id, username, password_hash, nama_lengkap, role)
           VALUES ('user-1', 'admin', $1, 'Administrator Utama', 'admin')
           ON CONFLICT (username) DO NOTHING`,
          [hashSeedPassword(adminPassword)]
        );
      }
      if (pengurusPassword) {
        await pool.query(
          `INSERT INTO admin_users (id, username, password_hash, nama_lengkap, role)
           VALUES ('user-2', 'pengurus', $1, 'Staff Pengurus Harian', 'pengurus')
           ON CONFLICT (username) DO NOTHING`,
          [hashSeedPassword(pengurusPassword)]
        );
      }
    }
    if (superadminPassword) {
      await pool.query(
        `INSERT INTO admin_users (id, username, password_hash, nama_lengkap, role)
         VALUES ('user-0', 'superadmin', $1, 'Super Administrator', 'superadmin')
         ON CONFLICT (username) DO NOTHING`,
        [hashSeedPassword(superadminPassword)]
      );
    } else if (isProduction && parseInt(countAdmin.rows[0].count, 10) === 0) {
      console.warn('No admin users exist and DEFAULT_SUPERADMIN_PASSWORD is not set.');
    }
  } catch (err) {
    console.error('Error creating default admin:', err);
  }
}
