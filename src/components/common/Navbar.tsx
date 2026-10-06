import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Lock, LayoutDashboard, ArrowUpRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Logo } from './Logo';
import { getDashboardPath, navigateTo } from '../../utils/appRoute';

interface NavbarProps {
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLoginModal }) => {
  const { currentView, setCurrentView, currentUser, isAdminLoggedIn, logoutAdmin } = useData();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('beranda');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const sections = ['beranda', 'tentang', 'tim', 'galeri', 'berita', 'aspirasi'];
      const scrollPos = window.scrollY + 140;
      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top && scrollPos < top + el.offsetHeight) {
            setActiveNav(sec);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'tentang', label: 'Tentang' },
    { id: 'tim', label: 'Struktur Tim' },
    { id: 'galeri', label: 'Galeri' },
    { id: 'berita', label: 'Warta & Agenda' },
    { id: 'aspirasi', label: 'Aspirasi Warga' },
  ];

  const handleNavClick = useCallback((id: string) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
    if (currentView === 'admin') {
      setCurrentView('public');
      navigateTo('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, [currentView, setCurrentView]);

  const handleDashboardToggle = () => {
    if (currentView === 'admin') {
      setCurrentView('public');
      navigateTo('/');
      return;
    }

    if (currentUser) {
      navigateTo(getDashboardPath(currentUser.role));
      setCurrentView('admin');
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-900/96 backdrop-blur-md shadow-lg shadow-black/30 py-3 border-b border-slate-800/80'
          : 'bg-slate-900 py-4 border-b border-slate-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <a
            href="#beranda"
            onClick={(e) => { e.preventDefault(); handleNavClick('beranda'); }}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg p-1"
          >
            <Logo variant="white" className="h-7 sm:h-8 w-auto" />
            <div className="hidden sm:block pl-2.5 border-l border-slate-700/80">
              <p className="text-xs text-slate-300 font-medium font-subtitle tracking-wide">
                Muda Berkarya, Nyata Berdaya
              </p>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-full border border-slate-800">
            {navLinks.map((link) => {
              const isActive = activeNav === link.id && currentView === 'public';
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    isActive ? 'text-slate-950' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                      className="absolute inset-0 bg-amber-400 rounded-full"
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDashboardToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    currentView === 'admin'
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                      : 'bg-slate-800 text-amber-400 border border-amber-500/30 hover:bg-slate-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {currentView === 'admin' ? 'Tinjau Web Publik' : 'Buka Panel Admin'}
                </button>
                <button
                  type="button"
                  onClick={logoutAdmin}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/90 hover:text-white border border-slate-700 hover:border-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Masuk Admin</span>
              </button>
            )}
          </div>

          {/* Mobile: ONLY hamburger — no other buttons polluting the header */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-800/80 text-slate-200 border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu navigasi'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileMenuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-5 h-5 text-amber-400" />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* ─── Full-Screen Mobile Curtain Menu ─────────────────────────────────
          Inspired by:
          · rules/waterfall-entry.md  — nav links arrive staggered from y:24
          · rules/spring-pop-entrance.md — CTA section pops scale 0.9→1
          · rules/ambient-glow-bloom.md — amber radial behind the brand mark
          · blueprints/titlecard-reveal.md — composed serene, one move each
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop (tap-to-close on overflow areas) */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden absolute inset-x-0 top-full bg-black/20 z-30"
              style={{ height: `calc(100dvh - ${isScrolled ? '56px' : '64px'})` }}
              aria-hidden="true"
            />

            {/* Curtain Panel */}
            {/* Curtain Panel — slide down from header edge */}
            <motion.div
              key="curtain"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden absolute inset-x-0 top-full z-35 bg-slate-950 flex flex-col overflow-y-auto"
              style={{ height: `calc(100dvh - ${isScrolled ? '56px' : '64px'})` }}
            >
              {/* Ambient glow (rules/ambient-glow-bloom.md): restrained, ≤0.45 opacity */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.18) 0%, transparent 72%)' }}
                aria-hidden="true"
              />

              {/* Nav links — waterfall-entry stagger (rules/waterfall-entry.md) */}
              <div className="flex-1 flex flex-col justify-center px-7 py-8 space-y-1">
                {navLinks.map((link, idx) => {
                  const isActive = activeNav === link.id && currentView === 'public';
                  return (
                    <motion.button
                      key={link.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: idx * 0.045,
                        duration: 0.32,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      onClick={() => handleNavClick(link.id)}
                      className="flex items-center justify-between w-full py-3.5 border-b border-slate-800/60 text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] font-mono text-slate-600 w-5 select-none">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={`text-xl font-black tracking-tight transition-colors ${
                            isActive ? 'text-amber-400' : 'text-slate-100 group-hover:text-amber-300'
                          }`}
                        >
                          {link.label}
                        </span>
                        {isActive && (
                          <motion.span
                            layoutId="mobileActiveIndicator"
                            className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"
                          />
                        )}
                      </div>
                      <ArrowUpRight
                        className={`w-4 h-4 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                          isActive ? 'text-amber-400 opacity-100' : 'text-slate-600'
                        }`}
                      />
                    </motion.button>
                  );
                })}
              </div>

              {/* Bottom action area — spring-pop-entrance (rules/spring-pop-entrance.md) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.045 + 0.05, duration: 0.4, ease: 'easeOut' }}
                className="px-7 pb-10 pt-5 border-t border-slate-800/60 space-y-3"
              >
                {isAdminLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDashboardToggle();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-400/20"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {currentView === 'admin' ? 'Tinjau Web Publik' : 'Buka Dashboard Admin'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenLoginModal();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 border border-slate-800 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Masuk ke Panel Pengurus</span>
                  </button>
                )}
                {isAdminLoggedIn && (
                  <button
                    type="button"
                    onClick={() => { logoutAdmin(); setMobileMenuOpen(false); }}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-rose-400 transition-colors text-center"
                  >
                    Keluar dari Sesi Admin
                  </button>
                )}
                <p className="text-[11px] text-slate-700 text-center font-subtitle pt-1">
                  Karang Taruna Margabakti 07 · RW 07
                </p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
