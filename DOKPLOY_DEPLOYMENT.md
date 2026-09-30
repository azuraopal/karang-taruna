# Panduan Deployment Dokploy: Karang Taruna Margabakti 07

Panduan ini disusun berdasarkan dokumentasi resmi **Dokploy** (Open-source Platform as a Service alternatif Heroku/Coolify yang berjalan di atas Docker & Traefik).

---

## Ringkasan Arsitektur
* **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + Framer Motion
* **Backend:** Express.js REST API + Node.js
* **Database:** PostgreSQL 16 (dengan auto-migration skema tabel dan auto-seed data Margabakti 07)
* **Kontainer:** Multi-stage `Dockerfile` (melayani API backend sekaligus static frontend SPA pada port 3000)

---

## Metode 1: Dokploy Native (Aplikasi Git + PostgreSQL Terkelola)
*Metode ini merupakan standar resmi yang paling direkomendasikan di Dokploy.*

### Langkah 1: Buat Project & Environment
1. Buka dashboard Dokploy Anda (misal `https://dokploy.your-server.com`).
2. Masuk ke menu **Projects** > Klik **Create Project**.
3. Beri nama: `Karang Taruna Margabakti 07`.
4. Pilih environment (default: `production`).

### Langkah 2: Buat Database PostgreSQL di Dokploy
1. Di dalam project, klik tombol **Create Service** > Pilih **Database** > Pilih **PostgreSQL**.
2. Beri nama service: `katar-postgres`.
3. Tentukan konfigurasi:
   * **Database Name:** `karang_taruna_margabakti`
   * **User:** `katar_user`
   * **Password:** (Buat password aman Anda, contoh: `katar_secure_pass_2026`)
4. Klik **Create** dan tunggu status database berubah menjadi **Running**.
5. Masuk ke tab **Connect** pada database tersebut, Anda akan melihat **Internal Connection String** dalam jaringan Docker Dokploy, formatnya:
   ```text
   postgres://katar_user:katar_secure_pass_2026@katar-postgres:5432/karang_taruna_margabakti
   ```
   *(Salin connection string internal ini untuk Langkah 4).*

### Langkah 3: Buat Application dari Git Repository
1. Kembali ke project, klik **Create Service** > Pilih **Application**.
2. Beri nama aplikasi: `katar-web`.
3. Pada tab **General / Provider**:
   * Pilih **GitHub**, **GitLab**, atau **Git Repository** (masukkan URL repository proyek ini).
   * Pilih branch yang akan dideploy (contoh: `main` atau `master`).
4. Pada bagian **Build Type**:
   * Pilih **Dockerfile**.
   * **Dockerfile Path:** `./Dockerfile`.
   * **Context Path:** `/`.

### Langkah 4: Masukkan Environment Variables
1. Buka tab **Environment** pada aplikasi `katar-web`.
2. Tambahkan variabel berikut:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgres://katar_user:katar_secure_pass_2026@katar-postgres:5432/karang_taruna_margabakti
   ```
3. Klik **Save**.

### Langkah 4B: Konfigurasi Persistent Storage Foto (Agar Foto Tidak Hilang Saat Redeploy)
1. Buka tab **Volumes** (atau **Storage**) pada aplikasi `katar-web` di Dokploy.
2. Tambahkan persistent volume:
   * **Volume Name / Host Path:** `katar_uploads`
   * **Mount Path (di dalam kontainer):** `/app/uploads`
3. Klik **Save**.
   *(Dengan konfigurasi ini, seluruh foto profil dari HP, foto galeri, dan foto berita tersimpan rapi di subfolder `/app/uploads/profiles`, `/app/uploads/galeri`, `/app/uploads/berita` dan dijamin tidak akan terhapus saat Anda melakukan deploy ulang aplikasi).*

### Langkah 5: Setup Domain & SSL Otomatis
1. Buka tab **Domains** pada aplikasi `katar-web`.
2. Klik **Add Domain**:
   * **Host:** domain Anda (misal: `katar.margabakti07.id` atau subdomain VPS Anda).
   * **Port:** `3000`.
   * **Certificate:** Centang opsi **Let's Encrypt (Auto SSL)**.
3. Klik **Create**.

### Langkah 6: Jalankan Deployment
1. Buka tab **Deployments** > Klik tombol **Deploy**.
2. Dokploy akan melakukan:
   * Clone repository
   * Menjalankan tahap *builder* (compile Vite & Tailwind CSS)
   * Menyiapkan kontainer *runner* (Express + PostgreSQL Pool)
   * Menghubungkan database, menjalankan migrasi skema tabel, dan menginisiasi data awal Margabakti 07
   * Menerbitkan sertifikat SSL Traefik secara otomatis
3. Selesai! Buka domain Anda di browser.

---

## Metode 2: Dokploy Compose (Deploy 1-Klik via Docker Compose)
*Jika Anda ingin aplikasi dan database didefinisikan bersamaan dalam satu file `docker-compose.yml`.*

1. Masuk ke Project di Dokploy > Klik **Create Service** > Pilih **Compose**.
2. Beri nama: `katar-stack`.
3. Pada tab **Source**:
   * Pilih **Raw** (Copy-paste isi file `docker-compose.yml` dari repository ini), **ATAU**
   * Pilih **Git** dan arahkan ke file `docker-compose.yml` di repository.
4. Buka tab **Domains**:
   * Arahkan domain Anda ke service `app` pada port `3000`.
   * Aktifkan SSL Let's Encrypt.
5. Klik **Deploy**. Dokploy akan otomatis membangun kontainer aplikasi dan PostgreSQL sekaligus.

---

## Inisialisasi & Verifikasi Database Otomatis

Aplikasi ini telah dirancang dengan sistem **Auto-Migration & Auto-Seeding**:
* Saat pertama kali kontainer terhubung ke PostgreSQL, sistem akan mengeksekusi `server/schema.sql` untuk membuat tabel:
  * `berita`
  * `anggota_tim` (mencakup 7 divisi lengkap: PSDM, Kreativitas & Humas, Sosial & Kegiatan, Olahraga & Kesehatan, Pendidikan & Seni Budaya, Kerohanian, Ekonomi & Kewirausahaan, serta Pengurus Harian)
  * `galeri`
  * `aspirasi`
  * `admin_users`
* Jika tabel masih kosong, sistem otomatis mengisi data inisial lengkap Karang Taruna Margabakti 07.

### Kredensial Masuk Panel Admin Bawaan
* **Username:** `admin`
* **Password:** `katar2026`
*(Kredensial dapat diperbarui kapan saja melalui database atau dashboard admin).*

### Endpoint Pemeriksaan Kesehatan (Healthcheck)
Anda dapat memverifikasi status koneksi aplikasi ke PostgreSQL melalui browser di:
```text
https://domain-anda.com/api/health
```
Respons yang diharapkan:
```json
{
  "status": "ok",
  "app": "Karang Taruna Margabakti 07",
  "database": "connected",
  "timestamp": "2026-09-29T12:00:00.000Z"
}
```

---

## Backup Otomatis Database di Dokploy
1. Buka database `katar-postgres` di Dokploy.
2. Masuk ke tab **Backups**.
3. Dokploy mendukung penyimpanan backup berkala terjadwal (Cron schedule) ke:
   * Local VPS volume
   * Amazon S3 / MinIO / Cloudflare R2 / DigitalOcean Spaces
4. Tentukan jadwal (misal setiap hari pukul 02.00: `0 2 * * *`).
