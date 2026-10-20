import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ingredients, recipeIngredients } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

// GET /api/ingredients/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ingredientId = parseInt(id, 10);
    if (isNaN(ingredientId)) {
      return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
    }

    const [item] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.id, ingredientId))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: 'Không tìm thấy nguyên liệu' }, { status: 404 });
    }

    return NextResponse.json({ ingredient: item });
  } catch (error) {
    console.error('Error fetching ingredient:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// PUT /api/ingredients/[id]
export async function PUT(
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
    const ingredientId = parseInt(id, 10);
    if (isNaN(ingredientId)) {
      return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    const { name, category, standardUnit, isPantryStaple } = body;

    const [updated] = await db
      .update(ingredients)
      .set({
        name: name ? name.trim() : undefined,
        category: category || undefined,
        standardUnit: standardUnit || undefined,
        isPantryStaple: typeof isPantryStaple === 'boolean' ? isPantryStaple : undefined,
      })
      .where(eq(ingredients.id, ingredientId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Không tìm thấy nguyên liệu' }, { status: 404 });
    }

    return NextResponse.json({ ingredient: updated });
  } catch (error) {
    console.error('Error updating ingredient:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật nguyên liệu' }, { status: 500 });
  }
}

// DELETE /api/ingredients/[id]
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
    const ingredientId = parseInt(id, 10);
    if (isNaN(ingredientId)) {
      return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
    }

    // Safety check: is this ingredient referenced by any recipe?
    const [usage] = await db
      .select({ id: recipeIngredients.id })
      .from(recipeIngredients)
      .where(eq(recipeIngredients.ingredientId, ingredientId))
      .limit(1);

    if (usage) {
      return NextResponse.json(
        { error: 'Không thể xóa nguyên liệu đang được sử dụng trong các công thức nấu ăn' },
        { status: 409 }
      );
    }

    const [deleted] = await db
      .delete(ingredients)
      .where(eq(ingredients.id, ingredientId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Không tìm thấy nguyên liệu' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: 'Đã xóa nguyên liệu thành công' });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    return NextResponse.json({ error: 'Lỗi xóa nguyên liệu' }, { status: 500 });
  }
}
