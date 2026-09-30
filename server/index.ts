import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiApp } from './apiApp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Static Files & SPA Serving for production / Dokploy
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  apiApp.use(express.static(distPath));
  apiApp.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

apiApp.listen(PORT, () => {
  console.log(`Server Karang Taruna Margabakti 07 running on port ${PORT}`);
});
