'use client';

// AG-41: Trang Lập Kế Hoạch Bữa Cơm Tuần (Weekly Meal Planner)
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  Trash2, 
  ShoppingBag, 
  Utensils, 
  CheckCircle2, 
  ExternalLink,
  LogIn
} from 'lucide-react';

interface MealPlan {
  id: number;
  planDate: string;
  dayOfWeek: number;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  recipeId: number | null;
  customDishName: string | null;
  servings: number;
  notes: string | null;
  isCompleted: boolean;
  recipe?: {
    id: number;
    slug: string;
    name: string;
    role: string;
    heroImage: string | null;
    caloriesPerServing: number | null;
  } | null;
}

const DAY_NAMES = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'
];

const MEAL_LABELS: Record<string, { label: string; icon: string }> = {
  BREAKFAST: { label: 'Bữa sáng', icon: '☀️' },
  LUNCH: { label: 'Bữa trưa', icon: '🍲' },
  DINNER: { label: 'Bữa tối', icon: '🌙' },
  SNACK: { label: 'Ăn vặt', icon: '🍎' },
};

function WeeklyPlannerContent() {
  const [weekStart, setWeekStart] = useState<string>('');
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>('LUNCH');

  // Add form state
  const [availableRecipes, setAvailableRecipes] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [customDishName, setCustomDishName] = useState('');
  const [servings, setServings] = useState('4');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Shopping aggregation modal
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [shoppingItems, setShoppingItems] = useState<any[]>([]);
  const [excludePantry, setExcludePantry] = useState(true);
  const [aggregating, setAggregating] = useState(false);

  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Khởi tạo Thứ 2 tuần hiện tại
  useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    setWeekStart(toLocalDateStr(monday));
  }, []);

  // Tải danh sách công thức để chọn
  useEffect(() => {
    async function loadRecipes() {
      try {
        const res = await fetch('/api/recipes?limit=50');
        if (res.ok) {
          const data = await res.json();
          setAvailableRecipes(Array.isArray(data) ? data : (data.recipes || []));
        }
      } catch (e) {
        console.error('Failed to load recipes', e);
      }
    }
    loadRecipes();
  }, []);

  const fetchPlans = async (start: string) => {
    if (!start) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/meal-plans?weekStart=${start}`);
      if (res.status === 401) {
        setIsUnauthorized(true);
        return;
      }
      if (res.ok) {
        setIsUnauthorized(false);
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (e) {
      console.error('Failed to load meal plans', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weekStart) {
      fetchPlans(weekStart);
    }
  }, [weekStart]);

  const changeWeek = (offsetDays: number) => {
    if (!weekStart) return;
    const current = new Date(weekStart);
    current.setDate(current.getDate() + offsetDays);
    setWeekStart(current.toISOString().split('T')[0]);
  };

  const handleOpenAddModal = (dateStr: string, mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK') => {
    setSelectedDayDate(dateStr);
    setSelectedMealType(mealType);
    setSelectedRecipeId('');
    setCustomDishName('');
    setNotes('');
    setShowAddModal(true);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId && !customDishName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planDate: selectedDayDate,
          mealType: selectedMealType,
          recipeId: selectedRecipeId ? Number(selectedRecipeId) : null,
          customDishName: customDishName.trim() || undefined,
          servings: Number(servings) || 4,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setToastMessage('Đã thêm món vào kế hoạch tuần!');
        setTimeout(() => setToastMessage(''), 3000);
        fetchPlans(weekStart);
      }
    } catch (err) {
      console.error('Create plan error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa món này khỏi kế hoạch?')) return;
    try {
      const res = await fetch(`/api/meal-plans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Delete plan error', err);
    }
  };

  const handleLogToDiary = async (plan: MealPlan) => {
    try {
      const res = await fetch(`/api/meal-plans/${plan.id}/log-to-diary`, {
        method: 'POST',
      });
      if (res.ok) {
        setToastMessage(`Đã hoàn thành món "${plan.customDishName || plan.recipe?.name}" và ghi vào Nhật ký dinh dưỡng!`);
        setTimeout(() => setToastMessage(''), 4000);
        fetchPlans(weekStart);
      }
    } catch (err) {
      console.error('Log to diary error', err);
    }
  };

  const handleAggregateShopping = async (overrideExcludePantry?: boolean) => {
    if (!weekStart) return;
    const shouldExcludePantry = overrideExcludePantry ?? excludePantry;
    setAggregating(true);
    try {
      const res = await fetch('/api/meal-plans/to-shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart,
          excludePantry: shouldExcludePantry,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShoppingItems(data.items || []);
        setShowShoppingModal(true);
      }
    } catch (err) {
      console.error('Aggregate shopping error', err);
    } finally {
      setAggregating(false);
    }
  };

  // Tạo mảng 7 ngày từ weekStart
  const daysInWeek = Array.from({ length: 7 }, (_, i) => {
    if (!weekStart) return { dateStr: '', dayName: DAY_NAMES[i], displayDate: '' };
    const d = new Date(`${weekStart}T00:00:00`);
    d.setDate(d.getDate() + i);
    const dateStr = toLocalDateStr(d);
    const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
    return {
      dateStr,
      dayName: DAY_NAMES[i],
      displayDate,
      dayNumber: i + 1,
    };
  });

  if (!loading && isUnauthorized) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-[var(--color-surface-white)] rounded-3xl border border-[var(--color-border-base)] p-8 sm:p-10 text-center shadow-xs space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)]/70 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-brand-primary)]">
              Kế Hoạch Bữa Cơm Tuần
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Lên thực đơn 7 ngày cho cả gia đình, gộp nguyên liệu đi chợ cả tuần có trừ sẵn đồ trong tủ lạnh và đánh dấu hoàn thành để lưu vào Nhật ký dinh dưỡng.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login?from=/ke-hoach-tuan"
              className="min-h-11 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white font-semibold text-sm transition-colors shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập để lên lịch tuần</span>
            </Link>
            <Link
              href="/register?from=/ke-hoach-tuan"
              className="min-h-11 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] font-semibold text-sm transition-colors"
            >
              <span>Tạo tài khoản mới</span>
            </Link>
            <Link
              href="/meal"
              className="min-h-11 inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-[var(--color-accent-text)] bg-[var(--color-accent-light)] hover:opacity-95 font-semibold text-sm transition-colors"
            >
              <Utensils className="w-4 h-4" />
              <span>Ghép mâm cơm hôm nay</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">📅</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-brand-primary)]">
              Kế Hoạch Bữa Cơm Tuần
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Lên thực đơn 7 ngày cho gia đình, tự động tổng hợp nguyên liệu đi chợ và đồng bộ nhật ký dinh dưỡng.
          </p>
        </div>

        {/* Nút thao tác nhanh */}
        <div className="flex items-center gap-3">
          <Link
            href="/tu-lanh"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 bg-white hover:bg-stone-50 font-medium text-sm transition-colors shadow-xs"
          >
            <span>🧊 Tủ lạnh gia đình</span>
          </Link>
          <button
            onClick={() => handleAggregateShopping()}
            disabled={aggregating || plans.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm transition-all shadow-xs disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{aggregating ? 'Đang tính...' : '🛒 Tổng hợp giỏ đi chợ tuần'}</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Điều hướng tuần */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-xs mb-8">
        <button
          onClick={() => changeWeek(-7)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Tuần trước</span>
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--color-brand-primary)]" />
          <span className="font-bold text-base text-stone-800">
            {daysInWeek[0]?.displayDate} — {daysInWeek[6]?.displayDate}
          </span>
        </div>

        <button
          onClick={() => changeWeek(7)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors"
        >
          <span>Tuần tới</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Thống kê nhanh Tiến độ & Năng lượng Tuần */}
      {plans.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Tổng số món trong tuần</span>
              <p className="text-xl font-bold text-[var(--color-text-primary)] mt-0.5">{plans.length} món</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand-light)] text-[var(--color-brand-primary)]">
              7 ngày
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Đã nấu &amp; Ghi nhật ký</span>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">
                {plans.filter((p) => p.isCompleted).length} / {plans.length} món
              </p>
            </div>
            <Link
              href="/nhat-ky"
              className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
            >
              Mở nhật ký &rarr;
            </Link>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Tổng năng lượng ước tính</span>
              <p className="text-xl font-bold text-[var(--color-accent-primary)] mt-0.5">
                ~{plans.reduce((sum, p) => sum + (p.recipe?.caloriesPerServing ?? 0), 0)} kcal/người
              </p>
            </div>
            <Link
              href="/meal"
              className="text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
            >
              Ghép mâm &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Bảng 7 ngày */}
      {loading ? (
        <div className="text-center py-20 text-stone-400">Đang tải kế hoạch tuần...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {daysInWeek.map((day) => {
            const dayPlans = plans.filter((p) => p.planDate === day.dateStr);

            return (
              <div
                key={day.dateStr}
                className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-xs flex flex-col justify-between min-h-[360px]"
              >
                <div>
                  {/* Tiêu đề ngày */}
                  <div className="pb-2.5 mb-3 border-b border-stone-100 flex items-baseline justify-between">
                    <span className="font-extrabold text-sm text-[var(--color-brand-primary)]">
                      {day.dayName}
                    </span>
                    <span className="text-xs font-semibold text-stone-400">
                      {day.displayDate}
                    </span>
                  </div>

                  {/* Danh sách các bữa trong ngày */}
                  <div className="space-y-3">
                    {(['BREAKFAST', 'LUNCH', 'DINNER'] as const).map((mType) => {
                      const mealItem = dayPlans.find((p) => p.mealType === mType);

                      return (
                        <div key={mType} className="bg-stone-50/70 p-2.5 rounded-xl border border-stone-100">
                          <div className="flex items-center justify-between mb-1.5 text-xs">
                            <span className="font-bold text-stone-600 flex items-center gap-1">
                              <span>{MEAL_LABELS[mType].icon}</span>
                              <span>{MEAL_LABELS[mType].label}</span>
                            </span>
                            {!mealItem && (
                              <button
                                onClick={() => handleOpenAddModal(day.dateStr, mType)}
                                className="text-[11px] font-semibold text-[var(--color-brand-primary)] hover:underline"
                              >
                                + Thêm
                              </button>
                            )}
                          </div>

                          {mealItem ? (
                            <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-xs">
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <span className={`font-bold text-xs leading-tight ${mealItem.isCompleted ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                                  {mealItem.customDishName || mealItem.recipe?.name}
                                </span>
                                <button
                                  onClick={() => handleDeletePlan(mealItem.id)}
                                  className="text-stone-300 hover:text-red-500 p-0.5"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              {mealItem.recipe && (
                                <Link
                                  href={`/cong-thuc/${mealItem.recipe.slug}`}
                                  className="text-[10px] text-stone-400 hover:text-[var(--color-brand-primary)] flex items-center gap-0.5 mb-1.5"
                                >
                                  <span>Xem công thức</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              )}

                              {/* Nút nấu xong & ghi nhật ký */}
                              {!mealItem.isCompleted ? (
                                <button
                                  onClick={() => handleLogToDiary(mealItem)}
                                  className="w-full mt-1 py-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Đã nấu xong</span>
                                </button>
                              ) : (
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold justify-center bg-emerald-50/50 py-0.5 rounded">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Đã ghi nhật ký</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-stone-300 italic py-1 text-center">
                              Chưa lên món
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-stone-400">
                    {dayPlans.length} món đã lên lịch
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm món vào kế hoạch */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 animate-scale-in">
            <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <span>📅</span> Thêm món vào {selectedDayDate} ({MEAL_LABELS[selectedMealType].label})
            </h3>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Chọn công thức từ hệ thống
                </label>
                <select
                  value={selectedRecipeId}
                  onChange={(e) => {
                    setSelectedRecipeId(e.target.value);
                    if (e.target.value) setCustomDishName('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                >
                  <option value="">-- Chọn công thức có sẵn --</option>
                  {availableRecipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-stone-200 w-full"></div>
                <span className="bg-white px-2 text-xs text-stone-400 uppercase">Hoặc</span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Tự nhập món ăn gia đình
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cơm tấm sườn bì chả, Bún chả..."
                  value={customDishName}
                  onChange={(e) => {
                    setCustomDishName(e.target.value);
                    if (e.target.value) setSelectedRecipeId('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Bữa ăn</label>
                  <select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                  >
                    <option value="BREAKFAST">Bữa sáng</option>
                    <option value="LUNCH">Bữa trưa</option>
                    <option value="DINNER">Bữa tối</option>
                    <option value="SNACK">Ăn vặt</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Số khẩu phần</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Ghi chú thêm (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ăn kèm dưa leo, bố về muộn..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-medium text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!selectedRecipeId && !customDishName.trim())}
                  className="px-5 py-2.5 rounded-xl bg-[var(--color-brand-primary)] text-white hover:opacity-95 font-bold text-sm transition-all shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Thêm vào kế hoạch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem Trước Giỏ Đi Chợ Tuần */}
      {showShoppingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-100 animate-scale-in max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛒</span>
                  <h3 className="text-xl font-bold text-stone-800">
                    Nguyên Liệu Đi Chợ Cả Tuần
                  </h3>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                  {shoppingItems.length} món cần mua
                </span>
              </div>

              <div className="mb-4 p-3 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludePantry}
                    onChange={(e) => {
                      const nextVal = e.target.checked;
                      setExcludePantry(nextVal);
                      handleAggregateShopping(nextVal);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-stone-700">
                    Bỏ qua nguyên liệu đã có sẵn trong Tủ lạnh gia đình
                  </span>
                </label>
              </div>

              {/* Danh sách nguyên liệu */}
              <div className="overflow-y-auto max-h-[45vh] pr-1 space-y-2">
                {shoppingItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      item.inPantry 
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 opacity-70' 
                        : 'bg-white border-stone-200 text-stone-800'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm block">{item.name}</span>
                      <span className="text-[11px] text-stone-400">
                        Dùng cho: {item.recipesUsedIn?.join(', ')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-[var(--color-brand-primary)]">
                        {item.totalAmount} {item.unit}
                      </span>
                      {item.inPantry && (
                        <span className="block text-[10px] text-emerald-700 font-semibold">
                          ✓ Đã có trong tủ ({item.pantryQuantity} {item.unit})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={() => setShowShoppingModal(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 font-medium text-sm transition-colors"
              >
                Đóng
              </button>

              <Link
                href="/shopping"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm transition-all shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Mở giỏ đi chợ chính</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WeeklyPlannerPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-stone-400">Đang tải kế hoạch mâm cơm tuần...</div>}>
      <WeeklyPlannerContent />
    </Suspense>
  );
}
