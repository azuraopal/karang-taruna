import React, { useEffect, useState } from 'react';
import { Trash2, Mail, Phone, Search, Inbox } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { Aspirasi } from '../../types';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';

export const AdminAspirasi: React.FC = () => {
  const { aspirasiList, updateStatusAspirasi, deleteAspirasi, currentUser } = useData();

  const [statusFilter, setStatusFilter] = useState<'Semua' | Aspirasi['status']>('Semua');
  const [search, setSearch] = useState('');
  const [deletingItem, setDeletingItem] = useState<Aspirasi | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filtered = aspirasiList.filter((a) => {
    const matchStatus = statusFilter === 'Semua' || a.status === statusFilter;
    const matchSearch =
      a.nama.toLowerCase().includes(search.toLowerCase()) ||
      a.pesan.toLowerCase().includes(search.toLowerCase()) ||
      a.kategori.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });
  const paginated = filtered.slice((currentPage - 1) * 5, currentPage * 5);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, filtered.length]);

  const confirmDelete = () => {
    if (deletingItem) {
      deleteAspirasi(deletingItem.id);
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kotak Aspirasi & Suara Warga
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar masukan, ide kegiatan, dan aduan lingkungan yang dikirimkan warga melalui portal publik.
          </p>
        </div>
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
            placeholder="Cari aspirasi / nama warga..."
            className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(['Semua', 'baru', 'dibaca', 'selesai'] as const).map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-amber-400'
                    : 'bg-stone-100 hover:bg-stone-200 text-slate-700'
                }`}
              >
                {st === 'Semua' ? 'Semua' : st === 'baru' ? 'Baru' : st === 'dibaca' ? 'Dibaca' : 'Ditindaklanjuti'}
              </button>
            );
          })}
        </div>
      </div>

      {/* List Aspirasi */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs divide-y divide-stone-100">
        {filtered.length > 0 ? (
          paginated.map((item) => (
            <div
              key={item.id}
              className={`p-5 flex flex-col sm:flex-row items-start justify-between gap-4 transition-colors ${
                item.status === 'baru' ? 'bg-amber-50/30' : 'hover:bg-stone-50/70'
              }`}
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'baru'
                        ? 'bg-rose-100 text-rose-800'
                        : item.status === 'dibaca'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.status === 'baru'
                      ? 'Aspirasi Baru'
                      : item.status === 'dibaca'
                      ? 'Sudah Dibaca'
                      : 'Selesai Ditindaklanjuti'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-slate-700">
                    {item.kategori}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {item.tanggal}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {item.nama}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {item.noHp}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {item.email}
                    </span>
                  </div>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ditambahkan oleh {item.dibuatOleh || 'Warga / Publik'}
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                  {item.pesan}
                </p>
              </div>

              {/* Status Actions */}
              <div className="flex sm:flex-col items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const nextStatus = item.status === 'baru' ? 'dibaca' : item.status === 'dibaca' ? 'selesai' : 'baru';
                    updateStatusAspirasi(item.id, nextStatus);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-slate-900 hover:text-amber-400 text-slate-700 text-xs font-semibold transition-colors"
                >
                  {item.status === 'baru' ? 'Tandai Dibaca' : item.status === 'dibaca' ? 'Tandai Selesai' : 'Buka Kembali'}
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingItem(item)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Hapus Aspirasi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-stone-300 rounded-2xl p-12 m-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-slate-400">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Data Tidak Tersedia</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Belum ada aspirasi warga yang sesuai filter atau kata kunci saat ini.
            </p>
          </div>
        )}
        <Pagination currentPage={currentPage} totalItems={filtered.length} onPageChange={setCurrentPage} />
      </div>

      {/* Modal Hapus Aspirasi */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Hapus Aspirasi Warga"
        maxWidth="sm"
      >
        {deletingItem && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus pesan dari warga{' '}
              <strong className="text-slate-900">{deletingItem.nama}</strong>?
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
