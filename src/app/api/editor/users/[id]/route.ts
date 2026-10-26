import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, creatorProfiles } from '@/lib/db/schema';
import { getSessionUser, revokeUserSessions } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { isSameOrigin } from '@/lib/http/sameOrigin';
import { and, eq, ne, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_ROLES = ['ADMIN', 'EDITOR', 'COOK'] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function countOtherAdmins(excludeUserId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role, 'ADMIN'), ne(users.id, excludeUserId)));
  return row?.count ?? 0;
}

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

    const isAdmin = currentUser.role === 'ADMIN';

    // EDITOR chỉ được thao tác trên tài khoản thành viên thường (COOK)
    if (!isAdmin && targetUser.role !== 'COOK') {
      return NextResponse.json(
        { error: 'Biên tập viên chỉ được chỉnh sửa tài khoản thành viên thường (COOK).' },
        { status: 403 }
      );
    }

    const updateValues: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    // Đổi mật khẩu / email / vai trò → vô hiệu hóa mọi phiên đang có của tài khoản đó
    let mustRevokeSessions = false;

    if (typeof displayName === 'string' && displayName.trim().length >= 2) {
      updateValues.displayName = displayName.replace(/[<>]/g, '').trim().slice(0, 50);
    }

    if (typeof email === 'string' && email.trim().toLowerCase() !== targetUser.email) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Chỉ Quản trị viên (ADMIN) mới được đổi email đăng nhập của tài khoản.' },
          { status: 403 }
        );
      }
      const cleanEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 255) {
        return NextResponse.json({ error: 'Địa chỉ email không đúng định dạng.' }, { status: 400 });
      }
      const [duplicate] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, cleanEmail), ne(users.id, targetId)))
        .limit(1);
      if (duplicate) {
        return NextResponse.json(
          { error: 'Email này đã được tài khoản khác sử dụng.' },
          { status: 409 }
        );
      }
      updateValues.email = cleanEmail;
      mustRevokeSessions = true;
    }

    if (
      typeof role === 'string' &&
      VALID_ROLES.includes(role as (typeof VALID_ROLES)[number]) &&
      role !== targetUser.role
    ) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Chỉ Quản trị viên (ADMIN) mới được thay đổi vai trò tài khoản.' },
          { status: 403 }
        );
      }
      if (targetUser.role === 'ADMIN') {
        if (targetId === currentUser.id) {
          return NextResponse.json(
            { error: 'Bạn không thể tự hạ quyền Quản trị viên của chính mình.' },
            { status: 400 }
          );
        }
        if ((await countOtherAdmins(targetId)) === 0) {
          return NextResponse.json(
            { error: 'Không thể hạ quyền Quản trị viên cuối cùng của hệ thống.' },
            { status: 400 }
          );
        }
      }
      updateValues.role = role as (typeof VALID_ROLES)[number];
      mustRevokeSessions = true;
    }

    if (typeof newPassword === 'string' && newPassword.length > 0) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Chỉ Quản trị viên (ADMIN) mới được đặt lại mật khẩu cho tài khoản khác.' },
          { status: 403 }
        );
      }
      if (newPassword.length < 8 || newPassword.length > 100) {
        return NextResponse.json(
          { error: 'Mật khẩu mới phải từ 8 đến 100 ký tự.' },
          { status: 400 }
        );
      }
      updateValues.passwordHash = await hashPassword(newPassword);
      mustRevokeSessions = true;
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

    if (mustRevokeSessions) {
      await revokeUserSessions(targetId);
    }

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

    const [targetUser] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, targetId))
      .limit(1);
    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản.' }, { status: 404 });
    }
    if (targetUser.role === 'ADMIN' && (await countOtherAdmins(targetId)) === 0) {
      return NextResponse.json(
        { error: 'Không thể xóa Quản trị viên cuối cùng của hệ thống.' },
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
