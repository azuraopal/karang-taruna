import { isAttendanceDate, isAttendanceStatus } from './attendance';
import type { AttendancePreview, AttendancePreviewRow, PdfMember, PdfImportOptions } from './attendancePdf';

const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
type Field = 'no' | 'nama' | 'jabatan' | 'divisi' | 'status' | 'hadir' | 'izin' | 'sakit' | 'alpa';
const roles: Record<string, string> = {ketua: 'Ketua', wakil: 'Wakil Ketua', sekre: 'Sekretaris', wasekre: 'Wakil Sekretaris', bend: 'Bendahara', wabend: 'Wakil Bendahara', koor: 'Koordinator', angg: 'Anggota'};
const aliases: Record<string, Field> = { no: 'no', nomor: 'no', nama: 'nama', 'nama anggota': 'nama', 'nama lengkap': 'nama', jabatan: 'jabatan', posisi: 'jabatan', divisi: 'divisi', bidang: 'divisi', hadir: 'hadir', izin: 'izin', sakit: 'sakit', alpa: 'alpa', status: 'status', kehadiran: 'status', 'status kehadiran': 'status' };
interface Cell { text: string; x: number; y: number; width: number; height: number }
interface Column { field: Field; label: string; x: number }
function lines(items: Cell[], deadline: number): Cell[][] {
  const output: Cell[][] = [];
  for (const item of [...items].sort((a, b) => b.y - a.y || a.x - b.x)) {
    if (Date.now() > deadline) throw new Error('Batas waktu membaca PDF terlampaui.');
    const line = output.find(row => Math.abs(row[0].y - item.y) <= 4);
    if (line) line.push(item); else output.push([item]);
  }
  return output.map(line => line.sort((a, b) => a.x - b.x));
}
function columns(line: Cell[]): Column[] | undefined {
  const out = line.map(c => ({ field: aliases[normalize(c.text).replace(/\.$/, '')], label: c.text, x: c.x + c.width / 2 })).filter(c => c.field);
  return out.some(c => c.field === 'nama') && out.some(c => c.field === 'status') ? out : undefined;
}
function dateFromText(text: string): string | undefined {
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const local = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})\b/);
  const date = iso?.[1] ?? (local ? `${local[3].length === 2 ? '20' + local[3] : local[3]}-${local[2].padStart(2, '0')}-${local[1].padStart(2, '0')}` : undefined);
  return isAttendanceDate(date) ? date : undefined;
}
export async function parseTextAttendancePdf(bytes: Uint8Array, members: PdfMember[], options: PdfImportOptions): Promise<AttendancePreview> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = typeof window === 'undefined'
    ? new URL('../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).href
    : (await import('pdfjs-dist/legacy/build/pdf.worker.mjs?url')).default;
  const task = pdfjs.getDocument({ data: Uint8Array.from(bytes),  useSystemFonts: false, disableFontFace: true, useWorkerFetch: false, ...(typeof window === 'undefined' ? { standardFontDataUrl: new URL(/* @vite-ignore */ '../../node_modules/pdfjs-dist/standard_fonts/', import.meta.url).pathname } : {}) });
  const deadline = Date.now() + 15000;
  const timed = async <T>(promise: Promise<T>): Promise<T> => {
    let timer: ReturnType<typeof setTimeout>;
    try { return await Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error('Batas waktu membaca PDF terlampaui.')), Math.max(1, deadline - Date.now())); })]); }
    finally { clearTimeout(timer!); }
  };
  let doc;
  try { doc = await timed(task.promise); } catch (error) { await task.destroy(); throw error; }
  const rows: AttendancePreviewRow[] = []; const detectedHeaders: string[] = []; let tanggal: string | undefined;
  let carried: Column[] | undefined; let itemCount = 0; let textCount = 0;
  try {
    if (doc.numPages > 50) throw new Error('Jumlah halaman PDF tidak didukung.');
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await timed(doc.getPage(p)); const content = await timed(page.getTextContent());
      itemCount += content.items.length;
      textCount += content.items.reduce((n, i) => n + ('str' in i ? i.str.length : 0), 0);
      if (itemCount > 100000 || textCount > 1000000) throw new Error('Batas item/teks PDF terlampaui.');
      const items: Cell[] = content.items.filter(item => 'str' in item && item.str.trim()).map(item => {
        if (!('str' in item)) throw new Error('Teks PDF tidak didukung.');
        return { text: item.str.trim(), x: item.transform[4], y: item.transform[5], width: item.width, height: item.height };
      });
      const pageLines = lines(items, deadline);
      if (items.some(i => /notulensi/i.test(i.text))) { page.cleanup(); carried = undefined; continue; }
      let cols: Column[] | undefined = carried; let previousY = 0;
      const grouped = items.filter(c => aliases[normalize(c.text)] && ['no','nama','jabatan','divisi','hadir','izin','sakit','alpa'].includes(aliases[normalize(c.text)]));
      const nameHeader = grouped.find(c => aliases[normalize(c.text)] === 'nama');
      if (nameHeader && ['hadir','izin','sakit','alpa'].every(s => grouped.some(c => normalize(c.text) === s && Math.abs(c.y-nameHeader.y)<22))) {
        cols = grouped.filter(c => Math.abs(c.y-nameHeader.y)<22).map(c => ({field:aliases[normalize(c.text)],label:c.text,x:c.x+c.width/2})).sort((a,b)=>a.x-b.x);
        carried = cols; for (const c of cols) if (!detectedHeaders.includes(c.label)) detectedHeaders.push(c.label);
        if (!detectedHeaders.includes('Status')) detectedHeaders.push('Status');
      }
      for (const line of pageLines) {
        tanggal ??= dateFromText(line.map(c => c.text).join(' '));
        const header = columns(line);
        if (header) { if (!cols?.some(c => c.field === 'hadir')) { cols = header; carried = header; } for (const c of header) if (!detectedHeaders.includes(c.label)) detectedHeaders.push(c.label); continue; }
        if (!cols) continue;
        if (cols.some(c => c.field === 'hadir') && line.some(c => aliases[normalize(c.text)] === 'nama' || ['hadir','izin','sakit','alpa'].includes(normalize(c.text)))) continue;
        const fields: Record<Field, string> = { no: '', nama: '', jabatan: '', divisi: '', status: '', hadir:'', izin:'', sakit:'', alpa:'' };
        for (const cell of line) {
          const col = [...cols].sort((a,b) => Math.abs(a.x-(cell.x+cell.width/2))-Math.abs(b.x-(cell.x+cell.width/2)))[0];
          if (col) fields[col.field] = `${fields[col.field]} ${cell.text}`.trim();
        }
        if (!fields.nama) continue;
        const checkbox = cols.some(c => c.field === 'hadir');
        if (checkbox && !/^\d+[.)]?$/.test(fields.no)) continue;
        if (checkbox) {
          const selected = ['hadir','izin','sakit','alpa'].filter(s => /^[✔✓☑xX]$/.test(fields[s as Field]));
          fields.status = selected.length > 1 ? 'Lebih dari satu status dicentang' : selected[0] ?? '';
          if (['hadir','izin','sakit','alpa'].some(s => fields[s as Field] && !/^[✔✓☑xX□☐]$/.test(fields[s as Field]))) fields.status = 'Tanda status tidak dikenal';
        }
        const previous = rows.at(-1);
        if (!fields.no && !fields.status && !fields.jabatan && !fields.divisi && previous?.page === p && previousY - line[0].y <= Math.max(16, line[0].height * 1.6)) {
          previous.nama += ` ${fields.nama.replace(/\s+/g, ' ')}`;
        } else rows.push({ page: p, nama: fields.nama.replace(/\s+/g, ' '), jabatan: fields.jabatan, divisi: fields.divisi, status: fields.status });
        if (rows.length > 2000) throw new Error('Batas jumlah baris PDF terlampaui.');
        if (Date.now() > deadline) throw new Error('Batas waktu membaca PDF terlampaui.');
        previousY = line[0].y;
      }
      page.cleanup();
    }
  } finally { await task.destroy(); }
  const dateOrigin = tanggal ? 'pdf' : 'selected';
  tanggal ??= options.selectedDate;
  if (!itemCount || !textCount) throw new Error('PDF gambar/scan tidak didukung; OCR diperlukan. Tidak ada OCR otomatis.');
  if (!isAttendanceDate(tanggal)) throw new Error('Tanggal PDF tidak ditemukan; tanggal agenda harus dipilih.');
  if (!detectedHeaders.length || !rows.length) throw new Error('Tabel PDF tidak didukung: header Nama dan Status diperlukan.');
  const result: AttendancePreview = { tanggal, dateOrigin, detectedHeaders, rows, issues: [], detectedMappings: [], records: [], unrecorded: 0 };
  const seen = new Set<string>();
  for (const [index, row] of rows.entries()) {
    const issue = (message: string) => result.issues!.push(`Halaman ${row.page}, Baris ${index + 1} (${row.nama || 'Nama Kosong'}): ${message}`);
    const status = normalize(row.status);
    if (!status || status === 'belum dicatat') result.unrecorded++;
    const sourceRole = roles[normalize(row.divisi)];
    if (sourceRole && !row.jabatan) {
      const mapping = `Divisi → Jabatan: ${row.divisi} → ${sourceRole}`;
      if (!result.detectedMappings!.includes(mapping)) result.detectedMappings!.push(mapping);
      row.jabatan = sourceRole; row.sourceDivisi = row.divisi; row.divisi = '';
    }
    const names = members.filter(m => normalize(m.nama) === normalize(row.nama));
    const candidates = names.filter(m => (!row.divisi || normalize(m.divisi) === normalize(row.divisi)) && (!row.jabatan || normalize(m.jabatan ?? '') === normalize(row.jabatan)));
    if (!names.length) { issue('Anggota tidak dikenal.'); continue; }
    if (!candidates.length) { issue('Divisi/Jabatan tidak cocok dengan data anggota.'); continue; }
    if (candidates.length !== 1) { issue('Nama ambigu; Divisi/Jabatan diperlukan untuk membedakan anggota.'); continue; }
    const member = candidates[0];
    row.anggotaId = member.id; row.matchedName = member.nama; row.matchedJabatan = member.jabatan; row.matchedDivisi = member.divisi;
    if (seen.has(member.id)) { issue('Anggota duplikat di PDF.'); continue; }
    seen.add(member.id);
    if (!status || status === 'belum dicatat') continue;
    if (!isAttendanceStatus(status)) { issue(`Status tidak valid: ${row.status}. Hanya Hadir, Izin, Sakit, Alpa.`); continue; }
    result.records.push({ anggotaId: member.id, tanggal, status });
  }
  return result;
}
