import type { Meeting } from './meeting';
import type { AttendanceRecord } from './attendance';
import { buildAttendancePdf, PDF_LIMITS, type PdfMember } from './attendancePdf';
import { drawMeetingMinutes, drawMeetingFooter } from './meetingMinutesPdf';
import { PDFHexString, PDFName } from 'pdf-lib';

export async function exportMeetingReportPdf(meeting: Meeting, members: PdfMember[], records: AttendanceRecord[]) {
  if (records.some(record => record.rapatId && record.rapatId !== meeting.id)) throw new Error('Catatan Absensi Berasal Dari Rapat Lain.');
  const { doc, page, y, font } = await buildAttendancePdf(meeting.date, members, records, { meetingTitle: meeting.title, meetingId: meeting.id });
  await drawMeetingMinutes(doc, meeting, { page, y, font });
  doc.setTitle(`Laporan Rapat - ${meeting.title}`);
  doc.setProducer('Karang Taruna Meeting Report');
  doc.catalog.set(PDFName.of('KarangTarunaMeetingDocument'), PDFHexString.fromText(JSON.stringify({
    meetingCount: 1, date: meeting.date, title: meeting.title, sourceMeetingId: meeting.id,
    details: meeting.details || null, warnings: [], attendance: members.map(member => ({ name: member.nama, anggotaId: member.id, status: records.find(record => record.anggotaId === member.id)?.status || null, page: 0 })),
  })));
  drawMeetingFooter(doc, font, meeting.details?.minutesStatus || 'draft', true);
  const bytes = await doc.save();
  if (bytes.length > PDF_LIMITS.bytes) throw new Error('Laporan PDF Melebihi Batas 8 MB.');
  return bytes;
}
