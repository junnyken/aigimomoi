'use client';

// AG-40: Widget đối chiếu nguyên liệu công thức với Tủ lạnh gia đình
import React, { useEffect, useState } from 'react';

interface MatchedItem {
  name: string;
  recipeAmount: number;
  recipeUnit: string;
  pantryQuantity: number;
  pantryUnit: string;
  pantryLocation: string;
}

interface PantryCheckData {
  totalIngredients: number;
  availableCount: number;
  coveragePercent: number;
  matchedIngredients: MatchedItem[];
  missingIngredients: Array<{ name: string; amount: number; unit: string }>;
  isLoggedIn: boolean;
}

export function PantryCheckWidget({ recipeId }: { recipeId: number }) {
  const [data, setData] = useState<PantryCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkPantry() {
      try {
        const res = await fetch(`/api/recipes/${recipeId}/pantry-check`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setData(json);
        }
      } catch (err) {
        console.error('Failed to check pantry', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    checkPantry();
    return () => {
      isMounted = false;
    };
  }, [recipeId]);

  if (loading || !data || !data.isLoggedIn) {
    return null;
  }

  const { availableCount, totalIngredients, coveragePercent, matchedIngredients, missingIngredients } = data;

  const getBadgeColor = () => {
    if (coveragePercent >= 80) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (coveragePercent >= 50) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-stone-50 text-stone-700 border-stone-200';
  };

  return (
    <div className={`p-4 rounded-xl border transition-all my-4 ${getBadgeColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🧊</span>
          <div>
            <h4 className="font-semibold text-sm">
              Tủ lạnh nhà bạn có sẵn {availableCount}/{totalIngredients} nguyên liệu ({coveragePercent}%)
            </h4>
            <p className="text-xs opacity-80">
              {coveragePercent === 100 
                ? 'Đủ hết nguyên liệu trong nhà! Có thể nấu ngay mà không cần đi chợ.'
                : coveragePercent >= 50
                ? 'Đã có hơn nửa nguyên liệu sẵn trong tủ. Chỉ cần mua thêm một ít!'
                : 'Cần bổ sung thêm nguyên liệu vào giỏ đi chợ.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white/80 hover:bg-white shadow-sm border transition-colors"
        >
          {expanded ? 'Thu gọn' : 'Xem chi tiết'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-current/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-medium text-emerald-700 mb-1">✓ Đã có sẵn trong tủ ({matchedIngredients.length}):</p>
            <ul className="space-y-1">
              {matchedIngredients.map((item, idx) => (
                <li key={idx} className="flex justify-between items-center bg-white/60 px-2 py-1 rounded">
                  <span>{item.name}</span>
                  <span className="opacity-75">
                    Có: {item.pantryQuantity} {item.pantryUnit} ({item.pantryLocation === 'FREEZER' ? 'Đông' : item.pantryLocation === 'DRY_PANTRY' ? 'Khô' : 'Mát'})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-medium text-amber-700 mb-1">🛒 Cần mua thêm ({missingIngredients.length}):</p>
            <ul className="space-y-1">
              {missingIngredients.map((item, idx) => (
                <li key={idx} className="flex justify-between items-center bg-white/60 px-2 py-1 rounded">
                  <span>{item.name}</span>
                  <span className="opacity-75">{item.amount} {item.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
