export type DivisiTim =
  | 'Pengurus Harian'
  | 'PSDM'
  | 'Kreativitas dan Humas'
  | 'Sosial & Kegiatan'
  | 'Olahraga dan Kesehatan'
  | 'Pendidikan & Seni Budaya'
  | 'Kerohanian'
  | 'Ekonomi & Kewirausahaan';

export interface AnggotaTim {
  id: string;
  nama: string;
  jabatan: string;
  divisi: DivisiTim;
  fotoUrl: string;
  bio: string;
  email?: string;
  noHp?: string;
  dibuatOleh?: string;
}

export type KategoriBerita =
  | 'Program Kerja'
  | 'Sosial & Warga'
  | 'Olahraga'
  | 'Pendidikan'
  | 'Pengumuman';

export interface Berita {
  id: string;
  judul: string;
  slug: string;
  ringkasan: string;
  isi: string;
  kategori: KategoriBerita;
  tanggal: string;
  tanggalPelaksanaan?: string;
  penulis: string;
  gambarUrl: string;
  gambarUrls?: string[];
  status: 'published' | 'draft';
  dibuatOleh?: string;
}

export type KategoriGaleri =
  | 'Kegiatan Sosial'
  | 'Olahraga'
  | 'Pentas Seni'
  | 'Lingkungan'
  | 'Pelatihan';

export interface ItemGaleri {
  id: string;
  judul: string;
  kategori: KategoriGaleri;
  tanggal: string;
  gambarUrl: string;
  deskripsi: string;
  lokasi: string;
  dibuatOleh?: string;
}

export interface Aspirasi {
  id: string;
  nama: string;
  email: string;
  noHp: string;
  kategori: 'Saran Kegiatan' | 'Aduan Lingkungan' | 'Ide Kreatif' | 'Lainnya';
  pesan: string;
  tanggal: string;
  status: 'baru' | 'dibaca' | 'selesai';
  dibuatOleh?: string;
}

export type ActivityAction = 'login' | 'tambah' | 'ubah' | 'hapus' | 'status';
export type ActivityEntity = 'Pengguna' | 'Berita' | 'Tim Pengurus' | 'Galeri' | 'Aspirasi' | 'Sistem';

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  entity: ActivityEntity;
  description: string;
  actorName: string;
  actorRole?: UserRole | 'public';
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  pesan: string;
}

export type UserRole = 'superadmin' | 'admin' | 'pengurus';

export interface UserAccount {
  id: string;
  username: string;
  namaLengkap: string;
  role: UserRole;
  isActive?: boolean;
  password?: string;
  createdAt?: string;
  dibuatOleh?: string;
}
