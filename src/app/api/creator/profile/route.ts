// R7 — Hồ sơ người nấu của CHÍNH CHỦ.
// GET: xem hồ sơ + bậc uy tín + điều kiện còn thiếu.
// PUT: tạo/sửa slug, giới thiệu, vùng miền, công khai, đồng ý điều khoản người bán.
// Không cho tự đặt identityVerified / isProfessional (chỉ ADMIN).
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { creatorProfiles } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { isSameOrigin } from '@/lib/http/sameOrigin';
import { getOwnCreatorProfile } from '@/lib/creators/queries';
import { parseCreatorProfileInput } from '@/lib/creators/profileInput';
import { isUniqueViolation } from '@/lib/db/errors';
import { revalidateCreatorCaches } from '@/lib/creators/public';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  }
  try {
    const data = await getOwnCreatorProfile(user.id);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    logger.error('[creator/profile GET]', error);
    return NextResponse.json({ error: 'Không thể tải hồ sơ lúc này.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 });
  }
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseCreatorProfileInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const input = parsed.value;
  const now = new Date();

  try {
    const [existing] = await db
      .select({ id: creatorProfiles.id, sellerTermsAcceptedAt: creatorProfiles.sellerTermsAcceptedAt })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, user.id))
      .limit(1);

    // Đồng ý điều khoản là một chiều: đã đồng ý thì giữ mốc thời gian gốc.
    const sellerTermsAcceptedAt = existing?.sellerTermsAcceptedAt ?? (input.acceptSellerTerms ? now : null);

    if (existing) {
      await db
        .update(creatorProfiles)
        .set({
          slug: input.slug,
          bio: input.bio,
          region: input.region,
          isPublic: input.isPublic,
          sellerTermsAcceptedAt,
          updatedAt: now,
        })
        .where(eq(creatorProfiles.id, existing.id));
    } else {
      await db.insert(creatorProfiles).values({
        userId: user.id,
        slug: input.slug,
        bio: input.bio,
        region: input.region,
        isPublic: input.isPublic,
        sellerTermsAcceptedAt,
      });
    }

    revalidateCreatorCaches();
    const data = await getOwnCreatorProfile(user.id);
    return NextResponse.json({ message: 'Đã lưu hồ sơ người nấu.', ...data });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: 'Đường dẫn hồ sơ này đã có người dùng, vui lòng chọn tên khác.' },
        { status: 409 }
      );
    }
    logger.error('[creator/profile PUT]', error);
    return NextResponse.json({ error: 'Không thể lưu hồ sơ lúc này.' }, { status: 500 });
  }
}
