import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Award,
  BookOpen,
  HeartHandshake,
  Mail,
  MessageSquare,
  Newspaper,
  Send,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

type ShowcaseKind = 'tentang' | 'tim' | 'galeri' | 'berita' | 'aspirasi';

interface Section3DShowcaseProps {
  kind: ShowcaseKind;
  className?: string;
}

interface ScenePanel {
  label: string;
  icon: React.ReactNode;
  x: string;
  y: string;
  z: string;
  turn: string;
}

const showcaseConfig: Record<ShowcaseKind, {
  title: string;
  subtitle: string;
  eyebrow: string;
  panels: ScenePanel[];
}> = {
  tentang: {
    title: 'Gerak\nBersama',
    subtitle: 'Visi, Misi, Nilai',
    eyebrow: 'PROFIL',
    panels: [
      { label: 'Visi', icon: <Target />, x: '0px', y: '-126px', z: '18px', turn: '0deg' },
      { label: 'Sejarah', icon: <BookOpen />, x: '164px', y: '0px', z: '-12px', turn: '-18deg' },
      { label: 'Nilai', icon: <Award />, x: '0px', y: '126px', z: '24px', turn: '0deg' },
      { label: 'Aksi', icon: <HeartHandshake />, x: '-164px', y: '0px', z: '-12px', turn: '18deg' },
    ],
  },
  tim: {
    title: 'Struktur\nAktif',
    subtitle: '7 Divisi Penggerak',
    eyebrow: 'TIM',
    panels: [
      { label: 'PSDM', icon: <Sparkles />, x: '0px', y: '-138px', z: '30px', turn: '0deg' },
      { label: 'Humas', icon: <MessageSquare />, x: '162px', y: '-92px', z: '4px', turn: '-24deg' },
      { label: 'Sosial', icon: <HeartHandshake />, x: '165px', y: '28px', z: '-12px', turn: '-28deg' },
      { label: 'Olahraga', icon: <Award />, x: '78px', y: '128px', z: '22px', turn: '-12deg' },
      { label: 'Pendidikan', icon: <BookOpen />, x: '-78px', y: '128px', z: '22px', turn: '12deg' },
      { label: 'Kerohanian', icon: <Users />, x: '-165px', y: '28px', z: '-12px', turn: '28deg' },
      { label: 'Ekonomi', icon: <Target />, x: '-162px', y: '-92px', z: '4px', turn: '24deg' },
    ],
  },
  galeri: {
    title: 'Momen\nWarga',
    subtitle: 'Rekam Jejak Kegiatan',
    eyebrow: 'GALERI',
    panels: [
      { label: 'Kegiatan Sosial', icon: <HeartHandshake />, x: '0px', y: '-148px', z: '24px', turn: '0deg' },
      { label: 'Olahraga', icon: <Award />, x: '178px', y: '-62px', z: '-8px', turn: '-18deg' },
      { label: 'Pentas Seni', icon: <Sparkles />, x: '132px', y: '124px', z: '18px', turn: '-12deg' },
      { label: 'Lingkungan', icon: <Target />, x: '-132px', y: '124px', z: '18px', turn: '12deg' },
      { label: 'Pelatihan', icon: <BookOpen />, x: '-178px', y: '-62px', z: '-10px', turn: '18deg' },
    ],
  },
  berita: {
    title: 'Warta\nTerkini',
    subtitle: 'Agenda dan Kabar Resmi',
    eyebrow: 'BERITA',
    panels: [
      { label: 'Program Kerja', icon: <Target />, x: '0px', y: '-148px', z: '18px', turn: '0deg' },
      { label: 'Sosial & Warga', icon: <HeartHandshake />, x: '178px', y: '-62px', z: '-10px', turn: '-18deg' },
      { label: 'Olahraga', icon: <Award />, x: '132px', y: '124px', z: '20px', turn: '-12deg' },
      { label: 'Pendidikan', icon: <BookOpen />, x: '-132px', y: '124px', z: '20px', turn: '12deg' },
      { label: 'Pengumuman', icon: <Newspaper />, x: '-172px', y: '-62px', z: '-12px', turn: '18deg' },
    ],
  },
  aspirasi: {
    title: 'Ruang\nSuara',
    subtitle: 'Ide, Saran, Kolaborasi',
    eyebrow: 'ASPIRASI',
    panels: [
      { label: 'Kirim', icon: <Send />, x: '0px', y: '-126px', z: '30px', turn: '0deg' },
      { label: 'Kontak', icon: <Mail />, x: '164px', y: '0px', z: '-10px', turn: '-18deg' },
      { label: 'Ide', icon: <Sparkles />, x: '0px', y: '126px', z: '22px', turn: '0deg' },
      { label: 'Tindak', icon: <MessageSquare />, x: '-164px', y: '0px', z: '-10px', turn: '18deg' },
    ],
  },
};

export const Section3DShowcase: React.FC<Section3DShowcaseProps> = ({ kind, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  const config = showcaseConfig[kind];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`section-scene ${shouldReduceMotion ? 'section-scene--still' : ''} ${className}`}
      data-kind={kind}
      aria-label={`Visual tiga dimensi ${config.eyebrow.toLowerCase()}`}
      role="img"
    >
      <div className="section-scene__glow" aria-hidden="true" />
      <div className="section-scene__world" aria-hidden="true">
        <div className="section-scene__orbit section-scene__orbit--outer" />
        <div className="section-scene__orbit section-scene__orbit--inner" />
        <div className="section-scene__beam section-scene__beam--one" />
        <div className="section-scene__beam section-scene__beam--two" />

        {config.panels.map((panel, index) => (
          <div
            key={panel.label}
            className="section-scene__node"
            data-panel-index={index}
            style={{
              '--scene-x': panel.x,
              '--scene-y': panel.y,
              '--scene-z': panel.z,
              '--scene-turn': panel.turn,
              '--scene-delay': `${index * 90}ms`,
            } as React.CSSProperties}
          >
            <div className="section-scene__node-card">
              <span className="section-scene__node-icon">{panel.icon}</span>
              <span className="section-scene__node-label">{panel.label}</span>
            </div>
          </div>
        ))}

        <div className="section-scene__core">
          <span className="section-scene__eyebrow">{config.eyebrow}</span>
          <strong>{config.title.split('\n').map((line) => <React.Fragment key={line}>{line}<br /></React.Fragment>)}</strong>
          <span className="section-scene__subtitle">{config.subtitle}</span>
        </div>
        <div className="section-scene__floor" />
      </div>
    </motion.div>
  );
};
