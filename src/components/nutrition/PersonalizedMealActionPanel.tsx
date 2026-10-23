'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Utensils,
  Calendar,
  Plus,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Clock,
  HeartPulse,
  Target,
  TrendingDown,
  TrendingUp,
  Dumbbell,
  Droplets,
  LogIn,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ApiRecipe {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  role: 'MAIN' | 'SOUP' | 'SIDE' | 'DIPPING_SAUCE' | 'ONE_DISH_MEAL' | 'DESSERT' | 'BEVERAGE';
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  caloriesPerServing: number | null;
  heroImage: string | null;
  nutritionSnapshot?: {
    perServing?: {
      calories?: number;
      protein?: number;
      fat?: number;
      carbs?: number;
      fiber?: number;
      sodium?: number;
    };
  } | null;
}

interface EnrichedRecipe extends ApiRecipe {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  totalMinutes: number;
  fitScore: number;
  fitBadge: string;
}

export interface PersonalizedMealActionProps {
  mode: 'meals' | 'roadmap';
  gender: 'female' | 'male';
  safeWeight: number;
  targetWeightKg: number | '';
  idealTargetKg: number;
  bmi: number;
  tdee: number;
  targetCalories: number;
  actualDailyDelta: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  waterLiters: number;
  breakfastKcal: number;
  lunchKcal: number;
  dinnerKcal: number;
  breakfastPro: number;
  lunchPro: number;
  dinnerPro: number;
  whiteRiceBowlsPerDay: number;
  brownRiceBowlsPerDay: number;
  lunchRiceBowls: number;
  dinnerRiceBowls: number;
  rawMeatFishEquivalentGrams: number;
  timelineWeeks: number | null;
  weightDiffKg: number;
  goal: 'lose_standard' | 'lose_mild' | 'maintain' | 'gain_muscle';
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

const ROLE_LABELS: Record<string, { label: string; badgeClass: string }> = {
  MAIN: {
    label: '🥩 Món Mặn (Đạm chính)',
    badgeClass: 'bg-rose-50 text-rose-900 border-rose-200',
  },
  SOUP: {
    label: '🍲 Món Canh (Thanh mát)',
    badgeClass: 'bg-sky-50 text-sky-900 border-sky-200',
  },
  SIDE: {
    label: '🥬 Món Rau / Xào nhẹ',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  },
};

export function PersonalizedMealActionPanel({
  mode,
  safeWeight,
  targetWeightKg,
  idealTargetKg,
  bmi,
  tdee,
  targetCalories,
  actualDailyDelta,
  proteinGrams,
  waterLiters,
  breakfastKcal,
  lunchKcal,
  dinnerKcal,
  breakfastPro,
  lunchPro,
  dinnerPro,
  lunchRiceBowls,
  dinnerRiceBowls,
  rawMeatFishEquivalentGrams,
  timelineWeeks,
  goal,
  activity,
}: PersonalizedMealActionProps) {
  const [recipes, setRecipes] = useState<ApiRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [comboIndex, setComboIndex] = useState(0);
  const [activeRoleTab, setActiveRoleTab] = useState<'ALL' | 'MAIN' | 'SOUP' | 'SIDE'>('ALL');
  const [showAllDishes, setShowAllDishes] = useState(false);

  // Chọn Ngày & Bữa để gắn trực tiếp vào Kế hoạch tuần (/ke-hoach-tuan) hoặc Nhật ký (/nhat-ky)
  const [selectedPlanDate, setSelectedPlanDate] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<'LUNCH' | 'DINNER' | 'BREAKFAST'>('DINNER');
  const [addedPlanIds, setAddedPlanIds] = useState<Record<string, boolean>>({});
  const [addedDiaryIds, setAddedDiaryIds] = useState<Record<string, boolean>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'auth' | 'error';
    message: string;
    linkHref?: string;
    linkLabel?: string;
  } | null>(null);

  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    setSelectedPlanDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    if (mode !== 'meals') return;
    let mounted = true;
    async function fetchAllRecipes() {
      try {
        setLoadingRecipes(true);
        const res = await fetch('/api/recipes');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.recipes || [];
          if (mounted) {
            setRecipes(list);
          }
        }
      } catch (err) {
        console.error('Failed to load recipes for calorie calculator:', err);
      } finally {
        if (mounted) setLoadingRecipes(false);
      }
    }
    fetchAllRecipes();
    return () => {
      mounted = false;
    };
  }, [mode]);

  const upcomingDays = useMemo(() => {
    if (!selectedPlanDate) return [];
    const base = new Date();
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(base);
      d.setDate(base.getDate() + idx);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const label =
        idx === 0
          ? `Hôm nay (${dd}/${mm})`
          : idx === 1
          ? `Ngày mai (${dd}/${mm})`
          : `${dayNames[d.getDay()]} (${dd}/${mm})`;
      return { dateStr, label };
    });
  }, [selectedPlanDate]);

  const enrichedRecipes = useMemo<EnrichedRecipe[]>(() => {
    return recipes
      .filter((r) => r.role === 'MAIN' || r.role === 'SOUP' || r.role === 'SIDE')
      .map((r) => {
        const snap = r.nutritionSnapshot?.perServing;
        const kcal = Math.round(
          snap?.calories || r.caloriesPerServing || (r.role === 'MAIN' ? 260 : r.role === 'SOUP' ? 110 : 85)
        );
        const protein =
          Math.round((snap?.protein ?? (r.role === 'MAIN' ? 20 : r.role === 'SOUP' ? 7 : 3)) * 10) / 10;
        const fat = Math.round((snap?.fat ?? 8) * 10) / 10;
        const carbs = Math.round((snap?.carbs ?? 6) * 10) / 10;
        const fiber = Math.round((snap?.fiber ?? (r.role === 'SIDE' ? 4.5 : 2)) * 10) / 10;
        const totalMinutes = (r.prepTimeMinutes || 15) + (r.cookTimeMinutes || 20);

        let fitScore = 50;
        let fitBadge = 'Cân bằng';
        const proteinRatio = kcal > 0 ? (protein * 4) / kcal : 0;

        if (goal === 'lose_standard' || goal === 'lose_mild') {
          if (r.role === 'MAIN') {
            if (kcal <= 300 && protein >= 16) {
              fitScore += 45;
              fitBadge = `Giảm cân • Giàu Đạm (${protein}g)`;
            } else if (kcal <= 360) {
              fitScore += 30;
              fitBadge = `Ít Calo (${kcal} kcal)`;
            } else {
              fitScore -= 15;
              fitBadge = `Đạm cao (${protein}g)`;
            }
            fitScore += Math.round(proteinRatio * 40);
          } else if (r.role === 'SOUP') {
            fitScore += kcal <= 150 ? 40 : 20;
            fitBadge = kcal <= 150 ? 'Canh thanh • Ít Calo' : 'Canh bổ dưỡng';
          } else if (r.role === 'SIDE') {
            fitScore += kcal <= 120 ? 40 : 25;
            fitBadge = `Giàu chất xơ (${kcal} kcal)`;
          }
        } else if (goal === 'gain_muscle') {
          if (r.role === 'MAIN') {
            fitScore += Math.round(protein * 2.5);
            fitBadge = protein >= 20 ? `Tăng cơ • ${protein}g Đạm` : `${protein}g Đạm`;
          } else {
            fitScore += Math.round(protein * 1.5) + 20;
            fitBadge = 'Hỗ trợ phục hồi cơ';
          }
        } else {
          fitScore += 30 + Math.round(proteinRatio * 20);
          fitBadge = 'Cơm nhà cân bằng';
        }

        return {
          ...r,
          kcal,
          protein,
          fat,
          carbs,
          fiber,
          totalMinutes,
          fitScore,
          fitBadge,
        };
      })
      .sort((a, b) => b.fitScore - a.fitScore);
  }, [recipes, goal]);

  const topMains = useMemo(() => enrichedRecipes.filter((r) => r.role === 'MAIN'), [enrichedRecipes]);
  const topSoups = useMemo(() => enrichedRecipes.filter((r) => r.role === 'SOUP'), [enrichedRecipes]);
  const topSides = useMemo(() => enrichedRecipes.filter((r) => r.role === 'SIDE'), [enrichedRecipes]);

  const suggestedTray = useMemo(() => {
    if (topMains.length === 0) return null;
    const main = topMains[comboIndex % topMains.length];
    const soup = topSoups.length > 0 ? topSoups[comboIndex % topSoups.length] : null;
    const side = topSides.length > 0 ? topSides[comboIndex % topSides.length] : null;

    const isDinner = selectedMealType === 'DINNER';
    const targetMealKcal = isDinner ? dinnerKcal : lunchKcal;
    const targetMealPro = isDinner ? dinnerPro : lunchPro;
    const riceBowls = isDinner ? dinnerRiceBowls : lunchRiceBowls;
    const isBrownRice = goal === 'lose_standard' || goal === 'lose_mild';
    const riceKcal = Math.round(riceBowls * (isBrownRice ? 110 : 130));
    const ricePro = Math.round(riceBowls * 2.6);

    const dishesKcal = (main?.kcal || 0) + (soup?.kcal || 0) + (side?.kcal || 0);
    const dishesPro =
      Math.round(((main?.protein || 0) + (soup?.protein || 0) + (side?.protein || 0)) * 10) / 10;

    const totalTrayKcal = dishesKcal + riceKcal;
    const totalTrayPro = Math.round((dishesPro + ricePro) * 10) / 10;

    return {
      main,
      soup,
      side,
      riceBowls,
      isBrownRice,
      riceKcal,
      dishesKcal,
      totalTrayKcal,
      totalTrayPro,
      targetMealKcal,
      targetMealPro,
    };
  }, [
    topMains,
    topSoups,
    topSides,
    comboIndex,
    selectedMealType,
    dinnerKcal,
    lunchKcal,
    dinnerPro,
    lunchPro,
    dinnerRiceBowls,
    lunchRiceBowls,
    goal,
  ]);

  const filteredList = useMemo(() => {
    if (activeRoleTab === 'ALL') {
      return [...topMains.slice(0, 6), ...topSoups.slice(0, 3), ...topSides.slice(0, 3)];
    }
    return enrichedRecipes.filter((r) => r.role === activeRoleTab);
  }, [activeRoleTab, topMains, topSoups, topSides, enrichedRecipes]);

  const visibleDishes = showAllDishes ? filteredList : filteredList.slice(0, 6);

  async function handleAddDishToPlan(recipe: EnrichedRecipe) {
    const key = `plan-${recipe.id}-${selectedPlanDate}-${selectedMealType}`;
    setBusyKey(key);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planDate: selectedPlanDate,
          mealType: selectedMealType,
          recipeId: recipe.id,
          customDishName: recipe.name,
          servings: 4,
          notes: `Từ phác đồ ${targetCalories} kcal/ngày (${recipe.kcal} kcal/khẩu phần)`,
        }),
      });

      if (res.status === 401) {
        setActionFeedback({
          type: 'auth',
          message: 'Vui lòng đăng nhập tài khoản để lưu món ăn vào Thực đơn hàng ngày của bạn.',
          linkHref: '/login?from=/tinh-calo',
          linkLabel: 'Đăng nhập ngay',
        });
        return;
      }

      if (res.ok) {
        setAddedPlanIds((prev) => ({ ...prev, [key]: true }));
        setActionFeedback({
          type: 'success',
          message: `Đã gắn "${recipe.name}" vào ${
            selectedMealType === 'DINNER' ? 'Bữa tối' : selectedMealType === 'LUNCH' ? 'Bữa trưa' : 'Bữa sáng'
          } ngày ${selectedPlanDate}!`,
          linkHref: '/ke-hoach-tuan',
          linkLabel: 'Mở Thực đơn tuần →',
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        message: 'Lỗi kết nối máy chủ khi lưu thực đơn.',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleAddWholeTrayToPlan() {
    if (!suggestedTray) return;
    const dishes = [suggestedTray.main, suggestedTray.soup, suggestedTray.side].filter(
      (d): d is EnrichedRecipe => Boolean(d)
    );
    const key = `tray-plan-${comboIndex}-${selectedPlanDate}-${selectedMealType}`;
    setBusyKey(key);
    setActionFeedback(null);

    try {
      for (const dish of dishes) {
        const res = await fetch('/api/meal-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planDate: selectedPlanDate,
            mealType: selectedMealType,
            recipeId: dish.id,
            customDishName: dish.name,
            servings: 4,
            notes: `Mâm cơm chuẩn ${suggestedTray.totalTrayKcal} kcal/người`,
          }),
        });

        if (res.status === 401) {
          setActionFeedback({
            type: 'auth',
            message: 'Vui lòng đăng nhập để gắn trọn bộ Mâm cơm 3 món vào Thực đơn tuần của bạn.',
            linkHref: '/login?from=/tinh-calo',
            linkLabel: 'Đăng nhập ngay',
          });
          return;
        }
      }

      setAddedPlanIds((prev) => ({ ...prev, [key]: true }));
      setActionFeedback({
        type: 'success',
        message: `Đã gắn trọn bộ Mâm cơm 3 món vào ${
          selectedMealType === 'DINNER' ? 'Bữa tối' : selectedMealType === 'LUNCH' ? 'Bữa trưa' : 'Bữa sáng'
        } ngày ${selectedPlanDate}!`,
        linkHref: '/ke-hoach-tuan',
        linkLabel: 'Xem Thực đơn tuần →',
      });
    } catch {
      setActionFeedback({
        type: 'error',
        message: 'Không thể lưu mâm cơm vào kế hoạch. Vui lòng thử lại.',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleLogDishToDiary(recipe: EnrichedRecipe) {
    const key = `diary-${recipe.id}-${selectedMealType}`;
    setBusyKey(key);
    setActionFeedback(null);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          recipeName: recipe.name,
          diaryDate: todayStr,
          mealType: selectedMealType,
          memberName: 'Tôi',
          consumedPortion: 1,
        }),
      });

      if (res.status === 401) {
        setActionFeedback({
          type: 'auth',
          message: 'Vui lòng đăng nhập để ghi món ăn vào Nhật ký dinh dưỡng hàng ngày.',
          linkHref: '/login?from=/tinh-calo',
          linkLabel: 'Đăng nhập ngay',
        });
        return;
      }

      if (res.ok) {
        setAddedDiaryIds((prev) => ({ ...prev, [key]: true }));
        setActionFeedback({
          type: 'success',
          message: `Đã ghi "${recipe.name}" (${recipe.kcal} kcal • ${recipe.protein}g Đạm) vào Nhật ký hôm nay!`,
          linkHref: '/nhat-ky',
          linkLabel: 'Mở Nhật ký Bữa ăn →',
        });
      }
    } catch {
      setActionFeedback({
        type: 'error',
        message: 'Lỗi kết nối khi ghi nhật ký.',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleLogWholeTrayToDiary() {
    if (!suggestedTray) return;
    const dishes = [suggestedTray.main, suggestedTray.soup, suggestedTray.side].filter(
      (d): d is EnrichedRecipe => Boolean(d)
    );
    const key = `tray-diary-${comboIndex}-${selectedMealType}`;
    setBusyKey(key);
    setActionFeedback(null);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      for (const dish of dishes) {
        const res = await fetch('/api/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipeId: dish.id,
            recipeName: dish.name,
            diaryDate: todayStr,
            mealType: selectedMealType,
            memberName: 'Tôi',
            consumedPortion: 1,
          }),
        });

        if (res.status === 401) {
          setActionFeedback({
            type: 'auth',
            message: 'Vui lòng đăng nhập để ghi cả mâm cơm vào Nhật ký dinh dưỡng hôm nay.',
            linkHref: '/login?from=/tinh-calo',
            linkLabel: 'Đăng nhập ngay',
          });
          return;
        }
      }

      setAddedDiaryIds((prev) => ({ ...prev, [key]: true }));
      setActionFeedback({
        type: 'success',
        message: `Đã ghi cả 3 món của Mâm cơm gợi ý vào Nhật ký hôm nay!`,
        linkHref: '/nhat-ky',
        linkLabel: 'Mở Nhật ký kiểm tra →',
      });
    } catch {
      setActionFeedback({
        type: 'error',
        message: 'Lỗi kết nối khi ghi nhật ký.',
      });
    } finally {
      setBusyKey(null);
    }
  }

  const effectiveTargetKg =
    targetWeightKg !== '' && Number(targetWeightKg) >= 35 ? Number(targetWeightKg) : idealTargetKg;
  const isWeightLoss = goal === 'lose_standard' || goal === 'lose_mild' || effectiveTargetKg < safeWeight;
  const isMuscleGain = goal === 'gain_muscle' || effectiveTargetKg > safeWeight;

  const stepGoalText =
    activity === 'sedentary'
      ? '6.500 – 8.000 bước/ngày'
      : activity === 'light'
      ? '8.000 – 9.500 bước/ngày'
      : '9.000 – 11.000 bước/ngày';

  // =========================================================================
  // CHẾ ĐỘ 1: PHÁC ĐỒ HÀNH ĐỘNG & PHÂN BỔ 3 BỮA TRONG NGÀY (TAB 2)
  // =========================================================================
  if (mode === 'roadmap') {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        {/* Khối 1: Phân bổ 3 bữa Sáng - Trưa - Tối trực quan */}
        <div className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-text-primary)]">
              1. Chia {targetCalories.toLocaleString('vi-VN')} kcal Vào 3 Bữa Ăn Trong Ngày Như Thế Nào?
            </h3>
            <span className="text-xs font-semibold text-[var(--color-brand-primary)] bg-[var(--color-brand-light)] px-3 py-1 rounded-full">
              Tỷ lệ vàng: Sáng 28% • Trưa 40% • Tối 32%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DAC8] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-primary)]">☀️ Bữa Sáng (28%)</span>
                <span className="text-xs font-bold text-rose-800">~{breakfastPro}g Đạm</span>
              </div>
              <p className="text-2xl font-extrabold text-[var(--color-brand-primary)]">
                {breakfastKcal} kcal
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                1 tô vừa bún/phở/miến gà ít béo <em>hoặc</em> 50g yến mạch/khoai lang + 2 quả trứng luộc.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DAC8] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-primary)]">🌤️ Bữa Trưa (40%)</span>
                <span className="text-xs font-bold text-rose-800">~{lunchPro}g Đạm</span>
              </div>
              <p className="text-2xl font-extrabold text-[var(--color-accent-primary)]">
                {lunchKcal} kcal
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                <strong>{lunchRiceBowls} chén cơm</strong> + ~{Math.round(rawMeatFishEquivalentGrams * 0.45)}g thịt/cá + 1 đĩa rau luộc/xào + 1 bát canh.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5DAC8] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-primary)]">🌙 Bữa Tối (32%)</span>
                <span className="text-xs font-bold text-rose-800">~{dinnerPro}g Đạm</span>
              </div>
              <p className="text-2xl font-extrabold text-[var(--color-brand-primary)]">
                {dinnerKcal} kcal
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                <strong>{dinnerRiceBowls} chén cơm gạo lứt</strong> + ~{Math.round(rawMeatFishEquivalentGrams * 0.4)}g cá hấp/ức gà/đậu hũ + 1 tô canh rau.
              </p>
            </div>
          </div>
        </div>

        {/* Khối 2: 3 Nguyên tắc Hành động Cốt lõi */}
        <div className="rounded-3xl bg-gradient-to-br from-[#F4F8F4] via-[#FFFFFF] to-[#FDF8F2] border border-[var(--color-brand-border)] p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-text-primary)] flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--color-brand-primary)] shrink-0" />
              <span>
                2. Ba Nguyên Tắc Vàng Để {isWeightLoss ? `Giảm Từ ${safeWeight}kg Xuống ${effectiveTargetKg}kg` : isMuscleGain ? `Tăng Cơ Lên ${effectiveTargetKg}kg` : `Giữ Cân Chuẩn ${safeWeight}kg`} Thành Công
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[var(--color-border-base)] space-y-2">
              <div className="text-xs font-extrabold text-[#3F6240] flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-[var(--color-accent-primary)]" />
                <span>1. THỨ TỰ ĂN TRÊN BÀN</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Áp dụng quy tắc <strong>&ldquo;Rau trước – Đạm giữa – Cơm cuối&rdquo;</strong>: Ăn canh và rau xanh 5 phút đầu tiên, tiếp theo ăn thịt/cá, cuối cùng mới ăn cơm. Cách này giúp giảm 30% đỉnh đường huyết và no lâu gấp đôi.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[var(--color-border-base)] space-y-2">
              <div className="text-xs font-extrabold text-[#3F6240] flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-amber-600" />
                <span>2. VẬN ĐỘNG &amp; UỐNG NƯỚC</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Duy trì <strong>{stepGoalText}</strong> (đi bộ 20 phút sau bữa tối) + <strong>3 buổi tập kháng lực/tuần</strong> để giữ 100% cơ nạc. Uống đủ <strong>{waterLiters} lít nước/ngày</strong> chia làm 8 cốc.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[var(--color-border-base)] space-y-2">
              <div className="text-xs font-extrabold text-[#3F6240] flex items-center gap-1.5">
                {isWeightLoss ? (
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                )}
                <span>3. CỘT MỐC THỜI GIAN</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                • <strong>3 tuần đầu:</strong> Giảm muối &amp; nước ngọt, nhẹ đi ~1.5–2kg đầu tiên.<br />
                • <strong>Tuần 4 – {timelineWeeks ? Math.max(6, timelineWeeks) : 16}:</strong> Giảm đều ~0.45kg mỡ/tuần cho tới khi chạm mốc <strong>{effectiveTargetKg}kg</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CHẾ ĐỘ 2 (MẶC ĐỊNH): CHỌN THỰC ĐƠN MẪU & GẮN MÓN ĂN TRÊN WEBSITE (TAB 1)
  // =========================================================================
  return (
    <div className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in">
      {/* Header + Bộ Chọn Ngày & Bữa Ăn */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>ĐÃ LỌC {enrichedRecipes.length} MÓN ĂN TRÊN WEBSITE KHỚP CHỈ SỐ CỦA BẠN</span>
          </div>
          <h2 className="text-base sm:text-xl font-extrabold text-[var(--color-text-primary)]">
            Gợi Ý Thực Đơn &amp; Gắn Món Ăn Vào Lịch Hàng Ngày
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Chọn <strong>Ngày</strong> &amp; <strong>Bữa ăn</strong> ở góc phải, sau đó bấm <strong>Gắn cả Mâm Cơm</strong> hoặc chọn từng món lẻ bạn thích bên dưới:
          </p>
        </div>

        {/* Thanh chọn Ngày & Bữa để gắn món */}
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-[#FAF7F0] border border-[#EADBC8] shrink-0 no-print">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
            <span className="text-xs font-bold text-[#3F6240]">Ngày:</span>
            <select
              value={selectedPlanDate}
              onChange={(e) => setSelectedPlanDate(e.target.value)}
              aria-label="Chọn ngày gắn thực đơn"
              className="px-2.5 py-1.5 rounded-xl bg-white border border-[#D8C7B0] text-xs font-bold text-[var(--color-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            >
              {upcomingDays.map((d) => (
                <option key={d.dateStr} value={d.dateStr}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#D8C7B0]">
            {(
              [
                { key: 'LUNCH', label: `🌤️ Trưa (${lunchKcal} kcal)` },
                { key: 'DINNER', label: `🌙 Tối (${dinnerKcal} kcal)` },
                { key: 'BREAKFAST', label: `☀️ Sáng (${breakfastKcal} kcal)` },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMealType(m.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedMealType === m.key
                    ? 'bg-[var(--color-brand-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Thông báo phản hồi khi bấm Gắn vào Thực đơn hoặc Ghi Nhật ký */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in no-print ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : actionFeedback.type === 'auth'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <LogIn className="w-4 h-4 text-amber-700 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          {actionFeedback.linkHref && (
            <Link
              href={actionFeedback.linkHref}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-bold shadow-2xs transition-colors"
            >
              <span>{actionFeedback.linkLabel}</span>
            </Link>
          )}
        </div>
      )}

      {/* KHỐI 1: BỘ MÂM CƠM 3 MÓN GỢI Ý TỰ ĐỘNG KHỚP CHỈ SỐ */}
      {loadingRecipes ? (
        <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
          Đang tải và đối chiếu các món ăn phù hợp từ kho công thức...
        </div>
      ) : suggestedTray ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FAF7F0] to-[#F3EFE6] border border-[#DFD2C0] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-[#3F6240]">
                  🍱 Gợi ý Mâm Cơm 3 Món #{comboIndex + 1} ({selectedMealType === 'DINNER' ? 'Bữa Tối' : selectedMealType === 'LUNCH' ? 'Bữa Trưa' : 'Bữa Sáng'}):
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold">
                  Tổng mâm + {suggestedTray.riceBowls} chén cơm: ~{suggestedTray.totalTrayKcal} kcal • {suggestedTray.totalTrayPro}g Đạm
                </span>
              </div>
              <p className="text-xs text-[#5C4A3A] mt-1">
                Định mức mục tiêu bữa này của bạn là <strong>{suggestedTray.targetMealKcal} kcal (~{suggestedTray.targetMealPro}g Đạm)</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setComboIndex((prev) => prev + 1)}
              className="no-print self-start lg:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-[var(--color-brand-primary)] border border-[#D8C7B0] text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đổi mâm gợi ý khác ({comboIndex + 1}/{Math.max(1, topMains.length)})</span>
            </button>
          </div>

          {/* 3 Thẻ Món trong Mâm Gợi Ý */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {([suggestedTray.main, suggestedTray.soup, suggestedTray.side] as const).map(
              (dish, idx) =>
                dish && (
                  <div
                    key={`${dish.id}-${idx}`}
                    className="p-3.5 rounded-2xl bg-white border border-[#E5DAC8] shadow-2xs flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            ROLE_LABELS[dish.role]?.badgeClass || 'bg-stone-100 text-stone-800'
                          }`}
                        >
                          {ROLE_LABELS[dish.role]?.label || dish.role}
                        </span>
                        <span className="text-xs font-extrabold text-[var(--color-accent-primary)]">
                          {dish.kcal} kcal/phần
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        {dish.heroImage && (
                          <img
                            src={dish.heroImage}
                            alt={dish.name}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-200"
                          />
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/cong-thuc/${dish.slug}`}
                            className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] line-clamp-2 leading-snug"
                          >
                            {dish.name}
                          </Link>
                          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                            🥩 Đạm: <strong>{dish.protein}g</strong> • 🥑 Béo: {dish.fat}g • ⏱️ {dish.totalMinutes}p
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 no-print">
                      <Link
                        href={`/cong-thuc/${dish.slug}`}
                        className="text-[11px] font-semibold text-[var(--color-brand-primary)] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Xem cách nấu</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleAddDishToPlan(dish)}
                        disabled={busyKey === `plan-${dish.id}-${selectedPlanDate}-${selectedMealType}`}
                        className="px-2.5 py-1 rounded-lg bg-[var(--color-brand-light)] hover:bg-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        {addedPlanIds[`plan-${dish.id}-${selectedPlanDate}-${selectedMealType}`]
                          ? '✓ Đã gắn'
                          : '+ Gắn món này'}
                      </button>
                    </div>
                  </div>
                )
            )}
          </div>

          {/* Thanh Nút Hành Động Cho Cả Mâm Cơm 3 Món */}
          <div className="pt-1 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2.5 no-print">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddWholeTrayToPlan}
                disabled={busyKey === `tray-plan-${comboIndex}-${selectedPlanDate}-${selectedMealType}`}
                className="min-h-10 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {addedPlanIds[`tray-plan-${comboIndex}-${selectedPlanDate}-${selectedMealType}`]
                    ? '✓ Đã gắn cả Mâm vào Thực đơn!'
                    : `📅 Gắn cả Mâm Cơm (3 món) vào Thực đơn`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleLogWholeTrayToDiary}
                disabled={busyKey === `tray-diary-${comboIndex}-${selectedMealType}`}
                className="min-h-10 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>
                  {addedDiaryIds[`tray-diary-${comboIndex}-${selectedMealType}`]
                    ? '✓ Đã ghi cả Mâm vào Nhật ký!'
                    : '📝 Ghi cả Mâm vào Nhật ký hôm nay'}
                </span>
              </button>
            </div>

            <Link
              href={`/meal?main=${suggestedTray.main.slug}${
                suggestedTray.soup ? `&soup=${suggestedTray.soup.slug}` : ''
              }${suggestedTray.side ? `&side=${suggestedTray.side.slug}` : ''}`}
              className="min-h-10 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-[var(--color-brand-primary)] border border-[var(--color-brand-border)] text-xs font-bold transition-colors"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Mở trên Bàn Ghép Mâm &amp; Đi chợ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : null}

      {/* KHỐI 2: DANH SÁCH MÓN LẺ PHÙ HỢP TRÊN WEBSITE (HIỂN THỊ GỌN 6 MÓN + NÚT MỞ RỘNG) */}
      <div className="space-y-3.5 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            Hoặc tự chọn lẻ từng món ăn phù hợp trên Website:
          </h3>

          <div className="flex flex-wrap items-center gap-1.5 no-print">
            {(
              [
                { key: 'ALL', label: `Đề xuất hàng đầu` },
                { key: 'MAIN', label: `🥩 Món Mặn (${topMains.length})` },
                { key: 'SOUP', label: `🍲 Món Canh (${topSoups.length})` },
                { key: 'SIDE', label: `🥬 Món Rau (${topSides.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveRoleTab(tab.key);
                  setShowAllDishes(false);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  activeRoleTab === tab.key
                    ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-[var(--color-brand-border)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleDishes.map((recipe) => {
            const planKey = `plan-${recipe.id}-${selectedPlanDate}-${selectedMealType}`;
            const diaryKey = `diary-${recipe.id}-${selectedMealType}`;
            const isAddedPlan = Boolean(addedPlanIds[planKey]);
            const isAddedDiary = Boolean(addedDiaryIds[diaryKey]);

            return (
              <div
                key={recipe.id}
                className="p-3.5 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-base)] hover:border-[var(--color-brand-border)] transition-all flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold">
                      {recipe.fitBadge}
                    </span>
                    <span className="text-xs font-extrabold text-[var(--color-accent-primary)] shrink-0">
                      {recipe.kcal} kcal
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    {recipe.heroImage && (
                      <img
                        src={recipe.heroImage}
                        alt={recipe.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[var(--color-border-base)]"
                      />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/cong-thuc/${recipe.slug}`}
                        className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] line-clamp-2 leading-snug"
                      >
                        {recipe.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-[var(--color-text-secondary)]">
                        <span className="font-semibold text-rose-800">🥩 {recipe.protein}g Đạm</span>
                        <span>•</span>
                        <span>🥑 {recipe.fat}g Béo</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {recipe.totalMinutes}p
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-1.5 no-print">
                  <button
                    type="button"
                    onClick={() => handleAddDishToPlan(recipe)}
                    disabled={busyKey === planKey}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer inline-flex items-center justify-center gap-1 ${
                      isAddedPlan
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white hover:bg-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:text-white border-[var(--color-brand-border)]'
                    }`}
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span>{isAddedPlan ? 'Đã gắn Thực đơn' : 'Gắn vào Thực đơn'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLogDishToDiary(recipe)}
                    disabled={busyKey === diaryKey}
                    className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer inline-flex items-center justify-center gap-1 ${
                      isAddedDiary
                        ? 'bg-amber-700 text-white border-amber-700'
                        : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                    title="Ghi món này vào Nhật ký hôm nay"
                  >
                    <span>{isAddedDiary ? '✓ Đã ghi' : '+ Nhật ký'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredList.length > 6 && (
          <div className="pt-1 text-center no-print">
            <button
              type="button"
              onClick={() => setShowAllDishes((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border-base)] text-xs font-bold text-[var(--color-text-primary)] border border-[var(--color-border-base)] transition-colors cursor-pointer"
            >
              {showAllDishes ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Thu gọn danh sách món ăn</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Xem thêm ({filteredList.length - 6} món phù hợp nữa)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
