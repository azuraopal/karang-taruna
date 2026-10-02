import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Calendar, MapPin, Eye, SearchX, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { ItemGaleri } from '../../types';
import { Modal } from '../common/Modal';

export const Galeri: React.FC = () => {
  const { galeriList } = useData();
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [activePhoto, setActivePhoto] = useState<ItemGaleri | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);

  const kategoriList = [
    'Semua',
    'Kegiatan Sosial',
    'Olahraga',
    'Pentas Seni',
    'Lingkungan',
    'Pelatihan',
  ];

  const filteredGaleri =
    selectedKategori === 'Semua'
      ? galeriList
      : galeriList.filter((g) => g.kategori === selectedKategori);

  return (
    <section id="galeri" className="py-24 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bagian */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold tracking-wide uppercase">
            <Camera className="w-3.5 h-3.5 text-amber-700" />
            <span>Dokumentasi Warga</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Galeri Kegiatan Pemuda
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-subtitle">
            Rekam jejak kebersamaan, aksi sosial, kompetisi olahraga, serta festival kebudayaan yang diselenggarakan bersama masyarakat.
          </p>
        </div>

        {/* Filter Kategori */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {kategoriList.map((kat) => {
            const isActive = selectedKategori === kat;
            return (
              <button
                key={kat}
                onClick={() => setSelectedKategori(kat)}
                className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  isActive
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'bg-white hover:bg-stone-200 text-slate-700 border border-stone-200'
                }`}
              >
                {kat}
              </button>
            );
          })}
        </div>

        {/* Grid Foto */}
        {filteredGaleri.length > 0 ? (
          <motion.div
            layout
            className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredGaleri.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.45, delay: Math.min(filteredGaleri.indexOf(item) * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6 }}
                  key={item.id}
                  onClick={() => {
                    setActivePhoto(item);
                    setPhotoZoom(1);
                  }}
                  className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActivePhoto(item);
                    }
                  }}
                  aria-label={`Buka foto ${item.judul}`}
                >
                  <div className="relative h-60 bg-slate-100 overflow-hidden">
                    <img
                      src={item.gambarUrl}
                      alt={item.judul}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white p-2.5 rounded-full backdrop-blur-xs">
                        <Eye className="w-5 h-5" />
                      </span>
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-900/90 text-amber-400 backdrop-blur-xs">
                        {item.kategori}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                      {item.judul}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.deskripsi}
                    </p>
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        {item.tanggal}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        {item.lokasi}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Empty State (R-27) */
          <div className="mt-12 p-12 text-center bg-white rounded-2xl border border-stone-200 max-w-md mx-auto">
            <SearchX className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Belum Ada Dokumentasi di Kategori Ini
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pilih kategori lain atau tambahkan dokumentasi foto baru lewat Panel Admin.
            </p>
            <button
              type="button"
              onClick={() => setSelectedKategori('Semua')}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold hover:bg-slate-800"
            >
              Tampilkan Semua Foto
            </button>
          </div>
        )}

        {/* Lightbox / Modal Detail Foto */}
        <Modal
          isOpen={!!activePhoto}
          onClose={() => setActivePhoto(null)}
          title="Detail Dokumentasi Kegiatan"
          maxWidth="xl"
        >
          {activePhoto && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden flex items-center justify-center">
                <img
                  src={activePhoto.gambarUrl}
                  alt={activePhoto.judul}
                  className="block w-auto max-w-full max-h-[70vh] object-contain transition-transform duration-300"
                  style={{ transform: `scale(${photoZoom})` }}
                />
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoZoom((zoom) => Math.max(1, Number((zoom - 0.25).toFixed(2))))}
                  disabled={photoZoom <= 1}
                  className="p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Perkecil foto"
                  title="Perkecil foto"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoZoom(1)}
                  className="p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200"
                  aria-label="Reset ukuran foto"
                  title="Reset ukuran foto"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoZoom((zoom) => Math.min(3, Number((zoom + 0.25).toFixed(2))))}
                  disabled={photoZoom >= 3}
                  className="p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Perbesar foto"
                  title="Perbesar foto"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    {activePhoto.kategori}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {activePhoto.tanggal}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {activePhoto.lokasi}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {activePhoto.judul}
                </h3>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
                  {activePhoto.deskripsi}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActivePhoto(null)}
                  className="px-5 py-2.5 bg-slate-900 text-amber-400 rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  Tutup Tampilan
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </section>
  );
};
