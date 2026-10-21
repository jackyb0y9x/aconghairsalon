'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

export interface BannerData {
  id?: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  linkUrl?: string | null;
  ctaLink?: string | null;
  ctaText?: string | null;
  displayOrder?: number;
  order?: number;
  isActive?: boolean;
  active?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  banner?: BannerData | null;
  onSaved: () => void;
}

export function BannerModal({ isOpen, onClose, banner, onSaved }: BannerModalProps) {
  const [formData, setFormData] = useState<Partial<BannerData>>({
    title: '',
    subtitle: '',
    badgeText: '',
    imageUrl: '',
    mobileImageUrl: '',
    linkUrl: '/booking',
    ctaText: 'Khám phá ngay',
    displayOrder: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        badgeText: banner.badgeText || '',
        imageUrl: banner.imageUrl || '',
        mobileImageUrl: banner.mobileImageUrl || '',
        linkUrl: banner.linkUrl || banner.ctaLink || '/booking',
        ctaText: banner.ctaText || 'Khám phá ngay',
        displayOrder: banner.displayOrder ?? banner.order ?? 0,
        isActive: banner.isActive ?? banner.active ?? true,
        startDate: banner.startDate ? banner.startDate.slice(0, 10) : '',
        endDate: banner.endDate ? banner.endDate.slice(0, 10) : '',
      });
    } else {
      setFormData({
        title: '',
        subtitle: '',
        badgeText: '',
        imageUrl: '',
        mobileImageUrl: '',
        linkUrl: '/booking',
        ctaText: 'Khám phá ngay',
        displayOrder: 0,
        isActive: true,
        startDate: '',
        endDate: '',
      });
    }
    setError(null);
  }, [banner, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) {
      setError('Vui lòng nhập tiêu đề và đường dẫn ảnh banner');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = banner?.id ? `/api/admin/banners/${banner.id}` : '/api/admin/banners';
      const method = banner?.id ? 'PUT' : 'POST';

      const payload = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        badgeText: formData.badgeText || null,
        imageUrl: formData.imageUrl,
        mobileImageUrl: formData.mobileImageUrl || null,
        linkUrl: formData.linkUrl || null,
        ctaLink: formData.linkUrl || null,
        ctaText: formData.ctaText || 'Khám phá ngay',
        displayOrder: Number(formData.displayOrder) || 0,
        order: Number(formData.displayOrder) || 0,
        isActive: formData.isActive ?? true,
        active: formData.isActive ?? true,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu banner');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-salon-charcoal border border-salon-gold/30 rounded-xl shadow-2xl p-6 text-salon-ivory max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-salon-gold rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6 border-b border-salon-gold/15 pb-4">
          <Sparkles className="w-5 h-5 text-salon-gold" />
          <h2 className="text-xl font-serif font-bold text-salon-ivory">
            {banner ? 'Chỉnh Sửa Banner Hero' : 'Thêm Mới Banner Hero'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
              Tiêu đề chính *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: BST Tóc Mùa Thu Sang Trọng 2026"
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Phụ đề (Tùy chọn)
            </label>
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="VD: Trải nghiệm thiết kế tóc độc bản từ Master Stylist"
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Nhãn huy hiệu (Badge Text)
              </label>
              <input
                type="text"
                value={formData.badgeText || ''}
                onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                placeholder="VD: XU HƯỚNG 2026"
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                value={formData.displayOrder ?? 0}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>
          </div>

          <ImageUpload
            value={formData.imageUrl || ''}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            folder="banners"
            label="Ảnh Banner Desktop"
            required
            aspectRatio="banner"
            helperText="Khuyến nghị độ phân giải 1600x700px (JPG, PNG, WEBP tối đa 5MB)"
          />

          <ImageUpload
            value={formData.mobileImageUrl || ''}
            onChange={(url) => setFormData({ ...formData, mobileImageUrl: url })}
            folder="banners"
            label="Ảnh Banner Mobile (Tùy chọn)"
            aspectRatio="portrait"
            helperText="Khuyến nghị tỉ lệ 4:5 hoặc 9:16 cho thiết bị di động"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Liên kết CTA (Đích đến)
              </label>
              <input
                type="text"
                value={formData.linkUrl || ''}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="/booking, /hairstyles..."
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Văn bản nút CTA
              </label>
              <input
                type="text"
                value={formData.ctaText || 'Khám phá ngay'}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Ngày bắt đầu hiển thị
              </label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Ngày kết thúc hiển thị
              </label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActiveBanner"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-salon-gold/30 bg-salon-noir text-salon-gold focus:ring-salon-gold"
            />
            <label htmlFor="isActiveBanner" className="text-sm font-medium text-salon-ivory cursor-pointer">
              Kích hoạt hiển thị banner trên trang chủ
            </label>
          </div>

          {formData.imageUrl && (
            <div className="mt-4 p-3 border border-salon-gold/15 rounded-lg bg-salon-noir/50">
              <span className="text-xs text-zinc-400 mb-2 block">Xem trước ảnh:</span>
              <img
                src={formData.imageUrl}
                alt="Banner preview"
                className="w-full h-32 object-cover rounded-lg border border-salon-gold/20"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-salon-gold/15">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-zinc-300 hover:text-white bg-zinc-800 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold bg-salon-gold text-salon-noir rounded-lg hover:bg-salon-gold/90 transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {banner ? 'Lưu thay đổi' : 'Tạo banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
