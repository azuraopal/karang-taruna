import React, { useEffect, useState, useRef } from 'react';
import { X, RefreshCw, CheckCircle2, Upload, Crop, ZoomIn, ZoomOut } from 'lucide-react';
import { Modal } from './Modal';

interface ImagePickerProps {
  value: string;
  onChange: (imageResult: string) => void;
  label?: string;
  sublabel?: string;
  category?: 'profiles' | 'galeri' | 'berita';
  aspectRatio?: 'square' | 'video' | 'auto';
  maxWidth?: number;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  value,
  onChange,
  label = 'Foto',
  sublabel = 'Pilih langsung dari galeri atau kamera HP Anda',
  category = 'profiles',
  aspectRatio = 'square',
  maxWidth = 1000,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value);
  const [fileDetails, setFileDetails] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [manualUrl, setManualUrl] = useState<string>('');
  const [cropSource, setCropSource] = useState<string>('');
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropImageSize, setCropImageSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, offsetX: 0, offsetY: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  // Compress & optimize image via HTML5 Canvas before uploading
  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;

          // Scale down if larger than maxWidth
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to efficient WebP (or JPEG fallback)
          try {
            const dataUrl = canvas.toDataURL('image/webp', 0.85);
            resolve(dataUrl);
          } catch {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropSource(reader.result as string);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
      setCropImageSize({ width: 0, height: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const cropAspect = aspectRatio === 'video' ? 16 / 9 : aspectRatio === 'square' ? 1 : 4 / 3;

  const getCropBounds = (zoom = cropZoom) => {
    const area = cropAreaRef.current;
    if (!area || !cropImageSize.width) return null;
    const areaWidth = area.clientWidth;
    const areaHeight = areaWidth / cropAspect;
    const imageWidth = cropImageSize.width * zoom;
    const imageHeight = cropImageSize.height * zoom;
    return {
      areaWidth,
      areaHeight,
      minX: (areaWidth - imageWidth) / 2,
      maxX: (imageWidth - areaWidth) / 2,
      minY: (areaHeight - imageHeight) / 2,
      maxY: (imageHeight - areaHeight) / 2,
    };
  };

  const clampCropOffset = (x: number, y: number, zoom = cropZoom) => {
    const bounds = getCropBounds(zoom);
    if (!bounds) return { x, y };
    return {
      x: Math.min(bounds.maxX, Math.max(bounds.minX, x)),
      y: Math.min(bounds.maxY, Math.max(bounds.minY, y)),
    };
  };

  const handleCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { pointerX: e.clientX, pointerY: e.clientY, offsetX: cropOffset.x, offsetY: cropOffset.y };
  };

  const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setCropOffset(clampCropOffset(
      dragStartRef.current.offsetX + e.clientX - dragStartRef.current.pointerX,
      dragStartRef.current.offsetY + e.clientY - dragStartRef.current.pointerY,
    ));
  };

  const handleCropZoom = (zoom: number) => {
    setCropZoom(zoom);
    setCropOffset(clampCropOffset(cropOffset.x, cropOffset.y, zoom));
  };

  const processCroppedImage = async () => {
    const area = cropAreaRef.current;
    const imageElement = cropImageRef.current;
    if (!area || !imageElement || !cropImageSize.width) return;
    setCropSource('');
    setIsProcessing(true);

    try {
      const areaRect = area.getBoundingClientRect();
      const imageRect = imageElement.getBoundingClientRect();
      const sourceScale = imageElement.naturalWidth / imageRect.width;
      const sourceX = (areaRect.left - imageRect.left) * sourceScale;
      const sourceY = (areaRect.top - imageRect.top) * sourceScale;
      const sourceWidth = areaRect.width * sourceScale;
      const sourceHeight = areaRect.height * sourceScale;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sourceWidth);
      canvas.height = Math.round(sourceHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const image = new Image();
      image.src = cropSource;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
      });
      ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      const croppedFile = canvas.toDataURL('image/jpeg', 0.9);
      const croppedBlob = await (await fetch(croppedFile)).blob();
      const optimizedDataUrl = await optimizeImage(new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' }));
      const sizeKb = Math.round((optimizedDataUrl.length * 3) / 4 / 1024);
      setFileDetails(`Foto sudah dipotong (Tereduksi rapi: ~${sizeKb} KB)`);
      setPreviewUrl(optimizedDataUrl);

      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: optimizedDataUrl, category, filename: 'cropped-image.jpg' }),
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            onChange(uploadData.url);
            return;
          }
        }
      } catch {
        // Backend offline or local Vite dev: use optimizedDataUrl.
      }
      onChange(optimizedDataUrl);
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setCropSource('');
    setPreviewUrl('');
    setFileDetails('');
    setManualUrl('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyManualUrl = () => {
    if (manualUrl.trim()) {
      setPreviewUrl(manualUrl.trim());
      setFileDetails('URL Eksternal');
      onChange(manualUrl.trim());
      setShowUrlInput(false);
    }
  };

  const isSquare = aspectRatio === 'square';

  return (
    <div className="space-y-2">
      <Modal isOpen={Boolean(cropSource)} onClose={() => setCropSource('')} title="Sesuaikan Foto" maxWidth="lg">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Geser foto dan atur zoom sampai area yang diinginkan terlihat di dalam bingkai.</p>
          <div
            ref={cropAreaRef}
            className="relative w-full max-h-[55vh] overflow-hidden rounded-xl bg-slate-950 touch-none cursor-grab active:cursor-grabbing"
            style={{ aspectRatio: cropAspect }}
            onPointerDown={handleCropPointerDown}
            onPointerMove={handleCropPointerMove}
            onPointerUp={() => setIsDragging(false)}
            onPointerCancel={() => setIsDragging(false)}
          >
            <img
              ref={cropImageRef}
              src={cropSource}
              alt="Pratinjau foto yang akan dipotong"
              onLoad={(e) => {
                const image = e.currentTarget;
                const area = cropAreaRef.current;
                if (!area) return;
                const baseScale = Math.max(area.clientWidth / image.naturalWidth, (area.clientWidth / cropAspect) / image.naturalHeight);
                setCropImageSize({ width: image.naturalWidth * baseScale, height: image.naturalHeight * baseScale });
              }}
              className="absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                width: cropImageSize.width ? cropImageSize.width * cropZoom : '100%',
                height: cropImageSize.height ? cropImageSize.height * cropZoom : '100%',
                transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px))`,
              }}
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-0 border-[3px] border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.5)]" />
          </div>
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-500" />
            <input aria-label="Zoom foto" type="range" min="1" max="3" step="0.05" value={cropZoom} onChange={(e) => handleCropZoom(Number(e.target.value))} className="flex-1 accent-amber-600" />
            <ZoomIn className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCropSource('')} className="px-4 py-2 rounded-lg border border-stone-300 text-sm font-semibold text-slate-700 hover:bg-stone-50">Batal</button>
            <button type="button" onClick={processCroppedImage} disabled={!cropImageSize.width || isProcessing} className="px-4 py-2 rounded-lg bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"><Crop className="w-4 h-4" /> Gunakan Foto</button>
          </div>
        </div>
      </Modal>
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {label}
          </label>
          {sublabel && (
            <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>
          )}
        </div>

        {/* Toggle secondary manual URL */}
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline"
        >
          {showUrlInput ? 'Tutup Input Link' : 'Punya Link Gambar?'}
        </button>
      </div>

      {showUrlInput && (
        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center gap-2">
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="Tempel link gambar (https://...)"
            className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-slate-900 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyManualUrl}
            className="px-3 py-1.5 bg-slate-900 text-amber-400 font-bold text-xs rounded-lg"
          >
            Terapkan
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image Preview & Picker Box */}
      {previewUrl || value ? (
        <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-4">
          <div
            className={`relative rounded-xl overflow-hidden bg-stone-200 border border-stone-300 shrink-0 ${
              isSquare ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-28 h-20 sm:w-36 sm:h-24'
            }`}
          >
            <img
              src={previewUrl || value}
              alt="Pratinjau foto"
              className="w-full h-full object-cover"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">Foto Siap Dipakai</span>
            </div>
            {fileDetails && (
              <p className="text-[11px] text-slate-500 truncate">{fileDetails}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 text-slate-800 border border-stone-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors focus:ring-2 focus:ring-slate-800"
              >
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                <span>Upload Foto</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Zone */
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full p-6 border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/30 rounded-2xl transition-all flex flex-col items-center justify-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-amber-100 text-slate-600 group-hover:text-amber-800 flex items-center justify-center border border-stone-200 group-hover:border-amber-300 transition-colors shadow-2xs">
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
            ) : (
              <Upload className="w-6 h-6 text-amber-600" />
            )}
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-slate-900 group-hover:text-amber-900 block">
              Upload Foto dari Galeri / Kamera
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Format JPG, PNG, atau WebP (Otomatis dikompres & disimpan rapi)
            </span>
          </div>
        </button>
      )}
    </div>
  );
};
