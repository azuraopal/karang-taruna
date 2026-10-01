import React, { useState } from 'react';
import {
  Plus, Edit, Trash2, User, Eye, EyeOff,
  AlertTriangle, CheckCircle2, Crown, Users, ShieldCheck
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { UserAccount, UserRole } from '../../types';
import { Modal } from '../common/Modal';

export const AdminUsers: React.FC = () => {
  const { userList, addUser, updateUser, deleteUser, currentUser, showToast } = useData();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<UserAccount | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [role, setRole] = useState<UserRole>('pengurus');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setUsername('');
    setNamaLengkap('');
    setRole('pengurus');
    setPassword('');
    setShowPassword(false);
    setFormError('');
  };

  const handleOpenCreate = () => {
    if (!isSuperAdmin) {
      showToast('Hanya Super Admin yang dapat menambah akun pengguna.', 'error');
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: UserAccount) => {
    if (!isSuperAdmin) {
      showToast('Hanya Super Admin yang dapat mengubah akun pengguna.', 'error');
      return;
    }
    setEditingId(item.id);
    setUsername(item.username);
    setNamaLengkap(item.namaLengkap);
    setRole(item.role);
    setPassword('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!namaLengkap.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }

    if (!editingId) {
      if (!username.trim()) {
        setFormError('Username wajib diisi untuk pengguna baru.');
        return;
      }
      if (!password.trim() || password.length < 6) {
        setFormError('Password minimal 6 karakter untuk pengguna baru.');
        return;
      }

      // Cek duplikat username di sisi client
      const isDuplicate = userList.some(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (isDuplicate) {
        setFormError('Username sudah digunakan, silakan pilih yang lain.');
        return;
      }

      await addUser({
        username: username.trim(),
        namaLengkap: namaLengkap.trim(),
        role,
        password: password.trim(),
      });
    } else {
      await updateUser(editingId, {
        namaLengkap: namaLengkap.trim(),
        role,
        password: password.trim() || undefined,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    if (!isSuperAdmin) {
      showToast('Hanya Super Admin yang dapat menghapus akun pengguna.', 'error');
      setDeletingItem(null);
      return;
    }
    // Cegah hapus akun diri sendiri
    if (deletingItem.id === currentUser?.id) {
      showToast('Tidak dapat menghapus akun yang sedang digunakan!', 'error');
      setDeletingItem(null);
      return;
    }
    // Pastikan ada minimal 1 admin tersisa
    const adminCount = userList.filter((u) => u.role === 'admin').length;
    if (deletingItem.role === 'admin' && adminCount <= 1) {
      showToast('Tidak dapat menghapus satu-satunya akun Administrator!', 'error');
      setDeletingItem(null);
      return;
    }
    await deleteUser(deletingItem.id);
    setDeletingItem(null);
  };

  const roleBadge = (r: UserRole) =>
    r === 'superadmin' ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-900 border border-violet-300">
        <ShieldCheck className="w-3 h-3" />
        Super Admin
      </span>
    ) : r === 'admin' ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
        <Crown className="w-3 h-3" />
        Administrator
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300">
        <User className="w-3 h-3" />
        Pengurus
      </span>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kelola Akun Pengguna
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hanya <strong className="text-violet-700">Super Admin</strong> yang dapat menambah, mengubah, atau menghapus akun pengguna.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={!isSuperAdmin}
          title={!isSuperAdmin ? 'Hanya Super Admin yang dapat menambah pengguna' : 'Tambah pengguna baru'}
          className="min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Info Banner Peran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-900 uppercase tracking-wide">Administrator</div>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              Akses penuh: kelola berita, tim, galeri, aspirasi, dan <strong>kelola akun pengguna</strong>.
            </p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-sky-700" />
          </div>
          <div>
            <div className="text-xs font-black text-sky-900 uppercase tracking-wide">Pengurus</div>
            <p className="text-[11px] text-sky-800 mt-0.5 leading-relaxed">
              Akses terbatas: kelola berita, tim, galeri, dan aspirasi. <strong>Tidak dapat kelola akun pengguna</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-left">
                <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Pengguna
                </th>
                <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Username
                </th>
                <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Peran
                </th>
                <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-500 hidden sm:table-cell">
                  Bergabung
                </th>
                <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-500 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {userList.length > 0 ? (
                userList.map((item) => {
                  const isSelf = item.id === currentUser?.id;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-stone-50 transition-colors ${isSelf ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="px-3 sm:px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 ${item.role === 'admin' ? 'bg-amber-500' : 'bg-sky-500'}`}>
                            {item.namaLengkap.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-max">
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              {item.namaLengkap}
                              {isSelf && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                  Akun Anda
                                </span>
                              )}
                            </div>
                            {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Ditambahkan oleh {item.dibuatOleh || 'Data lama'}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 py-4 whitespace-nowrap">
                        <code className="text-xs bg-stone-100 text-slate-800 px-2 py-1 rounded-lg font-mono">
                          {item.username}
                        </code>
                      </td>
                      <td className="px-5 py-4">{roleBadge(item.role)}</td>
                      <td className="px-5 py-4 text-xs text-slate-500 hidden sm:table-cell">
                        {item.createdAt || 'September 2026'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            disabled={!isSuperAdmin}
                            className="p-2 rounded-xl bg-stone-100 hover:bg-slate-900 hover:text-amber-400 text-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400"
                            title={!isSuperAdmin ? 'Hanya Super Admin yang dapat mengubah pengguna' : 'Edit pengguna'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            disabled={isSelf || !isSuperAdmin}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-400"
                            title={!isSuperAdmin ? 'Hanya Super Admin yang dapat menghapus pengguna' : isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus pengguna'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-slate-400">
                        <Users className="h-7 w-7" />
                      </div>
                      <h3 className="text-lg font-black text-slate-800">Data Tidak Tersedia</h3>
                      <p className="mt-2 text-sm text-slate-500">Belum ada data pengguna yang tersedia.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingId ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
        maxWidth="md"
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
              Nama Lengkap *
            </label>
            <input
              type="text"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Username {!editingId && '*'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="Contoh: budi_pengurus"
              disabled={!!editingId}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed font-mono"
            />
            {editingId && (
              <p className="text-[11px] text-slate-400 mt-1">Username tidak dapat diubah setelah akun dibuat.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {editingId ? 'Password Baru (Kosongkan jika tidak ingin diubah)' : 'Password *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingId ? 'Isi untuk mengubah password' : 'Minimal 6 karakter'}
                className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Peran / Role *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`flex min-w-0 items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${role === 'admin' ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:border-amber-300'}`}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                  className="mt-0.5 shrink-0 accent-amber-500"
                />
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    Administrator
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 break-words">Akses penuh termasuk kelola user</p>
                </div>
              </label>

              <label className={`flex min-w-0 items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${role === 'pengurus' ? 'border-sky-500 bg-sky-50' : 'border-stone-200 hover:border-sky-300'}`}>
                <input
                  type="radio"
                  name="role"
                  value="pengurus"
                  checked={role === 'pengurus'}
                  onChange={() => setRole('pengurus')}
                  className="mt-0.5 shrink-0 accent-sky-500"
                />
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-sky-600" />
                    Pengurus
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 break-words">Kelola konten, tanpa kelola user</p>
                </div>
              </label>

              {isSuperAdmin && (
                <label className={`flex min-w-0 items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${role === 'superadmin' ? 'border-violet-500 bg-violet-50' : 'border-stone-200 hover:border-violet-300'}`}>
                  <input
                    type="radio"
                    name="role"
                    value="superadmin"
                    checked={role === 'superadmin'}
                    onChange={() => setRole('superadmin')}
                    className="mt-0.5 shrink-0 accent-violet-500"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
                      Super Admin
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 break-words">Kelola semua akun pengguna</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl hover:bg-slate-800 shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingId ? 'Simpan Perubahan' : 'Buat Akun Pengguna'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="Konfirmasi Hapus Pengguna"
        maxWidth="sm"
      >
        {deletingItem && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun{' '}
              <strong className="text-slate-900">{deletingItem.namaLengkap}</strong>{' '}
              (<code className="bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">{deletingItem.username}</code>)?
              Tindakan ini tidak dapat dibatalkan.
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
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
