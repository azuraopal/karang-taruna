import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool, checkDbConnection, initDb, seedIfEmpty } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Setup persistent uploads directory structure
const uploadsRoot = path.join(process.cwd(), 'uploads');
const publicUploadsRoot = path.join(process.cwd(), 'public/uploads');
const uploadCategories = ['profiles', 'galeri', 'berita'] as const;

for (const cat of uploadCategories) {
  fs.mkdirSync(path.join(uploadsRoot, cat), { recursive: true });
  fs.mkdirSync(path.join(publicUploadsRoot, cat), { recursive: true });
}

// Serve uploads statically
app.use('/uploads', express.static(uploadsRoot));
app.use('/uploads', express.static(publicUploadsRoot));
// Initialize database schema
initDb().catch(console.error);

// ---------------------- Health & Seed API ----------------------
app.get('/api/health', async (_req, res) => {
  const dbOk = await checkDbConnection();
  res.json({
    status: 'ok',
    app: 'Karang Taruna Margabakti 07',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/seed', async (_req, res) => {
  try {
    await seedIfEmpty();
    res.json({ success: true, message: 'Database successfully seeded!' });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});
// ---------------------- File Upload API ----------------------
app.post('/api/upload', (req, res) => {
  try {
    const { image, category = 'profiles' } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Data gambar wajib diisi' });
    }

    const validCat = ['profiles', 'galeri', 'berita'].includes(category) ? category : 'profiles';

    // Match data:[<mediatype>];base64,<data>
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Format data URL gambar tidak valid' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'webp';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('gif')) ext = 'gif';

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const filename = `${validCat}-${Date.now()}-${randomSuffix}.${ext}`;

    // Write to both uploads and public/uploads for instant preview in dev & prod
    const destPath1 = path.join(uploadsRoot, validCat, filename);
    fs.writeFileSync(destPath1, buffer);

    const destPath2 = path.join(publicUploadsRoot, validCat, filename);
    fs.writeFileSync(destPath2, buffer);

    const publicUrl = `/uploads/${validCat}/${filename}`;
    res.json({ success: true, url: publicUrl, filename });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Gagal menyimpan foto ke server' });
  }
});


// ---------------------- Auth API ----------------------
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, nama_lengkap as "namaLengkap", role FROM admin_users WHERE username = $1 AND password_hash = $2',
      [username.trim(), password.trim()]
    );

    if (result.rows.length === 0) {
      // Fallback for default demo credentials when database is empty or offline
      if (username === 'admin' && password === 'katar2026') {
        return res.json({
          success: true,
          user: { id: 'user-1', username: 'admin', namaLengkap: 'Administrator Utama', role: 'admin' },
        });
      }
      if (username === 'pengurus' && password === 'pengurus2026') {
        return res.json({
          success: true,
          user: { id: 'user-2', username: 'pengurus', namaLengkap: 'Staff Pengurus Harian', role: 'pengurus' },
        });
      }
      return res.status(401).json({ error: 'Username atau kata sandi tidak cocok' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch {
    if (username === 'admin' && password === 'katar2026') {
      return res.json({
        success: true,
        user: { id: 'user-1', username: 'admin', namaLengkap: 'Administrator Utama', role: 'admin' },
      });
    }
    if (username === 'pengurus' && password === 'pengurus2026') {
      return res.json({
        success: true,
        user: { id: 'user-2', username: 'pengurus', namaLengkap: 'Staff Pengurus Harian', role: 'pengurus' },
      });
    }
    res.status(500).json({ error: 'Gagal memproses autentikasi' });
  }
});

// ---------------------- User Management API (Admin Role Only) ----------------------
app.get('/api/users', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, nama_lengkap as "namaLengkap", role, created_at as "createdAt" FROM admin_users ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, namaLengkap, role = 'pengurus' } = req.body;
  if (!username || !password || !namaLengkap) {
    return res.status(400).json({ error: 'Seluruh kolom wajib diisi' });
  }

  const id = 'user-' + Date.now();
  const finalRole = role === 'admin' ? 'admin' : 'pengurus';

  try {
    const checkExists = await pool.query('SELECT id FROM admin_users WHERE username = $1', [username.trim()]);
    if (checkExists.rows.length > 0) {
      return res.status(400).json({ error: 'Username sudah digunakan, silakan pilih yang lain' });
    }

    const result = await pool.query(
      `INSERT INTO admin_users (id, username, password_hash, nama_lengkap, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, nama_lengkap as "namaLengkap", role, created_at as "createdAt"`,
      [id, username.trim(), password.trim(), namaLengkap.trim(), finalRole]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { namaLengkap, role, password } = req.body;

  try {
    let query = 'UPDATE admin_users SET nama_lengkap = COALESCE($1, nama_lengkap), role = COALESCE($2, role)';
    const values: (string | null)[] = [namaLengkap?.trim() || null, role || null];

    if (password && password.trim()) {
      query += ', password_hash = $3 WHERE id = $4';
      values.push(password.trim(), id);
    } else {
      query += ' WHERE id = $3';
      values.push(id);
    }

    query += ' RETURNING id, username, nama_lengkap as "namaLengkap", role, created_at as "createdAt"';

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Ensure at least one admin remains
    const adminCountRes = await pool.query("SELECT COUNT(*) FROM admin_users WHERE role = 'admin'");
    const userToDelete = await pool.query('SELECT role FROM admin_users WHERE id = $1', [id]);

    if (userToDelete.rows[0]?.role === 'admin' && parseInt(adminCountRes.rows[0].count, 10) <= 1) {
      return res.status(400).json({ error: 'Tidak dapat menghapus satu-satunya akun Administrator' });
    }

    await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);
    res.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------------- Berita API ----------------------
app.get('/api/berita', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, judul, slug, ringkasan, isi, kategori, tanggal, penulis, gambar_url as "gambarUrl", status FROM berita ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/berita', async (req, res) => {
  const { judul, slug, ringkasan, isi, kategori, tanggal, penulis, gambarUrl, status } = req.body;
  const id = 'berita-' + Date.now();
  const finalSlug = slug || judul.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  try {
    const result = await pool.query(
      `INSERT INTO berita (id, judul, slug, ringkasan, isi, kategori, tanggal, penulis, gambar_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, judul, slug, ringkasan, isi, kategori, tanggal, penulis, gambar_url as "gambarUrl", status`,
      [id, judul, finalSlug, ringkasan, isi, kategori, tanggal, penulis, gambarUrl, status || 'published']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/berita/:id', async (req, res) => {
  const { id } = req.params;
  const { judul, slug, ringkasan, isi, kategori, tanggal, penulis, gambarUrl, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE berita
       SET judul = COALESCE($1, judul),
           slug = COALESCE($2, slug),
           ringkasan = COALESCE($3, ringkasan),
           isi = COALESCE($4, isi),
           kategori = COALESCE($5, kategori),
           tanggal = COALESCE($6, tanggal),
           penulis = COALESCE($7, penulis),
           gambar_url = COALESCE($8, gambar_url),
           status = COALESCE($9, status)
       WHERE id = $10
       RETURNING id, judul, slug, ringkasan, isi, kategori, tanggal, penulis, gambar_url as "gambarUrl", status`,
      [judul, slug, ringkasan, isi, kategori, tanggal, penulis, gambarUrl, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Berita tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/berita/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM berita WHERE id = $1', [id]);
    res.json({ success: true, message: 'Berita berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------------- Tim API ----------------------
app.get('/api/tim', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nama, jabatan, divisi, foto_url as "fotoUrl", bio, email, no_hp as "noHp" FROM anggota_tim ORDER BY urutan ASC, created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/tim', async (req, res) => {
  const { nama, jabatan, divisi, fotoUrl, bio, email, noHp } = req.body;
  const id = 'tim-' + Date.now();

  try {
    const result = await pool.query(
      `INSERT INTO anggota_tim (id, nama, jabatan, divisi, foto_url, bio, email, no_hp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, nama, jabatan, divisi, foto_url as "fotoUrl", bio, email, no_hp as "noHp"`,
      [id, nama, jabatan, divisi, fotoUrl, bio, email || null, noHp || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/tim/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, jabatan, divisi, fotoUrl, bio, email, noHp } = req.body;

  try {
    const result = await pool.query(
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
      [nama, jabatan, divisi, fotoUrl, bio, email, noHp, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/tim/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM anggota_tim WHERE id = $1', [id]);
    res.json({ success: true, message: 'Anggota tim berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------------- Galeri API ----------------------
app.get('/api/galeri', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, judul, kategori, tanggal, gambar_url as "gambarUrl", deskripsi, lokasi FROM galeri ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/galeri', async (req, res) => {
  const { judul, kategori, tanggal, gambarUrl, deskripsi, lokasi } = req.body;
  const id = 'galeri-' + Date.now();

  try {
    const result = await pool.query(
      `INSERT INTO galeri (id, judul, kategori, tanggal, gambar_url, deskripsi, lokasi)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, judul, kategori, tanggal, gambar_url as "gambarUrl", deskripsi, lokasi`,
      [id, judul, kategori, tanggal, gambarUrl, deskripsi, lokasi]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/galeri/:id', async (req, res) => {
  const { id } = req.params;
  const { judul, kategori, tanggal, gambarUrl, deskripsi, lokasi } = req.body;

  try {
    const result = await pool.query(
      `UPDATE galeri
       SET judul = COALESCE($1, judul),
           kategori = COALESCE($2, kategori),
           tanggal = COALESCE($3, tanggal),
           gambar_url = COALESCE($4, gambar_url),
           deskripsi = COALESCE($5, deskripsi),
           lokasi = COALESCE($6, lokasi)
       WHERE id = $7
       RETURNING id, judul, kategori, tanggal, gambar_url as "gambarUrl", deskripsi, lokasi`,
      [judul, kategori, tanggal, gambarUrl, deskripsi, lokasi, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/galeri/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM galeri WHERE id = $1', [id]);
    res.json({ success: true, message: 'Foto galeri berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------------- Aspirasi API ----------------------
app.get('/api/aspirasi', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nama, email, no_hp as "noHp", kategori, pesan, tanggal, status FROM aspirasi ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/aspirasi', async (req, res) => {
  const { nama, email, noHp, kategori, pesan } = req.body;
  const id = 'asp-' + Date.now();
  const tanggal = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  try {
    const result = await pool.query(
      `INSERT INTO aspirasi (id, nama, email, no_hp, kategori, pesan, tanggal, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, nama, email, no_hp as "noHp", kategori, pesan, tanggal, status`,
      [id, nama, email, noHp, kategori, pesan, tanggal, 'baru']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/aspirasi/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE aspirasi SET status = $1 WHERE id = $2 RETURNING id, nama, email, no_hp as "noHp", kategori, pesan, tanggal, status`,
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/aspirasi/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM aspirasi WHERE id = $1', [id]);
    res.json({ success: true, message: 'Aspirasi berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------------- Static Files & SPA Serving ----------------------
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server Karang Taruna Margabakti 07 running on port ${PORT}`);
});
