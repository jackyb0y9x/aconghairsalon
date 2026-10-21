import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractAuthToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';

export async function POST(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || undefined;

    if (token) {
      try {
        const session = await prisma.session.findUnique({
          where: { sessionToken: token },
          include: { user: { include: { role: true } } },
        });

        if (session && session.user) {
          await logAuditEvent({
            userId: session.user.id,
            userEmail: session.user.email,
            userName: session.user.fullName,
            userRole: session.user.role.name,
            action: 'AUTH_LOGOUT',
            entity: 'Auth',
            entityId: session.user.id,
            details: { logoutAt: new Date().toISOString() },
            ipAddress,
            userAgent,
          });
        }

        await prisma.session.deleteMany({
          where: { sessionToken: token },
        });
      } catch (dbError) {
        console.warn('Session deletion ignored or session not found in DB:', dbError);
      }
    }

    const response = NextResponse.json({ success: true }, { status: 200 });

    const isSecureCookie = Boolean(
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')
    );

    // Expire cookies
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    response.cookies.set('session', '', {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('Unhandled error in /api/auth/logout:', error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
