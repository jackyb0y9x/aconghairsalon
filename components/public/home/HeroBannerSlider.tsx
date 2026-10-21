'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';

interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  ctaLink?: string | null;
  ctaText?: string;
}

interface HeroBannerSliderProps {
  banners?: BannerItem[];
}

export function HeroBannerSlider({ banners = [] }: HeroBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeBanners = banners.length > 0 ? banners : [
    {
      id: 'default-1',
      title: 'Định Hình Khí Chất — Tỏa Sáng Phong Cách',
      subtitle: 'Trải nghiệm dịch vụ tạo mẫu tóc cao cấp chuẩn Haute Coiffure kết hợp công nghệ thử tóc AI trực quan.',
      badgeText: 'BỘ SƯU TẬP 2026',
      imageUrl: '/images/banners/hero-banner-bloganchoi-1.jpg',
      linkUrl: '/hairstyles',
      ctaText: 'Khám phá kiểu tóc',
    },
  ];

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const currentBanner = activeBanners[currentIndex];

  return (
    <section
      className="relative w-full h-[600px] md:h-[700px] lg:h-[780px] overflow-hidden bg-black hero-banner-slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images with crossfade */}
      {activeBanners.map((banner, idx) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background image */}
          <div
            className="w-full h-full bg-cover bg-center transform transition-transform duration-7000 ease-out scale-105"
            style={{ backgroundImage: `url('${banner.imageUrl}')` }}
          />

          {/* Cinematic dark scrim overlay ensuring text legibility in both light & dark themes */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-salon-noir to-transparent pointer-events-none" />
        </div>
      ))}

      {/* Foreground Content */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-2xl space-y-6">
          {/* Badge */}
          {currentBanner.badgeText && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/60 bg-amber-400/20 text-amber-200 text-xs font-bold tracking-widest uppercase shadow-gold-subtle backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-amber-200 font-bold">{currentBanner.badgeText}</span>
            </div>
          )}

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-extrabold tracking-tight leading-tight">
            <span className="hero-banner-title text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FFF5DB] to-[#FDE047] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              {currentBanner.title}
            </span>
          </h1>

          {/* Subtitle */}
          {currentBanner.subtitle && (
            <p className="hero-banner-subtitle text-base sm:text-lg lg:text-xl text-white font-normal leading-relaxed max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {currentBanner.subtitle}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold text-slate-950 font-bold text-sm sm:text-base hover:opacity-95 shadow-gold-glow transition transform hover:scale-105"
            >
              <Calendar className="w-4.5 h-4.5 text-slate-950" />
              <span className="text-slate-950">Đặt Lịch Hẹn Ngay</span>
            </Link>

            <Link
              href={currentBanner.linkUrl || currentBanner.ctaLink || '/hairstyles'}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/40 hover:border-amber-300/60 bg-white/10 hover:bg-white/20 text-white hover:text-amber-200 font-semibold text-sm sm:text-base transition backdrop-blur-md"
            >
              <span>{currentBanner.ctaText || 'Khám Phá Kiểu Tóc'}</span>
              <ChevronRight className="w-4 h-4 text-amber-300" />
            </Link>
          </div>
        </div>
      </div>

      {/* Left / Right Nav Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 hover:bg-salon-gold/30 text-white hover:text-salon-gold border border-white/20 hover:border-salon-gold/50 backdrop-blur-md transition"
            aria-label="Banner trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/60 hover:bg-salon-gold/30 text-white hover:text-salon-gold border border-white/20 hover:border-salon-gold/50 backdrop-blur-md transition"
            aria-label="Banner kế tiếp"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Dots Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? 'w-8 h-2 bg-gradient-to-r from-salon-gold to-salon-gold-light'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/80'
                }`}
                aria-label={`Chuyển tới slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
