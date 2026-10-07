import { PDFDocument, PDFName, PDFHexString, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { attendanceFontBase64 } from './attendanceFont';
import { isAttendanceDate, isAttendanceStatus, type AttendanceRecord } from './attendance';

export interface PdfMember { id: string; nama: string; jabatan?: string; divisi: string }
export const ATTENDANCE_PDF_COLUMNS = ['No', 'Nama', 'Jabatan', 'Divisi', 'Status'] as const;
export interface AttendancePreviewRow { page: number; nama: string; jabatan: string; divisi: string; status: string; anggotaId?: string; matchedName?: string; matchedJabatan?: string; matchedDivisi?: string; sourceDivisi?: string }
export interface AttendancePreview { tanggal: string; records: AttendanceRecord[]; unrecorded: number; dateOrigin?: 'pdf' | 'selected'; detectedHeaders?: string[]; detectedMappings?: string[]; rows?: AttendancePreviewRow[]; issues?: string[] }
export const PDF_LIMITS = { bytes: 8 * 1024 * 1024, metadata: 512 * 1024, members: 2000, pages: 50, text: 200 } as const;
const KEY = PDFName.of('KarangTarunaAttendance');
const FORMAT = 'karang-taruna/attendance';
function fail(message: string): never { throw new Error(message); }
function validatePayload(value: unknown, members: PdfMember[], meetingId?: string): AttendancePreview {
  if (!value || typeof value !== 'object') fail('Metadata PDF tidak valid.');
  const p = value as Record<string, unknown>;
  if (p.format !== FORMAT || p.version !== 1) fail('Format atau versi PDF tidak didukung. Gunakan PDF ekspor aplikasi ini.');
  if (p.meetingId !== undefined && (typeof p.meetingId !== 'string' || (meetingId && p.meetingId !== meetingId))) fail('PDF Berasal Dari Rapat Lain. Pilih PDF Untuk Rapat Ini.');
  if (!isAttendanceDate(p.tanggal) || !Array.isArray(p.rows) || p.rows.length > PDF_LIMITS.members) fail('Tanggal atau jumlah baris PDF tidak valid.');
  const known = new Set(members.map(m => m.id)); const seen = new Set<string>();
  const records: AttendanceRecord[] = []; let unrecorded = 0;
  for (const value of p.rows) {
    if (!value || typeof value !== 'object') fail('Baris PDF tidak valid.');
    const row = value as Record<string, unknown>;
    if (typeof row.anggotaId !== 'string' || !row.anggotaId || row.anggotaId.length > 200 || seen.has(row.anggotaId)) fail('ID anggota kosong, terlalu panjang, atau duplikat.');
    if (!known.has(row.anggotaId)) fail(`Anggota tidak dikenal: ${row.anggotaId}`);
    seen.add(row.anggotaId);
    if (row.status === null) { unrecorded++; continue; }
    if (!isAttendanceStatus(row.status)) fail('Status PDF tidak valid.');
    records.push({ anggotaId: row.anggotaId, tanggal: p.tanggal, status: row.status });
  }
  return { tanggal: p.tanggal, records, unrecorded };
}
export interface PdfExportOptions { meetingTitle?: string; meetingId?: string }
export async function buildAttendancePdf(tanggal: string, members: PdfMember[], records: AttendanceRecord[], options: PdfExportOptions = {}) {
  if (options.meetingTitle !== undefined && (typeof options.meetingTitle !== 'string' || options.meetingTitle.length > 200)) fail('Judul rapat tidak valid.');
  if (!isAttendanceDate(tanggal) || members.length > PDF_LIMITS.members) fail('Tanggal atau jumlah anggota tidak valid.');
  const ids = new Set<string>();
  for (const member of members) {
    if (!member.id || member.id.length > 200 || ids.has(member.id) || typeof member.nama !== 'string' || typeof member.divisi !== 'string' || member.nama.length > PDF_LIMITS.text || member.divisi.length > PDF_LIMITS.text || (member.jabatan !== undefined && (typeof member.jabatan !== 'string' || member.jabatan.length > PDF_LIMITS.text))) fail('Data anggota tidak valid atau teks terlalu panjang.');
    ids.add(member.id);
  }
  const statuses = new Map<string, AttendanceRecord['status']>();
  for (const record of records) {
    if (record.tanggal !== tanggal || !ids.has(record.anggotaId) || statuses.has(record.anggotaId) || !isAttendanceStatus(record.status)) fail('Catatan absensi tidak valid, duplikat, atau berbeda tanggal.');
    statuses.set(record.anggotaId, record.status);
  }
  const payload = { format: FORMAT, version: 1, meetingId: options.meetingId, tanggal, rows: members.map(m => ({ anggotaId: m.id, status: statuses.get(m.id) ?? null })) };
  const json = JSON.stringify(payload);
  if (new TextEncoder().encode(json).length > PDF_LIMITS.metadata) fail('Metadata terlalu besar.');
  const doc = await PDFDocument.create(); doc.registerFontkit(fontkit);
  const font = await doc.embedFont(Uint8Array.from(atob(attendanceFontBase64), c => c.charCodeAt(0)), { subset: true });
  doc.setTitle(`Absensi — ${tanggal}`); doc.setProducer('Karang Taruna Attendance v1');
  doc.catalog.set(KEY, PDFHexString.fromText(json));
  const supported = new Set(font.getCharacterSet());
  const clean = (text: string) => Array.from(text, c => c.codePointAt(0)! < 32 ? ' ' : supported.has(c.codePointAt(0)!) ? c : '?').join('');
  const wrap = (text: string, width: number): string[] => {
    const out: string[] = []; let line = '';
    for (const word of clean(text).split(/\s+/)) {
      if (line && font.widthOfTextAtSize(`${line} ${word}`, 9) > width) { out.push(line); line = ''; }
      for (const char of word) {
        if (font.widthOfTextAtSize(line + char, 9) > width) { out.push(line); line = ''; }
        line += char;
      }
      line += ' ';
    }
    if (line.trim()) out.push(line.trim()); return out.length ? out : [''];
  };
  const xs = [36, 64, 209, 309, 409, 447, 485, 523, 561];
  const border = rgb(.65, .45, .12), amber = rgb(1, .93, .72);
  let page = doc.addPage([595.28, 841.89]); let y = 700;
  const centered = (text: string, x: number, width: number, baseline: number, size = 9) => page.drawText(text, { x: x + (width - font.widthOfTextAtSize(text, size)) / 2, y: baseline, size, font });
  const box = (x: number, bottom: number, width: number, height: number, fill = false) => page.drawRectangle({ x, y: bottom, width, height, borderColor: border, borderWidth: .7, ...(fill ? { color: amber } : {}) });
  const header = () => {
    centered('ABSENSI RAPAT KARANG TARUNA', 36, 525, 792, 17);
    const title = wrap(options.meetingTitle || 'Laporan Kehadiran Anggota', 510);
    title.forEach((line, i) => centered(line, 36, 525, 769 - i * 12, 9));
    centered(`Tanggal: ${tanggal}`, 36, 525, 751 - (title.length - 1) * 12, 10);
    y = 700 - Math.max(0, title.length - 2) * 12;
    ['No', 'Nama', 'Jabatan', 'Divisi'].forEach((label, i) => { box(xs[i], y, xs[i+1]-xs[i], 36, true); centered(label, xs[i], xs[i+1]-xs[i], y+14); });
    box(xs[4], y+18, xs[8]-xs[4], 18, true); centered('Status', xs[4], xs[8]-xs[4], y+23);
    ['Hadir','Izin','Sakit','Alpa'].forEach((label,i) => { box(xs[i+4], y, 38, 18, true); centered(label, xs[i+4], 38, y+5); });
  };
  header();
  for (const [index, member] of members.entries()) {
    const cells = [String(index+1), member.nama, member.jabatan?.trim() || 'Belum Diisi', member.divisi?.trim() || 'Belum Diisi'].map((text,i)=>wrap(text, xs[i+1]-xs[i]-10));
    const height = Math.max(23, Math.max(...cells.map(c=>c.length))*12+10);
    if (y-height < 62) { if (doc.getPageCount() >= PDF_LIMITS.pages) fail('Laporan melebihi batas 50 halaman.'); page = doc.addPage([595.28,841.89]); header(); }
    cells.forEach((cell,i)=> { box(xs[i], y-height, xs[i+1]-xs[i], height); cell.forEach((line,j)=>page.drawText(line.trim(), {x:xs[i]+5,y:y-14-j*12,size:9,font})); });
    ['hadir','izin','sakit','alpa'].forEach((status,i)=> {
      const x=xs[i+4]; box(x,y-height,38,height);
      if (statuses.get(member.id) === status) {
        const cy=y-height/2; page.drawLine({start:{x:x+13,y:cy},end:{x:x+17,y:cy-4},thickness:1.6});
        page.drawLine({start:{x:x+17,y:cy-4},end:{x:x+25,y:cy+6},thickness:1.6});
      }
    });
    y -= height;
  }
  return { doc, font, page, y };
}
export async function exportAttendancePdf(tanggal: string, members: PdfMember[], records: AttendanceRecord[], options: PdfExportOptions = {}): Promise<Uint8Array> {
  const { doc, font } = await buildAttendancePdf(tanggal, members, records, options);
  doc.getPages().forEach((p,i)=>p.drawText(`Halaman ${i+1} / ${doc.getPageCount()} · Sel kosong = Belum Dicatat, bukan Alpa`, {x:36,y:35,size:8,font}));
  const bytes = await doc.save();
  if (bytes.length > PDF_LIMITS.bytes) fail('PDF terlalu besar.');
  return bytes;
}
export interface PdfImportOptions { selectedDate?: string; lockedDate?: boolean; meetingId?: string }
export async function parseAttendancePdf(bytes: Uint8Array, members: PdfMember[], options: PdfImportOptions = {}): Promise<AttendancePreview> {
  if (bytes.length > PDF_LIMITS.bytes) fail('PDF melebihi batas 8 MB.');
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') fail('Signature PDF tidak valid.');
  let doc: PDFDocument;
  try { doc = await PDFDocument.load(bytes, { throwOnInvalidObject: true, updateMetadata: false }); }
  catch { return fail('PDF rusak atau terenkripsi.'); }
  if (doc.catalog.has(PDFName.of('KarangTarunaActivityReport'))) fail('PDF Rekap Agenda Berisi Beberapa Rapat. Gunakan PDF Satu Rapat Untuk Impor Absensi.');
  if (doc.getPageCount() < 1 || doc.getPageCount() > PDF_LIMITS.pages) fail('Jumlah halaman PDF tidak didukung.');
  const metadata = doc.catalog.get(KEY);
  if (metadata === undefined) {
    const { parseTextAttendancePdf } = await import('./attendancePdfText');
    return parseTextAttendancePdf(bytes, members, options);
  }
  if (!(metadata instanceof PDFHexString) || metadata.asBytes().length > PDF_LIMITS.metadata * 2 + 2) fail('Metadata PDF tidak didukung.');
  let payload: unknown;
  try { const text = metadata.decodeText(); if (new TextEncoder().encode(text).length > PDF_LIMITS.metadata) fail('Metadata terlalu besar.'); payload = JSON.parse(text); }
  catch { return fail('Metadata PDF rusak atau terlalu besar.'); }
  return validatePayload(payload, members, options.meetingId);
}
