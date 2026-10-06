import React, { useState } from 'react';
import { motion, type Transition } from 'framer-motion';
import {
  ArrowUpRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LayoutList,
  MessageSquare,
  Newspaper,
  Plus,
  Users,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { navigateTo } from '../../utils/appRoute';
import { CountingNumber } from '../common/CountingNumber';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateBerita: () => void;
  onOpenCreateTim: () => void;
  onOpenCreateGaleri: () => void;
}

const springIn: Transition = { type: 'spring', stiffness: 260, damping: 26, mass: 0.7 };
const listTransition: Transition = { duration: 0.34, ease: 'easeOut' };

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onOpenCreateBerita,
  onOpenCreateTim,
  onOpenCreateGaleri,
}) => {
  const { beritaList, timList, galeriList, aspirasiList, currentUser, setCurrentView } = useData();
  const [greeting] = useState(() => {
    if (typeof window === 'undefined') return 'Selamat Datang';
    const jakartaHour = Number(new Intl.DateTimeFormat('id-ID', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Jakarta' }).format(new Date()));
    if (jakartaHour < 11) return 'Selamat Pagi';
    if (jakartaHour < 15) return 'Selamat Siang';
    if (jakartaHour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  });
  const [today] = useState(() => new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()));

  const aspirasiBaru = aspirasiList.filter((item) => item.status === 'baru');
  const beritaDraft = beritaList.filter((item) => item.status !== 'published');
  const beritaTayang = beritaList.filter((item) => item.status === 'published');
  const roleLabel = currentUser?.role === 'superadmin'
    ? 'Super Admin'
    : currentUser?.role === 'admin'
      ? 'Administrator'
      : 'Pengurus';

  const stats = [
    { label: 'Warta Tayang', value: beritaTayang.length, detail: `${beritaDraft.length} Draft`, icon: <Newspaper className="h-4 w-4" />, tab: 'berita', accent: 'amber' },
    { label: 'Respons Warga', value: aspirasiBaru.length, detail: aspirasiBaru.length > 0 ? 'Menunggu Tindak Lanjut' : 'Kotak Masuk Terkendali', icon: <MessageSquare className="h-4 w-4" />, tab: 'aspirasi', accent: aspirasiBaru.length > 0 ? 'rose' : 'emerald' },
    { label: 'Pengurus Aktif', value: timList.length, detail: 'Lintas 7 Divisi Kerja', icon: <Users className="h-4 w-4" />, tab: 'tim', accent: 'sky' },
    { label: 'Arsip Visual', value: galeriList.length, detail: 'Momen Terdokumentasi', icon: <Camera className="h-4 w-4" />, tab: 'galeri', accent: 'violet' },
  ];

  const attentionItems = [
    {
      title: aspirasiBaru.length > 0 ? `${aspirasiBaru.length} Aspirasi Perlu Dibaca` : 'Kotak Aspirasi Sudah Terkendali',
      detail: aspirasiBaru.length > 0 ? 'Pesan warga yang belum dibaca ada di antrean teratas.' : 'Tidak ada pesan baru yang belum tersentuh.',
      action: 'Buka aspirasi',
      tab: 'aspirasi',
      isUrgent: aspirasiBaru.length > 0,
    },
    {
      title: beritaDraft.length > 0 ? `${beritaDraft.length} Warta Menunggu Finalisasi` : 'Tidak Ada Warta yang Tertahan',
      detail: beritaDraft.length > 0 ? 'Periksa isi dan terbitkan ketika informasi sudah siap.' : 'Semua warta sudah berada pada alur yang tepat.',
      action: 'Kelola warta',
      tab: 'berita',
      isUrgent: beritaDraft.length > 0,
    },
  ];

  return (
    <div className="dashboard-workspace">
      <motion.section
        initial={{ opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springIn}
        className="dashboard-command"
      >
        <div className="dashboard-command__grid" aria-hidden="true" />
        <div className="dashboard-command__orbit dashboard-command__orbit--one" aria-hidden="true" />
        <div className="dashboard-command__orbit dashboard-command__orbit--two" aria-hidden="true" />
        <div className="dashboard-command__scan" aria-hidden="true" />

        <div className="dashboard-command__content">
          <div className="dashboard-command__meta">
            <span className="dashboard-command__status"><i /> Portal Terhubung</span>
            <span className="dashboard-command__date"><CalendarDays className="h-3.5 w-3.5" />{today}</span>
          </div>
          <p className="dashboard-command__eyebrow">Ruang Kerja {roleLabel}</p>
          <h1>{greeting}, <span>{currentUser?.namaLengkap || 'Pengurus'}.</span></h1>
          <p className="dashboard-command__lead">Satu ruang untuk menjaga kabar warga, dokumentasi kegiatan, dan tindak lanjut tetap bergerak.</p>
        </div>

        <div className="dashboard-command__actions">
          <button type="button" onClick={onOpenCreateBerita} className="dashboard-command__primary"><Plus className="h-4 w-4" /> Tulis Warta <ChevronRight className="h-4 w-4" /></button>
          <button type="button" onClick={() => { setCurrentView('public'); navigateTo('/'); }} className="dashboard-command__secondary">Lihat Web Publik <ArrowUpRight className="h-4 w-4" /></button>
        </div>
      </motion.section>

      <section aria-label="Ringkasan aktivitas" className="dashboard-metrics">
        {stats.map((stat, index) => (
          <motion.button
            key={stat.label}
            type="button"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...springIn, delay: 0.08 + index * 0.06 }}
            onClick={() => onNavigateTab(stat.tab)}
            className="dashboard-metric"
            data-accent={stat.accent}
          >
            <span className="dashboard-metric__icon">{stat.icon}</span>
            <span className="dashboard-metric__value"><CountingNumber value={stat.value} /></span>
            <span className="dashboard-metric__label">{stat.label}</span>
            <span className="dashboard-metric__detail">{stat.detail}</span>
          </motion.button>
        ))}
      </section>

      <section className="dashboard-flow">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springIn, delay: 0.26 }}
          className="dashboard-priority"
        >
          <div className="dashboard-section-heading">
            <div><p>Fokus Hari Ini</p><h2>Yang Perlu Digerakkan</h2></div>
            <span className="dashboard-section-heading__mark"><LayoutList className="h-4 w-4" /></span>
          </div>
          <div className="dashboard-priority__list">
            {attentionItems.map((item, index) => (
              <motion.button
                key={item.tab}
                type="button"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...listTransition, delay: 0.34 + index * 0.07 }}
                onClick={() => onNavigateTab(item.tab)}
                className="dashboard-priority__item"
              >
                <span className={`dashboard-priority__signal ${item.isUrgent ? 'dashboard-priority__signal--urgent' : ''}`}>{item.isUrgent ? <Clock3 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</span>
                <span className="dashboard-priority__copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
                <span className="dashboard-priority__action">{item.action}<ChevronRight className="h-4 w-4" /></span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 18, rotate: 1.5 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ ...springIn, delay: 0.31 }}
          className="dashboard-launchpad"
        >
          <div className="dashboard-launchpad__flare" aria-hidden="true" />
          <p>Mulai Dari Sini</p>
          <h2>Terbitkan Hal yang Penting.</h2>
          <div className="dashboard-launchpad__actions">
            <button type="button" onClick={onOpenCreateBerita}><Newspaper className="h-4 w-4" /><span>Tulis Berita</span><ChevronRight className="h-4 w-4" /></button>
            <button type="button" onClick={onOpenCreateGaleri}><Camera className="h-4 w-4" /><span>Tambah Dokumentasi</span><ChevronRight className="h-4 w-4" /></button>
            <button type="button" onClick={onOpenCreateTim}><Users className="h-4 w-4" /><span>Perbarui Pengurus</span><ChevronRight className="h-4 w-4" /></button>
          </div>
        </motion.aside>
      </section>

      <section className="dashboard-streams">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ ...listTransition, delay: 0.4 }} className="dashboard-stream">
          <div className="dashboard-stream__heading"><div><p>Publikasi</p><h2>Warta Terbaru</h2></div><button type="button" onClick={() => onNavigateTab('berita')}>Kelola Warta <ChevronRight className="h-4 w-4" /></button></div>
          <div className="dashboard-stream__list">
            {beritaList.slice(0, 3).map((item, index) => (
              <motion.button key={item.id} type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...listTransition, delay: 0.46 + index * 0.06 }} onClick={() => onNavigateTab('berita')} className="dashboard-stream__item">
                <img src={item.gambarUrl} alt="" className="dashboard-stream__image" />
                <span className="dashboard-stream__copy"><strong>{item.judul}</strong><small>{item.kategori} <i /> {item.tanggal}</small></span>
                <span className={`dashboard-stream__badge ${item.status === 'published' ? 'dashboard-stream__badge--published' : ''}`}>{item.status === 'published' ? 'Tayang' : 'Draft'}</span>
              </motion.button>
            ))}
            {beritaList.length === 0 && <p className="dashboard-stream__empty">Belum ada warta yang dibuat.</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ ...listTransition, delay: 0.44 }} className="dashboard-stream dashboard-stream--message">
          <div className="dashboard-stream__heading"><div><p>Suara Warga</p><h2>Aspirasi Terbaru</h2></div><button type="button" onClick={() => onNavigateTab('aspirasi')}>Buka Kotak Masuk <ChevronRight className="h-4 w-4" /></button></div>
          <div className="dashboard-stream__list">
            {aspirasiList.slice(0, 3).map((item, index) => (
              <motion.button key={item.id} type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...listTransition, delay: 0.5 + index * 0.06 }} onClick={() => onNavigateTab('aspirasi')} className="dashboard-stream__item dashboard-stream__item--message">
                <span className={`dashboard-stream__avatar ${item.status === 'baru' ? 'dashboard-stream__avatar--new' : ''}`}><MessageSquare className="h-3.5 w-3.5" /></span>
                <span className="dashboard-stream__copy"><strong>{item.nama}</strong><small>{item.kategori} <i /> {item.pesan}</small></span>
                {item.status === 'baru' && <span className="dashboard-stream__badge dashboard-stream__badge--new">Baru</span>}
              </motion.button>
            ))}
            {aspirasiList.length === 0 && <p className="dashboard-stream__empty">Belum ada aspirasi warga yang masuk.</p>}
          </div>
        </motion.div>
      </section>
    </div>
  );
};
