import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth/password';
import {
  setSessionCookie,
  signToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  AuthConfigurationError,
  getAuthSecret,
} from '@/lib/auth/session';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    getAuthSecret();

    const rate = await checkRateLimitShared('auth-admin-login', getClientIp(request), 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Quá nhiều lần thử đăng nhập Quản trị. Vui lòng thử lại sau ít phút.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ Email Quản trị viên và Mật khẩu' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Giới hạn theo tài khoản (chặn dò mật khẩu phân tán qua nhiều IP)
    const accountRate = await checkRateLimitShared('auth-admin-login-account', cleanEmail, 10, 15 * 60_000);
    if (!accountRate.allowed) {
      return NextResponse.json(
        { error: 'Tài khoản này đang bị tạm khóa đăng nhập do thử sai nhiều lần. Vui lòng thử lại sau ít phút.' },
        { status: 429, headers: { 'Retry-After': String(accountRate.retryAfterSeconds) } }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Thông tin tài khoản Quản trị hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    let isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid && typeof password === 'string' && password.trim() !== password) {
      isValid = await verifyPassword(password.trim(), user.passwordHash);
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Thông tin tài khoản Quản trị hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    // CHẶN TUYỆT ĐỐI TÀI KHOẢN THƯỜNG (COOK) ĐĂNG NHẬP VÀO CỔNG ADMIN
    if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
      return NextResponse.json(
        {
          error:
            'Từ chối truy cập: Tài khoản thành viên thường (COOK) không được phép đăng nhập vào Cổng Quản Trị Hệ Thống. Chỉ tài khoản Quản trị viên (ADMIN) hoặc Biên tập viên (EDITOR) mới có quyền truy cập.',
        },
        { status: 403 }
      );
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      sv: user.sessionVersion,
    });

    try {
      await setSessionCookie({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        sv: user.sessionVersion,
      });
    } catch {
      // Ignore if outside request context
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
      logger.error('Admin login configuration failure', { reason: error.message });
      return NextResponse.json(
        { error: 'Lỗi cấu hình xác thực hệ thống' },
        { status: 500 }
      );
    }
    logger.error('Admin login error', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trên hệ thống Quản trị' },
      { status: 500 }
    );
  }
}
