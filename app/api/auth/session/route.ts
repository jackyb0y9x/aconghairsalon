import { NextRequest, NextResponse } from 'next/server';
import { verifySession, extractAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = extractAuthToken(req);

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }

    const userData = await verifySession(token);
    if (!userData) {
      return NextResponse.json(
        { authenticated: false, error: 'Phiên làm việc không tồn tại hoặc đã hết hạn' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.fullName,
          fullName: userData.fullName,
          role: userData.role.name,
          avatarUrl: userData.avatarUrl,
          permissions: userData.role.permissions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unhandled error in /api/auth/session:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Lỗi xác minh phiên làm việc' },
      { status: 500 }
    );
  }
}
