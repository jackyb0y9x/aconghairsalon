import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

export type AuditActionType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'SECURITY_VIOLATION';

export interface LogAuditEventParams {
  /** ID của người dùng thực hiện thao tác (User.id) */
  userId?: string | null;
  /** Email người dùng tại thời điểm thao tác (để truy vết nếu User bị xóa) */
  userEmail?: string | null;
  /** Họ tên người dùng */
  userName?: string | null;
  /** Vai trò của người dùng (SUPER_ADMIN, CONTENT_ADMIN, BOOKING_STAFF, EDITOR) */
  userRole?: string | null;
  /** Hành động thực hiện */
  action: AuditActionType | AuditAction;
  /** Loại thực thể bị tác động (e.g. 'Booking', 'Hairstyle', 'Service', 'Banner', 'SiteSetting') */
  entity: string;
  /** ID của bản ghi bị tác động */
  entityId?: string | null;
  /** Dữ liệu chi tiết, sự thay đổi { before: ..., after: ... } hoặc thông số liên quan */
  details?: Record<string, unknown> | null;
  /** Địa chỉ IP của client */
  ipAddress?: string | null;
  /** Chuỗi User-Agent của client */
  userAgent?: string | null;
}

export interface GetAuditLogsFilter {
  page?: number;
  pageSize?: number;
  entity?: string;
  action?: AuditActionType | AuditAction;
  actorId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const inMemoryAuditLogs: any[] = [];

/**
 * Ghi nhận một sự kiện kiểm toán vào bảng AuditLog trong cơ sở dữ liệu.
 * Hoàn toàn Fail-Safe: không bao giờ ném lỗi ra ngoài làm sập luồng nghiệp vụ.
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  const memoryLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action: params.action,
    entity: params.entity,
    entityType: params.entity,
    entityId: params.entityId,
    actorId: params.userId,
    actorName: params.userName || 'Hệ thống',
    actorEmail: params.userEmail || 'system@lumiere.vn',
    actorRole: params.userRole || 'SUPER_ADMIN',
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    details: params.details,
    ipAddress: params.ipAddress || '127.0.0.1',
    userAgent: params.userAgent,
  };
  inMemoryAuditLogs.unshift(memoryLog);

  try {
    const actionValue = params.action as AuditAction;

    // Fire-and-forget background persistence to avoid blocking caller latency
    prisma.auditLog.create({
      data: {
        actorId: params.userId || undefined,
        actorEmail: params.userEmail || undefined,
        actorName: params.userName || undefined,
        actorRole: params.userRole || undefined,
        action: actionValue,
        entityType: params.entity,
        entityId: params.entityId || undefined,
        details: params.details ? (params.details as any) : undefined,
        ipAddress: params.ipAddress || undefined,
        userAgent: params.userAgent || undefined,
      },
    }).catch((error) => {
      // Console debug only in dev
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AuditService] Background DB write fallback:', error?.message);
      }
    });
  } catch (error) {
    // Fail-safe: tuyệt đối không làm gián đoạn request người dùng
  }
}

/**
 * Truy vấn danh sách nhật ký kiểm toán có phân trang và bộ lọc phục vụ trang /admin/audit-logs
 */
export async function getAuditLogs(filter: GetAuditLogsFilter = {}) {
  const page = Math.max(1, filter.page || 1);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize || 20));
  const skip = (page - 1) * pageSize;

  try {
    const where: any = {};

    if (filter.entity && filter.entity !== 'ALL') {
      where.entityType = { equals: filter.entity, mode: 'insensitive' };
    }

    if (filter.action) {
      where.action = filter.action;
    }

    if (filter.actorId) {
      where.actorId = filter.actorId;
    }

    if (filter.search) {
      where.OR = [
        { actorEmail: { contains: filter.search, mode: 'insensitive' } },
        { actorName: { contains: filter.search, mode: 'insensitive' } },
        { entityId: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entityType,
      entityType: log.entityType,
      entityId: log.entityId,
      actorId: log.actorId,
      actorName: log.actorName || log.actor?.fullName || 'Hệ thống',
      actorEmail: log.actorEmail || log.actor?.email || 'system@lumiere.vn',
      actorRole: log.actorRole || (log.actor?.role as any)?.name || 'SUPER_ADMIN',
      timestamp: log.createdAt.toISOString(),
      createdAt: log.createdAt.toISOString(),
      details: log.details,
      ipAddress: log.ipAddress || '127.0.0.1',
      userAgent: log.userAgent,
    }));

    return {
      data: logs,
      logs: formattedLogs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  } catch (error) {
    console.error('[AuditService Error] Không thể truy vấn nhật ký kiểm toán từ database, dùng in-memory fallback:', error);
    let filtered = [...inMemoryAuditLogs];
    if (filter.entity && filter.entity !== 'ALL') {
      filtered = filtered.filter(
        (l) => l.entity?.toLowerCase() === filter.entity?.toLowerCase() || l.entityType?.toLowerCase() === filter.entity?.toLowerCase()
      );
    }
    if (filter.action) {
      filtered = filtered.filter((l) => l.action === filter.action);
    }
    if (filter.actorId) {
      filtered = filtered.filter((l) => l.actorId === filter.actorId);
    }
    return {
      data: filtered,
      logs: filtered,
      pagination: {
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    };
  }
}
