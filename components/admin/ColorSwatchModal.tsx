'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Palette } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

export interface ColorData {
  id?: string;
  name: string;
  code?: string;
  hexCode?: string;
  hexColor?: string;
  secondaryHex?: string | null;
  tone: 'WARM' | 'COOL' | 'NEUTRAL';
  group: string;
  brightnessLevel?: number;
  brightness?: 'LIGHT' | 'MEDIUM' | 'DARK';
  requiresBleach?: boolean;
  bleachRounds?: number;
  skinSuitability?: string[];
  suitableSkinTones?: string[];
  maintenanceLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  maintenanceAdvice?: string | null;
  colorFadingAdvice?: string | null;
  swatchImageUrl?: string | null;
  samplePortraitUrl?: string | null;
  isTrending?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

interface ColorSwatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  color?: ColorData | null;
  onSaved: () => void;
}

export function ColorSwatchModal({ isOpen, onClose, color, onSaved }: ColorSwatchModalProps) {
  const [formData, setFormData] = useState<Partial<ColorData>>({
    name: '',
    code: '',
    hexCode: '#8B4513',
    secondaryHex: '',
    tone: 'NEUTRAL',
    group: 'BROWN',
    brightnessLevel: 6,
    requiresBleach: false,
    bleachRounds: 0,
    suitableSkinTones: ['Da sáng', 'Da trung tính'],
    maintenanceLevel: 'MEDIUM',
    maintenanceAdvice: '',
    swatchImageUrl: '',
    samplePortraitUrl: '',
    isTrending: false,
    isActive: true,
    displayOrder: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (color) {
      setFormData({
        name: color.name || '',
        code: color.code || '',
        hexCode: color.hexCode || color.hexColor || '#8B4513',
        secondaryHex: color.secondaryHex || '',
        tone: color.tone || 'NEUTRAL',
        group: color.group || 'BROWN',
        brightnessLevel: color.brightnessLevel ?? 6,
        requiresBleach: color.requiresBleach ?? false,
        bleachRounds: color.bleachRounds ?? 0,
        suitableSkinTones: color.skinSuitability || color.suitableSkinTones || ['Da sáng', 'Da trung tính'],
        maintenanceLevel: color.maintenanceLevel || 'MEDIUM',
        maintenanceAdvice: color.maintenanceAdvice || color.colorFadingAdvice || '',
        swatchImageUrl: color.swatchImageUrl || '',
        samplePortraitUrl: color.samplePortraitUrl || '',
        isTrending: color.isTrending ?? false,
        isActive: color.isActive ?? true,
        displayOrder: color.displayOrder ?? 0,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        hexCode: '#8B4513',
        secondaryHex: '',
        tone: 'NEUTRAL',
        group: 'BROWN',
        brightnessLevel: 6,
        requiresBleach: false,
        bleachRounds: 0,
        suitableSkinTones: ['Da sáng', 'Da trung tính'],
        maintenanceLevel: 'MEDIUM',
        maintenanceAdvice: '',
        swatchImageUrl: '',
        samplePortraitUrl: '',
        isTrending: false,
        isActive: true,
        displayOrder: 0,
      });
    }
    setError(null);
  }, [color, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.hexCode) {
      setError('Vui lòng nhập tên màu và mã màu HEX');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = color?.id ? `/api/admin/colors/${color.id}` : '/api/admin/colors';
      const method = color?.id ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        code: formData.code || undefined,
        hexCode: formData.hexCode,
        hexColor: formData.hexCode,
        secondaryHex: formData.secondaryHex || null,
        tone: formData.tone || 'NEUTRAL',
        group: formData.group || 'BROWN',
        brightnessLevel: Number(formData.brightnessLevel) || 6,
        requiresBleach: formData.requiresBleach ?? false,
        bleachRounds: formData.requiresBleach ? Number(formData.bleachRounds) || 1 : 0,
        suitableSkinTones: formData.suitableSkinTones || ['Da sáng'],
        skinSuitability: formData.suitableSkinTones || ['Da sáng'],
        maintenanceLevel: formData.maintenanceLevel || 'MEDIUM',
        maintenanceAdvice: formData.maintenanceAdvice || null,
        colorFadingAdvice: formData.maintenanceAdvice || null,
        swatchImageUrl: formData.swatchImageUrl || null,
        samplePortraitUrl: formData.samplePortraitUrl || null,
        isTrending: formData.isTrending ?? false,
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
        throw new Error(data.error || 'Lỗi khi lưu màu tóc');
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
          <Palette className="w-5 h-5 text-salon-gold" />
          <h2 className="text-xl font-serif font-bold text-salon-ivory">
            {color ? 'Chỉnh Sửa Màu Nhuộm Swatch' : 'Thêm Màu Nhuộm Swatch Mới'}
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
                Tên màu nhuộm *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Nâu Trà Sữa Ánh Khói"
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Mã công thức màu (Code)
              </label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: ASH-8.1"
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory font-mono focus:outline-none focus:border-salon-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
                Mã màu HEX chính *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.hexCode || '#8B4513'}
                  onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                  className="w-10 h-10 rounded border border-salon-gold/30 bg-salon-noir cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  required
                  value={formData.hexCode || ''}
                  onChange={(e) => setFormData({ ...formData, hexCode: e.target.value })}
                  placeholder="#8B4513"
                  className="flex-1 bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory font-mono focus:outline-none focus:border-salon-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Mã màu HEX phụ (Ánh sắc undertone)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.secondaryHex || '#D2B48C'}
                  onChange={(e) => setFormData({ ...formData, secondaryHex: e.target.value })}
                  className="w-10 h-10 rounded border border-salon-gold/30 bg-salon-noir cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={formData.secondaryHex || ''}
                  onChange={(e) => setFormData({ ...formData, secondaryHex: e.target.value })}
                  placeholder="#D2B48C"
                  className="flex-1 bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory font-mono focus:outline-none focus:border-salon-gold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Sắc độ Tone
              </label>
              <select
                value={formData.tone || 'NEUTRAL'}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value as any })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              >
                <option value="WARM">Ấm (Warm)</option>
                <option value="COOL">Lạnh (Cool)</option>
                <option value="NEUTRAL">Trung tính (Neutral)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Nhóm màu (Group)
              </label>
              <select
                value={formData.group || 'BROWN'}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              >
                <option value="BROWN">Nâu (Brown / Caramel)</option>
                <option value="BLONDE">Vàng sáng (Blonde)</option>
                <option value="RED_BURGUNDY">Đỏ / Rượu vang (Burgundy)</option>
                <option value="ASH_SMOKY">Khói / Xám tro (Ash)</option>
                <option value="PASTEL">Pastel kẹo ngọt</option>
                <option value="BLACK_DARK">Đen tuyền / Than chì</option>
                <option value="FASHION_VIBRANT">Màu thời trang nổi bật</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                Độ sáng (Scale 1 - 10): {formData.brightnessLevel}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={formData.brightnessLevel ?? 6}
                onChange={(e) => setFormData({ ...formData, brightnessLevel: parseInt(e.target.value) || 6 })}
                className="w-full accent-salon-gold mt-2 cursor-pointer"
              />
            </div>
          </div>

          <div className="p-3 border border-salon-gold/20 rounded-lg bg-salon-noir/60 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requiresBleach"
                checked={formData.requiresBleach ?? false}
                onChange={(e) => setFormData({ ...formData, requiresBleach: e.target.checked })}
                className="w-4 h-4 rounded border-salon-gold/30 bg-salon-noir text-salon-gold focus:ring-salon-gold"
              />
              <label htmlFor="requiresBleach" className="text-sm font-semibold text-salon-ivory cursor-pointer">
                Màu yêu cầu tẩy tóc (Bleach Required)
              </label>
            </div>

            {formData.requiresBleach && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1">
                  Số lần tẩy tóc khuyến nghị
                </label>
                <select
                  value={formData.bleachRounds ?? 1}
                  onChange={(e) => setFormData({ ...formData, bleachRounds: parseInt(e.target.value) || 1 })}
                  className="w-full sm:w-48 bg-salon-noir border border-amber-500/30 rounded-lg px-3 py-1.5 text-sm text-salon-ivory focus:outline-none focus:border-amber-400"
                >
                  <option value={1}>1 lần nâng tông</option>
                  <option value={2}>2 lần tẩy sâu</option>
                  <option value={3}>3 lần khử vàng bạch kim</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Lưu ý chăm sóc giữ màu (Maintenance Advice)
            </label>
            <textarea
              rows={2}
              value={formData.maintenanceAdvice || ''}
              onChange={(e) => setFormData({ ...formData, maintenanceAdvice: e.target.value })}
              placeholder="VD: Dùng dầu gội tím khử vàng, ủ phục hồi protein mỗi tuần..."
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
          </div>

          <ImageUpload
            value={formData.samplePortraitUrl || ''}
            onChange={(url) => setFormData({ ...formData, samplePortraitUrl: url })}
            folder="colors"
            label="Ảnh mẫu thực tế lên tóc (Tùy chọn)"
            aspectRatio="portrait"
            helperText="Tải lên ảnh mẫu người thật nhuộm tone màu này"
          />

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isTrendingColor"
                checked={formData.isTrending ?? false}
                onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                className="w-4 h-4 rounded border-salon-gold/30 bg-salon-noir text-salon-gold focus:ring-salon-gold"
              />
              <label htmlFor="isTrendingColor" className="text-sm text-salon-ivory cursor-pointer">
                Đánh dấu Xu hướng (Trending)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActiveColor"
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-salon-gold/30 bg-salon-noir text-salon-gold focus:ring-salon-gold"
              />
              <label htmlFor="isActiveColor" className="text-sm text-salon-ivory cursor-pointer">
                Hoạt động
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
              {color ? 'Lưu thay đổi' : 'Thêm màu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
