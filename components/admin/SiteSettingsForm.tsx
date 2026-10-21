'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SiteSettingsUpdateSchema, type SiteSettingsUpdateInput } from '@/lib/validations/settings';
import {
  Save,
  RotateCcw,
  Sparkles,
  Phone,
  Share2,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface SiteSettingsFormProps {
  initialData: any;
}

export function SiteSettingsForm({ initialData }: SiteSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<'brand' | 'contact' | 'social' | 'maps' | 'seo'>('brand');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, isDirty, errors },
  } = useForm<SiteSettingsUpdateInput>({
    resolver: zodResolver(SiteSettingsUpdateSchema),
    defaultValues: {
      brandName: initialData?.brandName || 'Công Nguyễn Hair Salon',
      brandSlogan: initialData?.brandSlogan || 'Định Hình Khí Chất - Tỏa Sáng Phong Cách',
      logoUrl: initialData?.logoUrl || '',
      faviconUrl: initialData?.faviconUrl || '',
      hotline: initialData?.hotline || initialData?.hotlinePrimary || '0988 888 888',
      hotlineSecondary: initialData?.hotlineSecondary || '',
      emailContact: initialData?.emailContact || 'contact@congnguyenhair.vn',
      address: initialData?.address || initialData?.addressFull || 'Nguyệt Áng 3, An Khánh, Hải Phòng',
      openingHours:
        typeof initialData?.openingHours === 'string'
          ? initialData.openingHours
          : initialData?.openingHours?.rawText || '08:30 - 20:30 Hàng ngày',
      socialFacebook: initialData?.socialFacebook || initialData?.socialLinks?.facebook || '',
      socialInstagram: initialData?.socialInstagram || initialData?.socialLinks?.instagram || '',
      socialTikTok: initialData?.socialTikTok || initialData?.socialLinks?.tiktok || '',
      socialZalo: initialData?.socialZalo || initialData?.socialLinks?.zalo || '',
      googleMapsEmbedUrl: initialData?.googleMapsEmbedUrl || '',
      defaultMetaTitle:
        initialData?.defaultMetaTitle ||
        initialData?.defaultSeoMetadata?.title ||
        'Công Nguyễn Hair Salon | Salon Tóc Nam & Nữ Hiện Đại',
      defaultMetaDescription:
        initialData?.defaultMetaDescription ||
        initialData?.defaultSeoMetadata?.description ||
        'Salon tóc Nam và Nữ cao cấp tại Nguyệt Áng 3, An Khánh, Hải Phòng. Đội ngũ thợ tay nghề cao, cập nhật xu hướng tóc châu Á và công nghệ thử màu tóc trực tuyến.',
      footerText:
        initialData?.footerText ||
        initialData?.footerContent?.copyright ||
        '© 2026 Công Nguyễn Hair Salon. All rights reserved.',
    },
  });

  const watchBrandName = watch('brandName');
  const watchBrandSlogan = watch('brandSlogan');
  const watchLogoUrl = watch('logoUrl');
  const watchMapsUrl = watch('googleMapsEmbedUrl');
  const watchMetaTitle = watch('defaultMetaTitle') || '';
  const watchMetaDesc = watch('defaultMetaDescription') || '';

  const onSubmit = async (data: SiteSettingsUpdateInput) => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(data),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        result = { error: text || `Máy chủ phản hồi mã ${res.status}` };
      }

      if (res.status === 401) {
        setSaveError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => {
          window.location.href = '/admin/login?redirect=/admin/settings';
        }, 1500);
        return;
      }

      if (!res.ok) {
        setSaveError(result?.error || `Cập nhật cấu hình không thành công (Mã lỗi: ${res.status}).`);
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('[SiteSettingsForm Error]', err);
      setSaveError(err?.message || 'Lỗi kết nối máy chủ khi lưu cấu hình.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alerts */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Cấu hình Salon đã được cập nhật thành công và áp dụng tức thì trên website!</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-salon-gold/15 overflow-x-auto gap-2 custom-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('brand')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors shrink-0 ${
            activeTab === 'brand'
              ? 'bg-salon-gold/15 text-salon-gold border-b-2 border-salon-gold'
              : 'text-zinc-400 hover:text-salon-ivory hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>1. Nhận Diện Thương Hiệu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors shrink-0 ${
            activeTab === 'contact'
              ? 'bg-salon-gold/15 text-salon-gold border-b-2 border-salon-gold'
              : 'text-zinc-400 hover:text-salon-ivory hover:bg-white/5'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>2. Liên Hệ & Giờ Mở Cửa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors shrink-0 ${
            activeTab === 'social'
              ? 'bg-salon-gold/15 text-salon-gold border-b-2 border-salon-gold'
              : 'text-zinc-400 hover:text-salon-ivory hover:bg-white/5'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>3. Mạng Xã Hội</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('maps')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors shrink-0 ${
            activeTab === 'maps'
              ? 'bg-salon-gold/15 text-salon-gold border-b-2 border-salon-gold'
              : 'text-zinc-400 hover:text-salon-ivory hover:bg-white/5'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>4. Bản Đồ Google Maps</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors shrink-0 ${
            activeTab === 'seo'
              ? 'bg-salon-gold/15 text-salon-gold border-b-2 border-salon-gold'
              : 'text-zinc-400 hover:text-salon-ivory hover:bg-white/5'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>5. SEO & Chân Trang</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab 1: Nhận diện Thương hiệu */}
        {activeTab === 'brand' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            <div className="lg:col-span-2 space-y-4 p-6 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Tên Thương Hiệu Salon
                </label>
                <input
                  {...register('brandName')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="Công Nguyễn Hair Salon"
                />
                {errors.brandName && (
                  <p className="text-xs text-rose-400 mt-1">{errors.brandName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Câu Định Vị Slogan
                </label>
                <input
                  {...register('brandSlogan')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="Định Hình Khí Chất - Tỏa Sáng Phong Cách"
                />
              </div>

              <div>
                <ImageUpload
                  value={watchLogoUrl || ''}
                  onChange={(url) => setValue('logoUrl', url, { shouldValidate: true, shouldDirty: true })}
                  folder="brand"
                  label="Logo Salon"
                  aspectRatio="square"
                  helperText="Tải file logo nhận diện (PNG, SVG, JPG tối đa 5MB)"
                />
              </div>

              <div>
                <ImageUpload
                  value={watch('faviconUrl') || ''}
                  onChange={(url) => setValue('faviconUrl', url, { shouldValidate: true, shouldDirty: true })}
                  folder="brand"
                  label="Favicon Biểu Tượng"
                  aspectRatio="square"
                  helperText="Tải file biểu tượng favicon hiển thị trên tab trình duyệt (ICO, PNG)"
                />
              </div>
            </div>

            {/* Live Brand Preview Card */}
            <div className="p-6 rounded-xl bg-salon-charcoal/50 border border-salon-gold/15 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-salon-gold">
                Xem Trước Nhận Diện
              </h4>
              <div className="p-5 rounded-lg bg-salon-noir border border-salon-gold/20 text-center space-y-2">
                {watchLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={watchLogoUrl}
                    alt="Logo preview"
                    className="h-10 mx-auto object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-salon-gold/20 text-salon-gold font-bold flex items-center justify-center mx-auto">
                    CN
                  </div>
                )}
                <div className="font-serif font-bold text-lg text-salon-ivory">
                  {watchBrandName || 'Công Nguyễn Hair Salon'}
                </div>
                <div className="text-xs text-zinc-400 italic">
                  {watchBrandSlogan || 'Định Hình Khí Chất - Tỏa Sáng Phong Cách'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Liên hệ & Giờ mở cửa */}
        {activeTab === 'contact' && (
          <div className="p-6 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Hotline Chính (Đặt Lịch & Tư Vấn)
                </label>
                <input
                  {...register('hotline')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="0988 888 888"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Hotline Phụ / Phản Ánh Dịch Vụ
                </label>
                <input
                  {...register('hotlineSecondary')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="0988 999 999"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Email Liên Hệ Chính Thức
                </label>
                <input
                  {...register('emailContact')}
                  type="email"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="contact@congnguyenhair.vn"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Khung Giờ Hoạt Động Hiển Thị
                </label>
                <input
                  {...register('openingHours')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="08:30 - 20:30 Hàng ngày"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Địa Chỉ Trụ Sở Salon Đầy Đủ
              </label>
              <input
                {...register('address')}
                className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                placeholder="Nguyệt Áng 3, An Khánh, Hải Phòng"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Mạng xã hội */}
        {activeTab === 'social' && (
          <div className="p-6 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Facebook Fanpage URL
                </label>
                <input
                  {...register('socialFacebook')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="https://facebook.com/lumierehair"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Instagram Profile URL
                </label>
                <input
                  {...register('socialInstagram')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="https://instagram.com/lumierehair"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  TikTok Channel URL
                </label>
                <input
                  {...register('socialTikTok')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="https://tiktok.com/@lumierehair"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Zalo OA / Hotline Zalo
                </label>
                <input
                  {...register('socialZalo')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="0908123456"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Bản đồ Google Maps */}
        {activeTab === 'maps' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-6 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Mã Nhúng Bản Đồ Google Maps (Embed Iframe URL)
                </label>
                <input
                  {...register('googleMapsEmbedUrl')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none font-mono text-xs"
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Dán URL `src` từ mã nhúng iframe của Google Maps để hiển thị bản đồ trên trang liên hệ.
                </p>
              </div>

              {/* Map Preview */}
              {watchMapsUrl && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Xem Trước Bản Đồ Nhúng
                  </h4>
                  <div className="w-full h-64 rounded-xl overflow-hidden border border-salon-gold/20 bg-salon-noir">
                    <iframe
                      src={watchMapsUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      sandbox="allow-scripts allow-same-origin"
                      title="Google Maps Preview"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: SEO & Chân trang */}
        {activeTab === 'seo' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Tiêu Đề SEO Mặc Định (Meta Title)
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      watchMetaTitle.length > 60 ? 'text-amber-400' : 'text-zinc-500'
                    }`}
                  >
                    {watchMetaTitle.length} / 60 ký tự
                  </span>
                </div>
                <input
                  {...register('defaultMetaTitle')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="Công Nguyễn Hair Salon | Salon Tóc Nam & Nữ Hiện Đại"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Mô Tả SEO Mặc Định (Meta Description)
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      watchMetaDesc.length > 160 ? 'text-amber-400' : 'text-zinc-500'
                    }`}
                  >
                    {watchMetaDesc.length} / 160 ký tự
                  </span>
                </div>
                <textarea
                  {...register('defaultMetaDescription')}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="Salon tóc Nam và Nữ cao cấp tại Nguyệt Áng 3, An Khánh, Hải Phòng. Đội ngũ thợ tay nghề cao, cập nhật xu hướng tóc châu Á và công nghệ thử màu tóc trực tuyến."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Văn Bản Bản Quyền Chân Trang (Copyright)
                </label>
                <input
                  {...register('footerText')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-salon-noir border border-zinc-700 text-salon-ivory text-sm focus:border-salon-gold focus:outline-none"
                  placeholder="© 2026 Công Nguyễn Hair Salon. All rights reserved."
                />
              </div>

              {/* Google Search Snippet Simulation */}
              <div className="mt-4 p-4 rounded-xl bg-salon-noir border border-zinc-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Mô phỏng kết quả Google Search
                </span>
                <div className="text-xs text-emerald-400 font-mono">https://congnguyenhairsalon.vn</div>
                <div className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer">
                  {watchMetaTitle || 'Công Nguyễn Hair Salon'}
                </div>
                <div className="text-xs text-zinc-400 line-clamp-2">
                  {watchMetaDesc || 'Salon tóc Nam và Nữ cao cấp tại Nguyệt Áng 3, An Khánh, Hải Phòng.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-salon-gold/15">
          <button
            type="button"
            onClick={() => reset()}
            disabled={!isDirty || isSubmitting}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi phục</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-salon-gold hover:bg-salon-gold-hover text-salon-noir rounded-xl transition shadow-gold-subtle disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-salon-noir" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu Cấu Hình</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
