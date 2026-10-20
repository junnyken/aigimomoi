import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes, savedRecipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';

/**
 * GET /api/saved-recipes
 * Lấy danh sách slugs các món đã lưu của user hiện tại.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ savedSlugs: [] });
  }

  const rows = await db
    .select({
      slug: recipes.slug,
    })
    .from(savedRecipes)
    .innerJoin(recipes, eq(savedRecipes.recipeId, recipes.id))
    .where(
      and(
        eq(savedRecipes.userId, user.id),
        eq(recipes.status, 'PUBLISHED') // Invariants §5.1: Chỉ lấy công thức PUBLISHED
      )
    );

  return NextResponse.json({
    savedSlugs: rows.map((r) => r.slug),
  });
}

/**
 * POST /api/saved-recipes
 * Lưu một món ăn vào tài khoản.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const slug = typeof body?.slug === 'string' ? body.slug.trim() : null;
    if (!slug) {
      return NextResponse.json({ error: 'Thiếu slug công thức' }, { status: 400 });
    }

    const recipe = await db.query.recipes.findFirst({
      where: and(eq(recipes.slug, slug), eq(recipes.status, 'PUBLISHED')),
      columns: { id: true, slug: true },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Không tìm thấy công thức công khai' }, { status: 404 });
    }

    await db
      .insert(savedRecipes)
      .values({
        userId: user.id,
        recipeId: recipe.id,
      })
      .onConflictDoNothing();

    return NextResponse.json({ success: true, saved: true, slug });
  } catch (err) {
    console.error('Lỗi khi lưu món ăn:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

/**
 * DELETE /api/saved-recipes
 * Bỏ lưu một món ăn khỏi tài khoản.
 */
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let slug = searchParams.get('slug');

    if (!slug) {
      const body = await req.json().catch(() => null);
      if (typeof body?.slug === 'string') slug = body.slug;
    }

    if (!slug) {
      return NextResponse.json({ error: 'Thiếu slug công thức' }, { status: 400 });
    }

    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.slug, slug),
      columns: { id: true },
    });

    if (recipe) {
      await db
        .delete(savedRecipes)
        .where(and(eq(savedRecipes.userId, user.id), eq(savedRecipes.recipeId, recipe.id)));
    }

    return NextResponse.json({ success: true, saved: false, slug });
  } catch (err) {
    console.error('Lỗi khi bỏ lưu món ăn:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
