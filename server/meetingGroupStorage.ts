import { randomUUID } from 'node:crypto';
import { AgendaError, type AgendaJson } from './agendaStorage.js';
import type { MeetingGroup } from '../src/utils/meeting.js';

export function createMeetingGroupStorage(dependencies: {
  usesPg(): Promise<boolean>;
  json: AgendaJson;
  query(sql: string, values?: unknown[]): Promise<{ rows: MeetingGroup[] }>;
}) {
  return {
    async list(): Promise<MeetingGroup[]> {
      if (await dependencies.usesPg()) return (await dependencies.query('SELECT id, title FROM meeting_groups ORDER BY title, id')).rows;
      return [...((dependencies.json.read().meetingGroups || []) as MeetingGroup[])].sort((a, b) => a.title.localeCompare(b.title, 'id-ID'));
    },
    async create(input: unknown): Promise<MeetingGroup> {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => key !== 'title')) throw new AgendaError('Nama Agenda Kegiatan Wajib Diisi.', 400);
      const title = (input as { title?: unknown }).title;
      if (typeof title !== 'string' || !title.trim() || title.trim().length > 160) throw new AgendaError('Nama Agenda Kegiatan Wajib Diisi (Maksimal 160 Karakter).', 400);
      const group = { id: `kegiatan-${randomUUID()}`, title: title.trim() };
      if (await dependencies.usesPg()) return (await dependencies.query('INSERT INTO meeting_groups (id, title) VALUES ($1,$2) RETURNING id, title', [group.id, group.title])).rows[0];
      dependencies.json.update(current => ({ ...current, meetingGroups: [...((current.meetingGroups || []) as MeetingGroup[]), group] }));
      return group;
    },
  };
}
