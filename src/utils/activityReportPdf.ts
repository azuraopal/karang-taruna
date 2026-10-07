import { PDFDocument, PDFName, PDFHexString, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { attendanceFontBase64 } from './attendanceFont';
import { summarizeActivity, type ActivityRecap } from './activityRecap';
import { ATTENDANCE_LABELS } from './attendance';
import { buildAttendancePdf } from './attendancePdf';
import { drawMeetingMinutes } from './meetingMinutesPdf';

export async function exportActivityReportPdf(data: ActivityRecap): Promise<Uint8Array> {
  const summary = summarizeActivity(data);
  if (!summary.meetings.length) throw new Error('Belum Ada Rapat Untuk Direkap.');
  if (summary.meetings.length > 100 || data.members.length > 2000) throw new Error('Rekap Mendukung Maksimal 100 Rapat dan 2.000 Anggota.');
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(Uint8Array.from(atob(attendanceFontBase64), c => c.charCodeAt(0)), { subset: true });
  const supported = new Set(font.getCharacterSet());
  const clean = (text: string) => Array.from(text, c => c.codePointAt(0)! < 32 ? ' ' : supported.has(c.codePointAt(0)!) ? c : '?').join('');
  const ink = rgb(0.1, 0.15, 0.2);
  const gray = rgb(0.83, 0.86, 0.88);
  let page = doc.addPage([841.89, 595.28]);
  let y = 545;
  function newPage() {
    if (doc.getPageCount() >= 300) throw new Error('Rekap Melebihi Batas 300 Halaman.');
    page = doc.addPage([841.89, 595.28]); y = 545;
  }
  function lines(text: string, width: number, size = 9) {
    const result: string[] = [];
    for (const paragraph of text.split(/\r?\n/)) {
      let line = '';
      for (const word of clean(paragraph).split(/\s+/)) {
        if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > width) { result.push(line); line = ''; }
        if (line) line += ' ';
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > width) { result.push(line); line = ''; }
          line += char;
        }
      }
      result.push(line);
    }
    return result;
  }
  function text(value: string, size = 10) {
    for (const line of lines(value, 746, size)) {
      if (y < 65) newPage();
      page.drawText(line, { x: 48, y, size, font, color: ink }); y -= size + 5;
    }
  }
  function heading(value: string) { if (y < 110) newPage(); y -= 14; text(value, 13); y -= 8; }
  function table(headers: string[], widths: number[], rows: string[][], title: string) {
    function row(cells: string[], header = false) {
      const wrapped = cells.map((cell, i) => lines(cell, widths[i] - 12));
      const height = Math.max(28, Math.max(...wrapped.map(cell => cell.length)) * 12 + 12);
      let x = 48;
      wrapped.forEach((cell, i) => {
        page.drawRectangle({ x, y: y - height, width: widths[i], height, borderColor: gray, borderWidth: 0.5, color: header ? rgb(0.93, 0.96, 0.95) : rgb(1, 1, 1) });
        cell.forEach((line, n) => page.drawText(line, { x: x + 6, y: y - 16 - n * 12, size: 9, font, color: ink }));
        x += widths[i];
      });
      y -= height;
      return height;
    }
    heading(title); row(headers, true);
    for (const cells of rows) {
      const height = Math.max(28, Math.max(...cells.map((cell, i) => lines(cell, widths[i] - 12).length)) * 12 + 12);
      if (y - height < 65) { newPage(); heading(`${title} (Lanjutan)`); row(headers, true); }
      if (height > 400) throw new Error('Teks Anggota Terlalu Panjang Untuk Rekap.');
      row(cells);
    }
  }
  text('REKAP AGENDA KEGIATAN', 18);
  text(data.group.title, 14); y -= 8;
  text(`${summary.meetings.length} Pertemuan | ${data.members.length} Anggota | ${summary.totalRecords} Catatan Kehadiran`);
  text(`Notulensi Final: ${summary.meetings.filter(m => m.details?.minutesStatus === 'final').length} / ${summary.meetings.length}`);
  text('Tidak Hadir = Izin + Sakit + Alpa. Belum Dicatat tidak dihitung sebagai ketidakhadiran.', 9);
  text('Rekap menggunakan daftar anggota saat ini.', 9);
  heading('Daftar Pertemuan');
  summary.meetings.forEach((meeting, index) => text(`R${index + 1}. ${meeting.title} | ${meeting.date} | Notulensi ${meeting.details?.minutesStatus === 'final' ? 'Final' : 'Draft'}`));
  table(['No', 'Nama Anggota', 'Hadir', 'Tidak Hadir', 'Izin', 'Sakit', 'Alpa', 'Belum Dicatat'], [26, 220, 70, 85, 65, 65, 65, 150], summary.members.map((entry, index) => [String(index + 1), entry.member.nama, String(entry.counts.hadir), String(entry.tidakHadir), String(entry.counts.izin), String(entry.counts.sakit), String(entry.counts.alpa), String(entry.counts.belum)]), 'Ringkasan Kehadiran Anggota');
  for (let offset = 0; offset < summary.meetings.length; offset += 5) {
    newPage();
    const batch = summary.meetings.slice(offset, offset + 5);
    text(data.group.title, 14);
    text('R = Nomor Pertemuan pada Daftar Pertemuan. Belum Dicatat berbeda dari Alpa.', 9);
    table(['No', 'Nama Anggota', ...batch.map((meeting, index) => `R${offset + index + 1}\n${meeting.date}`)], [26, 180, ...batch.map(() => 540 / batch.length)], summary.members.map((entry, index) => [String(index + 1), entry.member.nama, ...entry.attendance.slice(offset, offset + batch.length).map(item => item.status ? ATTENDANCE_LABELS[item.status] : 'Belum Dicatat')]), 'Kehadiran Per Pertemuan');
  }
  const actions = summary.meetings.flatMap((meeting, index) => (meeting.details?.topics || []).filter(topic => topic.decision || topic.owner || topic.dueDate).map(topic => ({ meeting, index, topic })));
  if (actions.length) {
    newPage(); text('REKAP KEPUTUSAN DAN TINDAK LANJUT', 16); text(data.group.title, 12);
    for (const { meeting, index, topic } of actions) {
      heading(`R${index + 1} - ${meeting.title}: ${topic.title}`);
      text(topic.decision || 'Keputusan belum diisi.');
      if (topic.owner) text(`Penanggung Jawab: ${topic.owner}`);
      if (topic.dueDate) text(`Tenggat: ${topic.dueDate}`);
    }
  }
  for (const [index, meeting] of summary.meetings.entries()) {
    const records = data.records.filter(record => record.rapatId === meeting.id);
    const part = await buildAttendancePdf(meeting.date, data.members, records, { meetingId: meeting.id, meetingTitle: `Pertemuan ${index + 1} - ${meeting.title}` });
    await drawMeetingMinutes(part.doc, meeting, { page: part.page, y: part.y, font: part.font });
    if (doc.getPageCount() + part.doc.getPageCount() > 300) throw new Error('Rekap Melebihi Batas 300 Halaman.');
    const pages = await doc.copyPages(part.doc, part.doc.getPageIndices());
    pages.forEach(p => doc.addPage(p));
  }
  doc.getPages().forEach((p, index) => {
    p.drawLine({ start: { x: 48, y: 44 }, end: { x: p.getWidth() - 48, y: 44 }, color: gray, thickness: 0.5 });
    p.drawText(`REKAP AGENDA | Margabakti 07 | Halaman ${index + 1} / ${doc.getPageCount()}`, { x: 48, y: 29, size: 8, font, color: ink });
    p.drawText('Tidak Hadir = Izin + Sakit + Alpa. Belum Dicatat bukan Alpa.', { x: 48, y: 17, size: 7, font, color: ink });
  });
  doc.setTitle(`Rekap Agenda - ${data.group.title}`);
  doc.catalog.set(PDFName.of('KarangTarunaActivityReport'), PDFHexString.fromText(JSON.stringify({ groupId: data.group.id, meetingIds: summary.meetings.map(meeting => meeting.id) })));
  const bytes = await doc.save();
  if (bytes.length > 20 * 1024 * 1024) throw new Error('Rekap PDF Melebihi Batas 20 MB.');
  return bytes;
}
