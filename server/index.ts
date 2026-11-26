import express from 'express';
import path from 'path';
import fs from 'fs';
import zlib from 'node:zlib';
import { apiApp } from './apiApp.js';
import { initDb } from './db.js';

const PORT = process.env.PORT || 3000;

initDb().catch(() => {
  console.log('PostgreSQL belum aktif di lokal, menggunakan server storage lokal otomatis.');
});

const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  const assetsDir = path.join(distPath, 'assets');
  const compressedAssets = new Map<string, { data: Buffer; type: string; encoding: string }>();
  const MIME_BY_EXT: Record<string, string> = {
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
  };

  // Serve immutable hashed JS/CSS/SVG assets with Brotli/Gzip + in-memory cache
  apiApp.get('/assets/:file', (req, res, next) => {
    const fileName = path.basename(req.params.file);
    const ext = path.extname(fileName).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime || fileName !== req.params.file) return next();

    const accept = req.headers['accept-encoding'] || '';
    const encoding = accept.includes('br') ? 'br' : accept.includes('gzip') ? 'gzip' : '';
    if (!encoding) return next();

    const cacheKey = `${encoding}:${fileName}`;
    let entry = compressedAssets.get(cacheKey);
    if (!entry) {
      const fullPath = path.join(assetsDir, fileName);
      if (!fs.existsSync(fullPath)) return next();
      const raw = fs.readFileSync(fullPath);
      if (raw.length < 1024) return next();
      const data =
        encoding === 'br'
          ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })
          : zlib.gzipSync(raw, { level: 6 });
      entry = { data, type: mime, encoding };
      if (compressedAssets.size < 200) compressedAssets.set(cacheKey, entry);
    }

    res.setHeader('Content-Type', entry.type);
    res.setHeader('Content-Encoding', entry.encoding);
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(entry.data);
  });

  apiApp.use(
    '/assets',
    express.static(assetsDir, {
      maxAge: '1y',
      immutable: true,
    })
  );
  apiApp.use(
    express.static(distPath, {
      maxAge: '1h',
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    })
  );
  apiApp.get(/.*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

apiApp.listen(PORT, () => {
  console.log(`Server Karang Taruna Margabakti 07 running on port ${PORT}`);
});
