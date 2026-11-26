import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Express } from 'express';
import { requestApp } from './http.ts';

const dir = mkdtempSync(join(tmpdir(), 'katar-security-'));
const file = join(dir, 'data.json');
process.env.KATAR_STORAGE = 'json';
process.env.DEV_DB_FILE = file;

let app: Express;
let superCookie = '';
let staffCookie = '';

async function login(username: string, password: string) {
  const res = await requestApp(app, '/api/auth/login', 'POST', { username, password });
  assert.equal(res.status, 200);
  return res.headers.get('set-cookie')?.split(';')[0] || '';
}

before(async () => {
  const { hashPassword } = await import('../server/storage.ts');
  writeFileSync(
    file,
    JSON.stringify({
      berita: [],
      tim: [],
      galeri: [],
      aspirasi: [],
      users: [
        { id: 'u-super', username: 'sec-super', password: hashPassword('StrongPass123!'), namaLengkap: 'Sec Super', role: 'superadmin', isActive: true },
        { id: 'u-staff', username: 'sec-staff', password: hashPassword('StrongPass123!'), namaLengkap: 'Sec Staff', role: 'pengurus', isActive: true },
      ],
      activityLogs: [],
    })
  );
  // Reload storage after seeding file by importing apiApp (storage already loaded initial file if earlier, so use storage API to seed)
  const storage = await import('../server/storage.ts');
  const existing = await storage.getUsers();
  if (!existing.some(u => u.username === 'sec-super')) {
    await storage.createUser({ username: 'sec-super', password: 'StrongPass123!', namaLengkap: 'Sec Super', role: 'superadmin', isActive: true });
    await storage.createUser({ username: 'sec-staff', password: 'StrongPass123!', namaLengkap: 'Sec Staff', role: 'pengurus', isActive: true });
  }
  const { apiApp } = await import('../server/apiApp.ts');
  app = apiApp;
  superCookie = await login('sec-super', 'StrongPass123!');
  staffCookie = await login('sec-staff', 'StrongPass123!');
});

after(() => {
  rmSync(dir, { recursive: true, force: true });
});

test('unauthenticated requests are blocked on admin/staff endpoints and PII reads', async () => {
  const protectedCalls: Array<[string, string, unknown?]> = [
    ['/api/users', 'GET'],
    ['/api/logs', 'GET'],
    ['/api/logs', 'POST', { id: 'log-1', action: 'tambah', entity: 'Berita', description: 'Fake', actorName: 'Spoofed' }],
    ['/api/aspirasi', 'GET'],
    ['/api/aspirasi/asp-1', 'PUT', { status: 'selesai' }],
    ['/api/aspirasi/asp-1', 'DELETE'],
    ['/api/berita', 'POST', { judul: 'Test', ringkasan: 'R', isi: 'I', kategori: 'Kegiatan', tanggal: '2026-11-26', gambarUrl: '' }],
    ['/api/berita/b-1', 'PUT', { judul: 'Edit' }],
    ['/api/berita/b-1', 'DELETE'],
    ['/api/tim', 'POST', { nama: 'A', jabatan: 'B', divisi: 'PSDM', fotoUrl: '', bio: '' }],
    ['/api/tim/t-1', 'PUT', { nama: 'B' }],
    ['/api/tim/t-1', 'DELETE'],
    ['/api/galeri', 'POST', { judul: 'G', kategori: 'Sosial', tanggal: '2026-11-26', gambarUrl: '', deskripsi: '', lokasi: '' }],
    ['/api/galeri/g-1', 'PUT', { judul: 'G2' }],
    ['/api/galeri/g-1', 'DELETE'],
    ['/api/upload', 'POST', { image: 'data:image/png;base64,iVBORw0KGgo=', category: 'berita' }],
    ['/api/auth/me', 'GET'],
  ];
  for (const [path, method, body] of protectedCalls) {
    const res = await requestApp(app, path, method, body, '');
    assert.equal(res.status, 401, `${method} ${path} should require authentication`);
  }
});

test('GET /api/users requires superadmin and never leaks password fields', async () => {
  assert.equal((await requestApp(app, '/api/users', 'GET', undefined, staffCookie)).status, 403);
  const res = await requestApp(app, '/api/users', 'GET', undefined, superCookie);
  assert.equal(res.status, 200);
  const users = await res.json();
  assert.ok(Array.isArray(users) && users.length > 0);
  for (const user of users) {
    assert.equal('password' in user, false, 'Password field must never be exposed');
  }
});

test('security headers are present and X-Powered-By is disabled', async () => {
  const res = await requestApp(app, '/api/health', 'GET');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-powered-by'), null);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
});

test('upload rejects non-image MIME types and invalid image payloads', async () => {
  const htmlPayload = 'data:text/html;base64,' + Buffer.from('<script>alert(1)</script>').toString('base64');
  assert.equal((await requestApp(app, '/api/upload', 'POST', { image: htmlPayload, category: 'berita' }, staffCookie)).status, 400);

  const fakePng = 'data:image/png;base64,' + Buffer.from('not a real png file').toString('base64');
  assert.equal((await requestApp(app, '/api/upload', 'POST', { image: fakePng, category: 'berita' }, staffCookie)).status, 400);
});

test('cross-origin CSRF protection applies to all API mutation endpoints', async () => {
  const res = await requestApp(
    app,
    '/api/berita',
    'POST',
    { judul: 'CSRF', ringkasan: 'R', isi: 'I', kategori: 'Kegiatan', tanggal: '2026-11-26', gambarUrl: '' },
    staffCookie,
    { origin: 'https://evil.example' }
  );
  assert.equal(res.status, 403);
});

test('GET /api/auth/me validates session and password change revokes active sessions', async () => {
  const me = await requestApp(app, '/api/auth/me', 'GET', undefined, staffCookie);
  assert.equal(me.status, 200);
  const meData = await me.json();
  assert.equal(meData.authenticated, true);
  assert.equal(meData.user.username, 'sec-staff');

  const update = await requestApp(app, `/api/users/${meData.user.id}`, 'PUT', { password: 'NewStrongPass456!' }, superCookie);
  assert.equal(update.status, 200);

  // Old session must now be invalidated
  const afterReset = await requestApp(app, '/api/auth/me', 'GET', undefined, staffCookie);
  assert.equal(afterReset.status, 401);
});
