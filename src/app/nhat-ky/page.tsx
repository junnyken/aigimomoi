'use client';

// AG-37 & AG-38: Trang Nhật Ký Bữa Ăn Gia Đình (Family Meal Diary)
// Theo dõi năng lượng, khẩu phần thực tế đã ăn và đối chiếu khuyến nghị Viện Dinh Dưỡng

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  HeartPulse,
  Users,
  Utensils,
  Sun,
  Sunrise,
  Moon,
  Coffee,
  Sparkles,
  Loader2,
  X,
  Check,
  Scale,
} from 'lucide-react';
import {
  loadPersonalNutritionTarget,
  type PersonalNutritionTarget,
} from '@/lib/nutrition/personalTarget';

interface DiaryEntry {
  id: number;
  recipeId: number | null;
  recipeName: string;
  diaryDate: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  memberName: string;
  consumedPortion: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  sodium: number | null;
  fiber: number | null;
  recipe?: {
    slug: string;
    heroImage: string | null;
  } | null;
}

interface DailySummary {
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  totalSodium: number | null;
  totalFiber: number | null;
  macroPercentages: {
    protein: number;
    fat: number;
    carbs: number;
  };
  alerts: string[];
}

const MEAL_CONFIG = {
  BREAKFAST: { label: 'Bữa sáng', icon: Sunrise, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  LUNCH: { label: 'Bữa trưa', icon: Sun, color: 'text-orange-500 bg-orange-50 border-orange-200' },
  DINNER: { label: 'Bữa tối', icon: Moon, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
  SNACK: { label: 'Bữa phụ / Tráng miệng', icon: Coffee, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
};

const DAILY_CALORIE_TARGETS = [
  { label: 'Giảm cân (1.400 kcal)', value: 1400 },
  { label: 'Giữ dáng (1.800 kcal)', value: 1800 },
  { label: 'Chuẩn Việt (2.000 kcal)', value: 2000 },
  { label: 'Tăng cơ / Mẹ bầu (2.300 kcal)', value: 2300 },
];

const QUICK_DIARY_PRESETS = [
  'Cơm trắng (1 chén 100g)',
  'Cơm gạo lứt (1 chén 100g)',
  'Nước mắm tỏi ớt chua ngọt',
  'Kho quẹt chấm rau luộc',
  'Trái cây tráng miệng theo mùa',
];

export default function MealDiaryPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-primary)] mb-2" />
        <p className="text-xs">Đang tải nhật ký dinh dưỡng gia đình...</p>
      </div>
    }>
      <MealDiaryContent />
    </Suspense>
  );
}

function MealDiaryContent() {
  const [selectedDate, setSelectedDate] = useState('');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [meals, setMeals] = useState<Record<string, DiaryEntry[]>>({
    BREAKFAST: [],
    LUNCH: [],
    DINNER: [],
    SNACK: [],
  });
  const [summary, setSummary] = useState<DailySummary>({
    totalCalories: 0,
    totalProtein: 0,
    totalFat: 0,
    totalCarbs: 0,
    totalSodium: null,
    totalFiber: null,
    macroPercentages: { protein: 0, fat: 0, carbs: 0 },
    alerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [targetCalories, setTargetCalories] = useState(2000);
  const [personalTarget, setPersonalTarget] = useState<PersonalNutritionTarget | null>(null);

  // Modal Add Entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addMealType, setAddMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>('LUNCH');
  const [recipeName, setRecipeName] = useState('');
  const [memberName, setMemberName] = useState('Cả nhà');
  const [portion, setPortion] = useState(1.0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);

    const saved = loadPersonalNutritionTarget();
    if (saved) {
      setPersonalTarget(saved);
      setTargetCalories(saved.targetCalories);
    }
  }, []);

  async function loadDiary(dateStr: string) {
    if (!dateStr) return;
    setLoading(true);
    setAuthError(false);
    try {
      const res = await fetch(`/api/diary?date=${dateStr}`);
      if (res.status === 401) {
        setAuthError(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setMeals(data.meals || { BREAKFAST: [], LUNCH: [], DINNER: [], SNACK: [] });
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (e) {
      console.error('Error fetching diary', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedDate) {
      loadDiary(selectedDate);
    }
  }, [selectedDate]);

  function changeDay(delta: number) {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + delta);
    setSelectedDate(current.toISOString().split('T')[0]);
  }

  async function handleDeleteEntry(id: number) {
    try {
      const res = await fetch(`/api/diary/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadDiary(selectedDate);
      }
    } catch (e) {
      console.error('Error deleting entry', e);
    }
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!recipeName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeName: recipeName.trim(),
          diaryDate: selectedDate,
          mealType: addMealType,
          memberName: memberName.trim() || 'Cả nhà',
          consumedPortion: portion,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setRecipeName('');
        setPortion(1.0);
        loadDiary(selectedDate);
      }
    } catch (e) {
      console.error('Error logging entry', e);
    } finally {
      setSubmitting(false);
    }
  }

  const caloriePercent = Math.min(100, Math.round((summary.totalCalories / targetCalories) * 100));

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)] pb-20 rounded-3xl overflow-hidden border border-[var(--color-border-base)]">
      {/* Header */}
      <div className="bg-[var(--color-surface-white)] border-b border-[var(--color-border-base)] sticky top-0 z-20">
        <div className="w-full mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-500" />
              Nhật Ký Bữa Ăn Gia Đình
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Theo dõi khẩu phần ăn thực tế và cân đối năng lượng theo chuẩn Viện Dinh Dưỡng
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/diary/export"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border-base)] text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất dữ liệu JSON
            </a>
          </div>
        </div>

        {/* Date Selector */}
        <div className="w-full mx-auto px-4 sm:px-6 py-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeDay(-1)}
            className="p-1.5 rounded-lg border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
            title="Ngày trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
            <Calendar className="w-4 h-4 text-[var(--color-brand-primary)]" />
            <span>{new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            {selectedDate === new Date().toISOString().split('T')[0] && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Hôm nay
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => changeDay(1)}
            className="p-1.5 rounded-lg border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
            title="Ngày sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 mt-6">
        {authError ? (
          <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl p-10 text-center">
            <HeartPulse className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              Yêu cầu đăng nhập tài khoản
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
              Nhật ký bữa ăn gia đình là dữ liệu riêng tư. Vui lòng đăng nhập để lưu trữ và theo dõi dinh dưỡng.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <Link
                href="/login?from=/nhat-ky"
                className="min-h-11 inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white shadow-xs transition-colors"
              >
                Đăng nhập để mở nhật ký
              </Link>
              <Link
                href="/register?from=/nhat-ky"
                className="min-h-11 inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] transition-colors"
              >
                Tạo tài khoản mới
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-primary)] mb-2" />
            <p className="text-xs">Đang tải nhật ký dinh dưỡng gia đình...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Daily Overview Card */}
            <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                    Tổng năng lượng đã nạp hôm nay
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-[var(--color-text-primary)]">
                      {summary.totalCalories}
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                      / {targetCalories} kcal mục tiêu ngày
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {personalTarget && (
                      <button
                        type="button"
                        onClick={() => setTargetCalories(personalTarget.targetCalories)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                          targetCalories === personalTarget.targetCalories
                            ? 'bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]'
                            : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        🎯 Phác đồ của tôi ({personalTarget.targetCalories} kcal)
                      </button>
                    )}
                    {DAILY_CALORIE_TARGETS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTargetCalories(t.value)}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
                          targetCalories === t.value
                            ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                            : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-brand-border)]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                    <Link
                      href="/tinh-calo"
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 inline-flex items-center gap-1 transition-colors"
                    >
                      <Scale className="w-3 h-3" />
                      <span>{personalTarget ? 'Cập nhật TDEE' : 'Tính TDEE cá nhân'}</span>
                    </Link>
                  </div>
                </div>

                {/* Macro % Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    🥩 Đạm: {summary.macroPercentages.protein}%
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                    🧈 Béo: {summary.macroPercentages.fat}%
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    🍚 Bột đường: {summary.macroPercentages.carbs}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-3 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    caloriePercent > 100
                      ? 'bg-red-500'
                      : caloriePercent >= 80
                      ? 'bg-emerald-500'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${caloriePercent}%` }}
                />
              </div>

              {/* Macro breakdown detail */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-[var(--color-border-subtle)]">
                <div>
                  <span className="text-[var(--color-text-muted)]">Chất đạm (Protein)</span>
                  <p className="font-bold text-[var(--color-text-primary)] text-sm">
                    {summary.totalProtein}
                    {personalTarget ? (
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">
                        {' '}
                        / {personalTarget.proteinGrams}g
                      </span>
                    ) : (
                      ' g'
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">Chất béo (Lipid)</span>
                  <p className="font-bold text-[var(--color-text-primary)] text-sm">
                    {summary.totalFat}
                    {personalTarget ? (
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">
                        {' '}
                        / {personalTarget.fatGrams}g
                      </span>
                    ) : (
                      ' g'
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">Đường bột (Carbs)</span>
                  <p className="font-bold text-[var(--color-text-primary)] text-sm">
                    {summary.totalCarbs}
                    {personalTarget ? (
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">
                        {' '}
                        / {personalTarget.carbsGrams}g
                      </span>
                    ) : (
                      ' g'
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">Muối / Natri</span>
                  <p className="font-bold text-[var(--color-text-primary)] text-sm">
                    {summary.totalSodium !== null ? `${summary.totalSodium} mg` : '—'}
                    <span className="text-[11px] font-normal text-[var(--color-text-muted)]"> (&lt;2000mg)</span>
                  </p>
                </div>
              </div>

              {/* Khẩu phần bếp nhà đã đồng bộ từ trang Tính Calo */}
              {personalTarget && (
                <div className="mt-4 p-3 rounded-xl bg-[#FAF7F0] border border-[#EADBC8] text-xs text-[#4A3C2F] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <strong className="text-[#3F6240]">📌 Định lượng Bếp Nhà của bạn hôm nay:</strong>{' '}
                    ~<strong>{personalTarget.rawMeatFishEquivalentGrams}g</strong> thịt/cá tươi sống •{' '}
                    <strong>{personalTarget.whiteRiceBowlsPerDay} chén</strong> cơm trắng (hoặc{' '}
                    <strong>{personalTarget.brownRiceBowlsPerDay} chén</strong> gạo lứt) •{' '}
                    <strong>400–500g</strong> rau xanh • <strong>{personalTarget.waterLiters} lít</strong> nước.
                  </div>
                  <Link
                    href="/meal"
                    className="shrink-0 font-bold text-[var(--color-brand-primary)] hover:underline"
                  >
                    Ghép mâm tối (~{personalTarget.dinnerKcal} kcal) &rarr;
                  </Link>
                </div>
              )}

              {/* Health Alerts */}
              {summary.alerts && summary.alerts.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    {summary.alerts.map((a, i) => (
                      <p key={i}>{a}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4 Bữa Ăn Trong Ngày */}
            {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map((type) => {
              const conf = MEAL_CONFIG[type];
              const Icon = conf.icon;
              const mealList = meals[type] || [];
              const mealCalories = mealList.reduce((acc, m) => acc + m.calories, 0);

              return (
                <div
                  key={type}
                  className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`p-2 rounded-xl border ${conf.color}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-bold text-[var(--color-text-primary)]">{conf.label}</h2>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {mealList.length} món • {mealCalories} kcal
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAddMealType(type);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border-base)] text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm món
                    </button>
                  </div>

                  {mealList.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-muted)] italic py-2">
                      Chưa ghi nhận món ăn nào trong bữa này.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--color-border-subtle)]">
                      {mealList.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {item.recipe?.slug ? (
                                <Link
                                  href={`/cong-thuc/${item.recipe.slug}`}
                                  className="font-bold text-[var(--color-text-primary)] hover:underline truncate"
                                >
                                  {item.recipeName}
                                </Link>
                              ) : (
                                <span className="font-bold text-[var(--color-text-primary)] truncate">
                                  {item.recipeName}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                {item.memberName} ({item.consumedPortion} phần)
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                              Đạm: {item.protein}g • Béo: {item.fat}g • Bột đường: {item.carbs}g
                              {item.sodium !== null && ` • Natri: ${item.sodium}mg`}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm text-[var(--color-text-primary)] whitespace-nowrap">
                              {item.calories} <span className="text-[10px] font-normal text-[var(--color-text-muted)]">kcal</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(item.id)}
                              className="p-1 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              title="Xóa món này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Thêm món vào nhật ký */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-[var(--color-brand-primary)]" />
              Ghi Món Vào {MEAL_CONFIG[addMealType].label}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              Ngày: {selectedDate}
            </p>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Tên món ăn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Canh cua mồng tơi, Thịt luộc cà pháo"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK_DIARY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRecipeName(preset)}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-[var(--color-surface-raised)] hover:bg-[var(--color-brand-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] border border-[var(--color-border-subtle)] transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Thành viên ăn
                  </label>
                  <input
                    type="text"
                    placeholder="Bố, Mẹ, Bé Bo..."
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Khẩu phần ăn thực tế
                  </label>
                  <select
                    value={portion}
                    onChange={(e) => setPortion(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                  >
                    <option value={0.5}>0.5 phần (ăn ít / trẻ em)</option>
                    <option value={1.0}>1.0 phần (chuẩn)</option>
                    <option value={1.5}>1.5 phần (ăn nhiều)</option>
                    <option value={2.0}>2.0 phần (2 người ăn)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover,#b3391b)] disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Ghi vào nhật ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
