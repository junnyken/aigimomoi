import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth/password';
import { setSessionCookie, AuthConfigurationError, getAuthSecret } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra cấu hình xác thực trước khi xử lý (fail-closed)
    getAuthSecret();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ email và mật khẩu' },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Set signed HttpOnly session cookie
    await setSessionCookie({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      logger.error('Login configuration failure: AUTH_SECRET issue', {
        reason: error.message,
      });
      return NextResponse.json(
        { error: 'Lỗi cấu hình xác thực hệ thống' },
        { status: 500 }
      );
    }
    logger.error('Login error', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trên hệ thống' },
      { status: 500 }
    );
  }
}
