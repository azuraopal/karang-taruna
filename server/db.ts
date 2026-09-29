import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { INITIAL_TIM, INITIAL_BERITA, INITIAL_GALERI, INITIAL_ASPIRASI } from '../src/data/initialData.js';

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

    // Seed initial data if tables are empty
    await seedIfEmpty();
    return true;
  } catch (err) {
    console.error('Error initializing PostgreSQL schema:', err);
    return false;
  }
}

export async function seedIfEmpty() {
  try {
    // 1. Seed Berita
    const countBerita = await pool.query('SELECT COUNT(*) FROM berita');
    if (parseInt(countBerita.rows[0].count, 10) === 0) {
      console.log('Seeding initial Berita into PostgreSQL...');
      for (const b of INITIAL_BERITA) {
        await pool.query(
          `INSERT INTO berita (id, judul, slug, ringkasan, isi, kategori, tanggal, penulis, gambar_url, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [b.id, b.judul, b.slug, b.ringkasan, b.isi, b.kategori, b.tanggal, b.penulis, b.gambarUrl, b.status]
        );
      }
    }

    // 2. Seed Tim
    const countTim = await pool.query('SELECT COUNT(*) FROM anggota_tim');
    if (parseInt(countTim.rows[0].count, 10) === 0) {
      console.log('Seeding initial Tim into PostgreSQL...');
      let order = 1;
      for (const t of INITIAL_TIM) {
        await pool.query(
          `INSERT INTO anggota_tim (id, nama, jabatan, divisi, foto_url, bio, email, no_hp, urutan)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [t.id, t.nama, t.jabatan, t.divisi, t.fotoUrl, t.bio, t.email || null, t.noHp || null, order++]
        );
      }
    }

    // 3. Seed Galeri
    const countGaleri = await pool.query('SELECT COUNT(*) FROM galeri');
    if (parseInt(countGaleri.rows[0].count, 10) === 0) {
      console.log('Seeding initial Galeri into PostgreSQL...');
      for (const g of INITIAL_GALERI) {
        await pool.query(
          `INSERT INTO galeri (id, judul, kategori, tanggal, gambar_url, deskripsi, lokasi)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [g.id, g.judul, g.kategori, g.tanggal, g.gambarUrl, g.deskripsi, g.lokasi]
        );
      }
    }

    // 4. Seed Aspirasi
    const countAspirasi = await pool.query('SELECT COUNT(*) FROM aspirasi');
    if (parseInt(countAspirasi.rows[0].count, 10) === 0) {
      console.log('Seeding initial Aspirasi into PostgreSQL...');
      for (const a of INITIAL_ASPIRASI) {
        await pool.query(
          `INSERT INTO aspirasi (id, nama, email, no_hp, kategori, pesan, tanggal, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [a.id, a.nama, a.email, a.noHp, a.kategori, a.pesan, a.tanggal, a.status]
        );
      }
    }

    // 5. Seed default Admin User (admin / katar2026)
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
    console.error('Error during data seeding:', err);
  }
}
