import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import type { Response } from 'express';
import { checkDbConnection, initDb } from './db.js';
import * as storage from './storage.js';

export const apiApp = express();

apiApp.use(cors());
apiApp.use(express.json({ limit: '20mb' }));
apiApp.use(async (_req, _res, next) => {
  await initDb();
  next();
});

const uploadsRoot = path.join(process.cwd(), 'uploads');
const publicUploadsRoot = path.join(process.cwd(), 'public', 'uploads');
for (const cat of ['profiles', 'galeri', 'berita']) {
  fs.mkdirSync(path.join(uploadsRoot, cat), { recursive: true });
  fs.mkdirSync(path.join(publicUploadsRoot, cat), { recursive: true });
}

apiApp.use('/uploads', express.static(uploadsRoot));
apiApp.use('/uploads', express.static(publicUploadsRoot));

const sseClients = new Set<Response>();

export function broadcastUpdate(payload: { type: 'berita' | 'tim' | 'galeri' | 'aspirasi' | 'users' | 'logs' | 'all'; action?: string }) {
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
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',
  });

  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clients: sseClients.size + 1 })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ---------------------- Health ----------------------
apiApp.get('/api/health', async (_req, res) => {
  const dbOk = await checkDbConnection();
  res.json({
    status: 'ok',
    app: 'Karang Taruna Margabakti 07',
    database: dbOk ? 'connected' : 'local_storage',
    clientsConnected: sseClients.size,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------- File Upload ----------------------
apiApp.post('/api/upload', (req, res) => {
  try {
    const { image, category = 'profiles' } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Data gambar wajib disertakan' });
    }

    const validCat = ['profiles', 'galeri', 'berita'].includes(category) ? category : 'profiles';
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Format data URL tidak valid' });
    }

    const mime = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    let ext = 'webp';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';

    const filename = `${validCat}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
    fs.writeFileSync(path.join(uploadsRoot, validCat, filename), buffer);
    fs.writeFileSync(path.join(publicUploadsRoot, validCat, filename), buffer);

    const publicUrl = `/uploads/${validCat}/${filename}`;
    res.json({ success: true, url: publicUrl, filename });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Gagal mengunggah gambar' });
  }
});

// ---------------------- Auth ----------------------
apiApp.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  const user = await storage.authenticate(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Username atau kata sandi tidak cocok' });
  }

  res.json({ success: true, user: { id: user.id, username: user.username, namaLengkap: user.namaLengkap, role: user.role, isActive: user.isActive !== false } });
});

// ---------------------- Users (Admin Only) ----------------------
apiApp.get('/api/users', async (_req, res) => {
  const users = await storage.getUsers();
  res.json(users);
});

apiApp.post('/api/users', async (req, res) => {
  const { username, password, namaLengkap, role, dibuatOleh, actorRole } = req.body;
  if (actorRole !== 'superadmin') {
    return res.status(403).json({ error: 'Hanya Super Admin yang dapat mengelola akun pengguna' });
  }
  if (!username || !password || !namaLengkap) {
    return res.status(400).json({ error: 'Seluruh kolom wajib diisi' });
  }

  const created = await storage.createUser({ username, password, namaLengkap, role: role || 'pengurus', isActive: true, dibuatOleh });
  broadcastUpdate({ type: 'users', action: 'create' });
  res.status(201).json(created);
});

apiApp.put('/api/users/:id', async (req, res) => {
  if (req.body.actorRole !== 'superadmin') {
    return res.status(403).json({ error: 'Hanya Super Admin yang dapat mengelola akun pengguna' });
  }
  const updated = await storage.updateUser(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'User tidak ditemukan' });
  broadcastUpdate({ type: 'users', action: 'update' });
  res.json(updated);
});

apiApp.delete('/api/users/:id', async (req, res) => {
  if (req.body.actorRole !== 'superadmin') {
    return res.status(403).json({ error: 'Hanya Super Admin yang dapat mengelola akun pengguna' });
  }
  const success = await storage.deleteUser(req.params.id);
  broadcastUpdate({ type: 'users', action: 'delete' });
  res.json({ success });
});

// ---------------------- Activity Logs ----------------------
apiApp.get('/api/logs', async (_req, res) => {
  const logs = await storage.getActivityLogs();
  res.json(logs);
});

apiApp.post('/api/logs', async (req, res) => {
  const { id, action, entity, description, actorName, actorRole, createdAt } = req.body;
  if (!id || !action || !entity || !description || !actorName) {
    return res.status(400).json({ error: 'Data log aktivitas belum lengkap' });
  }

  const created = await storage.createActivityLog({
    id,
    action,
    entity,
    description,
    actorName,
    actorRole,
    createdAt,
  });
  broadcastUpdate({ type: 'logs', action: 'create' });
  res.status(201).json(created);
});

apiApp.delete('/api/logs', async (_req, res) => {
  res.status(405).json({ error: 'Log aktivitas bersifat permanen dan tidak dapat dihapus melalui aplikasi' });
});

// ---------------------- Berita ----------------------
apiApp.get('/api/berita', async (_req, res) => {
  const data = await storage.getBerita();
  res.json(data);
});

apiApp.post('/api/berita', async (req, res) => {
  const created = await storage.createBerita(req.body);
  broadcastUpdate({ type: 'berita', action: 'create' });
  res.status(201).json(created);
});

apiApp.put('/api/berita/:id', async (req, res) => {
  const updated = await storage.updateBerita(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Berita tidak ditemukan' });
  broadcastUpdate({ type: 'berita', action: 'update' });
  res.json(updated);
});

apiApp.delete('/api/berita/:id', async (req, res) => {
  await storage.deleteBerita(req.params.id);
  broadcastUpdate({ type: 'berita', action: 'delete' });
  res.json({ success: true });
});

// ---------------------- Tim ----------------------
apiApp.get('/api/tim', async (_req, res) => {
  const data = await storage.getTim();
  res.json(data);
});

apiApp.post('/api/tim', async (req, res) => {
  const created = await storage.createTim(req.body);
  broadcastUpdate({ type: 'tim', action: 'create' });
  res.status(201).json(created);
});

apiApp.put('/api/tim/:id', async (req, res) => {
  const updated = await storage.updateTim(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Pengurus tidak ditemukan' });
  broadcastUpdate({ type: 'tim', action: 'update' });
  res.json(updated);
});

apiApp.delete('/api/tim/:id', async (req, res) => {
  await storage.deleteTim(req.params.id);
  broadcastUpdate({ type: 'tim', action: 'delete' });
  res.json({ success: true });
});

// ---------------------- Galeri ----------------------
apiApp.get('/api/galeri', async (_req, res) => {
  const data = await storage.getGaleri();
  res.json(data);
});

apiApp.post('/api/galeri', async (req, res) => {
  const created = await storage.createGaleri(req.body);
  broadcastUpdate({ type: 'galeri', action: 'create' });
  res.status(201).json(created);
});

apiApp.put('/api/galeri/:id', async (req, res) => {
  const updated = await storage.updateGaleri(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Dokumentasi tidak ditemukan' });
  broadcastUpdate({ type: 'galeri', action: 'update' });
  res.json(updated);
});

apiApp.delete('/api/galeri/:id', async (req, res) => {
  await storage.deleteGaleri(req.params.id);
  broadcastUpdate({ type: 'galeri', action: 'delete' });
  res.json({ success: true });
});

// ---------------------- Aspirasi ----------------------
apiApp.get('/api/aspirasi', async (_req, res) => {
  const data = await storage.getAspirasi();
  res.json(data);
});

apiApp.post('/api/aspirasi', async (req, res) => {
  const created = await storage.createAspirasi(req.body);
  broadcastUpdate({ type: 'aspirasi', action: 'create' });
  res.status(201).json(created);
});

apiApp.put('/api/aspirasi/:id', async (req, res) => {
  const updated = await storage.updateStatusAspirasi(req.params.id, req.body.status);
  if (!updated) return res.status(404).json({ error: 'Aspirasi tidak ditemukan' });
  broadcastUpdate({ type: 'aspirasi', action: 'update' });
  res.json(updated);
});

apiApp.delete('/api/aspirasi/:id', async (req, res) => {
  await storage.deleteAspirasi(req.params.id);
  broadcastUpdate({ type: 'aspirasi', action: 'delete' });
  res.json({ success: true });
});
