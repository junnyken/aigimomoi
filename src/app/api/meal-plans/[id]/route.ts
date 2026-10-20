// AG-41: Update & Delete Meal Plan Entry
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mealPlans } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    const { id } = await params;
    const planId = Number(id);
    if (isNaN(planId)) {
      return NextResponse.json({ error: 'ID kế hoạch không hợp lệ.' }, { status: 400 });
    }

    const existing = await db.query.mealPlans.findFirst({
      where: and(
        eq(mealPlans.id, planId),
        eq(mealPlans.userId, user.id)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy kế hoạch hoặc bạn không có quyền sửa.' }, { status: 404 });
    }

    const body = await request.json();
    const { servings, notes, isCompleted, mealType } = body;

    const updates: Partial<typeof mealPlans.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (servings !== undefined && Number(servings) > 0) {
      updates.servings = Number(servings);
    }
    if (notes !== undefined) {
      updates.notes = notes ? String(notes).trim() : null;
    }
    if (isCompleted !== undefined) {
      updates.isCompleted = Boolean(isCompleted);
    }
    if (mealType && ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].includes(mealType)) {
      updates.mealType = mealType;
    }

    const [updated] = await db.update(mealPlans)
      .set(updates)
      .where(eq(mealPlans.id, planId))
      .returning();

    logger.info('Updated meal plan entry', { userId: user.id, planId });
    return NextResponse.json({ success: true, plan: updated });
  } catch (error) {
    logger.error('Error updating meal plan entry', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật kế hoạch.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    const { id } = await params;
    const planId = Number(id);
    if (isNaN(planId)) {
      return NextResponse.json({ error: 'ID kế hoạch không hợp lệ.' }, { status: 400 });
    }

    const existing = await db.query.mealPlans.findFirst({
      where: and(
        eq(mealPlans.id, planId),
        eq(mealPlans.userId, user.id)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy kế hoạch hoặc bạn không có quyền xóa.' }, { status: 404 });
    }

    await db.delete(mealPlans).where(eq(mealPlans.id, planId));
    logger.info('Deleted meal plan entry', { userId: user.id, planId });

    return NextResponse.json({ success: true, message: 'Đã xóa món khỏi kế hoạch.' });
  } catch (error) {
    logger.error('Error deleting meal plan entry', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa món khỏi kế hoạch.' }, { status: 500 });
  }
}
