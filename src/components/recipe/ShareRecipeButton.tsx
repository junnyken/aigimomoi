'use client';

import { useState } from 'react';
import { Share2, Check, Printer } from 'lucide-react';

export function ShareRecipeButton({
  recipeName,
  slug,
}: {
  recipeName: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/cong-thuc/${slug}`
        : `/cong-thuc/${slug}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${recipeName} — ĂN GÌ MOM`,
          text: `Xem công thức "${recipeName}" chuẩn định lượng & Calo trên Ăn Gì Mom:`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard error
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="inline-flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={handleShare}
        className="min-h-11 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
        title="Chia sẻ công thức qua Zalo / Facebook hoặc sao chép link"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-emerald-700">Đã chép link!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
            <span>Chia sẻ</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handlePrint}
        className="min-h-11 hidden sm:inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
        title="In công thức ra giấy hoặc lưu PDF"
      >
        <Printer className="w-4 h-4 shrink-0" />
        <span>In món</span>
      </button>
    </div>
  );
}
