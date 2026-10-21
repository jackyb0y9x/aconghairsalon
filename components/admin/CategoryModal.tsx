'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Tags } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { ImageUpload } from '@/components/admin/ImageUpload';

export interface CategoryData {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  type: 'HAIRSTYLE' | 'SERVICE' | 'ARTICLE';
  imageUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryData | null;
  defaultType?: 'HAIRSTYLE' | 'SERVICE' | 'ARTICLE';
  onSaved: () => void;
}

export function CategoryModal({ isOpen, onClose, category, defaultType = 'HAIRSTYLE', onSaved }: CategoryModalProps) {
  const [formData, setFormData] = useState<Partial<CategoryData>>({
    name: '',
    slug: '',
    description: '',
    type: defaultType,
    imageUrl: '',
    displayOrder: 0,
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        type: category.type || defaultType,
        imageUrl: category.imageUrl || '',
        displayOrder: category.displayOrder ?? 0,
        isActive: category.isActive ?? true,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        type: defaultType,
        imageUrl: '',
        displayOrder: 0,
        isActive: true,
      });
    }
    setError(null);
  }, [category, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !category ? slugify(name) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = category?.id ? `/api/admin/categories/${category.id}` : '/api/admin/categories';
      const method = category?.id ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        slug: formData.slug ? slugify(formData.slug) : slugify(formData.name),
        description: formData.description || null,
        type: formData.type || 'HAIRSTYLE',
        imageUrl: formData.imageUrl || null,
        displayOrder: Number(formData.displayOrder) || 0,
        isActive: formData.isActive ?? true,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu danh mục');
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
      <div className="relative w-full max-w-lg bg-salon-charcoal border border-salon-gold/30 rounded-xl shadow-2xl p-6 text-salon-ivory">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-salon-gold rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6 border-b border-salon-gold/15 pb-4">
          <Tags className="w-5 h-5 text-salon-gold" />
          <h2 className="text-xl font-serif font-bold text-salon-ivory">
            {category ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới'}
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
              Phân loại mục đích *
            </label>
            <select
              value={formData.type || 'HAIRSTYLE'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            >
              <option value="HAIRSTYLE">Kiểu Tóc (Hairstyle)</option>
              <option value="SERVICE">Dịch Vụ (Service)</option>
              <option value="ARTICLE">Bài Viết (Article)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
              Tên danh mục *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="VD: Kiểu Tóc Nữ Layer"
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
              placeholder="VD: kieu-toc-nu-layer"
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory font-mono focus:outline-none focus:border-salon-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Mô tả danh mục
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả tóm tắt về danh mục này..."
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

          <ImageUpload
            value={formData.imageUrl || ''}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            folder="categories"
            label="Ảnh đại diện danh mục"
            aspectRatio="video"
            helperText="Tải lên ảnh minh họa cho danh mục (khuyến nghị 16:9, tối đa 5MB)"
          />

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActiveCategory"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-salon-gold/30 bg-salon-noir text-salon-gold focus:ring-salon-gold"
            />
            <label htmlFor="isActiveCategory" className="text-sm font-medium text-salon-ivory cursor-pointer">
              Kích hoạt danh mục này
            </label>
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
              {category ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
