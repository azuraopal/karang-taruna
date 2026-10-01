import React from 'react';
import { Newspaper, Users, Camera, MessageSquare, Plus, ArrowUpRight } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateBerita: () => void;
  onOpenCreateTim: () => void;
  onOpenCreateGaleri: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onOpenCreateBerita,
  onOpenCreateTim,
  onOpenCreateGaleri,
}) => {
  const { beritaList, timList, galeriList, aspirasiList, currentUser, setCurrentView } = useData();

  const aspirasiBaruCount = aspirasiList.filter((a) => a.status === 'baru').length;
  const jakartaHour = Number(new Intl.DateTimeFormat('id-ID', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  }).format(new Date()));
  const greeting = jakartaHour < 11
    ? 'Selamat Pagi'
    : jakartaHour < 15
      ? 'Selamat Siang'
      : jakartaHour < 18
        ? 'Selamat Sore'
        : 'Selamat Malam';

  const statCards = [
    {
      label: 'Total Warta & Berita',
      value: beritaList.length,
      keterangan: `${beritaList.filter((b) => b.status === 'published').length} Tayang di Publik`,
      ikon: <Newspaper className="w-5 h-5 text-amber-500" />,
      tab: 'berita',
    },
    {
      label: 'Anggota & Pengurus',
      value: timList.length,
      keterangan: '7 Divisi Bidang Kerja Aktif',
      ikon: <Users className="w-5 h-5 text-sky-500" />,
      tab: 'tim',
    },
    {
      label: 'Foto Dokumentasi',
      value: galeriList.length,
      keterangan: 'Arsip Kegiatan Warga',
      ikon: <Camera className="w-5 h-5 text-emerald-500" />,
      tab: 'galeri',
    },
    {
      label: 'Aspirasi Masuk',
      value: aspirasiList.length,
      keterangan: `${aspirasiBaruCount} Menunggu Tindak Lanjut`,
      ikon: <MessageSquare className="w-5 h-5 text-rose-500" />,
      tab: 'aspirasi',
      highlight: aspirasiBaruCount > 0,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-8 text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 sm:gap-6 border border-slate-800 shadow-md">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              Panel Pengurus Aktif
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-300 mb-1">
            {greeting}, {currentUser?.namaLengkap || 'Pengurus'}
          </p>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white break-words">
            Pusat Kendali Portal Karang Taruna Margabakti 07
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
            Kelola warta kabar, dokumentasi kegiatan, susunan pengurus, dan respon aspirasi warga secara langsung.
          </p>
        </div>

        <div className="flex items-center gap-3 md:shrink-0">
          <button
            type="button"
            onClick={() => setCurrentView('public')}
            className="w-full md:w-auto justify-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <span>Tinjau Website Publik</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            onClick={() => onNavigateTab(stat.tab)}
            className={`min-w-0 p-6 rounded-2xl border transition-all cursor-pointer bg-white hover:shadow-md ${
              stat.highlight
                ? 'border-rose-300 bg-rose-50/30'
                : 'border-stone-200 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {stat.label}
              </span>
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                {stat.ikon}
              </div>
            </div>

            <div className="text-3xl font-black text-slate-900 mt-3">
              {stat.value}
            </div>

            <div className="mt-2 text-xs text-slate-600 flex items-center justify-between gap-3">
              <span className="min-w-0">{stat.keterangan}</span>
              <span className="shrink-0 whitespace-nowrap text-amber-700 font-bold hover:underline">Kelola &rarr;</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tombol Aksi Cepat */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Aksi Cepat Pengurus
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={onOpenCreateBerita}
            className="p-4 rounded-xl border border-dashed border-stone-300 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-left flex items-start gap-3 group focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                Tulis Berita Baru
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Publikasikan warta atau pengumuman warga
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenCreateTim}
            className="p-4 rounded-xl border border-dashed border-stone-300 hover:border-sky-500 hover:bg-sky-50/50 transition-all text-left flex items-start gap-3 group focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-sky-800">
                Tambah Anggota Tim
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Perbarui struktur kepengurusan Karang Taruna
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenCreateGaleri}
            className="p-4 rounded-xl border border-dashed border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left flex items-start gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                Unggah Foto Kegiatan
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Simpan dokumentasi aksi pemuda ke galeri
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Dua Kolom Pratinjau Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Berita Terakhir */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-amber-600" />
              <span>Warta Terakhir Dipublikasikan</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('berita')}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              Lihat Semua ({beritaList.length})
            </button>
          </div>

          <div className="space-y-3">
            {beritaList.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors"
              >
                <img
                  src={item.gambarUrl}
                  alt={item.judul}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {item.judul}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{item.kategori}</span>
                    <span>&bull;</span>
                    <span>{item.tanggal}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.status === 'published' ? 'Tayang' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Aspirasi Terkini */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-600" />
              <span>Aspirasi & Aduan Warga Terbaru</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('aspirasi')}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              Lihat Semua ({aspirasiList.length})
            </button>
          </div>

          <div className="space-y-3">
            {aspirasiList.length > 0 ? (
              aspirasiList.slice(0, 3).map((asp) => (
                <div
                  key={asp.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {asp.nama}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        asp.status === 'baru'
                          ? 'bg-rose-100 text-rose-800'
                          : asp.status === 'dibaca'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {asp.status === 'baru' ? 'Aspirasi Baru' : asp.status === 'dibaca' ? 'Sudah Dibaca' : 'Ditindaklanjuti'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {asp.pesan}
                  </p>
                  <div className="text-[10px] text-slate-400">
                    Kategori: {asp.kategori} &bull; {asp.tanggal}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                Belum ada aspirasi warga yang masuk.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
