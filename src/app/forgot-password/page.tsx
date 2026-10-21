'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, ArrowRight, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể xử lý yêu cầu lúc này.');
      }

      setSubmitted(true);
      if (data.devResetUrl) {
        setDevUrl(data.devResetUrl);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🍲</span>
            <span className="font-extrabold text-2xl tracking-tight text-[#15803d]">ĂN GÌ MOM</span>
          </div>
        </Link>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
          Khôi phục mật khẩu
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
          Nhập địa chỉ email đăng ký để nhận liên kết thiết lập lại mật khẩu an toàn.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200/80 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Đã gửi hướng dẫn!</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nếu tài khoản <strong className="text-gray-800">{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu trong ít phút.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-left">
                💡 <strong>Lưu ý:</strong> Liên kết có hiệu lực trong <strong>15 phút</strong>. Hãy kiểm tra cả hộp thư Spam/Rác nếu không thấy trong Hộp thư đến.
              </div>

              {devUrl && (
                <div className="p-3 bg-stone-100 border border-stone-300 rounded-lg text-xs text-left">
                  <div className="font-semibold text-stone-700 mb-1">Liên kết thử nghiệm (Môi trường Dev):</div>
                  <Link href={devUrl} className="text-emerald-700 underline break-all">
                    {devUrl}
                  </Link>
                </div>
              )}

              <div className="pt-4">
                <Link
                  href="/login"
                  className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 border border-stone-300 rounded-xl shadow-sm text-sm font-semibold text-stone-700 bg-white hover:bg-stone-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại trang Đăng nhập
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Địa chỉ email đã đăng ký
                </label>
                <div className="mt-1.5 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[44px] flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#15803d] hover:bg-[#166534] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Gửi liên kết đặt lại mật khẩu
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Nhớ lại mật khẩu? Đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
