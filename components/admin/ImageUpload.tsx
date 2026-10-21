'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  required?: boolean;
  aspectRatio?: 'portrait' | 'square' | 'video' | 'banner';
  helperText?: string;
  className?: string;
}

export function ImageUpload({
  value = '',
  onChange,
  folder = 'salon-content',
  label = 'Hình ảnh',
  required = false,
  aspectRatio = 'portrait',
  helperText = 'Hỗ trợ JPG, PNG, WEBP (Tối đa 5MB)',
  className = '',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'portrait':
        return 'aspect-[4/5] max-h-72';
      case 'square':
        return 'aspect-square max-h-64';
      case 'video':
        return 'aspect-video max-h-56';
      case 'banner':
        return 'aspect-[21/9] max-h-48';
      default:
        return 'aspect-[4/5] max-h-72';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Dung lượng tệp vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chỉ tải lên tệp định dạng hình ảnh (JPG, PNG, WEBP, GIF).');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tải ảnh lên thất bại');
      }

      onChange(data.url);
      setUrlInput(data.url);
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Lỗi khi tải ảnh lên máy chủ.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setIsUrlMode(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    setUploadError(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-[11px] text-zinc-400 hover:text-salon-gold flex items-center gap-1 transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{isUrlMode ? 'Tải tệp từ máy' : 'Dán link URL'}</span>
        </button>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Chế độ nhập URL thủ công */}
      {isUrlMode ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://images.unsplash.com/... hoặc /images/..."
            className="flex-1 bg-salon-noir border border-salon-gold/30 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
          />
          <button
            type="button"
            onClick={handleManualUrlSubmit}
            className="px-4 py-2 bg-salon-gold text-salon-noir font-bold text-xs rounded-lg hover:bg-salon-gold/90 transition-colors"
          >
            Áp dụng
          </button>
        </div>
      ) : null}

      {/* Hiển thị ảnh đã chọn / đã tải lên */}
      {value ? (
        <div className={`relative group border border-salon-gold/30 rounded-xl overflow-hidden bg-black/40 ${getAspectClass()}`}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 bg-salon-gold text-salon-noir font-bold text-xs rounded-lg shadow-lg hover:bg-salon-gold/90 transition flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Thay ảnh</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs rounded-lg shadow-lg transition flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          </div>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] text-zinc-300 border border-white/10 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="truncate max-w-[200px]">{value}</span>
          </div>
        </div>
      ) : (
        /* Vùng kéo thả hoặc click chọn file */
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-salon-gold/30 hover:border-salon-gold/70 rounded-xl p-6 text-center cursor-pointer bg-salon-noir/50 hover:bg-salon-gold/5 transition-all duration-200 flex flex-col items-center justify-center gap-2 group ${getAspectClass()}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <Loader2 className="w-8 h-8 text-salon-gold animate-spin" />
              <span className="text-xs font-medium text-salon-gold">Đang xử lý tải ảnh lên...</span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-salon-gold/15 border border-salon-gold/30 flex items-center justify-center text-salon-gold group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-salon-ivory">
                  Nhấp để chọn tệp hoặc kéo thả ảnh vào đây
                </p>
                <p className="text-[11px] text-zinc-400">{helperText}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
