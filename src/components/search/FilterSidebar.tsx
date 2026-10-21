'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Clock, Flame, ShieldCheck, Tag, ArrowUpDown, HeartPulse } from 'lucide-react';
import { SORT_LABELS, TIME_PRESETS, CALORIE_PRESETS } from '@/lib/recipes/labels';

interface FilterSidebarProps {
  taxonomies?: { id: number; name: string; slug: string; type: string }[];
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export function FilterSidebar({
  taxonomies = [],
  isMobileDrawer = false,
  onCloseMobileDrawer,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentMaxTime = searchParams.get('maxTime') || '';
  const currentMaxCalories = searchParams.get('maxCalories') || '';
  const currentDifficulty = searchParams.get('difficulty') || '';
  const currentTested = searchParams.get('tested') === 'true';
  const currentNutrition = searchParams.get('nutrition') === 'true';
  const currentTaxonomy = searchParams.get('tax') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');

    startTransition(() => {
      router.push(`/mon-an?${params.toString()}`);
    });
  }

  function handleResetAll() {
    startTransition(() => {
      router.push('/mon-an');
      if (onCloseMobileDrawer) onCloseMobileDrawer();
    });
  }

  // Nhóm taxonomy theo loại
  const methods = taxonomies.filter((t) => t.type === 'COOKING_METHOD');
  const regions = taxonomies.filter((t) => t.type === 'CUISINE_REGION');
  const diets = taxonomies.filter((t) => t.type === 'DIET_PREFERENCE' || t.type === 'OCCASION');

  return (
    <aside className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[var(--color-brand-primary)]" />
          <span>Bộ lọc nâng cao</span>
        </h2>
        <button
          type="button"
          onClick={handleResetAll}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)] transition-colors"
        >
          Đặt lại
        </button>
      </div>

      {/* 1. Sắp xếp */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sắp xếp theo</span>
        </label>
        <select
          value={currentSort}
          onChange={(e) => updateParam('sort', e.target.value === 'newest' ? null : e.target.value)}
          disabled={isPending}
          className="w-full px-3 py-2 text-xs bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
        >
          {Object.entries(SORT_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Thời gian nấu */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Thời gian nấu</span>
        </span>
        <div className="flex flex-col gap-1.5">
          {TIME_PRESETS.map((p) => {
            const valStr = p.value ? String(p.value) : '';
            const isChecked = currentMaxTime === valStr;
            return (
              <label
                key={p.label}
                className="flex items-center gap-2 text-xs text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-brand-primary)]"
              >
                <input
                  type="radio"
                  name="maxTime"
                  checked={isChecked}
                  onChange={() => updateParam('maxTime', valStr ? valStr : null)}
                  className="w-3.5 h-3.5 text-[var(--color-brand-primary)] border-[var(--color-border-base)] focus:ring-[var(--color-brand-primary)]"
                />
                <span>{p.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2b. Mức năng lượng (Calo / Khẩu phần) */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
          <HeartPulse className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
          <span>Mức Calo / khẩu phần</span>
        </span>
        <div className="flex flex-col gap-1.5">
          {CALORIE_PRESETS.map((p) => {
            const valStr = p.value ? String(p.value) : '';
            const isChecked = currentMaxCalories === valStr;
            return (
              <label
                key={p.label}
                className="flex items-center gap-2 text-xs text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-brand-primary)]"
              >
                <input
                  type="radio"
                  name="maxCalories"
                  checked={isChecked}
                  onChange={() => updateParam('maxCalories', valStr ? valStr : null)}
                  className="w-3.5 h-3.5 text-[var(--color-brand-primary)] border-[var(--color-border-base)] focus:ring-[var(--color-brand-primary)]"
                />
                <span>{p.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Độ khó */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5" />
          <span>Độ khó</span>
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {['', 'Dễ', 'Vừa', 'Khó'].map((diff) => {
            const isSelected = (currentDifficulty === diff) || (!currentDifficulty && diff === '');
            return (
              <button
                key={diff || 'all'}
                type="button"
                onClick={() => updateParam('difficulty', diff || null)}
                className={`py-1.5 px-2 text-xs rounded-lg text-center transition-all ${
                  isSelected
                    ? 'bg-[var(--color-brand-primary)] text-white font-medium'
                    : 'bg-[var(--color-surface-white)] text-[var(--color-text-secondary)] border border-[var(--color-border-base)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                {diff || 'Tất cả'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Nhãn kiểm chứng */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Kiểm chứng</span>
        </span>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-xs text-[var(--color-text-primary)] cursor-pointer">
            <input
              type="checkbox"
              checked={currentTested}
              onChange={(e) => updateParam('tested', e.target.checked ? 'true' : null)}
              className="w-3.5 h-3.5 rounded text-[var(--color-brand-primary)] border-[var(--color-border-base)] focus:ring-[var(--color-brand-primary)]"
            />
            <span>Đã nấu thử trong bếp mẫu</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--color-text-primary)] cursor-pointer">
            <input
              type="checkbox"
              checked={currentNutrition}
              onChange={(e) => updateParam('nutrition', e.target.checked ? 'true' : null)}
              className="w-3.5 h-3.5 rounded text-[var(--color-brand-primary)] border-[var(--color-border-base)] focus:ring-[var(--color-brand-primary)]"
            />
            <span>Đã kiểm định dinh dưỡng</span>
          </label>
        </div>
      </div>

      {/* 5. Cách nấu (Cooking Methods) */}
      {methods.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>Cách chế biến</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {methods.map((m) => {
              const isActive = currentTaxonomy === m.slug;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateParam('tax', isActive ? null : m.slug)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                    isActive
                      ? 'bg-[var(--color-brand-primary)] text-white font-medium'
                      : 'bg-[var(--color-surface-white)] text-[var(--color-text-secondary)] border border-[var(--color-border-base)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Vùng miền (Regions) */}
      {regions.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>Vùng miền</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {regions.map((r) => {
              const isActive = currentTaxonomy === r.slug;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => updateParam('tax', isActive ? null : r.slug)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                    isActive
                      ? 'bg-[var(--color-brand-primary)] text-white font-medium'
                      : 'bg-[var(--color-surface-white)] text-[var(--color-text-secondary)] border border-[var(--color-border-base)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Chế độ ăn & Dịp (Diets / Occasions) */}
      {diets.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Chế độ ăn & Dịp</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {diets.map((d) => {
              const isActive = currentTaxonomy === d.slug;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => updateParam('tax', isActive ? null : d.slug)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                    isActive
                      ? 'bg-[var(--color-brand-primary)] text-white font-medium'
                      : 'bg-[var(--color-surface-white)] text-[var(--color-text-secondary)] border border-[var(--color-border-base)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isMobileDrawer && onCloseMobileDrawer && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border-base)]">
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="w-full py-2.5 bg-[var(--color-brand-primary)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Áp dụng bộ lọc
          </button>
        </div>
      )}
    </aside>
  );
}
