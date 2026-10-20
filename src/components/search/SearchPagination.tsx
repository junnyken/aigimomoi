'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function SearchPagination({ currentPage, totalPages }: SearchPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));

    startTransition(() => {
      router.push(`/mon-an?${params.toString()}`);
    });
  }

  // Tạo danh sách các số trang cần hiển thị
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-8" aria-label="Phân trang kết quả">
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1 || isPending}
        className="p-2 rounded-xl border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="Trang trước"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {start > 1 && (
        <>
          <button
            type="button"
            onClick={() => goToPage(1)}
            disabled={isPending}
            className="w-9 h-9 text-xs rounded-xl border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            1
          </button>
          {start > 2 && <span className="px-1 text-xs text-[var(--color-text-muted)]">...</span>}
        </>
      )}

      {pages.map((p) => {
        const isActive = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            onClick={() => goToPage(p)}
            disabled={isPending}
            className={`w-9 h-9 text-xs rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                : 'border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]'
            }`}
          >
            {p}
          </button>
        );
      })}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-xs text-[var(--color-text-muted)]">...</span>}
          <button
            type="button"
            onClick={() => goToPage(totalPages)}
            disabled={isPending}
            className="w-9 h-9 text-xs rounded-xl border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages || isPending}
        className="p-2 rounded-xl border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="Trang tiếp theo"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
