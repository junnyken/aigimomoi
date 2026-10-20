'use client';

// AG-28: AI Meal Suggestion Modal Component
// Gợi ý mâm cơm thông minh dựa trên nguyên liệu tủ lạnh và sở thích khẩu vị.

import { useState } from 'react';
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
}

export function AiMealSuggestionModal({ isOpen, onClose, onApplyMeal }: AiMealSuggestionModalProps) {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(['Thịt ba chỉ', 'Rau muống']);
  const [customInput, setCustomInput] = useState('');
  const [region, setRegion] = useState('Tất cả');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AiMealSuggestionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shadow-inner">
              ✨
            </div>
            <div>
              <h2 id="ai-modal-title" className="text-xl font-bold text-stone-900">
                Trợ Lý Bếp AI — Gợi Ý Mâm Cơm
              </h2>
              <p className="text-sm text-stone-500">
                Tủ lạnh có gì, gợi ý mâm nấy — chuẩn vị cơm nhà 3 món
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              1. Chọn các nguyên liệu đang có sẵn trong bếp / tủ lạnh:
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_PANTRY_INGREDIENTS.map((item) => {
                const isSelected = selectedIngredients.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleIngredient(item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {item}
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
                className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-medium rounded-lg transition-colors"
              >
                Thêm
              </button>
            </form>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-stone-700">Khẩu vị vùng miền:</span>
            <div className="flex gap-2">
              {['Tất cả', 'Miền Bắc', 'Miền Nam'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    region === r
                      ? 'bg-stone-800 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>AI đang phân tích nguyên liệu...</span>
              </>
            ) : (
              <>
                <span>✨ Gợi Ý Mâm Cơm Phù Hợp Ngay</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Results Section */}
        {suggestion && (
          <div className="space-y-4 pt-4 border-t border-stone-100 animate-slide-up">
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/60 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                <span>💡 Lời khuyên của Trợ lý Bếp:</span>
              </div>
              <p className="text-sm text-emerald-800 italic">
                &ldquo;{suggestion.rationale}&rdquo;
              </p>
              {suggestion.matchingIngredients.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-700">
                  <span className="font-medium">Tận dụng được:</span>
                  {suggestion.matchingIngredients.map((ing) => (
                    <span key={ing} className="bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full font-medium">
                      ✓ {ing}
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
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-98 text-center"
              >
                ✓ Áp Dụng Mâm Này & Nấu Ngay
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl transition-colors"
                title="Gợi ý phương án khác"
              >
                🔄 Đổi mâm khác
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
    <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50 flex flex-col justify-between space-y-2">
      <div>
        <span className="inline-block px-2 py-0.5 bg-stone-200 text-stone-700 rounded text-[11px] font-bold mb-1">
          {roleLabel}
        </span>
        <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{dish.name}</h4>
        <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">{dish.shortDescription}</p>
      </div>
      <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-200/50">
        <span>⏱ {dish.totalTimeMinutes}p</span>
        <span>• {dish.difficulty}</span>
      </div>
    </div>
  );
}
