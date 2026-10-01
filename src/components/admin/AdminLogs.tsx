import React, { useMemo, useState } from 'react';
import { Activity, Filter } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { ActivityAction } from '../../types';

const actionLabels: Record<ActivityAction, string> = {
  login: 'Login',
  tambah: 'Tambah',
  ubah: 'Ubah',
  hapus: 'Hapus',
  status: 'Status',
};

const actionColors: Record<ActivityAction, string> = {
  login: 'bg-sky-100 text-sky-800',
  tambah: 'bg-emerald-100 text-emerald-800',
  ubah: 'bg-amber-100 text-amber-800',
  hapus: 'bg-rose-100 text-rose-800',
  status: 'bg-violet-100 text-violet-800',
};

export const AdminLogs: React.FC = () => {
  const { activityLogs } = useData();
  const [actionFilter, setActionFilter] = useState<'semua' | ActivityAction>('semua');

  const filteredLogs = useMemo(
    () => actionFilter === 'semua'
      ? activityLogs
      : activityLogs.filter((log) => log.action === actionFilter),
    [actionFilter, activityLogs]
  );

  const formatDate = (value: string) => new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Log Aktivitas</h2>
          <p className="text-xs text-slate-500 mt-0.5">Riwayat tindakan pengguna di panel pengurus.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span className="sr-only">Filter aksi</span>
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value as 'semua' | ActivityAction)}
              className="bg-transparent focus:outline-none"
            >
              <option value="semua">Semua aksi</option>
              {Object.entries(actionLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <Activity className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-black text-slate-800">Belum ada aktivitas</h3>
            <p className="text-xs text-slate-500 mt-1">Aktivitas pengguna akan tampil di sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 sm:px-5 flex items-start gap-3 hover:bg-stone-50">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${actionColors[log.action]}`}>
                      {actionLabels[log.action]}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">{log.entity}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mt-1 break-words">{log.description}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Oleh <strong className="text-slate-700">{log.actorName}</strong> · {formatDate(log.createdAt)} WIB
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
