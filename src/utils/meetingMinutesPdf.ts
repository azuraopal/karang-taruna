import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { attendanceFontBase64 } from './attendanceFont';
import { emptyMeetingDetails, type Meeting } from './meeting';
import { isAttendanceDate } from './attendance';

export async function drawMeetingMinutes(doc: PDFDocument, meeting: Meeting, placement?: { page: PDFPage; y: number; font: PDFFont }) {
  if (!isAttendanceDate(meeting.date) || !meeting.title.trim()) throw new Error('Informasi Rapat Tidak Valid.');
  const details = { ...emptyMeetingDetails(), ...meeting.details };
  if (!details.topics.length && !placement) throw new Error('Tambahkan Agenda Pembahasan Sebelum Ekspor.');
  doc.registerFontkit(fontkit);
  const font = placement?.font || await doc.embedFont(Uint8Array.from(atob(attendanceFontBase64), c => c.charCodeAt(0)), { subset: true });
  const supported = new Set(font.getCharacterSet());
  const clean = (text: string) => Array.from(text, c => c.codePointAt(0)! < 32 ? ' ' : supported.has(c.codePointAt(0)!) ? c : '?').join('');
  const width = 499;
  const ink = rgb(0.08, 0.12, 0.18);
  let page = placement?.page || doc.addPage([595.28, 841.89]);
  let y = placement ? placement.y - 32 : 786;
  function newPage() {
    if (doc.getPageCount() >= 50) throw new Error('Notulensi Melebihi Batas 50 Halaman.');
    page = doc.addPage([595.28, 841.89]); y = 786;
  }
  function wrap(text: string, size: number) {
    const lines: string[] = [];
    for (const paragraph of text.split(/\r?\n/)) {
      let line = '';
      for (const word of clean(paragraph).split(/\s+/)) {
        if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > width) { lines.push(line); line = ''; }
        if (line) line += ' ';
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > width) { lines.push(line); line = ''; }
          line += char;
        }
      }
      lines.push(line);
    }
    return lines;
  }
  function text(value: string, size = 10, centered = false) {
    for (const line of wrap(value, size)) {
      if (y < 65) newPage();
      page.drawText(line, { x: centered ? (595.28 - font.widthOfTextAtSize(line, size)) / 2 : 48, y, size, font, color: ink });
      y -= size + 5;
    }
  }
  function heading(value: string) {
    if (y < 125) newPage();
    y -= 12;
    text(value, 12);
    y -= 6;
  }
  const date = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${meeting.date}T00:00:00Z`));
  if (y < 240) newPage();
  doc.setTitle(`Notulensi Rapat - ${meeting.title}`);
  text('NOTULENSI RAPAT', 18, true);
  text(meeting.title, 12, true);
  text(date, 10, true);
  y -= 20;
  for (const [label, value] of [['Lokasi', details.location], ['Waktu', details.time ? `${details.time} WIB` : ''], ['Pemimpin Rapat', details.leader], ['Notulis', details.noteTaker]]) if (value) text(`${label}: ${value}`);
  heading('Agenda Pembahasan');
  details.topics.forEach((topic, index) => text(`${index + 1}. ${topic.title}`));
  if (!details.topics.length) text('Notulensi belum diisi.');
  for (const [index, topic] of details.topics.entries()) {
    heading(`${index + 1}. ${topic.title}`);
    text(topic.discussion || 'Hasil pembahasan belum diisi.');
    if (topic.decision) { y -= 6; text('Keputusan / Tindak Lanjut', 11); text(topic.decision); }
    if (topic.owner) { y -= 6; text(`Penanggung Jawab: ${topic.owner}`); }
    if (topic.dueDate) text(`Tenggat: ${topic.dueDate}`);
  }
  return font;
}
export function drawMeetingFooter(doc: PDFDocument, font: PDFFont, status: 'draft' | 'final', attendance = false) {
  doc.getPages().forEach((p, index) => {
    p.drawLine({ start: { x: 48, y: 46 }, end: { x: 547, y: 46 }, color: rgb(0.8, 0.83, 0.86), thickness: 0.5 });
    p.drawText(`${status === 'final' ? 'FINAL' : 'DRAFT'} | Margabakti 07 | Halaman ${index + 1} / ${doc.getPageCount()}`, { x: 48, y: 30, size: 8, font, color: rgb(0.4, 0.45, 0.5) });
    if (attendance) p.drawText('Sel absensi kosong = Belum Dicatat, bukan Alpa', { x: 48, y: 18, size: 7, font, color: rgb(0.4, 0.45, 0.5) });
  });
}
export async function exportMinutesPdf(meeting: Meeting): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await drawMeetingMinutes(doc, meeting);
  drawMeetingFooter(doc, font, meeting.details?.minutesStatus || 'draft');
  return doc.save();
}
