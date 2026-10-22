'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/';
  const trimmed = raw.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }
  return '/';
}

function LoginForm() {
  const searchParams = useSearchParams();
  const from = sanitizeRedirectPath(searchParams.get('from'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công');
      }

      const rawFrom = searchParams.get('from');
      const role = data.user?.role;
      const defaultTarget =
        role === 'ADMIN' || role === 'EDITOR' ? '/editor/recipes' : '/profile';
      const targetPath = rawFrom ? sanitizeRedirectPath(rawFrom) : defaultTarget;

      // Dùng điều hướng toàn trang để xóa hoàn toàn Router Cache chưa đăng nhập của Next.js
      window.location.assign(targetPath);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã có lỗi xảy ra');
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
          <span>Tài khoản Bếp Gia Đình &amp; Ban Biên Tập</span>
        </span>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-2.5 mb-1.5">
          Đăng nhập Ăn Gì Mom
        </h1>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Mở sổ tay món tủ, quản lý tủ lạnh gia đình, thực đơn 7 ngày và theo dõi Nhật ký Calo.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
            Email tài khoản
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-[var(--color-text-primary)]">
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
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

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[var(--color-border-subtle)] text-center text-sm text-[var(--color-text-secondary)]">
        <span>Chưa có tài khoản? </span>
        <Link
          href={`/register?from=${encodeURIComponent(from)}`}
          className="font-bold text-[var(--color-brand-primary)] hover:underline"
        >
          Đăng ký thành viên ngay
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto my-12 p-8 text-center text-sm text-[var(--color-text-muted)]">Đang tải trang đăng nhập...</div>}>
      <LoginForm />
    </Suspense>
  );
}
