'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/';
  const trimmed = raw.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }
  return '/';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = sanitizeRedirectPath(searchParams.get('from'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl shadow-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-brand-primary)] mb-2">
          Đăng nhập hệ thống
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Cổng quản trị nội dung & biên tập công thức ĂN GÌ MOM.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
            Email tài khoản
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@angimom.vn"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[var(--color-text-primary)]">
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[var(--color-brand-primary)] hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-[var(--color-text-primary)]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-hover)] transition-colors disabled:opacity-50"
        >
          <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-[var(--color-border-subtle)] text-center text-sm text-[var(--color-text-secondary)]">
        <span>Chưa có tài khoản? </span>
        <Link
          href={`/register?from=${encodeURIComponent(from)}`}
          className="font-semibold text-[var(--color-brand-primary)] hover:underline"
        >
          Đăng ký thành viên ngay
        </Link>
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)] space-y-1.5">
          <p className="font-semibold text-[var(--color-text-secondary)]">Môi trường dev:</p>
          <p>
            Tài khoản <code>admin@angimom.vn</code> / <code>editor@angimom.vn</code> được tạo bởi{' '}
            <code>seed_catalog.ts</code> với mật khẩu từ <code>SEED_ADMIN_PASSWORD</code> /{' '}
            <code>SEED_EDITOR_PASSWORD</code>.
          </p>
        </div>
      )}
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
