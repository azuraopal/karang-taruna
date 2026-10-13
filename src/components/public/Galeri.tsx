import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Camera, Calendar, MapPin, ArrowRight, SearchX, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { ItemGaleri } from '../../types';
import { Modal } from '../common/Modal';
import { PublicCollectionFilters } from '../common/PublicCollectionFilters';
import { ScribbleTitle } from '../common/ScribbleTitle';
import { Section3DShowcase } from '../common/Section3DShowcase';
const getGalleryImages = (item: ItemGaleri) => [...new Set([item.gambarUrl, ...(item.gambarUrls || [])].filter(Boolean))];

export const Galeri: React.FC = () => {
  const { galeriList } = useData();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [activePhoto, setActivePhoto] = useState<ItemGaleri | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const kategoriList = ['Semua', ...new Set([...['Kegiatan Sosial', 'Olahraga', 'Pentas Seni', 'Lingkungan', 'Pelatihan'], ...galeriList.map((item) => item.kategori)])];
  const categoryCounts = Object.fromEntries(kategoriList.map((category) => [category, category === 'Semua' ? galeriList.length : galeriList.filter((item) => item.kategori === category).length]));
  const filteredGaleri = galeriList.filter((item) =>
    (selectedKategori === 'Semua' || item.kategori === selectedKategori) &&
    `${item.judul} ${item.deskripsi} ${item.lokasi}`.toLocaleLowerCase('id').includes(query.trim().toLocaleLowerCase('id')),
  );
  const openPhoto = (item: ItemGaleri) => {
    setActivePhoto(item);
    setPhotoZoom(1);
    setActivePhotoIndex(0);
  };
  const changePhoto = (direction: number) => {
    if (!activePhoto) return;
    setActivePhotoIndex((index) => (index + direction + getGalleryImages(activePhoto).length) % getGalleryImages(activePhoto).length);
    setPhotoZoom(1);
  };

  return (
    <section id="galeri" className="relative py-18 sm:py-24 liquid-section border-t border-stone-200 overflow-hidden">
      <div className="soft-grid absolute inset-0 opacity-35" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bagian */}
        <div className="collection-heading relative grid grid-cols-1 items-center gap-5 lg:grid-cols-12">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="public-section-heading mx-auto max-w-3xl space-y-4 text-center lg:col-span-7 lg:mx-0 lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold tracking-wide uppercase">
              <Camera className="w-3.5 h-3.5 text-amber-700" />
              <span>Dokumentasi Warga</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              <ScribbleTitle>Foto kegiatan warga</ScribbleTitle>
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-subtitle">
              Lihat dokumentasi kegiatan kami. Pilih album untuk membuka foto, tanggal, dan lokasi kegiatan.
            </p>
          </motion.div>
          <div className="lg:col-span-5">
            <Section3DShowcase kind="galeri" />
          </div>
        </div>

        <PublicCollectionFilters label="Kategori kegiatan" options={kategoriList} counts={categoryCounts} selected={selectedKategori} onSelect={setSelectedKategori}
          searchLabel="Cari kegiatan atau lokasi" query={query} onSearch={setQuery} resultText={`${filteredGaleri.length} album kegiatan ditemukan`} />

        {/* Grid Foto */}
        {filteredGaleri.length > 0 ? (
          <div className="gallery-grid relative mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGaleri.map((item) => (
              <article key={item.id} className="gallery-card liquid-surface relative flex min-w-0 flex-col p-2">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
                  {item.gambarUrl ? <img src={item.gambarUrl} alt={item.judul} className="h-full w-full object-cover" loading="lazy" decoding="async" /> : <Camera className="mx-auto h-full w-12 text-slate-400" aria-hidden="true" />}
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/85 px-3 py-1.5 text-xs font-semibold text-white">
                    <Images size={14} aria-hidden="true" />{getGalleryImages(item).length} foto
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
                  <span className="text-xs font-semibold text-amber-800">{item.kategori}</span>
                  <h3 className="text-lg font-bold leading-snug text-slate-900 wrap-anywhere">{item.judul}</h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{item.deskripsi}</p>
                  <div className="mt-auto space-y-2 border-t border-slate-200/70 pt-3 text-sm text-slate-600">
                    <p className="flex items-start gap-2"><Calendar size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" /><span>{item.tanggal}</span></p>
                    {item.lokasi && <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" /><span className="wrap-anywhere">{item.lokasi}</span></p>}
                  </div>
                  <button type="button" onClick={() => openPhoto(item)} aria-label={`Lihat foto: ${item.judul}`}
                    className="gallery-open flex min-h-12 w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                    <span>Lihat foto kegiatan</span><ArrowRight size={17} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Empty State (R-27) */
          <div className="liquid-surface mt-12 p-12 text-center bg-white rounded-2xl border border-stone-200 max-w-md mx-auto">
            <SearchX className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Belum ada foto yang cocok
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Coba kata kunci lain atau tampilkan semua kegiatan.
            </p>
            <button
              type="button"
              onClick={() => { setSelectedKategori('Semua'); setQuery(''); }}
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
          maxWidth="2xl"
        >
          {activePhoto && (
            <div className="space-y-4">
              <div className="relative rounded-2xl bg-slate-100">
                <div className="max-h-[55dvh] overflow-auto rounded-2xl" tabIndex={photoZoom > 1 ? 0 : undefined} aria-label={photoZoom > 1 ? 'Foto diperbesar, geser untuk melihat bagian lainnya' : undefined}>
                  <img src={getGalleryImages(activePhoto)[activePhotoIndex]} alt={`${activePhoto.judul} - foto ${activePhotoIndex + 1}`}
                    className="block h-auto max-w-none" style={{ width: `${photoZoom * 100}%` }} />
                </div>
              </div>
              {getGalleryImages(activePhoto).length > 1 && <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => changePhoto(-1)} className="liquid-control flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm" aria-label="Foto sebelumnya"><ChevronLeft size={18} /><span>Sebelumnya</span></button>
                <span role="status" className="text-sm font-semibold text-slate-700">{activePhotoIndex + 1} / {getGalleryImages(activePhoto).length}</span>
                <button type="button" onClick={() => changePhoto(1)} className="liquid-control flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm" aria-label="Foto berikutnya"><span>Berikutnya</span><ChevronRight size={18} /></button>
              </div>}

              {getGalleryImages(activePhoto).length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                  {getGalleryImages(activePhoto).map((imageUrl, index) => (
                    <button
                      key={imageUrl + index}
                      type="button"
                      onClick={() => {
                        setActivePhotoIndex(index);
                        setPhotoZoom(1);
                      }}
                      className={`relative shrink-0 snap-start w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${activePhotoIndex === index ? 'border-amber-500 ring-2 ring-amber-200' : 'border-transparent opacity-65 hover:opacity-100'}`}
                      aria-label={`Tampilkan foto ${index + 1}`}
                      aria-pressed={activePhotoIndex === index}
                    >
                      <img
                        src={imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        loading={index === activePhotoIndex ? 'eager' : 'lazy'}
                        decoding="async"
                        onError={(event) => {
                          event.currentTarget.style.visibility = 'hidden';
                        }}
                      />
                    </button>
                  ))}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 px-1 shrink-0">
                    <Images className="w-3.5 h-3.5" />
                    Galeri kegiatan
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoZoom((zoom) => Math.max(1, Number((zoom - 0.25).toFixed(2))))}
                  disabled={photoZoom <= 1}
                  className="min-h-11 min-w-11 inline-flex items-center justify-center p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Perkecil foto"
                  title="Perkecil foto"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoZoom(1)}
                  className="min-h-11 min-w-11 inline-flex items-center justify-center p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200"
                  aria-label="Reset ukuran foto"
                  title="Reset ukuran foto"
                >
                  <RotateCcw className="w-4 h-4" /><span className="ml-2 text-sm">{Math.round(photoZoom * 100)}%</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoZoom((zoom) => Math.min(3, Number((zoom + 0.25).toFixed(2))))}
                  disabled={photoZoom >= 3}
                  className="min-h-11 min-w-11 inline-flex items-center justify-center p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
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

                <p className="text-sm text-slate-700 leading-relaxed mt-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
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
