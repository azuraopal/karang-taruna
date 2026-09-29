import React, { useState } from 'react';
import { LayoutDashboard, Newspaper, Users, Camera, MessageSquare, RotateCcw, ArrowLeft, LogOut, Menu, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Logo } from '../common/Logo';
import { AdminDashboard } from './AdminDashboard';
import { AdminBerita } from './AdminBerita';
import { AdminTim } from './AdminTim';
import { AdminGaleri } from './AdminGaleri';
import { AdminAspirasi } from './AdminAspirasi';
import { Modal } from '../common/Modal';

export const AdminLayout: React.FC = () => {
  const { setCurrentView, logoutAdmin, beritaList, timList, galeriList, aspirasiList, resetAllData } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const aspirasiBaru = aspirasiList.filter((a) => a.status === 'baru').length;

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
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
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
                  PANEL PENGURUS
                </span>
                <p className="text-[10px] text-slate-400 font-medium">

                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentView('public')}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kembali ke Web Publik</span>
              <span className="sm:hidden">Web</span>
            </button>

            <button
              type="button"
              onClick={logoutAdmin}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-800/40 focus:outline-none focus:ring-2 focus:ring-rose-400"
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
        {/* Sidebar Nav (Desktop & Mobile Drawer) */}
        <aside
          className={`lg:w-64 w-full shrink-0 ${
            mobileSidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
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
                  className={`min-h-[44px] w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-slate-900 text-amber-400 shadow-sm'
                      : 'text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor || (isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-stone-200 text-slate-700')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3 mt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="min-h-[44px] w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Reset Data Awal</span>
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-950 space-y-1">
            <span className="font-bold block">Penyimpanan Otomatis:</span>
            <p className="text-amber-900 leading-relaxed">
              Setiap perubahan berita, pengurus, atau galeri langsung tersimpan di peramban Anda dan terhubung langsung ke tampilan publik.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 w-full min-w-0">
          {activeTab === 'dashboard' && (
            <AdminDashboard
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenCreateBerita={() => setActiveTab('berita')}
              onOpenCreateTim={() => setActiveTab('tim')}
              onOpenCreateGaleri={() => setActiveTab('galeri')}
            />
          )}

          {activeTab === 'berita' && <AdminBerita />}

          {activeTab === 'tim' && <AdminTim />}

          {activeTab === 'galeri' && <AdminGaleri />}

          {activeTab === 'aspirasi' && <AdminAspirasi />}
        </main>
      </div>

      {/* Modal Konfirmasi Reset Data */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Konfirmasi Reset Data Default"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin mengembalikan seluruh data berita, pengurus tim, foto galeri, dan aspirasi kembali ke pengaturan awal (mockup data awal)?
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                resetAllData();
                setIsResetConfirmOpen(false);
              }}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-sm"
            >
              Ya, Reset Data
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
