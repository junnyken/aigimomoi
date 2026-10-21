'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatPriceVND } from '@/lib/gating/pricing';

interface ClaimRecipeButtonProps {
  recipeId: number;
  recipeSlug: string;
  price: number;
  isLoggedIn: boolean;
}

export function ClaimRecipeButton({
  recipeId,
  recipeSlug,
  price,
  isLoggedIn,
}: ClaimRecipeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?from=/cong-thuc/${encodeURIComponent(recipeSlug)}`}
        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[var(--color-brand-primary)] text-white font-bold text-base hover:opacity-95 transition-all shadow-sm"
        data-testid="login-to-claim-button"
      >
        <Lock className="w-5 h-5" aria-hidden="true" />
        Đăng nhập để nhận công thức ({formatPriceVND(price)})
        <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
      </Link>
    );
  }

  const handleClaim = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/claim`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || 'Không thể mở khóa công thức vào lúc này.');
        setLoading(false);
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError('Đã có lỗi xảy ra khi kết nối máy chủ.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />
        Đã mở khóa công thức thành công! Đang tải lại trang...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClaim}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[var(--color-brand-primary)] text-white font-bold text-base hover:opacity-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        data-testid="claim-recipe-promo-button"
      >
        <Sparkles className="w-5 h-5 text-amber-200" aria-hidden="true" />
        {loading ? 'Đang mở khóa...' : `Mở khóa dùng thử miễn phí (Giá gốc ${formatPriceVND(price)})`}
      </button>
      {error && (
        <p className="text-xs text-rose-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
