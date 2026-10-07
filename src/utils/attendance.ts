export const ATTENDANCE_STATUSES = ['izin', 'hadir', 'sakit', 'alpa'] as const;
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];
export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = { izin: 'Izin', hadir: 'Hadir', sakit: 'Sakit', alpa: 'Alpa' };
export interface AttendanceRecord {
  rapatId?: string;
  tanggal: string;
  anggotaId: string;
  status: AttendanceStatus;
}
export function isAttendanceDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value >= '0001-01-01' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return ATTENDANCE_STATUSES.includes(value as AttendanceStatus);
}
