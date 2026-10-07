import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { FileText, Search, RefreshCw } from 'lucide-react';
import { summarizeActivity, validateActivityRecap, type ActivityRecap } from '../../utils/activityRecap';

const PdfPreviewDialog = lazy(() => import('../common/PdfPreviewDialog').then(module => ({ default: module.PdfPreviewDialog })));
const labels = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alpa: 'Alpa' };
export function ActivityRecapPanel({ groupId }: { groupId: string }) {
  const [data, setData] = useState<ActivityRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [pdf, setPdf] = useState<Uint8Array | null>(null);
  const mounted = useRef(true);
  const exporting = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setError(''); setData(null);
    fetch(`/api/agenda/groups/${encodeURIComponent(groupId)}/report`, { signal: abort.signal, credentials: 'same-origin' })
      .then(async response => { const value = await response.json(); if (!response.ok) throw Error(value.error || 'Gagal Memuat Rekap.'); validateActivityRecap(value); return value; })
      .then(value => { if (!abort.signal.aborted) setData(value); })
      .catch(reason => { if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : 'Gagal Memuat Rekap.'); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [groupId, revision]);
  const preview = async () => {
    if (!data || exporting.current) return;
    exporting.current = true; setBusy(true); setError('');
    try {
      const { exportActivityReportPdf } = await import('../../utils/activityReportPdf');
      const bytes = await exportActivityReportPdf(data);
      if (mounted.current) setPdf(bytes);
    } catch (reason) { if (mounted.current) setError(reason instanceof Error ? reason.message : 'Gagal Membuat PDF Rekap.'); }
    finally { exporting.current = false; if (mounted.current) setBusy(false); }
  };
  const summary = data ? summarizeActivity(data) : null;
  const visible = summary?.members.filter(row => row.member.nama.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID')) && (filter === 'all' || (filter === 'absent' ? row.tidakHadir > 0 : row.counts.belum > 0))) || [];
  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">Rekap Seluruh Pertemuan</h3><p className="mt-1 text-sm text-slate-500">Kehadiran anggota, keputusan, dan notulensi dalam satu dokumen.</p></div><div className="flex flex-wrap gap-2"><button type="button" title="Muat Ulang Rekap" aria-label="Muat Ulang Rekap" disabled={loading || busy} onClick={() => setRevision(value => value + 1)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-200 bg-white disabled:opacity-40"><RefreshCw className="h-4 w-4" /></button><button type="button" disabled={loading || busy || !summary?.meetings.length} onClick={() => void preview()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-amber-300 disabled:opacity-40"><FileText className="h-4 w-4 shrink-0" />{busy ? 'Menyiapkan PDF...' : 'Pratinjau Rekap Agenda'}</button></div></div>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {loading ? <div role="status" className="loading-skeleton h-48 rounded-lg"><span className="sr-only">Memuat Rekap</span></div> : summary && <>
      <div className="grid grid-cols-3 gap-3 border-y border-stone-200 py-4">{[['Pertemuan', summary.meetings.length], ['Anggota', summary.members.length], ['Belum Dicatat', summary.unrecorded]].map(([label, value]) => <div key={label}><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>)}</div>
      <p className="text-xs leading-relaxed text-slate-500">Tidak Hadir = Izin + Sakit + Alpa. Belum Dicatat tidak dihitung sebagai ketidakhadiran. Rekap menggunakan daftar anggota saat ini.</p>
      <div className="flex flex-col gap-2 sm:flex-row"><label className="relative min-w-0 flex-1"><span className="sr-only">Cari Anggota Rekap</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input type="search" placeholder="Cari anggota..." value={search} onChange={event => setSearch(event.target.value)} className="min-h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 text-sm" /></label><label><span className="sr-only">Filter Kehadiran Rekap</span><select value={filter} onChange={event => setFilter(event.target.value)} className="min-h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm sm:w-52"><option value="all">Semua Anggota</option><option value="absent">Pernah Tidak Hadir</option><option value="unrecorded">Belum Lengkap Dicatat</option></select></label></div>
      <div className="hidden overflow-x-auto rounded-lg border border-stone-200 bg-white md:block"><table className="w-full text-left text-sm"><caption className="sr-only">Kehadiran Anggota Per Pertemuan</caption><thead className="bg-stone-50 text-xs text-slate-600"><tr><th className="min-w-48 p-3">Anggota</th><th className="p-3">Hadir</th><th className="p-3">Tidak Hadir</th><th className="p-3">Izin / Sakit / Alpa</th><th className="p-3">Belum</th>{summary.meetings.map((meeting, index) => <th key={meeting.id} className="min-w-36 p-3"><span className="block">R{index + 1} · {meeting.date}</span><span className="mt-1 block font-normal">{meeting.title}</span></th>)}</tr></thead><tbody>{visible.map(row => <tr key={row.member.id} className="border-t border-stone-100"><th className="p-3 font-semibold text-slate-900">{row.member.nama}<span className="block text-xs font-normal text-slate-500">{row.member.divisi}</span></th><td className="p-3 text-emerald-700">{row.counts.hadir} / {summary.meetings.length}</td><td className="p-3">{row.tidakHadir}</td><td className="p-3">{row.counts.izin} / {row.counts.sakit} / {row.counts.alpa}</td><td className="p-3">{row.counts.belum}</td>{row.attendance.map(item => <td key={item.meeting.id} className={`p-3 ${item.status === 'hadir' ? 'text-emerald-700' : item.status === 'alpa' ? 'text-rose-700' : 'text-slate-500'}`}>{item.status ? labels[item.status] : 'Belum Dicatat'}</td>)}</tr>)}</tbody></table></div>
      <div className="space-y-3 md:hidden">{visible.map(row => <article key={row.member.id} className="rounded-lg border border-stone-200 bg-white p-4"><h4 className="font-bold text-slate-900">{row.member.nama}</h4><p className="mt-1 text-xs text-slate-500">{row.member.divisi}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold"><span className="text-emerald-700">Hadir {row.counts.hadir} / {summary.meetings.length}</span><span>Tidak Hadir {row.tidakHadir} Pertemuan</span></div><p className="mt-2 text-xs leading-relaxed text-slate-500">Izin {row.counts.izin} · Sakit {row.counts.sakit} · Alpa {row.counts.alpa} · Belum Dicatat {row.counts.belum}</p><details className="mt-3 border-t border-stone-100 pt-2"><summary className="min-h-11 cursor-pointer py-3 text-xs font-semibold text-slate-700">Rincian {summary.meetings.length} Pertemuan</summary><ul className="space-y-3">{row.attendance.map((item, index) => <li key={item.meeting.id} className="flex items-start justify-between gap-3 text-xs"><span className="min-w-0 break-words">R{index + 1} · {item.meeting.title}<time className="mt-1 block text-slate-400">{item.meeting.date}</time></span><span className="shrink-0 font-semibold">{item.status ? labels[item.status] : 'Belum Dicatat'}</span></li>)}</ul></details></article>)}</div>
      {!visible.length && <p className="py-6 text-center text-sm text-slate-500">Tidak Ada Anggota yang Sesuai.</p>}
      {!summary.meetings.length && <p className="text-sm text-slate-500">Tambahkan rapat pada agenda ini untuk membuat rekap.</p>}
      <p className="text-xs text-slate-500">PDF mencakup seluruh anggota dan rapat, termasuk yang tidak ditampilkan oleh filter.</p>
    </>}
    {pdf && <Suspense fallback={<p role="status">Memuat Pratinjau...</p>}><PdfPreviewDialog title="Pratinjau Rekap Agenda" bytes={pdf} filename={`rekap-agenda-${groupId}.pdf`} onClose={() => setPdf(null)} /></Suspense>}
  </section>;
}
