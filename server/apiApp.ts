import express from 'express';
import { createImageVariants } from './imageVariants.js';
import { agendaRouter } from './agendaRouter.js';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import crypto from 'node:crypto';
import type { Response, RequestHandler } from 'express';
import { checkDbConnection, initDb } from './db.js';
import * as storage from './storage.js';
import {
  startSession,
  endSession,
  getSessionUser,
  invalidateUserSessions,
  requireAttendanceSession,
  requireStaffSession,
  requireUserManagementSession,
} from './session.js';
import { isAttendanceDate, isAttendanceStatus } from '../src/utils/attendance.js';
import type { Aspirasi, Berita, AnggotaTim, ItemGaleri, UserAccount } from '../src/types/index.js';

export const apiApp = express();

apiApp.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  apiApp.set('trust proxy', 1);
}

apiApp.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

const configuredOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
);

apiApp.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.has(origin)) return callback(null, true);
      try {
        const parsed = new URL(origin);
        if (process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(parsed.hostname)) {
          return callback(null, true);
        }
      } catch {
        // invalid origin
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

apiApp.use(express.json({ limit: '20mb' }));

apiApp.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  let originAllowed = !origin;
  if (origin) {
    try {
      const url = new URL(origin);
      originAllowed =
        ['http:', 'https:'].includes(url.protocol) &&
        (url.host === req.get('host') || configuredOrigins.has(origin));
    } catch {
      originAllowed = false;
    }
  }
  if (!originAllowed || req.get('sec-fetch-site') === 'cross-site') {
    return res.status(403).json({ error: 'Permintaan lintas origin tidak diizinkan.' });
  }
  next();
});

function createRateLimiter(opts: { windowMs: number; max: number; message: string }): RequestHandler {
  const hits = new Map<string, number[]>();
  const cleanup = setInterval(() => {
    const cutoff = Date.now() - opts.windowMs;
    for (const [key, timestamps] of hits) {
      const recent = timestamps.filter(ts => ts > cutoff);
      if (recent.length) hits.set(key, recent);
      else hits.delete(key);
    }
  }, Math.min(opts.windowMs, 60_000));
  cleanup.unref();

  return (req, res, next) => {
    const ip = req.socket?.remoteAddress ? req.ip || req.socket.remoteAddress : '';
    if (!ip) return next();
    const now = Date.now();
    const cutoff = now - opts.windowMs;
    const recent = (hits.get(ip) || []).filter(ts => ts > cutoff);
    if (recent.length >= opts.max) {
      res.status(429).json({ error: opts.message });
      return;
    }
    recent.push(now);
    hits.set(ip, recent);
    next();
  };
}

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
});

const aspirasiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Terlalu banyak pengiriman aspirasi. Silakan coba lagi beberapa saat.',
});

const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Batas unggahan tercapai. Silakan coba lagi beberapa saat.',
});

const ALLOWED_ROLES = new Set<UserAccount['role']>(['superadmin', 'admin', 'pengurus']);
const ALLOWED_BERITA_STATUS = new Set<Berita['status']>(['published', 'draft']);
const ALLOWED_ASPIRASI_STATUS = new Set<Aspirasi['status']>(['baru', 'dibaca', 'selesai']);
const ALLOWED_ASPIRASI_KATEGORI = new Set<Aspirasi['kategori']>(['Saran Kegiatan', 'Aduan Lingkungan', 'Ide Kreatif', 'Lainnya']);

function cleanString(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length > maxLen) return null;
  return trimmed;
}

function isSafeMediaUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.length > 2048) return false;
  if (trimmed.startsWith('/')) return !trimmed.startsWith('//');
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateMediaArray(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) return null;
  const cleaned: string[] = [];
  for (const item of value) {
    if (!isSafeMediaUrl(item)) return null;
    if (item.trim()) cleaned.push(item.trim());
  }
  return cleaned;
}

const uploadsRoot = path.join(process.cwd(), 'uploads');
const publicUploadsRoot = path.join(process.cwd(), 'public', 'uploads');
for (const cat of ['profiles', 'galeri', 'berita']) {
  fs.mkdirSync(path.join(uploadsRoot, cat), { recursive: true });
  fs.mkdirSync(path.join(publicUploadsRoot, cat), { recursive: true });
}

apiApp.use('/uploads', createImageVariants([uploadsRoot, publicUploadsRoot]));
apiApp.use('/uploads', express.static(uploadsRoot, { maxAge: '7d', immutable: true }));
apiApp.use('/uploads', express.static(publicUploadsRoot, { maxAge: '7d', immutable: true }));

apiApp.use(async (_req, _res, next) => {
  await initDb();
  next();
});

const sseClients = new Set<Response>();
const sseByIp = new Map<string, number>();
const MAX_SSE_CLIENTS = 200;
const MAX_SSE_PER_IP = 10;

export function broadcastUpdate(payload: { type: 'berita' | 'tim' | 'galeri' | 'aspirasi' | 'users' | 'logs' | 'absensi' | 'all'; action?: string }) {
  const message = `event: update\ndata: ${JSON.stringify({ ...payload, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

const sseHeartbeat = setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);
sseHeartbeat.unref();

apiApp.get('/api/events', (req, res) => {
  const ip = req.socket?.remoteAddress ? req.ip || req.socket.remoteAddress : 'local';
  const currentForIp = sseByIp.get(ip) || 0;
  if (sseClients.size >= MAX_SSE_CLIENTS || currentForIp >= MAX_SSE_PER_IP) {
    return res.status(429).json({ error: 'Terlalu banyak koneksi realtime aktif.' });
  }

  sseByIp.set(ip, currentForIp + 1);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
    const remaining = (sseByIp.get(ip) || 1) - 1;
    if (remaining <= 0) sseByIp.delete(ip);
    else sseByIp.set(ip, remaining);
  });
});

apiApp.get('/api/health', async (_req, res) => {
  const dbOk = await checkDbConnection();
  res.json({
    status: 'ok',
    app: 'Karang Taruna Margabakti 07',
    database: dbOk ? 'connected' : 'local_storage',
    timestamp: new Date().toISOString(),
  });
});

const ALLOWED_UPLOAD_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB decoded

apiApp.post('/api/upload', requireStaffSession, uploadLimiter, async (req, res) => {
  try {
    const { image, category = 'profiles' } = req.body || {};
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Data gambar wajib disertakan' });
    }

    const validCat = ['profiles', 'galeri', 'berita'].includes(category) ? category : 'profiles';
    const matches = image.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!matches || matches.length !== 3 || !ALLOWED_UPLOAD_MIMES.has(matches[1].toLowerCase())) {
      return res.status(400).json({ error: 'Format gambar harus JPEG, PNG, atau WebP.' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) {
      return res.status(413).json({ error: 'Ukuran gambar maksimal 5 MB.' });
    }

    // Re-encode with sharp to verify actual image bytes, strip metadata, and neutralize embedded payloads.
    let safeBuffer: Buffer;
    try {
      safeBuffer = await sharp(buffer, { limitInputPixels: 40_000_000 })
        .rotate()
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      return res.status(400).json({ error: 'Berkas gambar tidak valid atau rusak.' });
    }

    const filename = `${validCat}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.webp`;
    fs.writeFileSync(path.join(uploadsRoot, validCat, filename), safeBuffer);

    const publicUrl = `/uploads/${validCat}/${filename}`;
    res.json({ success: true, url: publicUrl, filename });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Gagal mengunggah gambar' });
  }
});

apiApp.get('/api/auth/me', async (req, res) => {
  try {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ authenticated: false });
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        namaLengkap: user.namaLengkap,
        role: user.role,
        isActive: user.isActive !== false,
      },
    });
  } catch {
    res.status(503).json({ error: 'Tidak dapat memverifikasi sesi.' });
  }
});

apiApp.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password.trim()) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }
  if (username.length > 100 || password.length > 200) {
    return res.status(400).json({ error: 'Username atau kata sandi tidak valid' });
  }

  try {
    const user = await storage.authenticate(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Username atau kata sandi tidak cocok' });
    }

    startSession(req, res, user);
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        namaLengkap: user.namaLengkap,
        role: user.role,
        isActive: user.isActive !== false,
      },
    });
  } catch {
    res.status(503).json({ error: 'Login tidak tersedia. Silakan coba lagi setelah server pulih.' });
  }
});

// ---------------------- Users (Superadmin Only) ----------------------
apiApp.get('/api/users', requireUserManagementSession, async (_req, res) => {
  const users = await storage.getUsers();
  res.json(users);
});

apiApp.post('/api/users', requireUserManagementSession, async (req, res) => {
  const { username, password, namaLengkap, role } = req.body || {};
  const dibuatOleh = res.locals.attendanceActor.namaLengkap;
  const cleanUsername = cleanString(username, 50);
  const cleanPassword = typeof password === 'string' ? password.trim() : '';
  const cleanName = cleanString(namaLengkap, 150);
  const targetRole = (role || 'pengurus') as UserAccount['role'];

  if (!cleanUsername || !cleanPassword || !cleanName) {
    return res.status(400).json({ error: 'Seluruh kolom wajib diisi' });
  }
  if (!/^[a-zA-Z0-9._-]{3,50}$/.test(cleanUsername)) {
    return res.status(400).json({ error: 'Username harus 3-50 karakter (huruf, angka, titik, garis bawah, atau tanda hubung).' });
  }
  if (cleanPassword.length < 8 || cleanPassword.length > 200) {
    return res.status(400).json({ error: 'Kata sandi minimal 8 karakter.' });
  }
  if (!ALLOWED_ROLES.has(targetRole)) {
    return res.status(400).json({ error: 'Role pengguna tidak valid.' });
  }

  const created = await storage.createUser({
    username: cleanUsername,
    password: cleanPassword,
    namaLengkap: cleanName,
    role: targetRole,
    isActive: true,
    dibuatOleh,
  });
  broadcastUpdate({ type: 'users', action: 'create' });
  res.status(201).json(created);
});

apiApp.put<{ id: string }>('/api/users/:id', requireUserManagementSession, async (req, res) => {
  const { namaLengkap, role, isActive, password } = req.body || {};
  const patch: Partial<UserAccount> = {};

  if (namaLengkap !== undefined) {
    const cleanName = cleanString(namaLengkap, 150);
    if (!cleanName) return res.status(400).json({ error: 'Nama lengkap tidak valid.' });
    patch.namaLengkap = cleanName;
  }
  if (role !== undefined) {
    if (!ALLOWED_ROLES.has(role)) return res.status(400).json({ error: 'Role pengguna tidak valid.' });
    patch.role = role;
  }
  if (isActive !== undefined) {
    if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'Status aktif tidak valid.' });
    patch.isActive = isActive;
  }
  if (password !== undefined && password !== '') {
    if (typeof password !== 'string' || password.trim().length < 8 || password.trim().length > 200) {
      return res.status(400).json({ error: 'Kata sandi minimal 8 karakter.' });
    }
    patch.password = password.trim();
  }

  const updated = await storage.updateUser(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'User tidak ditemukan' });

  if (patch.password || patch.isActive === false || patch.role) {
    invalidateUserSessions(req.params.id);
  }
  broadcastUpdate({ type: 'users', action: 'update' });
  res.json(updated);
});

apiApp.delete('/api/users/:id', requireUserManagementSession, async (req, res) => {
  if (typeof req.params.id !== 'string') return res.status(400).json({ error: 'ID pengguna tidak valid.' });
  const success = await storage.deleteUser(req.params.id);
  invalidateUserSessions(req.params.id);
  broadcastUpdate({ type: 'users', action: 'delete' });
  res.json({ success });
});

// ---------------------- Activity Logs (Authenticated Staff Only) ----------------------
apiApp.get('/api/logs', requireStaffSession, async (_req, res) => {
  const logs = await storage.getActivityLogs();
  res.json(logs);
});

apiApp.post('/api/logs', requireStaffSession, async (req, res) => {
  const { id, action, entity, description } = req.body || {};
  const cleanId = cleanString(id, 96);
  const cleanAction = cleanString(action, 20);
  const cleanEntity = cleanString(entity, 50);
  const cleanDesc = cleanString(description, 500);
  if (!cleanId || !cleanAction || !cleanEntity || !cleanDesc) {
    return res.status(400).json({ error: 'Data log aktivitas belum lengkap' });
  }

  const actor = res.locals.attendanceActor as UserAccount;
  const created = await storage.createActivityLog({
    id: cleanId,
    action: cleanAction as Parameters<typeof storage.createActivityLog>[0]['action'],
    entity: cleanEntity as Parameters<typeof storage.createActivityLog>[0]['entity'],
    description: cleanDesc,
    actorName: actor.namaLengkap,
    actorRole: actor.role,
    createdAt: new Date().toISOString(),
  });
  broadcastUpdate({ type: 'logs', action: 'create' });
  res.status(201).json(created);
});

apiApp.delete('/api/logs', requireStaffSession, async (_req, res) => {
  res.status(405).json({ error: 'Log aktivitas bersifat permanen dan tidak dapat dihapus melalui aplikasi' });
});

// ---------------------- Berita ----------------------
apiApp.get('/api/berita', async (_req, res) => {
  const data = await storage.getBerita();
  res.json(data);
});

apiApp.post('/api/berita', requireStaffSession, async (req, res) => {
  const body = req.body || {};
  const judul = cleanString(body.judul, 300);
  const ringkasan = cleanString(body.ringkasan, 1000);
  const isi = cleanString(body.isi, 50_000);
  const kategori = cleanString(body.kategori, 50);
  const tanggal = cleanString(body.tanggal, 50);
  const penulis = cleanString(body.penulis, 100) || res.locals.attendanceActor.namaLengkap;
  const status = (body.status || 'published') as Berita['status'];
  const gambarUrls = validateMediaArray(body.gambarUrls);

  if (!judul || ringkasan === null || !isi || !kategori || !tanggal || !ALLOWED_BERITA_STATUS.has(status) || !isSafeMediaUrl(body.gambarUrl || '') || gambarUrls === null) {
    return res.status(400).json({ error: 'Data berita tidak lengkap atau tidak valid.' });
  }

  const created = await storage.createBerita({
    judul,
    slug: cleanString(body.slug, 300) || undefined as unknown as string,
    ringkasan,
    isi,
    kategori: kategori as Berita['kategori'],
    tanggal,
    tanggalPelaksanaan: cleanString(body.tanggalPelaksanaan, 50) || undefined,
    penulis,
    gambarUrl: (body.gambarUrl || '').trim(),
    gambarUrls,
    status,
    dibuatOleh: res.locals.attendanceActor.namaLengkap,
  });
  broadcastUpdate({ type: 'berita', action: 'create' });
  res.status(201).json(created);
});

apiApp.put<{ id: string }>('/api/berita/:id', requireStaffSession, async (req, res) => {
  const body = req.body || {};
  const patch: Partial<Berita> = {};
  if (body.judul !== undefined) {
    const v = cleanString(body.judul, 300);
    if (!v) return res.status(400).json({ error: 'Judul berita tidak valid.' });
    patch.judul = v;
  }
  if (body.slug !== undefined) {
    const v = cleanString(body.slug, 300);
    if (v === null) return res.status(400).json({ error: 'Slug tidak valid.' });
    patch.slug = v;
  }
  if (body.ringkasan !== undefined) {
    const v = cleanString(body.ringkasan, 1000);
    if (v === null) return res.status(400).json({ error: 'Ringkasan tidak valid.' });
    patch.ringkasan = v;
  }
  if (body.isi !== undefined) {
    const v = cleanString(body.isi, 50_000);
    if (!v) return res.status(400).json({ error: 'Isi berita tidak valid.' });
    patch.isi = v;
  }
  if (body.kategori !== undefined) {
    const v = cleanString(body.kategori, 50);
    if (!v) return res.status(400).json({ error: 'Kategori tidak valid.' });
    patch.kategori = v as Berita['kategori'];
  }
  if (body.tanggal !== undefined) {
    const v = cleanString(body.tanggal, 50);
    if (!v) return res.status(400).json({ error: 'Tanggal tidak valid.' });
    patch.tanggal = v;
  }
  if (body.tanggalPelaksanaan !== undefined) {
    patch.tanggalPelaksanaan = cleanString(body.tanggalPelaksanaan, 50) || undefined;
  }
  if (body.penulis !== undefined) {
    const v = cleanString(body.penulis, 100);
    if (!v) return res.status(400).json({ error: 'Penulis tidak valid.' });
    patch.penulis = v;
  }
  if (body.gambarUrl !== undefined) {
    if (!isSafeMediaUrl(body.gambarUrl)) return res.status(400).json({ error: 'URL gambar tidak valid.' });
    patch.gambarUrl = body.gambarUrl.trim();
  }
  if (body.gambarUrls !== undefined) {
    const urls = validateMediaArray(body.gambarUrls);
    if (urls === null) return res.status(400).json({ error: 'Daftar URL gambar tidak valid.' });
    patch.gambarUrls = urls;
  }
  if (body.status !== undefined) {
    if (!ALLOWED_BERITA_STATUS.has(body.status)) return res.status(400).json({ error: 'Status berita tidak valid.' });
    patch.status = body.status;
  }

  const updated = await storage.updateBerita(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Berita tidak ditemukan' });
  broadcastUpdate({ type: 'berita', action: 'update' });
  res.json(updated);
});

apiApp.delete<{ id: string }>('/api/berita/:id', requireStaffSession, async (req, res) => {
  await storage.deleteBerita(req.params.id);
  broadcastUpdate({ type: 'berita', action: 'delete' });
  res.json({ success: true });
});

// ---------------------- Tim ----------------------
apiApp.get('/api/tim', async (_req, res) => {
  const data = await storage.getTim();
  res.json(data);
});

apiApp.post('/api/tim', requireStaffSession, async (req, res) => {
  const body = req.body || {};
  const nama = cleanString(body.nama, 150);
  const jabatan = cleanString(body.jabatan, 150);
  const divisi = cleanString(body.divisi, 100);
  const bio = cleanString(body.bio ?? '', 2000);
  const email = cleanString(body.email ?? '', 150);
  const noHp = cleanString(body.noHp ?? '', 50);

  if (!nama || !jabatan || !divisi || bio === null || email === null || noHp === null || !isSafeMediaUrl(body.fotoUrl || '')) {
    return res.status(400).json({ error: 'Data pengurus tidak lengkap atau tidak valid.' });
  }

  const created = await storage.createTim({
    nama,
    jabatan,
    divisi: divisi as AnggotaTim['divisi'],
    fotoUrl: (body.fotoUrl || '').trim(),
    bio,
    email: email || undefined,
    noHp: noHp || undefined,
    dibuatOleh: res.locals.attendanceActor.namaLengkap,
  });
  broadcastUpdate({ type: 'tim', action: 'create' });
  res.status(201).json(created);
});

apiApp.put<{ id: string }>('/api/tim/:id', requireStaffSession, async (req, res) => {
  const body = req.body || {};
  const patch: Partial<AnggotaTim> = {};
  if (body.nama !== undefined) {
    const v = cleanString(body.nama, 150);
    if (!v) return res.status(400).json({ error: 'Nama tidak valid.' });
    patch.nama = v;
  }
  if (body.jabatan !== undefined) {
    const v = cleanString(body.jabatan, 150);
    if (!v) return res.status(400).json({ error: 'Jabatan tidak valid.' });
    patch.jabatan = v;
  }
  if (body.divisi !== undefined) {
    const v = cleanString(body.divisi, 100);
    if (!v) return res.status(400).json({ error: 'Divisi tidak valid.' });
    patch.divisi = v as AnggotaTim['divisi'];
  }
  if (body.fotoUrl !== undefined) {
    if (!isSafeMediaUrl(body.fotoUrl)) return res.status(400).json({ error: 'URL foto tidak valid.' });
    patch.fotoUrl = body.fotoUrl.trim();
  }
  if (body.bio !== undefined) {
    const v = cleanString(body.bio, 2000);
    if (v === null) return res.status(400).json({ error: 'Bio tidak valid.' });
    patch.bio = v;
  }
  if (body.email !== undefined) {
    const v = cleanString(body.email, 150);
    if (v === null) return res.status(400).json({ error: 'Email tidak valid.' });
    patch.email = v;
  }
  if (body.noHp !== undefined) {
    const v = cleanString(body.noHp, 50);
    if (v === null) return res.status(400).json({ error: 'Nomor HP tidak valid.' });
    patch.noHp = v;
  }

  const updated = await storage.updateTim(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Pengurus tidak ditemukan' });
  broadcastUpdate({ type: 'tim', action: 'update' });
  res.json(updated);
});

apiApp.delete<{ id: string }>('/api/tim/:id', requireStaffSession, async (req, res) => {
  await storage.deleteTim(req.params.id);
  broadcastUpdate({ type: 'tim', action: 'delete' });
  res.json({ success: true });
});

// ---------------------- Galeri ----------------------
apiApp.get('/api/galeri', async (_req, res) => {
  const data = await storage.getGaleri();
  res.json(data);
});

apiApp.post('/api/galeri', requireStaffSession, async (req, res) => {
  const body = req.body || {};
  const judul = cleanString(body.judul, 300);
  const kategori = cleanString(body.kategori, 50);
  const tanggal = cleanString(body.tanggal, 50);
  const deskripsi = cleanString(body.deskripsi ?? '', 3000);
  const lokasi = cleanString(body.lokasi ?? '', 150);
  const gambarUrls = validateMediaArray(body.gambarUrls);

  if (!judul || !kategori || !tanggal || deskripsi === null || lokasi === null || !isSafeMediaUrl(body.gambarUrl || '') || gambarUrls === null) {
    return res.status(400).json({ error: 'Data galeri tidak lengkap atau tidak valid.' });
  }

  const created = await storage.createGaleri({
    judul,
    kategori: kategori as ItemGaleri['kategori'],
    tanggal,
    gambarUrl: (body.gambarUrl || '').trim(),
    gambarUrls,
    deskripsi,
    lokasi,
    dibuatOleh: res.locals.attendanceActor.namaLengkap,
  });
  broadcastUpdate({ type: 'galeri', action: 'create' });
  res.status(201).json(created);
});

apiApp.put<{ id: string }>('/api/galeri/:id', requireStaffSession, async (req, res) => {
  const body = req.body || {};
  const patch: Partial<ItemGaleri> = {};
  if (body.judul !== undefined) {
    const v = cleanString(body.judul, 300);
    if (!v) return res.status(400).json({ error: 'Judul galeri tidak valid.' });
    patch.judul = v;
  }
  if (body.kategori !== undefined) {
    const v = cleanString(body.kategori, 50);
    if (!v) return res.status(400).json({ error: 'Kategori tidak valid.' });
    patch.kategori = v as ItemGaleri['kategori'];
  }
  if (body.tanggal !== undefined) {
    const v = cleanString(body.tanggal, 50);
    if (!v) return res.status(400).json({ error: 'Tanggal tidak valid.' });
    patch.tanggal = v;
  }
  if (body.gambarUrl !== undefined) {
    if (!isSafeMediaUrl(body.gambarUrl)) return res.status(400).json({ error: 'URL gambar tidak valid.' });
    patch.gambarUrl = body.gambarUrl.trim();
  }
  if (body.gambarUrls !== undefined) {
    const urls = validateMediaArray(body.gambarUrls);
    if (urls === null) return res.status(400).json({ error: 'Daftar URL gambar tidak valid.' });
    patch.gambarUrls = urls;
  }
  if (body.deskripsi !== undefined) {
    const v = cleanString(body.deskripsi, 3000);
    if (v === null) return res.status(400).json({ error: 'Deskripsi tidak valid.' });
    patch.deskripsi = v;
  }
  if (body.lokasi !== undefined) {
    const v = cleanString(body.lokasi, 150);
    if (v === null) return res.status(400).json({ error: 'Lokasi tidak valid.' });
    patch.lokasi = v;
  }

  const updated = await storage.updateGaleri(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Dokumentasi tidak ditemukan' });
  broadcastUpdate({ type: 'galeri', action: 'update' });
  res.json(updated);
});

apiApp.delete<{ id: string }>('/api/galeri/:id', requireStaffSession, async (req, res) => {
  await storage.deleteGaleri(req.params.id);
  broadcastUpdate({ type: 'galeri', action: 'delete' });
  res.json({ success: true });
});

// ---------------------- Aspirasi ----------------------
// Reading, updating, and deleting aspirasi contain citizen PII and require staff auth.
apiApp.get('/api/aspirasi', requireStaffSession, async (_req, res) => {
  const data = await storage.getAspirasi();
  res.json(data);
});

// Submitting aspirasi is intentionally public (for citizens), protected by rate limit & validation.
apiApp.post('/api/aspirasi', aspirasiLimiter, async (req, res) => {
  const body = req.body || {};
  const nama = cleanString(body.nama, 150);
  const email = cleanString(body.email, 150);
  const noHp = cleanString(body.noHp, 50);
  const kategori = body.kategori as Aspirasi['kategori'];
  const pesan = cleanString(body.pesan, 5000);

  if (!nama || !email || !noHp || !pesan || !ALLOWED_ASPIRASI_KATEGORI.has(kategori)) {
    return res.status(400).json({ error: 'Data aspirasi tidak lengkap atau tidak valid.' });
  }

  const created = await storage.createAspirasi({
    nama,
    email,
    noHp,
    kategori,
    pesan,
    dibuatOleh: 'Warga / Publik',
  });
  await storage.createActivityLog({
    id: `log-${crypto.randomUUID()}`,
    action: 'tambah',
    entity: 'Aspirasi',
    description: `Menerima aspirasi dari "${nama}"`,
    actorName: 'Warga / Publik',
    actorRole: 'public',
    createdAt: new Date().toISOString(),
  }).catch(() => {});
  broadcastUpdate({ type: 'aspirasi', action: 'create' });
  broadcastUpdate({ type: 'logs', action: 'create' });
  res.status(201).json(created);
});

apiApp.put<{ id: string }>('/api/aspirasi/:id', requireStaffSession, async (req, res) => {
  const status = req.body?.status as Aspirasi['status'];
  if (!ALLOWED_ASPIRASI_STATUS.has(status)) {
    return res.status(400).json({ error: 'Status aspirasi tidak valid.' });
  }
  const updated = await storage.updateStatusAspirasi(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Aspirasi tidak ditemukan' });
  broadcastUpdate({ type: 'aspirasi', action: 'update' });
  res.json(updated);
});

apiApp.delete<{ id: string }>('/api/aspirasi/:id', requireStaffSession, async (req, res) => {
  await storage.deleteAspirasi(req.params.id);
  broadcastUpdate({ type: 'aspirasi', action: 'delete' });
  res.json({ success: true });
});

// Attendance is protected by a server-issued session, never a client-supplied role.
apiApp.post('/api/auth/logout', (req, res) => {
  endSession(req, res);
  res.json({ success: true });
});
apiApp.use('/api/agenda', agendaRouter);
apiApp.use('/api/absensi', requireAttendanceSession);
apiApp.get('/api/absensi/:tanggal', async (req, res) => {
  if (!isAttendanceDate(req.params.tanggal)) return res.status(400).json({ error: 'Tanggal harus valid (YYYY-MM-DD).' });
  try {
    const records = await storage.getAbsensi(req.params.tanggal);
    const members = await storage.getTim();
    res.json({ records, members });
  } catch { res.status(500).json({ error: 'Gagal memuat absensi. Silakan coba lagi.' }); }
});
apiApp.all('/api/absensi/:tanggal/:anggotaId', async (req, res) => {
  if (!['PUT', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Metode tidak didukung.' });
  if (!isAttendanceDate(req.params.tanggal) || (req.method === 'PUT' && !isAttendanceStatus(req.body?.status))) {
    return res.status(400).json({ error: 'Tanggal dan status wajib valid: izin, hadir, sakit, alpa.' });
  }
  try {
    const record = await storage.saveAbsensi(req.params.tanggal, req.params.anggotaId,
      req.method === 'DELETE' ? null : req.body.status, res.locals.attendanceActor);
    if (!record) return res.status(404).json({ error: 'Anggota atau catatan absensi tidak ditemukan.' });
    broadcastUpdate({ type: 'absensi', action: req.method === 'DELETE' ? 'delete' : 'save' });
    broadcastUpdate({ type: 'logs', action: 'create' });
    res.json(record);
  } catch { res.status(500).json({ error: 'Gagal menyimpan absensi. Perubahan belum tersimpan; silakan coba lagi.' }); }
});
