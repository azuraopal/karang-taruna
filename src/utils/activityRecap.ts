import type { AnggotaTim } from '../types/index.js';
import { isAttendanceDate, isAttendanceStatus, type AttendanceRecord, type AttendanceStatus } from './attendance.js';
import type { Meeting, MeetingGroup } from './meeting.js';

export interface ActivityRecap {
  group: MeetingGroup;
  meetings: Meeting[];
  members: AnggotaTim[];
  records: AttendanceRecord[];
}
export function validateActivityRecap(value: unknown): asserts value is ActivityRecap {
  if (!value || typeof value !== 'object') throw new Error('Rekap Agenda Tidak Valid.');
  const data = value as ActivityRecap;
  if (!data.group || typeof data.group.id !== 'string' || typeof data.group.title !== 'string' || !Array.isArray(data.meetings) || !Array.isArray(data.members) || !Array.isArray(data.records)) throw new Error('Rekap Agenda Tidak Valid.');
  const meetings = new Map<string, string>();
  for (const meeting of data.meetings) {
    if (!meeting || typeof meeting.id !== 'string' || typeof meeting.title !== 'string' || !isAttendanceDate(meeting.date) || meetings.has(meeting.id) || (data.group.id === 'ungrouped' ? !!meeting.groupId : meeting.groupId !== data.group.id)) throw new Error('Daftar Rapat Rekap Tidak Valid.');
    meetings.set(meeting.id, meeting.date);
  }
  const members = new Set<string>();
  for (const member of data.members) {
    if (!member || typeof member.id !== 'string' || typeof member.nama !== 'string' || typeof member.divisi !== 'string' || members.has(member.id)) throw new Error('Daftar Anggota Rekap Tidak Valid.');
    members.add(member.id);
  }
  const seen = new Set<string>();
  for (const record of data.records) {
    const key = JSON.stringify([record?.rapatId, record?.anggotaId]);
    if (!record || !record.rapatId || !meetings.has(record.rapatId) || meetings.get(record.rapatId) !== record.tanggal || !members.has(record.anggotaId) || !isAttendanceStatus(record.status) || seen.has(key)) throw new Error('Catatan Kehadiran Rekap Tidak Valid.');
    seen.add(key);
  }
}
export function summarizeActivity(data: ActivityRecap) {
  validateActivityRecap(data);
  const meetings = [...data.meetings].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const byMeeting = new Map<string, Map<string, AttendanceStatus>>();
  for (const record of data.records) {
    const statuses = byMeeting.get(record.rapatId!) || new Map<string, AttendanceStatus>();
    statuses.set(record.anggotaId, record.status);
    byMeeting.set(record.rapatId!, statuses);
  }
  const members = data.members.map(member => {
    const counts = { hadir: 0, izin: 0, sakit: 0, alpa: 0, belum: 0 };
    const attendance = meetings.map(meeting => {
      const status = byMeeting.get(meeting.id)?.get(member.id);
      if (status) counts[status]++;
      else counts.belum++;
      return { meeting, status };
    });
    return { member, counts, attendance, tidakHadir: counts.izin + counts.sakit + counts.alpa };
  });
  return { meetings, members, totalRecords: data.records.length, unrecorded: meetings.length * members.length - data.records.length };
}
