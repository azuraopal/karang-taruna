import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper,
  Users,
  Camera,
  MessageSquare,
  Plus,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Flame,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { TiltCard } from '../common/TiltCard';
import { CountingNumber } from '../common/CountingNumber';
import { triggerParticleBurst } from '../../utils/particleBurst';

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

  const [greeting] = useState(() => {
    if (typeof window === 'undefined') return 'Selamat Datang';
    const jakartaHour = Number(
      new Intl.DateTimeFormat('id-ID', {
        hour: 'numeric',
        hourCycle: 'h23',
        timeZone: 'Asia/Jakarta',
      }).format(new Date())
    );
    if (jakartaHour < 11) return 'Selamat Pagi';
    if (jakartaHour < 15) return 'Selamat Siang';
    if (jakartaHour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  });
  const aspirasiBaruCount = aspirasiList.filter((a) => a.status === 'baru').length;
  const publishedBeritaCount = beritaList.filter((b) => b.status === 'published').length;

  const statCards = [
    {
      label: 'Total Warta & Berita',
      value: beritaList.length,
      keterangan: `${publishedBeritaCount} Warta Tayang di Publik`,
      ikon: <Newspaper className="w-5 h-5 text-amber-500" />,
      tab: 'berita',
      percentage: beritaList.length > 0 ? Math.round((publishedBeritaCount / beritaList.length) * 100) : 100,
      barColor: 'from-amber-500 to-amber-400',
    },
    {
      label: 'Anggota & Pengurus',
      value: timList.length,
      keterangan: '7 Divisi Bidang Kerja Aktif',
      ikon: <Users className="w-5 h-5 text-sky-500" />,
      tab: 'tim',
      percentage: 100,
      barColor: 'from-sky-500 to-cyan-400',
    },
    {
      label: 'Foto Dokumentasi',
      value: galeriList.length,
      keterangan: 'Arsip Kegiatan Warga',
      ikon: <Camera className="w-5 h-5 text-emerald-500" />,
      tab: 'galeri',
      percentage: Math.min(100, galeriList.length * 15),
      barColor: 'from-emerald-500 to-teal-400',
    },
    {
      label: 'Aspirasi Masuk',
      value: aspirasiList.length,
      keterangan: `${aspirasiBaruCount} Menunggu Tindak Lanjut`,
      ikon: <MessageSquare className="w-5 h-5 text-rose-500" />,
      tab: 'aspirasi',
      highlight: aspirasiBaruCount > 0,
      percentage: aspirasiList.length > 0 ? Math.round(((aspirasiList.length - aspirasiBaruCount) / aspirasiList.length) * 100) : 100,
      barColor: 'from-rose-500 to-orange-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Mindblowing Welcome Hero Banner with Ambient Bloom (rules/ambient-glow-bloom.md) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 border border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Soft breathing neon glow behind hero */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="min-w-0 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Sistem Aktif & Terhubung
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Margabakti 07 Dashboard
            </span>
          </div>

          <p className="text-xl sm:text-2xl font-black text-amber-300 mb-1">
            {greeting}, {currentUser?.namaLengkap || 'Pengurus'}!
          </p>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white break-words">
            Pusat Kendali Portal Karang Taruna
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed font-subtitle">
            Kelola publikasi warta, dokumentasi aksi warga, struktur kepengurusan pemuda, dan respon aspirasi secara real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3 md:shrink-0 relative z-10">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              triggerParticleBurst({ x: e.clientX, y: e.clientY, count: 25 });
              setCurrentView('public');
            }}
            className="px-5 py-3 bg-linear-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer border border-amber-200/50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tinjau Website Publik</span>
            <ArrowUpRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Interactive 3D Tilt Metric Cards with Counting Numbers & Progress Fills (rules/split-tilt-cards.md & rules/counting-dynamic-scale.md) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
          >
            <TiltCard
              maxTilt={10}
              glareOpacity={0.16}
              className="h-full rounded-2xl"
              onClick={() => onNavigateTab(stat.tab)}
            >
              <div
                className={`min-w-0 p-6 rounded-2xl border transition-all cursor-pointer h-full flex flex-col justify-between ${
                  stat.highlight
                    ? 'border-rose-300 bg-rose-50/40 shadow-sm shadow-rose-500/10'
                    : 'border-stone-200 bg-white hover:border-amber-400/80 shadow-2xs hover:shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {stat.label}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-stone-100/80 border border-stone-200/60 flex items-center justify-center shadow-2xs">
                      {stat.ikon}
                    </div>
                  </div>

                  <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 tracking-tight">
                    <CountingNumber value={stat.value} />
                  </div>

                  {/* Animated Progress Fill Bar (rules/stat-bars-and-fills.md) */}
                  <div className="mt-3.5 w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.percentage}%` }}
                      transition={{ duration: 1, delay: 0.2 + idx * 0.1, ease: 'easeOut' }}
                      className={`h-full bg-linear-to-r ${stat.barColor} rounded-full`}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-slate-600 flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">{stat.keterangan}</span>
                  <span className="shrink-0 whitespace-nowrap text-amber-700 font-bold hover:underline flex items-center gap-1">
                    <span>Kelola</span> &rarr;
                  </span>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {/* 3. Aksi Cepat Pengurus with Spring Feedback & Sheen Effects (rules/press-release-spring.md) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Aksi Cepat Pengurus</span>
          </h3>
          <span className="text-xs font-semibold text-slate-400">Pintasan Manajemen Konten</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.button
            type="button"
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={(e) => {
              triggerParticleBurst({ x: e.clientX, y: e.clientY, count: 16 });
              onOpenCreateBerita();
            }}
            className="p-4.5 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-left flex items-start gap-3.5 group focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-2xs hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shadow-2xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 group-hover:text-amber-800">
                Tulis Berita Baru
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Publikasikan warta kegiatan atau pengumuman resmi warga
              </div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={(e) => {
              triggerParticleBurst({ x: e.clientX, y: e.clientY, count: 16 });
              onOpenCreateTim();
            }}
            className="p-4.5 rounded-2xl border-2 border-dashed border-stone-300 hover:border-sky-500 hover:bg-sky-50/50 transition-all text-left flex items-start gap-3.5 group focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer shadow-2xs hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 group-hover:bg-sky-500 group-hover:text-white transition-colors shadow-2xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 group-hover:text-sky-800">
                Tambah Anggota Tim
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Perbarui susunan kepengurusan dan divisi pemuda
              </div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={(e) => {
              triggerParticleBurst({ x: e.clientX, y: e.clientY, count: 16 });
              onOpenCreateGaleri();
            }}
            className="p-4.5 rounded-2xl border-2 border-dashed border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left flex items-start gap-3.5 group focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-2xs hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors shadow-2xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 group-hover:text-emerald-800">
                Unggah Foto Kegiatan
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Simpan dokumentasi momen gotong royong ke galeri
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* 4. Dua Kolom Pratinjau Terkini dengan Staggered Cards (rules/waterfall-entry.md) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Berita Terakhir */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
            <h3 className="min-w-0 text-sm font-black text-slate-900 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-amber-600" />
              <span>Warta Terakhir Dipublikasikan</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('berita')}
              className="shrink-0 text-xs font-bold text-amber-700 hover:underline cursor-pointer"
            >
              Lihat Semua ({beritaList.length})
            </button>
          </div>

          <div className="space-y-3">
            {beritaList.slice(0, 3).map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="flex flex-wrap items-start gap-3.5 p-3 rounded-2xl hover:bg-stone-50 border border-transparent hover:border-stone-200/80 transition-all cursor-pointer group"
                onClick={() => onNavigateTab('berita')}
              >
                <img
                  src={item.gambarUrl}
                  alt={item.judul}
                  className="w-13 h-13 rounded-xl object-cover shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                    {item.judul}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 mt-1">
                    <span className="font-semibold text-amber-700">{item.kategori}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.tanggal}
                    </span>
                  </div>
                </div>
                <span
                  className={`w-full sm:w-auto text-center text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${
                    item.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {item.status === 'published' ? 'Tayang' : 'Draft'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Aspirasi Terkini */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-600" />
              <span>Aspirasi & Aduan Warga Terbaru</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('aspirasi')}
              className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
            >
              Lihat Semua ({aspirasiList.length})
            </button>
          </div>

          <div className="space-y-3">
            {aspirasiList.length > 0 ? (
              aspirasiList.slice(0, 3).map((asp, idx) => (
                <motion.div
                  key={asp.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-amber-400/60 hover:shadow-2xs transition-all space-y-2 cursor-pointer"
                  onClick={() => onNavigateTab('aspirasi')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      {asp.nama}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        asp.status === 'baru'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : asp.status === 'dibaca'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {asp.status === 'baru'
                        ? 'Aspirasi Baru'
                        : asp.status === 'dibaca'
                        ? 'Sudah Dibaca'
                        : 'Ditindaklanjuti'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-subtitle">
                    {asp.pesan}
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5 border-t border-stone-100">
                    <span className="font-semibold text-slate-600">{asp.kategori}</span>
                    <span>&bull;</span>
                    <span>{asp.tanggal}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                Belum ada aspirasi warga yang masuk.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
