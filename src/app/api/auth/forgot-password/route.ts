import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isAuthConfigurationValid } from '@/lib/auth/session';
import { createResetToken } from '@/lib/auth/resetToken';
import { sendPasswordResetEmail } from '@/lib/email/mailer';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // Fail-closed nếu AUTH_SECRET chưa hợp lệ
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

  const { email } = body as Record<string, unknown>;

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json(
      { error: 'Vui lòng cung cấp địa chỉ email hợp lệ' },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Tìm người dùng trong DB
    const [existingUser] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    let devResetUrl: string | undefined;

    if (existingUser) {
      const token = await createResetToken(existingUser);
      
      const origin = request.headers.get('origin') || 
                     process.env.NEXT_PUBLIC_APP_URL || 
                     'http://localhost:3000';
      const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

      await sendPasswordResetEmail(existingUser.email, resetUrl);

      if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_RESET_URL === 'true') {
        devResetUrl = resetUrl;
      }
    }

    // Bảo mật Anti-Enumeration: luôn trả về thông điệp thành công chung
    return NextResponse.json({
      ok: true,
      message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn.',
      ...(devResetUrl ? { devResetUrl } : {}),
    });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
