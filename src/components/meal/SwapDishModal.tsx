'use client';

import { useState, useEffect } from 'react';
import { X, Search, Check, UtensilsCrossed, Clock, ChefHat } from 'lucide-react';
import type { MealDishSummary } from '@/lib/meal/mealQueries';
import { formatDuration } from '@/lib/recipes/labels';

interface SwapDishModalProps {
  isOpen: boolean;
  role: 'MAIN' | 'SOUP' | 'SIDE';
  currentSlug: string;
  onClose: () => void;
  onSelect: (dish: MealDishSummary) => void;
}

const ROLE_LABELS: Record<'MAIN' | 'SOUP' | 'SIDE', string> = {
  MAIN: 'Món Mặn Chính',
  SOUP: 'Món Canh',
  SIDE: 'Món Rau / Xào',
};

export function SwapDishModal({
  isOpen,
  role,
  currentSlug,
  onClose,
  onSelect,
}: SwapDishModalProps) {
  const [options, setOptions] = useState<MealDishSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setSearchQuery('');

    fetch(`/api/meal/options?role=${role}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setOptions(data?.options || []);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh sách món thay thế:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, role]);

  if (!isOpen) return null;

  const filteredOptions = options.filter((dish) =>
    dish.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-modal-title"
    >
      <div className="relative w-full max-w-lg bg-[var(--color-surface-white)] rounded-3xl border border-[var(--color-border-base)] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[var(--color-brand-primary)] uppercase tracking-wider">
              Thay đổi công thức
            </span>
            <h2 id="swap-modal-title" className="text-lg font-bold text-[var(--color-text-primary)]">
              Chọn {ROLE_LABELS[role]} khác
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Tìm món ${ROLE_LABELS[role].toLowerCase()} khác...`}
              className="w-full pl-9 pr-4 py-2 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            />
          </div>
        </div>

        {/* Options List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
              Đang tải danh sách món ăn...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              Không tìm thấy món ăn nào phù hợp với từ khóa.
            </div>
          ) : (
            filteredOptions.map((dish) => {
              const isSelected = dish.slug === currentSlug;
              return (
                <button
                  key={dish.slug}
                  type="button"
                  onClick={() => onSelect(dish)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-light)]/40 shadow-xs'
                      : 'border-[var(--color-border-base)] bg-[var(--color-surface-white)] hover:border-[var(--color-brand-primary)]/50 hover:bg-[var(--color-surface-raised)]'
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--color-surface-raised)] shrink-0">
                    {dish.heroImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dish.heroImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                        <UtensilsCrossed className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                        {dish.name}
                      </h3>
                      {dish.isCookTested && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                          <ChefHat className="w-2.5 h-2.5" />
                          Đã test
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1 mt-0.5">
                      {dish.shortDescription}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(dish.totalTimeMinutes)}
                      </span>
                      <span>Độ khó: {dish.difficulty}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--color-brand-primary)] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
