import { Router } from 'express';
import { requireAttendanceSession } from './session.js';
import { AgendaError } from './agendaStorage.js';
import { agendaStorage, meetingGroupStorage, getMeetingAttendance, saveMeetingAttendance, getTim, getActivityRecap, attendanceVersion, importMeetingDocument } from './storage.js';
import { detectMeetingDocument, documentAIConfigured } from './meetingDocumentAI.js';
import { isAttendanceStatus } from '../src/utils/attendance.js';

export const agendaRouter = Router();
agendaRouter.use(requireAttendanceSession);
agendaRouter.get('/document-ai', (_req, res) => res.json({ enabled: documentAIConfigured() }));
const analysing = new Set<string>();
agendaRouter.post('/:id/document-detect', async (req, res) => {
  const actorId = res.locals.attendanceActor.id as string;
  if (analysing.has(actorId) || analysing.size >= 3) return res.status(429).json({ error: 'Deteksi Dokumen Sedang Berjalan. Coba Lagi Setelah Selesai.' });
  analysing.add(actorId);
  try { await agendaStorage.get(req.params.id); res.json(await detectMeetingDocument(req.body?.pages)); }
  catch (error) { res.status(error instanceof AgendaError ? error.status : 503).json({ error: error instanceof AgendaError ? error.message : 'Deteksi Dokumen Gagal. Tidak Ada Data yang Disimpan.' }); }
  finally { analysing.delete(actorId); }
});
agendaRouter.get('/:id/import-context', async (req, res) => {
  try {
    const meeting = await agendaStorage.get(req.params.id);
    const records = await getMeetingAttendance(req.params.id);
    res.json({ meeting, members: await getTim(), attendanceVersion: attendanceVersion(records) });
  } catch (error) { res.status(error instanceof AgendaError ? error.status : 503).json({ error: error instanceof AgendaError ? error.message : 'Gagal Memuat Rapat.' }); }
});
agendaRouter.post('/:id/document-import', async (req, res) => {
  try { res.json(await importMeetingDocument(req.params.id, req.body, res.locals.attendanceActor)); }
  catch (error) { res.status(error instanceof AgendaError ? error.status : 503).json({ error: error instanceof AgendaError ? error.message : 'Impor Gagal. Tidak Ada Perubahan yang Disimpan.' }); }
});
agendaRouter.get('/', async (_req, res) => {
  try { res.json(await agendaStorage.list()); }
  catch { res.status(503).json({ error: 'Gagal Memuat Agenda. Silakan Coba Lagi.' }); }
});
agendaRouter.post('/', async (req, res) => {
  try { res.status(201).json(await agendaStorage.create(req.body)); }
  catch (error) {
    res.status(error instanceof AgendaError ? error.status : 503).json({ error: error instanceof AgendaError ? error.message : 'Gagal Menyimpan Agenda. Perubahan Belum Tersimpan; Silakan Coba Lagi.' });
  }
});

agendaRouter.get('/groups', async (_req, res) => {
  try { res.json(await meetingGroupStorage.list()); }
  catch { res.status(503).json({ error: 'Gagal Memuat Agenda Kegiatan.' }); }
});
agendaRouter.post('/groups', async (req, res) => {
  try { res.status(201).json(await meetingGroupStorage.create(req.body)); }
  catch (error) { res.status(error instanceof AgendaError ? error.status : 503).json({ error: error instanceof AgendaError ? error.message : 'Gagal Menyimpan Agenda Kegiatan.' }); }
});
agendaRouter.get('/groups/:id/report', async (req, res) => {
  try { res.json(await getActivityRecap(req.params.id)); }
  catch (error) { res.status(error instanceof AgendaError ? error.status : 503).json({ error: error instanceof AgendaError ? error.message : 'Gagal Memuat Rekap Agenda.' }); }
});
agendaRouter.get('/:id', async (req, res) => {
  try { res.json(await agendaStorage.get(req.params.id)); }
  catch (error) { res.status(error instanceof AgendaError ? error.status : 503).json({ error: error instanceof AgendaError ? error.message : 'Gagal Memuat Rapat.' }); }
});
agendaRouter.put('/:id', async (req, res) => {
  try { res.json(await agendaStorage.update(req.params.id, req.body)); }
  catch (error) { res.status(error instanceof AgendaError ? error.status : 503).json({ error: error instanceof AgendaError ? error.message : 'Gagal Menyimpan Notulensi. Silakan Coba Lagi.' }); }
});
agendaRouter.get('/:id/attendance', async (req, res) => {
  try { res.json({ records: await getMeetingAttendance(req.params.id), members: await getTim() }); }
  catch (error) { res.status(error instanceof AgendaError ? error.status : 503).json({ error: error instanceof AgendaError ? error.message : 'Gagal Memuat Kehadiran.' }); }
});
agendaRouter.all('/:id/attendance/:anggotaId', async (req, res) => {
  if (!['PUT', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Metode Tidak Didukung.' });
  if (req.method === 'PUT' && !isAttendanceStatus(req.body?.status)) return res.status(400).json({ error: 'Pilih Status Kehadiran yang Valid.' });
  try { res.json(await saveMeetingAttendance(req.params.id, req.params.anggotaId, req.method === 'DELETE' ? null : req.body.status, res.locals.attendanceActor)); }
  catch (error) { res.status(error instanceof AgendaError ? error.status : 503).json({ error: error instanceof AgendaError ? error.message : 'Gagal Menyimpan Kehadiran. Silakan Coba Lagi.' }); }
});
