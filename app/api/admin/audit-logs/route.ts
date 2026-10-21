import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession, extractAuthToken } from '@/lib/auth';
import { AuditAction } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function authenticateSuperAdmin(request: NextRequest) {
  const token = extractAuthToken(request);

  if (!token) {
    return { error: 'Unauthorized: Vui lòng đăng nhập với tài khoản quản trị', status: 401 };
  }

  const user = await verifySession(token);
  if (!user) {
    return { error: 'Unauthorized: Phiên làm việc không hợp lệ hoặc đã hết hạn', status: 401 };
  }

  if (user.role.name !== 'SUPER_ADMIN') {
    return {
      error: `Forbidden: Only SUPER_ADMIN can view audit logs (Current role: ${user.role.name})`,
      status: 403,
    };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await authenticateSuperAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '20', 10))
  );
  const actionParam = searchParams.get('action');
  const entityParam = searchParams.get('entity') || searchParams.get('entityType');
  const search = searchParams.get('search');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const skip = (page - 1) * pageSize;
  const where: any = {};

  if (actionParam && Object.values(AuditAction).includes(actionParam as AuditAction)) {
    where.action = actionParam as AuditAction;
  }

  if (entityParam && entityParam !== 'ALL') {
    where.entityType = { equals: entityParam, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { actorEmail: { contains: search, mode: 'insensitive' } },
      { actorName: { contains: search, mode: 'insensitive' } },
      { entityId: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  let total = 0;
  let logs: any[] = [];

  try {
    [total, logs] = await Promise.all([
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
  } catch (dbErr) {
    console.warn('[Audit Logs API] Database query fallback:', dbErr);
  }

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
    timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
    createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
    details: log.details,
    ipAddress: log.ipAddress || '127.0.0.1',
    userAgent: log.userAgent,
  }));

  return NextResponse.json({
    logs: formattedLogs,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  });
}
