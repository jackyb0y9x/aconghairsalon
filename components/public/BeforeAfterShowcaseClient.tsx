'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, User, ShieldCheck, Award, Heart } from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';

export interface BeforeAfterItem {
  id: string;
  title: string;
  description?: string | null;
  beforeImageUrl: string;
  afterImageUrl: string;
  customerGender?: string;
  serviceId?: string | null;
  service?: { id: string; title: string; slug?: string } | null;
  hairstyleId?: string | null;
  hairstyle?: { id: string; title: string; slug?: string } | null;
  stylistId?: string | null;
  stylist?: { id: string; fullName: string; avatarUrl?: string | null } | null;
}

interface BeforeAfterShowcaseClientProps {
  initialItems: BeforeAfterItem[];
}

export function BeforeAfterShowcaseClient({
  initialItems,
}: BeforeAfterShowcaseClientProps) {
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'FEMALE' | 'MALE'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      if (selectedGender !== 'ALL' && item.customerGender !== selectedGender && item.customerGender !== 'UNISEX') {
        return false;
      }
      return true;
    });
  }, [initialItems, selectedGender, selectedCategory]);

  return (
    <div className="space-y-12">
      {/* Trust Proof Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <div className="p-4 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 flex flex-col items-center text-center space-y-1">
          <Award className="w-6 h-6 text-salon-gold mb-1" />
          <span className="text-xl md:text-2xl font-serif font-bold text-white">10.000+</span>
          <span className="text-xs text-neutral-400">Khách hàng biến hóa</span>
        </div>

        <div className="p-4 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 flex flex-col items-center text-center space-y-1">
          <ShieldCheck className="w-6 h-6 text-salon-gold mb-1" />
          <span className="text-xl md:text-2xl font-serif font-bold text-white">100%</span>
          <span className="text-xs text-neutral-400">Hình ảnh thực tế tại salon</span>
        </div>

        <div className="p-4 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 flex flex-col items-center text-center space-y-1">
          <Sparkles className="w-6 h-6 text-salon-gold mb-1" />
          <span className="text-xl md:text-2xl font-serif font-bold text-white">7 Ngày</span>
          <span className="text-xs text-neutral-400">Bảo hành chỉnh form miễn phí</span>
        </div>

        <div className="p-4 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20 flex flex-col items-center text-center space-y-1">
          <Heart className="w-6 h-6 text-salon-gold mb-1" />
          <span className="text-xl md:text-2xl font-serif font-bold text-white">4.9 / 5</span>
          <span className="text-xs text-neutral-400">Đánh giá độ hài lòng</span>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-salon-charcoal/80 border border-salon-gold/20">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-salon-gold uppercase tracking-wider mr-2">
            Đối tượng:
          </span>
          {[
            { id: 'ALL', label: 'Tất Cả Biến Hóa' },
            { id: 'FEMALE', label: 'Khách Hàng Nữ' },
            { id: 'MALE', label: 'Khách Hàng Nam' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedGender(tab.id as any)}
              className={`py-2 px-4 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                selectedGender === tab.id
                  ? 'bg-salon-gold text-salon-noir shadow-gold-subtle'
                  : 'bg-salon-noir text-neutral-300 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-neutral-400 self-end sm:self-auto">
          Hiển thị <strong className="text-salon-gold-light">{filteredItems.length}</strong> ca biến hóa
        </span>
      </div>

      {/* Transformations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl overflow-hidden bg-salon-charcoal border border-salon-gold/20 hover:border-salon-gold/50 transition-all duration-300 shadow-luxury-dark flex flex-col justify-between p-6 space-y-6"
          >
            {/* Interactive Split Slider */}
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <BeforeAfterSlider
                beforeImageUrl={item.beforeImageUrl}
                afterImageUrl={item.afterImageUrl}
                beforeAlt={`${item.title} - Trước`}
                afterAlt={`${item.title} - Sau`}
                initialPosition={50}
                className="w-full h-full"
              />
            </div>

            {/* Content & Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-salon-gold/15 text-salon-gold-light border border-salon-gold/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{item.service?.title || 'Dịch Vụ Tạo Kiểu Master'}</span>
                </span>

                <h3 className="font-serif font-bold text-xl text-white leading-snug">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-xs text-neutral-300 font-light leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Stylist Chip */}
              {item.stylist && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-salon-noir/80 border border-white/5">
                  {item.stylist.avatarUrl ? (
                    <img
                      src={item.stylist.avatarUrl}
                      alt={item.stylist.fullName}
                      className="w-9 h-9 rounded-full object-cover border border-salon-gold/30"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-salon-gold/20 flex items-center justify-center text-salon-gold">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Thực hiện bởi:</span>
                    <span className="text-xs font-semibold text-white">
                      Master {item.stylist.fullName}
                    </span>
                  </div>
                </div>
              )}

              {/* Booking CTA */}
              <div className="pt-2 border-t border-white/5">
                <Link
                  href={`/booking?serviceId=${item.service?.id || ''}&hairstyleId=${item.hairstyle?.id || ''}&stylistId=${item.stylist?.id || ''}`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold hover:opacity-95 text-salon-noir font-bold text-xs shadow-gold-subtle transition"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Đặt Lịch Biến Hóa Giống Mẫu Này</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
