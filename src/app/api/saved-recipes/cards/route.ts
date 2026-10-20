import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes, savedRecipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { queryPublishedRecipeCardsBySlugs } from '@/lib/recipes/publicQueries';

/**
 * POST /api/saved-recipes/cards
 * Lấy danh sách PublicRecipeCard cho danh sách slugs đã lưu (hỗ trợ cả Guest và User đăng nhập).
 * Invariants §5.1: Chỉ trả về các công thức có status = 'PUBLISHED'.
 */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    let targetSlugs: string[] = Array.isArray(body?.slugs)
      ? body.slugs.filter((s: unknown) => typeof s === 'string')
      : [];

    // Nếu không truyền slugs nhưng có user session, lấy slugs từ DB của user
    if (targetSlugs.length === 0 && user) {
      const rows = await db
        .select({ slug: recipes.slug })
        .from(savedRecipes)
        .innerJoin(recipes, eq(savedRecipes.recipeId, recipes.id))
        .where(
          and(
            eq(savedRecipes.userId, user.id),
            eq(recipes.status, 'PUBLISHED')
          )
        );
      targetSlugs = rows.map((r) => r.slug);
    }

    if (targetSlugs.length === 0) {
      return NextResponse.json({ recipes: [] });
    }

    const cards = await queryPublishedRecipeCardsBySlugs(targetSlugs);
    return NextResponse.json({ recipes: cards });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách recipe cards đã lưu:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

/**
 * GET /api/saved-recipes/cards
 * Dành cho User đã đăng nhập lấy danh sách cards các món đã lưu của mình.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ recipes: [] });
  }

  try {
    const rows = await db
      .select({ slug: recipes.slug })
      .from(savedRecipes)
      .innerJoin(recipes, eq(savedRecipes.recipeId, recipes.id))
      .where(
        and(
          eq(savedRecipes.userId, user.id),
          eq(recipes.status, 'PUBLISHED')
        )
      );

    const slugs = rows.map((r) => r.slug);
    const cards = await queryPublishedRecipeCardsBySlugs(slugs);
    return NextResponse.json({ recipes: cards });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách recipe cards của user:', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
