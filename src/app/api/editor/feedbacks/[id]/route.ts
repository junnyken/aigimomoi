// AG-34: Editorial Feedback Moderation API (Approve / Reject)
// Cho phép EDITOR hoặc ADMIN duyệt hoặc từ chối phản hồi/ảnh của người nấu

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipeCookedFeedbacks } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    if (user.role !== 'EDITOR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Ban biên tập và Quản trị viên mới có quyền duyệt phản hồi.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const feedbackId = Number(id);

    if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
      return NextResponse.json({ error: 'ID phản hồi không hợp lệ.' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(recipeCookedFeedbacks)
      .where(eq(recipeCookedFeedbacks.id, feedbackId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy phản hồi yêu cầu.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { status } = body;

    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { error: 'Trạng thái không hợp lệ. Chọn APPROVED, REJECTED hoặc PENDING.' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(recipeCookedFeedbacks)
      .set({
        status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        approvedById: status === 'APPROVED' ? user.id : null,
      })
      .where(eq(recipeCookedFeedbacks.id, feedbackId))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái phản hồi sang ${status}.`,
      feedback: updated,
    });
  } catch (error) {
    logger.error('Error updating cooked feedback status', { error });
    return NextResponse.json(
      { error: 'Không thể cập nhật phản hồi lúc này.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
}
