'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { FilterSidebar } from './FilterSidebar';

interface SearchFilterSheetProps {
  taxonomies?: { id: number; name: string; slug: string; type: string }[];
}

export function SearchFilterSheet({ taxonomies = [] }: SearchFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();

  // Đếm số lượng bộ lọc đang active (ngoại trừ q và role vì đã có tab/input)
  const filterCount = [
    searchParams.get('maxTime'),
    searchParams.get('difficulty'),
    searchParams.get('tested'),
    searchParams.get('nutrition'),
    searchParams.get('tax'),
    searchParams.get('sort') && searchParams.get('sort') !== 'newest' ? 'sort' : null,
  ].filter(Boolean).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-xl text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-brand-primary)] transition-all shadow-xs"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
        <span>Bộ lọc</span>
        {filterCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-[var(--color-brand-primary)] text-white text-[10px] flex items-center justify-center font-bold">
            {filterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-sm h-full bg-[var(--color-surface-white)] p-6 overflow-y-auto z-10 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-border-base)]">
              <span className="font-semibold text-sm text-[var(--color-text-primary)]">Tùy chọn bộ lọc</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                aria-label="Đóng bộ lọc"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <FilterSidebar
              taxonomies={taxonomies}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
