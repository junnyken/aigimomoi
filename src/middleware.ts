import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isEditorRoute = pathname.startsWith('/editor');

  if (!isAdminRoute && !isEditorRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role check
  if (isAdminRoute && user.role !== 'ADMIN') {
    return new NextResponse('403 Forbidden: Yêu cầu quyền Quản trị viên (ADMIN)', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (isEditorRoute && user.role !== 'ADMIN' && user.role !== 'EDITOR') {
    return new NextResponse('403 Forbidden: Yêu cầu quyền Biên tập viên (EDITOR)', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/editor/:path*'],
};
