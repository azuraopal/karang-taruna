import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { ArrowDown, ArrowUpRight, CalendarDays, Check, ChevronRight, Image, MessageCircle, MousePointer2, Search, Send, Users, ZoomIn, Crown, GraduationCap, Megaphone, HeartHandshake, Dumbbell, BookOpen, Heart, BriefcaseBusiness } from 'lucide-react';
import { getTeamSequence, getTourChapterProgress, getTourContent, getTourPosition, TOUR_DIVISIONS } from '../../utils/portalTour';
import { useData } from '../../context/DataContext';
import { imageVariantUrl } from '../../utils/imageVariants';
import { ScribbleTitle } from '../common/ScribbleTitle';
import './PortalTour.css';

const chapters = [
  { title: 'Kenali penggeraknya.', short: 'Tim', text: 'Temukan pengurus dan bidang kerjanya. Cari nama atau pilih divisi untuk mengenal pemuda di balik setiap gerakan.', href: '#tim', action: 'Kenali tim kami', icon: Users },
  { title: 'Dekat dengan kabar terbaru.', short: 'Warta', text: 'Baca cerita kegiatan dan informasi lingkungan. Pilih kategori untuk menemukan kabar yang ingin kamu ikuti.', href: '#berita', action: 'Baca warta warga', icon: CalendarDays },
  { title: 'Lihat cerita di balik aksi.', short: 'Galeri', text: 'Jelajahi dokumentasi kegiatan bersama. Buka album, lihat foto, dan perbesar untuk menikmati setiap momennya.', href: '#galeri', action: 'Jelajahi galeri', icon: Image },
  { title: 'Idemu punya tempat.', short: 'Aspirasi', text: 'Sampaikan saran kegiatan, ide kreatif, atau masukan lingkungan melalui formulir aspirasi warga.', href: '#aspirasi', action: 'Sampaikan aspirasi', icon: MessageCircle },
] as const;

function PreviewPhoto({ source, title }: { source?: string; title: string }) {
  const [original, setOriginal] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!source || failed) return <div className="portal-demo__empty"><Image size={24} /><span>{source ? 'Foto tidak tersedia' : 'Belum ada foto'}</span></div>;
  const variant = imageVariantUrl(source, 640);
  return <img className="portal-demo__image" src={original ? source : variant} alt={title} loading="lazy" decoding="async" onError={() => {
    if (!original && variant !== source) setOriginal(true);
    else setFailed(true);
  }} />;
}

const divisionIcons = [Crown, GraduationCap, Megaphone, HeartHandshake, Dumbbell, BookOpen, Heart, BriefcaseBusiness];
const divisionShortNames = ['Pengurus', 'PSDM', 'Humas', 'Sosial', 'Olahraga', 'Pendidikan', 'Kerohanian', 'Ekonomi'];

function TeamPreview({ active }: { active: number }) {
  return <>
    <span className="portal-demo__eyebrow">Struktur tim · 8 bidang</span>
    <h4>Kenal lebih dekat.</h4>
    <div className="portal-demo__team-toolbar" data-focused={active >= 0}>
      <Search size={15} /><span>Temukan bidangmu</span>
      <div className="portal-demo__team-filter">
        <span>{active < 0 ? 'Semua bidang' : divisionShortNames[active]}</span><ChevronRight size={12} />
        <i className="portal-demo__team-ripple" />
        <MousePointer2 className="portal-demo__cursor" size={20} />
      </div>
    </div>
    <div className="portal-demo__team-grid" data-focused={active >= 0}>
      {TOUR_DIVISIONS.map((division, index) => {
        const Icon = divisionIcons[index];
        return <div className="portal-demo__team-slot" key={division} style={{ '--team-index': index, '--team-side': index % 2 ? 1 : -1 } as CSSProperties}>
          <div className="portal-demo__team-card" data-selected={active === index}>
            <span className="portal-demo__team-icon"><Icon size={19} /></span>
            <b>{division}</b><span className="portal-demo__team-check"><Check size={13} /></span>
          </div>
        </div>;
      })}
    </div>
  </>;
}

function PreviewScreens({ activeTeam }: { activeTeam: number }) {
  const { beritaList, galeriList } = useData();
  const { article, articleImage, photos } = getTourContent(beritaList, galeriList);
  return <>
    <div className="portal-demo__screen" data-scene="0">
      <TeamPreview active={activeTeam} />
    </div>
    <div className="portal-demo__screen portal-demo__news" data-scene="1">
      <div className="portal-demo__cover"><PreviewPhoto key={articleImage} source={articleImage} title={article?.judul || 'Berita terbaru'} /></div>
      <span className="portal-demo__news-label"><CalendarDays size={13} /> Warta terbaru</span>
      <div className="portal-demo__news-story">
        <span className="portal-demo__category">{article?.kategori || 'Warta warga'}</span>
        <b>{article?.judul || 'Belum ada berita terbaru.'}</b>
        <p>{article?.ringkasan || 'Kabar warga akan hadir di sini.'}</p>
        <span className="portal-demo__news-date">{article?.tanggal || 'Kabar dari sekitar kita'}<ArrowUpRight size={15} /></span>
      </div>
    </div>
    <div className="portal-demo__screen" data-scene="2">
      <span className="portal-demo__eyebrow">Galeri kegiatan</span>
      <h4>Momen yang mendekatkan.</h4>
      <div className="portal-demo__album" data-count={photos.length}>
        {photos.length ? photos.map((photo, index) => <div className={`portal-demo__photo${index === 0 ? ' portal-demo__focus' : ''}`} key={photo.source}>
          <PreviewPhoto source={photo.source} title={photo.title} />
          {index === 0 && <span><ZoomIn size={16} /> Lihat lebih dekat</span>}
        </div>) : <div className="portal-demo__photo"><PreviewPhoto title="Galeri kegiatan" /></div>}
        {photos.length > 1 && <div className="portal-demo__gallery-zoom">
          <PreviewPhoto key={photos[0].source} source={photos[0].source} title={photos[0].title} />
          <span><ZoomIn size={14} /> Momen lebih dekat</span>
        </div>}
      </div>
      <div className="portal-demo__article-foot"><Image size={14} /><span>{photos[0]?.title || 'Dokumentasi kegiatan akan hadir di sini.'}</span></div>
    </div>
    <div className="portal-demo__screen" data-scene="3">
      <span className="portal-demo__eyebrow">Pratinjau formulir</span>
      <h4>Mulai dari sebuah ide.</h4>
      <div className="portal-demo__form">
        <span>Nama kamu</span><div className="portal-demo__field" data-field="0"><span>Warga Margabakti</span><Check size={13} /></div>
        <span>Kategori</span><div className="portal-demo__field" data-field="1"><span>Ide kreatif</span><ChevronRight size={13} /></div>
        <span>Pesan</span><div className="portal-demo__message portal-demo__field" data-field="2"><p>{'Bagaimana kalau kita membuat ruang belajar bersama untuk pemuda?'.split(' ').map((word, index) => <span key={index} style={{ '--word-index': index } as CSSProperties}>{word} </span>)}</p></div>
        <div className="portal-demo__send"><Send size={14} /> Sampaikan aspirasi <span><Check size={13} /> Contoh pesan</span></div>
      </div>
    </div>
  </>;
}

export function PortalTour() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [compact, setCompact] = useState(false);
  const [scene, setScene] = useState({ index: 0, highlight: false, activeTeam: -1, formStep: 3 });
  const headingId = useId();
  const previewId = useId();

  useEffect(() => {
    // Browser toolbars shorten phone viewports. Keep the scroll tour enabled
    // in portrait; only very short/landscape layouts need manual navigation.
    const media = window.matchMedia('(prefers-reduced-motion: reduce), (max-height: 550px), (min-width: 901px) and (max-height: 650px)');
    const mobile = window.matchMedia('(max-width: 900px)');
    const sync = () => { setPinned(!media.matches); setCompact(mobile.matches); };
    sync();
    media.addEventListener('change', sync);
    mobile.addEventListener('change', sync);
    return () => { media.removeEventListener('change', sync); mobile.removeEventListener('change', sync); };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    if (!pinned) {
      section.style.setProperty('--chapter-progress', '1');
      section.style.setProperty('--demo-progress', '1');
      section.style.setProperty('--team-progress', '1');
      section.style.setProperty('--team-ripple', '1');
      section.style.setProperty('--team-press', '0');
      return;
    }
    let frame = 0;
    const sync = () => {
      frame = 0;
      const top = Number.parseFloat(getComputedStyle(stage).top) || 0;
      const introHeight = introRef.current?.offsetHeight ?? 0;
      const travel = section.offsetHeight - stage.offsetHeight - introHeight;
      const position = getTourPosition(travel > 0 ? (top - section.getBoundingClientRect().top - introHeight) / travel : 0);
      section.style.setProperty('--chapter-progress', String(position.local));
      section.style.setProperty('--demo-progress', String(Math.min(1, Math.max(0, (position.local - 0.15) / 0.5))));
      const team = getTeamSequence(position.index === 0 ? position.local : 1);
      section.style.setProperty('--team-progress', String(team.reveal));
      section.style.setProperty('--team-ripple', String(team.ripple));
      section.style.setProperty('--team-press', String(team.press));
      const formStep = Math.min(3, Math.floor(position.local * 4));
      setScene(previous => previous.index === position.index && previous.highlight === position.highlight && previous.activeTeam === team.active && previous.formStep === formStep ? previous : { index: position.index, highlight: position.highlight, activeTeam: team.active, formStep });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    observer.observe(stage);
    if (introRef.current) observer.observe(introRef.current);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [pinned, compact]);

  const selectChapter = (index: number) => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    if (!pinned) {
      section.style.setProperty('--chapter-progress', '1');
      section.style.setProperty('--demo-progress', '1');
      section.style.setProperty('--team-progress', '1');
      section.style.setProperty('--team-ripple', '1');
      section.style.setProperty('--team-press', '0');
      setScene({ index, highlight: false, activeTeam: -1, formStep: 3 });
      return;
    }
    const inset = Number.parseFloat(getComputedStyle(stage).top) || 0;
    const introHeight = introRef.current?.offsetHeight ?? 0;
    const top = section.getBoundingClientRect().top + window.scrollY + introHeight - inset;
    const travel = section.offsetHeight - stage.offsetHeight - introHeight;
    window.scrollTo({ top: top + travel * getTourChapterProgress(index), behavior: 'smooth' });
  };

  const visitSection = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector<HTMLElement>(chapters[scene.index].href);
    if (!target) return;
    event.preventDefault();
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  };

  const heading = <header className="portal-tour__heading public-section-heading">
          <div className="portal-tour__eyebrow">Lebih dekat, lebih terlibat</div>
          <h2 id={headingId} className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight"><ScribbleTitle>Satu portal. Banyak cara berperan.</ScribbleTitle></h2>
        </header>;

  return (
    <section id="jelajahi" className="portal-tour" ref={sectionRef} aria-labelledby={headingId} data-pinned={pinned} data-active={scene.index} data-highlight={pinned && scene.highlight} data-form-step={pinned ? scene.formStep : 3}>
      {compact && <div className="portal-tour__intro" ref={introRef}>{heading}</div>}
      <div className="portal-tour__stage" ref={stageRef}>
        {!compact && heading}
        <div className="portal-tour__layout">
          <div className="portal-tour__chapters" aria-label="Fitur portal">
            <div className="portal-tour__chapter-list">
            {chapters.map((chapter, index) => <div className="portal-tour__chapter" data-active={scene.index === index} inert={pinned && compact && scene.index !== index} key={chapter.short}>
              <button type="button" onClick={() => selectChapter(index)} aria-current={scene.index === index ? 'step' : undefined} aria-controls={previewId}>
                <span className="portal-tour__chapter-number">0{index + 1}</span><span>{chapter.title}</span>
              </button>
              <div className="portal-tour__description" aria-hidden={scene.index !== index}><div><p>{chapter.text}</p></div></div>
            </div>)}
            </div>
            <div className="portal-tour__links">
              {chapters.map((chapter, index) => <a key={chapter.short} className="portal-tour__link" data-active={scene.index === index} inert={scene.index !== index} aria-hidden={scene.index !== index} href={chapter.href} onClick={visitSection}>{chapter.action}<ArrowUpRight size={16} aria-hidden="true" /></a>)}
            </div>
          </div>
          <figure className="portal-tour__preview" id={previewId} aria-label={`Pratinjau fitur ${chapters[scene.index].short}`}>
            <div className="portal-tour__backlights" aria-hidden="true">
              {chapters.map((chapter, index) => <span key={chapter.short} className="portal-tour__backlight" data-tone={index} data-active={scene.index === index} />)}
            </div>
            <div className="portal-demo" aria-hidden="true">
              <div className="portal-demo__bar"><span className="portal-demo__brand">katar<span>margabakti</span></span><span>Portal warga · RW 07</span><span className="portal-demo__status" /></div>
              <div className="portal-demo__nav">{chapters.map((chapter, index) => <span key={chapter.short} data-active={scene.index === index}><chapter.icon size={13} />{chapter.short}</span>)}</div>
              <div className="portal-demo__screens"><PreviewScreens activeTeam={pinned ? scene.activeTeam : -1} /></div>
            </div>
          </figure>
        </div>
        <div className="portal-tour__steps" aria-label="Pilih langkah tur">
          {chapters.map((chapter, index) => <button key={chapter.short} type="button" aria-label={`${index + 1}. ${chapter.short}`} aria-current={scene.index === index ? 'step' : undefined} onClick={() => selectChapter(index)}><span /></button>)}
          <span className="portal-tour__counter">0{scene.index + 1} / 04</span>
        </div>
        {pinned && <p className="portal-tour__scroll"><ArrowDown size={13} aria-hidden="true" />{scene.index === chapters.length - 1 ? 'Lanjut mengenal Karang Taruna' : 'Gulir untuk menjelajahi'}</p>}
      </div>
    </section>
  );
}
