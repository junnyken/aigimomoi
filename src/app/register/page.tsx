'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasLetterAndNumber = /[A-Za-z]/.test(password) && /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có độ dài tối thiểu 8 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký tài khoản không thành công');
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
        setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
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
          <span>Gia nhập Bếp Gia Đình Việt</span>
        </span>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-2.5 mb-1.5">
          Đăng ký tài khoản thành viên
        </h1>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Lưu mâm cơm yêu thích, quản lý tủ lạnh, lập thực đơn 7 ngày và theo dõi Nhật ký Calo miễn phí.
        </p>
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
          <span>Kích hoạt tài khoản thành công! Đang đưa bạn vào Không gian Bếp gia đình...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            Địa chỉ Email (Dùng để đăng nhập &amp; khôi phục mật khẩu)
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
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
            />
          </div>
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

        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          Bằng việc bấm Đăng ký ngay, bạn đồng ý với{' '}
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
          disabled={loading || success}
          className="mt-1 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <span>{loading ? 'Đang kích hoạt tài khoản...' : 'Đăng ký ngay'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

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
