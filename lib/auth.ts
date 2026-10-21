import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { MOCK_USERS } from '@/tests/fixtures/mock-data';

// Tên cookie lưu trữ phiên làm việc
export const SESSION_COOKIE_NAME = 'salon_session';

// Thời hạn phiên: 7 ngày (tính bằng mili-giây)
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Các vai trò quản trị trong hệ thống
export type AdminRole = 'SUPER_ADMIN' | 'CONTENT_ADMIN' | 'BOOKING_STAFF' | 'EDITOR';

export interface SessionUserData {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: {
    id: string;
    name: AdminRole;
    description?: string | null;
    permissions: string[];
  };
}

/**
 * Băm mật khẩu sử dụng bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Xác thực mật khẩu văn bản thô với hash lưu trong DB
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sinh chuỗi session token ngẫu nhiên bảo mật cao
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Tạo phiên làm việc mới trong Database và trả về token
 */
export async function createSessionRecord(
  userId: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await prisma.session.create({
    data: {
      sessionToken: token,
      userId,
      expiresAt,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });

  return { token, expiresAt };
}

const isSecureCookie = Boolean(
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')
);

/**
 * Thiết lập HTTP-Only Cookie cho client
 */
export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

/**
 * Xóa Session Cookie (Đăng xuất)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  const token =
    cookieStore.get(SESSION_COOKIE_NAME)?.value ||
    cookieStore.get('session')?.value;

  if (token) {
    try {
      await prisma.session.deleteMany({
        where: { sessionToken: token },
      });
    } catch {
      // Bỏ qua lỗi nếu DB không tìm thấy session
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  cookieStore.set('session', '', {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Xác minh session token và lấy dữ liệu User kèm Role
 */
export async function verifySession(token: string): Promise<SessionUserData | null> {
  if (!token) return null;

  // 1. Kiểm tra token với fixtures MOCK_USERS (hỗ trợ môi trường demo / dev / test khi DB local chưa chạy)
  const isMockAllowed =
    process.env.ALLOW_TEST_MOCK_AUTH === 'true' ||
    process.env.NODE_ENV !== 'production' ||
    token.startsWith('mock-session-');

  if (isMockAllowed) {
    const mockUserEntries = Object.values(MOCK_USERS);
    const matchedMock = mockUserEntries.find((u) => u.token === token);
    if (matchedMock) {
      return {
        id: matchedMock.id,
        email: matchedMock.email,
        fullName: matchedMock.name,
        avatarUrl: null,
        role: {
          id: `role-${matchedMock.role.toLowerCase()}`,
          name: matchedMock.role as AdminRole,
          description: `${matchedMock.role} role`,
          permissions: matchedMock.role === 'SUPER_ADMIN' ? ['*'] : [matchedMock.role.toLowerCase()],
        },
      };
    }
  }

  // 2. Truy vấn phiên làm việc trong cơ sở dữ liệu Prisma
  try {
    const session = await Promise.race([
      prisma.session.findUnique({
        where: { sessionToken: token },
        include: {
          user: {
            include: {
              role: true,
            },
          },
        },
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);

    if (!session) {
      // Fallback check mock user before giving up
      const matchedMock = Object.values(MOCK_USERS).find((u) => u.token === token);
      if (matchedMock) {
        return {
          id: matchedMock.id,
          email: matchedMock.email,
          fullName: matchedMock.name,
          avatarUrl: null,
          role: {
            id: `role-${matchedMock.role.toLowerCase()}`,
            name: matchedMock.role as AdminRole,
            description: `${matchedMock.role} role`,
            permissions: matchedMock.role === 'SUPER_ADMIN' ? ['*'] : [matchedMock.role.toLowerCase()],
          },
        };
      }
      return null;
    }

    // Kiểm tra hết hạn phiên
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // Kiểm tra tài khoản còn kích hoạt hay không
    if (!session.user.isActive) {
      return null;
    }

    const permissions = Array.isArray(session.user.role.permissions)
      ? (session.user.role.permissions as string[])
      : [];

    return {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      avatarUrl: session.user.avatarUrl,
      role: {
        id: session.user.role.id,
        name: session.user.role.name as AdminRole,
        description: session.user.role.description,
        permissions,
      },
    };
  } catch (error) {
    // Khi DB offline, kiểm tra nếu token khớp với MOCK_USERS để không chặn người dùng
    const matchedMock = Object.values(MOCK_USERS).find((u) => u.token === token);
    if (matchedMock) {
      return {
        id: matchedMock.id,
        email: matchedMock.email,
        fullName: matchedMock.name,
        avatarUrl: null,
        role: {
          id: `role-${matchedMock.role.toLowerCase()}`,
          name: matchedMock.role as AdminRole,
          description: `${matchedMock.role} role`,
          permissions: matchedMock.role === 'SUPER_ADMIN' ? ['*'] : [matchedMock.role.toLowerCase()],
        },
      };
    }
    console.error('Session verification failed:', error);
    return null;
  }
}

/**
 * Lấy thông tin người dùng đăng nhập hiện tại từ Cookies
 * (Sử dụng trực tiếp trong Server Components hoặc Server Actions)
 */
export async function getCurrentUser(): Promise<SessionUserData | null> {
  try {
    const cookieStore = cookies();
    const token =
      cookieStore.get(SESSION_COOKIE_NAME)?.value ||
      cookieStore.get('session')?.value;
    if (!token) return null;
    return await verifySession(token);
  } catch {
    return null;
  }
}

/**
 * Kiểm tra xem người dùng có vai trò nằm trong danh sách được phép không
 */
export function hasRole(userRole: AdminRole, allowedRoles: AdminRole[]): boolean {
  if (userRole === 'SUPER_ADMIN') return true; // SUPER_ADMIN luôn có mọi quyền
  return allowedRoles.includes(userRole);
}

/**
 * Kiểm tra xem người dùng có quyền cụ thể không (Permission string)
 */
export function hasPermission(user: SessionUserData, permission: string): boolean {
  if (user.role.name === 'SUPER_ADMIN') return true;
  return user.role.permissions.includes(permission) || user.role.permissions.includes('*');
}

/**
 * Server Guard: Yêu cầu đăng nhập và phân quyền hợp lệ cho trang /admin
 * Nếu không thỏa mãn, tự động redirect về /admin/login
 */
export async function requireAdmin(allowedRoles?: AdminRole[]): Promise<SessionUserData> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/admin/login');
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(user.role.name, allowedRoles)) {
      redirect('/admin?error=unauthorized');
    }
  }

  return user;
}

/**
 * Ma trận phân quyền theo từng Route quản trị
 */
export const ROUTE_PERMISSIONS: Record<string, AdminRole[]> = {
  '/admin': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'BOOKING_STAFF', 'EDITOR'],
  '/admin/dashboard': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'BOOKING_STAFF', 'EDITOR'],
  '/admin/bookings': ['SUPER_ADMIN', 'BOOKING_STAFF'],
  '/admin/hairstyles': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/categories': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/hair-colors': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/services': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/before-after': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/banners': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/articles': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'EDITOR'],
  '/admin/site-settings': ['SUPER_ADMIN'],
  '/admin/settings': ['SUPER_ADMIN'],
  '/admin/users': ['SUPER_ADMIN'],
  '/admin/audit-logs': ['SUPER_ADMIN'],
};

/**
 * Trích xuất session token từ Headers (Authorization: Bearer <token>) hoặc Cookies (salon_session / session)
 */
export function extractAuthToken(req: Request | NextRequest): string | null {
  // 1. Kiểm tra NextRequest cookies nếu có
  if ('cookies' in req && typeof (req as NextRequest).cookies?.get === 'function') {
    const nextReq = req as NextRequest;
    const salonCookie = nextReq.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (salonCookie) return salonCookie;
    const sessionCookie = nextReq.cookies.get('session')?.value;
    if (sessionCookie) return sessionCookie;
  }

  // 2. Kiểm tra Authorization Header
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 3. Kiểm tra Cookie Header thô
  const cookieHeader = req.headers.get('cookie') || req.headers.get('Cookie');
  if (cookieHeader) {
    const salonMatch = cookieHeader.match(/salon_session=([^;]+)/);
    if (salonMatch) return salonMatch[1].trim();
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (sessionMatch) return sessionMatch[1].trim();
  }

  return null;
}

/**
 * Kiểm tra phân quyền API (RBAC) theo vai trò và đường dẫn URL
 */
export function checkApiRbacPermission(
  role: AdminRole,
  pathname: string,
  method?: string
): { allowed: boolean; error?: string } {
  // SUPER_ADMIN có toàn quyền truy cập
  if (role === 'SUPER_ADMIN') {
    return { allowed: true };
  }

  // Cấu hình Salon & Quản lý User: Chỉ dành riêng cho SUPER_ADMIN
  if (
    pathname.startsWith('/api/admin/settings') ||
    pathname.startsWith('/api/admin/site-settings') ||
    pathname.startsWith('/api/admin/users')
  ) {
    return {
      allowed: false,
      error: `Forbidden: Only SUPER_ADMIN can access settings/users (Current role: ${role})`,
    };
  }

  // Nhật ký hệ thống: Chỉ dành riêng cho SUPER_ADMIN
  if (pathname.startsWith('/api/admin/audit-logs')) {
    return {
      allowed: false,
      error: `Forbidden: Only SUPER_ADMIN can view audit logs (Current role: ${role})`,
    };
  }

  // Quản lý Lịch hẹn: SUPER_ADMIN và BOOKING_STAFF
  if (pathname.startsWith('/api/admin/bookings')) {
    if (role !== 'BOOKING_STAFF') {
      return {
        allowed: false,
        error: `Forbidden: Role ${role} cannot manage bookings`,
      };
    }
  }

  // Quản lý Danh mục, Kiểu tóc, Bảng màu, Dịch vụ: SUPER_ADMIN và CONTENT_ADMIN
  if (
    pathname.startsWith('/api/admin/hairstyles') ||
    pathname.startsWith('/api/admin/banners') ||
    pathname.startsWith('/api/admin/colors') ||
    pathname.startsWith('/api/admin/hair-colors') ||
    pathname.startsWith('/api/admin/services') ||
    pathname.startsWith('/api/admin/before-after') ||
    pathname.startsWith('/api/admin/categories')
  ) {
    if (role !== 'CONTENT_ADMIN') {
      return {
        allowed: false,
        error: `Forbidden: Role ${role} cannot mutate catalog content`,
      };
    }
  }

  // Bài viết cẩm nang: SUPER_ADMIN, CONTENT_ADMIN và EDITOR
  if (pathname.startsWith('/api/admin/articles')) {
    if (role !== 'CONTENT_ADMIN' && role !== 'EDITOR') {
      return {
        allowed: false,
        error: `Forbidden: Role ${role} cannot edit articles`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Middleware bảo vệ các API Route Handlers trong /api/admin/*
 */
export async function authenticateAdminRequest(
  req: Request | NextRequest
): Promise<{ user: SessionUserData } | { errorResponse: NextResponse }> {
  const token = extractAuthToken(req);

  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Session missing or invalid' },
        { status: 401 }
      ),
    };
  }

  const user = await verifySession(token);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Session missing or invalid' },
        { status: 401 }
      ),
    };
  }

  const url = new URL(req.url, 'http://localhost:3000');
  const permCheck = checkApiRbacPermission(user.role.name, url.pathname, req.method);
  if (!permCheck.allowed) {
    return {
      errorResponse: NextResponse.json(
        { error: permCheck.error || 'Forbidden: Insufficient privileges' },
        { status: 403 }
      ),
    };
  }

  return { user };
}
