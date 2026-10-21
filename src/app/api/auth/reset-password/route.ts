import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isAuthConfigurationValid } from '@/lib/auth/session';
import { extractResetTokenUserId, verifyResetToken } from '@/lib/auth/resetToken';
import { hashPassword } from '@/lib/auth/password';

export async function POST(request: Request) {
  if (!isAuthConfigurationValid()) {
    return NextResponse.json(
      { error: 'Hệ thống xác thực chưa được cấu hình sẵn sàng' },
      { status: 503 }
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

  const { token, newPassword } = body as Record<string, unknown>;

  if (typeof token !== 'string' || token.trim().length === 0) {
    return NextResponse.json(
      { error: 'Mã xác thực đặt lại mật khẩu không hợp lệ' },
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
      { error: 'Mật khẩu quá dài (tối đa 100 ký tự)' },
      { status: 400 }
    );
  }

  const userId = extractResetTokenUserId(token);
  if (!userId) {
    return NextResponse.json(
      { error: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (15 phút)' },
      { status: 400 }
    );
  }

  try {
    // Lấy thông tin user hiện tại
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Tài khoản không tồn tại hoặc đã bị xóa' },
        { status: 400 }
      );
    }

    // Xác thực token với hash mật khẩu hiện tại (chống tái sử dụng - single use)
    const verification = await verifyResetToken(token, user.passwordHash);
    if (!verification) {
      return NextResponse.json(
        { error: 'Liên kết đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng trước đó' },
        { status: 400 }
      );
    }

    // Băm mật khẩu mới an toàn
    const newHash = await hashPassword(newPassword);

    // Cập nhật CSDL
    await db
      .update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      ok: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.',
    });
  } catch (error) {
    console.error('[Reset Password Error]', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật mật khẩu. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
