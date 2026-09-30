import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Calendar, User, Search, ArrowRight, SearchX, BookOpen } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { Berita } from '../../types';
import { Modal } from '../common/Modal';

export const BeritaSection: React.FC = () => {
  const { beritaList } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [readingArticle, setReadingArticle] = useState<Berita | null>(null);

  const kategoriList = [
    'Semua',
    'Program Kerja',
    'Sosial & Warga',
    'Olahraga',
    'Pendidikan',
    'Pengumuman',
  ];

  const filteredBerita = beritaList.filter((b) => {
    // Only show published articles in public view
    if (b.status !== 'published') return false;

    const matchesCat =
      selectedKategori === 'Semua' || b.kategori === selectedKategori;
    const matchesSearch =
      b.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.ringkasan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isi.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  return (
    <section id="berita" className="py-24 bg-white border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bagian */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold tracking-wide uppercase">
            <Newspaper className="w-3.5 h-3.5 text-amber-600" />
            <span>Kabar & Informasi Terkini</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Warta Kegiatan & Pengumuman
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-subtitle">
            Ikuti laporan pelaksanaan program kerja, pengumuman agenda rapat, turnamen, dan aksi sosial kemasyarakatan.
          </p>
        </div>

        {/* Baris Pencarian & Filter */}
        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul berita / kegiatan..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
            />
          </div>

          {/* Filter Kategori */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {kategoriList.map((kat) => {
              const isActive = selectedKategori === kat;
              return (
                <button
                  key={kat}
                  onClick={() => setSelectedKategori(kat)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    isActive
                      ? 'bg-slate-900 text-amber-400 shadow-sm'
                      : 'bg-stone-100 hover:bg-stone-200 text-slate-700'
                  }`}
                >
                  {kat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Kartu Berita */}
        {filteredBerita.length > 0 ? (
          <motion.div
            layout
            className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
          >
            <AnimatePresence>
              {filteredBerita.map((item) => (
                <motion.article
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  key={item.id}
                  className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden hover:border-amber-400 transition-all flex flex-col justify-between group shadow-2xs hover:shadow-md"
                >
                  <div>
                    {/* Gambar Artikel */}
                    <div className="relative h-52 bg-slate-200 overflow-hidden">
                      <img
                        src={item.gambarUrl}
                        alt={item.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-900/90 text-amber-400 backdrop-blur-xs">
                          {item.kategori}
                        </span>
                      </div>
                    </div>

                    {/* Konten Artikel */}
                    <div className="p-6 space-y-2.5">
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          {item.tanggal}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {item.penulis}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug">
                        {item.judul}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.ringkasan}
                      </p>
                    </div>
                  </div>

                  {/* Tombol Baca */}
                  <div className="p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => setReadingArticle(item)}
                      className="min-h-[44px] w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-900 text-slate-800 hover:text-amber-400 border border-stone-300 font-bold text-xs transition-colors flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Baca Warta Lengkap</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Empty State (R-27) */
          <div className="mt-12 p-12 text-center bg-stone-50 rounded-2xl border border-stone-200 max-w-md mx-auto">
            <SearchX className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Tidak Ada Warta yang Cocok
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? `Kata kunci "${searchQuery}" tidak ditemukan pada kategori ${selectedKategori}.`
                : 'Belum ada warta berita pada kategori ini.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedKategori('Semua');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold hover:bg-slate-800"
            >
              Reset Pencarian
            </button>
          </div>
        )}

        {/* Modal Baca Artikel Lengkap */}
        <Modal
          isOpen={!!readingArticle}
          onClose={() => setReadingArticle(null)}
          title="Warta Resmi Karang Taruna"
          maxWidth="2xl"
        >
          {readingArticle && (
            <div className="space-y-5">
              <div className="rounded-2xl overflow-hidden bg-slate-200 h-64 sm:h-72">
                <img
                  src={readingArticle.gambarUrl}
                  alt={readingArticle.judul}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-2">
                  <span className="px-2.5 py-0.5 rounded font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    {readingArticle.kategori}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {readingArticle.tanggal}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Ditulis oleh: {readingArticle.penulis}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {readingArticle.judul}
                </h3>
              </div>

              {/* Ringkasan Box */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs sm:text-sm font-medium text-amber-950 leading-relaxed italic">
                "{readingArticle.ringkasan}"
              </div>

              {/* Isi Lengkap */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line border-t border-stone-100 pt-4">
                {readingArticle.isi}
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setReadingArticle(null)}
                  className="px-5 py-2.5 bg-slate-900 text-amber-400 rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  Selesai Membaca
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </section>
  );
};
