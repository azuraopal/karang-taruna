import { isAttendanceDate, isAttendanceStatus, type AttendanceStatus } from './attendance.js';
import { emptyMeetingDetails, type MeetingDetails } from './meeting.js';

export interface DocumentAttendance { name: string; status: AttendanceStatus | null; anggotaId?: string; page: number }
export interface MeetingDocument {
  meetingCount: number; date: string; title: string; sourceMeetingId?: string;
  details: MeetingDetails | null; attendance: DocumentAttendance[]; warnings: string[];
}
export interface DocumentPage { text: string; image: string }
export const DOCUMENT_LIMITS = { bytes: 8 * 1024 * 1024, pages: 20, text: 150000, response: 1024 * 1024 };
const object = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw Error('Isi Dokumen Tidak Valid.');
  return v as Record<string, unknown>;
};
function string(v: unknown, max = 200): string {
  if (typeof v !== 'string' || v.length > max) throw Error('Teks Dokumen Tidak Valid Atau Terlalu Panjang.');
  return v.trim();
}
export function validateDocument(value: unknown): MeetingDocument {
  const v = object(value);
  if (v.meetingCount !== 1) throw Error('Gunakan Dokumen Satu Rapat. Rekap Beberapa Rapat Tidak Dapat Diimpor Ke Satu Pertemuan.');
  const date = string(v.date);
  if (date && !isAttendanceDate(date)) throw Error('Tanggal Dokumen Tidak Valid.');
  let details: MeetingDetails | null = null;
  if (v.details !== null) {
    const d = object(v.details);
    if (!Array.isArray(d.topics) || d.topics.length > 100) throw Error('Daftar Topik Tidak Valid.');
    details = { ...emptyMeetingDetails(), location: string(d.location), time: string(d.time), leader: string(d.leader), noteTaker: string(d.noteTaker), topics: d.topics.map((t, i) => {
      const topic = object(t);
      const result = { id: `import-topic-${i + 1}`, title: string(topic.title), discussion: string(topic.discussion, 10000), decision: string(topic.decision, 10000), owner: string(topic.owner), dueDate: string(topic.dueDate) };
      if (!result.title || (result.dueDate && !isAttendanceDate(result.dueDate))) throw Error('Judul Atau Tenggat Topik Tidak Valid.');
      return result;
    }) };
    if (details.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(details.time)) throw Error('Waktu Dokumen Tidak Valid.');
  }
  if (!Array.isArray(v.attendance) || v.attendance.length > 2000 || !Array.isArray(v.warnings) || v.warnings.length > 100) throw Error('Daftar Kehadiran Tidak Valid.');
  const attendance = v.attendance.map(r => {
    const row = object(r);
    if (row.status !== null && !isAttendanceStatus(row.status)) throw Error('Status Kehadiran Tidak Valid.');
    if (!Number.isInteger(row.page) || (row.page as number) < 0 || (row.page as number) > 50) throw Error('Nomor Halaman Tidak Valid.');
    const name = string(row.name);
    if (!name) throw Error('Nama Anggota Kosong.');
    return { name, status: row.status as AttendanceStatus | null, page: row.page as number, ...(row.anggotaId === undefined ? {} : { anggotaId: string(row.anggotaId) }) };
  });
  if (!details && !attendance.length) throw Error('Absensi Atau Notulensi Tidak Ditemukan Dalam Dokumen.');
  return { meetingCount: 1, date, title: string(v.title), details, attendance, warnings: v.warnings.map(w => string(w, 1000)), ...(v.sourceMeetingId === undefined ? {} : { sourceMeetingId: string(v.sourceMeetingId) }) };
}
export function matchDocumentMembers(document: MeetingDocument, members: { id: string; nama: string }[]): MeetingDocument {
  const normalize = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID');
  return { ...document, attendance: document.attendance.map(row => {
    const matches = row.anggotaId ? members.filter(m => m.id === row.anggotaId) : members.filter(m => normalize(m.nama) === normalize(row.name));
    return { ...row, anggotaId: matches.length === 1 ? matches[0].id : undefined };
  }) };
}
