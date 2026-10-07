-- Skema Database PostgreSQL untuk Portal Karang Taruna Margabakti 07

CREATE TABLE IF NOT EXISTS berita (
  id VARCHAR(64) PRIMARY KEY,
  judul TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  ringkasan TEXT NOT NULL,
  isi TEXT NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  tanggal VARCHAR(50) NOT NULL,
  tanggal_pelaksanaan VARCHAR(50),
  penulis VARCHAR(100) NOT NULL,
  gambar_url TEXT NOT NULL,
  gambar_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anggota_tim (
  id VARCHAR(64) PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  jabatan VARCHAR(150) NOT NULL,
  divisi VARCHAR(100) NOT NULL,
  foto_url TEXT NOT NULL,
  bio TEXT NOT NULL,
  email VARCHAR(150),
  no_hp VARCHAR(50),
  urutan INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS galeri (
  id VARCHAR(64) PRIMARY KEY,
  judul TEXT NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  tanggal VARCHAR(50) NOT NULL,
  gambar_url TEXT NOT NULL,
  gambar_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  deskripsi TEXT NOT NULL,
  lokasi VARCHAR(150) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aspirasi (
  id VARCHAR(64) PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  no_hp VARCHAR(50) NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  pesan TEXT NOT NULL,
  tanggal VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'baru',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nama_lengkap VARCHAR(150),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE berita ADD COLUMN IF NOT EXISTS dibuat_oleh VARCHAR(150);
ALTER TABLE anggota_tim ADD COLUMN IF NOT EXISTS dibuat_oleh VARCHAR(150);
ALTER TABLE galeri ADD COLUMN IF NOT EXISTS dibuat_oleh VARCHAR(150);
ALTER TABLE aspirasi ADD COLUMN IF NOT EXISTS dibuat_oleh VARCHAR(150);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS dibuat_oleh VARCHAR(150);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE berita ADD COLUMN IF NOT EXISTS tanggal_pelaksanaan VARCHAR(50);
ALTER TABLE berita ADD COLUMN IF NOT EXISTS gambar_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE galeri ADD COLUMN IF NOT EXISTS gambar_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(96) PRIMARY KEY,
  action VARCHAR(20) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  actor_name VARCHAR(150) NOT NULL,
  actor_role VARCHAR(30),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_berita_kategori ON berita(kategori);
CREATE INDEX IF NOT EXISTS idx_berita_status ON berita(status);
CREATE INDEX IF NOT EXISTS idx_tim_divisi ON anggota_tim(divisi);
CREATE INDEX IF NOT EXISTS idx_galeri_kategori ON galeri(kategori);
CREATE INDEX IF NOT EXISTS idx_aspirasi_status ON aspirasi(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Meetings own their attendance and minutes; dates need not be unique.
CREATE TABLE IF NOT EXISTS agenda (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(160) NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  tanggal DATE NOT NULL
);

-- One explicit attendance status per team member and calendar date.
CREATE TABLE IF NOT EXISTS absensi (
  tanggal DATE NOT NULL,
  anggota_id VARCHAR(64) NOT NULL REFERENCES anggota_tim(id) ON DELETE CASCADE,
  status VARCHAR(5) NOT NULL CHECK (status IN ('izin', 'hadir', 'sakit', 'alpa')),
  PRIMARY KEY (tanggal, anggota_id)
);

ALTER TABLE agenda ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}';
CREATE TABLE IF NOT EXISTS meeting_groups (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(160) NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160)
);
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS group_id VARCHAR(64) REFERENCES meeting_groups(id);
ALTER TABLE agenda ADD COLUMN IF NOT EXISTS attendance_version INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS meeting_attendance (
  rapat_id VARCHAR(64) NOT NULL REFERENCES agenda(id) ON DELETE CASCADE,
  anggota_id VARCHAR(64) NOT NULL REFERENCES anggota_tim(id) ON DELETE CASCADE,
  status VARCHAR(5) NOT NULL CHECK (status IN ('izin', 'hadir', 'sakit', 'alpa')),
  PRIMARY KEY (rapat_id, anggota_id)
);
-- Copy only pre-migration meetings. Legacy daily records remain available.
BEGIN;
LOCK TABLE agenda IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO meeting_attendance (rapat_id, anggota_id, status)
SELECT a.id, r.anggota_id, r.status FROM agenda a JOIN absensi r ON r.tanggal = a.tanggal
WHERE a.attendance_version = 0 ON CONFLICT DO NOTHING;
UPDATE agenda SET attendance_version = 2 WHERE attendance_version = 0;
ALTER TABLE agenda DROP CONSTRAINT IF EXISTS agenda_tanggal_key;
COMMIT;
