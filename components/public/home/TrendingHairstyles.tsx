'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { formatVND } from '@/lib/utils';

interface HairstyleItem {
  id: string;
  name: string;
  title?: string;
  slug: string;
  coverImageUrl?: string;
  gender: string;
  length: string;
  faceShape?: string;
  suitableFaces?: string[];
  careLevel?: string;
  careEffort?: string;
  price?: number;
  priceRefMin?: number;
  summary?: string | null;
  isTrending?: boolean;
}

interface TrendingHairstylesProps {
  hairstyles?: HairstyleItem[];
}

export function TrendingHairstyles({ hairstyles = [] }: TrendingHairstylesProps) {
  const [activeGender, setActiveGender] = useState<'ALL' | 'FEMALE' | 'MALE' | 'UNISEX'>('ALL');

  const filtered = hairstyles.filter((item) => {
    if (activeGender === 'ALL') return true;
    if (activeGender === 'UNISEX') return item.gender === 'UNISEX';
    return item.gender === activeGender || item.gender === 'UNISEX';
  });

  const tabs: Array<{ id: 'ALL' | 'FEMALE' | 'MALE' | 'UNISEX'; label: string }> = [
    { id: 'ALL', label: 'Tất Cả Xu Hướng' },
    { id: 'FEMALE', label: 'Dành Cho Nữ' },
    { id: 'MALE', label: 'Dành Cho Nam' },
    { id: 'UNISEX', label: 'Phong Cách Unisex' },
  ];

  return (
    <section className="py-16 md:py-24 bg-salon-charcoal/50 border-t border-b border-salon-gold/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <span className="inline-block px-4 py-1 rounded-full border border-salon-gold/30 bg-salon-gold/10 text-salon-gold-light text-xs font-semibold tracking-widest uppercase">
              Curated Masterpieces
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
              Kiểu Tóc <span className="gold-text-gradient">Thịnh Hành 2026</span>
            </h2>
            <p className="text-neutral-400 text-sm md:text-base font-light max-w-xl">
              Tuyển tập những mẫu tóc được yêu thích nhất tại Atelier, kết hợp kỹ thuật tỉa layer chuyển sắc và uốn sóng định hình.
            </p>
          </div>

          {/* Gender Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGender(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                  activeGender === tab.id
                    ? 'bg-salon-gold text-salon-noir shadow-gold-subtle'
                    : 'bg-salon-noir/60 text-neutral-300 hover:text-white border border-white/10 hover:border-salon-gold/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hairstyles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.slice(0, 8).map((style) => {
            const price = style.price || style.priceRefMin || 350000;
            const title = style.title || style.name;
            const image = style.coverImageUrl || '/images/default-hair.jpg';

            return (
              <div
                key={style.id}
                className="group rounded-2xl overflow-hidden bg-salon-charcoal border border-salon-gold/20 hover:border-salon-gold/60 transition-all duration-300 hover:shadow-gold-glow flex flex-col justify-between hover:-translate-y-1.5"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('${image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-salon-charcoal via-transparent to-transparent opacity-90" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-salon-noir/80 text-salon-gold-light border border-salon-gold/30 backdrop-blur-sm">
                      {style.gender === 'FEMALE' ? 'Nữ' : style.gender === 'MALE' ? 'Nam' : 'Unisex'}
                    </span>
                    {style.isTrending && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-salon-gold/20 text-salon-gold border border-salon-gold/40 backdrop-blur-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Hot</span>
                      </span>
                    )}
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-xs text-neutral-300">Giá tham khảo từ</span>
                    <div className="text-lg font-bold text-salon-gold font-serif">
                      {formatVND(price)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <Link href={`/hairstyles/${style.slug}`} className="hover:text-salon-gold transition">
                      <h3 className="font-serif font-bold text-lg text-white group-hover:text-salon-gold-light transition line-clamp-1">
                        {title}
                      </h3>
                    </Link>
                    {style.summary && (
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {style.summary}
                      </p>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <Link
                      href={`/booking?hairstyleId=${style.id}`}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-salon-gold hover:bg-salon-gold-hover text-salon-noir text-xs font-bold transition shadow-gold-subtle"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Đặt Lịch Ngay</span>
                    </Link>

                    <Link
                      href={`/hairstyles/${style.slug}`}
                      className="block text-center text-xs text-neutral-400 hover:text-salon-gold transition pt-1"
                    >
                      Xem chi tiết kiểu tóc →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All CTA */}
        <div className="text-center pt-12">
          <Link
            href="/hairstyles"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-salon-gold/50 text-salon-gold-light hover:bg-salon-gold/15 font-semibold text-sm transition"
          >
            <span>Khám Phá Toàn Bộ Thư Viện 50+ Kiểu Tóc</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
