import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';
import { setSessionCookie, signToken, SESSION_COOKIE_NAME, SESSION_DURATION_MS, AuthConfigurationError, getAuthSecret } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

// Regex chuẩn kiểm tra cú pháp email cơ bản
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    // 1. Kiểm tra cấu hình xác thực trước khi xử lý (fail-closed)
    getAuthSecret();

    const body = await request.json();
    const { displayName, email, password } = body;

    // 2. Validate Họ và tên
    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng nhập họ và tên của bạn' },
        { status: 400 }
      );
    }
    const cleanName = displayName.trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      return NextResponse.json(
        { error: 'Họ và tên phải từ 2 đến 50 ký tự' },
        { status: 400 }
      );
    }

    // 3. Validate Email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng nhập địa chỉ email hợp lệ' },
        { status: 400 }
      );
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 255) {
      return NextResponse.json(
        { error: 'Địa chỉ email không đúng định dạng' },
        { status: 400 }
      );
    }

    // 4. Validate Mật khẩu
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng nhập mật khẩu' },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự' },
        { status: 400 }
      );
    }
    if (password.length > 100) {
      return NextResponse.json(
        { error: 'Mật khẩu không được vượt quá 100 ký tự' },
        { status: 400 }
      );
    }

    // 5. Kiểm tra email đã tồn tại chưa
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' },
        { status: 409 }
      );
    }

    // 6. Băm mật khẩu bằng scrypt
    const passwordHash = await hashPassword(password);

    // 7. Tạo bản ghi người dùng mới với role COOK mặc định
    const [newUser] = await db
      .insert(users)
      .values({
        email: cleanEmail,
        displayName: cleanName,
        passwordHash,
        role: 'COOK',
      })
      .returning();

    // 8. Ký token phiên đăng nhập
    const token = await signToken({
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role,
    });

    try {
      await setSessionCookie({
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
      });
    } catch {
      // In case outside request scope
    }

    const response = NextResponse.json(
      {
        ok: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    });

    logger.info('Đăng ký tài khoản thành công', { userId: newUser.id, email: newUser.email });

    return response;
  } catch (error: unknown) {
    if (error instanceof AuthConfigurationError) {
      logger.error('Đăng ký thất bại do cấu hình auth chưa sẵn sàng', { error: error.message });
      return NextResponse.json(
        { error: 'Hệ thống xác thực tạm thời chưa sẵn sàng. Vui lòng thử lại sau.' },
        { status: 503 }
      );
    }

    logger.error('Lỗi không xác định khi đăng ký', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
