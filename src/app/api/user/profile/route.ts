import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser, setSessionCookie, SESSION_COOKIE_NAME, SESSION_DURATION_MS, signToken } from '@/lib/auth/session';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';

export async function GET(request?: Request) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json(
      { error: 'Vui lòng đăng nhập để xem thông tin tài khoản' },
      { status: 401 }
    );
  }

  try {
    const [profile] = await db
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
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'Tài khoản không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role,
        avatarUrl: profile.avatarUrl,
        createdAt: profile.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Get Profile Error]', error);
    return NextResponse.json(
      { error: 'Không thể tải thông tin tài khoản' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (isCrossSiteRequest(request)) {
    return NextResponse.json(
      { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
      { status: 403 }
    );
  }
  const sessionUser = await getSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json(
      { error: 'Vui lòng đăng nhập để thực hiện thay đổi' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Dữ liệu yêu cầu không hợp lệ' },
      { status: 400 }
    );
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json(
      { error: 'Dữ liệu không đúng định dạng' },
      { status: 400 }
    );
  }

  const { displayName } = body as Record<string, unknown>;

  if (typeof displayName !== 'string' || displayName.replace(/[<>]/g, '').trim().length < 2) {
    return NextResponse.json(
      { error: 'Tên hiển thị phải có ít nhất 2 ký tự hợp lệ' },
      { status: 400 }
    );
  }

  const cleanDisplayName = displayName.replace(/[<>]/g, '').trim();

  if (cleanDisplayName.length > 50) {
    return NextResponse.json(
      { error: 'Tên hiển thị không được vượt quá 50 ký tự' },
      { status: 400 }
    );
  }

  try {
    await db
      .update(users)
      .set({
        displayName: cleanDisplayName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, sessionUser.id));

    // Cập nhật lại cookie phiên với displayName mới
    const updatedPayload = {
      id: sessionUser.id,
      email: sessionUser.email,
      displayName: cleanDisplayName,
      role: sessionUser.role,
    };

    const token = await signToken(updatedPayload);
    const response = NextResponse.json({
      ok: true,
      message: 'Cập nhật thông tin thành công',
      user: updatedPayload,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    });

    try {
      await setSessionCookie(updatedPayload);
    } catch {}

    return response;
  } catch (error) {
    console.error('[Update Profile Error]', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật thông tin' },
      { status: 500 }
    );
  }
}
