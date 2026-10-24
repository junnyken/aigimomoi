import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { isSameOrigin } from '@/lib/http/sameOrigin';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES = ['DRAFT', 'SUBMITTED', 'PUBLISHED', 'NEEDS_CHANGES', 'ARCHIVED'] as const;

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Yêu cầu không hợp lệ (CSRF).' }, { status: 403 });
    }

    const user = await getSessionUser(request);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên / Biên tập viên mới có quyền này.' }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const recipeId = Number(rawId);
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ.' }, { status: 400 });
    }

    const body = await request.json();
    const {
      isEditorialReviewed,
      isCookTested,
      isNutritionVerified,
      status,
      caloriesPerServing,
    } = body;

    const patch: Partial<typeof recipes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof isEditorialReviewed === 'boolean') {
      patch.isEditorialReviewed = isEditorialReviewed;
    }
    if (typeof isCookTested === 'boolean') {
      patch.isCookTested = isCookTested;
    }
    if (typeof isNutritionVerified === 'boolean') {
      patch.isNutritionVerified = isNutritionVerified;
    }
    if (typeof caloriesPerServing === 'number' && caloriesPerServing >= 0) {
      patch.caloriesPerServing = Math.round(caloriesPerServing);
    }
    if (typeof status === 'string' && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      patch.status = status as (typeof VALID_STATUSES)[number];
      if (status === 'PUBLISHED') {
        patch.publishedAt = new Date();
      }
    }

    const [updated] = await db
      .update(recipes)
      .set(patch)
      .where(eq(recipes.id, recipeId))
      .returning({
        id: recipes.id,
        status: recipes.status,
        isEditorialReviewed: recipes.isEditorialReviewed,
        isCookTested: recipes.isCookTested,
        isNutritionVerified: recipes.isNutritionVerified,
        caloriesPerServing: recipes.caloriesPerServing,
      });

    if (!updated) {
      return NextResponse.json({ error: 'Không tìm thấy công thức.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, recipe: updated });
  } catch (error) {
    logger.error('Lỗi cập nhật nhanh nhãn công thức', { error: String(error) });
    return NextResponse.json({ error: 'Không thể cập nhật công thức lúc này.' }, { status: 500 });
  }
}
