import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mail, Phone, UserCheck, SearchX, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { AnggotaTim } from '../../types';
import { Modal } from '../common/Modal';

export const Tim: React.FC = () => {
  const { timList } = useData();
  const [selectedDivisi, setSelectedDivisi] = useState<string>('Semua');
  const [selectedMember, setSelectedMember] = useState<AnggotaTim | null>(null);
  const [activePhotoMember, setActivePhotoMember] = useState<AnggotaTim | null>(null);
  const [memberPhotoZoom, setMemberPhotoZoom] = useState(1);
  const [visibleMemberCount, setVisibleMemberCount] = useState(10);

  const divisiList: string[] = [
    'Semua',
    'Pengurus Harian',
    'PSDM',
    'Kreativitas dan Humas',
    'Sosial & Kegiatan',
    'Olahraga dan Kesehatan',
    'Pendidikan & Seni Budaya',
    'Kerohanian',
    'Ekonomi & Kewirausahaan',
  ];

  const filteredMembers = selectedDivisi === 'Semua'
    ? [...timList].sort((firstMember, secondMember) => {
        const firstHasPhoto = Boolean(firstMember.fotoUrl && !firstMember.fotoUrl.includes('default-avatar.svg'));
        const secondHasPhoto = Boolean(secondMember.fotoUrl && !secondMember.fotoUrl.includes('default-avatar.svg'));
        return Number(secondHasPhoto) - Number(firstHasPhoto);
      })
    : timList.filter((m) => m.divisi === selectedDivisi);
  const displayedMembers = selectedDivisi === 'Semua'
    ? filteredMembers.slice(0, visibleMemberCount)
    : filteredMembers;

  useEffect(() => {
    setVisibleMemberCount(10);
  }, [selectedDivisi]);

  return (
    <section id="tim" className="py-24 bg-white border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bagian */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold tracking-wide uppercase">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>Struktur Organisasi</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Susunan Pengurus Karang Taruna
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-subtitle">
            Digerakkan oleh pemuda-pemudi berdedikasi yang siap mengabdi dan mendampingi kemajuan warga Margabakti 07.
          </p>
        </div>

        {/* Filter Divisi */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {divisiList.map((divisi) => {
            const isActive = selectedDivisi === divisi;
            return (
              <button
                key={divisi}
                onClick={() => setSelectedDivisi(divisi)}
                className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  isActive
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'bg-stone-100 hover:bg-stone-200 text-slate-700'
                }`}
              >
                {divisi}
              </button>
            );
          })}
        </div>

        {/* Grid Pengurus */}
        {filteredMembers.length > 0 ? (
          <motion.div
            layout
            className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            <AnimatePresence>
              {displayedMembers.map((member) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.45, delay: Math.min(displayedMembers.indexOf(member) * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6 }}
                  key={member.id}
                  className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden hover:border-amber-400 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Foto Pengurus */}
                    <button
                      type="button"
                      onClick={() => {
                        setActivePhotoMember(member);
                        setMemberPhotoZoom(1);
                      }}
                      className="relative block w-full h-64 bg-slate-100 overflow-hidden flex items-center justify-center cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-400"
                      aria-label={`Lihat foto ${member.nama}`}
                    >
                      <img
                        src={member.fotoUrl || '/default-avatar.svg'}
                        alt={`Foto ${member.nama}`}
                        onError={(e) => {
                          e.currentTarget.src = '/default-avatar.svg';
                        }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-900/90 text-amber-400 backdrop-blur-xs">
                          {member.divisi}
                        </span>
                      </div>
                    </button>

                    {/* Informasi Pengurus */}
                    <div className="p-5 space-y-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {member.nama}
                      </h3>
                      <p className="text-xs font-semibold text-amber-700">
                        {member.jabatan}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-1">
                        {member.bio}
                      </p>
                    </div>
                  </div>

                  {/* Tombol Detail / Kontak */}
                  <div className="p-5 pt-0">
                    <button
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className="min-h-[44px] w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-900 text-slate-800 hover:text-amber-400 border border-stone-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Lihat Profil Lengkap</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Empty State (R-27) */
          <div className="mt-12 p-12 text-center bg-stone-50 rounded-2xl border border-stone-200 max-w-md mx-auto">
            <SearchX className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Belum Ada Pengurus di Divisi Ini
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Silakan pilih kategori divisi lainnya atau tambahkan pengurus melalui Panel Admin.
            </p>
            <button
              type="button"
              onClick={() => setSelectedDivisi('Semua')}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold hover:bg-slate-800"
            >
              Tampilkan Semua Pengurus
            </button>
          </div>
        )}

        {selectedDivisi === 'Semua' && visibleMemberCount < filteredMembers.length && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleMemberCount((count) => count + 10)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 text-amber-400 hover:bg-slate-800 font-bold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              Lihat Data Lainnya
            </button>
          </div>
        )}

        {/* Modal Profil Pengurus */}
        <Modal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title="Profil Pengurus Karang Taruna"
          maxWidth="md"
        >
          {selectedMember && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <img
                  src={selectedMember.fotoUrl || '/default-avatar.svg'}
                  alt={selectedMember.nama}
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.svg';
                  }}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shrink-0 bg-slate-100"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedMember.nama}
                  </h3>
                  <p className="text-xs font-bold text-amber-700">
                    {selectedMember.jabatan}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                    {selectedMember.divisi}
                  </span>
                </div>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">
                  Uraian Peran & Tanggung Jawab:
                </span>
                {selectedMember.bio}
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                {selectedMember.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                    <a
                      href={`mailto:${selectedMember.email}`}
                      className="hover:text-amber-700 hover:underline transition-colors"
                    >
                      {selectedMember.email}
                    </a>
                  </div>
                )}
                {selectedMember.noHp && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                    <a
                      href={`https://wa.me/${selectedMember.noHp.replace(/\D/g, '').replace(/^0/, '62')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-amber-700 hover:underline transition-colors"
                    >
                      {selectedMember.noHp}
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Lightbox Foto Pengurus */}
        <Modal
          isOpen={!!activePhotoMember}
          onClose={() => setActivePhotoMember(null)}
          title={activePhotoMember ? `Foto ${activePhotoMember.nama}` : 'Foto Pengurus'}
          maxWidth="lg"
        >
          {activePhotoMember && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden flex items-center justify-center">
                <img
                  src={activePhotoMember.fotoUrl || '/default-avatar.svg'}
                  alt={`Foto ${activePhotoMember.nama}`}
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.svg';
                  }}
                  className="block w-auto max-w-full max-h-[70vh] object-contain transition-transform duration-300"
                  style={{ transform: `scale(${memberPhotoZoom})` }}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <button type="button" onClick={() => setMemberPhotoZoom((zoom) => Math.max(1, Number((zoom - 0.25).toFixed(2))))} disabled={memberPhotoZoom <= 1} className="p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Perkecil foto" title="Perkecil foto">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setMemberPhotoZoom(1)} className="p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200" aria-label="Reset ukuran foto" title="Reset ukuran foto">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setMemberPhotoZoom((zoom) => Math.min(3, Number((zoom + 0.25).toFixed(2))))} disabled={memberPhotoZoom >= 3} className="p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Perbesar foto" title="Perbesar foto">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">{activePhotoMember.nama}</p>
                  <p className="text-xs text-amber-700 mt-0.5">{activePhotoMember.jabatan}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePhotoMember(null)}
                  className="shrink-0 px-4 py-2 bg-slate-900 text-amber-400 rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </section>
  );
};
