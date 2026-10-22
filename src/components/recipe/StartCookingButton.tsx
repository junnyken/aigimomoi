'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChefHat } from 'lucide-react';
import { buildCookingHref } from '@/lib/meal/flowUrls';

interface StartCookingButtonProps {
  slug: string;
  baseServings: number;
}

/**
 * R2-B3: Nút vào Chế độ nấu đọc `?servings` hiện tại tại thời điểm bấm
 * (IngredientList cập nhật URL bằng replaceState), để định lượng trong
 * ngăn kéo nguyên liệu khớp đúng số người ăn đã chọn.
 * Không có JS vẫn hoạt động nhờ href mặc định.
 */
export function StartCookingButton({ slug, baseServings }: StartCookingButtonProps) {
  const router = useRouter();
  const fallbackHref = buildCookingHref(slug, undefined, baseServings);

  return (
    <Link
      href={fallbackHref}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        const current = new URL(window.location.href).searchParams.get('servings');
        router.push(buildCookingHref(slug, current, baseServings));
      }}
      className="min-h-11 col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-2xl font-bold bg-[var(--color-brand-primary)] text-white hover:opacity-95 transition-all shadow-xs w-full sm:w-auto text-sm sm:text-base"
    >
      <ChefHat className="w-5 h-5" />
      <span>Bắt đầu nấu món này</span>
    </Link>
  );
}
