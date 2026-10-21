import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken =
    req.cookies.get('salon_session')?.value || req.cookies.get('session')?.value;

  // 1. Luôn truyền x-pathname và x-current-path cho Server Components/Layouts
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-current-path', pathname);
  requestHeaders.set('x-pathname', pathname);

  // 2. Cho phép truy cập công khai vào /admin/login
  if (pathname === '/admin/login') {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 3. Bảo vệ tất cả các route /admin khác: yêu cầu session token
  if (!sessionToken) {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Cho phép request hợp lệ tiếp tục kèm headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
