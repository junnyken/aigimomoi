'use client';

import Link from 'next/link';
import { SearchX, RotateCcw } from 'lucide-react';

export function SearchEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl">
      <div className="w-14 h-14 mb-4 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-muted)]">
        <SearchX className="w-7 h-7" aria-hidden="true" />
      </div>

      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
        Không tìm thấy món ăn nào
      </h3>

      <p className="text-sm text-[var(--color-text-secondary)] max-w-md mb-6">
        {hasFilters
          ? 'Không có món ăn nào khớp với các tiêu chí tìm kiếm hoặc bộ lọc hiện tại. Hãy thử giảm bớt tiêu chí lọc hoặc tìm với từ khóa khác.'
          : 'Hiện tại chưa có công thức nấu ăn nào được xuất bản trong danh mục này.'}
      </p>

      {hasFilters && (
        <Link
          href="/mon-an"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Xóa tất cả bộ lọc</span>
        </Link>
      )}
    </div>
  );
}
