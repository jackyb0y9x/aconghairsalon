import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getPublicHairstyleBySlug,
  getPublicColors,
  getPublicServices,
} from '@/lib/public-data';
import { formatVND, formatDuration } from '@/lib/utils';
import {
  Sparkles,
  Calendar,
  CheckCircle,
  Clock,
  Scissors,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Heart,
  Share2,
} from 'lucide-react';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const hairstyle = await getPublicHairstyleBySlug(params.slug);
  if (!hairstyle) {
    return { title: 'Không tìm thấy kiểu tóc | Công Nguyễn Hair Salon' };
  }

  const title = hairstyle.title || hairstyle.name;
  const desc = hairstyle.summary || hairstyle.description?.slice(0, 160) || 'Kiểu tóc thời thượng chuẩn salon';

  return {
    title: `${title} | Công Nguyễn Hair Salon`,
    description: desc,
    openGraph: {
      title: `${title} | Công Nguyễn Hair Salon`,
      description: desc,
      images: [hairstyle.coverImageUrl || '/images/default-hair.jpg'],
    },
  };
}

export default async function HairstyleDetailPage({ params }: PageProps) {
  const hairstyle = await getPublicHairstyleBySlug(params.slug);
  if (!hairstyle) {
    notFound();
  }

  const [colorData, servicesData] = await Promise.all([
    getPublicColors(),
    getPublicServices(),
  ]);

  const title = hairstyle.title || hairstyle.name;
  const price = hairstyle.price || hairstyle.priceRefMin || 350000;
  const priceMax = hairstyle.priceRefMax || null;
  const allImages = [
    hairstyle.coverImageUrl,
    ...(hairstyle.galleryImages || []),
  ].filter(Boolean);

  const recommendedColors = colorData.colors.slice(0, 3);
  const matchedServices = servicesData.services.slice(0, 2);

  return (
    <div className="min-h-screen bg-salon-noir text-salon-ivory transition-colors duration-300 pb-24 md:pb-16">
      {/* Breadcrumb Bar */}
      <div className="border-b border-salon-gold/15 py-3 px-4 sm:px-6 lg:px-8 bg-salon-charcoal/40 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Link href="/" className="hover:text-salon-gold transition">
            Trang Chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <Link href="/hairstyles" className="hover:text-salon-gold transition">
            Thư Viện Kiểu Tóc
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-salon-gold-light truncate">{title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Hero Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Gallery Area (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Featured Photo */}
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-900 border border-salon-gold/30 shadow-luxury-dark">
              <img
                src={allImages[0] || '/images/default-hair.jpg'}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-salon-noir/80 via-transparent to-transparent" />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-salon-noir/80 text-salon-gold-light border border-salon-gold/30 backdrop-blur-md">
                  {hairstyle.gender === 'FEMALE' ? 'Nữ' : hairstyle.gender === 'MALE' ? 'Nam' : 'Unisex'}
                </span>
                {hairstyle.isTrending && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-salon-gold/20 text-salon-gold border border-salon-gold/40 backdrop-blur-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Trending 2026</span>
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Strip if multi-angle */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-salon-gold/20 hover:border-salon-gold transition cursor-pointer"
                  >
                    <img src={img} alt={`${title} góc ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details & Specs (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-salon-gold font-semibold">
                  Mã Kiểu Tóc: #{hairstyle.slug}
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                  {title}
                </h1>
                {hairstyle.summary && (
                  <p className="text-neutral-300 text-sm font-light leading-relaxed">
                    {hairstyle.summary}
                  </p>
                )}
              </div>

              {/* Price Range Box */}
              <div className="p-4 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/25 space-y-1">
                <span className="text-xs text-neutral-400">Chi phí dịch vụ tham khảo:</span>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-salon-gold">
                  {formatVND(price)}
                  {priceMax && priceMax > price && (
                    <span className="text-lg text-neutral-400 font-sans font-normal">
                      {' '}
                      - {formatVND(priceMax)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  * Giá có thể thay đổi tùy thuộc vào độ dài và kỹ thuật uốn/nhuộm kết hợp.
                </p>
              </div>

              {/* Direct Booking Action */}
              <div className="pt-2">
                <Link
                  href={`/booking?hairstyleId=${hairstyle.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-sm sm:text-base hover:opacity-95 shadow-gold-glow transition"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Đặt Lịch Ngay Với Kiểu Tóc Này</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {/* Specification Grid */}
              <div className="space-y-3 pt-4 border-t border-salon-gold/15">
                <h3 className="text-xs font-semibold text-salon-gold uppercase tracking-wider">
                  Thông Số & Độ Phù Hợp
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-salon-noir/80 border border-white/5 space-y-1">
                    <span className="text-neutral-400">Dáng mặt tối ưu:</span>
                    <div className="font-semibold text-white">
                      {hairstyle.suitableFaces && hairstyle.suitableFaces.length > 0
                        ? hairstyle.suitableFaces.join(', ')
                        : hairstyle.faceShape || 'Mọi dáng mặt'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-salon-noir/80 border border-white/5 space-y-1">
                    <span className="text-neutral-400">Chất tóc phù hợp:</span>
                    <div className="font-semibold text-white">
                      {hairstyle.suitableTexture && hairstyle.suitableTexture.length > 0
                        ? hairstyle.suitableTexture.join(', ')
                        : hairstyle.texture || 'Tự nhiên'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-salon-noir/80 border border-white/5 space-y-1">
                    <span className="text-neutral-400">Độ dài chuẩn:</span>
                    <div className="font-semibold text-white">
                      {hairstyle.length === 'SHORT' ? 'Tóc Ngắn' : hairstyle.length === 'LONG' ? 'Tóc Dài' : 'Ngang Vai'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-salon-noir/80 border border-white/5 space-y-1">
                    <span className="text-neutral-400">Chăm sóc tại nhà:</span>
                    <div className="font-semibold text-salon-gold-light">
                      {hairstyle.careEffort === 'LOW' ? 'Rất Dễ' : hairstyle.careEffort === 'HIGH' ? 'Cầu Kỳ' : 'Trung Bình'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Atelier Guarantees */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300 space-y-1.5">
              <div className="flex items-center gap-2 text-salon-gold font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Cam Kết Đẳng Cấp Tại Atelier</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Bảo hành chỉnh form tóc miễn phí trong vòng 7 ngày. Quý khách luôn được soi da đầu vi điểm và tư vấn chi tiết trước khi thực hiện.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections: Description, Styling Tips & Care Routine */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            {/* Description */}
            {hairstyle.description && (
              <section className="space-y-4">
                <h2 className="text-2xl font-serif font-bold text-salon-gold-light">
                  Đặc Điểm & Phong Cách Thiết Kế
                </h2>
                <div className="text-neutral-300 text-sm leading-relaxed space-y-3 font-light">
                  <p>{hairstyle.description}</p>
                </div>
              </section>
            )}

            {/* Features List */}
            {hairstyle.features && hairstyle.features.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xl font-serif font-bold text-white">
                  Điểm Nhấn Nổi Bật
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hairstyle.features.map((feat: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-salon-charcoal/60 border border-salon-gold/15 text-xs text-neutral-300"
                    >
                      <CheckCircle className="w-4 h-4 text-salon-gold flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Styling Tips & Care Advice */}
            <section className="space-y-6 p-6 rounded-2xl bg-salon-charcoal/50 border border-salon-gold/20">
              <h3 className="text-xl font-serif font-bold text-salon-gold-light">
                Hướng Dẫn Tạo Kiểu & Chăm Sóc Tại Nhà
              </h3>
              <div className="space-y-4 text-xs text-neutral-300 leading-relaxed font-light">
                {hairstyle.stylingTips && (
                  <div>
                    <h4 className="font-semibold text-white mb-1">Bí quyết sấy và tạo nếp:</h4>
                    <p>{hairstyle.stylingTips}</p>
                  </div>
                )}
                {hairstyle.careAdvice && (
                  <div>
                    <h4 className="font-semibold text-white mb-1">Lưu ý dưỡng tóc:</h4>
                    <p>{hairstyle.careAdvice}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar: Recommended Color Pairings & Linked Services */}
          <div className="lg:col-span-4 space-y-8">
            {/* Color Pairings */}
            <div className="p-6 rounded-2xl bg-salon-charcoal/60 border border-salon-gold/20 space-y-4">
              <h3 className="text-base font-serif font-bold text-white">
                Gợi Ý Màu Nhuộm Hợp Phom Tóc
              </h3>
              <div className="space-y-3">
                {recommendedColors.map((color: any) => (
                  <Link
                    key={color.id}
                    href={`/booking?hairstyleId=${hairstyle.id}&hairColorId=${color.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-salon-noir/80 border border-white/5 hover:border-salon-gold/40 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: color.hexCode || color.hexColor }}
                      />
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-salon-gold transition">
                          {color.name}
                        </div>
                        <span className="text-[10px] text-neutral-400">
                          {color.tone === 'COOL' ? 'Tông Lạnh' : color.tone === 'WARM' ? 'Tông Ấm' : 'Tông Tự Nhiên'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-salon-gold font-semibold">
                      Đặt nhuộm →
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Linked Services */}
            <div className="p-6 rounded-2xl bg-salon-charcoal/60 border border-salon-gold/20 space-y-4">
              <h3 className="text-base font-serif font-bold text-white">
                Dịch Vụ Đi Kèm Đề Xuất
              </h3>
              <div className="space-y-3">
                {matchedServices.map((srv: any) => (
                  <div
                    key={srv.id}
                    className="p-3.5 rounded-xl bg-salon-noir/80 border border-white/5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        {srv.title || srv.name}
                      </span>
                      <span className="text-xs text-salon-gold font-bold">
                        {formatVND(Number(srv.priceMin || srv.minPrice || 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-salon-gold" />
                        <span>{formatDuration(srv.durationMinutes || 45)}</span>
                      </span>
                      <Link
                        href={`/booking?serviceId=${srv.id}&hairstyleId=${hairstyle.id}`}
                        className="text-salon-gold hover:underline font-semibold"
                      >
                        Đặt dịch vụ
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Sticky Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-luxury border-t border-salon-gold/30 p-3 bg-salon-noir/95">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div>
            <span className="text-[10px] text-neutral-400 block">Từ</span>
            <span className="text-base font-bold text-salon-gold font-serif">
              {formatVND(price)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/booking?hairstyleId=${hairstyle.id}`}
              className="py-2.5 px-6 rounded-full bg-salon-gold text-salon-noir font-bold text-xs shadow-gold-glow flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Đặt Lịch Ngay</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
