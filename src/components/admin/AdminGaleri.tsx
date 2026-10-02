import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, Calendar, AlertTriangle, ImageOff } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { ItemGaleri, KategoriGaleri } from '../../types';
import { Modal } from '../common/Modal';
import { ImagePicker } from '../common/ImagePicker';

export const AdminGaleri: React.FC = () => {
  const { galeriList, addGaleri, updateGaleri, deleteGaleri, currentUser } = useData();

  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemGaleri | null>(null);

  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<KategoriGaleri>('Kegiatan Sosial');
  const [tanggal, setTanggal] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [gambarUrl, setGambarUrl] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [formError, setFormError] = useState('');

  const kategoriOptions: KategoriGaleri[] = [
    'Kegiatan Sosial',
    'Olahraga',
    'Pentas Seni',
    'Lingkungan',
    'Pelatihan',
  ];

  const resetForm = () => {
    setEditingId(null);
    setJudul('');
    setKategori('Kegiatan Sosial');
    setTanggal(
      new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
    setLokasi('Majelis rt 003');
    setGambarUrl('');
    setDeskripsi('');
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ItemGaleri) => {
    setEditingId(item.id);
    setJudul(item.judul);
    setKategori(item.kategori);
    setTanggal(item.tanggal);
    setLokasi(item.lokasi);
    setGambarUrl(item.gambarUrl);
    setDeskripsi(item.deskripsi);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!judul.trim() || !lokasi.trim() || !deskripsi.trim()) {
      setFormError('Mohon isi judul kegiatan, lokasi, dan deskripsi dokumentasi.');
      return;
    }

    const payload = {
      judul: judul.trim(),
      kategori,
      tanggal: tanggal.trim(),
      lokasi: lokasi.trim(),
      gambarUrl: gambarUrl.trim(),
      deskripsi: deskripsi.trim(),
    };

    if (editingId) {
      updateGaleri(editingId, payload);
    } else {
      addGaleri(payload);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteGaleri(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const filtered = galeriList.filter((g) => {
    const matchCat = selectedKategori === 'Semua' || g.kategori === selectedKategori;
    const matchSearch =
      g.judul.toLowerCase().includes(search.toLowerCase()) ||
      g.lokasi.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kelola Galeri Dokumentasi Foto
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kumpulan dokumentasi foto aksi sosial, kerja bakti, olahraga, dan pentas seni warga Margabakti 07.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <Plus className="w-4 h-4" />
          <span>Unggah Foto Kegiatan</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul kegiatan / lokasi..."
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

      {/* Grid Galeri */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 bg-stone-200">
                  <img
                    src={item.gambarUrl}
                    alt={item.judul}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-amber-400">
                    {item.kategori}
                  </span>
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {item.judul}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {item.deskripsi}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.tanggal}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {item.lokasi}
                    </span>
                  </div>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
                    <p className="text-[11px] text-slate-400 truncate pt-1">
                      Ditambahkan oleh {item.dibuatOleh || 'Data lama'}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-slate-900 hover:text-amber-400 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingItem(item)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-stone-300 rounded-2xl p-12">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-slate-400">
            <ImageOff className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-black text-slate-800">Data Tidak Tersedia</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Belum ada dokumentasi foto yang sesuai dengan filter atau kata kunci saat ini.
          </p>
        </div>
      )}

      {/* Modal Tambah / Edit Galeri */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Dokumentasi Foto' : 'Unggah Foto Kegiatan Baru'}
        maxWidth="lg"
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
              Judul Kegiatan Foto *
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Gotong Royong Saluran Air Margabakti 07"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Kategori Kegiatan
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as KategoriGaleri)}
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
                Tanggal Dokumentasi
              </label>
              <input
                type="text"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                placeholder="Contoh: 21 September 2026"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Lokasi Tempat Kegiatan *
            </label>
            <input
              type="text"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Contoh: Lapangan Serbaguna Margabakti 07"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
            />
          </div>

          <ImagePicker
            value={gambarUrl}
            onChange={setGambarUrl}
            label="Foto Dokumentasi Kegiatan"
            sublabel="Pilih foto kegiatan langsung dari galeri atau kamera HP Anda"
            category="galeri"
            aspectRatio="video"
            maxWidth={1200}
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Deskripsi Singkat Dokumentasi *
            </label>
            <textarea
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Ceritakan momen penting yang diabadikan dalam foto ini..."
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
              {editingId ? 'Simpan Perubahan' : 'Tambahkan ke Galeri'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Hapus Galeri */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Konfirmasi Hapus Dokumentasi Foto"
        maxWidth="sm"
      >
        {deletingItem && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus foto dokumentasi{' '}
              <strong className="text-slate-900">"{deletingItem.judul}"</strong>?
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
                Ya, Hapus Foto
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
