// AG-32: Editorial Report Resolution & Takedown API
// Dành riêng cho EDITOR và ADMIN.
// Invariants Gate P5:
// - Chặn tuyệt đối COOK (HTTP 403).
// - Khi action = 'TAKEDOWN': gỡ công thức về 'NEEDS_CHANGES', lưu moderatorNotes làm lý do.
// - Lưu audit trail: resolvedById = user.id, resolvedAt = new Date().

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import { recipeReports, recipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { PUBLIC_RECIPES_TAG } from '@/lib/recipes/public';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    if (user.role !== 'EDITOR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Ban biên tập và Quản trị viên mới có quyền xử lý báo cáo.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const reportId = Number(id);

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return NextResponse.json({ error: 'ID báo cáo không hợp lệ.' }, { status: 400 });
    }

    const [existingReport] = await db
      .select()
      .from(recipeReports)
      .where(eq(recipeReports.id, reportId))
      .limit(1);

    if (!existingReport) {
      return NextResponse.json({ error: 'Không tìm thấy báo cáo vi phạm.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { status, moderatorNotes = '', action = 'NONE' } = body;

    if (!status || !['RESOLVED', 'DISMISSED'].includes(status)) {
      return NextResponse.json(
        { error: 'Trạng thái xử lý phải là RESOLVED (Đã giải quyết) hoặc DISMISSED (Bác bỏ).' },
        { status: 400 }
      );
    }

    // Thực hiện trong transaction
    await db.transaction(async (tx) => {
      // 1. Cập nhật bản ghi report
      await tx
        .update(recipeReports)
        .set({
          status,
          moderatorNotes: moderatorNotes ? String(moderatorNotes).trim() : null,
          resolvedById: user.id,
          resolvedAt: new Date(),
        })
        .where(eq(recipeReports.id, reportId));

      // 2. Nếu có hành động TAKEDOWN (Gỡ công thức để tác giả sửa)
      if (action === 'TAKEDOWN') {
        await tx
          .update(recipes)
          .set({
            status: 'NEEDS_CHANGES',
            reviewNotes: moderatorNotes ? String(moderatorNotes).trim() : 'Nội dung vi phạm cần chỉnh sửa theo phản ánh của người đọc.',
            updatedAt: new Date(),
          })
          .where(eq(recipes.id, existingReport.recipeId));

        logger.info('Recipe taken down due to report', {
          recipeId: existingReport.recipeId,
          reportId,
          moderatorId: user.id,
        });
      }
    });

    if (action === 'TAKEDOWN') {
      try {
        revalidateTag(PUBLIC_RECIPES_TAG, 'max');
      } catch {
        // Bỏ qua khi chạy ngoài Next runtime (ví dụ script test CLI)
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'TAKEDOWN'
        ? 'Đã xử lý báo cáo và gỡ công thức về trạng thái Yêu cầu sửa đổi (NEEDS_CHANGES) thành công.'
        : `Đã cập nhật trạng thái báo cáo thành ${status}.`,
    });
  } catch (error) {
    logger.error('Error resolving recipe report', { error });
    return NextResponse.json(
      { error: 'Không thể xử lý báo cáo lúc này.' },
      { status: 500 }
    );
  }
}
