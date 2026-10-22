import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Scissors,
  Palette,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { formatDateVN, formatRelativeTimeVN, formatPhoneNumber } from '@/lib/utils';
import { DashboardKpiCard } from '@/components/admin/DashboardKpiCard';

export const metadata = {
  title: 'Bảng Điều Khiển Quản Trị | Công Nguyễn Hair Salon',
};

// Luôn cập nhật số liệu thời gian thực
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  // 1. Kiểm tra xác thực phía máy chủ
  const user = await requireAdmin();

  // 2. Lấy ngày hôm nay theo giờ Việt Nam (UTC+7)
  const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const todayStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-${String(
    nowVN.getDate()
  ).padStart(2, '0')}`;
  const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

  // 3. Nạp song song các chỉ số trực tiếp từ Database với fallback an toàn
  let totalHairstyles = 0;
  let totalColors = 0;
  let totalServices = 0;
  let totalArticles = 0;
  let pendingBookingsCount = 0;
  let todayBookingsCount = 0;
  let recentPendingBookings: any[] = [];
  let recentAuditLogs: any[] = [];

  try {
    [
      totalHairstyles,
      totalColors,
      totalServices,
      totalArticles,
      pendingBookingsCount,
      todayBookingsCount,
      recentPendingBookings,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.hairstyle.count(),
      prisma.hairColor.count(),
      prisma.service.count(),
      prisma.article.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({
        where: {
          bookingDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      prisma.booking.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          service: true,
          hairstyleRef: true,
        },
      }),
      prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
  } catch (error) {
    console.warn('[Admin Dashboard Page] Database fetch warning:', error);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Tiêu đề chào mừng & Thông tin thời gian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-salon-gold/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-salon-gold mb-1">
            <span className="w-2 h-2 rounded-full bg-salon-gold animate-pulse"></span>
            Hệ thống Quản trị & Điều phối
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-salon-ivory">
            Xin chào, {user.fullName}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Báo cáo số liệu thời gian thực cho ngày hôm nay, {formatDateVN(nowVN)}.
          </p>
        </div>
      </div>

      {/* 2. Banner Cảnh Báo Lịch Hẹn Chờ Duyệt (Chỉ hiển thị khi có lịch PENDING) */}
      {pendingBookingsCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 shadow-md shadow-amber-500/5 dark:bg-gradient-to-r dark:from-amber-500/20 dark:via-amber-600/10 dark:to-transparent dark:border-amber-500/30 dark:shadow-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-300 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-200 tracking-tight">
                Có {pendingBookingsCount} lịch hẹn trực tuyến đang chờ xác nhận!
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/80 mt-0.5 font-medium leading-relaxed">
                Vui lòng kiểm tra và gọi điện xác nhận dịch vụ cho khách hàng trong vòng 15 phút.
              </p>
            </div>
          </div>
          <Link
            href="/admin/bookings?status=PENDING"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white dark:bg-salon-gold dark:hover:bg-salon-gold-hover dark:text-salon-noir font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm flex-shrink-0 hover:scale-102"
          >
            <span>Xử lý ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 3. Lưới 4 Thẻ Chỉ Số KPI (Metric Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <DashboardKpiCard
          title="Lịch Hẹn Hôm Nay"
          value={todayBookingsCount}
          icon={Calendar}
          description="Lịch phục vụ theo khung giờ"
          href="/admin/bookings"
          accentColor="emerald"
        />

        <DashboardKpiCard
          title="Chờ Xác Nhận"
          value={pendingBookingsCount}
          icon={Clock}
          description="Yêu cầu tiếp nhận mới nhất"
          href="/admin/bookings?status=PENDING"
          accentColor="amber"
        />

        <DashboardKpiCard
          title="Mẫu Tóc Trong Kho"
          value={totalHairstyles}
          icon={Scissors}
          description="Mẫu tóc Nam, Nữ & Unisex"
          href="/admin/hairstyles"
          accentColor="blue"
        />

        <DashboardKpiCard
          title="Dịch Vụ & Bảng Màu"
          value={totalServices}
          subValue={`/ ${totalColors} màu`}
          icon={Sparkles}
          description="Dịch vụ hóa chất & swatch màu"
          href="/admin/services"
          accentColor="purple"
        />
      </div>

      {/* 4. Phím Tắt Thao Tác Nhanh (Quick Actions Panel) */}
      <div className="p-5 rounded-xl bg-salon-charcoal/50 border border-salon-gold/10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3.5">
          Thao Tác Nhanh Theo Nghiệp Vụ
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          {(user.role.name === 'SUPER_ADMIN' || user.role.name === 'BOOKING_STAFF') && (
            <Link
              href="/admin/bookings"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-salon-surface hover:bg-salon-gold hover:text-salon-noir text-xs font-semibold text-salon-ivory border border-salon-gold/20 transition-all"
            >
              <CalendarCheck className="w-4 h-4 text-salon-gold" />
              <span>Xem Bảng Lịch Hẹn</span>
            </Link>
          )}

          {(user.role.name === 'SUPER_ADMIN' || user.role.name === 'CONTENT_ADMIN') && (
            <>
              <Link
                href="/admin/hairstyles"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-salon-surface hover:bg-salon-gold hover:text-salon-noir text-xs font-semibold text-salon-ivory border border-salon-gold/20 transition-all"
              >
                <Scissors className="w-4 h-4 text-salon-gold" />
                <span>Thêm Mẫu Tóc Mới</span>
              </Link>
              <Link
                href="/admin/colors"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-salon-surface hover:bg-salon-gold hover:text-salon-noir text-xs font-semibold text-salon-ivory border border-salon-gold/20 transition-all"
              >
                <Palette className="w-4 h-4 text-salon-gold" />
                <span>Quản Lý Bảng Màu</span>
              </Link>
            </>
          )}

          {(user.role.name === 'SUPER_ADMIN' ||
            user.role.name === 'CONTENT_ADMIN' ||
            user.role.name === 'EDITOR') && (
            <Link
              href="/admin/articles"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-salon-surface hover:bg-salon-gold hover:text-salon-noir text-xs font-semibold text-salon-ivory border border-salon-gold/20 transition-all"
            >
              <FileText className="w-4 h-4 text-salon-gold" />
              <span>Soạn Bài Viết Mới</span>
            </Link>
          )}

          {user.role.name === 'SUPER_ADMIN' && (
            <Link
              href="/admin/settings"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-salon-surface hover:bg-salon-gold hover:text-salon-noir text-xs font-semibold text-salon-ivory border border-salon-gold/20 transition-all"
            >
              <Sparkles className="w-4 h-4 text-salon-gold" />
              <span>Cấu Hình Thương Hiệu</span>
            </Link>
          )}
        </div>
      </div>

      {/* 5. Khối Bảng Đôi: Lịch Hẹn Chờ Xử Lý & Dòng Hoạt Động Mới Nhất */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột 1: Danh sách Lịch hẹn chờ xác nhận gần đây */}
        <div className="p-5 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-salon-gold/10">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif text-base font-bold text-salon-ivory">
                  Lịch Hẹn Cần Tiếp Nhận
                </h3>
              </div>
              <Link
                href="/admin/bookings?status=PENDING"
                className="text-xs text-salon-gold hover:underline flex items-center gap-1 font-medium"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentPendingBookings.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                Tuyệt vời! Không có lịch hẹn nào đang chờ xử lý.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {recentPendingBookings.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-salon-ivory truncate">
                          {b.customerName}
                        </span>
                        <span className="text-[10px] font-mono text-salon-gold/80 px-1.5 py-0.5 rounded bg-salon-gold/10">
                          {b.bookingCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                        <span>{formatPhoneNumber(b.customerPhone)}</span>
                        <span>•</span>
                        <span className="text-zinc-300">
                          {b.service?.title || 'Dịch vụ Salon'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold text-amber-300">{b.timeSlot}</div>
                      <div className="text-[10px] text-zinc-500">{formatDateVN(b.bookingDate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cột 2: Dòng Nhật ký kiểm toán gần nhất (Recent Audit Logs) */}
        <div className="p-5 rounded-xl bg-salon-charcoal/80 border border-salon-gold/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-salon-gold/10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-salon-gold" />
                <h3 className="font-serif text-base font-bold text-salon-ivory">
                  Nhật Ký Thao Tác Hệ Thống
                </h3>
              </div>
              {user.role.name === 'SUPER_ADMIN' && (
                <Link
                  href="/admin/audit-logs"
                  className="text-xs text-salon-gold hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {recentAuditLogs.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                Chưa có thao tác kiểm toán nào được ghi nhận.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {recentAuditLogs.map((log) => {
                  const getActionColor = (action: string) => {
                    switch (action) {
                      case 'CREATE':
                        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                      case 'UPDATE':
                        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                      case 'DELETE':
                        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                      case 'AUTH_LOGIN':
                        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                      case 'STATUS_CHANGE':
                        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                      default:
                        return 'text-zinc-400 bg-zinc-700/20 border-zinc-600/20';
                    }
                  };

                  return (
                    <div
                      key={log.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        <div className="truncate">
                          <span className="text-zinc-300 font-medium">
                            {log.actorName || log.actorEmail || 'Hệ thống'}
                          </span>
                          <span className="text-zinc-500 ml-1.5">tác động {log.entityType}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-zinc-500 flex-shrink-0">
                        {formatRelativeTimeVN(log.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
