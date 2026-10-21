'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/';
  const trimmed = raw.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }
  return '/';
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = sanitizeRedirectPath(searchParams.get('from'));

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Kiểm tra mật khẩu khớp nhau
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
      // Chuyển hướng sau khi đăng ký thành công
      setTimeout(() => {
        router.push(from);
        router.refresh();
      }, 1000);
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
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl shadow-sm">
      <div className="text-center mb-8">
        <span className="text-xs font-semibold text-[var(--color-brand-primary)] uppercase tracking-wider">
          Gia nhập cộng đồng
        </span>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-1 mb-2">
          Đăng ký tài khoản
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Lưu mâm cơm gia đình, quản lý tủ lạnh và đồng bộ kế hoạch nấu nướng dễ dàng.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <span>Đăng ký thành công! Đang chuyển hướng bạn vào ứng dụng...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="register-displayName" className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
            Họ và tên / Tên gọi bếp nhà
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="register-displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ví dụ: Mẹ Bắp, Bố Bo, Linh Chi"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="register-email" className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
            Địa chỉ email
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
          <label htmlFor="register-password" className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
            Mật khẩu (tối thiểu 8 ký tự)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="register-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="register-confirmPassword" className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
            Xác nhận lại mật khẩu
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="register-confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50"
        >
          <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[var(--color-border-subtle)] text-center text-sm text-[var(--color-text-secondary)]">
        <span>Đã có tài khoản? </span>
        <Link
          href={`/login?from=${encodeURIComponent(from)}`}
          className="font-semibold text-[var(--color-brand-primary)] hover:underline"
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
