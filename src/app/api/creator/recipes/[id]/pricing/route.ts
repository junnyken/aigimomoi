// R8 — API Cập nhật giá bán công thức cho Người nấu (D66)
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { getCreatorTierForUser } from '@/lib/creators/queries';
import { validateRecipePrice } from '@/lib/gating/pricing';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { ok: false, message: 'Vui lòng đăng nhập.' },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const recipeId = parseInt(id, 10);
  if (!recipeId || isNaN(recipeId)) {
    return NextResponse.json(
      { ok: false, message: 'ID công thức không hợp lệ.' },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({
      id: recipes.id,
      authorId: recipes.authorId,
      provenance: recipes.provenance,
    })
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { ok: false, message: 'Không tìm thấy công thức.' },
      { status: 404 }
    );
  }

  const isAdmin = sessionUser.role === 'ADMIN';
  const isAuthor = existing.authorId === sessionUser.id;

  if (!isAuthor && !isAdmin) {
    return NextResponse.json(
      { ok: false, message: 'Bạn không có quyền chỉnh sửa giá công thức này.' },
      { status: 403 }
    );
  }

  // Món biên tập Bếp Mom không bao giờ đặt giá
  if (existing.provenance === 'EDITORIAL') {
    return NextResponse.json(
      { ok: false, message: 'Công thức Bếp Mom luôn miễn phí cho mọi người.' },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Dữ liệu JSON không hợp lệ.' },
      { status: 400 }
    );
  }

  const rawPrice = (body as { price?: unknown })?.price;
  const creatorTier = await getCreatorTierForUser(sessionUser.id);
  const validation = validateRecipePrice(rawPrice, creatorTier.tier, sessionUser.role);

  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, message: validation.error },
      { status: 400 }
    );
  }

  const price = validation.normalizedPrice ?? 0;
  const isFree = price === 0;

  await db
    .update(recipes)
    .set({
      price,
      isFree,
      updatedAt: new Date(),
    })
    .where(eq(recipes.id, recipeId));

  return NextResponse.json({
    ok: true,
    price,
    isFree,
    message: isFree ? 'Đã chuyển sang công thức miễn phí.' : `Đã cập nhật giá bán: ${price} đ.`,
  });
}
