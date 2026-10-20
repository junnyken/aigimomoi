import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isSameOrigin } from '@/lib/http/sameOrigin';
import { publishRecipe, PublishingError } from '@/lib/recipes/publishing';
import { revalidateTag } from 'next/cache';
import { PUBLIC_RECIPES_TAG } from '@/lib/recipes/public';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/recipes/[id]/publish — chỉ ADMIN (D31)
export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ (origin)' }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Chỉ Quản trị viên (ADMIN) được phê duyệt xuất bản' },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const recipeId = Number(id);
  if (!Number.isInteger(recipeId) || recipeId <= 0) {
    return NextResponse.json({ error: 'ID công thức không hợp lệ' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ' }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const keys = ['isEditorialReviewed', 'isCookTested', 'isNutritionVerified'] as const;
  for (const k of keys) {
    if (typeof b[k] !== 'boolean') {
      return NextResponse.json({ error: `Trường ${k} phải là boolean` }, { status: 400 });
    }
  }

  try {
    const recipe = await publishRecipe(recipeId, user.id, {
      isEditorialReviewed: b.isEditorialReviewed as boolean,
      isCookTested: b.isCookTested as boolean,
      isNutritionVerified: b.isNutritionVerified as boolean,
    });
    // AG-16: trang công khai + redirect từ bản ARCHIVED phải phản ánh ngay bản vừa duyệt
    revalidateTag(PUBLIC_RECIPES_TAG, { expire: 0 });
    return NextResponse.json({ recipe });
  } catch (error) {
    if (error instanceof PublishingError) {
      return NextResponse.json({ error: error.message, ...error.details }, { status: error.status });
    }
    console.error('Error publishing recipe');
    return NextResponse.json({ error: 'Không thể xuất bản công thức' }, { status: 500 });
  }
}
