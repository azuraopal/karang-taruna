import React, { lazy, Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowDown, Sparkles, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Logo } from '../common/Logo';
import { InteractiveConstellationCanvas } from '../common/InteractiveConstellationCanvas';
import { HeroCivicScene } from '../common/HeroCivicScene';
import { CountingNumber } from '../common/CountingNumber';
import { GradientTextSweep } from '../common/GradientTextSweep';
import { triggerParticleBurst } from '../../utils/particleBurst';

const ROTATING_WORDS = ['Penggerak Warga', 'Inovator Muda', 'Kekuatan Kolaborasi', 'Pilar Gotong Royong', 'Inspirasi Margabakti'];
const SpaceCompanions = lazy(() => import('../common/SpaceCompanions').then((module) => ({ default: module.SpaceCompanions })));

export const Hero: React.FC = () => {
  const { beritaList, timList, galeriList } = useData();
  const featuredBerita = beritaList.find((item) => item.status === 'published') ?? null;
  const shouldReduceMotion = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: number | undefined;
    const syncRotation = () => {
      window.clearInterval(timer);
      if (!preference.matches && !document.hidden) {
        timer = window.setInterval(() => setWordIndex((index) => (index + 1) % ROTATING_WORDS.length), 3200);
      }
    };
    syncRotation();
    preference.addEventListener('change', syncRotation);
    document.addEventListener('visibilitychange', syncRotation);
    return () => {
      window.clearInterval(timer);
      preference.removeEventListener('change', syncRotation);
      document.removeEventListener('visibilitychange', syncRotation);
    };
  }, []);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: shouldReduceMotion ? 'instant' : 'smooth' });
    }
  };

  const handleCtaClick = (e: React.MouseEvent, targetId: string) => {
    if (!shouldReduceMotion) triggerParticleBurst({
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
      className="hero-brand-surface relative min-h-[100svh] flex items-center justify-center pt-28 sm:pt-36 lg:pt-40 pb-14 sm:pb-20 text-white overflow-hidden"
    >

      {!shouldReduceMotion && <InteractiveConstellationCanvas className="opacity-75 z-0" />}
      {/* 2. Ambient Glow Bloom Layer (rules/ambient-glow-bloom.md) */}
      <motion.div
        animate={shouldReduceMotion ? undefined : {
          opacity: [0.2, 0.35, 0.2],
          scale: [1, 1.12, 1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="hero-orbit-glow absolute pointer-events-none z-1"
        aria-hidden="true"
      />
      <div className="soft-grid absolute inset-0 z-1 opacity-[0.16]" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="hero-layout grid grid-cols-1 lg:grid-cols-12 gap-9 sm:gap-12 lg:gap-8 items-center">
          {/* Main Hero Narrative (7 cols) */}
          <div className="hero-narrative lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="hero-identity flex flex-col items-center lg:items-start gap-3.5"
            >
              {/* Wrap naturally so the portal name and status remain readable. */}
              <div className="portal-identity">
                <span className="portal-identity__name">
                  <span className="portal-identity__beacon" aria-hidden="true" />
                  <span>Portal Resmi Karang Taruna <span className="whitespace-nowrap">Margabakti 07</span></span>
                </span>
                <span className="portal-identity__status">Aktif & Berdaya</span>
              </div>

              {/* Responsive Logotype Brand Centerpiece with subtle 3D hover */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="hidden sm:block py-1"
              >
                <Logo variant="white" size="xl" className="h-[3.25rem] sm:h-16 md:h-18 lg:h-20 w-auto drop-shadow-[0_10px_20px_rgba(245,158,11,0.2)]" />
              </motion.div>
            </motion.div>

            {/* Original headline and word-switch animation, with a stable line height. */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hero-heading text-[2rem] sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.07] sm:leading-[1.14]"
            >
              Kumpulan Pemuda, <br />
              <GradientTextSweep className="mt-1" gradient="var(--orbit-text-gradient)" speed={8}>
                Berdiri Sebagai
              </GradientTextSweep>{' '}
              <span className="hero-rotating-word relative block min-h-[1.25em] text-center lg:text-left" aria-live="off">
                <AnimatePresence mode="wait">
                  <motion.span key={wordIndex}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 16, rotateX: 60 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -16, rotateX: -60 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="orbit-headline-gradient inline-block font-black">
                    {ROTATING_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hero-description text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-subtitle"
            >
              Menjadikan Karang Taruna sebagai wadah pemuda yang aktif, inovatif, dan menjadi lokomotif perubahan nyata di lingkungan masyarakat RW 07 Margabakti.
            </motion.p>

            {/* CTAs with tactile physics (rules/press-release-spring.md) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="hero-actions flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={(e) => handleCtaClick(e, 'berita')}
                className="hero-action-primary group w-full sm:w-auto px-7 py-3.5 bg-linear-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-400/25 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-200/60"
              >
                <span>Lihat Agenda & Berita</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleCtaClick(e, 'aspirasi')}
                className="hero-action-secondary w-full sm:w-auto px-7 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-100 hover:text-white font-bold text-sm rounded-xl border border-slate-700/80 hover:border-amber-400/50 shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
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
              className="hero-stats pt-5 sm:pt-6 border-t border-slate-800/90 grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg mx-auto lg:mx-0"
            >
              <div className="liquid-dark text-center lg:text-left p-3 rounded-xl">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                  <CountingNumber value={timList.length} />
                </div>
                <div className="text-xs text-slate-300 font-semibold mt-1">
                  Pengurus Aktif
                </div>
              </div>

              <div className="liquid-dark text-center lg:text-left p-3 rounded-xl">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                  <CountingNumber value={beritaList.filter(item => item.status === 'published').length} />
                </div>
                <div className="text-xs text-slate-300 font-semibold mt-1">
                  Berita Terbit
                </div>
              </div>

              <div className="liquid-dark text-center lg:text-left p-3 rounded-xl">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                  <CountingNumber value={galeriList.length} />
                </div>
                <div className="text-xs text-slate-300 font-semibold mt-1">
                  Album Kegiatan
                </div>
              </div>
            </motion.div>
          </div>

          {/* Layered civic scene: a live story card is the focal point, not a decorative panel. */}
          <div className="hero-visual lg:col-span-5 relative">
            <HeroCivicScene
              imageUrl={featuredBerita?.gambarUrl}
              title={featuredBerita?.judul || 'Kenali kegiatan dan karya pemuda Margabakti 07'}
              date={featuredBerita?.tanggal || 'RW 07 Margabakti'}
            />
            <div className="hero-rocket-zone" aria-hidden="true">
              <svg className="hero-rocket-orbit" viewBox="0 0 420 160" fill="none">
                <ellipse cx="210" cy="83" rx="174" ry="49" stroke="currentColor" strokeOpacity=".32" />
                <ellipse cx="210" cy="83" rx="142" ry="35" stroke="currentColor" strokeOpacity=".18" strokeDasharray="3 8" />
                <path d="M52 103C110 158 330 137 375 62" stroke="currentColor" strokeOpacity=".6" strokeLinecap="round" />
                <g fill="currentColor">
                  <circle cx="50" cy="65" r="3" /><circle cx="342" cy="115" r="3" />
                  <circle cx="125" cy="28" r="1.5" /><circle cx="290" cy="140" r="1.5" />
                  <circle cx="386" cy="91" r="1" /><circle cx="192" cy="125" r="1" />
                </g>
                <path d="m325 24 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="currentColor" fillOpacity=".7" />
                <path d="m90 119 1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5Z" fill="#8bc9e3" fillOpacity=".6" />
              </svg>
              <Suspense fallback={<div className="space-companions" />}><SpaceCompanions /></Suspense>
            </div>
          </div>
        </div>

        {/* Scroll Indicator with smooth floating bounce */}
        <div className="hero-scroll-cue pt-12 flex justify-center">
          <motion.button
            type="button"
            whileHover={{ y: 2 }}
            onClick={() => handleScrollTo('tentang')}
            className="flex flex-col items-center gap-2 text-xs text-slate-400 hover:text-amber-400 transition-colors focus:outline-none cursor-pointer"
            aria-label="Gulir ke bagian Tentang Karang Taruna"
          >
            <span className="font-semibold tracking-wide">Kenali Kami Lebih Dekat</span>
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, 6, 0] }}
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
