import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardList, Eye, FileText, LayoutList, LoaderCircle, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { AdminAbsensi } from './AdminAbsensi';
import { emptyMeetingDetails, type Meeting, type MeetingDetails } from '../../utils/meeting';
import { attendanceRequest } from '../../utils/attendanceClient';
import type { AttendanceRecord } from '../../utils/attendance';
import type { PdfMember } from '../../utils/attendancePdf';

const PdfPreviewDialog = lazy(() => import('../common/PdfPreviewDialog').then(module => ({ default: module.PdfPreviewDialog })));

const fieldClass = 'mt-1.5 min-h-11 w-full min-w-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-60';
const tabs = [{ id: 'summary', label: 'Ringkasan', icon: LayoutList }, { id: 'attendance', label: 'Absensi', icon: ClipboardList }, { id: 'minutes', label: 'Notulensi', icon: FileText }] as const;

export function MeetingDetail({ meeting, onBack, onSaved }: { meeting: Meeting; onBack: () => void; onSaved: (meeting: Meeting) => void }) {
  const [saved, setSaved] = useState(() => ({ ...emptyMeetingDetails(), ...meeting.details }));
  const [draft, setDraft] = useState<MeetingDetails>(saved);
  const [tab, setTab] = useState<typeof tabs[number]['id']>('summary');
  const [topicTitle, setTopicTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [report, setReport] = useState<Uint8Array | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  const mounted = useRef(true);
  const reduced = useReducedMotion();
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const frozen = busy || saved.minutesStatus === 'final';
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    if (dirty) window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [dirty]);
  const update = (change: Partial<MeetingDetails>) => { setDraft(previous => ({ ...previous, ...change })); setNotice(''); };
  async function save(status: 'draft' | 'final') {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(`/api/agenda/${encodeURIComponent(meeting.id)}`, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...draft, minutesStatus: status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal Menyimpan Rapat.');
      if (!result.details || result.id !== meeting.id) throw new Error('Respons Rapat Tidak Valid.');
      if (!mounted.current) return;
      setSaved(result.details); setDraft(result.details); onSaved(result);
      setNotice(status === 'final' ? 'Notulensi Berhasil Difinalisasi.' : 'Draft Rapat Berhasil Disimpan.');
    } catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : 'Gagal Menyimpan.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function reload() {
    if (lock.current || (dirty && !window.confirm('Muat ulang akan mengganti perubahan yang belum disimpan. Lanjutkan?'))) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const response = await fetch(`/api/agenda/${encodeURIComponent(meeting.id)}`, { credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal Memuat Rapat.');
      if (result.id !== meeting.id) throw new Error('Respons Rapat Tidak Valid.');
      if (!mounted.current) return;
      const details = { ...emptyMeetingDetails(), ...result.details };
      setSaved(details); setDraft(details); onSaved(result); setNotice('Rapat Berhasil Dimuat Ulang.');
    } catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : 'Gagal Memuat Rapat.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function exportPdf() {
    if (pdfBusy || dirty) return;
    setPdfBusy(true); setError('');
    try {
      const data = await attendanceRequest<{ members: PdfMember[]; records: AttendanceRecord[] }>(`/api/agenda/${encodeURIComponent(meeting.id)}/attendance`);
      const { exportMeetingReportPdf } = await import('../../utils/meetingReportPdf');
      const bytes = await exportMeetingReportPdf({ ...meeting, details: saved }, data.members, data.records);
      if (mounted.current) setReport(bytes);
    } catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : 'Gagal Membuat PDF.'); }
    finally { if (mounted.current) setPdfBusy(false); }
  }
  function addTopic(event: React.FormEvent) {
    event.preventDefault();
    if (!topicTitle.trim() || draft.topics.length >= 100) return;
    update({ topics: [...draft.topics, { id: crypto.randomUUID(), title: topicTitle.trim(), discussion: '', decision: '', owner: '', dueDate: '' }] });
    setTopicTitle('');
  }
  const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${meeting.date}T00:00:00Z`));
  return <section className="space-y-5">
    <button type="button" disabled={busy || pdfBusy} onClick={() => { if (!dirty || window.confirm('Ada perubahan yang belum disimpan. Kembali ke daftar rapat?')) onBack(); }} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-500"><ArrowLeft className="h-4 w-4" />Kembali Ke Daftar Rapat</button>
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words text-xl font-black text-slate-900 sm:text-2xl">{meeting.title}</h2><p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500"><CalendarDays className="h-4 w-4" />{date}{draft.time && <span>· {draft.time} WIB</span>}<span className={`rounded-full px-2 py-1 font-semibold ${saved.minutesStatus === 'final' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{saved.minutesStatus === 'final' ? 'Notulensi Final' : 'Notulensi Draft'}</span></p></div><button type="button" disabled={busy} onClick={() => void reload()} aria-label="Muat Ulang Rapat" title="Muat Ulang Rapat" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-slate-500"><RefreshCw className="h-4 w-4" /></button></div>
    <div role="tablist" aria-label="Detail Rapat" className="flex gap-1 border-b border-stone-200">{tabs.map(({ id, label, icon: Icon }) => <button type="button" key={id} id={`meeting-tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`meeting-panel-${id}`} onClick={() => setTab(id)} className={`relative inline-flex min-h-12 flex-1 items-center justify-center gap-2 px-2 text-xs font-semibold sm:flex-none sm:px-5 ${tab === id ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'}`}><Icon className="h-4 w-4 shrink-0" />{label}{tab === id && <motion.span layoutId="meeting-tab-indicator" transition={{ duration: reduced ? 0 : 0.2 }} className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-600" />}</button>)}</div>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />{notice}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-semibold text-slate-500"><FileText className="h-4 w-4" />Absensi &amp; Notulensi</span><button type="button" disabled={dirty || busy || pdfBusy} onClick={() => void exportPdf()} title={dirty ? 'Simpan Perubahan Sebelum Membuka Pratinjau' : 'Pratinjau Laporan Rapat'} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-40">{pdfBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}{pdfBusy ? 'Menyiapkan PDF...' : 'Pratinjau PDF'}</button></div>
    <div id={`meeting-panel-${tab}`} role="tabpanel" aria-labelledby={`meeting-tab-${tab}`}>
      {tab === 'attendance' ? <AdminAbsensi hidePdfExport agendaId={meeting.id} agendaTitle={meeting.title} agendaDate={meeting.date} /> : <div className="space-y-5">
        {tab === 'summary' && <fieldset disabled={frozen} className="grid gap-4 sm:grid-cols-2">{(['location', 'time', 'leader', 'noteTaker'] as const).map((key, index) => <label key={key} className="min-w-0 text-xs font-semibold text-slate-600">{['Lokasi', 'Waktu Rapat (WIB)', 'Pemimpin Rapat', 'Notulis'][index]}<input type={key === 'time' ? 'time' : 'text'} value={draft[key]} maxLength={200} onChange={e => update({ [key]: e.target.value })} className={fieldClass} /></label>)}</fieldset>}
        <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-slate-800">{tab === 'summary' ? 'Agenda Pembahasan' : 'Hasil Pembahasan'} <span className="ml-1 text-xs font-normal text-slate-400">{draft.topics.length} Topik</span></h3></div>
        {!draft.topics.length && <p className="rounded-lg border border-dashed border-stone-300 py-8 text-center text-sm text-slate-500">Belum Ada Topik Pembahasan.</p>}
        <div className="space-y-3">{draft.topics.map((topic, index) => <div key={topic.id} className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5"><div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">{index + 1}</span><label className="min-w-0 flex-1"><span className="sr-only">Judul Topik {index + 1}</span>{frozen ? <span className="block break-words py-1 text-sm font-bold text-slate-900">{topic.title}</span> : <input value={topic.title} maxLength={200} onChange={e => update({ topics: draft.topics.map(t => t.id === topic.id ? { ...t, title: e.target.value } : t) })} className="min-h-8 w-full border-b border-transparent bg-transparent text-sm font-bold text-slate-900 focus:border-stone-300 focus:outline-none" />}</label>{!frozen && <button type="button" onClick={() => { if ((!topic.discussion && !topic.decision) || window.confirm('Hapus topik dan hasil pembahasannya?')) update({ topics: draft.topics.filter(t => t.id !== topic.id) }); }} title="Hapus Topik" aria-label={`Hapus Topik ${index + 1}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>}</div>
          {tab === 'minutes' && (saved.minutesStatus === 'final' ? <div className="mt-4 space-y-4"><div><h4 className="mb-2 text-xs font-semibold text-slate-500">Hasil Pembahasan</h4><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{topic.discussion || '-'}</p></div>{topic.decision && <div><h4 className="mb-2 text-xs font-semibold text-slate-500">Keputusan / Tindak Lanjut</h4><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{topic.decision}</p></div>}{(topic.owner || topic.dueDate) && <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-stone-100 pt-3 text-xs text-slate-500">{topic.owner && <p>Penanggung Jawab: <strong className="font-semibold text-slate-700">{topic.owner}</strong></p>}{topic.dueDate && <p>Tenggat: <strong className="font-semibold text-slate-700">{topic.dueDate}</strong></p>}</div>}</div> : <fieldset disabled={frozen} className="mt-4 grid gap-4"><label className="text-xs font-semibold text-slate-600">Hasil Pembahasan<textarea aria-label="Hasil Pembahasan" value={topic.discussion} maxLength={10000} rows={4} onChange={e => update({ topics: draft.topics.map(t => t.id === topic.id ? { ...t, discussion: e.target.value } : t) })} className={`${fieldClass} resize-y leading-relaxed`} /></label><label className="text-xs font-semibold text-slate-600">Keputusan / Tindak Lanjut<textarea aria-label="Keputusan / Tindak Lanjut" value={topic.decision} maxLength={10000} rows={2} onChange={e => update({ topics: draft.topics.map(t => t.id === topic.id ? { ...t, decision: e.target.value } : t) })} className={`${fieldClass} resize-y leading-relaxed`} /></label><div className="grid gap-3 sm:grid-cols-2"><label className="min-w-0 text-xs font-semibold text-slate-600">Penanggung Jawab<input value={topic.owner} maxLength={200} onChange={e => update({ topics: draft.topics.map(t => t.id === topic.id ? { ...t, owner: e.target.value } : t) })} className={fieldClass} /></label><label className="min-w-0 text-xs font-semibold text-slate-600">Tenggat<input type="date" value={topic.dueDate} onChange={e => update({ topics: draft.topics.map(t => t.id === topic.id ? { ...t, dueDate: e.target.value } : t) })} className={fieldClass} /></label></div></fieldset>)}
        </div>)}</div>
        {!frozen && draft.topics.length < 100 && <form onSubmit={addTopic} className="flex flex-col gap-2 sm:flex-row"><label className="min-w-0 flex-1"><span className="sr-only">Topik Baru</span><input required value={topicTitle} maxLength={200} onChange={e => setTopicTitle(e.target.value)} placeholder="Tambah topik pembahasan..." className={fieldClass} /></label><button type="submit" className="mt-1.5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-xs font-semibold text-slate-700"><Plus className="h-4 w-4" />Tambah Topik</button></form>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4"><span role="status" className="text-xs text-slate-500">{dirty ? 'Ada Perubahan Belum Disimpan' : saved.minutesStatus === 'final' ? 'Notulensi Sudah Final' : 'Draft Tersimpan'}</span><div className="flex flex-wrap gap-2">{saved.minutesStatus === 'final' ? <button type="button" disabled={busy} onClick={() => void save('draft')} className="min-h-11 rounded-lg border border-stone-200 bg-white px-4 text-xs font-semibold">Buka Kembali Sebagai Draft</button> : <><button type="button" disabled={busy || !draft.topics.length || dirty} onClick={() => { if (window.confirm('Finalisasi notulensi rapat ini?')) void save('final'); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-slate-600 disabled:opacity-40"><CheckCircle2 className="h-4 w-4" />Finalisasi</button><button type="button" disabled={busy || !dirty} onClick={() => void save('draft')} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-amber-300 disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Simpan Draft</button></>}</div></div>
      </div>}
    </div>
    {report && <Suspense fallback={<p role="status" className="text-sm text-slate-500">Memuat Pratinjau...</p>}><PdfPreviewDialog bytes={report} filename={`laporan-rapat-${meeting.date}-${meeting.id}.pdf`} onClose={() => setReport(null)} /></Suspense>}
  </section>;
}
