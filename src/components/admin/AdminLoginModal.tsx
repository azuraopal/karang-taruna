import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { Logo } from '../common/Logo';
import { getDashboardPath, navigateTo } from '../../utils/appRoute';

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
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Mohon isi nama pengguna dan kata sandi pengurus.');
      return;
    }

    setIsLoading(true);
    const result = await loginAdmin(username, password);
    setIsLoading(false);

    if (result.success) {
      if (result.user) {
        navigateTo(getDashboardPath(result.user.role));
      }
      setCurrentView('admin');
      setUsername('');
      setPassword('');
      onClose();
    } else {
      setErrorMsg(result.error || 'Nama pengguna atau kata sandi tidak cocok. Silakan coba lagi.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Masuk ke Ruang Pengurus" maxWidth="2xl" contentClassName="p-0">
      <div className="grid gap-3 bg-slate-50 p-3 sm:grid-cols-[minmax(15rem,0.82fr)_minmax(20rem,1.18fr)] sm:p-4">
        <motion.aside
          initial={{ opacity: 0, x: -18, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="login-gateway relative hidden min-h-64 overflow-hidden rounded-2xl bg-slate-950 p-6 text-white sm:flex sm:min-h-[27rem] sm:p-7"
        >
          <div className="login-gateway__grid" aria-hidden="true" />
          <div className="login-gateway__orbit login-gateway__orbit--one" aria-hidden="true" />
          <div className="login-gateway__orbit login-gateway__orbit--two" aria-hidden="true" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <Logo variant="white" className="h-9 w-auto" />
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] font-bold text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Pengurus
              </span>
            </div>
            <div className="mt-auto max-w-xs pt-12 sm:pt-16">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">Karang Taruna Margabakti 07</p>
              <h3 className="mt-3 text-[1.7rem] font-black leading-[1.04] tracking-tight">Ruang bersama untuk gerak warga.</h3>
              <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-slate-300">Kelola informasi, agenda, dan dokumentasi sesuai peran akun Anda.</p>
            </div>
          </div>
        </motion.aside>

        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
          className="flex flex-col justify-center px-5 py-5 sm:px-8 sm:py-9"
        >
          <div className="mb-4 sm:hidden">
            <Logo variant="black" className="h-5 w-auto" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-700">Akses Akun</p>
            <h3 className="mt-1.5 text-2xl font-black tracking-tight text-slate-950">Mulai Berkontribusi.</h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-600">Masuk dengan akun pengurus yang terdaftar.</p>
          </div>

          {errorMsg && (
            <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mt-5 space-y-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Nama Pengguna</label>
              <div className="relative">
                <User className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3.5 h-4 w-4 text-slate-400" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Contoh: admin atau pengurus" className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-300/60" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Kata Sandi</label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3.5 h-4 w-4 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-300/60" />
                <button type="button" onClick={() => setShowPassword((isVisible) => !isVisible)} className="absolute inset-y-0 right-0 mr-2.5 inline-flex w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <motion.button type="submit" disabled={isLoading} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} className="inline-flex min-h-12 min-w-32 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-amber-300 shadow-lg shadow-slate-900/14 transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50">
              <span>{isLoading ? 'Memproses...' : 'Login'}</span><ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.form>
      </div>
    </Modal>
  );
};
