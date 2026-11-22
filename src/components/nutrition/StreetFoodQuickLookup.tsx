'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Utensils,
  Flame,
  Footprints,
  HeartPulse,
  CheckCircle2,
  LogIn,
} from 'lucide-react';
import {
  VIETNAMESE_EATING_OUT_CATALOG,
  type VietnameseEatingOutItem,
} from '@/lib/nutrition/vietnameseEatingOutCatalog';
import { markDiaryDateActive } from '@/lib/nutrition/visualDiaryStore';

interface StreetFoodQuickLookupProps {
  targetCalories: number;
}

type CategoryFilter = 'ALL' | VietnameseEatingOutItem['category'];

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'BREAKFAST_NOODLE', label: '🍜 Bún · Phở · Sáng' },
  { key: 'RICE_STREET', label: '🍛 Cơm · Bánh mì' },
  { key: 'SNACK_CAKE', label: '🥟 Ăn vặt' },
  { key: 'DRINK_BOBA', label: '🧋 Trà sữa · Cà phê' },
];

export function StreetFoodQuickLookup({ targetCalories }: StreetFoodQuickLookupProps) {
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<VietnameseEatingOutItem>(
    VIETNAMESE_EATING_OUT_CATALOG[0]
  );
  const [selectedModIds, setSelectedModIds] = useState<string[]>([]);
  const [mealSlot, setMealSlot] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>(
    VIETNAMESE_EATING_OUT_CATALOG[0].defaultMealType
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'auth' | 'error';
    message: string;
  } | null>(null);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VIETNAMESE_EATING_OUT_CATALOG.filter((item) => {
      if (category !== 'ALL' && item.category !== category) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    }).slice(0, 12);
  }, [category, query]);

  const adjusted = useMemo(() => {
    const chosen = selectedItem.modifiers.filter((m) => selectedModIds.includes(m.id));
    const kcal = Math.max(
      0,
      Math.round(
        selectedItem.calories + chosen.reduce((acc, m) => acc + m.deltaCalories, 0)
      )
    );
    const protein =
      Math.round(
        Math.max(
          0,
          selectedItem.protein + chosen.reduce((acc, m) => acc + (m.deltaProtein ?? 0), 0)
        ) * 10
      ) / 10;
    const fat =
      Math.round(
        Math.max(
          0,
          selectedItem.fat + chosen.reduce((acc, m) => acc + (m.deltaFat ?? 0), 0)
        ) * 10
      ) / 10;
    const carbs =
      Math.round(
        Math.max(
          0,
          selectedItem.carbs + chosen.reduce((acc, m) => acc + (m.deltaCarbs ?? 0), 0)
        ) * 10
      ) / 10;
    const sodium = Math.max(
      0,
      Math.round(
        selectedItem.sodium + chosen.reduce((acc, m) => acc + (m.deltaSodium ?? 0), 0)
      )
    );

    const savedKcal = Math.max(0, selectedItem.calories - kcal);
    const dailyPct = Math.round((kcal / Math.max(1200, targetCalories)) * 100);
    const briskWalkMinutes = Math.max(5, Math.round(kcal / 4.2));

    return {
      chosen,
      kcal,
      protein,
      fat,
      carbs,
      sodium,
      savedKcal,
      dailyPct,
      briskWalkMinutes,
    };
  }, [selectedItem, selectedModIds, targetCalories]);

  function handleSelectItem(item: VietnameseEatingOutItem) {
    setSelectedItem(item);
    setSelectedModIds([]);
    setMealSlot(item.defaultMealType);
    setFeedback(null);
  }

  function toggleModifier(id: string) {
    setSelectedModIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleLogToDiary() {
    setSaving(true);
    setFeedback(null);
    const todayStr = new Date().toISOString().split('T')[0];
    const modLabels = adjusted.chosen.map((m) => m.label).join(', ');
    const finalName = modLabels ? `${selectedItem.name} (${modLabels})` : selectedItem.name;

    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeName: finalName,
          diaryDate: todayStr,
          mealType: mealSlot,
          memberName: 'Tôi',
          consumedPortion: 1,
          customCalories: adjusted.kcal,
          customProtein: adjusted.protein,
          customFat: adjusted.fat,
          customCarbs: adjusted.carbs,
          customFiber: selectedItem.fiber,
          customSodium: adjusted.sodium,
        }),
      });

      if (res.status === 401) {
        setFeedback({
          type: 'auth',
          message: 'Hãy đăng nhập để ghi món hàng quán vừa tra cứu vào Nhật ký hôm nay.',
        });
        return;
      }

      if (res.ok) {
        markDiaryDateActive(todayStr);
        setFeedback({
          type: 'success',
          message: `Đã ghi "${finalName}" (${adjusted.kcal} kcal) vào Nhật ký hôm nay!`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Không thể lưu vào Nhật ký lúc này. Vui lòng thử lại.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Lỗi kết nối máy chủ khi ghi Nhật ký.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="street-food-lookup-heading"
      className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-7 shadow-xs space-y-5 no-print"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-brand-primary)]">
            <Utensils className="w-3.5 h-3.5" />
            <span>Từ điển Calo Hàng Quán &amp; Đồ Uống Việt</span>
          </div>
          <h2
            id="street-food-lookup-heading"
            className="text-lg sm:text-xl font-extrabold text-[var(--color-text-primary)] mt-0.5"
          >
            Tra Cứu Nhanh Calo Phở · Cơm Tấm · Bánh Mì · Trà Sữa &amp; Nút Gạt Giảm Calo
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            So sánh trực tiếp với mục tiêu <strong>{targetCalories} kcal/ngày</strong> của bạn và thử gạt bỏ nước béo, bớt bánh hoặc giảm đường.
          </p>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm Phở, Bún đậu, Cơm tấm, Trà sữa..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
          />
        </div>
      </div>

      {/* Bộ lọc nhóm món */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setCategory(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              category === tab.key
                ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:border-[var(--color-brand-border)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Danh sách món bên trái */}
        <div className="lg:col-span-5 space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredItems.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] py-6 text-center">
              Không tìm thấy món khớp từ khóa &quot;{query}&quot;.
            </p>
          ) : (
            filteredItems.map((item) => {
              const active = selectedItem.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    active
                      ? 'bg-emerald-50 border-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)]'
                      : 'bg-[var(--color-surface-subtle)] border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                      {item.servingLabel} • Đạm {item.protein}g • Natri {item.sodium}mg
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-black text-[var(--color-accent-primary)]">
                    {item.calories} kcal
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Thẻ phân tích & Nút gạt khử Calo bên phải */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-[#FAF7F0] border border-[#E5DAC8] space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                {selectedItem.servingLabel}
              </span>
              <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">
                {selectedItem.name}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[var(--color-accent-primary)] leading-none">
                {adjusted.kcal} <span className="text-xs font-bold">kcal</span>
              </div>
              {adjusted.savedKcal > 0 && (
                <span className="text-[11px] font-bold text-emerald-700">
                  Đã giảm được -{adjusted.savedKcal} kcal
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-white border border-[#E5DAC8]">
              <span className="text-[10px] font-bold text-stone-500 block">Đạm</span>
              <strong className="text-rose-700 font-black">{adjusted.protein}g</strong>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#E5DAC8]">
              <span className="text-[10px] font-bold text-stone-500 block">Chất béo</span>
              <strong className="text-teal-700 font-black">{adjusted.fat}g</strong>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#E5DAC8]">
              <span className="text-[10px] font-bold text-stone-500 block">Tinh bột</span>
              <strong className="text-amber-700 font-black">{adjusted.carbs}g</strong>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#E5DAC8]">
              <span className="text-[10px] font-bold text-stone-500 block">Natri (Muối)</span>
              <strong className="text-indigo-700 font-black">{adjusted.sodium}mg</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#E5DAC8] font-bold text-[var(--color-text-primary)]">
              <Flame className="w-3.5 h-3.5 text-orange-600" />
              Chiếm {adjusted.dailyPct}% ngân sách {targetCalories} kcal/ngày
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#E5DAC8] font-bold text-[var(--color-text-primary)]">
              <Footprints className="w-3.5 h-3.5 text-emerald-700" />
              ~{adjusted.briskWalkMinutes} phút đi bộ nhanh để tiêu hao
            </span>
          </div>

          {selectedItem.modifiers.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-emerald-950 block">
                🎛️ Thử gạt bớt khi gọi món ngoài quán:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedItem.modifiers.map((mod) => {
                  const checked = selectedModIds.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModifier(mod.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        checked
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {checked ? '✓ ' : '+ '}
                      {mod.label} ({mod.deltaCalories} kcal)
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-[#E5DAC8] flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-xl border border-[#D8C7B0] bg-white p-0.5">
              {(
                [
                  { key: 'BREAKFAST' as const, label: 'Sáng' },
                  { key: 'LUNCH' as const, label: 'Trưa' },
                  { key: 'DINNER' as const, label: 'Tối' },
                  { key: 'SNACK' as const, label: 'Phụ' },
                ]
              ).map((slot) => (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => setMealSlot(slot.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    mealSlot === slot.key
                      ? 'bg-[var(--color-brand-primary)] text-white'
                      : 'text-stone-600'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogToDiary}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-white text-xs font-extrabold hover:opacity-95 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <HeartPulse className="w-4 h-4" />
              <span>{saving ? 'Đang lưu...' : `📝 Ghi vào Nhật ký (${adjusted.kcal} kcal)`}</span>
            </button>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : feedback.type === 'auth'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <LogIn className="w-4 h-4 text-amber-700 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              {feedback.type === 'success' ? (
                <Link
                  href="/nhat-ky"
                  className="shrink-0 px-3 py-1 rounded-lg bg-[var(--color-brand-primary)] text-white text-xs font-bold"
                >
                  Mở Nhật ký →
                </Link>
              ) : feedback.type === 'auth' ? (
                <Link
                  href="/login?from=/tinh-calo"
                  className="shrink-0 px-3 py-1 rounded-lg bg-[var(--color-brand-primary)] text-white text-xs font-bold"
                >
                  Đăng nhập ngay
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
