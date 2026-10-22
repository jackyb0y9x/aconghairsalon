import React from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface PublicFooterProps {
  settings?: {
    brandName?: string;
    brandSlogan?: string;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    hotline?: string;
    hotlinePrimary?: string;
    hotlineSecondary?: string;
    emailContact?: string;
    address?: string;
    addressFull?: string;
    googleMapsEmbedUrl?: string;
    openingHours?: string;
    socialFacebook?: string;
    socialInstagram?: string;
    socialTikTok?: string;
    socialZalo?: string;
    footerContent?: {
      copyright?: string;
      licenseText?: string;
      taxCode?: string;
    };
  } | null;
}

export function PublicFooter({ settings }: PublicFooterProps) {
  const brandName = settings?.brandName || 'Công Nguyễn Hair Salon';
  const logoUrl = settings?.logoUrl;
  const slogan = settings?.brandSlogan || 'Định Hình Phong Cách — Tỏa Sáng Khí Chất';
  const hotline = settings?.hotline || settings?.hotlinePrimary || '0988 888 888';
  const hotlineSecondary = settings?.hotlineSecondary || '0988 888 888';
  const email = settings?.emailContact || 'contact@congnguyenhairsalon.vn';
  const address = settings?.address || settings?.addressFull || 'Nguyệt Áng 3, An Khánh, Hải Phòng';
  const openingHours = settings?.openingHours || '08:30 - 20:30 Hàng ngày';

  const brandInitials = brandName
    ? brandName
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CN';

  return (
    <footer className="bg-salon-noir border-t border-salon-gold/20 text-salon-ivory/80 dark:text-neutral-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-12 border-b border-salon-gold/15">
          {/* Column 1: Brand Atelier */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              {logoUrl ? (
                <div className="relative w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-salon-gold/50 bg-salon-charcoal shadow-gold-glow flex items-center justify-center shrink-0">
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-salon-gold-dark via-salon-gold to-salon-gold-light flex items-center justify-center text-salon-noir font-serif font-black text-base sm:text-xl shadow-gold-glow tracking-tighter shrink-0">
                  {brandInitials}
                </div>
              )}
              <div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl gold-text-gradient tracking-wide">
                  {brandName}
                </h3>
                <p className="text-[11px] tracking-widest uppercase text-salon-ivory/60 dark:text-neutral-400 mt-0.5">
                  Hair Salon Nam & Nữ Hiện Đại
                </p>
              </div>
            </div>

            <p className="text-sm italic text-salon-gold/80 font-serif">
              &ldquo;{slogan}&rdquo;
            </p>

            <p className="text-xs text-salon-ivory/70 dark:text-neutral-400 leading-relaxed font-light">
              Không gian nghệ thuật tạo mẫu tóc cao cấp kết hợp kỹ thuật cắt hình khối điêu luyện và công nghệ mô phỏng kiểu tóc trực quan AI.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-salon-gold/10 text-salon-gold text-xs font-medium border border-salon-gold/30">
                <Award className="w-3.5 h-3.5" />
                <span>Top Salon Uy Tín</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bảo Hành 7 Ngày</span>
              </span>
            </div>
          </div>

          {/* Column 2: Exploration Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-salon-gold-light border-b border-salon-gold/20 pb-2">
              Khám Phá & Trải Nghiệm
            </h4>
            <ul className="space-y-2 text-sm font-light">
              <li>
                <Link href="/hairstyles" className="hover:text-salon-gold transition flex items-center gap-1.5">
                  <span>Thư viện kiểu tóc Nam & Nữ</span>
                </Link>
              </li>
              <li>
                <Link href="/colors" className="hover:text-salon-gold transition flex items-center gap-1.5">
                  <span>Bảng màu nhuộm & Tư vấn tone da</span>
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-salon-gold transition flex items-center gap-1.5">
                  <span>Bảng giá dịch vụ</span>
                </Link>
              </li>
              <li>
                <Link href="/location" className="hover:text-salon-gold transition flex items-center gap-1.5">
                  <span>Địa chỉ & Bản đồ Google Maps</span>
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-salon-gold transition flex items-center gap-1.5">
                  <span>Tạp chí & Cẩm nang chăm sóc</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Featured Services */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-salon-gold-light border-b border-salon-gold/20 pb-2">
              Dịch Vụ Trọng Tâm
            </h4>
            <ul className="space-y-2 text-sm font-light text-salon-ivory/70 dark:text-neutral-400">
              <li>• Cắt tạo kiểu chuyên nghiệp (Layer, Wolf Cut, Side Part)</li>
              <li>• Uốn sóng lơi Hàn Quốc & Nhật Bản</li>
              <li>• Nhuộm Balayage & Tẩy liên kết Olaplex</li>
              <li>• Phục hồi cấu trúc Nano Keratin chuyên sâu</li>
              <li>• Dịch vụ Quý Ông & Gội dưỡng sinh</li>
              <li>• Combo VIP trọn gói tiết kiệm 25%</li>
            </ul>
          </div>

          {/* Column 4: Contact & Location */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-salon-gold-light border-b border-salon-gold/20 pb-2">
              Liên Hệ & Đặt Lịch
            </h4>
            <div className="space-y-2.5 text-xs text-salon-ivory/80 dark:text-neutral-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-salon-gold mt-0.5 flex-shrink-0" />
                <Link
                  href="/location"
                  className="leading-relaxed hover:text-salon-gold transition-colors"
                  title="Xem bản đồ chỉ đường"
                >
                  {address}
                </Link>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-salon-gold flex-shrink-0" />
                <div>
                  <a href={`tel:${hotline}`} className="hover:text-salon-gold font-semibold transition">
                    {hotline}
                  </a>
                  {hotlineSecondary && (
                    <span className="text-neutral-400"> / {hotlineSecondary}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-salon-gold flex-shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-salon-gold transition">
                  {email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-salon-gold flex-shrink-0" />
                <span>{openingHours}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=20.785293,106.610434"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-full border border-salon-gold/30 bg-salon-gold/10 hover:bg-salon-gold/20 text-salon-gold font-medium text-xs transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Chỉ Đường Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <Link
                href="/booking"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-full bg-salon-gold text-salon-noir font-bold text-xs hover:bg-salon-gold-hover transition shadow-gold-subtle"
              >
                Đặt Lịch Ngay Hôm Nay
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Admin CMS Shortcut */}
        <div className="pt-6 flex items-center justify-end text-xs text-neutral-500">
          <Link
            href="/admin/login"
            className="hover:text-salon-gold transition flex items-center gap-1.5 opacity-60 hover:opacity-100"
          >
            <span>Hệ Thống Quản Trị</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
