import React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export function DualCtaSection() {
  return (
    <section className="py-16 md:py-24 bg-salon-noir relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Hairstyle & Hair Color Catalog */}
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-10 bg-gradient-to-br from-salon-charcoal via-salon-charcoal/90 to-salon-noir border border-salon-gold/30 shadow-luxury-dark flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-salon-gold/40 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-salon-gold" />
                <span>Bộ Sưu Tập Thịnh Hành</span>
              </div>

              <h3 className="font-serif font-bold text-2xl sm:text-3xl text-white leading-tight">
                Thư Viện Kiểu Tóc & <span className="gold-text-gradient">Bảng Màu Tôn Da</span>
              </h3>

              <p className="text-neutral-300 text-sm font-light leading-relaxed">
                Khám phá 50+ kiểu tóc Nam & Nữ thời thượng cùng bảng màu nhuộm cao cấp không amoniac, tôn vinh làn da và đường nét khuôn mặt của bạn.
              </p>

              <div className="flex items-center gap-4 text-xs text-neutral-400 pt-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Chuẩn mẫu Châu Á</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-salon-gold" />
                  <span>Tư vấn trực tiếp</span>
                </span>
              </div>
            </div>

            <div>
              <Link
                href="/hairstyles"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-salon-gold/20 hover:bg-salon-gold text-salon-gold-light hover:text-salon-noir font-bold text-sm border border-salon-gold/40 hover:border-salon-gold transition shadow-gold-subtle"
              >
                <span>Khám Phá Kiểu Tóc</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: 5-Step Online Booking */}
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-10 bg-gradient-to-br from-salon-noir via-salon-charcoal/90 to-salon-charcoal border border-salon-gold/40 shadow-gold-glow flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-salon-gold/40 bg-salon-gold/15 text-salon-gold-light text-xs font-semibold tracking-wider uppercase">
                <Calendar className="w-3.5 h-3.5 text-salon-gold" />
                <span>Đặt Hẹn Trực Tuyến 24/7</span>
              </div>

              <h3 className="font-serif font-bold text-2xl sm:text-3xl text-white leading-tight">
                Khởi Đầu Hành Trình <span className="gold-text-gradient">Định Hình Khí Chất</span>
              </h3>

              <p className="text-neutral-300 text-sm font-light leading-relaxed">
                Chủ động lựa chọn dịch vụ và khung giờ mong muốn chỉ trong 60 giây. Salon cam kết giữ chỗ đúng hẹn và không bắt quý khách phải chờ đợi.
              </p>

              <div className="flex items-center gap-4 text-xs text-neutral-400 pt-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-salon-gold" />
                  <span>Bảo hành form 7 ngày</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-salon-gold" />
                  <span>Bảng giá minh bạch</span>
                </span>
              </div>
            </div>

            <div>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-salon-noir font-bold text-sm hover:opacity-95 shadow-gold-glow transition transform hover:scale-102"
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt Lịch Hẹn Ngay</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
