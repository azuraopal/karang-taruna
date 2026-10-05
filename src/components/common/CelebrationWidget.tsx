import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import { triggerParticleBurst } from '../../utils/particleBurst';

interface FloatingCheer {
  id: number;
  text: string;
  x: number;
}

const CHEER_PHRASES = [
  '🔥 Kobarkan Semangat!',
  '✨ Pemuda Berdaya!',
  '🌟 Margabakti Juara!',
  '🤝 Gotong Royong!',
  '💡 Terus Berinovasi!',
  '🇮🇩 Pemuda Penggerak!',
];

export const CelebrationWidget: React.FC = () => {
  const [cheerCount, setCheerCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 128;
    try {
      const saved = localStorage.getItem('katar_cheer_count');
      return saved ? parseInt(saved, 10) : 128;
    } catch {
      return 128;
    }
  });
  const [floatingCheers, setFloatingCheers] = useState<FloatingCheer[]>([]);
  const [isPressed, setIsPressed] = useState<boolean>(false);

  const handleCheer = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX || rect.left + rect.width / 2;
    const clickY = e.clientY || rect.top + rect.height / 2;

    triggerParticleBurst({
      x: clickX,
      y: clickY,
      count: 36,
      power: 1.1,
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 30, 20]);
    }

    const nextCount = cheerCount + 1;
    setCheerCount(nextCount);
    try {
      localStorage.setItem('katar_cheer_count', nextCount.toString());
    } catch {
      // ignore
    }

    const newCheer: FloatingCheer = {
      id: Date.now() + Math.random(),
      text: CHEER_PHRASES[Math.floor(Math.random() * CHEER_PHRASES.length)],
      x: (Math.random() - 0.5) * 60,
    };

    setFloatingCheers((prev) => [...prev.slice(-6), newCheer]);

    setTimeout(() => {
      setFloatingCheers((prev) => prev.filter((c) => c.id !== newCheer.id));
    }, 1800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end pointer-events-none">
      {/* Floating Cheers Text Bubble Cascade */}
      <AnimatePresence>
        {floatingCheers.map((cheer) => (
          <motion.div
            key={cheer.id}
            initial={{ opacity: 0, y: 10, scale: 0.8, x: cheer.x }}
            animate={{ opacity: 1, y: -45, scale: 1.05 }}
            exit={{ opacity: 0, y: -80, scale: 0.9 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="mb-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-amber-300 text-xs font-black shadow-xl border border-amber-500/40 backdrop-blur-md whitespace-nowrap"
          >
            {cheer.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Interactive Trigger Button */}
      <motion.button
        type="button"
        onClick={handleCheer}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="pointer-events-auto relative group flex items-center gap-2.5 px-4 py-3 bg-linear-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-950 font-black text-xs sm:text-sm rounded-full shadow-xl shadow-amber-500/30 border border-amber-200/50 focus:outline-none focus:ring-4 focus:ring-amber-400/40 transition-all cursor-pointer select-none"
        aria-label="Kirim Semangat Pemuda"
        title="Klik untuk menyalurkan dukungan dan apresiasi pemuda!"
      >
        {/* Pulsing ambient aura */}
        <span
          className="absolute -inset-1 rounded-full bg-amber-400/35 blur-md group-hover:bg-amber-400/60 transition-all animate-pulse"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2">
          <motion.div
            animate={isPressed ? { rotate: [0, -15, 15, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="p-1.5 bg-slate-950 text-amber-400 rounded-full"
          >
            <Flame className="w-4 h-4 fill-amber-400" />
          </motion.div>
          <div className="flex flex-col text-left leading-tight pr-1">
            <span className="text-[10px] text-slate-900/80 font-bold uppercase tracking-wider flex items-center gap-1">
              Semangat Warga <Sparkles className="w-2.5 h-2.5 text-slate-950" />
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-950 flex items-center gap-1.5">
              <span>{cheerCount.toLocaleString('id-ID')}</span>
              <span className="text-[11px] font-semibold text-slate-900/90">Dukungan</span>
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
};
