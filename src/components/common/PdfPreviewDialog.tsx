import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, LoaderCircle, Minus, Plus } from 'lucide-react';
import type { PDFDocumentProxy, PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
import { Modal } from './Modal';

export function PdfPreviewDialog({ bytes, filename, onClose, title = 'Pratinjau PDF Rapat' }: { bytes: Uint8Array; filename: string; onClose: () => void; title?: string }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(520);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState('');
  const [pageText, setPageText] = useState('');
  const [retry, setRetry] = useState(0);
  const [url, setUrl] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(new Blob([Uint8Array.from(bytes).buffer], { type: 'application/pdf' }));
    setUrl(objectUrl);
    return () => { URL.revokeObjectURL(objectUrl); };
  }, [bytes]);
  useEffect(() => {
    let cancelled = false;
    let task: PDFDocumentLoadingTask | undefined;
    setLoading(true); setError(''); setDocument(null); setPageNumber(1);
    void import('pdfjs-dist/legacy/build/pdf.mjs').then(async pdfjs => {
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      task = pdfjs.getDocument({ data: Uint8Array.from(bytes) });
      const result = await task.promise;
      if (!cancelled) { setDocument(result); setLoading(false); }
    }).catch(reason => { if (!cancelled) { setError(reason instanceof Error ? reason.message : 'Gagal Memuat Pratinjau.'); setLoading(false); } });
    return () => { cancelled = true; void task?.destroy(); };
  }, [bytes, retry]);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(160, entry.contentRect.width - 24)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!document || !canvas.current) return;
    let cancelled = false;
    let task: RenderTask | undefined;
    setRendering(true); setError('');
    void (async () => {
      const page = await document.getPage(pageNumber);
      if (cancelled) return;
      const natural = page.getViewport({ scale: 1 });
      const displayWidth = Math.min(width, 700) * zoom;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const viewport = page.getViewport({ scale: displayWidth / natural.width * ratio });
      // Render into a separate buffer so page changes cannot compete for one canvas.
      const buffer = window.document.createElement('canvas');
      buffer.width = Math.ceil(viewport.width); buffer.height = Math.ceil(viewport.height);
      task = page.render({ canvas: buffer, viewport });
      await task.promise;
      const text = await page.getTextContent();
      if (cancelled || !canvas.current) return;
      canvas.current.width = buffer.width; canvas.current.height = buffer.height;
      canvas.current.style.width = `${displayWidth}px`;
      canvas.current.style.height = `${viewport.height / ratio}px`;
      canvas.current.getContext('2d')?.drawImage(buffer, 0, 0);
      setPageText(text.items.map(item => 'str' in item ? item.str : '').join(' '));
      setRendering(false);
    })().catch(reason => { if (!cancelled && reason?.name !== 'RenderingCancelledException') { setError('Gagal Menampilkan Halaman PDF.'); setRendering(false); } });
    return () => { cancelled = true; task?.cancel(); };
  }, [document, pageNumber, width, zoom]);
  const iconButton = 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-stone-100 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-amber-300';
  return <Modal isOpen onClose={onClose} title={title} maxWidth="2xl" contentClassName="p-0">
    <div className="flex h-[min(70dvh,42rem)] flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-b border-stone-200 px-2 py-1.5 sm:px-4">
        <div className="flex items-center gap-1"><button type="button" disabled={!document || pageNumber === 1} onClick={() => setPageNumber(previous => previous - 1)} aria-label="Halaman Sebelumnya" title="Halaman Sebelumnya" className={iconButton}><ChevronLeft className="h-4 w-4" /></button><span className="min-w-14 text-center text-xs font-semibold tabular-nums text-slate-600">{document ? `${pageNumber} / ${document.numPages}` : '- / -'}</span><button type="button" disabled={!document || pageNumber >= document.numPages} onClick={() => setPageNumber(previous => previous + 1)} aria-label="Halaman Berikutnya" title="Halaman Berikutnya" className={iconButton}><ChevronRight className="h-4 w-4" /></button></div>
        <div className="flex items-center gap-1"><button type="button" disabled={!document || zoom <= 0.75} onClick={() => setZoom(previous => Math.max(0.75, previous - 0.25))} aria-label="Perkecil PDF" title="Perkecil PDF" className={iconButton}><Minus className="h-4 w-4" /></button><span className="min-w-10 text-center text-xs tabular-nums text-slate-500">{Math.round(zoom * 100)}%</span><button type="button" disabled={!document || zoom >= 2} onClick={() => setZoom(previous => Math.min(2, previous + 0.25))} aria-label="Perbesar PDF" title="Perbesar PDF" className={iconButton}><Plus className="h-4 w-4" /></button></div>
      </div>
      <div ref={container} className="relative min-h-0 flex-1 overflow-auto bg-stone-100 p-3">
        {error ? <div role="alert" className="rounded-lg bg-rose-50 p-4 text-sm text-rose-800"><p>{error}</p><button type="button" onClick={() => setRetry(previous => previous + 1)} className="mt-2 min-h-11 font-semibold">Coba Lagi</button></div> : <><canvas ref={canvas} aria-hidden="true" className={`mx-auto block bg-white shadow-sm ${loading || rendering ? 'invisible' : ''}`} /><p className="sr-only">Halaman {pageNumber}: {pageText}</p>{(loading || rendering) && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" />Memuat Pratinjau...</div>}</>}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-stone-200 bg-white px-4 py-3"><p className="min-w-0 flex-1 truncate text-xs text-slate-500" title={filename}>{filename}</p><a href={url || undefined} download={filename} aria-disabled={!document || !!error} onClick={event => { if (!document || error) event.preventDefault(); }} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-amber-300 ${!document || error ? 'pointer-events-none opacity-40' : ''}`}><Download className="h-4 w-4" />Unduh PDF</a></div>
    </div>
  </Modal>;
}
