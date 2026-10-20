'use client';

import { useState } from 'react';
import { X, Check, ShoppingBasket, Users } from 'lucide-react';
import type { ScaledIngredient } from '@/lib/recipes/scaling';

interface QuickIngredientsSheetProps {
  ingredients: ScaledIngredient[];
  servings: number;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickIngredientsSheet({
  ingredients,
  servings,
  isOpen,
  onClose,
}: QuickIngredientsSheetProps) {
  const [checkedIds, setCheckedIds] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  function toggleCheck(id: number) {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  const required = ingredients.filter((i) => !i.isOptional);
  const optional = ingredients.filter((i) => i.isOptional);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="quick-ingredients-title">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-[var(--color-surface-white)] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        <header className="p-4 sm:p-5 border-b border-[var(--color-border-base)] flex items-center justify-between gap-3 bg-[var(--color-surface-raised)]">
          <div>
            <h2 id="quick-ingredients-title" className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <ShoppingBasket className="w-5 h-5 text-[var(--color-brand-primary)]" />
              <span>Nguyên liệu món ăn</span>
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
              <Users className="w-3.5 h-3.5" />
              <span>Định lượng cho {servings} người</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-white)] transition-colors"
            aria-label="Đóng bảng nguyên liệu"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-5">
          <p className="text-xs text-[var(--color-text-muted)]">
            Chạm vào nguyên liệu để đánh dấu đã nêm hoặc chuẩn bị xong:
          </p>

          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
              Nguyên liệu chính
            </h3>
            <ul className="divide-y divide-[var(--color-border-subtle)]">
              {required.map((ing) => {
                const isChecked = Boolean(checkedIds[ing.id]);
                return (
                  <li
                    key={ing.id}
                    onClick={() => toggleCheck(ing.id)}
                    className={`flex items-baseline justify-between gap-3 py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-[var(--color-surface-raised)] opacity-60'
                        : 'hover:bg-[var(--color-surface-raised)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          isChecked
                            ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white'
                            : 'border-[var(--color-border-strong)]'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={`text-sm ${isChecked ? 'line-through text-[var(--color-text-muted)]' : 'font-medium text-[var(--color-text-primary)]'}`}>
                        {ing.name}
                        {ing.preparation && (
                          <span className="block text-xs font-normal text-[var(--color-text-muted)]">
                            {ing.preparation}
                          </span>
                        )}
                      </span>
                    </div>

                    <span className="shrink-0 tabular-nums text-sm font-semibold text-[var(--color-brand-primary)]">
                      {ing.formattedAmount} {ing.unit}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {optional.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                Tuỳ chọn thêm
              </h3>
              <ul className="divide-y divide-[var(--color-border-subtle)]">
                {optional.map((ing) => {
                  const isChecked = Boolean(checkedIds[ing.id]);
                  return (
                    <li
                      key={ing.id}
                      onClick={() => toggleCheck(ing.id)}
                      className={`flex items-baseline justify-between gap-3 py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-[var(--color-surface-raised)] opacity-60'
                          : 'hover:bg-[var(--color-surface-raised)]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white'
                              : 'border-[var(--color-border-strong)]'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-sm ${isChecked ? 'line-through text-[var(--color-text-muted)]' : 'font-medium text-[var(--color-text-primary)]'}`}>
                          {ing.name}
                        </span>
                      </div>

                      <span className="shrink-0 tabular-nums text-sm font-semibold text-[var(--color-text-secondary)]">
                        {ing.formattedAmount} {ing.unit}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-[var(--color-border-base)] bg-[var(--color-surface-raised)]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[var(--color-brand-primary)] text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-opacity"
          >
            Quay lại bước đang nấu
          </button>
        </footer>
      </div>
    </div>
  );
}
