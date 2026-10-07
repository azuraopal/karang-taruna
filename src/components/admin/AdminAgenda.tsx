import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Plus, ArrowRight, ArrowLeft, Search, Save, FolderOpen } from 'lucide-react';
import { MeetingDetail } from './MeetingDetail';
import { ActivityRecapPanel } from './ActivityRecapPanel';
import type { Meeting, MeetingGroup } from '../../utils/meeting';
import { isAttendanceDate } from '../../utils/attendance';

type Agenda = Meeting;
const isAgenda = (value: unknown): value is Agenda => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Agenda;
  return typeof item.id === 'string' && typeof item.title === 'string' && !!item.title.trim() && isAttendanceDate(item.date);
};
async function requestAgenda(options: RequestInit = {}): Promise<Agenda | Agenda[]> {
  const response = await fetch('/api/agenda', { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } });
  const data: unknown = await response.json();
  if (!response.ok) throw new Error((data as { error?: string })?.error || 'Gagal Memuat Agenda. Silakan Coba Lagi.');
  if (options.method === 'POST' ? !isAgenda(data) : !Array.isArray(data) || !data.every(isAgenda)) throw new Error('Respons Agenda Tidak Valid. Silakan Muat Ulang.');
  return data as Agenda | Agenda[];
}
async function requestGroups(options: RequestInit = {}): Promise<MeetingGroup | MeetingGroup[]> {
  const response = await fetch('/api/agenda/groups', { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Gagal Memuat Agenda Kegiatan.');
  const valid = (value: unknown): value is MeetingGroup => !!value && typeof value === 'object' && typeof (value as MeetingGroup).id === 'string' && typeof (value as MeetingGroup).title === 'string';
  if (options.method === 'POST' ? !valid(data) : !Array.isArray(data) || !data.every(valid)) throw new Error('Respons Agenda Kegiatan Tidak Valid.');
  return data;
}
export function AgendaCards({ agenda, onSelect }: { agenda: Agenda[]; onSelect: (agenda: Agenda) => void }) {
  const reduced = useReducedMotion();
  return <div className="grid gap-3 sm:grid-cols-2">{agenda.map((item, index) => <motion.button type="button" key={item.id} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(index, 4) * 0.04 }} whileTap={reduced ? undefined : { scale: 0.985 }} onClick={() => onSelect(item)} className="group flex min-w-0 flex-col rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
    <div className="flex items-start gap-3"><span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><span className="text-lg font-black leading-tight">{item.date.slice(8)}</span><span className="text-[10px] font-bold uppercase">{new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' }).format(new Date(`${item.date}T00:00:00Z`))}</span></span><div className="min-w-0"><h3 className="break-words text-sm font-bold text-slate-900">{item.title}</h3><time dateTime={item.date} className="mt-1.5 block text-xs text-slate-500">{item.date}</time></div></div>
    <span className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs font-semibold text-slate-600 group-hover:text-emerald-700"><span>Buka Rapat · {item.details?.topics?.length || 0} Topik</span><span className="inline-flex items-center gap-2">{item.details?.minutesStatus === 'final' ? 'Final' : 'Draft'}<ArrowRight className="h-4 w-4" /></span></span>
  </motion.button>)}</div>;
}
export function AdminAgenda() {
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [groups, setGroups] = useState<MeetingGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<MeetingGroup | null>(null);
  const [recapOpen, setRecapOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selected, setSelected] = useState<Agenda | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const savingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setError('');
    Promise.all([requestAgenda({ signal: abort.signal }), requestGroups({ signal: abort.signal })]).then(([data, groups]) => { if (!abort.signal.aborted) { setAgenda(data as Agenda[]); setGroups(groups as MeetingGroup[]); } })
      .catch(reason => { if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : 'Gagal Memuat Agenda.'); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [revision]);
  const chooseGroup = (group: MeetingGroup) => { setSelectedGroup(group); setRecapOpen(false); setSearch(''); setTitle(''); setDate(''); setFormError(''); setNotice(''); };
  const saveGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingRef.current || !groupTitle.trim()) return;
    savingRef.current = true; setSaving(true); setFormError('');
    try {
      const group = await requestGroups({ method: 'POST', body: JSON.stringify({ title: groupTitle.trim() }) }) as MeetingGroup;
      if (!mounted.current) return;
      setGroups(previous => [...previous, group]); setGroupTitle(''); chooseGroup(group);
    } catch (reason) { if (mounted.current) setFormError(reason instanceof Error ? reason.message : 'Gagal Menyimpan Agenda Kegiatan.'); }
    finally { savingRef.current = false; if (mounted.current) setSaving(false); }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingRef.current) return;
    if (!title.trim() || title.trim().length > 160 || !isAttendanceDate(date)) { setFormError('Nama Rapat Dan Tanggal Wajib Valid.'); return; }
    savingRef.current = true; setSaving(true); setFormError(''); setNotice('');
    try {
      const created = await requestAgenda({ method: 'POST', body: JSON.stringify({ title: title.trim(), date, ...(selectedGroup && selectedGroup.id !== 'ungrouped' ? { groupId: selectedGroup.id } : {}) }) }) as Agenda;
      if (!mounted.current) return;
      setAgenda(previous => [created, ...previous].sort((a, b) => b.date.localeCompare(a.date)));
      setTitle(''); setDate(''); setNotice('Rapat Berhasil Disimpan.');
    } catch (reason) { if (mounted.current) setFormError(reason instanceof Error ? reason.message : 'Gagal Menyimpan Agenda.'); }
    finally { savingRef.current = false; if (mounted.current) setSaving(false); }
  };
  if (selected) return <MeetingDetail key={selected.id} meeting={selected} onBack={() => setSelected(null)} onSaved={record => { setSelected(record); setAgenda(previous => previous.map(item => item.id === record.id ? record : item)); }} />;
  if (!selectedGroup) {
    const allGroups = [...groups, ...(agenda.some(item => !item.groupId) ? [{ id: 'ungrouped', title: 'Rapat Tanpa Agenda Kegiatan' }] : [])];
    const visibleGroups = allGroups.filter(group => group.title.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID')));
    return <section className="space-y-6">
      <div><p className="mb-1 flex items-center gap-2 text-xs font-semibold text-emerald-700"><FolderOpen className="h-4 w-4" />Rapat Pengurus</p><h2 className="text-xl font-black text-slate-900 sm:text-2xl">Agenda Kegiatan</h2><p className="mt-1 text-sm text-slate-500">Rangkaian rapat, kehadiran, dan notulensi untuk setiap kegiatan.</p></div>
      <form onSubmit={event => void saveGroup(event)} className="space-y-3 border-y border-stone-200 py-5"><h3 className="flex items-center gap-2 text-sm font-bold"><Plus className="h-4 w-4 text-emerald-600" />Tambah Agenda Kegiatan</h3><div className="flex flex-col gap-2 sm:flex-row"><label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">Nama Agenda Kegiatan<input required maxLength={160} disabled={saving} value={groupTitle} onChange={e => setGroupTitle(e.target.value)} placeholder="Contoh: Isra Miraj 2027" className="mt-2 min-h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm" /></label><button type="submit" disabled={saving || loading || !!error} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-lg bg-slate-900 px-4 text-xs font-bold text-amber-300 disabled:opacity-40"><Save className="h-4 w-4" />{saving ? 'Menyimpan...' : 'Simpan Agenda'}</button></div>{formError && <p role="alert" className="text-sm text-rose-700">{formError}</p>}</form>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h3 className="text-sm font-bold text-slate-800">Daftar Agenda Kegiatan</h3><label className="relative"><span className="sr-only">Cari Agenda Kegiatan</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari agenda kegiatan..." className="min-h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 text-sm sm:w-64" /></label></div>
      {loading ? <div role="status" className="loading-skeleton h-32 rounded-xl"><span className="sr-only">Memuat Agenda Kegiatan</span></div> : error ? <div role="alert" className="rounded-lg bg-rose-50 p-4 text-sm text-rose-800">{error}<button type="button" onClick={() => setRevision(previous => previous + 1)} className="ml-3 min-h-11 font-semibold underline">Coba Lagi</button></div> : visibleGroups.length ? <div className="grid gap-3 sm:grid-cols-2">{visibleGroups.map(group => {
        const meetings = agenda.filter(item => group.id === 'ungrouped' ? !item.groupId : item.groupId === group.id);
        return <button type="button" key={group.id} onClick={() => chooseGroup(group)} className="group min-w-0 rounded-xl border border-stone-200 bg-white p-5 text-left shadow-sm hover:border-emerald-400"><FolderOpen className="mb-3 h-6 w-6 text-emerald-600" /><h3 className="break-words text-base font-bold text-slate-900">{group.title}</h3><p className="mt-2 text-xs text-slate-500">{meetings.length} Rapat · {meetings.filter(m => m.details?.minutesStatus === 'final').length} Notulensi Final</p><span className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs font-semibold text-slate-600">Lihat Rangkaian Rapat<ArrowRight className="h-4 w-4" /></span></button>;
      })}</div> : <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-slate-500">{search ? 'Tidak Ada Agenda Kegiatan yang Sesuai.' : 'Belum Ada Agenda Kegiatan.'}</p>}
    </section>;
  }
  const groupMeetings = agenda.filter(item => selectedGroup.id === 'ungrouped' ? !item.groupId : item.groupId === selectedGroup.id);
  return <section className="space-y-6">
    <button type="button" disabled={saving} onClick={() => { setSelectedGroup(null); setSearch(''); setFormError(''); setNotice(''); }} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-500"><ArrowLeft className="h-4 w-4" />Semua Agenda Kegiatan</button>
    <div><p className="mb-1 flex items-center gap-2 text-xs font-semibold text-emerald-700"><CalendarDays className="h-4 w-4" />Agenda Kegiatan</p><h2 className="text-xl sm:text-2xl font-black text-slate-900">{selectedGroup.title}</h2><p className="mt-1 text-sm text-slate-500">{groupMeetings.length} Rapat dalam Agenda Ini</p></div>
    <div className="flex gap-2 border-b border-stone-200" role="tablist" aria-label="Tampilan Agenda"><button type="button" role="tab" aria-selected={!recapOpen} onClick={() => setRecapOpen(false)} className={`min-h-11 border-b-2 px-3 text-sm font-semibold ${!recapOpen ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'}`}>Daftar Rapat</button><button type="button" role="tab" aria-selected={recapOpen} onClick={() => setRecapOpen(true)} className={`min-h-11 border-b-2 px-3 text-sm font-semibold ${recapOpen ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'}`}>Rekap Agenda</button></div>
    {recapOpen ? <ActivityRecapPanel key={selectedGroup.id} groupId={selectedGroup.id} /> : <>
    <form onSubmit={event => void save(event)} className="space-y-4 border-y border-stone-200 py-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Plus className="h-4 w-4 text-emerald-600" />Tambah Rapat</h3></div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
        <label className="min-w-0 text-xs font-semibold text-slate-600">Nama Rapat<input required maxLength={160} disabled={saving} value={title} onChange={event => setTitle(event.target.value)} placeholder="Contoh: Rapat Koordinasi Bulanan" className="mt-2 block min-h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-amber-400" /></label>
        <label className="min-w-0 text-xs font-semibold text-slate-600">Tanggal<input type="date" required min="0001-01-01" max="9999-12-31" disabled={saving} value={date} onChange={event => setDate(event.target.value)} className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-900 focus-visible:ring-2 focus-visible:ring-amber-400" /></label>
        <button type="submit" disabled={saving || loading || !!error} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-amber-300 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-400"><Save className="h-4 w-4" />{saving ? 'Menyimpan...' : 'Simpan Rapat'}</button>
      </div>
      {formError && <p role="alert" className="text-sm text-rose-700">{formError}</p>}
    </form>
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h3 className="text-sm font-bold text-slate-800">Daftar Rapat <span className="ml-2 text-xs font-normal text-slate-400">{groupMeetings.length}</span></h3><label className="relative"><span className="sr-only">Cari Rapat</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama rapat..." className="min-h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 text-sm sm:w-64" /></label></div>
    {groupMeetings.length ? <><AgendaCards agenda={groupMeetings.filter(item => item.title.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID')))} onSelect={setSelected} />{!groupMeetings.some(item => item.title.toLocaleLowerCase('id-ID').includes(search.trim().toLocaleLowerCase('id-ID'))) && <p className="py-8 text-center text-sm text-slate-500">Tidak Ada Rapat yang Sesuai.</p>}</> : <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center"><CalendarDays className="mx-auto mb-3 h-8 w-8 text-slate-300" /><h3 className="font-bold text-slate-800">Belum Ada Rapat</h3><p className="mt-2 text-sm text-slate-500">Tambahkan nama rapat dan tanggal untuk mulai mencatat absensi.</p></div>}
    </>}
  </section>;
}
