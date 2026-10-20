import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { isSameOrigin } from '@/lib/http/sameOrigin';
import { createRevision, PublishingError } from '@/lib/recipes/publishing';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/recipes/[id]/revisions — EDITOR hoặc ADMIN
export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ (origin)' }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
    return NextResponse.json(
      { error: 'Yêu cầu quyền Biên tập viên (EDITOR) hoặc Quản trị viên (ADMIN)' },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const recipeId = Number(id);
  if (!Number.isInteger(recipeId) || recipeId <= 0) {
    return NextResponse.json({ error: 'ID công thức không hợp lệ' }, { status: 400 });
  }

  try {
    const revision = await createRevision(recipeId);
    return NextResponse.json({ recipe: revision }, { status: 201 });
  } catch (error) {
    if (error instanceof PublishingError) {
      return NextResponse.json({ error: error.message, ...error.details }, { status: error.status });
    }
    console.error('Error creating recipe revision');
    return NextResponse.json({ error: 'Không thể tạo bản sửa đổi' }, { status: 500 });
  }
}
