import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes, savedRecipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';

/**
 * POST /api/saved-recipes/sync
 * Nhận danh sách slugs từ localStorage của khách và đồng bộ vào DB khi đăng nhập.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const slugs: string[] = Array.isArray(body?.slugs) ? body.slugs.filter((s: unknown) => typeof s === 'string') : [];

    if (slugs.length === 0) {
      return NextResponse.json({ success: true, syncedCount: 0 });
    }

    // Lấy ID các recipes PUBLISHED tương ứng
    const validRecipes = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(
        and(
          inArray(recipes.slug, slugs.slice(0, 100)), // Giới hạn tối đa 100 món
          eq(recipes.status, 'PUBLISHED')
        )
      );

    if (validRecipes.length === 0) {
      return NextResponse.json({ success: true, syncedCount: 0 });
    }

    // Insert onConflictDoNothing
    await db
      .insert(savedRecipes)
      .values(
        validRecipes.map((r) => ({
          userId: user.id,
          recipeId: r.id,
        }))
      )
      .onConflictDoNothing();

    return NextResponse.json({
      success: true,
      syncedCount: validRecipes.length,
    });
  } catch (err) {
    console.error('Lỗi khi đồng bộ món đã lưu:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
