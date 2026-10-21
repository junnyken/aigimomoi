// R7 — ADMIN xác minh danh tính (thủ công) và đánh dấu "Tiệm/Đầu bếp chuyên nghiệp".
// Chỉ ADMIN; EDITOR không có quyền này. Không lưu số CCCD trong hệ thống.
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { creatorProfiles } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { isSameOrigin } from '@/lib/http/sameOrigin';
import { logger } from '@/lib/logger';
import { revalidateCreatorCaches } from '@/lib/creators/public';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 });
  }
  const admin = await getSessionUser(request);
  if (!admin) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
  }
  if (admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền này.' }, { status: 403 });
  }

  const { userId: rawId } = await context.params;
  const userId = Number(rawId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'ID người dùng không hợp lệ.' }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  const patch: Partial<typeof creatorProfiles.$inferInsert> = {};
  if (typeof body.identityVerified === 'boolean') {
    patch.identityVerifiedAt = body.identityVerified ? new Date() : null;
    patch.identityVerifiedById = body.identityVerified ? admin.id : null;
  }
  if (typeof body.isProfessional === 'boolean') {
    patch.isProfessional = body.isProfessional;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: 'Cần ít nhất một trường: identityVerified hoặc isProfessional (boolean).' },
      { status: 400 }
    );
  }

  try {
    const [updated] = await db
      .update(creatorProfiles)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(creatorProfiles.userId, userId))
      .returning({
        userId: creatorProfiles.userId,
        slug: creatorProfiles.slug,
        identityVerifiedAt: creatorProfiles.identityVerifiedAt,
        isProfessional: creatorProfiles.isProfessional,
      });

    if (!updated) {
      return NextResponse.json({ error: 'Người dùng này chưa tạo hồ sơ người nấu.' }, { status: 404 });
    }

    revalidateCreatorCaches();
    logger.info(`[admin/creators] admin=${admin.id} updated creator user=${userId}`);
    return NextResponse.json({
      creator: {
        userId: updated.userId,
        slug: updated.slug,
        identityVerified: Boolean(updated.identityVerifiedAt),
        isProfessional: updated.isProfessional,
      },
    });
  } catch (error) {
    logger.error('[admin/creators PATCH]', error);
    return NextResponse.json({ error: 'Không thể cập nhật lúc này.' }, { status: 500 });
  }
}
