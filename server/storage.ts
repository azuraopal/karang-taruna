import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pool, checkDbConnection } from './db.js';
import { createAgendaStorage, AgendaError, type Agenda, type AgendaJson } from './agendaStorage.js';
import { createMeetingGroupStorage } from './meetingGroupStorage.js';
import type { ActivityRecap } from '../src/utils/activityRecap.js';
import type { ActivityLog, Berita, AnggotaTim, ItemGaleri, Aspirasi, UserAccount } from '../src/types/index.js';

import { isAttendanceDate, isAttendanceStatus, type AttendanceRecord, type AttendanceStatus } from '../src/utils/attendance.js';

const DB_FILE = process.env.DEV_DB_FILE || path.join(process.cwd(), 'server', 'dev_db.json');

export const DEFAULT_USERS: UserAccount[] = [
  { id: 'user-0', username: 'superadmin', namaLengkap: 'Super Administrator', role: 'superadmin', isActive: true, createdAt: 'September 2026' },
  { id: 'user-1', username: 'admin', namaLengkap: 'Administrator Utama', role: 'admin', isActive: true, createdAt: 'September 2026' },
  { id: 'user-2', username: 'pengurus', namaLengkap: 'Staff Pengurus Harian', role: 'pengurus', isActive: true, createdAt: 'September 2026' },
];

interface DevDbData {
  [collection: string]: unknown;
  agenda?: Agenda[];
  absensi?: AttendanceRecord[];
  meetingAttendance?: AttendanceRecord[];
  berita: Berita[];
  tim: AnggotaTim[];
  galeri: ItemGaleri[];
  aspirasi: Aspirasi[];
  users: UserAccount[];
  activityLogs: ActivityLog[];
}

function loadDevDb(): DevDbData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Gagal membaca dev_db.json, membuat baru:', err);
  }

  const initialData: DevDbData = {
    berita: [],
    tim: [],
    galeri: [],
    aspirasi: [],
    users: DEFAULT_USERS,
    activityLogs: [],
  };
  saveDevDb(initialData);
  return initialData;
}

// ---------------------- ACTIVITY LOGS ----------------------
export async function getActivityLogs(): Promise<ActivityLog[]> {
  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      `SELECT id, action, entity, description, actor_name as "actorName", actor_role as "actorRole", created_at as "createdAt"
       FROM activity_logs ORDER BY created_at DESC LIMIT 300`
    );
    return res.rows;
  }
  return (localDb.activityLogs || []).slice(0, 300);
}

export async function createActivityLog(item: ActivityLog): Promise<ActivityLog> {
  const record = { ...item, createdAt: item.createdAt || new Date().toISOString() };
  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      `INSERT INTO activity_logs (id, action, entity, description, actor_name, actor_role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING
       RETURNING id, action, entity, description, actor_name as "actorName", actor_role as "actorRole", created_at as "createdAt"`,
      [record.id, record.action, record.entity, record.description, record.actorName, record.actorRole || null, record.createdAt]
    );
    return res.rows[0] || record;
  }
  localDb.activityLogs = [record, ...(localDb.activityLogs || [])].slice(0, 300);
  saveDevDb(localDb);
  return record;
}

function saveDevDb(data: DevDbData) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Gagal menyimpan dev_db.json:', err);
  }
}

// Global in-memory cache synchronized with disk
let localDb = loadDevDb();

// Agenda shares the same authoritative backend and live JSON cache as attendance.
const agendaJson: AgendaJson = {
    read: () => localDb,
    update(change) {
      const next = change(localDb) as DevDbData;
      const temporary = DB_FILE + '.' + crypto.randomUUID() + '.tmp';
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      try {
        fs.writeFileSync(temporary, JSON.stringify(next, null, 2), 'utf8');
        fs.renameSync(temporary, DB_FILE);
      } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
      localDb = next;
    },
};
export const agendaStorage = createAgendaStorage({
  usesPg: authoritativeUsesPg,
  query: (sql, values) => pool.query(sql, values),
  json: agendaJson,
});
export const meetingGroupStorage = createMeetingGroupStorage({ usesPg: authoritativeUsesPg, query: (sql, values) => pool.query(sql, values), json: agendaJson });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, storedPassword: string): boolean {
  if (!storedPassword.startsWith('scrypt:')) {
    return storedPassword === password;
  }

  const [, salt, expectedHash] = storedPassword.split(':');
  const actualHash = crypto.scryptSync(password, salt, 64).toString('hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = Buffer.from(actualHash, 'hex');

  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

// ---------------------- BERITA ----------------------
export async function getBerita(): Promise<Berita[]> {
  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      'SELECT id, judul, slug, ringkasan, isi, kategori, tanggal, tanggal_pelaksanaan as "tanggalPelaksanaan", penulis, gambar_url as "gambarUrl", gambar_urls as "gambarUrls", status, dibuat_oleh as "dibuatOleh" FROM berita ORDER BY created_at DESC'
    );
    return res.rows;
  }
  return localDb.berita;
}

export async function createBerita(item: Omit<Berita, 'id'>): Promise<Berita> {
  const id = 'berita-' + Date.now();
  const slug = item.slug || item.judul.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const record: Berita = { ...item, id, slug };

  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      `INSERT INTO berita (id, judul, slug, ringkasan, isi, kategori, tanggal, tanggal_pelaksanaan, penulis, gambar_url, gambar_urls, status, dibuat_oleh)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, judul, slug, ringkasan, isi, kategori, tanggal, tanggal_pelaksanaan as "tanggalPelaksanaan", penulis, gambar_url as "gambarUrl", gambar_urls as "gambarUrls", status, dibuat_oleh as "dibuatOleh"`,
      [id, record.judul, record.slug, record.ringkasan, record.isi, record.kategori, record.tanggal, record.tanggalPelaksanaan || null, record.penulis, record.gambarUrl, JSON.stringify(record.gambarUrls || []), record.status, record.dibuatOleh || null]
    );
    return res.rows[0];
  }

  localDb.berita = [record, ...localDb.berita];
  saveDevDb(localDb);
  return record;
}

export async function updateBerita(id: string, item: Partial<Berita>): Promise<Berita | null> {
  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      `UPDATE berita
       SET judul = COALESCE($1, judul),
           slug = COALESCE($2, slug),
           ringkasan = COALESCE($3, ringkasan),
           isi = COALESCE($4, isi),
           kategori = COALESCE($5, kategori),
           tanggal = COALESCE($6, tanggal),
             tanggal_pelaksanaan = $7,
             penulis = COALESCE($8, penulis),
             gambar_url = COALESCE($9, gambar_url),
             gambar_urls = COALESCE($10::jsonb, gambar_urls),
             status = COALESCE($11, status)
             WHERE id = $12
             RETURNING id, judul, slug, ringkasan, isi, kategori, tanggal, tanggal_pelaksanaan as "tanggalPelaksanaan", penulis, gambar_url as "gambarUrl", gambar_urls as "gambarUrls", status`,
            [item.judul, item.slug, item.ringkasan, item.isi, item.kategori, item.tanggal, item.tanggalPelaksanaan || null, item.penulis, item.gambarUrl, item.gambarUrls ? JSON.stringify(item.gambarUrls) : null, item.status, id]
    );
    return res.rows[0] || null;
  }

  const idx = localDb.berita.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  localDb.berita[idx] = { ...localDb.berita[idx], ...item };
  saveDevDb(localDb);
  return localDb.berita[idx];
}

export async function deleteBerita(id: string): Promise<boolean> {
  const isPg = await checkDbConnection();
  if (isPg) {
    await pool.query('DELETE FROM berita WHERE id = $1', [id]);
    return true;
  }

  localDb.berita = localDb.berita.filter((b) => b.id !== id);
  saveDevDb(localDb);
  return true;
}

// ---------------------- TIM ----------------------
export async function getTim(): Promise<AnggotaTim[]> {
  const isPg = await authoritativeUsesPg();
  if (isPg) {
    const res = await pool.query(
      'SELECT id, nama, jabatan, divisi, foto_url as "fotoUrl", bio, email, no_hp as "noHp", dibuat_oleh as "dibuatOleh" FROM anggota_tim ORDER BY urutan ASC, created_at ASC'
    );
    return res.rows;
  }
  return localDb.tim;
}

export async function createTim(item: Omit<AnggotaTim, 'id'>): Promise<AnggotaTim> {
  const id = 'tim-' + Date.now();
  const record: AnggotaTim = { ...item, id };

  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      `INSERT INTO anggota_tim (id, nama, jabatan, divisi, foto_url, bio, email, no_hp, dibuat_oleh)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, nama, jabatan, divisi, foto_url as "fotoUrl", bio, email, no_hp as "noHp", dibuat_oleh as "dibuatOleh"`,
      [id, record.nama, record.jabatan, record.divisi, record.fotoUrl, record.bio, record.email || null, record.noHp || null, record.dibuatOleh || null]
    );
    return res.rows[0];
  }

  localDb.tim = [...localDb.tim, record];
  saveDevDb(localDb);
  return record;
}

export async function updateTim(id: string, item: Partial<AnggotaTim>): Promise<AnggotaTim | null> {
  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      `UPDATE anggota_tim
       SET nama = COALESCE($1, nama),
           jabatan = COALESCE($2, jabatan),
           divisi = COALESCE($3, divisi),
           foto_url = COALESCE($4, foto_url),
           bio = COALESCE($5, bio),
           email = COALESCE($6, email),
           no_hp = COALESCE($7, no_hp)
       WHERE id = $8
       RETURNING id, nama, jabatan, divisi, foto_url as "fotoUrl", bio, email, no_hp as "noHp"`,
      [item.nama, item.jabatan, item.divisi, item.fotoUrl, item.bio, item.email, item.noHp, id]
    );
    return res.rows[0] || null;
  }

  const idx = localDb.tim.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  localDb.tim[idx] = { ...localDb.tim[idx], ...item };
  saveDevDb(localDb);
  return localDb.tim[idx];
}

export async function deleteTim(id: string): Promise<boolean> {
  const isPg = await checkDbConnection();
  if (isPg) {
    await pool.query('DELETE FROM anggota_tim WHERE id = $1', [id]);
    return true;
  }

  localDb.tim = localDb.tim.filter((t) => t.id !== id);
  saveDevDb(localDb);
  return true;
}

// ---------------------- GALERI ----------------------
export async function getGaleri(): Promise<ItemGaleri[]> {
  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      'SELECT id, judul, kategori, tanggal, gambar_url as "gambarUrl", gambar_urls as "gambarUrls", deskripsi, lokasi, dibuat_oleh as "dibuatOleh" FROM galeri ORDER BY created_at DESC'
    );
    return res.rows;
  }
  return localDb.galeri;
}

export async function createGaleri(item: Omit<ItemGaleri, 'id'>): Promise<ItemGaleri> {
  const id = 'galeri-' + Date.now();
  const record: ItemGaleri = { ...item, id };

  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      `INSERT INTO galeri (id, judul, kategori, tanggal, gambar_url, gambar_urls, deskripsi, lokasi, dibuat_oleh)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, judul, kategori, tanggal, gambar_url as "gambarUrl", gambar_urls as "gambarUrls", deskripsi, lokasi, dibuat_oleh as "dibuatOleh"`,
      [id, record.judul, record.kategori, record.tanggal, record.gambarUrl, JSON.stringify(record.gambarUrls || []), record.deskripsi, record.lokasi, record.dibuatOleh || null]
    );
    return res.rows[0];
  }

  localDb.galeri = [record, ...localDb.galeri];
  saveDevDb(localDb);
  return record;
}

export async function updateGaleri(id: string, item: Partial<ItemGaleri>): Promise<ItemGaleri | null> {
  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      `UPDATE galeri
       SET judul = COALESCE($1, judul),
           kategori = COALESCE($2, kategori),
           tanggal = COALESCE($3, tanggal),
           gambar_url = COALESCE($4, gambar_url),
             gambar_urls = COALESCE($5::jsonb, gambar_urls),
             deskripsi = COALESCE($6, deskripsi),
             lokasi = COALESCE($7, lokasi)
           WHERE id = $8
           RETURNING id, judul, kategori, tanggal, gambar_url as "gambarUrl", gambar_urls as "gambarUrls", deskripsi, lokasi`,
          [item.judul, item.kategori, item.tanggal, item.gambarUrl, item.gambarUrls ? JSON.stringify(item.gambarUrls) : null, item.deskripsi, item.lokasi, id]
    );
    return res.rows[0] || null;
  }

  const idx = localDb.galeri.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  localDb.galeri[idx] = { ...localDb.galeri[idx], ...item };
  saveDevDb(localDb);
  return localDb.galeri[idx];
}

export async function deleteGaleri(id: string): Promise<boolean> {
  const isPg = await checkDbConnection();
  if (isPg) {
    await pool.query('DELETE FROM galeri WHERE id = $1', [id]);
    return true;
  }

  localDb.galeri = localDb.galeri.filter((g) => g.id !== id);
  saveDevDb(localDb);
  return true;
}

// ---------------------- ASPIRASI ----------------------
export async function getAspirasi(): Promise<Aspirasi[]> {
  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      'SELECT id, nama, email, no_hp as "noHp", kategori, pesan, tanggal, status, dibuat_oleh as "dibuatOleh" FROM aspirasi ORDER BY created_at DESC'
    );
    return res.rows;
  }
  return localDb.aspirasi;
}

export async function createAspirasi(item: { nama: string; email: string; noHp: string; kategori: Aspirasi['kategori']; pesan: string; dibuatOleh?: string }): Promise<Aspirasi> {
  const id = 'asp-' + Date.now();
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const record: Aspirasi = { ...item, id, tanggal, status: 'baru' };

  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      `INSERT INTO aspirasi (id, nama, email, no_hp, kategori, pesan, tanggal, status, dibuat_oleh)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, nama, email, no_hp as "noHp", kategori, pesan, tanggal, status, dibuat_oleh as "dibuatOleh"`,
      [id, record.nama, record.email, record.noHp, record.kategori, record.pesan, tanggal, 'baru', record.dibuatOleh || null]
    );
    return res.rows[0];
  }

  localDb.aspirasi = [record, ...localDb.aspirasi];
  saveDevDb(localDb);
  return record;
}

export async function updateStatusAspirasi(id: string, status: Aspirasi['status']): Promise<Aspirasi | null> {
  const isPg = await checkDbConnection();
  if (isPg) {
    const res = await pool.query(
      `UPDATE aspirasi SET status = $1 WHERE id = $2 RETURNING id, nama, email, no_hp as "noHp", kategori, pesan, tanggal, status`,
      [status, id]
    );
    return res.rows[0] || null;
  }

  const idx = localDb.aspirasi.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  localDb.aspirasi[idx] = { ...localDb.aspirasi[idx], status };
  saveDevDb(localDb);
  return localDb.aspirasi[idx];
}

export async function deleteAspirasi(id: string): Promise<boolean> {
  const isPg = await checkDbConnection();
  if (isPg) {
    await pool.query('DELETE FROM aspirasi WHERE id = $1', [id]);
    return true;
  }

  localDb.aspirasi = localDb.aspirasi.filter((a) => a.id !== id);
  saveDevDb(localDb);
  return true;
}

// ---------------------- USERS ----------------------
export async function getUsers(): Promise<UserAccount[]> {
  const isPg = await authoritativeUsesPg();
  if (isPg) {
    const res = await pool.query(
      'SELECT id, username, nama_lengkap as "namaLengkap", role, is_active as "isActive", created_at as "createdAt", dibuat_oleh as "dibuatOleh" FROM admin_users ORDER BY created_at ASC'
    );
    return res.rows;
  }
  return localDb.users;
}

export async function createUser(item: Omit<UserAccount, 'id'>): Promise<UserAccount> {
  const id = 'user-' + Date.now();
  const createdAt = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const record: UserAccount = { ...item, id, isActive: item.isActive !== false, createdAt };

  const isPg = await authoritativeUsesPg();
  if (isPg) {
    const res = await pool.query(
      `INSERT INTO admin_users (id, username, password_hash, nama_lengkap, role, is_active, dibuat_oleh)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, nama_lengkap as "namaLengkap", role, is_active as "isActive", created_at as "createdAt", dibuat_oleh as "dibuatOleh"`,
      [id, record.username, hashPassword(record.password || '123456'), record.namaLengkap, record.role, record.isActive, record.dibuatOleh || null]
    );
    return res.rows[0];
  }

  localDb.users = [...localDb.users, record];
  saveDevDb(localDb);
  return record;
}

export async function updateUser(id: string, item: Partial<UserAccount>): Promise<UserAccount | null> {
  const isPg = await authoritativeUsesPg();
  if (isPg) {
    let query = 'UPDATE admin_users SET nama_lengkap = COALESCE($1, nama_lengkap), role = COALESCE($2, role), is_active = COALESCE($3, is_active)';
    const values: (string | boolean | null)[] = [item.namaLengkap?.trim() || null, item.role || null, item.isActive ?? null];
    if (item.password && item.password.trim()) {
      query += ', password_hash = $4 WHERE id = $5';
      values.push(hashPassword(item.password.trim()), id);
    } else {
      query += ' WHERE id = $4';
      values.push(id);
    }
    query += ' RETURNING id, username, nama_lengkap as "namaLengkap", role, is_active as "isActive", created_at as "createdAt", dibuat_oleh as "dibuatOleh"';
    const res = await pool.query(query, values);
    return res.rows[0] || null;
  }

  const idx = localDb.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  localDb.users[idx] = { ...localDb.users[idx], ...item };
  saveDevDb(localDb);
  return localDb.users[idx];
}

export async function deleteUser(id: string): Promise<boolean> {
  const isPg = await authoritativeUsesPg();
  if (isPg) {
    await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);
    return true;
  }

  localDb.users = localDb.users.filter((u) => u.id !== id);
  saveDevDb(localDb);
  return true;
}

// ---------------------- AUTH ----------------------
export async function getUserActiveStatus(username: string): Promise<boolean | null> {
  const isPg = await authoritativeUsesPg();
  if (isPg) {
    const res = await pool.query(
      'SELECT is_active as "isActive" FROM admin_users WHERE LOWER(username) = LOWER($1)',
      [username.trim()]
    );
    return res.rows.length > 0 ? res.rows[0].isActive !== false : null;
  }

  const found = localDb.users.find((user) => user.username.toLowerCase() === username.trim().toLowerCase());
  return found ? found.isActive !== false : null;
}

export async function authenticate(username: string, pass: string): Promise<UserAccount | null> {
  const isPg = await authoritativeUsesPg();
  if (isPg) {
    const res = await pool.query(
      'SELECT id, username, password_hash, nama_lengkap as "namaLengkap", role, is_active as "isActive" FROM admin_users WHERE username = $1',
      [username.trim()]
    );
    if (res.rows.length > 0 && res.rows[0].isActive !== false && verifyPassword(pass.trim(), res.rows[0].password_hash)) {
      const { password_hash: _passwordHash, ...user } = res.rows[0];
      return user;
    }
    return null;
  }

  // Check localDb
  const found = localDb.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (found && found.isActive !== false) {
    if (found.password) {
      if (verifyPassword(pass.trim(), found.password)) return found;
    } else if (found.username === 'admin' && pass.trim() === 'katar2026') {
      return found;
    } else if (found.username === 'pengurus' && pass.trim() === 'pengurus2026') {
      return found;
    }
  }

  return null;
}


// Pin a successful backend selection; rejected probes may retry after recovery.
let attendanceBackend: Promise<boolean> | undefined;
async function authoritativeUsesPg() {
  attendanceBackend ??= (async () => {
    if (process.env.KATAR_STORAGE === 'json') return false;
    const connected = await checkDbConnection();
    if (!connected && (process.env.KATAR_STORAGE === 'postgres' || process.env.DATABASE_URL || process.env.NODE_ENV === 'production')) {
      throw new Error('PostgreSQL unavailable');
    }
    return connected;
  })().catch(error => {
    attendanceBackend = undefined;
    throw error;
  });
  return attendanceBackend;
}
export async function getActivityRecap(groupId: string): Promise<ActivityRecap> {
  const group = groupId === 'ungrouped' ? { id: 'ungrouped', title: 'Rapat Tanpa Agenda Kegiatan' } : (await meetingGroupStorage.list()).find(item => item.id === groupId);
  if (!group) throw new AgendaError('Agenda Kegiatan Tidak Ditemukan.', 404);
  const meetings = (await agendaStorage.list()).filter(meeting => groupId === 'ungrouped' ? !meeting.groupId : meeting.groupId === groupId);
  const members = await getTim();
  const dates = new Map(meetings.map(meeting => [meeting.id, meeting.date]));
  let records: AttendanceRecord[];
  if (await authoritativeUsesPg()) {
    const result = await pool.query('SELECT rapat_id AS "rapatId", anggota_id AS "anggotaId", status FROM meeting_attendance WHERE rapat_id = ANY($1::varchar[]) ORDER BY rapat_id, anggota_id', [meetings.map(meeting => meeting.id)]);
    records = result.rows.map(record => ({ ...record, tanggal: dates.get(record.rapatId)! }));
  } else records = (localDb.meetingAttendance || []).filter(record => !!record.rapatId && dates.has(record.rapatId)).map(record => ({ ...record, tanggal: dates.get(record.rapatId!)! }));
  const memberIds = new Set(members.map(member => member.id));
  return { group, meetings, members, records: records.filter(record => memberIds.has(record.anggotaId)) };
}

export async function getMeetingAttendance(rapatId: string): Promise<AttendanceRecord[]> {
  const meeting = await agendaStorage.get(rapatId);
  if (await authoritativeUsesPg()) {
    const result = await pool.query('SELECT rapat_id AS "rapatId", anggota_id AS "anggotaId", status FROM meeting_attendance WHERE rapat_id = $1 ORDER BY anggota_id', [rapatId]);
    return result.rows.map(record => ({ ...record, tanggal: meeting.date }));
  }
  return (localDb.meetingAttendance || []).filter(record => record.rapatId === rapatId).map(record => ({ ...record, tanggal: meeting.date }));
}

export async function saveMeetingAttendance(rapatId: string, anggotaId: string, status: AttendanceStatus | null, actor: UserAccount): Promise<AttendanceRecord> {
  if (status !== null && !isAttendanceStatus(status)) throw new AgendaError('Status Tidak Valid.', 400);
  const meeting = await agendaStorage.get(rapatId);
  const record: AttendanceRecord = { rapatId, anggotaId, tanggal: meeting.date, status: status! };
  const log: ActivityLog = {
    id: 'log-' + crypto.randomUUID(), action: status === null ? 'hapus' : 'status', entity: 'Absensi',
    description: `${status === null ? 'Hapus' : 'Simpan'} kehadiran ${anggotaId} pada rapat ${meeting.title} (${meeting.id})`,
    actorName: actor.namaLengkap, actorRole: actor.role, createdAt: new Date().toISOString(),
  };
  if (await authoritativeUsesPg()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const member = await client.query('SELECT id FROM anggota_tim WHERE id = $1 FOR KEY SHARE', [anggotaId]);
      if (!member.rows.length) throw new AgendaError('Anggota Tidak Ditemukan.', 404);
      if (status === null) {
        const deleted = await client.query('DELETE FROM meeting_attendance WHERE rapat_id = $1 AND anggota_id = $2 RETURNING status', [rapatId, anggotaId]);
        if (!deleted.rows.length) throw new AgendaError('Catatan Tidak Ditemukan.', 404);
        record.status = deleted.rows[0].status;
      } else await client.query('INSERT INTO meeting_attendance (rapat_id, anggota_id, status) VALUES ($1,$2,$3) ON CONFLICT (rapat_id, anggota_id) DO UPDATE SET status = EXCLUDED.status', [rapatId, anggotaId, status]);
      await client.query('INSERT INTO activity_logs (id, action, entity, description, actor_name, actor_role, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [log.id, log.action, log.entity, log.description, log.actorName, log.actorRole, log.createdAt]);
      await client.query('COMMIT');
      return record;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  agendaJson.update(current => {
    if (!localDb.tim.some(member => member.id === anggotaId)) throw new AgendaError('Anggota Tidak Ditemukan.', 404);
    const existing = (current.meetingAttendance || []) as AttendanceRecord[];
    const previous = existing.find(r => r.rapatId === rapatId && r.anggotaId === anggotaId);
    if (status === null && !previous) throw new AgendaError('Catatan Tidak Ditemukan.', 404);
    if (status === null) record.status = previous!.status;
    const remaining = existing.filter(r => r.rapatId !== rapatId || r.anggotaId !== anggotaId);
    return { ...current, meetingAttendance: status === null ? remaining : [...remaining, record], activityLogs: [log, ...(current.activityLogs as ActivityLog[] || [])].slice(0, 300) };
  });
  return record;
}

export async function getAbsensi(tanggal: string): Promise<AttendanceRecord[]> {
  if (!isAttendanceDate(tanggal)) throw new Error('Invalid date');
  if (await authoritativeUsesPg()) {
    const result = await pool.query('SELECT tanggal::text, anggota_id AS "anggotaId", status FROM absensi WHERE tanggal = $1 ORDER BY anggota_id', [tanggal]);
    return result.rows;
  }
  return (localDb.absensi || []).filter(item => item.tanggal === tanggal);
}
export async function saveAbsensi(tanggal: string, anggotaId: string, status: AttendanceStatus | null, actor: UserAccount): Promise<AttendanceRecord | null> {
  if (!isAttendanceDate(tanggal) || (status !== null && !isAttendanceStatus(status))) throw new Error('Invalid attendance');
  const record = { tanggal, anggotaId, status: status! };
  const makeLog = (exists: boolean): ActivityLog => ({
    id: 'log-' + crypto.randomUUID(), action: status === null ? 'hapus' : exists ? 'ubah' : 'tambah', entity: 'Absensi',
    description: `${status === null ? 'Hapus' : 'Simpan'} absensi ${anggotaId} tanggal ${tanggal}${status ? ': ' + status : ''}`,
    actorName: actor.namaLengkap, actorRole: actor.role, createdAt: new Date().toISOString(),
  });
  if (await authoritativeUsesPg()) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const member = await client.query('SELECT id FROM anggota_tim WHERE id = $1 FOR KEY SHARE', [anggotaId]);
      if (!member.rows.length) { await client.query('ROLLBACK'); return null; }
      const previous = await client.query('SELECT status FROM absensi WHERE tanggal = $1 AND anggota_id = $2 FOR UPDATE', [tanggal, anggotaId]);
      if (status === null && !previous.rows.length) { await client.query('ROLLBACK'); return null; }
      if (status === null) await client.query('DELETE FROM absensi WHERE tanggal = $1 AND anggota_id = $2', [tanggal, anggotaId]);
      else await client.query(`INSERT INTO absensi (tanggal, anggota_id, status) VALUES ($1, $2, $3)
        ON CONFLICT (tanggal, anggota_id) DO UPDATE SET status = EXCLUDED.status`, [tanggal, anggotaId, status]);
      const log = makeLog(previous.rows.length > 0);
      await client.query(`INSERT INTO activity_logs (id, action, entity, description, actor_name, actor_role, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`, [log.id, log.action, log.entity, log.description, log.actorName, log.actorRole, log.createdAt]);
      await client.query('COMMIT');
      return status === null ? { ...record, status: previous.rows[0].status } : record;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  if (!localDb.tim.some(member => member.id === anggotaId)) return null;
  const previous = (localDb.absensi || []).find(item => item.tanggal === tanggal && item.anggotaId === anggotaId);
  if (status === null && !previous) return null;
  const records = (localDb.absensi || []).filter(item => item.tanggal !== tanggal || item.anggotaId !== anggotaId);
  const next = { ...localDb, absensi: status === null ? records : [...records, record], activityLogs: [makeLog(!!previous), ...(localDb.activityLogs || [])].slice(0, 300) };
  // Atomic replacement; publish the new cache only after the durable write succeeds.
  const temporary = DB_FILE + '.' + crypto.randomUUID() + '.tmp';
  try {
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2), 'utf8');
    fs.renameSync(temporary, DB_FILE);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  localDb = next;
  return status === null ? previous! : record;
}
