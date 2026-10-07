import { attendanceRequest } from './attendanceClient';
import { isAttendanceDate, isAttendanceStatus, type AttendanceRecord } from './attendance';
import type { AttendancePreview } from './attendancePdf';
export interface ImportResult { saved: number; failures: { anggotaId: string; message: string }[]; refreshError?: string }
export async function applyAttendanceImport(
  preview: AttendancePreview, selectedDate: string, confirmed: boolean,
  request: (path: string, options: RequestInit) => Promise<AttendanceRecord> = attendanceRequest,
  refresh: () => Promise<void>,
  attendancePath = `/api/absensi/${selectedDate}`,
): Promise<ImportResult> {
  if (!confirmed) throw new Error('Impor membutuhkan konfirmasi.');
  if (preview.issues?.length) throw new Error('Impor diblokir: selesaikan semua masalah PDF terlebih dahulu.');
  if (!isAttendanceDate(selectedDate) || preview.tanggal !== selectedDate) throw new Error('Tanggal PDF harus sama dengan tanggal yang dipilih.');
  const seen = new Set<string>();
  for (const r of preview.records) {
    if (r.tanggal !== selectedDate || !isAttendanceStatus(r.status) || !r.anggotaId || seen.has(r.anggotaId)) throw new Error('Catatan impor tidak valid.');
    seen.add(r.anggotaId);
  }
  const result: ImportResult = { saved: 0, failures: [] };
  for (const r of preview.records) {
    try {
      const actual = await request(`${attendancePath}/${encodeURIComponent(r.anggotaId)}`, { method: 'PUT', body: JSON.stringify({ status: r.status }) });
      if (actual.anggotaId !== r.anggotaId || actual.tanggal !== selectedDate || actual.status !== r.status) throw new Error('Respons simpan tidak cocok. Muat ulang untuk memeriksa.');
      result.saved++;
    } catch (error) { result.failures.push({ anggotaId: r.anggotaId, message: error instanceof Error ? error.message : 'Gagal menyimpan.' }); }
  }
  try { await refresh(); } catch (error) { result.refreshError = error instanceof Error ? error.message : 'Gagal memuat ulang.'; }
  return result;
}
