'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { ImageUpload } from '@/components/admin/ImageUpload';

export interface ServiceData {
  id?: string;
  title?: string;
  name?: string;
  slug?: string;
  shortSummary?: string | null;
  description: string;
  durationMinutes: number;
  priceMin: number;
  minPrice?: number;
  priceMax?: number | null;
  maxPrice?: number | null;
  preCareAdvice?: string | null;
  postCareAdvice?: string | null;
  imageUrl?: string | null;
  categoryId?: string;
  category?: string;
  isPopular?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: ServiceData | null;
  categories: { id: string; name: string }[];
  onSaved: () => void;
}

export function ServiceModal({ isOpen, onClose, service, categories, onSaved }: ServiceModalProps) {
  const [formData, setFormData] = useState<Partial<ServiceData>>({
    title: '',
    slug: '',
    shortSummary: '',
    description: '',
    durationMinutes: 45,
    priceMin: 300000,
    priceMax: 500000,
    preCareAdvice: '',
    postCareAdvice: '',
    imageUrl: '',
    categoryId: '',
    isPopular: false,
    isActive: true,
    displayOrder: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title || service.name || '',
        slug: service.slug || '',
        shortSummary: service.shortSummary || '',
        description: service.description || '',
        durationMinutes: service.durationMinutes || 45,
        priceMin: service.priceMin ?? service.minPrice ?? 300000,
        priceMax: service.priceMax ?? service.maxPrice ?? 500000,
        preCareAdvice: service.preCareAdvice || '',
        postCareAdvice: service.postCareAdvice || '',
        imageUrl: service.imageUrl || '',
        categoryId: service.categoryId || categories[0]?.id || '',
        isPopular: service.isPopular ?? false,
        isActive: service.isActive ?? true,
        displayOrder: service.displayOrder ?? 0,
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        shortSummary: '',
        description: '',
        durationMinutes: 45,
        priceMin: 300000,
        priceMax: 500000,
        preCareAdvice: '',
        postCareAdvice: '',
        imageUrl: '',
        categoryId: categories[0]?.id || '',
        isPopular: false,
        isActive: true,
        displayOrder: 0,
      });
    }
    setError(null);
  }, [service, categories, isOpen]);

  if (!isOpen) return null;

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: !service ? slugify(title) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError('Vui lòng nhập tên dịch vụ và mô tả');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = service?.id ? `/api/admin/services/${service.id}` : '/api/admin/services';
      const method = service?.id ? 'PUT' : 'POST';

      const payload = {
        title: formData.title,
        name: formData.title,
        slug: formData.slug ? slugify(formData.slug) : slugify(formData.title || ''),
        shortSummary: formData.shortSummary || null,
        description: formData.description,
        durationMinutes: Number(formData.durationMinutes) || 45,
        priceMin: Number(formData.priceMin) || 0,
        minPrice: Number(formData.priceMin) || 0,
        priceMax: formData.priceMax !== undefined && formData.priceMax !== null ? Number(formData.priceMax) : null,
        maxPrice: formData.priceMax !== undefined && formData.priceMax !== null ? Number(formData.priceMax) : null,
        preCareAdvice: formData.preCareAdvice || null,
        postCareAdvice: formData.postCareAdvice || null,
        imageUrl: formData.imageUrl || null,
        categoryId: formData.categoryId || undefined,
        isPopular: formData.isPopular ?? false,
        isActive: formData.isActive ?? true,
        displayOrder: Number(formData.displayOrder) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu dịch vụ');
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
            {service ? 'Chỉnh Sửa Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
                Tên dịch vụ *
              </label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="VD: Cắt Layer Nữ Tạo Kiểu"
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Đường dẫn Slug (URL)
              </label>
              <input
                type="text"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="cat-layer-nu-tao-kieu"
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory font-mono focus:outline-none focus:border-salon-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
                Danh mục dịch vụ
              </label>
              <select
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Thời lượng ước tính (Phút)
              </label>
              <input
                type="number"
                min={15}
                max={480}
                value={formData.durationMinutes ?? 45}
                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 45 })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
                Giá khởi điểm (Min Price - VNĐ) *
              </label>
              <input
                type="number"
                min={0}
                step={10000}
                required
                value={formData.priceMin ?? 0}
                onChange={(e) => setFormData({ ...formData, priceMin: parseInt(e.target.value) || 0 })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Giá tối đa (Max Price - VNĐ)
              </label>
              <input
                type="number"
                min={0}
                step={10000}
                value={formData.priceMax || ''}
                onChange={(e) => setFormData({ ...formData, priceMax: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Để trống nếu đồng giá"
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Tóm tắt ngắn (Dưới 500 ký tự)
            </label>
            <input
              type="text"
              value={formData.shortSummary || ''}
              onChange={(e) => setFormData({ ...formData, shortSummary: e.target.value })}
              placeholder="VD: Cắt tỉa chuẩn form kết hợp gội dưỡng sinh thư giãn"
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
              Mô tả chi tiết quy trình dịch vụ *
            </label>
            <textarea
              rows={4}
              required
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả kỹ thuật, bước thực hiện và sản phẩm chuyên dụng sử dụng..."
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Hướng dẫn trước khi làm (Pre-care)
              </label>
              <textarea
                rows={2}
                value={formData.preCareAdvice || ''}
                onChange={(e) => setFormData({ ...formData, preCareAdvice: e.target.value })}
                placeholder="VD: Không nên gội đầu trước 24h đối với dịch vụ nhuộm..."
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Hướng dẫn chăm sóc sau dịch vụ (Post-care)
              </label>
              <textarea
                rows={2}
                value={formData.postCareAdvice || ''}
                onChange={(e) => setFormData({ ...formData, postCareAdvice: e.target.value })}
                placeholder="VD: Dùng kem xả phục hồi, sấy ấm theo chiều nếp tóc..."
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>
          </div>

          <ImageUpload
            value={formData.imageUrl || ''}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            folder="services"
            label="Ảnh minh họa dịch vụ"
            aspectRatio="video"
            helperText="Tải lên ảnh mô tả dịch vụ (khuyến nghị tỷ lệ 16:9, tối đa 5MB)"
          />

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPopularService"
                checked={formData.isPopular ?? false}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="w-4 h-4 rounded border-salon-gold/30 bg-salon-noir text-salon-gold focus:ring-salon-gold"
              />
              <label htmlFor="isPopularService" className="text-sm text-salon-ivory cursor-pointer font-medium">
                Dịch vụ được yêu thích (Popular)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActiveService"
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-salon-gold/30 bg-salon-noir text-salon-gold focus:ring-salon-gold"
              />
              <label htmlFor="isActiveService" className="text-sm text-salon-ivory cursor-pointer font-medium">
                Mở đặt lịch
              </label>
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
              {service ? 'Lưu thay đổi' : 'Thêm dịch vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
