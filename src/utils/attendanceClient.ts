import { isAttendanceDate, isAttendanceStatus } from './attendance';

const isRecord = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return isAttendanceDate(record.tanggal) && typeof record.anggotaId === 'string' && isAttendanceStatus(record.status);
};

export async function attendanceRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Permintaan absensi gagal. Silakan coba lagi.');
  const valid = options.method && options.method !== 'GET'
    ? isRecord(data)
    : data && Array.isArray(data.members) && Array.isArray(data.records) && data.records.every(isRecord) &&
      data.members.every((member: Record<string, unknown> | null) => member && typeof member.id === 'string' && typeof member.nama === 'string' && typeof member.divisi === 'string');
  if (!valid) throw new Error('Respons absensi tidak valid. Silakan muat ulang.');
  return data as T;
}
