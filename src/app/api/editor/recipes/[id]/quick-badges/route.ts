import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest, isSameOrigin } from '@/lib/http/sameOrigin';
import { validateVerificationFlags } from '@/lib/recipes/gate';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/editor/recipes/[id]/quick-badges
 * Bảo mật (F-02):
 * - Chỉ ADMIN mới được phép gắn/gỡ nhãn kiểm chứng (D31).
 * - Không cho phép đổi trực tiếp `status` hoặc `caloriesPerServing` qua endpoint này
 *   (xuất bản bắt buộc đi qua POST /api/recipes/[id]/publish để chạy đủ Gate Check & An toàn thực phẩm).
 * - Bắt buộc kiểm tra bất biến D23 & R7 (`validateVerificationFlags`) trước khi bật cờ xác minh.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (isCrossSiteRequest(request) || !isSameOrigin(request)) {
      return NextResponse.json({ error: 'Yêu cầu không hợp lệ (CSRF).' }, { status: 403 });
    }

    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên (ADMIN) mới có quyền xác nhận huy hiệu kiểm định (D31).' },
        { status: 403 }
      );
    }

    const rate = await checkRateLimitShared(
      'admin-quick-badges',
      `${user.id}:${getClientIp(request)}`,
      30,
      60_000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Thao tác quá nhanh. Vui lòng thử lại sau ít giây.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const { id: rawId } = await context.params;
    const recipeId = Number(rawId);
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    if (body && typeof body === 'object' && ('status' in body || 'caloriesPerServing' in body)) {
      return NextResponse.json(
        {
          error:
            'Không được phép thay đổi trạng thái xuất bản hoặc chỉ số Calo qua endpoint huy hiệu nhanh. Vui lòng sử dụng luồng Phê duyệt xuất bản (/api/recipes/[id]/publish).',
        },
        { status: 403 }
      );
    }

    const { isEditorialReviewed, isCookTested, isNutritionVerified } = body as Record<string, unknown>;

    const [existing] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy công thức.' }, { status: 404 });
    }

    const nextFlags = {
      isEditorialReviewed:
        typeof isEditorialReviewed === 'boolean' ? isEditorialReviewed : existing.isEditorialReviewed,
      isCookTested:
        typeof isCookTested === 'boolean' ? isCookTested : existing.isCookTested,
      isNutritionVerified:
        typeof isNutritionVerified === 'boolean' ? isNutritionVerified : existing.isNutritionVerified,
    };

    // Nếu bài đang PUBLISHED hoặc đang bật các cờ xác minh thực nghiệm / dinh dưỡng, bắt buộc kiểm tra D23 & R7
    if (existing.status === 'PUBLISHED') {
      const flagErrors = validateVerificationFlags(nextFlags, existing);
      if (flagErrors.length > 0) {
        return NextResponse.json({ error: flagErrors.join(' ') }, { status: 422 });
      }
    } else {
      // Với bài chưa PUBLISHED, vẫn kiểm tra điều kiện trung thực của isCookTested (R7) và isNutritionVerified (D23)
      const checkFlags = {
        ...nextFlags,
        // Giả lập đã tích biên tập để chỉ lấy lỗi của R7 / D23 nếu người dùng bật isCookTested hoặc isNutritionVerified
        isEditorialReviewed: nextFlags.isCookTested ? nextFlags.isEditorialReviewed : true,
      };
      const flagErrors = validateVerificationFlags(checkFlags, existing);
      if (flagErrors.length > 0) {
        return NextResponse.json({ error: flagErrors.join(' ') }, { status: 422 });
      }
    }

    const [updated] = await db
      .update(recipes)
      .set({
        isEditorialReviewed: nextFlags.isEditorialReviewed,
        isCookTested: nextFlags.isCookTested,
        isNutritionVerified: nextFlags.isNutritionVerified,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, recipeId))
      .returning({
        id: recipes.id,
        status: recipes.status,
        isEditorialReviewed: recipes.isEditorialReviewed,
        isCookTested: recipes.isCookTested,
        isNutritionVerified: recipes.isNutritionVerified,
        caloriesPerServing: recipes.caloriesPerServing,
      });

    return NextResponse.json({ ok: true, recipe: updated });
  } catch (error) {
    logger.error('Lỗi cập nhật nhanh nhãn công thức', { error: String(error) });
    return NextResponse.json({ error: 'Không thể cập nhật công thức lúc này.' }, { status: 500 });
  }
}
