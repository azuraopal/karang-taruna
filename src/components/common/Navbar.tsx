import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Lock, LayoutDashboard, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Logo } from './Logo';

interface NavbarProps {
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLoginModal }) => {
  const { currentView, setCurrentView, isAdminLoggedIn, logoutAdmin } = useData();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('beranda');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Detect active section on scroll
      const sections = ['beranda', 'tentang', 'tim', 'galeri', 'berita', 'aspirasi'];
      const scrollPos = window.scrollY + 140;

      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveNav(sec);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'tentang', label: 'Tentang' },
    { id: 'tim', label: 'Struktur Tim' },
    { id: 'galeri', label: 'Galeri' },
    { id: 'berita', label: 'Warta & Agenda' },
    { id: 'aspirasi', label: 'Aspirasi Warga' },
  ];

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    setMobileMenuOpen(false);

    if (currentView === 'admin') {
      setCurrentView('public');
      // allow view swap to render then scroll
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-900/95 backdrop-blur-md shadow-md py-3 border-b border-slate-800'
          : 'bg-slate-900 py-4.5 border-b border-slate-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <a
            href="#beranda"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('beranda');
            }}
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg p-1"
          >
            <Logo variant="white" className="h-7 sm:h-8.5 w-auto" />
            <div className="hidden sm:block pl-2.5 border-l border-slate-700/80">
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Aditya Karya Mahatva Yodha
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-full border border-slate-800">
            {navLinks.map((link) => {
              const isActive = activeNav === link.id && currentView === 'public';
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    isActive
                      ? 'text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
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
                  onClick={() => setCurrentView(currentView === 'admin' ? 'public' : 'admin')}
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-750 hover:text-white border border-slate-700 hover:border-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Masuk Admin</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button - 44px tap target (R-03) */}
          <div className="flex items-center gap-2 lg:hidden">
            {!isAdminLoggedIn ? (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="p-2.5 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                aria-label="Masuk ke Panel Admin"
              >
                <Lock className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentView(currentView === 'admin' ? 'public' : 'admin')}
                className="px-2.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs"
              >
                {currentView === 'admin' ? 'Web' : 'Admin'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-expanded={mobileMenuOpen}
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-xl px-4 pt-3 pb-6 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 pt-2">
              {navLinks.map((link) => {
                const isActive = activeNav === link.id && currentView === 'public';
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className={`min-h-[44px] flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors ${
                      isActive
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowRight className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                  </button>
                );
              })}

              <div className="pt-3 mt-2 border-t border-slate-800 flex flex-col gap-2">
                {isAdminLoggedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView(currentView === 'admin' ? 'public' : 'admin');
                        setMobileMenuOpen(false);
                      }}
                      className="min-h-[44px] flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-sm"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {currentView === 'admin' ? 'Buka Tampilan Publik' : 'Buka Dashboard Admin'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logoutAdmin();
                        setMobileMenuOpen(false);
                      }}
                      className="min-h-[44px] w-full py-2 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/20"
                    >
                      Keluar dari Akun Admin
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenLoginModal();
                    }}
                    className="min-h-[44px] flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold text-sm"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Masuk ke Panel Pengurus</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
