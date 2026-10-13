import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, CheckCircle2, MapPin, Mail, Phone, Clock, AlertCircle, Sparkles, LoaderCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { Aspirasi } from '../../types';
import { TENTANG_DATA } from '../../data/initialData';
import { ScribbleTitle } from '../common/ScribbleTitle';
import { Section3DShowcase } from '../common/Section3DShowcase';
import { triggerParticleBurst } from '../../utils/particleBurst';

export const AspirasiSection: React.FC = () => {
  const { addAspirasi } = useData();

  const sendingRef = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [kategori, setKategori] = useState<Aspirasi['kategori']>('Saran Kegiatan');
  const [pesan, setPesan] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isSubmitted) resultRef.current?.focus();
  }, [isSubmitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingRef.current) return;
    setErrorMsg('');

    if (!nama.trim() || !email.trim() || !noHp.trim() || !pesan.trim()) {
      setErrorMsg('Mohon lengkapi seluruh kolom formulir aspirasi.');
      return;
    }

    sendingRef.current = true;
    setIsSubmitting(true);
    try {
      await addAspirasi({ nama: nama.trim(), email: email.trim(), noHp: noHp.trim(), kategori, pesan: pesan.trim() });
      setIsSubmitted(true);
      triggerParticleBurst({ count: 24, power: 0.8 });
      setNama(''); setEmail(''); setNoHp(''); setPesan('');
    } catch {
      setErrorMsg('Pesan belum berhasil dikirim. Periksa koneksi lalu coba lagi. Isian Anda tetap tersimpan di formulir ini.');
    } finally {
      sendingRef.current = false;
      setIsSubmitting(false);
    }

  };
  return (
    <section id="aspirasi" className="relative py-18 sm:py-24 liquid-section border-t border-stone-200 overflow-visible">
      <div className="soft-grid absolute inset-0 opacity-35" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="public-section-heading relative mb-8 max-w-3xl">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold tracking-wide uppercase">
                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                <span>Suara Warga & Pemuda</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                <ScribbleTitle>Punya ide atau saran?</ScribbleTitle>
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-subtitle">
                Sampaikan usulan kegiatan, keluhan lingkungan, atau ajakan kerja sama kepada pengurus. Tidak perlu membuat akun.
              </p>
            </div>

        </div>
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          {/* Keep sticky positioning separate from the entrance transform. */}
          <div className="aspirasi-form-sticky order-1 lg:order-2 lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="aspirasi-form-surface liquid-surface bg-white rounded-2xl border border-stone-200 p-5 sm:p-10 shadow-sm"
          >
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                ref={resultRef} tabIndex={-1} role="status" aria-live="polite" className="py-12 text-center space-y-4"
              >
                <motion.div
                  animate={{ scale: [0.8, 1.15, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.6 }}
                  className="w-18 h-18 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 border-2 border-emerald-300"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                  <span>Aspirasi Berhasil Disampaikan!</span>
                  <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Terima kasih atas partisipasi aktif Anda. Pesan telah tercatat secara langsung pada sistem pengurus untuk segera ditinjau dan ditindaklanjuti.
                </p>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    triggerParticleBurst({ x: e.clientX, y: e.clientY, count: 20 });
                    setIsSubmitted(false);
                  }}
                  className="px-7 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Kirim Aspirasi Lainnya
                </motion.button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}
                onInvalidCapture={(event) => {
                  const field = event.target;
                  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
                    field.setCustomValidity(field.validity.valueMissing ? 'Mohon isi kolom ini.' : field.validity.typeMismatch ? 'Masukkan alamat email yang valid.' : 'Periksa kembali isian Anda.');
                  }
                }}
                onInputCapture={(event) => {
                  const field = event.target;
                  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.setCustomValidity('');
                }} aria-busy={isSubmitting} className="space-y-4.5">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Formulir aspirasi warga
                </h3>
                <p id="aspirasi-help" className="text-sm leading-relaxed text-slate-600">Kolom bertanda * wajib diisi. Gunakan kontak yang dapat dihubungi untuk tindak lanjut.</p>

                {errorMsg && (
                  <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="aspirasi-nama" className="block text-sm font-semibold text-slate-700 mb-2">
                      Nama Lengkap *
                    </label>
                    <input
                      id="aspirasi-nama" name="nama" required autoComplete="name" disabled={isSubmitting}
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Contoh: Budi Prasetyo"
                      className="liquid-input w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="aspirasi-telepon" className="block text-sm font-semibold text-slate-700 mb-2">
                      Nomor HP / WhatsApp *
                    </label>
                    <input
                      id="aspirasi-telepon" name="telepon" required autoComplete="tel" disabled={isSubmitting}
                      type="tel"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                      placeholder="Contoh: 0812-xxxx-xxxx"
                      className="liquid-input w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="aspirasi-email" className="block text-sm font-semibold text-slate-700 mb-2">
                      Alamat Email *
                    </label>
                    <input
                      id="aspirasi-email" name="email" required autoComplete="email" disabled={isSubmitting}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="liquid-input w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="aspirasi-kategori" className="block text-sm font-semibold text-slate-700 mb-2">
                      Kategori Aspirasi
                    </label>
                    <select id="aspirasi-kategori" disabled={isSubmitting}
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value as Aspirasi['kategori'])}
                      className="liquid-input w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                    >
                      <option value="Saran Kegiatan">Saran Kegiatan / Program</option>
                      <option value="Aduan Lingkungan">Aduan Kebersihan & Lingkungan</option>
                      <option value="Ide Kreatif">Ide Kreatif & Kewirausahaan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="aspirasi-pesan" className="block text-sm font-semibold text-slate-700 mb-2">
                    Uraian Pesan / Masukan *
                  </label>
                  <textarea id="aspirasi-pesan" name="pesan" required disabled={isSubmitting} aria-describedby="aspirasi-help"
                    rows={4}
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    placeholder="Tuliskan aspirasi, ide, atau saran Anda secara rinci dan santun..."
                    className="liquid-input w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                  />
                </div>

                <div className="pt-2">
                  <motion.button
                    type="submit" disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className="min-h-[44px] w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer border border-slate-800"
                  >
                    {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isSubmitting ? 'Sedang mengirim…' : 'Kirim aspirasi'}</span>
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
          </div>
          {/* Kolom Informasi & Sekretariat (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:order-1 lg:col-span-5 space-y-5 sm:space-y-6"
          >
            <Section3DShowcase kind="aspirasi" />

            <div className="liquid-surface bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-stone-100 pb-2">
                Kontak
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{TENTANG_DATA.kontak.alamat}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <a className="public-contact-link" href={`mailto:${TENTANG_DATA.kontak.email}`}>Email: {TENTANG_DATA.kontak.email}</a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <a className="public-contact-link" href={`https://wa.me/${TENTANG_DATA.kontak.whatsapp.replace(/\D/g, '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer">WhatsApp: {TENTANG_DATA.kontak.whatsapp}</a>
                </div>
                <div className="flex items-start gap-3 pt-1 border-t border-stone-100">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{TENTANG_DATA.kontak.jadwalKumpul}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-950">
              <span className="font-bold block mb-0.5">Komitmen Respon Cepat:</span>
              Setiap aspirasi akan dibahas dalam agenda koordinasi mingguan pengurus dan ditindaklanjuti bersama ketua RT/RW.
            </div>

            <div className="border-t border-stone-200 pt-5">
              <p className="text-[11px] font-black tracking-wider uppercase text-amber-700">Alur tindak lanjut</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="min-w-0">
                  <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-amber-400">1</span>
                  <p className="mt-2 text-[11px] font-bold leading-snug text-slate-800">Pesan diterima</p>
                </div>
                <div className="min-w-0">
                  <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-800">2</span>
                  <p className="mt-2 text-[11px] font-bold leading-snug text-slate-800">Dibahas pengurus</p>
                </div>
                <div className="min-w-0">
                  <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">3</span>
                  <p className="mt-2 text-[11px] font-bold leading-snug text-slate-800">Ditindaklanjuti</p>
                </div>
              </div>
            </div>
          </motion.div>


        </div>
      </div>
    </section>
  );
};
