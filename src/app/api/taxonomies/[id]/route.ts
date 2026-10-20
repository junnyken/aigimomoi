import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { taxonomies, recipeTags } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

// DELETE /api/taxonomies/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json(
        { error: 'Yêu cầu quyền Biên tập viên (EDITOR) hoặc Quản trị viên (ADMIN)' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const taxonomyId = parseInt(id, 10);
    if (isNaN(taxonomyId)) {
      return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
    }

    // Safety check: is this taxonomy tag used by any recipe?
    const [usage] = await db
      .select({ recipeId: recipeTags.recipeId })
      .from(recipeTags)
      .where(eq(recipeTags.taxonomyId, taxonomyId))
      .limit(1);

    if (usage) {
      return NextResponse.json(
        { error: 'Không thể xóa phân loại đang được gắn vào các công thức nấu ăn' },
        { status: 409 }
      );
    }

    const [deleted] = await db
      .delete(taxonomies)
      .where(eq(taxonomies.id, taxonomyId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Không tìm thấy phân loại' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: 'Đã xóa phân loại thành công' });
  } catch (error) {
    console.error('Error deleting taxonomy:', error);
    return NextResponse.json({ error: 'Lỗi xóa phân loại' }, { status: 500 });
  }
}
