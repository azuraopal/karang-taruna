import { motion, useReducedMotion } from 'framer-motion';
import { Check, CheckCircle2, HeartPulse, Mail, Save, Trash2, UserRound, XCircle } from 'lucide-react';
import { ATTENDANCE_LABELS, type AttendanceStatus } from '../../utils/attendance';
interface Props {
  nama: string; jabatan?: string; divisi: string; tanggal: string; status: AttendanceStatus | ''; saving: boolean; error: string; existing: boolean;
  onStatus: (value: AttendanceStatus) => void; onSave: () => void; onDelete: () => void; onCancel: () => void;
}
const options = [
  { value: 'hadir', icon: CheckCircle2, color: 'text-emerald-600' },
  { value: 'izin', icon: Mail, color: 'text-sky-600' },
  { value: 'sakit', icon: HeartPulse, color: 'text-amber-600' },
  { value: 'alpa', icon: XCircle, color: 'text-rose-600' },
] as const;
export function AttendanceEditor(props: Props) {
  const reduced = useReducedMotion();
  return <form onSubmit={event => { event.preventDefault(); props.onSave(); }} className="space-y-5">
    <div className="flex items-start gap-3 border-b border-stone-100 pb-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700"><UserRound className="h-5 w-5" /></span><div className="min-w-0"><p className="break-words font-bold text-slate-900">{props.nama}</p><p className="mt-1 text-xs text-slate-600">Jabatan: {props.jabatan?.trim() || 'Belum Diisi'}</p><p className="mt-1 text-xs text-slate-500">{props.divisi} · {props.tanggal}</p></div></div>
    <fieldset disabled={props.saving}><legend className="mb-3 text-sm font-bold text-slate-800">Pilih status</legend><div className="grid grid-cols-2 gap-2.5">{options.map(({ value, icon: Icon, color }) => <motion.label key={value} whileTap={reduced ? undefined : { scale: 0.98 }} className={`relative flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border px-3 transition-colors ${props.status === value ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-stone-200 hover:bg-stone-50'} ${props.saving ? 'opacity-50' : ''}`}><input type="radio" name="attendance-status" required value={value} checked={props.status === value} onChange={() => props.onStatus(value)} className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" /><Icon className={`h-5 w-5 shrink-0 ${color}`} /><span className="text-sm font-semibold">{ATTENDANCE_LABELS[value]}</span><span className="pointer-events-none absolute inset-0 rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400" />{props.status === value && <Check className="ml-auto h-4 w-4 text-slate-700" />}</motion.label>)}</div></fieldset>
    {props.error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{props.error}</p>}
    <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
      {props.existing && <button type="button" disabled={props.saving} onClick={props.onDelete} className="mr-auto inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-rose-700 disabled:opacity-50"><Trash2 className="h-4 w-4" />Hapus catatan</button>}
      <button type="button" disabled={props.saving} onClick={props.onCancel} className="ml-auto min-h-11 rounded-lg px-3 text-sm font-semibold text-slate-600 disabled:opacity-50">Batal</button>
      <button type="submit" disabled={props.saving || !props.status} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-amber-300 disabled:opacity-50"><Save className="h-4 w-4" />{props.saving ? 'Menyimpan...' : 'Simpan Absensi'}</button>
    </div>
  </form>;
}
