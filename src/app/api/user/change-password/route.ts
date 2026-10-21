import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUser, setSessionCookie } from '@/lib/auth/session';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';

export async function POST(request: Request) {
  if (isCrossSiteRequest(request)) {
    return NextResponse.json({ error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' }, { status: 403 });
  }
  const sessionUser = await getSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json(
      { error: 'Vui lòng đăng nhập để đổi mật khẩu' },
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

  const { currentPassword, newPassword } = body as Record<string, unknown>;

  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    return NextResponse.json(
      { error: 'Vui lòng nhập mật khẩu hiện tại' },
      { status: 400 }
    );
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Mật khẩu mới phải có tối thiểu 8 ký tự' },
      { status: 400 }
    );
  }

  if (newPassword.length > 100) {
    return NextResponse.json(
      { error: 'Mật khẩu mới không được vượt quá 100 ký tự' },
      { status: 400 }
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' },
      { status: 400 }
    );
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Tài khoản không hợp lệ hoặc chưa thiết lập mật khẩu' },
        { status: 400 }
      );
    }

    // Xác thực mật khẩu hiện tại
    const isCurrentPasswordCorrect = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordCorrect) {
      return NextResponse.json(
        { error: 'Mật khẩu hiện tại không chính xác' },
        { status: 400 }
      );
    }

    // Băm và lưu mật khẩu mới
    const newHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      ok: true,
      message: 'Đổi mật khẩu thành công! Hãy dùng mật khẩu mới trong các lần đăng nhập tiếp theo.',
    });
  } catch (error) {
    console.error('[Change Password Error]', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi thay đổi mật khẩu. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
