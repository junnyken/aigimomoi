import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, creatorProfiles } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { isSameOrigin } from '@/lib/http/sameOrigin';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_ROLES = ['ADMIN', 'EDITOR', 'COOK'] as const;

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Yêu cầu không hợp lệ (CSRF).' }, { status: 403 });
    }

    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'EDITOR') {
      return NextResponse.json({ error: 'Không có quyền thực hiện thao tác này.' }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const targetId = Number(rawId);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ error: 'ID tài khoản không hợp lệ.' }, { status: 400 });
    }

    const [targetUser] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản.' }, { status: 404 });
    }

    const body = await request.json();
    const { displayName, email, role, newPassword, identityVerified, isProfessional } = body;

    const updateValues: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof displayName === 'string' && displayName.trim().length >= 2) {
      updateValues.displayName = displayName.replace(/[<>]/g, '').trim().slice(0, 50);
    }

    if (typeof email === 'string' && email.includes('@')) {
      updateValues.email = email.trim().toLowerCase();
    }

    if (typeof role === 'string' && VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      if (currentUser.role !== 'ADMIN' && (role === 'ADMIN' || targetUser.role === 'ADMIN')) {
        return NextResponse.json(
          { error: 'Chỉ ADMIN mới có quyền thay đổi vai trò Quản trị viên.' },
          { status: 403 }
        );
      }
      updateValues.role = role as (typeof VALID_ROLES)[number];
    }

    if (typeof newPassword === 'string' && newPassword.length > 0) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' },
          { status: 400 }
        );
      }
      updateValues.passwordHash = await hashPassword(newPassword);
    }

    const [updated] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, targetId))
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    // Nếu có cập nhật trạng thái Đầu bếp xác minh (Creator Profile)
    let creatorInfo = null;
    if (typeof identityVerified === 'boolean' || typeof isProfessional === 'boolean') {
      const [existingCreator] = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, targetId))
        .limit(1);

      if (existingCreator) {
        const [upCp] = await db
          .update(creatorProfiles)
          .set({
            identityVerifiedAt:
              typeof identityVerified === 'boolean'
                ? identityVerified
                  ? new Date()
                  : null
                : existingCreator.identityVerifiedAt,
            identityVerifiedById:
              typeof identityVerified === 'boolean'
                ? identityVerified
                  ? currentUser.id
                  : null
                : existingCreator.identityVerifiedById,
            isProfessional:
              typeof isProfessional === 'boolean' ? isProfessional : existingCreator.isProfessional,
            updatedAt: new Date(),
          })
          .where(eq(creatorProfiles.userId, targetId))
          .returning();

        creatorInfo = {
          slug: upCp.slug,
          identityVerified: Boolean(upCp.identityVerifiedAt),
          isProfessional: upCp.isProfessional,
        };
      } else {
        const autoSlug = `bep-${targetId}-${Date.now().toString(36)}`;
        const [newCp] = await db
          .insert(creatorProfiles)
          .values({
            userId: targetId,
            slug: autoSlug,
            bio: `Gian bếp của ${updated.displayName}`,
            identityVerifiedAt: identityVerified ? new Date() : null,
            identityVerifiedById: identityVerified ? currentUser.id : null,
            isProfessional: Boolean(isProfessional),
          })
          .returning();

        creatorInfo = {
          slug: newCp.slug,
          identityVerified: Boolean(newCp.identityVerifiedAt),
          isProfessional: newCp.isProfessional,
        };
      }
    }

    logger.info('Admin cập nhật thông tin tài khoản', {
      byUserId: currentUser.id,
      targetUserId: targetId,
      role: updated.role,
    });

    return NextResponse.json({
      ok: true,
      user: updated,
      creator: creatorInfo,
    });
  } catch (error) {
    logger.error('Lỗi khi cập nhật tài khoản từ Admin', { error: String(error) });
    return NextResponse.json(
      { error: 'Không thể cập nhật tài khoản lúc này.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Yêu cầu không hợp lệ (CSRF).' }, { status: 403 });
    }

    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên (ADMIN) mới có quyền xóa tài khoản.' },
        { status: 403 }
      );
    }

    const { id: rawId } = await context.params;
    const targetId = Number(rawId);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return NextResponse.json({ error: 'ID tài khoản không hợp lệ.' }, { status: 400 });
    }

    if (targetId === currentUser.id) {
      return NextResponse.json(
        { error: 'Bạn không thể tự xóa tài khoản Quản trị viên đang đăng nhập của chính mình.' },
        { status: 400 }
      );
    }

    await db.delete(users).where(eq(users.id, targetId));

    logger.info('Admin đã xóa tài khoản', {
      byUserId: currentUser.id,
      deletedUserId: targetId,
    });

    return NextResponse.json({ ok: true, deletedId: targetId });
  } catch (error) {
    logger.error('Lỗi khi xóa tài khoản từ Admin', { error: String(error) });
    return NextResponse.json(
      { error: 'Không thể xóa tài khoản lúc này.' },
      { status: 500 }
    );
  }
}
