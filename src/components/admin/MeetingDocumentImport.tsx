import { useEffect, useRef, useState } from 'react';
import { FileUp, LoaderCircle, ScanText, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { emptyMeetingDetails, type Meeting } from '../../utils/meeting';
import { matchDocumentMembers, validateDocument, type MeetingDocument } from '../../utils/meetingDocument';
import { ATTENDANCE_LABELS, type AttendanceStatus } from '../../utils/attendance';

interface ImportContext { meeting: Meeting; members: { id: string; nama: string }[]; attendanceVersion: string }
const field = 'mt-1 min-h-11 w-full min-w-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm';
async function documentRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(110000) });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || 'Permintaan Dokumen Gagal.');
  return data;
}
export function MeetingDocumentImport({ meeting, onClose, onImported }: { meeting: Meeting; onClose: () => void; onImported: (meeting: Meeting) => void }) {
  const [document, setDocument] = useState<MeetingDocument | null>(null);
  const [context, setContext] = useState<ImportContext | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [filename, setFilename] = useState('');
  const [useDate, setUseDate] = useState(false);
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [includeMinutes, setIncludeMinutes] = useState(true);
  const [reviewed, setReviewed] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function detect(file: File) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setDocument(null); setReviewed(false); setUseDate(false); setFilename(file.name); setProgress('Membaca Dokumen...');
    try {
      if (file.size > 8 * 1024 * 1024) throw Error('PDF Maksimal 8 MB.');
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { readMeetingDocumentMetadata, renderMeetingDocumentPages } = await import('../../utils/meetingDocumentPdf');
      let detected = await readMeetingDocumentMetadata(bytes);
      let method = 'Data PDF Aplikasi';
      if (!detected) {
        const config = await documentRequest<{ enabled: boolean }>('/api/agenda/document-ai');
        if (!config.enabled) throw Error('AI Pembaca PDF Eksternal/Scan Belum Diaktifkan. Administrator Perlu Mengisi Konfigurasi AI Server. PDF Ekspor Aplikasi Versi Terbaru Tetap Bisa Diimpor.');
        const pages = await renderMeetingDocumentPages(bytes, (page, total) => { if (mounted.current) setProgress(`Membaca Halaman ${page} Dari ${total}...`); });
        if (mounted.current) setProgress('AI Sedang Mendeteksi Absensi Dan Notulensi...');
        detected = validateDocument(await documentRequest(`/api/agenda/${encodeURIComponent(meeting.id)}/document-detect`, { method: 'POST', body: JSON.stringify({ pages }) }));
        method = 'Deteksi AI';
      }
      if (detected.sourceMeetingId && detected.sourceMeetingId !== meeting.id) throw Error('PDF Ekspor Ini Berasal Dari Rapat Lain. Buka Rapat Asalnya Untuk Mengimpor.');
      const snapshot = await documentRequest<ImportContext>(`/api/agenda/${encodeURIComponent(meeting.id)}/import-context`);
      if (snapshot.meeting?.id !== meeting.id || !Array.isArray(snapshot.members) || typeof snapshot.attendanceVersion !== 'string') throw Error('Data Rapat Tidak Valid.');
      if (!mounted.current) return;
      setDocument(matchDocumentMembers(detected, snapshot.members)); setContext(snapshot); setSource(method);
      setIncludeMinutes(!!detected.details && snapshot.meeting.details?.minutesStatus !== 'final'); setIncludeAttendance(detected.attendance.length > 0);
    } catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : 'Gagal Membaca Dokumen.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  const records = includeAttendance ? (document?.attendance || []).filter(row => row.status !== null) : [];
  const unmatched = records.some(row => !row.anggotaId);
  const duplicated = new Set(records.map(row => row.anggotaId)).size !== records.length;
  const mismatch = !!document?.date && document.date !== meeting.date;
  const dateReady = !!document?.date || useDate;
  const canImport = document && context && reviewed && !busy && !mismatch && dateReady && !unmatched && !duplicated && (records.length > 0 || (includeMinutes && !!document.details));
  async function confirm() {
    if (!canImport || !document || !context || lock.current) return;
    lock.current = true; setBusy(true); setError(''); setProgress('Menyimpan Absensi Dan Notulensi...');
    try {
      const revision = context.meeting.details?.revision || 0;
      const previous = { ...emptyMeetingDetails(), ...context.meeting.details };
      const details = includeMinutes && document.details ? { ...previous, ...document.details, revision, minutesStatus: 'draft', topics: document.details.topics.length ? document.details.topics : previous.topics,
        location: document.details.location || previous.location, time: document.details.time || previous.time, leader: document.details.leader || previous.leader, noteTaker: document.details.noteTaker || previous.noteTaker,
      } : null;
      const result = await documentRequest<Meeting>(`/api/agenda/${encodeURIComponent(meeting.id)}/document-import`, { method: 'POST', body: JSON.stringify({ confirmed: true, date: document.date || meeting.date, revision, attendanceVersion: context.attendanceVersion, details, attendance: records.map(row => ({ anggotaId: row.anggotaId, status: row.status })) }) });
      if (result.id !== meeting.id || !result.details) throw Error('Respons Impor Tidak Valid. Muat Ulang Rapat Untuk Memeriksa Hasil.');
      if (mounted.current) onImported(result);
    } catch (reason) { if (mounted.current) { setReviewed(false); setError(reason instanceof Error ? reason.message : 'Impor Gagal.'); } }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  return <Modal isOpen title="Impor Dokumen Rapat" maxWidth="2xl" onClose={() => { if (!lock.current) onClose(); }}>
    <div className="space-y-5">
      <div className="border-b border-stone-200 pb-4"><p className="text-xs text-slate-500">Rapat Tujuan</p><h3 className="mt-1 break-words text-base font-bold text-slate-900">{meeting.title}</h3><p className="mt-1 text-sm text-slate-500">{meeting.date}</p></div>
      {!document && !busy && <div className="space-y-3 py-4 text-center"><FileUp className="mx-auto h-9 w-9 text-emerald-600" /><p className="text-sm font-semibold text-slate-800">PDF Absensi, Notulensi, Atau Keduanya</p><p className="text-xs leading-relaxed text-slate-500">Satu rapat per file, maksimal 8 MB. PDF eksternal dan hasil scan diproses oleh layanan AI yang dikonfigurasi organisasi.</p></div>}
      <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" aria-label="Pilih Dokumen Rapat" disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void detect(file); }} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold disabled:opacity-40"><ScanText className="h-4 w-4" />{document ? 'Pilih Ulang Dokumen' : 'Pilih PDF Dan Deteksi'}</button>
      {busy && <p role="status" className="flex items-center gap-2 text-sm text-emerald-700"><LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" />{progress}</p>}
      {error && <p role="alert" className="whitespace-pre-wrap rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {document && context && <fieldset disabled={busy} className="min-w-0 space-y-5">
        <div className="space-y-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900"><p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 shrink-0" />{source}</p><p className="break-all text-xs">{filename}</p><p>{document.title || 'Judul Tidak Terdeteksi'}</p><p>Tanggal Dokumen: <strong>{document.date || 'Tidak Terdeteksi'}</strong></p><p>{document.attendance.length} Baris Absensi · {document.details?.topics.length || 0} Topik Notulensi</p></div>
        {mismatch && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">Tanggal PDF berbeda dengan rapat tujuan. Buka rapat tanggal {document.date} untuk mengimpor dokumen ini.</p>}
        {!document.date && <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={useDate} onChange={event => setUseDate(event.target.checked)} className="mt-1 h-4 w-4" />Saya memastikan dokumen ini untuk rapat tanggal {meeting.date}.</label>}
        {!!document.warnings.length && <ul className="list-inside list-disc space-y-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{document.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>}
        {!!document.attendance.length && <section className="space-y-3"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={includeAttendance} onChange={event => setIncludeAttendance(event.target.checked)} className="h-4 w-4" />Impor Absensi</label>{includeAttendance && <><p className="text-xs text-slate-500">Status yang dipilih mengganti catatan anggota tersebut. Baris Belum Dicatat dan anggota lain tetap tersimpan.</p><div className="max-h-80 space-y-3 overflow-auto">{document.attendance.map((row, index) => <div key={index} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-2"><p className="break-words text-sm font-semibold sm:col-span-2">{index + 1}. {row.name}{row.page > 0 && <span className="ml-2 text-xs font-normal text-slate-500">Halaman {row.page}</span>}</p><label className="min-w-0 text-xs text-slate-500">Anggota<select aria-label={`Anggota Baris ${index + 1}`} value={row.anggotaId || ''} onChange={event => { setReviewed(false); setDocument({ ...document, attendance: document.attendance.map((r, i) => i === index ? { ...r, anggotaId: event.target.value || undefined } : r) }); }} className={field}><option value="">Pilih Anggota</option>{context.members.map(member => <option key={member.id} value={member.id}>{member.nama}</option>)}</select></label><label className="min-w-0 text-xs text-slate-500">Status<select aria-label={`Status Baris ${index + 1}`} value={row.status || ''} onChange={event => { setReviewed(false); setDocument({ ...document, attendance: document.attendance.map((r, i) => i === index ? { ...r, status: event.target.value ? event.target.value as AttendanceStatus : null } : r) }); }} className={field}><option value="">Belum Dicatat</option>{Object.entries(ATTENDANCE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>)}</div>{(unmatched || duplicated) && <p role="alert" className="text-xs text-rose-700">Cocokkan setiap baris berstatus dengan satu anggota yang berbeda.</p>}</>}</section>}
        {document.details && <section className="space-y-3 border-t border-stone-200 pt-4"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" disabled={context.meeting.details?.minutesStatus === 'final'} checked={includeMinutes} onChange={event => setIncludeMinutes(event.target.checked)} className="h-4 w-4" />Impor Notulensi Sebagai Draft</label>{context.meeting.details?.minutesStatus === 'final' && <p className="text-xs text-amber-800">Notulensi tujuan sudah final. Buka kembali sebagai draft untuk mengimpor notulensi.</p>}{includeMinutes && <><p className="text-xs text-slate-500">Topik yang terdeteksi akan mengganti topik rapat saat ini. Informasi yang kosong tetap menggunakan data rapat.</p><div className="grid gap-3 sm:grid-cols-2">{(['location', 'time', 'leader', 'noteTaker'] as const).map((key, index) => <label key={key} className="min-w-0 text-xs text-slate-600">{['Lokasi', 'Waktu', 'Pemimpin', 'Notulis'][index]}<input type={key === 'time' ? 'time' : 'text'} maxLength={200} value={document.details![key]} onChange={event => { setReviewed(false); setDocument({ ...document, details: { ...document.details!, [key]: event.target.value } }); }} className={field} /></label>)}</div>{document.details.topics.map((topic, index) => <details key={topic.id} open={index === 0} className="border-t border-stone-100 pt-2"><summary className="cursor-pointer break-words py-3 text-sm font-semibold">{index + 1}. {topic.title}</summary><div className="space-y-3">{(['title', 'discussion', 'decision', 'owner', 'dueDate'] as const).map((key, i) => <label key={key} className="block text-xs text-slate-600">{['Judul Topik', 'Pembahasan', 'Keputusan', 'Penanggung Jawab', 'Tenggat'][i]}<textarea rows={key === 'discussion' || key === 'decision' ? 4 : 1} maxLength={key === 'discussion' || key === 'decision' ? 10000 : 200} value={topic[key]} onChange={event => { setReviewed(false); setDocument({ ...document, details: { ...document.details!, topics: document.details!.topics.map((t, n) => n === index ? { ...t, [key]: event.target.value } : t) } }); }} className={`${field} resize-y`} /></label>)}</div></details>)}</>}</section>}
        <label className="flex items-start gap-3 border-t border-stone-200 pt-4 text-sm text-slate-700"><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0" />Saya sudah memeriksa tanggal, anggota, dan isi dokumen yang akan disimpan.</label>
      </fieldset>}
      {document && <button type="button" disabled={!canImport} onClick={() => void confirm()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-amber-300 disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <FileUp className="h-4 w-4" />}Impor Ke Rapat Ini</button>}
    </div>
  </Modal>;
}
