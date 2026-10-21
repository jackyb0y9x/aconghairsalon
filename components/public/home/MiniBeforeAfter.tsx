'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, ArrowRight, User } from 'lucide-react';
import { BeforeAfterSlider } from '../BeforeAfterSlider';

interface BeforeAfterItem {
  id: string;
  title: string;
  description?: string | null;
  beforeImageUrl: string;
  afterImageUrl: string;
  customerGender?: string;
  service?: { id: string; title: string; slug?: string } | null;
  hairstyle?: { id: string; title: string; slug?: string } | null;
  stylist?: { id: string; fullName: string; avatarUrl?: string } | null;
}

interface MiniBeforeAfterProps {
  items?: BeforeAfterItem[];
}

export function MiniBeforeAfter({ items = [] }: MiniBeforeAfterProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;
  const current = items[activeIndex] || items[0];

  return (
    <section className="py-16 md:py-24 bg-salon-noir relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="inline-block px-4 py-1 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold tracking-widest uppercase">
            Real Transformations
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
            Nghệ Thuật <span className="gold-text-gradient">Biến Hóa Diện Mạo</span>
          </h2>
          <p className="text-neutral-400 text-sm md:text-base font-light">
            Kéo thanh trượt để so sánh kết quả thực tế trước và sau khi được tạo tác bởi các Stylist hàng đầu tại Công Nguyễn Hair Salon.
          </p>
        </div>

        {/* Interactive Showcase Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-salon-charcoal/80 rounded-3xl p-6 sm:p-8 lg:p-10 border border-salon-gold/20 shadow-luxury-dark">
          {/* Left: Drag Handle Slider (7 cols) */}
          <div className="lg:col-span-7 aspect-[4/3] sm:aspect-[16/11]">
            <BeforeAfterSlider
              beforeImageUrl={current.beforeImageUrl}
              afterImageUrl={current.afterImageUrl}
              beforeAlt="Hình ảnh trước khi làm"
              afterAlt="Hình ảnh sau khi làm"
              initialPosition={50}
              className="w-full h-full"
            />
          </div>

          {/* Right: Narrative Details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Thumbnail Selectors if multiple */}
            {items.length > 1 && (
              <div className="flex items-center gap-2 pb-2">
                {items.map((it, idx) => (
                  <button
                    key={it.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      idx === activeIndex
                        ? 'bg-salon-gold text-salon-noir'
                        : 'bg-salon-noir/60 text-neutral-400 hover:text-white border border-white/10'
                    }`}
                  >
                    Ca biến hóa #{idx + 1}
                  </button>
                ))}
              </div>
            )}

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-salon-gold/15 text-salon-gold-light border border-salon-gold/30 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{current.service?.title || 'Dịch Vụ Tạo Kiểu Master'}</span>
              </span>

              <h3 className="font-serif font-bold text-2xl text-white leading-snug">
                {current.title}
              </h3>

              {current.description && (
                <p className="text-neutral-300 text-sm leading-relaxed mt-3 font-light">
                  {current.description}
                </p>
              )}
            </div>

            {/* Stylist Attribution */}
            {current.stylist && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-salon-noir/60 border border-salon-gold/15">
                {current.stylist.avatarUrl ? (
                  <img
                    src={current.stylist.avatarUrl}
                    alt={current.stylist.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-salon-gold/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-salon-gold/20 flex items-center justify-center text-salon-gold">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="text-xs text-neutral-400">Chuyên gia thực hiện:</div>
                  <div className="text-sm font-semibold text-white">
                    Master {current.stylist.fullName}
                  </div>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                href={`/booking?serviceId=${current.service?.id || ''}&hairstyleId=${current.hairstyle?.id || ''}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-salon-gold hover:bg-salon-gold-hover text-salon-noir font-bold text-sm shadow-gold-glow transition"
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt Lịch Biến Hóa</span>
              </Link>

              <Link
                href="/before-after"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-salon-gold/40 text-salon-gold-light hover:bg-salon-gold/10 font-semibold text-sm transition"
              >
                <span>Xem tất cả bộ sưu tập</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
