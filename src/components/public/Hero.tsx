import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Calendar, ArrowDown } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Logo } from '../common/Logo';

export const Hero: React.FC = () => {
  const { beritaList, timList, galeriList } = useData();
  const featuredBerita = beritaList.find((item) => item.status === 'published') ?? beritaList[0] ?? null;

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="beranda"
      className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-white overflow-hidden"
    >
      {/* Subtle organic light accent behind hero */}
      <motion.div
        animate={{ opacity: [0.55, 0.8, 0.55], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-135 h-90 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Main Hero Narrative (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center lg:items-start gap-3.5"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide shadow-xs">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Portal Resmi Karang Taruna Margabakti 07</span>
              </div>

              {/* Responsive Logotype Brand Centerpiece */}
              <div className="py-1">
                <Logo variant="white" size="xl" className="h-11 sm:h-14 md:h-16 lg:h-20 w-auto" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]"
            >
              Kumpulan Pemuda,{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-amber-300 to-amber-500">
                Berdiri Sebagai
              </span>{' '}
              Penggerak
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-subtitle"
            >
              Menjadikan Karang Taruna sebagai wadah pemuda yang aktif, inovatif dan menjadi penggerak perubahan dilingkungan masyarakat.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <button
                type="button"
                onClick={() => handleScrollTo('berita')}
                className="w-full sm:w-auto px-7 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-400/20 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                Lihat Agenda & Berita
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('aspirasi')}
                className="w-full sm:w-auto px-7 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm rounded-xl border border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                Sampaikan Aspirasi Pemuda
              </button>
            </motion.div>

            {/* Real Stats Row (Purposeful, C-5 compliant) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0"
            >
              <div className="text-center lg:text-left">
                <div className="text-2xl font-black text-amber-400">
                  {timList.length}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  Pengurus Aktif
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-black text-amber-400">
                  {beritaList.length}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  Warta & Berita
                </div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-black text-amber-400">
                  {galeriList.length}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">
                  Foto Kegiatan
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hero Feature Visual Card (5 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -8 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md bg-slate-800/60 rounded-3xl p-3 border border-slate-700/80 shadow-2xl backdrop-blur-xs">
              <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden group bg-black">
                {featuredBerita?.gambarUrl ? (
                  <motion.img
                    src={featuredBerita.gambarUrl}
                    alt={featuredBerita.judul}
                    animate={{ scale: [1.02, 1.07, 1.02], x: [0, -4, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/45 to-slate-900/10" />

                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 text-[11px] font-bold uppercase tracking-wider mb-2">
                    Kegiatan Terkini
                  </span>
                  <h2 className="text-base font-bold text-white line-clamp-2">
                    {featuredBerita?.judul || 'Kerja Bakti Bersih Saluran Air dan Penghijauan'}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{featuredBerita?.tanggal || 'September 2026'}</span>
                  </p>
                </div>
              </div>

              {/* Mini Card Highlight */}
              <div className="mt-3 p-3.5 bg-slate-900/90 rounded-xl border border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {featuredBerita?.judul || 'Pelaksanaan Pentas Seni & Budaya dibulan Agustus'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {featuredBerita?.ringkasan || 'Pelaksanaan Pentas Seni & Budaya dibulan Agustus'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleScrollTo('berita')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 focus:outline-none p-1"
                >
                  Detail
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="pt-12 flex justify-center">
          <button
            type="button"
            onClick={() => handleScrollTo('tentang')}
            className="flex flex-col items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors focus:outline-none"
            aria-label="Gulir ke bagian Tentang Karang Taruna"
          >
            <span>Kenali Kami Lebih Dekat</span>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ArrowDown className="w-4 h-4 text-amber-400" />
            </motion.div>
          </button>
        </div>
      </div>
    </section>
  );
};
