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
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Mohon isi nama pengguna dan kata sandi pengurus.');
      return;
    }

    setIsLoading(true);
    const success = await loginAdmin(username, password);
    setIsLoading(false);

    if (success) {
      setCurrentView('admin');
      setUsername('');
      setPassword('');
      onClose();
    } else {
      setErrorMsg('Nama pengguna atau kata sandi tidak cocok. Silakan coba lagi.');
    }
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
            <span className="font-bold">Akses Pengurus Margabakti 07:</span>
            <p className="mt-0.5 text-amber-900 leading-relaxed font-subtitle">
              Masuk sesuai hak akses akun Anda untuk mengelola konten warta, pengurus, galeri, aspirasi, dan data pengguna.
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
            Nama Pengguna (Username)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: admin atau pengurus"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Kata Sandi (Password)
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
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md transition-all focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Memproses...' : 'Masuk Panel'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
