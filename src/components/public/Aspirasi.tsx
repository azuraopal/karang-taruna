import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, CheckCircle2, MapPin, Mail, Phone, Clock, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { Aspirasi } from '../../types';
import { TENTANG_DATA } from '../../data/initialData';

export const AspirasiSection: React.FC = () => {
  const { addAspirasi } = useData();

  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [kategori, setKategori] = useState<Aspirasi['kategori']>('Saran Kegiatan');
  const [pesan, setPesan] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nama.trim() || !email.trim() || !noHp.trim() || !pesan.trim()) {
      setErrorMsg('Mohon lengkapi seluruh kolom formulir aspirasi.');
      return;
    }

    addAspirasi({
      nama: nama.trim(),
      email: email.trim(),
      noHp: noHp.trim(),
      kategori,
      pesan: pesan.trim(),
    });

    setIsSubmitted(true);
    setNama('');
    setEmail('');
    setNoHp('');
    setPesan('');
  };

  return (
    <section id="aspirasi" className="py-24 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Kolom Informasi & Sekretariat (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold tracking-wide uppercase">
              <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
              <span>Suara Warga & Pemuda</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Kirim Aspirasi & Ide Positif untuk Kemajuan Margabakti 07
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed">
              Punya usulan kegiatan pemuda, ide lomba baru, aduan fasilitas umum, atau ingin mengajak kolaborasi? Sampaikan langsung kepada pengurus melalui formulir ini.
            </p>

            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-stone-100 pb-2">
                Kontak & Balai Pertemuan
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{TENTANG_DATA.kontak.alamat}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{TENTANG_DATA.kontak.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{TENTANG_DATA.kontak.whatsapp}</span>
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
          </div>

          {/* Kolom Formulir Aspirasi (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 shadow-sm">
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Aspirasi Berhasil Disampaikan!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Terima kasih atas partisipasi aktif Anda. Pesan telah tercatat pada sistem database pengurus untuk ditinjau segera.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs hover:bg-slate-800 transition-colors"
                >
                  Kirim Aspirasi Lainnya
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4.5">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Formulir Aspirasi Warga
                </h3>

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Contoh: Budi Prasetyo"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Nomor HP / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                      placeholder="Contoh: 0812-xxxx-xxxx"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Alamat Email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Kategori Aspirasi
                    </label>
                    <select
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value as Aspirasi['kategori'])}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                    >
                      <option value="Saran Kegiatan">Saran Kegiatan / Program</option>
                      <option value="Aduan Lingkungan">Aduan Kebersihan & Lingkungan</option>
                      <option value="Ide Kreatif">Ide Kreatif & Kewirausahaan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Uraian Pesan / Masukan *
                  </label>
                  <textarea
                    rows={4}
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    placeholder="Tuliskan aspirasi, ide, atau saran Anda secara rinci dan santun..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="min-h-[44px] w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim Aspirasi Sekarang</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
