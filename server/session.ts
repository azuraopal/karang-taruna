import crypto from 'node:crypto';
import type { Request, Response, RequestHandler } from 'express';
import { getUsers } from './storage.js';
import type { UserAccount } from '../src/types/index.js';
const sessions = new Map<string, { userId: string; username: string; expires: number }>();
const cookieName = 'katar_session';
const options = { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', path: '/' };
const tokenOf = (req: Request) => req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
export function endSession(req: Request, res: Response) {
  const old = tokenOf(req);
  if (old) sessions.delete(old);
  res.clearCookie(cookieName, options);
}
export function startSession(req: Request, res: Response, user: UserAccount) {
  const previous = tokenOf(req);
  if (previous) sessions.delete(previous);
  for (const [token, session] of sessions) if (session.expires <= Date.now()) sessions.delete(token);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, username: user.username, expires: Date.now() + 8 * 60 * 60 * 1000 });
  res.cookie(cookieName, token, { ...options, maxAge: 8 * 60 * 60 * 1000 });
}
export function requireSession(roles: string[]): RequestHandler {
  return async (req, res, next) => {
    const token = tokenOf(req);
    const session = token && sessions.get(token);
    if (!session || session.expires <= Date.now()) {
      res.status(401).json({ error: 'Sesi berakhir. Silakan keluar dan masuk kembali.' }); return;
    }
    try {
      const user = (await getUsers()).find(item => item.id === session.userId && item.username === session.username);
      if (!user || user.isActive === false || !roles.includes(user.role)) {
        res.status(403).json({ error: 'Akun tidak memiliki akses Absensi.' }); return;
      }
      res.locals.attendanceActor = user;
      next();
    } catch { res.status(503).json({ error: 'Tidak dapat memverifikasi sesi.' }); }
  };
}
export const requireAttendanceSession = requireSession(['admin', 'pengurus', 'superadmin']);
export const requireUserManagementSession = requireSession(['superadmin']);
