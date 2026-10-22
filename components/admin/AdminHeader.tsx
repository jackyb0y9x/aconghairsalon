'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  ExternalLink,
  ChevronRight,
  Shield,
  RefreshCw,
} from 'lucide-react';
import type { SessionUserData } from '@/lib/auth';
import { AdminSidebar } from './AdminSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AdminHeaderProps {
  user: SessionUserData;
}

const ROUTE_NAME_MAP: Record<string, string> = {
  '/admin': 'Tổng quan Dashboard',
  '/admin/bookings': 'Quản lý Lịch hẹn',
  '/admin/hairstyles': 'Bộ sưu tập Kiểu tóc',
  '/admin/colors': 'Bảng màu tóc Swatches',
  '/admin/services': 'Dịch vụ & Bảng giá',
  '/admin/before-after': 'Bộ sưu tập Before/After',
  '/admin/banners': 'Banner trang chủ',
  '/admin/categories': 'Danh mục phân loại',
  '/admin/articles': 'Bài viết cẩm nang',
  '/admin/settings': 'Cấu hình Salon',
  '/admin/audit-logs': 'Nhật ký hệ thống',
};

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Lấy dữ liệu cảnh báo số lượng lịch hẹn chờ duyệt
  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.pendingBookingsCount ?? 0);
      }
    } catch {
      // Bỏ qua lỗi kết nối nền
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 45000); // Tự động làm mới mỗi 45 giây
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchAlerts();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Xác định tiêu đề Breadcrumb
  const currentTitle =
    ROUTE_NAME_MAP[pathname] ||
    Object.entries(ROUTE_NAME_MAP).find(([key]) => key !== '/admin' && pathname.startsWith(key))?.[1] ||
    'Quản trị viên';

  return (
    <>
      <header className="h-16 bg-salon-charcoal/80 border-b border-salon-gold/15 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
        {/* Phía trái: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-zinc-300 hover:text-salon-gold p-2 rounded-lg hover:bg-salon-surface"
            aria-label="Mở menu quản trị"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <Link
              href="/admin"
              className="hover:text-salon-gold transition-colors hidden sm:inline"
            >
              Công Nguyễn CMS
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 hidden sm:inline" />
            <span className="text-salon-ivory font-semibold truncate max-w-[200px] sm:max-w-xs">
              {currentTitle}
            </span>
          </nav>
        </div>

        {/* Phía phải: Cảnh báo, Phím tắt, Hồ sơ */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Nút làm mới dữ liệu nhanh */}
          <button
            onClick={handleManualRefresh}
            className="p-2 text-zinc-400 hover:text-salon-gold rounded-lg hover:bg-salon-surface transition-colors"
            title="Làm mới thông số dữ liệu"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-salon-gold' : ''}`}
            />
          </button>

          {/* Huy hiệu cảnh báo lịch hẹn chờ xác nhận */}
          {pendingCount !== null && pendingCount > 0 && (
            <Link
              href="/admin/bookings?status=PENDING"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 hover:bg-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/25 transition-all group shadow-sm"
              title="Xem danh sách lịch hẹn chờ xác nhận"
            >
              <div className="relative">
                <Bell className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"></span>
              </div>
              <span className="text-xs font-bold tracking-tight">
                {pendingCount} chờ duyệt
              </span>
            </Link>
          )}

          {/* Nút cấu hình phong cách sáng/tối */}
          <ThemeToggle variant="admin" />

          {/* Phím tắt mở Website công khai */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-salon-gold border border-zinc-700 hover:border-salon-gold/40 rounded-lg bg-salon-noir/50 transition-colors"
          >
            <span>Xem Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Huy hiệu vai trò tài khoản */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-salon-surface/60 border border-salon-gold/10 text-xs text-zinc-300">
            <Shield className="w-3.5 h-3.5 text-salon-gold" />
            <span className="font-semibold text-salon-gold">{user.role.name}</span>
          </div>
        </div>
      </header>

      {/* Tích hợp Sidebar phiên bản Drawer di động */}
      <AdminSidebar
        user={user}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        isMobileOnly
      />
    </>
  );
}
