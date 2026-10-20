'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onRemove?: () => void;
  subfolder?: string;
  label?: string;
  hint?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  subfolder = 'recipes',
  label,
  hint = 'Hỗ trợ JPG, PNG, WebP tối đa 5MB',
  aspectRatio = 'video',
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'wide'
      ? 'aspect-21/9'
      : 'aspect-16/9';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subfolder', subfolder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Tải ảnh lên thất bại');
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải ảnh');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-xs font-semibold text-[#5C4A3A]">{label}</label>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        disabled={disabled || uploading}
      />

      {value ? (
        <div
          className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden border border-[#EADBC8] group bg-[#FAF7F0]`}
        >
          <img
            src={value}
            alt="Uploaded preview"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 bg-white/90 hover:bg-white text-[#2D2A26] text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Đổi ảnh
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-xl shadow-xs transition-all"
                title="Gỡ ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`w-full ${aspectClass} rounded-2xl border-2 border-dashed border-[#EADBC8] hover:border-[#3F6240] transition-colors bg-[#FAF7F0]/60 hover:bg-[#FAF7F0] flex flex-col items-center justify-center p-4 cursor-pointer text-center group ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-[#3F6240] animate-spin" />
              <p className="text-xs font-medium text-[#7C6A59]">Đang tải và tối ưu ảnh...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white border border-[#EADBC8] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <ImageIcon className="w-5 h-5 text-[#B75B35]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[#3F6240]">Bấm để chọn hoặc kéo thả ảnh</p>
                <p className="text-[11px] text-[#7C6A59]">{hint}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
    </div>
  );
}
