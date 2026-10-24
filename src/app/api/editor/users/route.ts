import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  users,
  recipes,
  savedRecipes,
  mealDiaryEntries,
  mealPlans,
  pantryItems,
  creatorProfiles,
} from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { isSameOrigin } from '@/lib/http/sameOrigin';
import { desc, eq, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['ADMIN', 'EDITOR', 'COOK'] as const;

function isStaff(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để truy cập Quản trị.' }, { status: 401 });
    }
    if (!isStaff(currentUser.role)) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên (ADMIN) và Ban biên tập (EDITOR) mới có quyền xem danh sách tài khoản.' },
        { status: 403 }
      );
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Đếm số lượng hoạt động theo từng userId
    const [recipeCounts, savedCounts, diaryCounts, planCounts, pantryCounts, creators] =
      await Promise.all([
        db
          .select({
            userId: recipes.authorId,
            count: sql<number>`count(*)::int`,
          })
          .from(recipes)
          .groupBy(recipes.authorId),
        db
          .select({
            userId: savedRecipes.userId,
            count: sql<number>`count(*)::int`,
          })
          .from(savedRecipes)
          .groupBy(savedRecipes.userId),
        db
          .select({
            userId: mealDiaryEntries.userId,
            count: sql<number>`count(*)::int`,
          })
          .from(mealDiaryEntries)
          .groupBy(mealDiaryEntries.userId),
        db
          .select({
            userId: mealPlans.userId,
            count: sql<number>`count(*)::int`,
          })
          .from(mealPlans)
          .groupBy(mealPlans.userId),
        db
          .select({
            userId: pantryItems.userId,
            count: sql<number>`count(*)::int`,
          })
          .from(pantryItems)
          .groupBy(pantryItems.userId),
        db.select().from(creatorProfiles),
      ]);

    const recipeMap = new Map(recipeCounts.map((r) => [r.userId, r.count]));
    const savedMap = new Map(savedCounts.map((r) => [r.userId, r.count]));
    const diaryMap = new Map(diaryCounts.map((r) => [r.userId, r.count]));
    const planMap = new Map(planCounts.map((r) => [r.userId, r.count]));
    const pantryMap = new Map(pantryCounts.map((r) => [r.userId, r.count]));
    const creatorMap = new Map(creators.map((c) => [c.userId, c]));

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const enrichedUsers = allUsers.map((u) => {
      const cp = creatorMap.get(u.id);
      return {
        ...u,
        stats: {
          recipesCount: recipeMap.get(u.id) || 0,
          savedCount: savedMap.get(u.id) || 0,
          diaryCount: diaryMap.get(u.id) || 0,
          mealPlansCount: planMap.get(u.id) || 0,
          pantryCount: pantryMap.get(u.id) || 0,
        },
        creator: cp
          ? {
              slug: cp.slug,
              identityVerified: Boolean(cp.identityVerifiedAt),
              isProfessional: cp.isProfessional,
            }
          : null,
      };
    });

    const summary = {
      total: enrichedUsers.length,
      adminCount: enrichedUsers.filter((u) => u.role === 'ADMIN').length,
      editorCount: enrichedUsers.filter((u) => u.role === 'EDITOR').length,
      cookCount: enrichedUsers.filter((u) => u.role === 'COOK').length,
      newLast7Days: enrichedUsers.filter((u) => new Date(u.createdAt).getTime() >= sevenDaysAgo)
        .length,
    };

    return NextResponse.json({
      ok: true,
      currentUser: {
        id: currentUser.id,
        role: currentUser.role,
        email: currentUser.email,
      },
      summary,
      users: enrichedUsers,
    });
  } catch (error) {
    logger.error('Lỗi khi tải danh sách tài khoản Admin', { error: String(error) });
    return NextResponse.json(
      { error: 'Không thể tải danh sách tài khoản lúc này.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Yêu cầu bị từ chối (CSRF).' }, { status: 403 });
    }

    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }
    if (!isStaff(currentUser.role)) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên hoặc Ban biên tập mới được tạo tài khoản từ trang Admin.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { displayName, email, password, role } = body;

    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json({ error: 'Vui lòng nhập họ tên hiển thị.' }, { status: 400 });
    }
    const cleanName = displayName.replace(/[<>]/g, '').trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      return NextResponse.json({ error: 'Họ tên phải từ 2 đến 50 ký tự.' }, { status: 400 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Vui lòng nhập địa chỉ email.' }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 255) {
      return NextResponse.json({ error: 'Địa chỉ email không đúng định dạng.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự.' },
        { status: 400 }
      );
    }

    const targetRole: (typeof VALID_ROLES)[number] = VALID_ROLES.includes(role) ? role : 'COOK';
    // Nếu người đang thao tác chỉ là EDITOR, không cho tạo tài khoản quyền ADMIN
    if (currentUser.role !== 'ADMIN' && targetRole === 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên cao nhất (ADMIN) mới được tạo tài khoản quyền ADMIN.' },
        { status: 403 }
      );
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'Email này đã tồn tại trong hệ thống. Vui lòng chọn email khác.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [created] = await db
      .insert(users)
      .values({
        displayName: cleanName,
        email: cleanEmail,
        passwordHash,
        role: targetRole,
      })
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        createdAt: users.createdAt,
      });

    logger.info('Admin tạo tài khoản mới thành công', {
      byUserId: currentUser.id,
      newUserId: created.id,
      role: created.role,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          ...created,
          stats: {
            recipesCount: 0,
            savedCount: 0,
            diaryCount: 0,
            mealPlansCount: 0,
            pantryCount: 0,
          },
          creator: null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Lỗi khi tạo tài khoản từ Admin', { error: String(error) });
    return NextResponse.json(
      { error: 'Không thể tạo tài khoản lúc này. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
