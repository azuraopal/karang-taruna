import { PDFDocument, PDFHexString, PDFName } from 'pdf-lib';
import { DOCUMENT_LIMITS, validateDocument, type DocumentPage } from './meetingDocument';

export async function readMeetingDocumentMetadata(bytes: Uint8Array) {
  if (bytes.length > DOCUMENT_LIMITS.bytes || new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw Error('Gunakan PDF Valid Dengan Ukuran Maksimal 8 MB.');
  const doc = await PDFDocument.load(bytes, { throwOnInvalidObject: true, updateMetadata: false });
  if (doc.catalog.has(PDFName.of('KarangTarunaActivityReport'))) throw Error('PDF Ini Berisi Rekap Beberapa Rapat. Pilih Dokumen Satu Rapat.');
  if (doc.getPageCount() > 50) throw Error('PDF Melebihi 50 Halaman.');
  const metadata = doc.catalog.get(PDFName.of('KarangTarunaMeetingDocument'));
  if (!metadata) return null;
  if (!(metadata instanceof PDFHexString) || metadata.asBytes().length > DOCUMENT_LIMITS.response * 2) throw Error('Data Dokumen PDF Tidak Valid.');
  return validateDocument(JSON.parse(metadata.decodeText()));
}
export async function renderMeetingDocumentPages(bytes: Uint8Array, onProgress: (page: number, total: number) => void): Promise<DocumentPage[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/legacy/build/pdf.worker.mjs?url')).default;
  const task = pdfjs.getDocument({ data: Uint8Array.from(bytes) });
  try {
    const doc = await task.promise;
    if (doc.numPages > DOCUMENT_LIMITS.pages) throw Error('Deteksi AI Mendukung Maksimal 20 Halaman Per Rapat.');
    const pages: DocumentPage[] = []; let length = 0;
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const natural = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: 1600 / Math.max(natural.width, natural.height) });
      const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const text = (await page.getTextContent()).items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('');
      const image = canvas.toDataURL('image/jpeg', 0.85);
      length += image.length;
      if (length > 14 * 1024 * 1024) throw Error('Gambar Dalam PDF Terlalu Besar Untuk Deteksi AI.');
      pages.push({ text, image }); canvas.width = 0; canvas.height = 0; page.cleanup(); onProgress(i, doc.numPages);
    }
    return pages;
  } finally { await task.destroy(); }
}
