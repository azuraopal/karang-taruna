import crypto from 'node:crypto';
import type { Request, Response, RequestHandler } from 'express';
import { getUsers } from './storage.js';
import type { UserAccount } from '../src/types/index.js';

interface SessionRecord {
  userId: string;
  username: string;
  expires: number;
}

const MAX_SESSIONS = 1000;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map<string, SessionRecord>();
const cookieName = 'katar_session';
const options = { httpOnly: true, sameSite: 'strict' as const, secure: process.env.NODE_ENV === 'production', path: '/' };

const tokenOf = (req: Request) =>
  req.headers.cookie
    ?.split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(cookieName + '='))
    ?.slice(cookieName.length + 1);

function pruneSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expires <= now) sessions.delete(token);
  }
  while (sessions.size >= MAX_SESSIONS) {
    const oldest = sessions.keys().next().value;
    if (!oldest) break;
    sessions.delete(oldest);
  }
}

export function invalidateUserSessions(userId: string) {
  for (const [token, session] of sessions) {
    if (session.userId === userId) sessions.delete(token);
  }
}

export function endSession(req: Request, res: Response) {
  const old = tokenOf(req);
  if (old) sessions.delete(old);
  res.clearCookie(cookieName, options);
}

export function startSession(req: Request, res: Response, user: UserAccount) {
  const previous = tokenOf(req);
  if (previous) sessions.delete(previous);
  pruneSessions();
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, username: user.username, expires: Date.now() + SESSION_TTL_MS });
  res.cookie(cookieName, token, { ...options, maxAge: SESSION_TTL_MS });
}

export async function getSessionUser(req: Request): Promise<UserAccount | null> {
  const token = tokenOf(req);
  const session = token && sessions.get(token);
  if (!session || session.expires <= Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  const user = (await getUsers()).find(item => item.id === session.userId && item.username === session.username);
  if (!user || user.isActive === false) return null;
  return user;
}

export function requireSession(roles: string[]): RequestHandler {
  return async (req, res, next) => {
    const token = tokenOf(req);
    const session = token && sessions.get(token);
    if (!session || session.expires <= Date.now()) {
      if (token) sessions.delete(token);
      res.status(401).json({ error: 'Sesi berakhir. Silakan keluar dan masuk kembali.' });
      return;
    }
    try {
      const user = (await getUsers()).find(item => item.id === session.userId && item.username === session.username);
      if (!user || user.isActive === false || !roles.includes(user.role)) {
        res.status(403).json({ error: 'Akun tidak memiliki akses untuk tindakan ini.' });
        return;
      }
      res.locals.attendanceActor = user;
      next();
    } catch {
      res.status(503).json({ error: 'Tidak dapat memverifikasi sesi.' });
    }
  };
}

export const requireAttendanceSession = requireSession(['admin', 'pengurus', 'superadmin']);
export const requireStaffSession = requireAttendanceSession;
export const requireAdminSession = requireSession(['admin', 'superadmin']);
export const requireUserManagementSession = requireSession(['superadmin']);
