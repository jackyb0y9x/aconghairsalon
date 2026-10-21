'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Scissors,
  Palette,
  Sparkles,
  SplitSquareVertical,
  Image as ImageIcon,
  FileText,
  Layers,
  Settings,
  ShieldAlert,
  LogOut,
  X,
  ChevronRight,
} from 'lucide-react';
import type { SessionUserData, AdminRole } from '@/lib/auth';

interface AdminSidebarProps {
  user: SessionUserData;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  isMobileOnly?: boolean;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AdminRole[];
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    groupName: 'ĐIỀU HÀNH & ĐẶT LỊCH',
    items: [
      {
        title: 'Tổng quan Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'BOOKING_STAFF', 'EDITOR'],
      },
      {
        title: 'Quản lý Lịch hẹn',
        href: '/admin/bookings',
        icon: CalendarCheck,
        roles: ['SUPER_ADMIN', 'BOOKING_STAFF'],
      },
    ],
  },
  {
    groupName: 'DANH MỤC & DỊCH VỤ',
    items: [
       {
        title: 'Danh mục phân loại',
        href: '/admin/categories',
        icon: Layers,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
      },
      {
        title: 'Bộ sưu tập Kiểu tóc',
        href: '/admin/hairstyles',
        icon: Scissors,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
      },
      {
        title: 'Bảng màu tóc Swatches',
        href: '/admin/colors',
        icon: Palette,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
      },
      {
        title: 'Dịch vụ & Bảng giá',
        href: '/admin/services',
        icon: Sparkles,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
      },
    ],
  },
  {
    groupName: 'TRUYỀN THÔNG & TIN TỨC',
    items: [
      {
        title: 'Banner trang chủ',
        href: '/admin/banners',
        icon: ImageIcon,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'],
      },
      {
        title: 'Bài viết cẩm nang',
        href: '/admin/articles',
        icon: FileText,
        roles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
      },
    ],
  },
  {
    groupName: 'QUẢN TRỊ HỆ THỐNG',
    items: [
      {
        title: 'Cấu hình Salon',
        href: '/admin/settings',
        icon: Settings,
        roles: ['SUPER_ADMIN'],
      },
      {
        title: 'Nhật ký hệ thống',
        href: '/admin/audit-logs',
        icon: ShieldAlert,
        roles: ['SUPER_ADMIN'],
      },
    ],
  },
];

export function AdminSidebar({
  user,
  isMobileOpen = false,
  onMobileClose,
  isMobileOnly = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: 'Super Admin',
          classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'CONTENT_ADMIN':
        return {
          label: 'Content Lead',
          classes: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
      case 'BOOKING_STAFF':
        return {
          label: 'Lễ Tân Đặt Lịch',
          classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'EDITOR':
        return {
          label: 'Biên Tập Viên',
          classes: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        };
      default:
        return {
          label: role,
          classes: 'bg-zinc-700/20 text-zinc-300 border-zinc-600/30',
        };
    }
  };

  const roleBadge = getRoleBadge(user.role.name);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-salon-charcoal/95 border-r border-salon-gold/15 select-none">
      {/* 1. Atelier Brand Header */}
      <div className="p-6 border-b border-salon-gold/10 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-salon-gold via-salon-gold-dark to-amber-700 flex items-center justify-center text-salon-noir shadow-gold-subtle group-hover:scale-105 transition-transform duration-200">
            <Scissors className="w-5 h-5 text-salon-noir stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-serif text-base font-bold tracking-wider text-salon-ivory uppercase leading-none">
              Công Nguyễn
            </h1>
            <p className="text-[10px] tracking-widest text-salon-gold font-medium uppercase mt-1">
              Hair Salon CMS
            </p>
          </div>
        </Link>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden text-zinc-400 hover:text-salon-gold p-1.5 rounded-lg hover:bg-salon-surface"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Scrollable Navigation Menu Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 custom-scrollbar">
        {NAVIGATION_GROUPS.map((group) => {
          // Lọc danh sách mục theo vai trò
          const filteredItems = group.items.filter((item) =>
            item.roles.includes(user.role.name)
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={group.groupName} className="space-y-1.5">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">
                {group.groupName}
              </h3>
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? 'bg-salon-gold/15 text-salon-gold border-l-4 border-salon-gold shadow-gold-subtle font-semibold'
                          : 'text-zinc-400 hover:text-salon-gold hover:bg-salon-gold/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? 'text-salon-gold'
                              : 'text-zinc-400 group-hover:text-salon-gold'
                          }`}
                        />
                        <span>{item.title}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-salon-gold animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. User Staff Profile & Logout Footer */}
      <div className="p-4 border-t border-salon-gold/10 bg-salon-noir/50">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-salon-charcoal/80 border border-salon-gold/10">
          <div className="w-9 h-9 rounded-full bg-salon-gold/20 border border-salon-gold/40 flex items-center justify-center text-salon-gold font-bold text-xs uppercase overflow-hidden">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {user.fullName
                  ? user.fullName
                      .split(' ')
                      .map((w) => w[0])
                      .slice(-2)
                      .join('')
                  : 'LM'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-salon-ivory truncate">
              {user.fullName}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-tight ${roleBadge.classes}`}
              >
                {roleBadge.label}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-100 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất hệ thống'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Cố định w-64 / w-72) - Chỉ hiển thị khi KHÔNG PHẢI isMobileOnly */}
      {!isMobileOnly && (
        <aside className="hidden md:block w-64 lg:w-72 h-screen sticky top-0 z-20 flex-shrink-0">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Off-canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
