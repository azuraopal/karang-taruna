import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { RequestHandler } from 'express';

const widths = new Set([160, 640, 1280]);

export function createImageVariants(roots: string[]): RequestHandler {
  const lanes: Promise<void>[] = [Promise.resolve(), Promise.resolve()];
  let laneIndex = 0;
  const pending = new Map<string, Promise<Buffer>>();
  const cacheRoot = path.join(roots[0], '.image-cache');
  return async (req, res, next) => {
    const width = Number(req.query.w);
    if (!['GET', 'HEAD'].includes(req.method) || !widths.has(width)) return next();
    let relative: string;
    try { relative = decodeURIComponent(req.path).replace(/^\//, ''); } catch { return next(); }
    if (!/^(galeri|berita|profiles)\/[a-zA-Z0-9_-]+\.(jpe?g|png|webp)$/i.test(relative)) return next();
    try {
      let source = '';
      for (const root of roots) {
        try {
          const candidate = await fs.realpath(path.join(root, relative));
          const rootPath = await fs.realpath(root);
          if (candidate.startsWith(rootPath + path.sep)) { source = candidate; break; }
        } catch {}
      }
      if (!source) return next();
      const stat = await fs.stat(source);
      if (!stat.isFile() || stat.size > 32 * 1024 * 1024) return next();
      const key = createHash('sha256').update(`v1:${source}:${stat.size}:${stat.mtimeMs}:${width}`).digest('hex');
      const cached = path.join(cacheRoot, `${key}.webp`);
      let buffer: Buffer;
      try { buffer = await fs.readFile(cached); }
      catch {
        let task = pending.get(key);
        if (!task) {
          if (pending.size >= 32) return next();
          const lane = laneIndex++ % lanes.length;
          task = lanes[lane].then(async () => {
            const output = await sharp(source, { limitInputPixels: 40_000_000 }).rotate()
              .resize({ width, withoutEnlargement: true }).webp({ quality: width === 160 ? 65 : 80 }).toBuffer();
            await fs.mkdir(cacheRoot, { recursive: true });
            const temporary = `${cached}.${randomUUID()}.tmp`;
            try {
              await fs.writeFile(temporary, output);
              await fs.rename(temporary, cached);
            } finally { await fs.unlink(temporary).catch(() => {}); }
            return output;
          });
          lanes[lane] = task.then(() => {}, () => {});
          pending.set(key, task);
        }
        try { buffer = await task; } finally { pending.delete(key); }
      }
      res.set('Cache-Control', 'public, max-age=604800, immutable').type('webp').send(buffer);
    } catch {
      next();
    }
  };
}
