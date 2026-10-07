import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { isAttendanceDate } from '../src/utils/attendance.js';
import { emptyMeetingDetails, type Meeting, type MeetingDetails } from '../src/utils/meeting.js';

export type Agenda = Meeting;
export interface AgendaJson {
  read(): Record<string, unknown>;
  update(change: (current: Record<string, unknown>) => Record<string, unknown>): void;
}
export interface AgendaDependencies {
  // Inject storage.ts's authoritativeUsesPg, never another connection probe.
  usesPg(): Promise<boolean>;
  json: AgendaJson;
  query(sql: string, values?: unknown[]): Promise<{ rows: Agenda[] }>;
}

/** File adapter for isolated tools/tests. App integration must share storage.ts's cache. */
export function createAgendaJsonFile(file: string): AgendaJson {
  const read = () => {
    if (!fs.existsSync(file)) return {};
    const value: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid JSON Database');
    return value as Record<string, unknown>;
  };
  return { read, update(change) {
    const next = change(read());
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporary, JSON.stringify(next, null, 2), 'utf8');
      fs.renameSync(temporary, file);
    } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  } };
}

export class AgendaError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
export function validateAgenda(input: unknown): asserts input is { title: string; date: string; groupId?: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['title', 'date', 'groupId'].includes(key))) throw new AgendaError('Agenda Harus Berisi Nama Rapat Dan Tanggal.', 400);
  const value = input as Record<string, unknown>;
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.trim().length > 160 || /[\u0000-\u001f\u007f]/.test(value.title)) throw new AgendaError('Nama Rapat Wajib Diisi (Maksimal 160 Karakter).', 400);
  if (!isAttendanceDate(value.date)) throw new AgendaError('Tanggal Harus Valid (YYYY-MM-DD).', 400);
  if (value.groupId !== undefined && (typeof value.groupId !== 'string' || !value.groupId || value.groupId.length > 64)) throw new AgendaError('Agenda Kegiatan Tidak Valid.', 400);
}
export function validateMeetingDetails(input: unknown): asserts input is MeetingDetails {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AgendaError('Detail Rapat Tidak Valid.', 400);
  const data = input as MeetingDetails;
  const keys = ['location', 'time', 'leader', 'noteTaker', 'topics', 'minutesStatus', 'revision'];
  if (Object.keys(data).some(key => !keys.includes(key)) || !Number.isSafeInteger(data.revision) || data.revision < 0) throw new AgendaError('Versi Detail Rapat Tidak Valid.', 400);
  for (const key of ['location', 'time', 'leader', 'noteTaker'] as const) {
    if (typeof data[key] !== 'string' || data[key].length > 200) throw new AgendaError('Informasi Rapat Terlalu Panjang.', 400);
  }
  if (data.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) throw new AgendaError('Waktu Rapat Tidak Valid.', 400);
  if (!['draft', 'final'].includes(data.minutesStatus) || !Array.isArray(data.topics) || data.topics.length > 100) throw new AgendaError('Status Atau Agenda Pembahasan Tidak Valid.', 400);
  const seen = new Set<string>();
  for (const topic of data.topics) {
    if (!topic || typeof topic !== 'object' || Object.keys(topic).some(key => !['id', 'title', 'discussion', 'decision', 'owner', 'dueDate'].includes(key))) throw new AgendaError('Topik Tidak Valid.', 400);
    for (const key of ['id', 'title', 'discussion', 'decision', 'owner', 'dueDate'] as const) {
      const limit = key === 'discussion' || key === 'decision' ? 10000 : 200;
      if (typeof topic[key] !== 'string' || topic[key].length > limit) throw new AgendaError('Isi Topik Tidak Valid Atau Terlalu Panjang.', 400);
    }
    if (!topic.id || seen.has(topic.id) || !topic.title.trim() || (topic.dueDate && !isAttendanceDate(topic.dueDate))) throw new AgendaError('Judul, ID, Atau Tenggat Topik Tidak Valid.', 400);
    seen.add(topic.id);
  }
  if (data.minutesStatus === 'final' && (!data.topics.length || data.topics.some(topic => !topic.discussion.trim() && !topic.decision.trim()))) throw new AgendaError('Lengkapi Hasil Pembahasan Sebelum Finalisasi.', 400);
}

function migrateJson(current: Record<string, unknown>): Record<string, unknown> {
  if (current.meetingAttendanceVersion === 2) return current;
  const agenda = (current.agenda || []) as Agenda[];
  const legacy = (current.absensi || []) as Array<{ tanggal: string; anggotaId: string; status: string }>;
  const records = (current.meetingAttendance || []) as Array<{ rapatId: string; anggotaId: string }>;
  const copied = agenda.flatMap(meeting => legacy.filter(record => record.tanggal === meeting.date && !records.some(r => r.rapatId === meeting.id && r.anggotaId === record.anggotaId)).map(record => ({ ...record, rapatId: meeting.id })));
  return { ...current, meetingAttendanceVersion: 2, meetingAttendance: [...records, ...copied] };
}

export function createAgendaStorage(dependencies: AgendaDependencies) {
  return {
    async list(): Promise<Agenda[]> {
      if (await dependencies.usesPg()) {
        return (await dependencies.query('SELECT id, title, tanggal::text AS date, group_id AS "groupId", details FROM agenda ORDER BY tanggal DESC, id')).rows;
      }
      if (dependencies.json.read().meetingAttendanceVersion !== 2) dependencies.json.update(migrateJson);
      return [...((dependencies.json.read().agenda || []) as Agenda[])].sort((a, b) => b.date.localeCompare(a.date));
    },
    async get(id: string): Promise<Agenda> {
      const record = (await this.list()).find(item => item.id === id);
      if (!record) throw new AgendaError('Rapat Tidak Ditemukan.', 404);
      return record;
    },
    async update(id: string, details: unknown): Promise<Agenda> {
      validateMeetingDetails(details);
      const next = { ...details, revision: details.revision + 1 };
      if (await dependencies.usesPg()) {
        const result = await dependencies.query(`UPDATE agenda SET details = $2::jsonb WHERE id = $1
          AND COALESCE((details->>'revision')::integer, 0) = $3 RETURNING id, title, tanggal::text AS date, group_id AS "groupId", details`, [id, JSON.stringify(next), details.revision]);
        if (!result.rows.length) {
          await this.get(id);
          throw new AgendaError('Rapat Sudah Diubah Pengurus Lain. Muat Ulang Sebelum Menyimpan.', 409);
        }
        return result.rows[0];
      }
      let saved!: Agenda;
      dependencies.json.update(current => {
        const migrated = migrateJson(current);
        const agenda = (migrated.agenda || []) as Agenda[];
        const record = agenda.find(item => item.id === id);
        if (!record) throw new AgendaError('Rapat Tidak Ditemukan.', 404);
        if ((record.details?.revision || 0) !== details.revision) throw new AgendaError('Rapat Sudah Diubah Pengurus Lain. Muat Ulang Sebelum Menyimpan.', 409);
        saved = { ...record, details: next };
        return { ...migrated, agenda: agenda.map(item => item.id === id ? saved : item) };
      });
      return saved;
    },
    async create(input: unknown): Promise<Agenda> {
      validateAgenda(input);
      const record = { id: `agenda-${randomUUID()}`, title: input.title.trim(), date: input.date, ...(input.groupId ? { groupId: input.groupId } : {}), details: emptyMeetingDetails() };
      if (await dependencies.usesPg()) {
        try {
          return (await dependencies.query('INSERT INTO agenda (id, title, tanggal, details, attendance_version, group_id) VALUES ($1, $2, $3, $4::jsonb, 2, $5) RETURNING id, title, tanggal::text AS date, group_id AS "groupId", details', [record.id, record.title, record.date, JSON.stringify(record.details), input.groupId || null])).rows[0];
        } catch (error) {
          if ((error as { code?: string }).code === '23503') throw new AgendaError('Agenda Kegiatan Tidak Ditemukan.', 404);
          throw error;
        }
      }
      dependencies.json.update(current => {
        const migrated = migrateJson(current);
        if (input.groupId && !((migrated.meetingGroups || []) as Array<{ id: string }>).some(group => group.id === input.groupId)) throw new AgendaError('Agenda Kegiatan Tidak Ditemukan.', 404);
        const agenda = (migrated.agenda || []) as Agenda[];
        return { ...migrated, agenda: [...agenda, record] };
      });
      return record;
    },
  };
}
