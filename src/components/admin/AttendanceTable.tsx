import { useState } from 'react';
import { ClipboardCheck, Pencil, Plus, RefreshCw, Search, Users } from 'lucide-react';
import type { AnggotaTim } from '../../types';
import { ATTENDANCE_LABELS, type AttendanceRecord } from '../../utils/attendance';
import { Pagination } from '../common/Pagination';

interface Props {
  members: readonly AnggotaTim[];
  records: readonly AttendanceRecord[];
  loading: boolean;
  error: string;
  disabled?: boolean;
  onRetry: () => void;
  onEdit: (member: AnggotaTim) => void;
}
const colors = { hadir: 'bg-emerald-50 text-emerald-700', izin: 'bg-sky-50 text-sky-700', sakit: 'bg-amber-50 text-amber-800', alpa: 'bg-rose-50 text-rose-700' };

export function AttendanceTable({ members, records, loading, error, disabled, onRetry, onEdit }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('semua');
  const [page, setPage] = useState(1);
  if (loading) return <div role="status" aria-busy="true" className="rounded-xl border border-stone-200 bg-white p-5">
    <span className="sr-only">Memuat absensi</span>
    {[0, 1, 2, 3].map(item => <div key={item} className="flex items-center gap-4 border-b border-stone-100 py-4 last:border-0"><div className="loading-skeleton h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><div className="loading-skeleton h-3 w-2/5 rounded" /><div className="loading-skeleton h-3 w-1/4 rounded" /></div><div className="loading-skeleton h-8 w-20 rounded-lg" /></div>)}
  </div>;
  if (error) return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800"><p>{error}</p><button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold"><RefreshCw className="h-4 w-4" />Coba lagi</button></div>;
  if (!members.length) return <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center"><Users className="mx-auto mb-3 h-8 w-8 text-slate-400" /><h3 className="font-bold">Belum Ada Anggota Tim</h3><p className="mt-2 text-sm text-slate-500">Tambahkan anggota melalui menu Kelola Tim Pengurus untuk mulai mencatat absensi.</p></div>;
  const byMember = new Map(records.map(record => [record.anggotaId, record]));
  const query = search.trim().toLocaleLowerCase('id-ID');
  const filtered = members.filter(member => {
    const status = byMember.get(member.id)?.status;
    return [member.nama, member.jabatan, member.divisi].join(' ').toLocaleLowerCase('id-ID').includes(query) &&
      (filter === 'semua' || (filter === 'belum' ? !status : status === filter));
  });
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  function badge(member: AnggotaTim) {
    const status = byMember.get(member.id)?.status;
    return <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${status ? colors[status] : 'bg-stone-100 text-slate-500'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" /><span>{status ? ATTENDANCE_LABELS[status] : 'Belum dicatat'}</span></span>;
  }
  function action(member: AnggotaTim) {
    const recorded = byMember.has(member.id);
    return <button type="button" disabled={disabled} onClick={() => onEdit(member)} aria-label={`${recorded ? 'Ubah' : 'Catat'} absensi ${member.nama}`} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-40 ${recorded ? 'bg-stone-100 text-slate-700 hover:bg-stone-200' : 'bg-slate-900 text-amber-300 hover:bg-slate-800'}`}>{recorded ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}{recorded ? 'Ubah' : 'Catat'}</button>;
  }
  return <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
    <div className="flex flex-col gap-4 border-b border-stone-100 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><ClipboardCheck className="h-4 w-4 text-emerald-600" />Daftar Kehadiran</h3><span className="text-xs text-slate-500">{filtered.length} Anggota</span></div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1"><span className="sr-only">Cari Anggota</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nama, jabatan, atau divisi..." className="min-h-11 w-full rounded-lg border border-stone-200 bg-stone-50 pl-10 pr-3 text-sm focus-visible:ring-2 focus-visible:ring-amber-300" /></label>
        <label><span className="sr-only">Filter Status</span><select aria-label="Filter Status" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} className="min-h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 sm:w-44"><option value="semua">Semua Status</option><option value="belum">Belum Dicatat</option>{Object.entries(ATTENDANCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
    </div>
    {!records.length && <p className="border-b border-stone-100 bg-amber-50/60 px-5 py-3 text-xs text-amber-900">Belum ada absensi pada tanggal ini. Pilih Catat untuk mulai.</p>}
    {!filtered.length ? <div className="px-5 py-12 text-center"><Search className="mx-auto mb-3 h-7 w-7 text-slate-300" /><h3 className="text-sm font-bold">Tidak Ada Hasil</h3><button type="button" onClick={() => { setSearch(''); setFilter('semua'); setPage(1); }} className="mt-2 min-h-11 text-sm font-semibold text-sky-700">Reset Pencarian</button></div> : <>
      <div className="divide-y divide-stone-100 md:hidden">{visible.map(member => <div key={member.id} className="space-y-3 p-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-700">{member.nama.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><h4 className="break-words text-sm font-bold text-slate-900">{member.nama}</h4><p className="mt-1 break-words text-xs text-slate-500">{member.jabatan?.trim() || 'Belum Diisi'} · {member.divisi}</p></div></div><div className="flex items-center justify-between gap-2">{badge(member)}{action(member)}</div></div>)}</div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><caption className="sr-only">Absensi anggota tim pada tanggal terpilih</caption><thead className="bg-stone-50 text-xs text-slate-500"><tr>{['No', 'Nama', 'Jabatan', 'Divisi', 'Status', 'Aksi'].map(label => <th key={label} scope="col" className="whitespace-nowrap px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-stone-100">{visible.map((member, index) => <tr key={member.id} className="transition-colors hover:bg-stone-50"><td className="px-4 py-4 text-xs text-slate-400">{(currentPage - 1) * 10 + index + 1}</td><th scope="row" className="max-w-48 break-words px-4 py-4 font-semibold">{member.nama}</th><td className="max-w-40 break-words px-4 py-4 text-xs text-slate-600">{member.jabatan?.trim() || 'Belum Diisi'}</td><td className="max-w-40 break-words px-4 py-4 text-xs text-slate-500">{member.divisi}</td><td className="px-4 py-4">{badge(member)}</td><td className="px-4 py-4">{action(member)}</td></tr>)}</tbody></table></div>
    </>}
    <Pagination currentPage={currentPage} totalItems={filtered.length} pageSize={10} onPageChange={setPage} />
  </div>;
}
