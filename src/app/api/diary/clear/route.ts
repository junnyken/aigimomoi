// AG-38: Family Meal Diary Privacy & Clear Policy (Right to be Forgotten)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mealDiaryEntries } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    const deleted = await db
      .delete(mealDiaryEntries)
      .where(eq(mealDiaryEntries.userId, user.id))
      .returning();

    logger.info(`Cleared ${deleted.length} diary entries for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Đã xóa toàn bộ ${deleted.length} bản ghi nhật ký ăn uống của tài khoản.`,
    });
  } catch (error) {
    logger.error('Error clearing meal diary:', error);
    return NextResponse.json({ error: 'Không thể xóa dữ liệu lúc này.' }, { status: 500 });
  }
}
