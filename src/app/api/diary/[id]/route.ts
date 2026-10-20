// AG-37: Delete specific diary entry
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mealDiaryEntries } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    const { id } = await context.params;
    const entryId = Number(id);

    if (!Number.isInteger(entryId) || entryId <= 0) {
      return NextResponse.json({ error: 'ID bản ghi không hợp lệ.' }, { status: 400 });
    }

    // Chỉ xóa nếu thuộc về chính user này (Quyền riêng tư)
    const [deleted] = await db
      .delete(mealDiaryEntries)
      .where(
        and(
          eq(mealDiaryEntries.id, entryId),
          eq(mealDiaryEntries.userId, user.id)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi hoặc không có quyền xóa.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa món ăn khỏi nhật ký.',
    });
  } catch (error) {
    logger.error('Error deleting meal diary entry:', error);
    return NextResponse.json({ error: 'Không thể xóa bản ghi lúc này.' }, { status: 500 });
  }
}
