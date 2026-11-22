'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatPriceVND } from '@/lib/gating/pricing';

interface ClaimBundleButtonProps {
  bundleId: number;
  creatorSlug: string;
  price: number;
  isLoggedIn: boolean;
  alreadyOwned?: boolean;
}

export function ClaimBundleButton({
  bundleId,
  creatorSlug,
  price,
  isLoggedIn,
  alreadyOwned = false,
}: ClaimBundleButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (alreadyOwned) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs sm:text-sm">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
        <span>Đã sở hữu trọn bộ công thức này</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?from=/nguoi-nau/${encodeURIComponent(creatorSlug)}`}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--color-brand-primary)] text-white font-bold text-xs sm:text-sm hover:opacity-95 transition-all shadow-xs"
      >
        <Lock className="w-4 h-4" aria-hidden="true" />
        <span>Đăng nhập để mở khóa trọn bộ ({formatPriceVND(price)})</span>
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    );
  }

  const handleClaim = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bundles/${bundleId}/claim`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || 'Không thể mở khóa bộ công thức lúc này.');
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
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-xs sm:text-sm">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
        <span>Đã mở khóa trọn bộ! Đang cập nhật...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleClaim}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--color-brand-primary)] text-white font-bold text-xs sm:text-sm hover:opacity-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-amber-200" aria-hidden="true" />
        <span>
          {loading
            ? 'Đang mở khóa...'
            : `Mở khóa dùng thử miễn phí (Giá bộ ${formatPriceVND(price)})`}
        </span>
      </button>
      {error && (
        <p className="text-xs text-rose-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
