import React from 'react';
import { MapPin, Mail, Phone, Clock, ArrowUpRight, Lock } from 'lucide-react';
import { TENTANG_DATA } from '../../data/initialData';
import { useData } from '../../context/DataContext';
import { Logo } from './Logo';

interface FooterProps {
  onOpenLoginModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLoginModal }) => {
  const { setCurrentView, isAdminLoggedIn } = useData();

  const handleScrollTo = (id: string) => {
    setCurrentView('public');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          {/* Kolom 1: Profil Organisasi (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <Logo variant="white" className="h-9 sm:h-10 w-auto" />
              <p className="text-xs text-amber-400 font-semibold tracking-wide">
                Aditya Karya Mahatva Yodha
              </p>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed pr-4">
              Wadah pembinaan dan pengabdian generasi muda dalam gotong royong sosial, olahraga, pendidikan, seni budaya, keagamaan, serta kemandirian ekonomi warga Margabakti 07.
            </p>

            <div className="pt-2 flex items-start gap-2.5 text-xs text-slate-400">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{TENTANG_DATA.kontak.jadwalKumpul}</span>
            </div>
          </div>

          {/* Kolom 2: Navigasi Lintas Bagian (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Jelajahi Portal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('tentang')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded"
                >
                  <span>Profil & Visi Misi</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('tim')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded"
                >
                  <span>Susunan Pengurus</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('galeri')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded"
                >
                  <span>Dokumentasi Kegiatan</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('berita')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded"
                >
                  <span>Warta & Berita Warga</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleScrollTo('aspirasi')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded"
                >
                  <span>Kirim Aspirasi Pemuda</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Kontak Sekretariat (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Sekretariat & Hubungan Warga
            </h3>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{TENTANG_DATA.kontak.alamat}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{TENTANG_DATA.kontak.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{TENTANG_DATA.kontak.whatsapp} (WhatsApp Resmi)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setCurrentView('admin');
                  } else {
                    onOpenLoginModal();
                  }
                }}
                className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-850 hover:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isAdminLoggedIn ? 'Buka Dashboard Pengurus' : 'Login Panel Pengurus'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Baris Bawah */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; 2026 Karang Taruna Margabakti 07. Seluruh hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Semangat Aditya Karya Mahatva Yodha</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Sistem Aktif" />
          </div>
        </div>
      </div>
    </footer>
  );
};
