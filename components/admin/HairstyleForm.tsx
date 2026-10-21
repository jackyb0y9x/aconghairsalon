'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowLeft, Loader2, Sparkles, Image as ImageIcon, Upload } from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/lib/utils';
import { ImageUpload } from '@/components/admin/ImageUpload';

export interface HairstyleFormData {
  id?: string;
  name?: string;
  title?: string;
  slug?: string;
  summary?: string | null;
  description: string;
  coverImageUrl?: string;
  images?: string[];
  galleryImages?: string[];
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  length: 'VERY_SHORT' | 'SHORT' | 'MEDIUM' | 'LONG' | 'EXTRA_LONG';
  style: string;
  styleVibe?: string;
  faceShape?: string | string[];
  suitableFaces?: string[];
  texture?: string | string[];
  suitableTexture?: string[];
  careLevel?: string;
  careEffort?: string;
  price?: number;
  priceRefMin?: number;
  priceRefMax?: number;
  careAdvice?: string | null;
  stylingTips?: string | null;
  isTrending?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  categoryId?: string;
}

interface Props {
  initialData?: HairstyleFormData | null;
  categories: { id: string; name: string }[];
}

const ALL_FACE_SHAPES = [
  { value: 'OVAL', label: 'Mặt trái xoan (Oval)' },
  { value: 'ROUND', label: 'Mặt tròn (Round)' },
  { value: 'SQUARE', label: 'Mặt vuông (Square)' },
  { value: 'HEART', label: 'Mặt trái tim (Heart)' },
  { value: 'DIAMOND', label: 'Mặt kim cương (Diamond)' },
  { value: 'OBLONG', label: 'Mặt dài (Oblong)' },
  { value: 'ALL', label: 'Mọi dáng mặt (All)' },
];

const ALL_TEXTURES = [
  { value: 'STRAIGHT', label: 'Tóc thẳng' },
  { value: 'WAVY', label: 'Gợn sóng tự nhiên' },
  { value: 'CURLY', label: 'Xoăn lọn' },
  { value: 'COILY', label: 'Xoăn xù afro' },
  { value: 'FINE', label: 'Sợi tóc tơ mảnh' },
  { value: 'THICK', label: 'Sợi tóc dày khỏe' },
];

export function HairstyleForm({ initialData, categories }: Props) {
  const router = useRouter();

  const [formData, setFormData] = useState<HairstyleFormData>({
    title: initialData?.title || initialData?.name || '',
    slug: initialData?.slug || '',
    summary: initialData?.summary || '',
    description: initialData?.description || 'Kiểu tóc thiết kế độc quyền tại Công Nguyễn Hair Salon.',
    coverImageUrl: initialData?.coverImageUrl || initialData?.images?.[0] || '',
    galleryImages: initialData?.galleryImages || (initialData?.images?.slice(1) || []),
    gender: initialData?.gender || 'UNISEX',
    length: initialData?.length || 'MEDIUM',
    style: initialData?.style || initialData?.styleVibe || 'KOREAN',
    styleVibe: initialData?.styleVibe || initialData?.style || 'KOREAN',
    suitableFaces: initialData?.suitableFaces || ['OVAL'],
    suitableTexture: initialData?.suitableTexture || ['STRAIGHT'],
    careEffort: initialData?.careEffort || (initialData?.careLevel === 'EASY' ? 'LOW' : initialData?.careLevel) || 'MEDIUM',
    careLevel: initialData?.careLevel || initialData?.careEffort || 'MEDIUM',
    price: initialData?.price || initialData?.priceRefMin || 350000,
    priceRefMin: initialData?.priceRefMin || initialData?.price || 350000,
    priceRefMax: initialData?.priceRefMax || initialData?.price || 500000,
    careAdvice: initialData?.careAdvice || '',
    stylingTips: initialData?.stylingTips || '',
    isTrending: initialData?.isTrending ?? false,
    isFeatured: initialData?.isFeatured ?? false,
    isActive: initialData?.isActive ?? true,
    categoryId: initialData?.categoryId || categories[0]?.id || '',
  });

  const [galleryInput, setGalleryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng tệp vượt quá 5MB');
      return;
    }

    setIsUploadingGallery(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'hairstyles');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi tải ảnh lên');
      }

      setFormData((prev) => ({
        ...prev,
        galleryImages: [...(prev.galleryImages || []), data.url],
      }));
    } catch (err: any) {
      alert(err.message || 'Không thể tải ảnh');
    } finally {
      setIsUploadingGallery(false);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    }
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: !initialData ? slugify(val) : prev.slug,
    }));
  };

  const toggleFaceShape = (face: string) => {
    setFormData((prev) => {
      const current = prev.suitableFaces || [];
      const updated = current.includes(face)
        ? current.filter((f) => f !== face)
        : [...current, face];
      return { ...prev, suitableFaces: updated.length > 0 ? updated : ['OVAL'] };
    });
  };

  const toggleTexture = (tex: string) => {
    setFormData((prev) => {
      const current = prev.suitableTexture || [];
      const updated = current.includes(tex)
        ? current.filter((t) => t !== tex)
        : [...current, tex];
      return { ...prev, suitableTexture: updated.length > 0 ? updated : ['STRAIGHT'] };
    });
  };

  const addGalleryImage = () => {
    if (!galleryInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      galleryImages: [...(prev.galleryImages || []), galleryInput.trim()],
    }));
    setGalleryInput('');
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: (prev.galleryImages || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      setError('Tên và đường dẫn kiểu tóc là bắt buộc');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = initialData?.id ? `/api/admin/hairstyles/${initialData.id}` : '/api/admin/hairstyles';
      const method = initialData?.id ? 'PUT' : 'POST';

      const payload = {
        name: formData.title,
        title: formData.title,
        slug: slugify(formData.slug),
        summary: formData.summary || null,
        description: formData.description,
        coverImageUrl: formData.coverImageUrl || '/images/default-hair.jpg',
        galleryImages: formData.galleryImages || [],
        images: [formData.coverImageUrl || '/images/default-hair.jpg', ...(formData.galleryImages || [])],
        gender: formData.gender,
        length: formData.length,
        style: formData.styleVibe,
        styleVibe: formData.styleVibe,
        suitableFaces: formData.suitableFaces,
        suitableTexture: formData.suitableTexture,
        careEffort: formData.careEffort,
        careLevel: formData.careEffort,
        price: Number(formData.price) || Number(formData.priceRefMin) || 350000,
        priceRefMin: Number(formData.priceRefMin) || Number(formData.price) || 350000,
        priceRefMax: Number(formData.priceRefMax) || Number(formData.price) || 500000,
        careAdvice: formData.careAdvice || null,
        stylingTips: formData.stylingTips || null,
        isTrending: formData.isTrending ?? false,
        isFeatured: formData.isFeatured ?? false,
        isActive: formData.isActive ?? true,
        categoryId: formData.categoryId || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi lưu kiểu tóc');
      }

      router.push('/admin/hairstyles');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-12">
      <div className="flex items-center justify-between pb-4 border-b border-salon-gold/15">
        <Link
          href="/admin/hairstyles"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-salon-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 font-semibold text-sm bg-salon-gold text-salon-noir rounded-lg hover:bg-salon-gold/90 transition-colors flex items-center gap-2 shadow-lg shadow-salon-gold/10"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{initialData ? 'Lưu Thay Đổi' : 'Tạo Kiểu Tóc Mới'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Block 1: Thông tin cơ bản */}
      <div className="bg-salon-charcoal p-6 rounded-xl border border-salon-gold/20 space-y-4">
        <h2 className="text-base font-serif font-bold text-salon-gold flex items-center gap-2">
          <Scissors className="w-4 h-4" />
          <span>1. Thông Tin Nhận Diện & Định Tuyến</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
              Tên kiểu tóc *
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="VD: Korean Butterfly Layer"
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
              Đường dẫn Slug (SEO URL) *
            </label>
            <input
              type="text"
              required
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="korean-butterfly-layer"
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory font-mono focus:outline-none focus:border-salon-gold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Danh mục kiểu tóc
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
              Khoảng giá tham khảo (VNĐ)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step={10000}
                value={formData.priceRefMin || ''}
                onChange={(e) => setFormData({ ...formData, priceRefMin: parseInt(e.target.value) || 0 })}
                placeholder="Giá min"
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-1.5 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
              <input
                type="number"
                step={10000}
                value={formData.priceRefMax || ''}
                onChange={(e) => setFormData({ ...formData, priceRefMax: parseInt(e.target.value) || 0 })}
                placeholder="Giá max"
                className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-1.5 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Tóm tắt nổi bật (Features / Summary)
          </label>
          <input
            type="text"
            value={formData.summary || ''}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="Tầng tóc bay bổng, ôm nhẹ đường viền xương hàm..."
            className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
            Mô tả chi tiết kỹ thuật tạo kiểu
          </label>
          <textarea
            rows={4}
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
          />
        </div>
      </div>

      {/* Block 2: Phân loại đa chiều */}
      <div className="bg-salon-charcoal p-6 rounded-xl border border-salon-gold/20 space-y-5">
        <h2 className="text-base font-serif font-bold text-salon-gold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>2. Đặc Trưng & Tiêu Chí Phù Hợp</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Đối tượng
            </label>
            <select
              value={formData.gender || 'UNISEX'}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            >
              <option value="FEMALE">Nữ (Female)</option>
              <option value="MALE">Nam (Male)</option>
              <option value="UNISEX">Unisex</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Độ dài tóc
            </label>
            <select
              value={formData.length || 'MEDIUM'}
              onChange={(e) => setFormData({ ...formData, length: e.target.value as any })}
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            >
              <option value="VERY_SHORT">Rất ngắn (Pixie/Fade)</option>
              <option value="SHORT">Ngắn (Short Bob/Crop)</option>
              <option value="MEDIUM">Ngang vai (Medium)</option>
              <option value="LONG">Dài (Long)</option>
              <option value="EXTRA_LONG">Rất dài (Extra Long)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Phong cách (Vibe)
            </label>
            <select
              value={formData.styleVibe || 'KOREAN'}
              onChange={(e) => setFormData({ ...formData, styleVibe: e.target.value, style: e.target.value })}
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            >
              <option value="KOREAN">Hàn Quốc (Korean)</option>
              <option value="JAPANESE">Nhật Bản (Japanese)</option>
              <option value="CLASSIC">Cổ điển (Classic)</option>
              <option value="MINIMALIST">Tối giản (Minimalist)</option>
              <option value="STREETWEAR">Cá tính (Streetwear)</option>
              <option value="BUSINESS">Công sở (Business)</option>
              <option value="AVANT_GARDE">Nghệ thuật (Avant-Garde)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Mức độ chăm sóc
            </label>
            <select
              value={formData.careEffort || 'MEDIUM'}
              onChange={(e) => setFormData({ ...formData, careEffort: e.target.value, careLevel: e.target.value })}
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            >
              <option value="LOW">Dễ chăm sóc (Low / Easy)</option>
              <option value="MEDIUM">Trung bình (Medium)</option>
              <option value="HIGH">Cần sấy tạo kiểu (High)</option>
            </select>
          </div>
        </div>

        {/* Dáng khuôn mặt */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-2">
            Dáng khuôn mặt phù hợp (Chọn nhiều)
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_FACE_SHAPES.map((shape) => {
              const isSelected = formData.suitableFaces?.includes(shape.value);
              return (
                <button
                  type="button"
                  key={shape.value}
                  onClick={() => toggleFaceShape(shape.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    isSelected
                      ? 'bg-salon-gold text-salon-noir border-salon-gold font-bold'
                      : 'bg-salon-noir text-zinc-400 border-salon-gold/20 hover:text-white'
                  }`}
                >
                  {shape.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chất tóc */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-salon-gold mb-2">
            Chất tóc phù hợp (Chọn nhiều)
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_TEXTURES.map((tex) => {
              const isSelected = formData.suitableTexture?.includes(tex.value);
              return (
                <button
                  type="button"
                  key={tex.value}
                  onClick={() => toggleTexture(tex.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    isSelected
                      ? 'bg-salon-gold text-salon-noir border-salon-gold font-bold'
                      : 'bg-salon-noir text-zinc-400 border-salon-gold/20 hover:text-white'
                  }`}
                >
                  {tex.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Block 3: Hình ảnh & Gallery */}
      <div className="bg-salon-charcoal p-6 rounded-xl border border-salon-gold/20 space-y-4">
        <h2 className="text-base font-serif font-bold text-salon-gold flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          <span>3. Bộ Sưu Tập Ảnh Kiểu Tóc</span>
        </h2>

        {/* Ảnh bìa chính có hỗ trợ upload trực tiếp hoặc nhập URL */}
        <ImageUpload
          value={formData.coverImageUrl || ''}
          onChange={(url) => setFormData({ ...formData, coverImageUrl: url })}
          folder="hairstyles"
          label="Ảnh bìa chính (Cover Image)"
          required
          aspectRatio="portrait"
          helperText="Kéo thả hoặc tải ảnh kiểu tóc đại diện (khuyến nghị tỉ lệ 4:5, tối đa 5MB)"
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
            Thêm ảnh phụ đa góc độ (Góc nghiêng, sau gáy, cận cảnh)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="file"
              ref={galleryFileInputRef}
              onChange={handleGalleryFileUpload}
              accept="image/*"
              className="hidden"
            />
            <input
              type="text"
              value={galleryInput}
              onChange={(e) => setGalleryInput(e.target.value)}
              placeholder="Nhập URL ảnh phụ hoặc chọn tệp tải lên..."
              className="flex-1 bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
            <button
              type="button"
              onClick={addGalleryImage}
              className="px-4 py-2 bg-zinc-800 text-salon-ivory text-sm rounded-lg hover:bg-zinc-700 transition-colors whitespace-nowrap"
            >
              Thêm URL
            </button>
            <button
              type="button"
              onClick={() => galleryFileInputRef.current?.click()}
              disabled={isUploadingGallery}
              className="px-4 py-2 bg-salon-gold/20 text-salon-gold border border-salon-gold/30 text-sm font-medium rounded-lg hover:bg-salon-gold/30 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
            >
              {isUploadingGallery ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Tải ảnh từ máy</span>
                </>
              )}
            </button>
          </div>

          {formData.galleryImages && formData.galleryImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {formData.galleryImages.map((img, idx) => (
                <div key={idx} className="relative group border border-salon-gold/20 rounded-lg overflow-hidden h-24 bg-black">
                  <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(idx)}
                    className="absolute top-1 right-1 bg-black/80 text-rose-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Block 4: Hướng dẫn chăm sóc & Flags */}
      <div className="bg-salon-charcoal p-6 rounded-xl border border-salon-gold/20 space-y-4">
        <h2 className="text-base font-serif font-bold text-salon-gold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>4. Lời Khuyên Stylist & Trạng Thái</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Hướng dẫn chăm sóc tại nhà (Care Advice)
            </label>
            <textarea
              rows={3}
              value={formData.careAdvice || ''}
              onChange={(e) => setFormData({ ...formData, careAdvice: e.target.value })}
              placeholder="VD: Dùng lô cuốn mái mỗi sáng, thoa serum dưỡng ẩm..."
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Mẹo sấy tạo kiểu (Styling Tips)
            </label>
            <textarea
              rows={3}
              value={formData.stylingTips || ''}
              onChange={(e) => setFormData({ ...formData, stylingTips: e.target.value })}
              placeholder="VD: Sấy ngược chân tóc để tạo độ phồng tối đa..."
              className="w-full bg-salon-noir border border-salon-gold/20 rounded-lg px-3.5 py-2 text-sm text-salon-ivory focus:outline-none focus:border-salon-gold"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-salon-gold/15">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isTrendingStyle"
              checked={formData.isTrending ?? false}
              onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
              className="w-4 h-4 rounded border-salon-gold/30 bg-salon-noir text-salon-gold focus:ring-salon-gold"
            />
            <label htmlFor="isTrendingStyle" className="text-sm text-salon-ivory cursor-pointer font-medium">
              Đánh dấu Xu hướng (Trending)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeaturedStyle"
              checked={formData.isFeatured ?? false}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 rounded border-salon-gold/30 bg-salon-noir text-salon-gold focus:ring-salon-gold"
            />
            <label htmlFor="isFeaturedStyle" className="text-sm text-salon-ivory cursor-pointer font-medium">
              Nổi bật trang chủ (Featured)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveStyle"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-salon-gold/30 bg-salon-noir text-salon-gold focus:ring-salon-gold"
            />
            <label htmlFor="isActiveStyle" className="text-sm text-salon-ivory cursor-pointer font-medium">
              Công khai trên website
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
