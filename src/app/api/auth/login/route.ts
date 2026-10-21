import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth/password';
import { setSessionCookie, signToken, SESSION_COOKIE_NAME, SESSION_DURATION_MS, AuthConfigurationError, getAuthSecret } from '@/lib/auth/session';
import { checkRateLimit, getClientIp } from '@/lib/auth/rateLimit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra cấu hình xác thực trước khi xử lý (fail-closed)
    getAuthSecret();

    const rate = checkRateLimit('auth-login', getClientIp(request), 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ít phút.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

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
    const token = await signToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });

    try {
      await setSessionCookie({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      });
    } catch {
      // In case outside request scope
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    });

    return response;
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
