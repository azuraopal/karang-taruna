import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, AlertTriangle, Users } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { AnggotaTim, DivisiTim } from '../../types';
import { Modal } from '../common/Modal';
import { ImagePicker } from '../common/ImagePicker';

export const AdminTim: React.FC = () => {
  const { timList, addAnggotaTim, updateAnggotaTim, deleteAnggotaTim, currentUser } = useData();

  const [search, setSearch] = useState('');
  const [selectedDivisi, setSelectedDivisi] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<AnggotaTim | null>(null);

  // Form states
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [divisi, setDivisi] = useState<DivisiTim>('Pengurus Harian');
  const [fotoUrl, setFotoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [formError, setFormError] = useState('');

  const divisiOptions: DivisiTim[] = [
    'Pengurus Harian',
    'PSDM',
    'Kreativitas dan Humas',
    'Sosial & Kegiatan',
    'Olahraga dan Kesehatan',
    'Pendidikan & Seni Budaya',
    'Kerohanian',
    'Ekonomi & Kewirausahaan',
  ];

  const resetForm = () => {
    setEditingId(null);
    setNama('');
    setJabatan('');
    setDivisi('Pengurus Harian');
    setFotoUrl('/default-avatar.svg');
    setBio('');
    setEmail('');
    setNoHp('');
    setFormError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AnggotaTim) => {
    setEditingId(item.id);
    setNama(item.nama);
    setJabatan(item.jabatan);
    setDivisi(item.divisi);
    setFotoUrl(item.fotoUrl);
    setBio(item.bio);
    setEmail(item.email || '');
    setNoHp(item.noHp || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nama.trim() || !jabatan.trim() || !bio.trim()) {
      setFormError('Mohon isi nama lengkap, jabatan, dan deskripsi peran pengurus.');
      return;
    }

    const payload = {
      nama: nama.trim(),
      jabatan: jabatan.trim(),
      divisi,
      fotoUrl: fotoUrl.trim() || '/default-avatar.svg',
      bio: bio.trim(),
      email: email.trim() || undefined,
      noHp: noHp.trim() || undefined,
    };

    if (editingId) {
      updateAnggotaTim(editingId, payload);
    } else {
      addAnggotaTim(payload);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteAnggotaTim(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const filtered = timList.filter((m) => {
    const matchDivisi = selectedDivisi === 'Semua' || m.divisi === selectedDivisi;
    const matchSearch =
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      m.jabatan.toLowerCase().includes(search.toLowerCase());
    return matchDivisi && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kelola Susunan Pengurus Tim
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pengurus inti, koordinator divisi, dan penanggung jawab kegiatan Karang Taruna Margabakti 07.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengurus Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pengurus / jabatan..."
            className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Divisi:</span>
          <select
            value={selectedDivisi}
            onChange={(e) => setSelectedDivisi(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none w-full sm:w-auto"
          >
            <option value="Semua">Semua Divisi</option>
            {divisiOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Pengurus Admin */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <img
                  src={item.fotoUrl}
                  alt={item.nama}
                  className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                />
                <div className="min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 mb-1">
                    {item.divisi}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {item.nama}
                  </h3>
                  <p className="text-xs font-semibold text-amber-700">
                    {item.jabatan}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 my-3 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                {item.bio}
              </p>

              {currentUser?.role === 'admin' && (
                <p className="text-[11px] text-slate-400 truncate mb-3">
                  Ditambahkan oleh {item.dibuatOleh || 'Data lama'}
                </p>
              )}

              <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                <div className="text-[11px] text-slate-500 truncate pr-2">
                  {item.noHp || item.email || 'Kontak via Sekretariat'}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-slate-900 hover:text-amber-400 text-slate-700 transition-colors"
                    title="Edit data"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingItem(item)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 transition-colors"
                    title="Hapus pengurus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-stone-300 rounded-2xl p-12 mt-2">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-slate-400">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-black text-slate-800">Data Tidak Tersedia</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Belum ada data pengurus yang tersedia untuk divisi atau pencarian ini.
          </p>
        </div>
      )}

      {/* Modal Tambah / Edit Pengurus */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Data Pengurus' : 'Tambah Pengurus Baru'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nama Lengkap & Gelar *
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Budi Santoso, S.T."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Jabatan / Amanah *
              </label>
              <input
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Ketua Sie Lingkungan Hidup"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Divisi / Seksi Kerja
            </label>
            <select
              value={divisi}
              onChange={(e) => setDivisi(e.target.value as DivisiTim)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
            >
              {divisiOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@karangtaruna.id"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                No. WhatsApp / HP
              </label>
              <input
                type="text"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <ImagePicker
            value={fotoUrl}
            onChange={setFotoUrl}
            label="Foto Profil Pengurus"
            sublabel="Pilih foto langsung dari galeri atau kamera HP Anda"
            category="profiles"
            aspectRatio="square"
            maxWidth={800}
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Deskripsi Peran & Tanggung Jawab *
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tuliskan fokus program atau tugas utama yang diemban oleh pengurus..."
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
              {editingId ? 'Simpan Perubahan' : 'Tambah Pengurus'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Hapus Pengurus */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Konfirmasi Hapus Pengurus"
        maxWidth="sm"
      >
        {deletingItem && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data pengurus{' '}
              <strong className="text-slate-900">{deletingItem.nama}</strong> ({deletingItem.jabatan})?
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
                Ya, Hapus
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
