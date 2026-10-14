import { useEffect, useState } from 'react';
import { LoaderCircle, ImageOff } from 'lucide-react';
import { imageVariantUrl } from '../../utils/imageVariants';

// The parent keys this component by photo, so late loads never replace a new selection.
export function PhotoViewer({ source, nextSource, alt, zoom, fallbackSource }: { source: string; nextSource?: string; alt: string; zoom: number; fallbackSource?: string }) {
  const [loaded, setLoaded] = useState<{ key: string; url: string } | null>(null);
  const [failed, setFailed] = useState('');
  const [attempt, setAttempt] = useState(0);
  const src = zoom > 1 ? source : imageVariantUrl(source, 1280);
  const requestKey = `${src}:${attempt}`;
  const ready = loaded?.key === requestKey;
  const error = failed === requestKey;

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = 'high';
    const fail = () => {
      if (cancelled) return;
      if (image.getAttribute('src') === src && src !== source) image.src = source;
      else if (fallbackSource && image.getAttribute('src') !== fallbackSource) image.src = fallbackSource;
      else setFailed(requestKey);
    };
    image.onload = async () => {
      try {
        await image.decode();
        if (!cancelled) setLoaded({ key: requestKey, url: image.getAttribute('src') || src });
      } catch { fail(); }
    };
    image.onerror = fail;
    image.src = src;
    return () => { cancelled = true; image.onload = null; image.onerror = null; };
  }, [src, source, requestKey, fallbackSource]);

  useEffect(() => {
    if (!ready || !nextSource) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || connection?.effectiveType?.includes('2g')) return;
    const next = new Image();
    next.fetchPriority = 'low';
    next.src = imageVariantUrl(nextSource, 1280);
  }, [ready, nextSource]);

  return (
    <div className="photo-viewer relative w-full rounded-2xl bg-slate-100" aria-busy={!ready && !error}>
      <div className="photo-viewer-viewport relative w-full aspect-[4/3] max-h-[min(55dvh,420px)] overflow-hidden rounded-2xl">
        <div className="absolute inset-0 overflow-auto overscroll-contain" tabIndex={zoom > 1 ? 0 : undefined} aria-label={zoom > 1 ? 'Foto diperbesar, geser untuk melihat bagian lainnya' : undefined}>
          <div className="relative" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
            {loaded && <img src={loaded.url} alt={alt} className="absolute inset-0 block h-full w-full max-w-none object-cover object-center" />}
          </div>
        </div>
      </div>
      {!ready && !error && <div className={loaded ? 'absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-600' : 'absolute inset-0 flex items-center justify-center gap-2 text-sm text-slate-600'} role="status"><LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />{loaded ? 'Memuat detail…' : 'Memuat foto…'}</div>}
      {error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-100/95 text-sm text-slate-600" role="status"><ImageOff aria-hidden="true" /><span>Foto belum berhasil dimuat.</span><button type="button" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-900" onClick={() => setAttempt(value => value + 1)}>Coba lagi</button></div>}
    </div>
  );
}
