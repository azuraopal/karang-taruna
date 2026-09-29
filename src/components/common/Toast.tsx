import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useData();

  return (
    <div
      className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      aria-label="Pemberitahuan Sistem"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg text-sm font-medium ${
                isSuccess
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : isError
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-700" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-700" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-slate-700" />}
              </div>

              <div className="flex-1 pr-1 leading-snug break-words">
                {toast.pesan}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 -mr-1 -mt-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-black/5 transition-colors focus:ring-2 focus:ring-slate-600 focus:outline-none"
                aria-label="Tutup pemberitahuan"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
