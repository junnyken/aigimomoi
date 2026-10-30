// R8 — API Mở khóa dùng thử công thức miễn phí (D66)
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { claimRecipePromo } from '@/lib/gating/queries';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json(
        { ok: false, message: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json(
        { ok: false, message: 'Vui lòng đăng nhập để mở khóa công thức này.' },
        { status: 401 }
      );
    }

    const rate = await checkRateLimitShared(
      'recipe-claim',
      `${sessionUser.id}:${getClientIp(request)}`,
      20,
      60_000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, message: 'Thao tác quá nhanh. Vui lòng thử lại sau ít giây.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const { id } = await context.params;
    const recipeId = parseInt(id, 10);
    if (!recipeId || isNaN(recipeId) || recipeId <= 0) {
      return NextResponse.json(
        { ok: false, message: 'ID công thức không hợp lệ.' },
        { status: 400 }
      );
    }

    const result = await claimRecipePromo(sessionUser.id, recipeId);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      alreadyOwned: result.alreadyOwned,
    });
  } catch (error) {
    console.error('Error claiming recipe promo:', error);
    return NextResponse.json(
      { ok: false, message: 'Không thể mở khóa công thức lúc này.' },
      { status: 500 }
    );
  }
}
