import React, { lazy, Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowDown, Sparkles, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Logo } from '../common/Logo';
import { InteractiveConstellationCanvas } from '../common/InteractiveConstellationCanvas';
import { HeroCivicScene } from '../common/HeroCivicScene';
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

const SpaceCompanions = lazy(() => import('../common/SpaceCompanions').then((module) => ({ default: module.SpaceCompanions })));

export const Hero: React.FC = () => {
  const { beritaList, timList, galeriList } = useData();
  const featuredBerita = beritaList.find((item) => item.status === 'published') ?? beritaList[0] ?? null;
  const shouldReduceMotion = useReducedMotion();

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
      className="relative min-h-[100svh] flex items-center justify-center pt-28 sm:pt-36 lg:pt-40 pb-14 sm:pb-20 bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden select-none"
    >
      {/* 1. Procedural 2D Interactive Constellation Mesh (techniques.md #2) */}
      <InteractiveConstellationCanvas className="opacity-75 z-0" />

      {/* 2. Ambient Glow Bloom Layer (rules/ambient-glow-bloom.md) */}
      <motion.div
        animate={shouldReduceMotion ? undefined : {
          opacity: [0.28, 0.55, 0.28],
          scale: [1, 1.12, 1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-[24rem] sm:h-100 sm:w-140 bg-amber-500/15 rounded-full blur-[90px] sm:blur-[110px] pointer-events-none z-1"
        aria-hidden="true"
      />
      <div className="soft-grid absolute inset-0 z-1 opacity-[0.16]" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-9 sm:gap-12 lg:gap-8 items-center">
          {/* Main Hero Narrative (7 cols) */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
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
                <Logo variant="white" size="xl" className="h-[3.25rem] sm:h-16 md:h-18 lg:h-20 w-auto drop-shadow-[0_10px_20px_rgba(245,158,11,0.2)]" />
              </motion.div>
            </motion.div>

            {/* Headline with Dynamic Kinetic Word Switcher & Gradient Text Sweep */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[2.45rem] sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.07] sm:leading-[1.14]"
            >
              Kumpulan Pemuda, <br />
              <GradientTextSweep className="mt-1">
                Berdiri Sebagai
              </GradientTextSweep>{' '}
              <div className="relative block sm:inline-block min-h-[2.35em] sm:min-h-0 sm:min-w-[340px] text-center lg:text-left">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 16, rotateX: 60 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -16, rotateX: -60 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="inline-block max-w-[11ch] sm:max-w-none text-amber-400 font-black drop-shadow-[0_2px_15px_rgba(251,191,36,0.35)]"
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
              className="pt-5 sm:pt-6 border-t border-slate-800/90 grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg mx-auto lg:mx-0"
            >
              <div className="text-center lg:text-left p-3 rounded-xl bg-slate-900/85 border border-slate-700/80 shadow-md backdrop-blur-md hover:border-amber-400/50 transition-all">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                  <CountingNumber value={timList.length || 24} />
                  <span className="text-amber-300 text-lg">+</span>
                </div>
                <div className="text-xs text-slate-300 font-semibold mt-1">
                  Pengurus Aktif
                </div>
              </div>

              <div className="text-center lg:text-left p-3 rounded-xl bg-slate-900/85 border border-slate-700/80 shadow-md backdrop-blur-md hover:border-amber-400/50 transition-all">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                  <CountingNumber value={beritaList.length || 18} />
                </div>
                <div className="text-xs text-slate-300 font-semibold mt-1">
                  Warta & Berita
                </div>
              </div>

              <div className="text-center lg:text-left p-3 rounded-xl bg-slate-900/85 border border-slate-700/80 shadow-md backdrop-blur-md hover:border-amber-400/50 transition-all">
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

          {/* Layered civic scene: a live story card is the focal point, not a decorative panel. */}
          <div className="lg:col-span-5 relative">
            <HeroCivicScene
              imageUrl={featuredBerita?.gambarUrl}
              title={featuredBerita?.judul || 'Kerja Bakti Bersih Saluran Air dan Penghijauan Lingkungan'}
              date={featuredBerita?.tanggal || 'Oktober 2026'}
            />
            <Suspense fallback={<div className="space-companions" />}>
              <SpaceCompanions />
            </Suspense>
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
