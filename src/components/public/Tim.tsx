import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Users, Mail, Phone, ArrowUpRight, SearchX, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { AnggotaTim } from '../../types';
import { PublicCollectionFilters } from '../common/PublicCollectionFilters';
import { Modal } from '../common/Modal';
import { ScribbleTitle } from '../common/ScribbleTitle';
import { Section3DShowcase } from '../common/Section3DShowcase';

export const Tim: React.FC = () => {
  const { timList } = useData();
  const shouldReduceMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [selectedDivisi, setSelectedDivisi] = useState<string>('Semua');
  const [selectedMember, setSelectedMember] = useState<AnggotaTim | null>(null);
  const [activePhotoMember, setActivePhotoMember] = useState<AnggotaTim | null>(null);
  const [memberPhotoZoom, setMemberPhotoZoom] = useState(1);
  const [visibleMemberCount, setVisibleMemberCount] = useState(10);

  const divisiList = ['Semua', ...new Set([...['Pengurus Harian', 'PSDM', 'Kreativitas dan Humas', 'Sosial & Kegiatan', 'Olahraga dan Kesehatan', 'Pendidikan & Seni Budaya', 'Kerohanian', 'Ekonomi & Kewirausahaan'], ...timList.map((item) => item.divisi)])];
  const categoryCounts = Object.fromEntries(divisiList.map((category) => [category, category === 'Semua' ? timList.length : timList.filter((item) => item.divisi === category).length]));

  const getPositionPriority = (jabatan: string): number => {
    const normalizedPosition = jabatan.toLowerCase();
    if (normalizedPosition.includes('ketua') && !normalizedPosition.includes('wakil')) return 1;
    if (normalizedPosition.includes('wakil ketua')) return 2;
    if (normalizedPosition.includes('sekretaris')) return 3;
    if (normalizedPosition.includes('bendahara')) return 4;
    if (normalizedPosition.includes('koordinator')) return 5;
    return 6;
  };

  const categoryMembers = selectedDivisi === 'Semua'
    ? [...timList].sort((firstMember, secondMember) => {
        const firstHasPhoto = Boolean(firstMember.fotoUrl && !firstMember.fotoUrl.includes('default-avatar.svg'));
        const secondHasPhoto = Boolean(secondMember.fotoUrl && !secondMember.fotoUrl.includes('default-avatar.svg'));
        const photoPriorityDifference = Number(secondHasPhoto) - Number(firstHasPhoto);
        if (photoPriorityDifference !== 0) return photoPriorityDifference;

        return getPositionPriority(firstMember.jabatan) - getPositionPriority(secondMember.jabatan);
      })
    : timList.filter((m) => m.divisi === selectedDivisi);
  const filteredMembers = categoryMembers.filter((member) => `${member.nama} ${member.jabatan} ${member.divisi}`.toLocaleLowerCase('id').includes(query.trim().toLocaleLowerCase('id')));
  const displayedMembers = filteredMembers.slice(0, visibleMemberCount);
  const selectDivision = (value: string) => { setSelectedDivisi(value); setVisibleMemberCount(10); };
  const searchMembers = (value: string) => { setQuery(value); setVisibleMemberCount(10); };

  return (
    <section id="tim" className="liquid-section py-18 sm:py-24 border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bagian */}
        <div className="collection-heading relative grid grid-cols-1 items-center gap-5 lg:grid-cols-12">
          <div className="public-section-heading mx-auto max-w-3xl space-y-4 text-center lg:col-span-7 lg:mx-0 lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold tracking-wide uppercase">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Struktur Organisasi</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              <ScribbleTitle>Kenali pengurus kami</ScribbleTitle>
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-subtitle">
              Cari nama atau bidang pengurus. Pilih “Lihat profil” untuk mengetahui tugas dan kontak yang tersedia.
            </p>
          </div>
          <div className="lg:col-span-5">
            <Section3DShowcase kind="tim" />
          </div>
        </div>

        <PublicCollectionFilters label="Divisi" options={divisiList} counts={categoryCounts} selected={selectedDivisi} onSelect={selectDivision}
          searchLabel="Cari nama atau jabatan" query={query} onSearch={searchMembers} resultText={`Menampilkan ${displayedMembers.length} dari ${filteredMembers.length} pengurus`} />

        {/* Grid Pengurus */}
        {filteredMembers.length > 0 ? (
          <motion.div
            layout
            className="team-grid mt-4 grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5"
          >
            <AnimatePresence>
              {displayedMembers.map((member, index) => (
                <motion.article
                  layout
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 44, scale: 0.94 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.12 }}
                  exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
                  transition={shouldReduceMotion ? { duration: 0 } : {
                    type: 'spring', stiffness: 160, damping: 22,
                    delay: (index % 2) * 0.09,
                    layout: { duration: 0.3 },
                  }}
                  key={member.id}
                  className="member-card"
                >
                  <motion.button
                    type="button"
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                    onClick={() => { setActivePhotoMember(member); setMemberPhotoZoom(1); }}
                    className="member-card__photo"
                    aria-label={`Lihat foto ${member.nama}`}
                  >
                    <img
                      src={member.fotoUrl || '/default-avatar.svg'}
                      alt={`Foto ${member.nama}`}
                      onError={(event) => { event.currentTarget.src = '/default-avatar.svg'; }}
                      loading="lazy"
                    />
                    <span className="member-card__photo-hint" aria-hidden="true"><ZoomIn size={14} /></span>
                  </motion.button>
                  <div className="member-card__body">
                    <p className="member-card__division" title={member.divisi}>{member.divisi}</p>
                    <h3>{member.nama}</h3>
                    <p className="member-card__role">{member.jabatan}</p>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.96, backgroundColor: '#e9eef3' }}
                    onClick={() => setSelectedMember(member)}
                    className="member-card__profile"
                    aria-label={`Lihat profil ${member.nama}`}
                  >
                    <span>Lihat profil</span><ArrowUpRight size={16} />
                  </motion.button>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Empty State (R-27) */
          <div className="liquid-surface mt-12 p-12 text-center bg-stone-50 rounded-2xl border border-stone-200 max-w-md mx-auto">
            <SearchX className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Belum Ada Pengurus di Divisi Ini
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Coba nama atau divisi lain, atau tampilkan semua pengurus.
            </p>
            <button
              type="button"
              onClick={() => { selectDivision('Semua'); searchMembers(''); }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold hover:bg-slate-800"
            >
              Tampilkan Semua Pengurus
            </button>
          </div>
        )}

        {visibleMemberCount < filteredMembers.length && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleMemberCount((count) => count + 10)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 text-amber-400 hover:bg-slate-800 font-bold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              Tampilkan pengurus lainnya ({filteredMembers.length - displayedMembers.length})
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
                      className="inline-flex min-h-11 items-center break-all font-semibold text-slate-800 underline underline-offset-4 hover:text-amber-700"
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
                      className="inline-flex min-h-11 items-center break-all font-semibold text-slate-800 underline underline-offset-4 hover:text-amber-700"
                    >
                      WhatsApp: {selectedMember.noHp}
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
              <div className="max-h-[60dvh] overflow-auto rounded-2xl" tabIndex={memberPhotoZoom > 1 ? 0 : undefined} aria-label="Foto pengurus, geser saat diperbesar">
                <img
                  src={activePhotoMember.fotoUrl || '/default-avatar.svg'}
                  alt={`Foto ${activePhotoMember.nama}`}
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.svg';
                  }}
                  className="block h-auto max-w-none"
                  style={{ width: `${memberPhotoZoom * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <button type="button" onClick={() => setMemberPhotoZoom((zoom) => Math.max(1, Number((zoom - 0.25).toFixed(2))))} disabled={memberPhotoZoom <= 1} className="min-h-11 min-w-11 inline-flex items-center justify-center p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Perkecil foto" title="Perkecil foto">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setMemberPhotoZoom(1)} className="min-h-11 min-w-11 inline-flex items-center justify-center p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200" aria-label="Reset ukuran foto" title="Reset ukuran foto">
                  <RotateCcw className="w-4 h-4" /><span className="ml-2 text-sm">{Math.round(memberPhotoZoom * 100)}%</span>
                </button>
                <button type="button" onClick={() => setMemberPhotoZoom((zoom) => Math.min(3, Number((zoom + 0.25).toFixed(2))))} disabled={memberPhotoZoom >= 3} className="min-h-11 min-w-11 inline-flex items-center justify-center p-2.5 rounded-xl bg-stone-100 text-slate-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Perbesar foto" title="Perbesar foto">
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
