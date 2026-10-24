'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

function sanitizeAdminRedirect(raw: string | null): string {
  if (!raw) return '/editor/dashboard';
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('/editor') || trimmed.startsWith('/admin')) &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\')
  ) {
    return trimmed === '/admin' || trimmed === '/editor' ? '/editor/dashboard' : trimmed;
  }
  return '/editor/dashboard';
}

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const from = sanitizeAdminRedirect(searchParams.get('from'));
  const reason = searchParams.get('reason');

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
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập Quản trị không thành công');
      }

      window.location.assign(from);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã có lỗi xảy ra khi xác thực quyền Quản trị');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-6 sm:my-10">
      <div className="rounded-3xl overflow-hidden border-2 border-[#2D482E] bg-[#162417] text-white shadow-xl">
        {/* Top Security Banner */}
        <div className="bg-gradient-to-r from-[#1E3520] via-[#2D482E] to-[#1E3520] px-6 py-5 border-b border-emerald-800/60">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5" />
              Cổng Nội Bộ Chuyên Biệt
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Về trang chủ
            </Link>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
            <span>Cổng Quản Trị Hệ Thống Ăn Gì Mom</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1.5 leading-relaxed">
            Đường dẫn đăng nhập dành riêng cho <strong>Quản trị viên (ADMIN)</strong> và{' '}
            <strong>Ban Biên Tập (EDITOR)</strong>. Tài khoản thành viên thường không thể truy cập qua cổng này.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 bg-white text-[#2D2A26]">
          {reason === 'cook_forbidden' && !error && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Khu vực giới hạn quyền Quản trị viên</p>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Tài khoản thành viên thường (COOK) không được phép truy cập vào Trung tâm Quản trị. Vui lòng đăng nhập bằng tài khoản <strong>ADMIN</strong> hoặc <strong>EDITOR</strong> bên dưới.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Email Quản Trị Viên / Biên Tập Viên
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7C6A59] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@angimom.vn"
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF7F0] border border-[#D8C7B0] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2D482E] focus:bg-white text-[#2D2A26]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#2D2A26] uppercase tracking-wider mb-1.5">
                Mật Khẩu Bảo Mật
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7C6A59] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-[#FAF7F0] border border-[#D8C7B0] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2D482E] focus:bg-white text-[#2D2A26]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C6A59] hover:text-[#2D2A26] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-extrabold bg-[#2D482E] text-white hover:bg-[#1E3520] transition-colors disabled:opacity-50 cursor-pointer shadow-sm text-sm"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Đang kiểm tra thẩm quyền...' : 'Đăng nhập vào Trung Tâm Quản Trị'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#EADBC8] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#7C6A59]">
            <span>🔒 Bảo vệ bởi Kiểm soát Phân quyền RBAC (Role-Based Access Control)</span>
            <Link
              href="/login"
              className="font-bold text-[#3F6240] hover:underline shrink-0"
            >
              Đăng nhập Thành viên thường →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto my-12 p-8 text-center text-sm text-[#7C6A59]">
          Đang tải Cổng Quản Trị Hệ Thống...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
