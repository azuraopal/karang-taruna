import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { Logo } from '../common/Logo';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { loginAdmin, setCurrentView } = useData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Mohon isi nama pengguna dan kata sandi pengurus.');
      return;
    }

    const success = await loginAdmin(username, password);
    if (success) {
      setCurrentView('admin');
      setUsername('');
      setPassword('');
      onClose();
    } else {
      setErrorMsg('Nama pengguna atau kata sandi tidak cocok. Silakan coba lagi.');
    }
  };

  const handleUseDemo = () => {
    setUsername('admin');
    setPassword('katar2026');
    setErrorMsg('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Masuk ke Panel Pengurus" maxWidth="md">
      <div className="flex justify-center pb-2">
        <Logo variant="black" className="h-10 w-auto" />
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Intro Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-950">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Akses Khusus Pengurus Harian:</span>
            <p className="mt-0.5 text-amber-900 leading-relaxed">
              Panel ini digunakan untuk memperbarui berita, susunan pengurus, foto galeri, serta meninjau aspirasi warga.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Nama Pengguna
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: admin"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Kata Sandi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Demo Credential Shortcut */}
        {/* <div className="bg-slate-100 rounded-xl p-3 text-xs flex items-center justify-between border border-slate-200">
          <div className="text-slate-600">
            <span className="font-semibold text-slate-800">Akun Demo Pengurus:</span>
            <div className="font-mono text-[11px] text-slate-700">admin / katar2026</div>
          </div>
          <button
            type="button"
            onClick={handleUseDemo}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-lg text-xs shadow-xs transition-colors"
          >
            Gunakan Akun Ini
          </button>
        </div> */}

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md transition-all focus:ring-2 focus:ring-amber-400"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Masuk Panel</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
