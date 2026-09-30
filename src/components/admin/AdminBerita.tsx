import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Eye, EyeOff, AlertTriangle, Newspaper } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { Berita, KategoriBerita } from '../../types';
import { Modal } from '../common/Modal';
import { ImagePicker } from '../common/ImagePicker';

export const AdminBerita: React.FC = () => {
  const { beritaList, addBerita, updateBerita, deleteBerita } = useData();

  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<Berita | null>(null);

  // Form states
  const [judul, setJudul] = useState('');
  const [slug, setSlug] = useState('');
  const [ringkasan, setRingkasan] = useState('');
  const [isi, setIsi] = useState('');
  const [kategori, setKategori] = useState<KategoriBerita>('Program Kerja');
  const [tanggal, setTanggal] = useState('');
  const [penulis, setPenulis] = useState('');
  const [gambarUrl, setGambarUrl] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [formError, setFormError] = useState('');

  const kategoriOptions: KategoriBerita[] = [
    'Program Kerja',
    'Sosial & Warga',
    'Olahraga',
    'Pendidikan',
    'Pengumuman',
  ];

  const resetForm = () => {
    setEditingId(null);
    setJudul('');
    setSlug('');
    setRingkasan('');
    setIsi('');
    setKategori('Program Kerja');
    setTanggal(
      new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
    setPenulis('Pengurus Harian');
    setGambarUrl('');
    setStatus('published');
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Berita) => {
    setEditingId(item.id);
    setJudul(item.judul);
    setSlug(item.slug);
    setRingkasan(item.ringkasan);
    setIsi(item.isi);
    setKategori(item.kategori);
    setTanggal(item.tanggal);
    setPenulis(item.penulis);
    setGambarUrl(item.gambarUrl);
    setStatus(item.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!judul.trim() || !ringkasan.trim() || !isi.trim() || !penulis.trim()) {
      setFormError('Mohon lengkapi judul, ringkasan, isi, dan penulis warta.');
      return;
    }

    const finalSlug =
      slug.trim() ||
      judul
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const payload = {
      judul: judul.trim(),
      slug: finalSlug,
      ringkasan: ringkasan.trim(),
      isi: isi.trim(),
      kategori,
      tanggal: tanggal.trim(),
      penulis: penulis.trim(),
      gambarUrl: gambarUrl.trim(),
      status,
    };

    if (editingId) {
      updateBerita(editingId, payload);
    } else {
      addBerita(payload);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteBerita(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const filtered = beritaList.filter((b) => {
    const matchCat = selectedKategori === 'Semua' || b.kategori === selectedKategori;
    const matchSearch =
      b.judul.toLowerCase().includes(search.toLowerCase()) ||
      b.penulis.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kelola Warta & Berita Kegiatan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Publikasikan pengumuman warga, agenda turnamen, dan laporan pertanggungjawaban program kerja.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Berita Baru</span>
        </button>
      </div>

      {/* Filter & Pencarian Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul berita..."
            className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Kategori:</span>
          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none w-full sm:w-auto"
          >
            <option value="Semua">Semua Kategori</option>
            {kategoriOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List / Tabel Berita */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
        {filtered.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-stone-50/70 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={item.gambarUrl}
                    alt={item.judul}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-stone-200"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                        {item.kategori}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {item.status === 'published' ? 'Tayang' : 'Draft'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                      {item.judul}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 pr-4">
                      {item.ringkasan}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>{item.tanggal}</span>
                      <span>&bull;</span>
                      <span>Oleh {item.penulis}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateBerita(item.id, {
                        status: item.status === 'published' ? 'draft' : 'published',
                      })
                    }
                    className={`p-2 rounded-xl text-xs font-semibold border transition-colors ${
                      item.status === 'published'
                        ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        : 'border-stone-300 text-slate-600 hover:bg-stone-100'
                    }`}
                    title={
                      item.status === 'published'
                        ? 'Ubah ke status Draft'
                        : 'Publikasikan ke Publik'
                    }
                  >
                    {item.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-slate-900 hover:text-amber-400 text-slate-700 transition-colors"
                    title="Ubah Berita"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingItem(item)}
                    className="p-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 transition-colors"
                    title="Hapus Berita"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-stone-300 rounded-2xl p-12 m-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-slate-400">
              <Newspaper className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Data Tidak Tersedia</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Tidak ada berita yang sesuai dengan filter atau kata kunci saat ini.
            </p>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Berita */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Warta / Berita' : 'Tulis Warta Baru'}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Judul Berita *
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Kerja Bakti Massal Lingkungan Margabakti 07"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as KategoriBerita)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
              >
                {kategoriOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Status Publikasi
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
              >
                <option value="published">Tayang di Web Publik</option>
                <option value="draft">Simpan Sebagai Draft</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tanggal Publikasi
              </label>
              <input
                type="text"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                placeholder="Contoh: 28 September 2026"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Penulis / Sie Pelaksana *
              </label>
              <input
                type="text"
                value={penulis}
                onChange={(e) => setPenulis(e.target.value)}
                placeholder="Contoh: Sie Humas & Kemitraan"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <ImagePicker
            value={gambarUrl}
            onChange={setGambarUrl}
            label="Foto Sampul Warta"
            sublabel="Pilih foto sampul berita langsung dari galeri atau kamera HP Anda"
            category="berita"
            aspectRatio="video"
            maxWidth={1200}
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Ringkasan Singkat (Lead Paragraf) *
            </label>
            <textarea
              rows={2}
              value={ringkasan}
              onChange={(e) => setRingkasan(e.target.value)}
              placeholder="Tuliskan 1-2 kalimat ringkasan yang menarik pembaca..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Isi Lengkap Warta *
            </label>
            <textarea
              rows={5}
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              placeholder="Tuliskan isi berita secara terperinci (dapat memuat beberapa paragraf)..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl hover:bg-slate-800 shadow-sm"
            >
              {editingId ? 'Simpan Perubahan' : 'Terbitkan Berita'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Hapus Berita */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Konfirmasi Hapus Warta"
        maxWidth="sm"
      >
        {deletingItem && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus warta{' '}
              <strong className="text-slate-900">"{deletingItem.judul}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-sm"
              >
                Ya, Hapus Warta
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
