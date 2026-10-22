'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone, Calendar, Sparkles } from 'lucide-react';
import { MobileDrawer } from './MobileDrawer';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface PublicHeaderProps {
  settings?: {
    brandName?: string;
    brandSlogan?: string;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    hotline?: string;
    hotlinePrimary?: string;
    address?: string;
    addressFull?: string;
    openingHours?: string;
  } | null;
}

export function PublicHeader({ settings }: PublicHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const brandName = settings?.brandName || 'Công Nguyễn Hair Salon';
  const logoUrl = settings?.logoUrl;
  const hotline = settings?.hotline || settings?.hotlinePrimary || '0988 888 888';
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Trang Chủ' },
    { href: '/hairstyles', label: 'Kiểu Tóc' },
    { href: '/colors', label: 'Bảng Màu' },
    { href: '/services', label: 'Dịch Vụ & Giá' },
    { href: '/location', label: 'Địa Chỉ' },
    { href: '/blog', label: 'Tạp Chí' },
  ];

  return (
    <>
      {/* Top Announcement & Quick Contact Bar (desktop) */}
      <div className="hidden lg:block bg-salon-noir/90 border-b border-salon-gold/15 text-xs text-salon-ivory/80 dark:text-neutral-300 py-1.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đang mở cửa: {openingHours}</span>
            </span>
            <span className="text-neutral-400 dark:text-neutral-500">|</span>
            <Link
              href="/location"
              className="truncate max-w-md hover:text-salon-gold transition-colors flex items-center gap-1"
              title="Xem bản đồ và chỉ đường tới salon"
            >
              <span>{address}</span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <a
              href={`tel:${hotline}`}
              className="flex items-center gap-1.5 text-salon-gold hover:text-salon-gold-hover font-medium transition"
            >
              <Phone className="w-3.5 h-3.5 text-salon-gold" />
              <span>Hotline đặt hẹn: {hotline}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Sticky Navigation Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'glass-luxury bg-salon-noir/95 shadow-luxury-dark py-2.5'
            : 'bg-salon-noir/85 backdrop-blur-md border-b border-salon-gold/15 py-3.5 sm:py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group">
            {logoUrl ? (
              <div
                className={`relative rounded-full overflow-hidden border-2 border-salon-gold/50 bg-salon-charcoal shadow-gold-glow group-hover:scale-105 transition-all duration-300 flex items-center justify-center shrink-0 ${
                  isScrolled
                    ? 'w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13'
                    : 'w-10 h-10 sm:w-13 sm:h-13 md:w-15 md:h-15 lg:w-[68px] lg:h-[68px]'
                }`}
              >
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            ) : (
              <div
                className={`rounded-full bg-gradient-to-tr from-salon-gold-dark via-salon-gold to-salon-gold-light flex items-center justify-center text-salon-noir font-serif font-black shadow-gold-glow group-hover:scale-105 transition-all duration-300 tracking-tighter shrink-0 ${
                  isScrolled
                    ? 'w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 text-sm'
                    : 'w-10 h-10 sm:w-13 sm:h-13 md:w-15 md:h-15 lg:w-[68px] lg:h-[68px] text-base sm:text-xl lg:text-2xl'
                }`}
              >
                {brandInitials}
              </div>
            )}
            <div className="flex flex-col">
              <span
                className={`font-serif font-bold gold-text-gradient tracking-wide leading-tight transition-all duration-300 ${
                  isScrolled
                    ? 'text-base sm:text-xl md:text-2xl'
                    : 'text-lg sm:text-2xl md:text-[25px]'
                }`}
              >
                {brandName}
              </span>
              <span className="text-[9px] sm:text-xs tracking-widest uppercase text-salon-ivory/60 dark:text-neutral-400 font-light mt-0.5">
                Hair Salon Nam & Nữ Hiện Đại
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm tracking-wide transition-all relative py-1 ${
                    isActive
                      ? 'text-salon-gold font-semibold'
                      : 'text-salon-ivory/80 dark:text-neutral-300 hover:text-salon-gold'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action CTA Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nút cấu hình phong cách trang Sáng / Tối */}
            <ThemeToggle />

            <Link
              href="/booking"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold hover:opacity-95 text-salon-noir font-bold text-xs sm:text-sm shadow-gold-glow transition hover:scale-102"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Đặt Lịch Ngay</span>
              <span className="sm:hidden">Đặt Lịch</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl lg:hidden text-neutral-300 hover:text-salon-gold hover:bg-white/5 transition"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        brandName={brandName}
        logoUrl={logoUrl}
        hotline={hotline}
        address={address}
        openingHours={openingHours}
      />
    </>
  );
}
