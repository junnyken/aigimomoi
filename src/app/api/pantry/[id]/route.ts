// AG-40: Pantry Item Detail API (Update & Delete)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pantryItems } from '@/lib/db/schema';
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
    const itemId = Number(id);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'ID thực phẩm không hợp lệ.' }, { status: 400 });
    }

    const existing = await db.query.pantryItems.findFirst({
      where: and(
        eq(pantryItems.id, itemId),
        eq(pantryItems.userId, user.id)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy thực phẩm hoặc bạn không có quyền sửa.' }, { status: 404 });
    }

    const body = await request.json();
    const { customName, quantity, unit, location, expiresAt, notes } = body;

    const updates: Partial<typeof pantryItems.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (customName && typeof customName === 'string') {
      updates.customName = customName.trim();
    }
    if (quantity !== undefined && Number(quantity) > 0) {
      updates.quantity = Number(quantity);
    }
    if (unit && typeof unit === 'string') {
      updates.unit = unit.trim();
    }
    if (location && ['FRIDGE', 'FREEZER', 'DRY_PANTRY'].includes(location)) {
      updates.location = location;
    }
    if (expiresAt !== undefined) {
      if (expiresAt === null) {
        updates.expiresAt = null;
      } else {
        const d = new Date(expiresAt);
        if (!isNaN(d.getTime())) {
          updates.expiresAt = d;
        }
      }
    }
    if (notes !== undefined) {
      updates.notes = notes ? String(notes).trim() : null;
    }

    const [updated] = await db.update(pantryItems)
      .set(updates)
      .where(eq(pantryItems.id, itemId))
      .returning();

    logger.info('Updated pantry item', { userId: user.id, itemId });
    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    logger.error('Error updating pantry item', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật thực phẩm.' }, { status: 500 });
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
    const itemId = Number(id);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'ID thực phẩm không hợp lệ.' }, { status: 400 });
    }

    const existing = await db.query.pantryItems.findFirst({
      where: and(
        eq(pantryItems.id, itemId),
        eq(pantryItems.userId, user.id)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy thực phẩm hoặc bạn không có quyền xóa.' }, { status: 404 });
    }

    await db.delete(pantryItems).where(eq(pantryItems.id, itemId));
    logger.info('Deleted pantry item', { userId: user.id, itemId });

    return NextResponse.json({ success: true, message: 'Đã xóa thực phẩm khỏi kho.' });
  } catch (error) {
    logger.error('Error deleting pantry item', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa thực phẩm.' }, { status: 500 });
  }
}
