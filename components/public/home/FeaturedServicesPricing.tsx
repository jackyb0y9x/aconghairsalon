'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Clock, ArrowRight, CheckCircle2, Flame, Scissors } from 'lucide-react';
import { formatPriceRange } from '@/lib/utils';

interface FeaturedServicesPricingProps {
  services: any[];
}

export function FeaturedServicesPricing({ services }: FeaturedServicesPricingProps) {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-salon-charcoal/40 border-t border-b border-salon-gold/15 relative overflow-hidden">
      {/* Decorative luxury gradient glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-salon-gold/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3.5">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-salon-gold" />
            <span>Bảng Giá Niêm Yết Minh Bạch</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
            Menu Dịch Vụ & <span className="gold-text-gradient">Bảng Giá Nổi Bật</span>
          </h2>
          <p className="text-neutral-300 text-sm md:text-base font-light leading-relaxed">
            Cam kết niêm yết giá công khai, sử dụng 100% dòng sản phẩm chính hãng cao cấp, tận tâm tư vấn và tuyệt đối không phát sinh phụ phí ẩn.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => {
            const priceDisplay = formatPriceRange(srv.priceMin, srv.priceMax);
            const categoryName = srv.categoryDetails?.name || srv.category?.name || srv.category || 'Dịch vụ tạo mẫu';

            return (
              <div
                key={srv.id}
                className="group relative rounded-2xl bg-salon-charcoal/90 border border-salon-gold/20 hover:border-salon-gold/60 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-gold-glow hover:-translate-y-1"
              >
                <div>
                  {/* Category & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-salon-gold/10 text-salon-gold border border-salon-gold/25">
                      {categoryName}
                    </span>
                    <div className="flex items-center gap-2">
                      {srv.isPopular && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>Hot</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-neutral-400 font-mono">
                        <Clock className="w-3.5 h-3.5 text-salon-gold/70" />
                        <span>{srv.durationMinutes || 45}p</span>
                      </span>
                    </div>
                  </div>

                  {/* Service Title */}
                  <h3 className="font-serif font-bold text-xl text-white group-hover:text-salon-gold-light transition-colors duration-200 mb-2">
                    {srv.title || srv.name}
                  </h3>

                  {/* Summary / Description */}
                  <p className="text-neutral-400 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4">
                    {srv.shortSummary || srv.description}
                  </p>
                </div>

                {/* Price & Action Footer */}
                <div className="pt-4 border-t border-white/10 mt-auto flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-neutral-400 block font-light">
                      Giá niêm yết
                    </span>
                    <span className="text-lg sm:text-xl font-bold font-mono gold-text-gradient">
                      {priceDisplay}
                    </span>
                  </div>

                  <Link
                    href={`/booking?service=${srv.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-salon-gold text-salon-noir font-semibold text-xs hover:bg-salon-gold-light transition-all shadow-md shadow-salon-gold/10 shrink-0"
                  >
                    <span>Đặt lịch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Pricing CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-salon-gold/40 text-salon-gold-light hover:bg-salon-gold/10 hover:border-salon-gold font-semibold text-sm transition-all duration-300 shadow-md"
          >
            <span>Xem Toàn Bộ Menu Dịch Vụ & Combo Bảng Giá</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
