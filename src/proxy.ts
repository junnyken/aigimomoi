import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { queryPublicSlugResolution } from '@/lib/recipes/publicQueries';
import { queryPublicCreatorSlugResolution } from '@/lib/creators/queries';
import { PUBLIC_RECIPE_PREFIX, RECIPE_NOT_FOUND_PLACEHOLDER, recipePath } from '@/lib/recipes/labels';

const CREATOR_PROFILE_PREFIX = '/nguoi-nau/';

/**
 * AG-16: với Partial Prefetching, trang stream app shell (200) trước khi notFound()/redirect
 * chạy → chỉ còn "soft 404". Quyết định ở đây (trước khi render) để trả đúng mã HTTP.
 */
async function gatePublicRecipe(request: NextRequest, pathname: string) {
  const rawSlug = pathname.slice(PUBLIC_RECIPE_PREFIX.length).replace(/\/$/, '');
  if (!rawSlug || rawSlug.includes('/') || rawSlug === RECIPE_NOT_FOUND_PLACEHOLDER) return NextResponse.next();

  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    // Percent-encoding hỏng: Next sẽ ném 500 khi decode param → chặn sớm bằng 400
    return new NextResponse('400 Bad Request', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const target = request.nextUrl.clone();
  target.search = '';

  try {
    const resolution = await queryPublicSlugResolution(slug);
    if (resolution.kind === 'published') return NextResponse.next();
    if (resolution.kind === 'redirect') {
      target.pathname = recipePath(resolution.slug);
      return NextResponse.redirect(target, 308);
    }
  } catch (err) {
    // DB lỗi: để trang tự xử lý (nó cũng chỉ hiển thị bản PUBLISHED)
    const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : '';
    console.error('Public recipe gate lookup failed:', cause || (err instanceof Error ? err.message : err));
    return NextResponse.next();
  }

  // Trang placeholder được prerender tĩnh với notFound() → 404 thật + UI thân thiện
  target.pathname = recipePath(RECIPE_NOT_FOUND_PLACEHOLDER);
  return NextResponse.rewrite(target);
}

async function gateCreatorProfile(request: NextRequest, pathname: string) {
  const rawSlug = pathname.slice(CREATOR_PROFILE_PREFIX.length).replace(/\/$/, '');
  if (!rawSlug || rawSlug.includes('/')) return NextResponse.next();

  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    return new NextResponse('400 Bad Request', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const target = request.nextUrl.clone();
  target.search = '';

  try {
    const resolution = await queryPublicCreatorSlugResolution(slug);
    if (resolution === 'published') return NextResponse.next();
  } catch (err) {
    const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : '';
    console.error('Creator profile gate lookup failed:', cause || (err instanceof Error ? err.message : err));
    return NextResponse.next();
  }

  target.pathname = recipePath(RECIPE_NOT_FOUND_PLACEHOLDER);
  return NextResponse.rewrite(target);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isEditorRoute = pathname.startsWith('/editor');

  if (pathname.startsWith(PUBLIC_RECIPE_PREFIX)) {
    return gatePublicRecipe(request, pathname);
  }

  if (pathname.startsWith(CREATOR_PROFILE_PREFIX)) {
    return gateCreatorProfile(request, pathname);
  }

  if (!isAdminRoute && !isEditorRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    return res;
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

  if (pathname === '/admin' || pathname === '/admin/' || pathname === '/editor' || pathname === '/editor/') {
    return NextResponse.redirect(new URL('/editor/recipes', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/editor', '/editor/:path*', '/cong-thuc/:path*', '/nguoi-nau/:path*'],
};
