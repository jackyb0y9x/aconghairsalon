import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  ExternalLink,
  Car,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface HomeLocationMapProps {
  settings?: {
    brandName?: string;
    address?: string;
    addressFull?: string;
    hotline?: string;
    hotlinePrimary?: string;
    hotlineSecondary?: string;
    googleMapsEmbedUrl?: string;
    openingHours?: any;
  } | null;
}

function extractEmbedSrc(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  const iframeSrcMatch = rawUrl.match(/src=["'](.*?)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    return iframeSrcMatch[1];
  }
  return rawUrl.trim();
}

const DEFAULT_MAP_URL =
  'https://maps.google.com/maps?q=20.785293,106.610434&hl=vi&z=18&output=embed';

export function HomeLocationMap({ settings }: HomeLocationMapProps) {
  const brandName = settings?.brandName || 'ACoong Hair Salon';
  const address =
    settings?.addressFull || settings?.address || 'Nguyệt Áng 3, Thái Sơn, An Lão, Hải Phòng';
  const hotline = settings?.hotlinePrimary || settings?.hotline || '0981438118';
  const rawHours =
    typeof settings?.openingHours === 'string'
      ? settings?.openingHours
      : settings?.openingHours?.rawText || '08:30 - 20:30 Hàng ngày';

  const embedMapUrl = extractEmbedSrc(settings?.googleMapsEmbedUrl) || DEFAULT_MAP_URL;
  const directionsUrl = 'https://www.google.com/maps/dir/?api=1&destination=20.785293,106.610434';

  return (
    <section className="py-14 sm:py-20 bg-salon-noir relative overflow-hidden border-t border-salon-gold/15">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-salon-gold/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10 sm:space-y-12">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-salon-gold/10 border border-salon-gold/30 text-salon-gold text-xs font-semibold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-salon-gold" />
            <span>Vị Trí & Bản Đồ Salon</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-salon-ivory dark:text-white tracking-tight">
            Ghé Thăm <span className="gold-text-gradient">{brandName}</span>
          </h2>

          <p className="text-sm sm:text-base text-salon-ivory/70 dark:text-neutral-400 font-light leading-relaxed">
            Không gian salon hiện đại, vị trí giao thông thuận tiện với bãi đỗ xe rộng rãi. Hãy ghé thăm để được tư vấn và định hình phong cách tóc hoàn hảo.
          </p>
        </div>

        {/* 2-Column Content Grid: Info & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Left Column: Salon Info Cards (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="bg-salon-charcoal/80 rounded-2xl border border-salon-gold/20 p-6 sm:p-7 shadow-luxury-dark space-y-5">
              <h3 className="font-serif font-bold text-lg sm:text-xl text-salon-ivory dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-salon-gold" />
                <span>Thông Tin Điểm Hẹn</span>
              </h3>

              <div className="space-y-4 text-xs sm:text-sm text-salon-ivory/80 dark:text-neutral-300">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-salon-gold/15 border border-salon-gold/30 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-salon-gold" />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-salon-gold font-semibold">
                      Địa Chỉ Salon
                    </span>
                    <span className="font-medium text-salon-ivory dark:text-white leading-relaxed">
                      {address}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-salon-gold/15 border border-salon-gold/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-salon-gold" />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-salon-gold font-semibold">
                      Giờ Mở Cửa Hoạt Động
                    </span>
                    <span className="font-medium text-salon-ivory dark:text-white">
                      {rawHours}
                    </span>
                    <span className="block text-[11px] text-emerald-400 mt-0.5">
                      • Phục vụ xuyên suốt tất cả các ngày trong tuần
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-salon-gold/15 border border-salon-gold/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4 text-salon-gold" />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-salon-gold font-semibold">
                      Hotline Tư Vấn & Hỗ Trợ
                    </span>
                    <a
                      href={`tel:${hotline}`}
                      className="font-bold text-salon-gold hover:underline text-sm sm:text-base"
                    >
                      {hotline}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-1 border-t border-salon-gold/10">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Car className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
                      Bãi Đỗ Xe An Toàn
                    </span>
                    <span className="text-xs text-salon-ivory/70 dark:text-neutral-400 leading-tight">
                      Có chỗ đỗ ô tô và xe máy rộng rãi ngay trước cửa, có nhân viên hỗ trợ dắt xe.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-salon-gold text-salon-noir font-bold text-xs sm:text-sm hover:bg-salon-gold-hover transition shadow-gold-subtle"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Chỉ Đường Đi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-salon-gold/40 bg-salon-gold/10 hover:bg-salon-gold/20 text-salon-gold font-semibold text-xs sm:text-sm transition"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Đặt Lịch Giữ Chỗ</span>
                </Link>
              </div>
            </div>

            {/* Quick Link to full Location page */}
            <div className="text-right pr-2">
              <Link
                href="/location"
                className="text-xs text-salon-gold hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Xem trang bản đồ toàn màn hình & chỉ dẫn chi tiết</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Right Column: Google Maps Iframe (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-salon-charcoal rounded-2xl border border-salon-gold/25 shadow-gold-glow overflow-hidden flex flex-col h-full min-h-[360px] sm:min-h-[420px]">
              {/* Map Bar Header */}
              <div className="p-3.5 sm:p-4 border-b border-salon-gold/15 bg-salon-noir/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-salon-ivory/90 dark:text-neutral-200 font-semibold truncate max-w-xs sm:max-w-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="truncate">{brandName} - {address}</span>
                </div>
                <span className="hidden sm:inline font-mono text-[11px] text-salon-gold bg-salon-gold/10 px-2 py-0.5 rounded border border-salon-gold/25">
                  20.785293, 106.610434
                </span>
              </div>

              {/* Map Iframe */}
              <div className="relative flex-1 w-full min-h-[340px] sm:min-h-[400px] bg-salon-noir">
                <iframe
                  src={embedMapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Google Maps ${brandName}`}
                  className="w-full h-full min-h-[340px] sm:min-h-[400px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
