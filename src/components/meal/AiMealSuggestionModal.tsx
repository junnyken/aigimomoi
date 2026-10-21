'use client';

// AG-28: AI Meal Suggestion Modal Component
// Gợi ý mâm cơm thông minh dựa trên nguyên liệu tủ lạnh và sở thích khẩu vị.

import { useState, useEffect } from 'react';
import { Sparkles, X, Check, Plus, RefreshCw, Clock, ChefHat } from 'lucide-react';
import type { MealDishSummary } from '@/lib/meal/mealQueries';
import type { AiMealSuggestionResult } from '@/lib/ai/mealSuggester';

const COMMON_PANTRY_INGREDIENTS = [
  'Thịt ba chỉ',
  'Thịt gà',
  'Cá lóc',
  'Sườn non',
  'Thịt nạc băm',
  'Rau ngót',
  'Rau muống',
  'Đậu cove',
  'Cà chua',
  'Đậu hũ',
  'Gừng tươi',
  'Hành lá',
];

interface AiMealSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMeal: (mainSlug: string, soupSlug: string, sideSlug: string) => void;
  initialIngredients?: string[];
}

export function AiMealSuggestionModal({
  isOpen,
  onClose,
  onApplyMeal,
  initialIngredients,
}: AiMealSuggestionModalProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(
    initialIngredients && initialIngredients.length > 0
      ? initialIngredients
      : ['Thịt ba chỉ', 'Rau muống']
  );
  const [customInput, setCustomInput] = useState('');
  const [region, setRegion] = useState('Tất cả');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AiMealSuggestionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialIngredients && initialIngredients.length > 0) {
      setSelectedIngredients(initialIngredients);
    }
  }, [initialIngredients]);

  if (!isOpen) return null;

  const allDisplayIngredients = Array.from(
    new Set([...COMMON_PANTRY_INGREDIENTS, ...selectedIngredients])
  );

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = customInput.trim();
    if (val && !selectedIngredients.includes(val)) {
      setSelectedIngredients((prev) => [...prev, val]);
      setCustomInput('');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/meal-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: selectedIngredients,
          region,
        }),
      });

      if (!res.ok) {
        throw new Error('Gợi ý mâm cơm tạm thời gián đoạn');
      }

      const data: AiMealSuggestionResult = await res.json();
      setSuggestion(data);
    } catch {
      setErrorMsg('Không thể kết nối trợ lý AI lúc này. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!suggestion) return;
    onApplyMeal(
      suggestion.meal.main.slug,
      suggestion.meal.soup.slug,
      suggestion.meal.side.slug
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-[var(--color-surface-white)] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[var(--color-border-base)] p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)]/60 flex items-center justify-center shadow-2xs shrink-0">
              <Sparkles className="w-5 h-5 text-[var(--color-accent-primary)]" />
            </div>
            <div>
              <h2 id="ai-modal-title" className="text-xl font-bold text-[var(--color-text-primary)]">
                Trợ Lý Bếp AI — Gợi Ý Mâm Cơm
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                Tủ lạnh có gì, gợi ý mâm nấy — chuẩn vị cơm nhà 3 món
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              1. Chọn các nguyên liệu đang có sẵn trong bếp / tủ lạnh:
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {allDisplayIngredients.map((item) => {
                const isSelected = selectedIngredients.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleIngredient(item)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[var(--color-brand-primary)] text-white shadow-2xs ring-2 ring-[var(--color-brand-border)]'
                        : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAddCustom} className="flex gap-2">
              <input
                type="text"
                placeholder="Thêm nguyên liệu khác (vd: bí đỏ, tôm sú...)"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border-base)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] text-sm font-semibold rounded-xl transition-colors"
              >
                Thêm
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Khẩu vị vùng miền:</span>
            <div className="flex flex-wrap gap-2">
              {['Tất cả', 'Miền Bắc', 'Miền Nam'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    region === r
                      ? 'bg-[var(--color-accent-primary)] text-white shadow-2xs'
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="w-full py-3 px-6 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white font-semibold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin h-4 w-4 text-white" />
                <span>AI đang phân tích nguyên liệu...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[var(--color-accent-light)]" />
                <span>Gợi Ý Mâm Cơm Phù Hợp Ngay</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Results Section */}
        {suggestion && (
          <div className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)] animate-slide-up">
            <div className="p-4 bg-[var(--color-brand-light)]/70 border border-[var(--color-brand-border)] rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-[var(--color-brand-primary)] font-bold text-sm">
                <ChefHat className="w-4 h-4 text-[var(--color-accent-primary)]" />
                <span>Lời khuyên của Trợ lý Bếp:</span>
              </div>
              <p className="text-sm text-[var(--color-text-primary)] italic leading-relaxed">
                &ldquo;{suggestion.rationale}&rdquo;
              </p>
              {suggestion.matchingIngredients.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-[var(--color-brand-primary)]">
                  <span className="font-semibold">Tận dụng được:</span>
                  {suggestion.matchingIngredients.map((ing) => (
                    <span
                      key={ing}
                      className="inline-flex items-center gap-1 bg-[var(--color-surface-white)] border border-[var(--color-brand-border)] text-[var(--color-brand-primary)] px-2.5 py-0.5 rounded-full font-semibold"
                    >
                      <Check className="w-3 h-3" />
                      {ing}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 3 Dishes Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <DishPreviewCard roleLabel="Món Mặn" dish={suggestion.meal.main} />
              <DishPreviewCard roleLabel="Món Canh" dish={suggestion.meal.soup} />
              <DishPreviewCard roleLabel="Món Rau / Xào" dish={suggestion.meal.side} />
            </div>

            {/* Apply Action */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-3 px-6 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white font-bold rounded-2xl shadow-sm transition-transform active:scale-98 inline-flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Áp Dụng Mâm Này &amp; Nấu Ngay</span>
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="py-3 px-4 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] font-semibold rounded-2xl transition-colors inline-flex items-center gap-1.5 text-sm"
                title="Gợi ý phương án khác"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Đổi mâm khác</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DishPreviewCard({ roleLabel, dish }: { roleLabel: string; dish: MealDishSummary }) {
  return (
    <div className="border border-[var(--color-border-base)] rounded-2xl p-3.5 bg-[var(--color-bg-primary)]/70 flex flex-col justify-between space-y-2">
      <div>
        <span className="inline-block px-2 py-0.5 bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] rounded-md text-[11px] font-bold mb-1">
          {roleLabel}
        </span>
        <h4 className="font-bold text-[var(--color-text-primary)] text-sm line-clamp-1">{dish.name}</h4>
        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mt-0.5">{dish.shortDescription}</p>
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-subtle)]">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {dish.totalTimeMinutes}p
        </span>
        <span>• {dish.difficulty}</span>
      </div>
    </div>
  );
}
