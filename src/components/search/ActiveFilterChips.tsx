'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Trash2 } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/recipes/labels';

interface ActiveFilterChipsProps {
  taxonomies?: { id: number; name: string; slug: string }[];
}

export function ActiveFilterChips({ taxonomies = [] }: ActiveFilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = searchParams.get('q');
  const role = searchParams.get('role');
  const maxTime = searchParams.get('maxTime');
  const maxCalories = searchParams.get('maxCalories');
  const difficulty = searchParams.get('difficulty');
  const tested = searchParams.get('tested') === 'true';
  const nutrition = searchParams.get('nutrition') === 'true';
  const taxSlug = searchParams.get('tax');

  // Kiểm tra xem có filter nào đang áp dụng không
  const hasActiveFilters = Boolean(
    q || role || maxTime || maxCalories || difficulty || tested || nutrition || taxSlug
  );

  if (!hasActiveFilters) return null;

  function removeParam(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete('page');

    startTransition(() => {
      router.push(`/mon-an?${params.toString()}`);
    });
  }

  function clearAll() {
    startTransition(() => {
      router.push('/mon-an');
    });
  }

  // Tìm tên taxonomy nếu có
  const taxName = taxonomies.find((t) => t.slug === taxSlug)?.name ?? taxSlug;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 pb-3">
      <span className="text-xs text-[var(--color-text-muted)] font-medium">Bộ lọc đang chọn:</span>

      {q && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] text-[var(--color-text-primary)]">
          <span>Từ khóa: &quot;{q}&quot;</span>
          <button
            type="button"
            onClick={() => removeParam('q')}
            disabled={isPending}
            className="p-0.5 hover:text-[var(--color-brand-primary)]"
            title="Xóa tìm kiếm"
            aria-label="Xóa từ khóa"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {role && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/20 font-medium">
          <span>{ROLE_LABELS[role] ?? role}</span>
          <button
            type="button"
            onClick={() => removeParam('role')}
            disabled={isPending}
            className="p-0.5 hover:opacity-75"
            aria-label="Xóa vai trò món"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {maxTime && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] text-[var(--color-text-primary)]">
          <span>≤ {maxTime} phút</span>
          <button
            type="button"
            onClick={() => removeParam('maxTime')}
            disabled={isPending}
            className="p-0.5 hover:text-[var(--color-brand-primary)]"
            aria-label="Xóa thời gian"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {maxCalories && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--color-accent-light)] text-[var(--color-accent-text)] border border-[var(--color-accent-primary)]/20 font-medium">
          <span>≤ {maxCalories} kcal/phần</span>
          <button
            type="button"
            onClick={() => removeParam('maxCalories')}
            disabled={isPending}
            className="p-0.5 hover:opacity-75"
            aria-label="Xóa mức Calo"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {difficulty && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] text-[var(--color-text-primary)]">
          <span>Độ khó: {difficulty}</span>
          <button
            type="button"
            onClick={() => removeParam('difficulty')}
            disabled={isPending}
            className="p-0.5 hover:text-[var(--color-brand-primary)]"
            aria-label="Xóa độ khó"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {tested && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--color-success-base)]/10 text-[var(--color-success-base)] border border-[var(--color-success-base)]/20 font-medium">
          <span>Đã nấu thử</span>
          <button
            type="button"
            onClick={() => removeParam('tested')}
            disabled={isPending}
            className="p-0.5 hover:opacity-75"
            aria-label="Xóa bộ lọc đã nấu thử"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {nutrition && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--color-brand-secondary)]/10 text-[var(--color-brand-secondary)] border border-[var(--color-brand-secondary)]/20 font-medium">
          <span>Đã kiểm dinh dưỡng</span>
          <button
            type="button"
            onClick={() => removeParam('nutrition')}
            disabled={isPending}
            className="p-0.5 hover:opacity-75"
            aria-label="Xóa bộ lọc dinh dưỡng"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {taxSlug && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] text-[var(--color-text-primary)]">
          <span>{taxName}</span>
          <button
            type="button"
            onClick={() => removeParam('tax')}
            disabled={isPending}
            className="p-0.5 hover:text-[var(--color-brand-primary)]"
            aria-label="Xóa phân loại"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={clearAll}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)] underline transition-colors ml-1"
      >
        <Trash2 className="w-3 h-3" />
        <span>Xóa tất cả</span>
      </button>
    </div>
  );
}
