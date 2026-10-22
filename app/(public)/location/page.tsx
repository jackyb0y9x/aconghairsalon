import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  Calendar,
  Navigation,
  ExternalLink,
  Car,
  ShieldCheck,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { getPublicSiteSettings } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const brandName = settings?.brandName || 'Công Nguyễn Hair Salon';
  const address = settings?.addressFull || settings?.address || 'Nguyệt Áng 3, An Khánh, Hải Phòng';

  return {
    title: `Địa Chỉ & Bản Đồ Chỉ Đường | ${brandName}`,
    description: `Xem vị trí, bản đồ Google Maps và hướng dẫn chỉ đường đến ${brandName} tại ${address}. Không gian sang trọng, bãi đỗ xe thuận tiện.`,
    openGraph: {
      title: `Địa Chỉ & Bản Đồ | ${brandName}`,
      description: `Bản đồ chỉ đường tới ${brandName} - ${address}`,
      images: ['/images/og-default.jpg'],
    },
  };
}

function extractEmbedSrc(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  const iframeSrcMatch = rawUrl.match(/src=["'](.*?)["']/);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    return iframeSrcMatch[1];
  }
  return rawUrl.trim();
}

const DEFAULT_MAP_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d479.93252252100655!2d106.61087903989699!3d20.78488568895623!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314a76dcf205a86d%3A0xf613dd1e2cbc6902!2zTmd1eeG7h3QgQW5nLCBUaMOhaSBTxqFuLCBBbiBMw6NvLCBI4bqjaSBQaMOybmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1792572457657!5m2!1svi!2s';

export default async function LocationPage() {
  const settings = await getPublicSiteSettings();

  const brandName = settings?.brandName || 'Công Nguyễn Hair Salon';
  const address = settings?.addressFull || settings?.address || 'Nguyệt Áng 3, Thái Sơn, An Lão, Hải Phòng';
  const hotline = settings?.hotlinePrimary || settings?.hotline || '0988 888 888';
  const hotlineSecondary = settings?.hotlineSecondary;
  const email = settings?.emailContact || 'contact@congnguyenhairsalon.vn';
  const openingHours = settings?.openingHours || '08:30 - 20:30 Hàng ngày';

  const embedMapUrl = extractEmbedSrc(settings?.googleMapsEmbedUrl) || DEFAULT_MAP_URL;

  // Link chỉ đường trực tiếp trên Google Maps
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${brandName}, ${address}`
  )}`;

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-salon-noir transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-salon-ivory/60 dark:text-neutral-400">
          <Link href="/" className="hover:text-salon-gold transition-colors">
            Trang Chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-salon-gold font-medium">Địa Chỉ & Bản Đồ</span>
        </nav>

        {/* Hero Title Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-salon-gold/10 border border-salon-gold/30 text-salon-gold text-xs font-semibold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Vị Trí & Tọa Độ Salon</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-salon-ivory dark:text-white tracking-tight">
            Địa Chỉ & Bản Đồ Chỉ Đường
          </h1>

          <p className="text-sm sm:text-base text-salon-ivory/70 dark:text-neutral-400 leading-relaxed font-light">
            Chào mừng bạn đến với <span className="font-semibold text-salon-gold">{brandName}</span>. Tọa lạc tại vị trí trung tâm thuận tiện, bãi đỗ xe ô tô và xe máy rộng rãi, đội ngũ Stylist luôn sẵn sàng phục vụ bạn.
          </p>
        </div>

        {/* Main Map Box & Direct Navigation Actions */}
        <div className="bg-salon-charcoal rounded-2xl border border-salon-gold/25 shadow-xl overflow-hidden transition-all duration-300 hover:border-salon-gold/40">
          {/* Top Bar above Map */}
          <div className="p-4 sm:p-5 border-b border-salon-gold/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-salon-noir/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-salon-gold/15 text-salon-gold flex items-center justify-center border border-salon-gold/30 shrink-0">
                <Navigation className="w-5 h-5 text-salon-gold" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-salon-ivory dark:text-white">
                  Bản Đồ Vệ Tinh & Chỉ Đường Google Maps
                </h2>
                <p className="text-xs text-salon-ivory/60 dark:text-neutral-400 truncate max-w-xs sm:max-w-md">
                  {address}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-salon-gold text-salon-noir font-bold text-xs sm:text-sm hover:bg-salon-gold-hover transition shadow-gold-subtle hover:scale-102"
              >
                <Navigation className="w-4 h-4" />
                <span>Chỉ Đường Đi</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={`tel:${hotline}`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-salon-gold/30 bg-salon-charcoal hover:bg-salon-gold/10 text-salon-gold font-semibold text-xs sm:text-sm transition hover:scale-102"
                title={`Gọi hotline: ${hotline}`}
              >
                <Phone className="w-4 h-4" />
                <span className="hidden md:inline">Hotline</span>
              </a>
            </div>
          </div>

          {/* Interactive Google Maps Iframe */}
          <div className="relative w-full h-[380px] sm:h-[460px] md:h-[540px] bg-salon-noir">
            <iframe
              src={embedMapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Bản đồ ${brandName}`}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* 4 Detail Cards: Thông tin liên hệ & Hướng dẫn di chuyển */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Địa chỉ */}
          <div className="p-6 rounded-2xl bg-salon-charcoal border border-salon-gold/20 shadow-sm space-y-3 hover:border-salon-gold/40 transition">
            <div className="w-10 h-10 rounded-xl bg-salon-gold/10 text-salon-gold flex items-center justify-center border border-salon-gold/20">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-salon-ivory dark:text-white">Địa Chỉ Salon</h3>
            <p className="text-xs sm:text-sm text-salon-ivory/70 dark:text-neutral-400 leading-relaxed">
              {address}
            </p>
            <p className="text-[11px] text-salon-gold font-medium pt-1">
              • Mặt đường lớn, biển hiệu nhận diện sang trọng
            </p>
          </div>

          {/* Card 2: Giờ mở cửa */}
          <div className="p-6 rounded-2xl bg-salon-charcoal border border-salon-gold/20 shadow-sm space-y-3 hover:border-salon-gold/40 transition">
            <div className="w-10 h-10 rounded-xl bg-salon-gold/10 text-salon-gold flex items-center justify-center border border-salon-gold/20">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-salon-ivory dark:text-white">Thời Gian Làm Việc</h3>
            <p className="text-xs sm:text-sm text-salon-ivory/70 dark:text-neutral-400 leading-relaxed">
              {openingHours}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium pt-1">
              • Mở cửa tất cả các ngày trong tuần (kể cả lễ tết)
            </p>
          </div>

          {/* Card 3: Hotline & Đặt hẹn */}
          <div className="p-6 rounded-2xl bg-salon-charcoal border border-salon-gold/20 shadow-sm space-y-3 hover:border-salon-gold/40 transition">
            <div className="w-10 h-10 rounded-xl bg-salon-gold/10 text-salon-gold flex items-center justify-center border border-salon-gold/20">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-salon-ivory dark:text-white">Hotline Đặt Hẹn</h3>
            <p className="text-xs sm:text-sm text-salon-ivory/70 dark:text-neutral-400">
              <a href={`tel:${hotline}`} className="font-bold text-salon-gold hover:underline text-base">
                {hotline}
              </a>
              {hotlineSecondary && (
                <span className="block text-xs text-neutral-400 mt-0.5">
                  Hotline 2: {hotlineSecondary}
                </span>
              )}
            </p>
            <p className="text-[11px] text-salon-gold font-medium pt-1">
              • Hỗ trợ tư vấn dáng tóc & báo giá trước
            </p>
          </div>

          {/* Card 4: Tiện ích bãi đỗ xe */}
          <div className="p-6 rounded-2xl bg-salon-charcoal border border-salon-gold/20 shadow-sm space-y-3 hover:border-salon-gold/40 transition">
            <div className="w-10 h-10 rounded-xl bg-salon-gold/10 text-salon-gold flex items-center justify-center border border-salon-gold/20">
              <Car className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-salon-ivory dark:text-white">Bãi Đỗ Xe Tiện Lợi</h3>
            <p className="text-xs sm:text-sm text-salon-ivory/70 dark:text-neutral-400 leading-relaxed">
              Khuôn viên có chỗ đỗ xe máy và ô tô rộng rãi, an toàn tuyệt đối và hoàn toàn miễn phí.
            </p>
            <p className="text-[11px] text-emerald-400 font-medium pt-1">
              • Có bảo vệ hỗ trợ hướng dẫn và trông xe
            </p>
          </div>
        </div>

        {/* Bottom CTA Card: Đặt hẹn trực tuyến */}
        <div className="p-6 sm:p-10 rounded-2xl bg-gradient-to-br from-salon-charcoal via-salon-noir to-salon-charcoal border border-salon-gold/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs text-salon-gold uppercase font-bold tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trải Nghiệm Dịch Vụ Chuẩn Salon Cao Cấp</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-salon-ivory dark:text-white">
              Sẵn Sàng Làm Mới Phong Cách Cùng Công Nguyễn?
            </h3>
            <p className="text-xs sm:text-sm text-salon-ivory/70 dark:text-neutral-400 max-w-xl font-light">
              Đặt lịch trước chỉ mất 1 phút để giữ chỗ VIP cùng Stylist yêu thích, không cần chờ đợi khi ghé salon.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Link
              href="/booking"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-sm shadow-gold-glow hover:opacity-95 transition hover:scale-102"
            >
              <Calendar className="w-4 h-4" />
              <span>Đặt Lịch Hẹn Ngay</span>
            </Link>

            <a
              href={`tel:${hotline}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-salon-gold/40 text-salon-ivory hover:text-salon-gold hover:bg-salon-gold/10 font-semibold text-sm transition"
            >
              <Phone className="w-4 h-4 text-salon-gold" />
              <span>Gọi {hotline}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
