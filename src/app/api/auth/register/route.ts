import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';
import { setSessionCookie, signToken, SESSION_COOKIE_NAME, SESSION_DURATION_MS, AuthConfigurationError, getAuthSecret } from '@/lib/auth/session';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { sendWelcomeEmail, sendVerificationOtpEmail } from '@/lib/email/mailer';
import { logger } from '@/lib/logger';

// Regex chuẩn kiểm tra cú pháp email cơ bản
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Danh sách mở rộng 120+ tên miền email tạm / 10 phút / dùng 1 lần bị chặn tuyệt đối để chống Spam & Bot
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '10minmail.com',
  '20minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'temp-mail.ru',
  'tempmailo.com',
  'tempmail.net',
  'tempmail.de',
  'tempmail.plus',
  'tempail.com',
  'tempr.email',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'grr.la',
  'pokemail.net',
  'sharklasers.com',
  'spam4.me',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'trashmail.de',
  'trashmail.me',
  'trash-mail.com',
  'getnada.com',
  'nada.email',
  'anonbox.net',
  'maildrop.cc',
  'mohmal.com',
  'mohmal.in',
  'mohmal.tech',
  'fakeinbox.com',
  'fakemail.net',
  'emailfake.com',
  'generator.email',
  'throwawaymail.com',
  'throwaway.email',
  'dispostable.com',
  'emailondeck.com',
  'mintemail.com',
  'mailnesia.com',
  'crazymailing.com',
  'mytemp.email',
  'burnermail.io',
  'inboxkitten.com',
  'harakirimail.com',
  'jetable.org',
  'mailcatch.com',
  'mailexpire.com',
  'mailforspam.com',
  'mailnull.com',
  'mailsac.com',
  'mailshell.com',
  'mailtemp.info',
  'mailtothis.com',
  'mailzilla.com',
  'meltmail.com',
  'mytrashmail.com',
  'GishPuppy.com',
  'nospamfor.us',
  'nowmymail.com',
  'objectmail.com',
  'oneoffemail.com',
  'onewaymail.com',
  'otherinbox.com',
  'pookmail.com',
  'proxymail.eu',
  'quickinbox.com',
  'rcpt.at',
  'Safe-mail.net',
  'selfdestructingmail.com',
  'sendspamhere.com',
  'shiftmail.com',
  'shitmail.me',
  'shortmail.net',
  'sneakemail.com',
  'sofort-mail.de',
  'spamavert.com',
  'spambob.com',
  'spambog.com',
  'spambox.us',
  'spambox.info',
  'spamcero.com',
  'spamday.com',
  'spamex.com',
  'spamfree24.org',
  'spamgourmet.com',
  'spamhole.com',
  'spaml.com',
  'spammotel.com',
  'spamobox.com',
  'spamspot.com',
  'supergreatmail.com',
  'teleworm.us',
  'tempinbox.com',
  'temporarily.de',
  'temporaryemail.net',
  'temporaryinbox.com',
  'thankyou2010.com',
  'thisisnotmyrealemail.com',
  'tmailinator.com',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'wh4f.org',
  'willselfdestruct.com',
  'xoxy.net',
  'zehnminutenmail.de',
  'zippymail.info',
]);

// Chặn theo mẫu từ khóa tên miền mail tạm / mail 10 phút / mail rác
const DISPOSABLE_DOMAIN_PATTERN =
  /(10min|20min|tempmail|temp-mail|trashmail|trash-mail|guerrilla|mailinator|yopmail|throwaway|fakeinbox|fakemail|emailfake|burnermail|disposable|mohmal|getnada|maildrop|spambox|mailnesia|sharklasers|harakirimail|mailsac|inboxkitten|crazymailing|tempail)/i;

export function isDisposableOrSpamEmail(email: string): boolean {
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return true;
  const [localPart, domain] = parts;
  if (!localPart || !domain || !domain.includes('.')) return true;

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  if (DISPOSABLE_DOMAIN_PATTERN.test(domain)) return true;

  // Chặn sub-domain của các dịch vụ mail tạm
  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }

  return false;
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 phút
const OTP_MAX_VERIFY_ATTEMPTS = 5; // số lần nhập mã tối đa cho mỗi email trong 10 phút
const OTP_MAX_SENDS = 3; // số lần gửi mã tối đa cho mỗi email trong 10 phút

type TurnstileCheck = { ok: true } | { ok: false; status: number; error: string };

/**
 * Xác minh Cloudflare Turnstile ở máy chủ. Fail-closed: thiếu token, Cloudflare lỗi hoặc
 * production chưa cấu hình TURNSTILE_SECRET_KEY đều bị từ chối.
 * Chỉ môi trường dev/test chưa cấu hình khóa mới được bỏ qua bước này.
 */
async function verifyTurnstile(token: unknown, ip: string): Promise<TurnstileCheck> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('Thiếu TURNSTILE_SECRET_KEY trong production — chặn đăng ký');
      return {
        ok: false,
        status: 503,
        error: 'Hệ thống xác minh chống Bot đang được bảo trì. Vui lòng thử lại sau.',
      };
    }
    return { ok: true };
  }

  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) {
    return { ok: false, status: 400, error: 'Vui lòng hoàn tất xác minh chống Bot (Cloudflare Turnstile).' };
  }

  try {
    const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    if (!cfRes.ok) throw new Error(`HTTP ${cfRes.status}`);
    const cfData = (await cfRes.json()) as { success?: boolean };
    if (!cfData.success) {
      return {
        ok: false,
        status: 400,
        error: 'Xác thực Cloudflare Turnstile không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.',
      };
    }
    return { ok: true };
  } catch (cfErr) {
    logger.warn('Lỗi kết nối Cloudflare Turnstile siteverify — từ chối (fail-closed)', { error: String(cfErr) });
    return {
      ok: false,
      status: 503,
      error: 'Chưa xác minh được chống Bot do lỗi kết nối. Vui lòng thử lại sau giây lát.',
    };
  }
}

function createSignedOtpToken(email: string, displayName: string, otpCode: string, expiresAt: number): string {
  const secret = getAuthSecret();
  const payload = `${email.toLowerCase()}|${displayName}|${expiresAt}`;
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(`${payload}|${otpCode}`)
    .digest('hex');
  return Buffer.from(JSON.stringify({ email: email.toLowerCase(), displayName, expiresAt, sig: hmac })).toString(
    'base64url'
  );
}

function verifySignedOtpToken(
  token: string,
  email: string,
  displayName: string,
  otpCode: string
): { valid: boolean; reason?: string } {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as {
      email: string;
      displayName: string;
      expiresAt: number;
      sig: string;
    };

    if (!parsed || typeof parsed.expiresAt !== 'number' || typeof parsed.sig !== 'string') {
      return { valid: false, reason: 'Mã phiên xác thực không hợp lệ.' };
    }

    if (Date.now() > parsed.expiresAt) {
      return { valid: false, reason: 'Mã xác nhận OTP đã hết hạn (quá 10 phút). Vui lòng bấm gửi lại mã mới.' };
    }

    if (parsed.email !== email.toLowerCase()) {
      return { valid: false, reason: 'Địa chỉ email không khớp với mã xác nhận đã gửi.' };
    }

    const secret = getAuthSecret();
    const payload = `${email.toLowerCase()}|${displayName}|${parsed.expiresAt}`;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${payload}|${otpCode.trim()}`)
      .digest('hex');

    const a = Buffer.from(parsed.sig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false, reason: 'Mã xác nhận 6 số không chính xác. Vui lòng kiểm tra lại email.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Mã xác nhận không hợp lệ.' };
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    // 1. Kiểm tra cấu hình xác thực trước khi xử lý (fail-closed)
    getAuthSecret();

    const rate = await checkRateLimitShared('auth-register', getClientIp(request), 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau ít phút.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const {
      displayName,
      email,
      password,
      step,
      otpCode,
      otpToken,
      turnstileToken,
      honeypot,
      formElapsedMs,
    } = body;

    // 1.5. Chặn Bot tự động bằng Honeypot ẩn & Thời gian thao tác tối thiểu
    if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
      logger.warn('Chặn Bot đăng ký (dính bẫy Honeypot)', { ip: getClientIp(request) });
      return NextResponse.json(
        { error: 'Hệ thống phát hiện truy cập tự động (Bot). Yêu cầu bị từ chối.' },
        { status: 400 }
      );
    }

    if (typeof formElapsedMs === 'number' && formElapsedMs < 900) {
      return NextResponse.json(
        { error: 'Thao tác quá nhanh bất thường. Vui lòng xác nhận bạn là người thật.' },
        { status: 400 }
      );
    }

    // 2. Validate Họ và tên (Chống XSS / ký tự điều khiển)
    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng nhập họ và tên của bạn' },
        { status: 400 }
      );
    }
    const cleanName = displayName.replace(/[<>]/g, '').trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      return NextResponse.json(
        { error: 'Họ và tên phải từ 2 đến 50 ký tự hợp lệ' },
        { status: 400 }
      );
    }

    // 3. Validate Email & Chặn tuyệt đối Email tạm / Email 10 phút / Email rác
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
    if (isDisposableOrSpamEmail(cleanEmail)) {
      logger.warn('Chặn đăng ký bằng email tạm / email 10 phút', { email: cleanEmail });
      return NextResponse.json(
        {
          error:
            'Hệ thống không chấp nhận email tạm thời / email 10 phút (Temp Mail, Yopmail, 10MinuteMail, Trashmail...). Vui lòng sử dụng email thật (Gmail, Outlook, iCloud, tên miền công ty/trường học) để nhận mã xác nhận.',
        },
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

    // =========================================================================
    // BƯỚC 1: GỬI MÃ XÁC NHẬN OTP 6 SỐ QUA EMAIL (CHƯA CHO VÀO TÀI KHOẢN)
    // =========================================================================
    if (step === 'send-otp') {
      const turnstile = await verifyTurnstile(turnstileToken, getClientIp(request));
      if (!turnstile.ok) {
        return NextResponse.json({ error: turnstile.error }, { status: turnstile.status });
      }

      const sendRate = await checkRateLimitShared('auth-register-otp-send', cleanEmail, OTP_MAX_SENDS, OTP_TTL_MS);
      if (!sendRate.allowed) {
        return NextResponse.json(
          { error: 'Bạn đã yêu cầu gửi mã quá nhiều lần cho email này. Vui lòng thử lại sau ít phút.' },
          { status: 429, headers: { 'Retry-After': String(sendRate.retryAfterSeconds) } }
        );
      }

      const generatedOtp = String(crypto.randomInt(100000, 1000000));
      const expiresAt = Date.now() + OTP_TTL_MS;
      const signedOtpToken = createSignedOtpToken(cleanEmail, cleanName, generatedOtp, expiresAt);

      const mailRes = await sendVerificationOtpEmail(cleanEmail, cleanName, generatedOtp);
      const isProduction = process.env.NODE_ENV === 'production';

      // Production: mã OTP chỉ được đi qua email. Gửi thất bại → báo lỗi, KHÔNG trả mã về trình duyệt.
      if (isProduction && (mailRes.isMock || !mailRes.success)) {
        logger.error('Không gửi được email OTP đăng ký', { email: maskEmail(cleanEmail) });
        return NextResponse.json(
          { error: 'Không gửi được email xác nhận lúc này. Vui lòng thử lại sau ít phút.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          ok: true,
          step: 'OTP_REQUIRED',
          otpToken: signedOtpToken,
          emailMasked: maskEmail(cleanEmail),
          expiresInSeconds: 600,
          smtpConfigured: !mailRes.isMock,
          // Chỉ dev/test chưa gắn SMTP mới hiển thị mã để kiểm thử trọn luồng
          demoOtpCode: !isProduction && mailRes.isMock ? generatedOtp : undefined,
        },
        { status: 200 }
      );
    }

    // =========================================================================
    // BƯỚC 2: BẮT BUỘC XÁC THỰC MÃ OTP 6 SỐ TRƯỚC KHI KÍCH HOẠT TÀI KHOẢN & ĐĂNG NHẬP
    // =========================================================================
    if (!otpCode || typeof otpCode !== 'string' || !otpToken || typeof otpToken !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ mã xác nhận 6 số đã gửi qua email của bạn.' },
        { status: 400 }
      );
    }

    const verifyRate = await checkRateLimitShared(
      'auth-register-otp-verify',
      cleanEmail,
      OTP_MAX_VERIFY_ATTEMPTS,
      OTP_TTL_MS
    );
    if (!verifyRate.allowed) {
      return NextResponse.json(
        { error: 'Bạn đã nhập sai mã quá nhiều lần. Vui lòng đợi ít phút rồi bấm gửi lại mã mới.' },
        { status: 429, headers: { 'Retry-After': String(verifyRate.retryAfterSeconds) } }
      );
    }

    const verifyResult = verifySignedOtpToken(otpToken, cleanEmail, cleanName, otpCode);
    if (!verifyResult.valid) {
      return NextResponse.json(
        { error: verifyResult.reason || 'Mã xác nhận email không chính xác.' },
        { status: 400 }
      );
    }

    // 6. Băm mật khẩu bằng scrypt
    const passwordHash = await hashPassword(password);

    // 7. Tạo bản ghi người dùng mới với role COOK mặc định (chỉ tạo sau khi đã qua bước OTP)
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
      sv: newUser.sessionVersion,
    });

    try {
      await setSessionCookie({
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        sv: newUser.sessionVersion,
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

    // Gửi email chào mừng & xác nhận kích hoạt tài khoản (không chặn luồng phản hồi)
    sendWelcomeEmail(newUser.email, newUser.displayName).catch(() => {});

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
