import React, { useState, useRef } from 'react';
import { X, RefreshCw, CheckCircle2, Upload } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // 1. Optimize on client-side
      const optimizedDataUrl = await optimizeImage(file);
      const sizeKb = Math.round((optimizedDataUrl.length * 3) / 4 / 1024);
      setFileDetails(`${file.name} (Tereduksi rapi: ~${sizeKb} KB)`);
      setPreviewUrl(optimizedDataUrl);

      // 2. Try upload to backend /api/upload
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: optimizedDataUrl,
            category,
            filename: file.name,
          }),
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            onChange(uploadData.url);
            setIsProcessing(false);
            return;
          }
        }
      } catch {
        // Backend offline or local Vite dev: use optimizedDataUrl
      }

      // Fallback: save optimized base64 dataUrl directly
      onChange(optimizedDataUrl);
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
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
