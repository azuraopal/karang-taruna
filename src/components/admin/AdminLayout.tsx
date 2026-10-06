import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Newspaper, Users, Camera, MessageSquare,
  ArrowLeft, LogOut, Menu, X, UserCog, Crown, User, ShieldCheck, ClipboardList
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Logo } from '../common/Logo';
import { AdminDashboard } from './AdminDashboard';
import { AdminBerita } from './AdminBerita';
import { AdminTim } from './AdminTim';
import { AdminGaleri } from './AdminGaleri';
import { AdminAspirasi } from './AdminAspirasi';
import { AdminUsers } from './AdminUsers';
import { AdminLogs } from './AdminLogs';
import { getAdminRoute, getAllowedAdminTab, getDashboardPath, navigateTo, type AdminTab } from '../../utils/appRoute';

export const AdminLayout: React.FC = () => {
  const {
    setCurrentView,
    logoutAdmin,
    beritaList,
    timList,
    galeriList,
    aspirasiList,
    userList,
    currentUser,
  } = useData();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Lock body scroll when mobile drawer is open so background never slips away
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const roleLabel = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Administrator' : 'Pengurus';
  const aspirasiBaru = aspirasiList.filter((a) => a.status === 'baru').length;

  const handleOpenPublicWebsite = () => {
    setCurrentView('public');
    navigateTo('/');
  };

  useEffect(() => {
    const syncTabWithRoute = () => {
      const route = getAdminRoute();
      const requestedTab = route?.tab || 'dashboard';
      const role = currentUser?.role || 'pengurus';
      setActiveTab(getAllowedAdminTab(role, requestedTab));
    };

    syncTabWithRoute();
    window.addEventListener('popstate', syncTabWithRoute);
    return () => window.removeEventListener('popstate', syncTabWithRoute);
  }, [currentUser?.role]);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Ringkasan',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'berita',
      label: 'Kelola Berita',
      icon: <Newspaper className="w-4 h-4" />,
      badge: beritaList.length,
    },
    {
      id: 'tim',
      label: 'Kelola Tim Pengurus',
      icon: <Users className="w-4 h-4" />,
      badge: timList.length,
    },
    {
      id: 'galeri',
      label: 'Kelola Galeri Foto',
      icon: <Camera className="w-4 h-4" />,
      badge: galeriList.length,
    },
    {
      id: 'aspirasi',
      label: 'Kotak Aspirasi Warga',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: aspirasiBaru > 0 ? `${aspirasiBaru} baru` : undefined,
      badgeColor: aspirasiBaru > 0 ? 'bg-rose-500 text-white' : undefined,
    },
    // Khusus Role Admin: Tab Kelola Akun Pengguna
    ...(isAdmin
      ? [
          {
            id: 'users',
            label: 'Kelola Akun Pengguna',
            icon: <UserCog className="w-4 h-4" />,
            badge: userList.length,
            badgeColor: 'bg-amber-400 text-slate-950',
          },
          {
            id: 'logs',
            label: 'Log Aktivitas',
            icon: <ClipboardList className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  const handleSelectTab = (tabId: string) => {
    const role = currentUser?.role || 'pengurus';
    const nextTab = getAllowedAdminTab(role, tabId as AdminTab);
    setActiveTab(nextTab);
    navigateTo(getDashboardPath(role, nextTab));
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Top Navbar Admin */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white"
              aria-label="Buka menu navigasi admin"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <Logo variant="white" className="h-7 sm:h-8 w-auto" />
              <div className="hidden sm:block pl-2.5 border-l border-slate-700">
                <span className="text-[11px] font-bold text-amber-400 block leading-tight">
                  Panel {roleLabel}
                </span>
                <p className="text-[10px] text-slate-400 font-medium font-subtitle">
                  Muda Berkarya, Nyata Berdaya
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* User Profile Badge */}
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  isAdmin ? 'bg-amber-400 text-slate-950' : 'bg-sky-500 text-white'
                }`}
              >
                {isAdmin ? <Crown className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-200 leading-tight max-w-[120px] truncate">
                  {currentUser?.namaLengkap || (isAdmin ? 'Administrator' : 'Pengurus')}
                </div>
                <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                  {roleLabel}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenPublicWebsite}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Web Publik</span>
              <span className="sm:hidden">Web</span>
            </button>

            <button
              type="button"
              onClick={logoutAdmin}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-800/40 focus:outline-none focus:ring-2 focus:ring-rose-400"
              title="Keluar dari sesi admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col lg:flex-row gap-8 items-start">
        {/* Mobile Floating Slide-over Glass Drawer (Fixed to viewport - ALWAYS FLOATS with user!) */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 pointer-events-auto"
                aria-hidden="true"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-900/98 backdrop-blur-2xl border-r border-slate-800 z-50 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <Logo variant="white" className="h-7 w-auto" />
                      <div>
                        <span className="text-[11px] font-bold text-amber-400 block leading-tight">
                          Panel {roleLabel}
                        </span>
                        <p className="text-[10px] text-slate-400 font-subtitle">
                          Margabakti 07
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileSidebarOpen(false)}
                      className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                      aria-label="Tutup menu navigasi"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {navItems.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`min-h-[44px] w-full px-3.5 py-2.5 rounded-xl text-xs font-bold grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 text-left transition-all ${
                            isActive
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="shrink-0">{item.icon}</span>
                            <span className="min-w-0 leading-snug">{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span
                              className={`shrink-0 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.badgeColor || (isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300')
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Role Status Card in Drawer */}
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-200 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Hak Akses: {roleLabel}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-subtitle">
                      {currentUser?.namaLengkap || 'Pengurus Aktif'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      handleOpenPublicWebsite();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Web Publik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      logoutAdmin();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 border border-rose-800/40"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar (Only visible on lg screens) */}
        <aside className="hidden lg:block lg:w-64 shrink-0 sticky top-20">
          <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-2xs space-y-1">
            <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Menu Pengurus
            </div>

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`min-h-[44px] w-full px-3.5 py-2.5 rounded-xl text-xs font-bold grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 text-left transition-all ${
                    isActive
                      ? 'bg-slate-900 text-amber-400 shadow-sm'
                      : 'text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="min-w-0 leading-snug">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`shrink-0 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor || (isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-stone-200 text-slate-700')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Role Status Card Desktop */}
          <div className="mt-4 p-4 rounded-2xl bg-white border border-stone-200 text-xs shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Hak Akses Anda:</span>
            </div>
            <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed font-medium ${
              isAdmin ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-sky-50 text-sky-900 border border-sky-200'
            }`}>
              {isAdmin ? (
                <>
                <strong className="block mb-0.5">Role: {isSuperAdmin ? 'Super Admin' : 'Administrator'}</strong>
                {isSuperAdmin ? (
                  <>Anda memiliki akses penuh termasuk <strong>mengatur semua akun pengguna</strong>.</>
                ) : (
                  <>Anda dapat mengelola konten, tetapi <strong>tidak dapat mengubah akun pengguna lain</strong>.</>
                )}
                </>
              ) : (
                <>
                  <strong className="block mb-0.5">Role: Pengurus</strong>
                  Anda dapat mengelola berita, tim, galeri, dan aspirasi. <strong>Menu kelola user dibatasi</strong>.
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 w-full min-w-0">
          {activeTab === 'dashboard' && (
            <AdminDashboard
              onNavigateTab={(tab) => handleSelectTab(tab)}
              onOpenCreateBerita={() => handleSelectTab('berita')}
              onOpenCreateTim={() => handleSelectTab('tim')}
              onOpenCreateGaleri={() => handleSelectTab('galeri')}
            />
          )}

          {activeTab === 'berita' && <AdminBerita />}

          {activeTab === 'tim' && <AdminTim />}

          {activeTab === 'galeri' && <AdminGaleri />}

          {activeTab === 'aspirasi' && <AdminAspirasi />}

          {/* Tab Users: Hanya Admin yang dapat melihat */}
          {activeTab === 'users' && (
            isAdmin ? (
              <AdminUsers />
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-stone-200">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                  <UserCog className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Akses Dibatasi</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Hanya akun dengan peran Administrator yang memiliki izin untuk mengelola akun pengguna.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="mt-4 px-4 py-2 bg-slate-900 text-amber-400 rounded-xl text-xs font-bold"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            )
          )}

          {activeTab === 'logs' && isAdmin && <AdminLogs />}
        </main>
      </div>

    </div>
  );
};
