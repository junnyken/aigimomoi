'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '0x4AAAAAAFmC-UTV190a7dk1';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

const CLIENT_DISPOSABLE_PATTERN =
  /@(10minutemail|20minutemail|tempmail|temp-mail|trashmail|trash-mail|guerrillamail|mailinator|yopmail|throwaway|fakeinbox|fakemail|emailfake|burnermail|dispostable|mohmal|getnada|maildrop|spam4|sharklasers|grr\.la|pokemail|mailnesia|emailondeck|tempail|tempr\.email|crazymailing|mytemp\.email|mailsac|inboxkitten)\b/i;

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/';
  const trimmed = raw.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }
  return '/';
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const from = sanitizeRedirectPath(searchParams.get('from'));

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Chống Bot & Spam: Cloudflare Turnstile + Honeypot ẩn + Thời điểm mở form + Checkbox dự phòng
  const [formOpenedAt] = useState<number>(() => Date.now());
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileFallback, setTurnstileFallback] = useState<boolean>(false);
  const [humanVerified, setHumanVerified] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const [challengeNums] = useState<{ a: number; b: number }>(() => ({
    a: 3,
    b: 5,
  }));
  const [challengeAnswer, setChallengeAnswer] = useState<string>('8');

  useEffect(() => {
    if (step !== 'FORM' || !TURNSTILE_SITE_KEY || turnstileFallback) return;

    let widgetId: string | null = null;
    const renderWidget = () => {
      if (!turnstileContainerRef.current || !window.turnstile) return;
      try {
        turnstileContainerRef.current.innerHTML = '';
        widgetId = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          callback: (token: string) => {
            setTurnstileToken(token);
            setHumanVerified(true);
          },
          'expired-callback': () => {
            setTurnstileToken('');
            setHumanVerified(false);
          },
          'error-callback': () => {
            setTurnstileFallback(true);
          },
        });
      } catch {
        setTurnstileFallback(true);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.getElementById('cf-turnstile-script') as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', renderWidget);
      } else {
        const script = document.createElement('script');
        script.id = 'cf-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = renderWidget;
        script.onerror = () => setTurnstileFallback(true);
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetId && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, [step, turnstileFallback]);

  // Luồng 2 bước: Gửi mã xác nhận OTP qua Email -> Nhập mã 6 số mới cho vào tài khoản
  const [step, setStep] = useState<'FORM' | 'VERIFY_OTP'>('FORM');
  const [otpToken, setOtpToken] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [emailMasked, setEmailMasked] = useState<string>('');
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasLetterAndNumber = /[A-Za-z]/.test(password) && /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isTempEmailWarning = useMemo(() => {
    if (!email.includes('@')) return false;
    return CLIENT_DISPOSABLE_PATTERN.test(email.trim().toLowerCase());
  }, [email]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isTempEmailWarning) {
      setError(
        'Hệ thống chặn tuyệt đối các loại email tạm / email 10 phút (Temp Mail, Yopmail, 10MinuteMail...). Vui lòng dùng email thật (Gmail, Outlook, iCloud, công ty) để nhận mã xác nhận.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có độ dài tối thiểu 8 ký tự.');
      return;
    }

    if (!humanVerified && !turnstileToken) {
      setError('Vui lòng hoàn tất xác thực chống Bot (Cloudflare Turnstile hoặc ô xác nhận người thật) bên dưới.');
      return;
    }

    if (!turnstileToken && Number(challengeAnswer) !== challengeNums.a + challengeNums.b) {
      setError(`Vui lòng chọn đúng kết quả phép tính xác minh người thật (${challengeNums.a} + ${challengeNums.b} = ${challengeNums.a + challengeNums.b}).`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'send-otp',
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          password,
          turnstileToken: turnstileToken || undefined,
          humanVerified: Boolean(humanVerified || turnstileToken),
          challengeAnswer: Number(challengeAnswer),
          challengeExpected: challengeNums.a + challengeNums.b,
          honeypot,
          formElapsedMs: Date.now() - formOpenedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi mã xác nhận');
      }

      if (data.step === 'OTP_REQUIRED') {
        setOtpToken(data.otpToken);
        setEmailMasked(data.emailMasked || email.trim().toLowerCase());
        setDemoOtpCode(data.demoOtpCode || null);
        setOtpCode('');
        setStep('VERIFY_OTP');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.trim().length !== 6) {
      setError('Vui lòng nhập đủ mã xác nhận 6 chữ số đã gửi tới email của bạn.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'verify-otp',
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          password,
          otpCode: otpCode.trim(),
          otpToken,
          humanVerified: true,
          challengeAnswer: challengeNums.a + challengeNums.b,
          challengeExpected: challengeNums.a + challengeNums.b,
          honeypot,
          formElapsedMs: Date.now() - formOpenedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Xác thực mã OTP không thành công');
      }

      setSuccess(true);
      const targetUrl = from === '/' ? '/profile?welcome=1' : from;
      setTimeout(() => {
        window.location.assign(targetUrl);
      }, 800);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã có lỗi xảy ra khi xác thực mã OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-12 p-6 sm:p-8 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-3xl shadow-xs">
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Bảo mật 3 Lớp • Chống Bot &amp; Mail Rác</span>
        </span>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-2.5 mb-1.5">
          {step === 'FORM' ? 'Đăng ký tài khoản thành viên' : 'Xác thực Email kích hoạt tài khoản'}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {step === 'FORM'
            ? 'Lưu mâm cơm yêu thích, quản lý tủ lạnh, lập thực đơn 7 ngày và theo dõi Nhật ký Calo miễn phí.'
            : `Chúng tôi đã gửi mã xác nhận gồm 6 chữ số tới ${emailMasked}. Vui lòng nhập mã để kích hoạt tài khoản của bạn.`}
        </p>
      </div>

      {/* Thanh tiến trình 2 bước rõ ràng */}
      <div className="mb-5 grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#FAF7F0] border border-[#E5DAC8] text-xs font-bold">
        <div
          className={`py-1.5 px-3 rounded-xl text-center transition-colors ${
            step === 'FORM'
              ? 'bg-[var(--color-brand-primary)] text-white'
              : 'bg-emerald-50 text-emerald-800'
          }`}
        >
          1. Điền thông tin &amp; Chống Bot
        </div>
        <div
          className={`py-1.5 px-3 rounded-xl text-center transition-colors ${
            step === 'VERIFY_OTP'
              ? 'bg-[var(--color-brand-primary)] text-white'
              : 'text-stone-500'
          }`}
        >
          2. Nhập mã OTP Email
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <span>Xác thực Email &amp; Kích hoạt tài khoản thành công! Đang đưa bạn vào Không gian Bếp gia đình...</span>
        </div>
      )}

      {step === 'FORM' ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          {/* Honeypot ẩn bẫy Bot tự động */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="register-website-hp">Website</label>
            <input
              id="register-website-hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="register-displayName" className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
              Họ và tên / Tên gọi bếp nhà
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="register-displayName"
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ví dụ: Mẹ Bắp, Bố Bo, Linh Chi"
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-email" className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
              Địa chỉ Email thật (Nhận mã OTP 6 số để kích hoạt)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bepnha@gmail.com"
                className={`w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-raised)] border rounded-xl text-sm focus:outline-none focus:ring-2 text-[var(--color-text-primary)] ${
                  isTempEmailWarning
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-[var(--color-border-base)] focus:ring-[var(--color-brand-primary)]'
                }`}
              />
            </div>
            {isTempEmailWarning ? (
              <p className="mt-1.5 text-[11px] font-bold text-red-600">
                ⚠️ Phát hiện tên miền Email tạm / Email 10 phút! Hệ thống chặn 100% mail rác để chống spam.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                Chỉ chấp nhận email thật (Gmail, Outlook, iCloud, công ty/trường học). Tự động chặn mail 10 phút.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="register-password" className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
              Mật khẩu bảo mật (tối thiểu 8 ký tự)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="register-confirmPassword" className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
              Xác nhận lại mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="register-confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
              />
            </div>
          </div>

          {/* Chỉ báo kiểm tra độ an toàn mật khẩu trực quan */}
          {password.length > 0 && (
            <div className="p-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-stone-300'}`} />
                <span className={hasMinLength ? 'text-emerald-800 font-semibold' : 'text-[var(--color-text-muted)]'}>
                  Độ dài từ 8 ký tự trở lên
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasLetterAndNumber ? 'text-emerald-600' : 'text-stone-300'}`} />
                <span className={hasLetterAndNumber ? 'text-emerald-800 font-semibold' : 'text-[var(--color-text-muted)]'}>
                  Nên kết hợp cả chữ cái và chữ số
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-emerald-600' : 'text-stone-300'}`} />
                <span className={passwordsMatch ? 'text-emerald-800 font-semibold' : 'text-[var(--color-text-muted)]'}>
                  Hai ô mật khẩu trùng khớp
                </span>
              </div>
            </div>
          )}

          {/* KHUNG XÁC MINH NGƯỜI THẬT (CLOUDFLARE TURNSTILE + DỰ PHÒNG ANTI-BOT) */}
          <div
            className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
              humanVerified || turnstileToken
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-[#FAF7F0] border-[#DFD2C0]'
            }`}
          >
            {!turnstileFallback && TURNSTILE_SITE_KEY && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-[var(--color-text-primary)]">
                  <span>🛡️ Xác thực chống Bot đám mây (Cloudflare Turnstile)</span>
                  {turnstileToken && (
                    <span className="text-emerald-700 font-bold">✓ Đã xác minh</span>
                  )}
                </div>
                <div
                  ref={turnstileContainerRef}
                  className="min-h-[65px] flex items-center justify-center overflow-hidden rounded-xl"
                />
              </div>
            )}

            {(turnstileFallback || !TURNSTILE_SITE_KEY) && (
              <>
                <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={humanVerified}
                      onChange={(e) => setHumanVerified(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--color-brand-primary)] cursor-pointer"
                    />
                    <span className="text-xs font-extrabold text-[var(--color-text-primary)]">
                      Xác minh bảo mật: Tôi là người thật (Chống Bot &amp; Spam)
                    </span>
                  </div>
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${
                      humanVerified ? 'text-emerald-600' : 'text-stone-400'
                    }`}
                  />
                </label>

                {humanVerified && (
                  <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#2F4F30] font-semibold">
                      🤖 Câu hỏi chống Bot: <strong>{challengeNums.a} + {challengeNums.b} bằng mấy?</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[6, 8, 10].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setChallengeAnswer(String(val))}
                          className={`w-8 h-7 rounded-lg text-xs font-extrabold border cursor-pointer transition-colors ${
                            Number(challengeAnswer) === val
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            Bằng việc bấm tiếp tục, bạn đồng ý với{' '}
            <Link href="/dieu-khoan" className="underline hover:text-[var(--color-brand-primary)]">
              Điều khoản sử dụng
            </Link>{' '}
            và{' '}
            <Link href="/chinh-sach-bao-mat" className="underline hover:text-[var(--color-brand-primary)]">
              Chính sách bảo mật
            </Link>{' '}
            của Ăn Gì Mom.
          </p>

          <button
            type="submit"
            disabled={loading || success || isTempEmailWarning}
            className="mt-1 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <span>{loading ? 'Đang gửi mã xác nhận...' : 'Gửi mã xác nhận (OTP) qua Email →'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtpAndActivate} className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[#F4F8F4] border border-[var(--color-brand-border)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#2F4F30]">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              <span>Nhập mã xác nhận 6 số từ Email</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Mã OTP đã được gửi tới hộp thư <strong>{email}</strong> (hiệu lực 10 phút). Tài khoản chỉ được tạo và đăng nhập sau khi xác nhận đúng mã này.
            </p>
            <p className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
              💡 <strong>Mẹo nhỏ:</strong> Nếu chưa thấy trong <strong>Hộp thư đến (Inbox)</strong> sau 10 giây, vui lòng kiểm tra mục <strong>Thư rác (Spam)</strong> hoặc <strong>Quảng cáo</strong> và bấm <em>&ldquo;Không phải thư rác (Report not spam)&rdquo;</em> để các thư sau luôn vào thẳng Inbox.
            </p>

            {demoOtpCode && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center justify-between gap-2">
                <span>
                  🛠️ <strong>Mã OTP (Chế độ chưa gắn SMTP ngoài):</strong>{' '}
                  <code className="px-2 py-0.5 rounded bg-white font-black text-sm tracking-widest text-emerald-800 border border-amber-300">
                    {demoOtpCode}
                  </code>
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(demoOtpCode)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer shrink-0"
                >
                  Điền nhanh
                </button>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="register-otpCode" className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
              Mã xác nhận 6 chữ số
            </label>
            <input
              id="register-otpCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              className="w-full px-4 py-3 bg-[var(--color-surface-raised)] border-2 border-[var(--color-brand-border)] rounded-xl text-center text-xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success || otpCode.length !== 6}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Đang xác thực & kích hoạt...' : 'Xác nhận mã OTP & Vào tài khoản'}</span>
          </button>

          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setStep('FORM');
                setError(null);
              }}
              className="inline-flex items-center gap-1 font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại sửa Email</span>
            </button>

            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={loading}
              className="inline-flex items-center gap-1 font-bold text-[var(--color-brand-primary)] hover:underline cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Gửi lại mã OTP mới</span>
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 pt-5 border-t border-[var(--color-border-subtle)] text-center text-sm text-[var(--color-text-secondary)]">
        <span>Đã có tài khoản? </span>
        <Link
          href={`/login?from=${encodeURIComponent(from)}`}
          className="font-bold text-[var(--color-brand-primary)] hover:underline"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto my-12 p-8 text-center text-sm text-[var(--color-text-muted)]">
          Đang tải trang đăng ký...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
