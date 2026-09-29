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
  penulis: string;
  gambarUrl: string;
  status: 'published' | 'draft';
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
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  pesan: string;
}

export type UserRole = 'admin' | 'pengurus';

export interface UserAccount {
  id: string;
  username: string;
  namaLengkap: string;
  role: UserRole;
  password?: string;
  createdAt?: string;
}
