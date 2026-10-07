import { lazy, Suspense, useRef, useState } from 'react';
import { Eye, Upload, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ATTENDANCE_LABELS, type AttendanceRecord } from '../../utils/attendance';
import { applyAttendanceImport } from '../../utils/attendanceImport';
import { attendanceRequest } from '../../utils/attendanceClient';
import type { AttendancePreview, PdfMember, PdfExportOptions } from '../../utils/attendancePdf';
const PdfPreviewDialog = lazy(() => import('../common/PdfPreviewDialog').then(module => ({ default: module.PdfPreviewDialog })));

interface PreviewProps {
  preview: AttendancePreview; members: readonly PdfMember[]; selectedDate: string; busy: boolean; lockedDate?: boolean;
  onChooseDate: () => void; onConfirm: () => void; onCancel: () => void;
}
export function AttendanceImportPreview({ preview, members, selectedDate, busy, lockedDate, onChooseDate, onConfirm, onCancel }: PreviewProps) {
  const mismatch = selectedDate !== preview.tanggal;
  const rows = preview.rows ?? preview.records.map(r => { const m = members.find(m => m.id === r.anggotaId); return {page:0,nama:m?.nama || r.anggotaId,jabatan:m?.jabatan || 'Belum Diisi',divisi:m?.divisi || '—',status:ATTENDANCE_LABELS[r.status],anggotaId:r.anggotaId}; });
  return <div className="space-y-4">
    <p className="text-sm">Tanggal PDF: <strong>{preview.tanggal}</strong> · Tanggal Dipilih: <strong>{selectedDate}</strong></p>
    <p className="text-sm">Asal Tanggal: {preview.dateOrigin === 'selected' ? 'Agenda Dipilih (PDF Tidak Memuat Tanggal)' : 'PDF' }{lockedDate ? ' · Tanggal Agenda Terkunci' : ''}</p>
    {preview.detectedHeaders && <p className="text-sm">Header Terdeteksi: {preview.detectedHeaders.join(', ')}</p>}
    {!!preview.detectedMappings?.length && <div className="text-sm rounded-xl bg-amber-50 p-3"><strong>Pemetaan Terdeteksi</strong><ul>{preview.detectedMappings.map(m => <li key={m}>{m}</li>)}</ul></div>}
    {!!preview.issues?.length && <div role="alert" className="text-sm rounded-xl bg-rose-50 p-3 text-rose-800"><strong>Impor Diblokir</strong><ul>{preview.issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul></div>}
    {mismatch && <div role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-900 text-sm"><p className="font-bold">Tanggal PDF Berbeda</p><p>{lockedDate ? 'Tanggal agenda terkunci. Gunakan PDF dengan tanggal agenda yang sama.' : 'Pilih tanggal yang sama sebelum mengimpor.'}</p>{!lockedDate && <button disabled={busy} onClick={onChooseDate} className="min-h-11 font-bold underline">Gunakan Tanggal PDF</button>}</div>}
    <p className="text-sm">{preview.records.length} catatan akan disimpan atau menimpa status yang ada. {preview.unrecorded} baris Belum Dicatat tidak diubah; bukan Alpa. Catatan lain tidak dihapus.</p>
    <div className="max-h-72 overflow-auto rounded-xl border border-stone-200"><table className="w-full text-sm text-left"><thead className="bg-stone-50"><tr>{['No', 'Nama', 'Jabatan', 'Divisi', 'Status', 'Pencocokan'].map(s => <th key={s} className="p-3">{s}</th>)}</tr></thead><tbody>{rows.map((r, index) => { const member = members.find(m => m.id === r.anggotaId); return <tr key={index}><td className="p-3">{index + 1}</td><td className="p-3">{r.nama}</td><td className="p-3">{member?.jabatan || r.jabatan || 'Belum Diisi'}</td><td className="p-3">{member?.divisi || r.divisi || '—'}</td><td className="p-3">{r.status ? r.status[0].toUpperCase() + r.status.slice(1) : 'Belum Dicatat'}</td><td className="p-3">{member ? member.nama : 'Tidak Cocok'}</td></tr>; })}</tbody></table></div>
    <div className="flex flex-wrap gap-2"><button disabled={busy || mismatch || !!preview.issues?.length || !preview.records.length} onClick={onConfirm} className="min-h-11 rounded-xl bg-slate-900 text-amber-400 px-4 text-sm font-bold disabled:opacity-50">{busy ? 'Menyimpan…' : 'Konfirmasi Impor'}</button><button disabled={busy} onClick={onCancel} className="min-h-11 rounded-xl bg-stone-100 px-4 text-sm font-bold">Batal</button></div>
  </div>;
}
interface Props {
  attendancePath?: string;
  hideExport?: boolean;
  tanggal: string; members: PdfMember[]; records: AttendanceRecord[]; disabled: boolean; lockedDate?: boolean; exportOptions?: PdfExportOptions;
  onChooseDate: (tanggal: string) => void; onBusy: (busy: boolean) => void; onRefetch: () => Promise<void>;
}
export function AttendancePdfControls({ hideExport, attendancePath, tanggal, members, records, disabled, lockedDate, exportOptions, onChooseDate, onBusy, onRefetch }: Props) {
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [preview, setPreview] = useState<AttendancePreview | null>(null);
  const [previewMembers, setPreviewMembers] = useState<PdfMember[]>([]);
  const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const start = () => { if (lock.current || disabled) return false; lock.current = true; setBusy(true); onBusy(true); setError(''); setMessage(''); return true; };
  const stop = () => { lock.current = false; setBusy(false); onBusy(false); };
  const exportPdf = async () => {
    if (!start()) return;
    try {
      const { exportAttendancePdf } = await import('../../utils/attendancePdf');
      const bytes = await exportAttendancePdf(tanggal, members, records, exportOptions);
      setPdfBytes(bytes);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal membuat PDF.'); } finally { stop(); }
  };
  const importPdf = async (file: File) => {
    if (!start()) return;
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('PDF melebihi batas 8 MB.');
      const { parseAttendancePdf } = await import('../../utils/attendancePdf');
      setPreview(await parseAttendancePdf(new Uint8Array(await file.arrayBuffer()), members, { selectedDate: tanggal, lockedDate, meetingId: exportOptions?.meetingId })); setPreviewMembers(members);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal membaca PDF.'); } finally { stop(); }
  };
  const confirm = async () => {
    if (!preview || !start()) return;
    try {
      const result = await applyAttendanceImport(preview, tanggal, true, attendanceRequest, onRefetch, attendancePath);
      setPreview(null);
      setMessage(`${result.saved} / ${preview.records.length} catatan berhasil disimpan. ${result.failures.length} gagal. Tidak ada perubahan untuk baris Belum Dicatat.`);
      if (result.failures.length || result.refreshError) setError([
        ...result.failures.map(f => `${previewMembers.find(m => m.id === f.anggotaId)?.nama || f.anggotaId}: ${f.message}`),
        ...(result.refreshError ? [`Muat ulang gagal: ${result.refreshError}. Periksa ulang data sebelum mengulangi impor.`] : []),
      ].join('\n'));
    } catch (e) { setError(e instanceof Error ? e.message : 'Impor gagal.'); } finally { stop(); }
  };
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-semibold text-slate-500"><FileText className="h-4 w-4" />Rekap Kehadiran</span><div className="flex flex-wrap gap-2"><button type="button" disabled={busy || disabled} onClick={() => input.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-slate-600 disabled:opacity-50"><Upload className="h-4 w-4" />Impor PDF</button>{!hideExport && <button type="button" disabled={busy || disabled} onClick={() => void exportPdf()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-semibold text-slate-800 disabled:opacity-50"><Eye className="h-4 w-4" />Pratinjau PDF</button>}</div><input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" aria-label="Pilih PDF Absensi" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void importPdf(file); }} /></div>
    <details className="text-xs text-slate-500"><summary className="w-fit cursor-pointer py-1">Ketentuan Impor PDF</summary><p className="mt-2 max-w-xl leading-relaxed">Gunakan tabel PDF berisi Nama dan Status (Hadir, Izin, Sakit, Alpa). Maksimal 8 MB dan 50 halaman. Nama anggota harus cocok dengan daftar. PDF hasil scan belum didukung. Periksa pratinjau sebelum mengonfirmasi impor.</p></details>
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 whitespace-pre-wrap">{error}</p>}
    {pdfBytes && <Suspense fallback={<p role="status">Memuat Pratinjau...</p>}><PdfPreviewDialog bytes={pdfBytes} filename={`absensi-${tanggal}.pdf`} onClose={() => setPdfBytes(null)} /></Suspense>}
    <Modal isOpen={!!preview} onClose={() => { if (!lock.current) setPreview(null); }} title="Pratinjau Impor PDF" maxWidth="lg">{preview && <>{exportOptions?.meetingTitle && <p className="mb-4 rounded-lg bg-sky-50 p-3 text-sm text-sky-800">Impor Kehadiran Ke Rapat: <strong>{exportOptions.meetingTitle}</strong></p>}<AttendanceImportPreview preview={preview} members={previewMembers} selectedDate={tanggal} busy={busy || disabled} lockedDate={lockedDate} onChooseDate={() => onChooseDate(preview.tanggal)} onConfirm={() => void confirm()} onCancel={() => setPreview(null)} /></>}</Modal>
  </div>;
}
