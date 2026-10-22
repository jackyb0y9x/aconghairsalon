'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Home,
  Scissors,
  Palette,
  Sparkles,
  Layers,
  BookOpen,
  Calendar,
  Phone,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  brandName?: string;
  logoUrl?: string | null;
  hotline?: string;
  address?: string;
  openingHours?: string;
}

export function MobileDrawer({
  isOpen,
  onClose,
  brandName = 'Công Nguyễn Hair Salon',
  logoUrl,
  hotline = '0988 888 888',
  address = 'Nguyệt Áng 3, An Khánh, Hải Phòng',
  openingHours = '08:30 - 20:30 Hàng ngày',
}: MobileDrawerProps) {
  const pathname = usePathname();

  const brandInitials = brandName
    ? brandName
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CN';

  // Close drawer when pathname changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const navLinks: Array<{ href: string; label: string; icon: any; highlight?: boolean }> = [
    { href: '/', label: 'Trang Chủ', icon: Home },
    { href: '/hairstyles', label: 'Thư Viện Kiểu Tóc', icon: Scissors },
    { href: '/colors', label: 'Bảng Màu & Tư Vấn', icon: Palette },
    { href: '/services', label: 'Dịch Vụ & Giá', icon: Layers },
    { href: '/location', label: 'Địa Chỉ & Bản Đồ', icon: MapPin },
    { href: '/blog', label: 'Tạp Chí Làm Đẹp', icon: BookOpen },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="relative z-10 w-full max-w-sm bg-salon-charcoal border-l border-salon-gold/20 h-full flex flex-col shadow-2xl p-6 overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-5 border-b border-salon-gold/15">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            {logoUrl ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-salon-gold/50 bg-salon-charcoal shadow-gold-glow flex items-center justify-center shrink-0">
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            ) : (
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-salon-gold-light to-salon-gold flex items-center justify-center text-salon-noir font-serif font-bold text-sm shadow-gold-glow tracking-tighter shrink-0">
                {brandInitials}
              </span>
            )}
            <div className="flex flex-col">
              <span className="font-serif font-bold text-base gold-text-gradient tracking-wide leading-tight">
                {brandName}
              </span>
              <span className="text-[9px] tracking-widest uppercase text-salon-ivory/60 dark:text-neutral-400">
                Hair Salon Nam & Nữ
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-salon-ivory/70 hover:text-salon-gold dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
              aria-label="Đóng menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 py-6 space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition ${
                  isActive
                    ? 'bg-salon-gold/15 text-salon-gold font-semibold border border-salon-gold/30'
                    : 'text-salon-ivory/80 hover:text-salon-gold dark:text-neutral-300 dark:hover:text-white hover:bg-salon-gold/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      item.highlight ? 'text-salon-gold' : isActive ? 'text-salon-gold' : 'text-salon-ivory/60 dark:text-neutral-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-salon-gold/20 text-salon-gold border border-salon-gold/40 animate-pulse">
                    Hot
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action CTAs */}
        <div className="space-y-3 pt-4 border-t border-salon-gold/15">
          <Link
            href="/booking"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-salon-gold via-salon-gold-light to-salon-gold hover:opacity-95 text-salon-noir font-bold shadow-gold-glow transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Đặt Lịch Hẹn Ngay</span>
          </Link>
        </div>

        {/* Contact Info Footer */}
        <div className="pt-6 mt-4 border-t border-neutral-800 text-xs text-neutral-400 space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-salon-gold" />
            <a href={`tel:${hotline}`} className="hover:text-salon-gold transition">
              Hotline: {hotline}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-salon-gold" />
            <span>{openingHours}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-salon-gold mt-0.5 flex-shrink-0" />
            <span className="leading-tight">{address}</span>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/login"
              className="text-neutral-500 hover:text-neutral-300 flex items-center gap-1 text-[11px]"
            >
              <span>Dành cho nhân viên quản trị</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
