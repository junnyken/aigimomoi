// R8 — API Quản lý Bộ công thức (Bundles / Combo món) cho Người nấu (D66)
import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipeBundles, recipeBundleItems, recipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getCreatorTierForUser } from '@/lib/creators/queries';
import { validateBundlePricing } from '@/lib/gating/pricing';
import { suggestCreatorSlug } from '@/lib/creators/tier';

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ ok: false, message: 'Vui lòng đăng nhập.' }, { status: 401 });
  }

  const bundles = await db
    .select({
      id: recipeBundles.id,
      slug: recipeBundles.slug,
      title: recipeBundles.title,
      description: recipeBundles.description,
      price: recipeBundles.price,
      status: recipeBundles.status,
      createdAt: recipeBundles.createdAt,
    })
    .from(recipeBundles)
    .where(eq(recipeBundles.creatorId, sessionUser.id));

  return NextResponse.json({ ok: true, bundles });
}

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ ok: false, message: 'Vui lòng đăng nhập.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Dữ liệu JSON không hợp lệ.' }, { status: 400 });
  }

  const payload = body as {
    title?: string;
    description?: string;
    price?: unknown;
    recipeIds?: number[];
  };

  const title = (payload.title ?? '').trim();
  if (title.length < 3 || title.length > 100) {
    return NextResponse.json(
      { ok: false, message: 'Tên bộ công thức phải từ 3 đến 100 ký tự.' },
      { status: 400 }
    );
  }

  const recipeIds = Array.isArray(payload.recipeIds)
    ? Array.from(new Set(payload.recipeIds.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0)))
    : [];

  const creatorTier = await getCreatorTierForUser(sessionUser.id);
  const validation = validateBundlePricing(
    payload.price,
    recipeIds.length,
    creatorTier.tier,
    sessionUser.role
  );

  if (!validation.ok) {
    return NextResponse.json({ ok: false, message: validation.error }, { status: 400 });
  }

  // Xác thực các món ăn có thuộc về người này không
  const matchedRecipes = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(
      and(
        inArray(recipes.id, recipeIds),
        sessionUser.role === 'ADMIN' ? undefined : eq(recipes.authorId, sessionUser.id)
      )
    );

  if (matchedRecipes.length !== recipeIds.length) {
    return NextResponse.json(
      { ok: false, message: 'Một số công thức trong bộ không hợp lệ hoặc không thuộc quyền sở hữu của bạn.' },
      { status: 400 }
    );
  }

  const baseSlug = suggestCreatorSlug(title) || 'bo-cong-thuc';
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const price = validation.normalizedPrice ?? 30000;

  const [newBundle] = await db
    .insert(recipeBundles)
    .values({
      creatorId: sessionUser.id,
      slug,
      title,
      description: payload.description ? payload.description.trim() : null,
      price,
      status: 'PUBLISHED',
    })
    .returning();

  // Thêm các món vào bundle
  const itemValues = recipeIds.map((recipeId, idx) => ({
    bundleId: newBundle.id,
    recipeId,
    orderIndex: idx,
  }));

  await db.insert(recipeBundleItems).values(itemValues);

  return NextResponse.json({
    ok: true,
    message: 'Tạo bộ công thức thành công!',
    bundle: newBundle,
  });
}
