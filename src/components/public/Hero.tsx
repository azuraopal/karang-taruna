import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, ArrowDown, Sparkles, ArrowRight, Activity } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Logo } from '../common/Logo';
import { InteractiveConstellationCanvas } from '../common/InteractiveConstellationCanvas';
import { TiltCard } from '../common/TiltCard';
import { CountingNumber } from '../common/CountingNumber';
import { GradientTextSweep } from '../common/GradientTextSweep';
import { triggerParticleBurst } from '../../utils/particleBurst';

const ROTATING_WORDS = [
  'Penggerak Warga',
  'Inovator Muda',
  'Kekuatan Kolaborasi',
  'Pilar Gotong Royong',
  'Inspirasi Margabakti',
];

export const Hero: React.FC = () => {
  const { beritaList, timList, galeriList } = useData();
  const featuredBerita = beritaList.find((item) => item.status === 'published') ?? beritaList[0] ?? null;

  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCtaClick = (e: React.MouseEvent, targetId: string) => {
    triggerParticleBurst({
      x: e.clientX,
      y: e.clientY,
      count: 24,
      power: 0.9,
    });
    handleScrollTo(targetId);
  };

  return (
    <section
      id="beranda"
      className="relative min-h-[96vh] flex items-center justify-center pt-36 sm:pt-40 pb-20 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden select-none"
    >
      {/* 1. Procedural 2D Interactive Constellation Mesh (techniques.md #2) */}
      <InteractiveConstellationCanvas className="opacity-75 z-0" />

      {/* 2. Ambient Glow Bloom Layer (rules/ambient-glow-bloom.md) */}
      <motion.div
        animate={{
          opacity: [0.35, 0.65, 0.35],
          scale: [1, 1.12, 1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-140 h-100 bg-amber-500/15 rounded-full blur-[110px] pointer-events-none z-1"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Main Hero Narrative (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="flex flex-col items-center lg:items-start gap-3.5"
            >
              {/* Badge with live beacon */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide shadow-lg shadow-amber-500/10 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="truncate">Portal Resmi Karang Taruna Margabakti 07</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
                  AKTIF & BERDAYA
                </span>
              </div>

              {/* Responsive Logotype Brand Centerpiece with subtle 3D hover */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="py-1 cursor-pointer"
                onClick={(e) => triggerParticleBurst({ x: e.clientX, y: e.clientY, count: 20 })}
              >
                <Logo variant="white" size="xl" className="h-16 sm:h-16 md:h-18 lg:h-20 w-auto drop-shadow-[0_10px_20px_rgba(245,158,11,0.2)]" />
              </motion.div>
            </motion.div>

            {/* Headline with Dynamic Kinetic Word Switcher & Gradient Text Sweep */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.14]"
            >
              Kumpulan Pemuda, <br />
              <GradientTextSweep className="mt-1">
                Berdiri Sebagai
              </GradientTextSweep>{' '}
              <div className="relative inline-block min-w-[260px] sm:min-w-[340px] text-center lg:text-left">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 16, rotateX: 60 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -16, rotateX: -60 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="inline-block text-amber-400 font-black drop-shadow-[0_2px_15px_rgba(251,191,36,0.35)]"
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-subtitle"
            >
              Menjadikan Karang Taruna sebagai wadah pemuda yang aktif, inovatif, dan menjadi lokomotif perubahan nyata di lingkungan masyarakat RW 07 Margabakti.
            </motion.p>

            {/* CTAs with tactile physics (rules/press-release-spring.md) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={(e) => handleCtaClick(e, 'berita')}
                className="group w-full sm:w-auto px-7 py-3.5 bg-linear-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-400/25 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-200/60"
              >
                <span>Lihat Agenda & Berita</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleCtaClick(e, 'aspirasi')}
                className="w-full sm:w-auto px-7 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-100 hover:text-white font-bold text-sm rounded-xl border border-slate-700/80 hover:border-amber-400/50 shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Sampaikan Aspirasi Pemuda</span>
              </motion.button>
            </motion.div>

            {/* Dynamic Animated Stats Row (rules/counting-dynamic-scale.md) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-6 border-t border-slate-800/90 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0"
            >
              <div className="text-center lg:text-left p-3 rounded-2xl bg-slate-900/85 border border-slate-700/80 shadow-md backdrop-blur-md hover:border-amber-400/50 transition-all">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                  <CountingNumber value={timList.length || 24} />
                  <span className="text-amber-300 text-lg">+</span>
                </div>
                <div className="text-xs text-slate-300 font-semibold mt-1">
                  Pengurus Aktif
                </div>
              </div>

              <div className="text-center lg:text-left p-3 rounded-2xl bg-slate-900/85 border border-slate-700/80 shadow-md backdrop-blur-md hover:border-amber-400/50 transition-all">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                  <CountingNumber value={beritaList.length || 18} />
                </div>
                <div className="text-xs text-slate-300 font-semibold mt-1">
                  Warta & Berita
                </div>
              </div>

              <div className="text-center lg:text-left p-3 rounded-2xl bg-slate-900/85 border border-slate-700/80 shadow-md backdrop-blur-md hover:border-amber-400/50 transition-all">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                  <CountingNumber value={galeriList.length || 45} />
                  <span className="text-amber-300 text-lg">+</span>
                </div>
                <div className="text-xs text-slate-300 font-semibold mt-1">
                  Foto Kegiatan
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hero Feature 3D Tilt Card (rules/split-tilt-cards.md & techniques.md #3) */}
          <div className="lg:col-span-5 relative">
            <TiltCard
              maxTilt={14}
              glareOpacity={0.25}
              scale={1.03}
              className="mx-auto max-w-md rounded-3xl"
            >
              <div className="relative bg-slate-900/80 rounded-3xl p-3 border border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden group">
                {/* Subtle internal neon edge accent */}
                <div className="absolute inset-0 bg-linear-to-tr from-amber-500/10 via-transparent to-sky-500/10 pointer-events-none rounded-3xl" />

                <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-950">
                  {featuredBerita?.gambarUrl ? (
                    <motion.img
                      src={featuredBerita.gambarUrl}
                      alt={featuredBerita.judul}
                      animate={{ scale: [1.02, 1.08, 1.02], x: [0, -3, 0] }}
                      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/50 to-transparent" />

                  {/* Top Badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-lg">
                      <Activity className="w-3.5 h-3.5" />
                      Kegiatan Terkini
                    </span>
                  </div>

                  {/* Bottom Text Highlight */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-lg font-black text-white line-clamp-2 leading-snug drop-shadow-md">
                      {featuredBerita?.judul || 'Kerja Bakti Bersih Saluran Air dan Penghijauan Lingkungan'}
                    </h2>
                    <p className="text-xs text-amber-300 mt-1.5 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{featuredBerita?.tanggal || 'Oktober 2026'}</span>
                    </p>
                  </div>
                </div>

                {/* Mini Card Highlight Footer */}
                <div className="mt-3 p-3.5 bg-slate-950/90 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-200 truncate">
                        {featuredBerita?.ringkasan || 'Aksi nyata gotong royong pemuda & warga'}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Keterlibatan seluruh elemen RW 07</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleCtaClick(e, 'berita')}
                    className="text-xs font-black text-amber-400 hover:text-amber-300 focus:outline-none px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-all shrink-0 cursor-pointer"
                  >
                    Detail
                  </button>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* Scroll Indicator with smooth floating bounce */}
        <div className="pt-12 flex justify-center">
          <motion.button
            type="button"
            whileHover={{ y: 2 }}
            onClick={() => handleScrollTo('tentang')}
            className="flex flex-col items-center gap-2 text-xs text-slate-400 hover:text-amber-400 transition-colors focus:outline-none cursor-pointer"
            aria-label="Gulir ke bagian Tentang Karang Taruna"
          >
            <span className="font-semibold tracking-wide">Kenali Kami Lebih Dekat</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="p-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-amber-400 shadow-md"
            >
              <ArrowDown className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </section>
  );
};
