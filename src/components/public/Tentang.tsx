import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, HeartHandshake, Sparkles, Award, Target, BookOpen, Compass } from 'lucide-react';
import { TENTANG_DATA } from '../../data/initialData';
import { Logo } from '../common/Logo';

export const Tentang: React.FC = () => {
  const valueIcons: Record<string, React.ReactNode> = {
    Users: <Users className="w-5 h-5 text-amber-600" />,
    ShieldCheck: <Award className="w-5 h-5 text-amber-600" />,
    Sparkles: <Sparkles className="w-5 h-5 text-amber-600" />,
    HeartHandshake: <HeartHandshake className="w-5 h-5 text-amber-600" />,
  };

  const bidangKerja = [
    {
      nama: 'PSDM (Pengembangan SDM)',
      peran: 'Kaderisasi pemuda, pelatihan kepemimpinan, dan peningkatan kapasitas organisasi.',
    },
    {
      nama: 'Kreativitas dan Humas',
      peran: 'Pengelolaan media publikasi, dokumentasi, dan jembatan komunikasi warga.',
    },
    {
      nama: 'Sosial & Kegiatan',
      peran: 'Aksi gotong royong kerja bakti, santunan warga, dan tanggap darurat kepedulian.',
    },
    {
      nama: 'Olahraga dan Kesehatan',
      peran: 'Turnamen olahraga tahunan, senam warga, posyandu remaja, dan donor darah.',
    },
    {
      nama: 'Pendidikan & Seni Budaya',
      peran: 'Pojok literasi belajar, sanggar kesenian tradisional, dan pentas budaya warga.',
    },
    {
      nama: 'Kerohanian',
      peran: 'Peringatan hari besar keagamaan, kajian pemuda, dan pemeliharaan toleransi.',
    },
    {
      nama: 'Ekonomi & Kewirausahaan',
      peran: 'Pemberdayaan UMKM pemuda, bazar kreatif, dan pelatihan keterampilan usaha.',
    },
  ];

  return (
    <section id="tentang" className="py-24 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bagian */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold tracking-wide uppercase">
            <Compass className="w-3.5 h-3.5 text-amber-700" />
            <span>Profil & Landasan Gerak</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Mengenal Karang Taruna Margabakti 07
          </h2>

          <p className="text-slate-600 text-base leading-relaxed">
            Organisasi sosial kepemudaan yang berdiri mandiri di tingkat rukun warga, berfungsi sebagai laboratorium kepemimpinan, kepedulian sosial, dan pilar kebersamaan generasi penerus.
          </p>
        </div>

        {/* Sejarah & Identitas Card */}
        <div className="mt-14 bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 space-y-4">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md inline-flex items-center justify-center">
                <Logo variant="white" size="md" className="h-7 sm:h-9 w-auto" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              </h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Semboyan Resmi Karang Taruna Nasional
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Mengandung arti pejuang yang berkarya dengan keagungan, budi pekerti luhur, dan keberanian membela kebenaran serta kepentingan masyarakat.
              </p>
            </div>

            <div className="lg:col-span-8 bg-stone-50 rounded-2xl p-6 sm:p-8 border border-stone-200/80 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Sekilas Sejarah & Peran</span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">
                {TENTANG_DATA.sejarah}
              </p>
              <div className="pt-2 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Wilayah Gerak:</span>
                  <span>Komunitas Warga Margabakti 07</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Pangkalan Utama:</span>
                  <span>Balai Pertemuan Margabakti 07</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visi & Misi */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Visi (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                <Target className="w-3.5 h-3.5" />
                <span>Visi Organisasi</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold leading-snug text-white">
                Mewujudkan Pemuda Berkarakter, Berdaya Sosial, dan Mandiri
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                "{TENTANG_DATA.visi}"
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-amber-400 font-medium">
              Landasan Rencana Kerja Periode 2024 - 2027
            </div>
          </div>

          {/* Misi (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-stone-200 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Misi Aksi Nyata</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              5 Langkah Utama Gerakan Kepemudaan
            </h3>

            <div className="space-y-3 pt-2">
              {TENTANG_DATA.misi.map((misiText, idx) => (
                <div key={idx} className="flex items-start gap-3.5 text-sm text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="leading-relaxed">{misiText}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Nilai Utama */}
        <div className="mt-14">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl font-bold text-slate-900">
              4 Nilai Keutamaan Kami
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Prinsip yang dipegang teguh seluruh jajaran pengurus dan relawan pemuda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TENTANG_DATA.nilai.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs hover:border-amber-400 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                  {valueIcons[item.ikon] || <Sparkles className="w-5 h-5 text-amber-600" />}
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">
                  {item.judul}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.deskripsi}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 4 Bidang Kerja */}
        <div className="mt-14 bg-amber-50/60 rounded-3xl p-8 sm:p-10 border border-amber-200/80">
          <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">
            7 Divisi Bidang Kerja Pemuda
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {bidangKerja.map((bidang, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-amber-200/60 shadow-2xs">
                <span className="text-[11px] font-black uppercase text-amber-700 tracking-wider block mb-1">
                  Bidang 0{idx + 1}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mb-2">
                  {bidang.nama}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {bidang.peran}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
