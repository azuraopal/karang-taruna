import { useEffect, useRef, useState } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardList, RefreshCw } from 'lucide-react';
import { Modal } from '../common/Modal';
import { AttendanceTable } from './AttendanceTable';
import { AttendanceEditor } from './AttendanceEditor';
import { AttendancePdfControls } from './AttendancePdfControls';
import { attendanceRequest } from '../../utils/attendanceClient';
import { isAttendanceDate, isAttendanceStatus, type AttendanceRecord, type AttendanceStatus } from '../../utils/attendance';
import type { AnggotaTim } from '../../types';

interface DayData { members: AnggotaTim[]; records: AttendanceRecord[] }
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function AdminAbsensi({ agendaId, agendaTitle, agendaDate, onBack, hidePdfExport }: { agendaId?: string; agendaTitle?: string; agendaDate?: string; onBack?: () => void; hidePdfExport?: boolean } = {}) {
  const reduced = useReducedMotion();
  const [tanggal, setTanggal] = useState(agendaDate || today);
  const [data, setData] = useState<DayData>({ members: [], records: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<AnggotaTim | null>(null);
  const [status, setStatus] = useState<AttendanceStatus | ''>('');
  const [saving, setSaving] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const savingRef = useRef(false);
  const mounted = useRef(true);
  const attendancePath = agendaId ? `/api/agenda/${encodeURIComponent(agendaId)}/attendance` : `/api/absensi/${tanggal}`;
  useEffect(() => { if (agendaDate) { setTanggal(agendaDate); setData({ members: [], records: [] }); setLoading(true); setError(''); } }, [agendaDate]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    const abort = new AbortController();
    if (!isAttendanceDate(tanggal)) return;
    attendanceRequest<DayData>(attendancePath, { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) setData(result); })
      .catch(reason => { if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : 'Gagal memuat absensi.'); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [tanggal, revision, attendancePath]);

  const reload = (nextDate = tanggal) => {
    setData({ members: [], records: [] });
    setError(isAttendanceDate(nextDate) ? '' : 'Pilih tanggal yang valid.');
    setLoading(isAttendanceDate(nextDate));
    setTanggal(nextDate); setEditing(null); setNotice('');
    setRevision(value => value + 1);
  };
  const openEditor = (member: AnggotaTim) => {
    if (pdfBusy) return;
    setEditing(member);
    setStatus(data.records.find(record => record.anggotaId === member.id)?.status || '');
    setFormError(''); setNotice('');
  };
  const save = async (remove = false) => {
    if (!editing || savingRef.current) return;
    if (!remove && !isAttendanceStatus(status)) { setFormError('Pilih status: izin, hadir, sakit, atau alpa.'); return; }
    if (remove && !window.confirm(`Hapus catatan ${editing.nama} pada ${tanggal}?`)) return;
    savingRef.current = true; setSaving(true); setFormError('');
    try {
      const record = await attendanceRequest<AttendanceRecord>(`${attendancePath}/${encodeURIComponent(editing.id)}`, {
        method: remove ? 'DELETE' : 'PUT', ...(remove ? {} : { body: JSON.stringify({ status }) }),
      });
      if (!mounted.current) return;
      setData(previous => ({ ...previous, records: [...previous.records.filter(item => item.anggotaId !== editing.id), ...(remove ? [] : [record])] }));
      setEditing(null);
      setNotice(remove ? 'Catatan absensi berhasil dihapus.' : 'Absensi berhasil disimpan.');
    } catch (reason) {
      if (mounted.current) setFormError(reason instanceof Error ? reason.message : 'Gagal menyimpan absensi.');
    } finally { savingRef.current = false; if (mounted.current) setSaving(false); }
  };
  const memberIds = new Set(data.members.map(member => member.id));
  const validRecords = data.records.filter(record => memberIds.has(record.anggotaId));
  const recorded = validRecords.length;
  const progress = data.members.length ? Math.round(recorded / data.members.length * 100) : 0;
  const summary = [
    { label: 'Hadir', value: validRecords.filter(r => r.status === 'hadir').length, color: 'text-emerald-600' },
    { label: 'Izin', value: validRecords.filter(r => r.status === 'izin').length, color: 'text-sky-600' },
    { label: 'Sakit', value: validRecords.filter(r => r.status === 'sakit').length, color: 'text-amber-600' },
    { label: 'Alpa', value: validRecords.filter(r => r.status === 'alpa').length, color: 'text-rose-600' },
  ];
  return <MotionConfig reducedMotion="user"><motion.section initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
    {onBack && <button type="button" disabled={saving || pdfBusy} onClick={onBack} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-40"><ArrowLeft className="h-4 w-4" />Kembali Ke Agenda</button>}
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="mb-1 flex items-center gap-2 text-xs font-semibold text-emerald-700"><ClipboardList className="h-4 w-4" />Absensi Anggota</p><h2 className="break-words text-xl font-black text-slate-900 sm:text-2xl">{agendaTitle || 'Catatan Kehadiran'}</h2><p className="mt-1 text-sm text-slate-500">Kehadiran dan rekap anggota pada tanggal terpilih.</p></div><button type="button" disabled={saving || pdfBusy || loading} onClick={() => reload()} title="Muat Ulang Absensi" aria-label="Muat Ulang Absensi" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-slate-500 hover:text-slate-900 disabled:opacity-40"><RefreshCw className="h-4 w-4" /></button></div>
    <div className="flex flex-col gap-4 border-y border-stone-200 py-4 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex items-center gap-2 text-sm text-slate-600"><CalendarDays className="h-4 w-4 text-slate-400" /><span className="sr-only">Tanggal Absensi</span>{agendaDate ? <time dateTime={agendaDate} className="font-semibold text-slate-800">{new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${agendaDate}T00:00:00Z`))}</time> : <input type="date" required min="0001-01-01" max="9999-12-31" disabled={saving || pdfBusy} value={tanggal} onChange={event => reload(event.target.value)} className="min-h-11 min-w-0 rounded-lg border border-stone-200 bg-white px-3 text-slate-900" />}</label>
      {!loading && !error && <div className="w-full sm:w-52"><p className="mb-2 flex justify-between text-xs text-slate-500"><span>{recorded} / {data.members.length} Sudah Dicatat</span><span className="font-semibold text-emerald-700">{progress}%</span></p><div role="progressbar" aria-label="Progres Pencatatan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-1.5 overflow-hidden rounded-full bg-stone-200"><motion.div initial={false} animate={{ scaleX: progress / 100 }} className="h-full origin-left rounded-full bg-emerald-500" /></div></div>}
    </div>
    {!loading && !error && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{summary.map(item => <div key={item.label} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3"><span className="flex items-center gap-2 text-xs font-semibold text-slate-500"><i className={`h-2 w-2 rounded-full bg-current ${item.color}`} />{item.label}</span><span className={`text-xl font-bold tabular-nums ${item.color}`}>{item.value}</span></div>)}</div>}
    <AttendancePdfControls hideExport={hidePdfExport} attendancePath={attendancePath} exportOptions={{ meetingTitle: agendaTitle, meetingId: agendaId }} tanggal={tanggal} members={data.members} records={data.records} disabled={saving || loading || !!error || !!editing} onBusy={setPdfBusy} lockedDate={!!agendaDate} onChooseDate={next => { if (!agendaDate) reload(next); }} onRefetch={async () => {
      try { const result = await attendanceRequest<DayData>(attendancePath); if (mounted.current) { setData(result); setError(''); } }
      catch (reason) { if (mounted.current) { setData({ members: [], records: [] }); setError(reason instanceof Error ? reason.message : 'Gagal memuat ulang.'); } throw reason; }
    }} />
    {notice && <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</p>}
    <AttendanceTable {...data} loading={loading} error={error} disabled={saving || pdfBusy} onRetry={() => reload()} onEdit={openEditor} />
    <Modal isOpen={!!editing} onClose={() => { if (!savingRef.current) setEditing(null); }} title="Catat Kehadiran" maxWidth="md">
      {editing && <AttendanceEditor nama={editing.nama} jabatan={editing.jabatan} divisi={editing.divisi} tanggal={tanggal} status={status} saving={saving} error={formError} existing={data.records.some(record => record.anggotaId === editing.id)} onStatus={setStatus} onSave={() => void save()} onDelete={() => void save(true)} onCancel={() => setEditing(null)} />}
    </Modal>
  </motion.section></MotionConfig>;
}
