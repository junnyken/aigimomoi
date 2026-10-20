import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isSameOrigin } from '@/lib/http/sameOrigin';
import { rejectRecipe, PublishingError } from '@/lib/recipes/publishing';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/recipes/[id]/reject — chỉ ADMIN (D31)
export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ (origin)' }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Chỉ Quản trị viên (ADMIN) được từ chối / yêu cầu sửa' },
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

  const notes = (body as Record<string, unknown> | null)?.notes;
  if (typeof notes !== 'string') {
    return NextResponse.json({ error: 'Thiếu ghi chú góp ý (notes)' }, { status: 400 });
  }

  try {
    const recipe = await rejectRecipe(recipeId, user.id, notes);
    return NextResponse.json({ recipe });
  } catch (error) {
    if (error instanceof PublishingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error rejecting recipe');
    return NextResponse.json({ error: 'Không thể cập nhật trạng thái duyệt' }, { status: 500 });
  }
}
