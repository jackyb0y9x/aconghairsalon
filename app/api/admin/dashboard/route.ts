import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession, extractAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard
 * Tổng hợp các chỉ số telemetry thời gian thực phục vụ Dashboard quản trị.
 * Được bảo vệ bởi RBAC: cho phép tất cả các vai trò quản trị (SUPER_ADMIN, CONTENT_ADMIN, BOOKING_STAFF, EDITOR).
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Trích xuất token xác thực từ Cookies hoặc Authorization Bearer Header
    const token = extractAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Vui lòng đăng nhập để truy cập dữ liệu quản trị' },
        { status: 401 }
      );
    }

    // 2. Xác minh phiên làm việc
    const user = await verifySession(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Phiên làm việc không hợp lệ hoặc đã hết hạn' },
        { status: 401 }
      );
    }

    // 3. Tính toán mốc ngày hôm nay theo múi giờ Việt Nam (UTC+7)
    const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const todayStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-${String(
      nowVN.getDate()
    ).padStart(2, '0')}`;
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

    // 4. Thực thi các truy vấn song song qua Promise.all
    let totalHairstyles = 0;
    let totalColors = 0;
    let totalServices = 0;
    let totalArticles = 0;
    let pendingBookingsCount = 0;
    let todayBookingsCount = 0;
    let recentAuditLogsRaw: any[] = [];
    let recentPendingBookings: any[] = [];

    let dbErrorDetail: any = null;
    try {
      [
        totalHairstyles,
        totalColors,
        totalServices,
        totalArticles,
        pendingBookingsCount,
        todayBookingsCount,
        recentAuditLogsRaw,
        recentPendingBookings,
      ] = await Promise.all([
        prisma.hairstyle.count(),
        prisma.hairColor.count(),
        prisma.service.count(),
        prisma.article.count(),
        prisma.booking.count({
          where: { status: 'PENDING' },
        }),
        prisma.booking.count({
          where: {
            bookingDate: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        }),
        prisma.auditLog.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            actorName: true,
            actorRole: true,
            createdAt: true,
            details: true,
          },
        }),
        prisma.booking.findMany({
          where: { status: 'PENDING' },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            bookingCode: true,
            customerName: true,
            customerPhone: true,
            bookingDate: true,
            timeSlot: true,
            createdAt: true,
            service: {
              select: { title: true, durationMinutes: true, priceMin: true },
            },
            hairstyleRef: {
              select: { title: true },
            },
          },
        }),
      ]);
    } catch (dbError: any) {
      dbErrorDetail = {
        message: dbError?.message,
        code: dbError?.code,
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 20) + '...' : null,
      };
      console.warn('[Admin Dashboard API] Database query fallback:', dbError);
    }

    // 5. Chuẩn hóa cấu trúc Audit Logs tương thích các bộ kiểm thử (TC1.12)
    const recentAuditLogs = recentAuditLogsRaw.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entityType,
      entityType: log.entityType,
      entityId: log.entityId,
      actorName: log.actorName,
      actorRole: log.actorRole,
      timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
      createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
      details: log.details,
    }));

    // 6. Trả về Response theo đúng hợp đồng dữ liệu chuẩn
    return NextResponse.json({
      totalHairstyles,
      totalColors,
      totalServices,
      totalArticles,
      pendingBookingsCount,
      todayBookingsCount,
      recentAuditLogs,
      recentPendingBookings,
      serverTime: new Date().toISOString(),
      dbError: dbErrorDetail,
    });
  } catch (error) {
    console.error('[Admin Dashboard API Error]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error khi tổng hợp số liệu Dashboard' },
      { status: 500 }
    );
  }
}
