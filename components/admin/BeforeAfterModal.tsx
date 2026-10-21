'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, SplitSquareVertical } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

export interface BeforeAfterData {
  id?: string;
  title: string;
  description?: string | null;
  beforeImageUrl: string;
  afterImageUrl: string;
  customerGender?: 'MALE' | 'FEMALE' | 'UNISEX';
  serviceId?: string | null;
  hairstyleId?: string | null;
  stylistId?: string | null;
  isFeatured?: boolean;
  displayOrder?: number;
}

interface BeforeAfterModalProps {
  isOpen: boolean;
  onClose: () => void;
  showcase?: BeforeAfterData | null;
  services: { id: string; title: string }[];
  hairstyles: { id: string; title: string }[];
  stylists: { id: string; fullName: string }[];
  onSaved: () => void;
}

export function BeforeAfterModal({
  isOpen,
  onClose,
  showcase,
  services,
  hairstyles,
  stylists,
  onSaved,
}: BeforeAfterModalProps) {
  const [formData, setFormData] = useState<Partial<BeforeAfterData>>({
    title: '',
    description: '',
    beforeImageUrl: '',
    afterImageUrl: '',
    customerGender: 'UNISEX',
    serviceId: '',
    hairstyleId: '',
    stylistId: '',
    isFeatured: false,
    displayOrder: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showcase) {
      setFormData({
        title: showcase.title || '',
        description: showcase.description || '',
        beforeImageUrl: showcase.beforeImageUrl || '',
        afterImageUrl: showcase.afterImageUrl || '',
        customerGender: showcase.customerGender || 'UNISEX',
        serviceId: showcase.serviceId || '',
        hairstyleId: showcase.hairstyleId || '',
        stylistId: showcase.stylistId || '',
        isFeatured: showcase.isFeatured ?? false,
        displayOrder: showcase.displayOrder ?? 0,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        beforeImageUrl: '',
        afterImageUrl: '',
        customerGender: 'UNISEX',
        serviceId: services[0]?.id || '',
        hairstyleId: hairstyles[0]?.id || '',
        stylistId: stylists[0]?.id || '',
        isFeatured: false,
        displayOrder: 0,
      });
    }
    setError(null);
  }, [showcase, isOpen, services, hairstyles, stylists]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.beforeImageUrl || !formData.afterImageUrl) {
      setError('Vui lòng nhập tiêu đề, ảnh trước và ảnh sau biến hóa');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = showcase?.id ? `/api/admin/before-after/${showcase.id}` : '/api/admin/before-after';
      const method = showcase?.id ? 'PUT' : 'POST';

      const payload = {
        title: formData.title,
        description: formData.description || null,
        beforeImageUrl: formData.beforeImageUrl,
        afterImageUrl: formData.afterImageUrl,
        customerGender: formData.customerGender || 'UNISEX',
        serviceId: formData.serviceId || null,
        hairstyleId: formData.hairstyleId || null,
        stylistId: formData.stylistId || null,
        isFeatured: formData.isFeatured ?? false,
        displayOrder: Number(formData.displayOrder) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu showcase');
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
          <SplitSquareVertical className="w-5 h-5 text-salon-gold" />
          <h2 className="text-xl font-serif font-bold text-salon-ivory">
            {showcase ? 'Chỉnh Sửa Before/After' : 'Thêm Mới Before/After Showcase'}
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
              Tiêu đề biến hóa *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Phục Hồi Tóc Nát & Tạo Kiểu Butterfly Layer"
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Mô tả chi tiết quá trình phục hồi & tạo kiểu
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Chia sẻ về tình trạng ban đầu của tóc và kỹ thuật thực hiện..."
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUpload
              value={formData.beforeImageUrl || ''}
              onChange={(url) => setFormData({ ...formData, beforeImageUrl: url })}
              folder="before-after"
              label="Ảnh Trước (Before)"
              required
              aspectRatio="portrait"
              helperText="Tải ảnh khách hàng trước khi làm tóc (Tối đa 5MB)"
            />

            <ImageUpload
              value={formData.afterImageUrl || ''}
              onChange={(url) => setFormData({ ...formData, afterImageUrl: url })}
              folder="before-after"
              label="Ảnh Sau (After)"
              required
              aspectRatio="portrait"
              helperText="Tải ảnh khách hàng sau khi hoàn thiện (Tối đa 5MB)"
            />
          </div>

          {/* Image Previews */}
          {(formData.beforeImageUrl || formData.afterImageUrl) && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-salon-noir/50 border border-salon-gold/15 rounded-lg">
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">Trước khi làm:</span>
                {formData.beforeImageUrl ? (
                  <img
                    src={formData.beforeImageUrl}
                    alt="Before"
                    className="w-full h-28 object-cover rounded border border-salon-gold/20"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-28 bg-zinc-800 rounded flex items-center justify-center text-xs text-zinc-500">
                    Chưa có ảnh
                  </div>
                )}
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">Sau khi hoàn thiện:</span>
                {formData.afterImageUrl ? (
                  <img
                    src={formData.afterImageUrl}
                    alt="After"
                    className="w-full h-28 object-cover rounded border border-salon-gold/20"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-28 bg-zinc-800 rounded flex items-center justify-center text-xs text-zinc-500">
                    Chưa có ảnh
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Dịch vụ liên kết
              </label>
              <select
                value={formData.serviceId || ''}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              >
                <option value="">-- Không chọn --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Kiểu tóc mẫu
              </label>
              <select
                value={formData.hairstyleId || ''}
                onChange={(e) => setFormData({ ...formData, hairstyleId: e.target.value })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              >
                <option value="">-- Không chọn --</option>
                {hairstyles.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Stylist thực hiện
              </label>
              <select
                value={formData.stylistId || ''}
                onChange={(e) => setFormData({ ...formData, stylistId: e.target.value })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              >
                <option value="">-- Không chọn --</option>
                {stylists.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeaturedShowcase"
                checked={formData.isFeatured ?? false}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded border-salon-gold/30 bg-salon-noir text-salon-gold focus:ring-salon-gold"
              />
              <label htmlFor="isFeaturedShowcase" className="text-sm text-salon-ivory cursor-pointer font-medium">
                Nổi bật trang chủ (Featured)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400">Thứ tự:</label>
              <input
                type="number"
                value={formData.displayOrder ?? 0}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-20 bg-salon-noir border border-salon-gold/20 rounded px-2 py-1 text-sm text-salon-ivory"
              />
            </div>
          </div>

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
              {showcase ? 'Lưu thay đổi' : 'Thêm showcase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
