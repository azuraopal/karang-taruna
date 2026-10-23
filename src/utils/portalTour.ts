import type { Berita, DivisiTim, ItemGaleri } from '../types';

export const PORTAL_TOUR_STEPS = 4;

export const TOUR_DIVISIONS = ['Pengurus Harian', 'PSDM', 'Kreativitas dan Humas', 'Sosial & Kegiatan', 'Olahraga dan Kesehatan', 'Pendidikan & Seni Budaya', 'Kerohanian', 'Ekonomi & Kewirausahaan'] as const satisfies readonly DivisiTim[];

/** One reversible scroll timeline drives both the filter and its matching card. */
export function getTeamSequence(progress: number) {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const reveal = Math.min(1, p / 0.32);
  if (p < 0.36 || p >= 0.9) return { reveal, active: -1, ripple: 1, press: 0 };
  const beat = Math.min(3, Math.floor((p - 0.36) / 0.135));
  const local = p - (0.36 + beat * 0.135);
  return { reveal, active: [1, 3, 5, 7][beat], ripple: Math.min(1, local / 0.1), press: Math.sin(Math.PI * Math.min(1, local / 0.065)) };
}

export function getTourContent(berita: Berita[], galeri: ItemGaleri[]) {
  const article = berita.find(item => item.status === 'published');
  const articleImage = article ? [article.gambarUrl, ...(article.gambarUrls || [])].find(url => url?.trim()) : undefined;
  const photos: { source: string; title: string }[] = [];
  const seen = new Set<string>();
  for (const album of galeri) {
    for (const source of [album.gambarUrl, ...(album.gambarUrls || [])]) {
      if (!source?.trim() || seen.has(source)) continue;
      seen.add(source);
      photos.push({ source, title: album.judul });
      if (photos.length === 3) return { article, articleImage, photos };
    }
  }
  return { article, articleImage, photos };
}

export function getTourPosition(progress: number, count = PORTAL_TOUR_STEPS) {
  const safeCount = Math.max(1, Math.floor(count));
  const bounded = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const index = Math.min(safeCount - 1, Math.floor(bounded * safeCount));
  const local = bounded * safeCount - index;
  return { index, local, highlight: local >= 0.22 && local < 0.97 };
}

export function getTourChapterProgress(index: number, count = PORTAL_TOUR_STEPS) {
  return (Math.max(0, Math.min(count - 1, index)) + 0.45) / count;
}
