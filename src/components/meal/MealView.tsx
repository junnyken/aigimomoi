'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Shuffle,
  Sparkles,
  ChefHat,
  Clock,
  Flame,
  UtensilsCrossed,
  HeartPulse,
  Scale,
  Droplets,
  Baby,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  BUILT_IN_DIPPING_SAUCES,
  type MealDishSummary,
  type MealSelection,
  type MealSlotRole,
} from '@/lib/meal/mealPresets';
import { MealServingsSelector } from './MealServingsSelector';
import { MealSlotCard } from './MealSlotCard';
import { SwapDishModal } from './SwapDishModal';
import { MealSummaryBar } from './MealSummaryBar';
import { saveStoredMeal, getStoredMeal } from '@/lib/meal/mealClient';
import { AiMealSuggestionModal } from './AiMealSuggestionModal';
import { useRouter } from 'next/navigation';
import { buildMealQuery } from '@/lib/meal/flowUrls';

type HealthGoalKey = 'weight_loss' | 'balanced' | 'muscle_gain';
type RiceTypeKey = 'white' | 'brown';
type FamilyProfileKey = 'eat-clean' | 'me-bau' | 'nguoi-lon-tuoi' | 'cho-be';

interface HealthGoalConfig {
  key: HealthGoalKey;
  label: string;
  minKcal: number;
  maxKcal: number;
  defaultRiceBowls: number;
  defaultRiceType: RiceTypeKey;
  advice: string;
}

const HEALTH_GOALS: Record<HealthGoalKey, HealthGoalConfig> = {
  weight_loss: {
    key: 'weight_loss',
    label: 'Giảm cân / Eat Clean (380–480 kcal)',
    minKcal: 380,
    maxKcal: 480,
    defaultRiceBowls: 0.5,
    defaultRiceType: 'brown',
    advice: 'Ưu tiên ½–1 chén cơm gạo lứt, ăn rau và canh trước khi ăn cơm để no lâu và giảm hấp thu đường bột.',
  },
  balanced: {
    key: 'balanced',
    label: 'Giữ dáng • Cân bằng (550–650 kcal)',
    minKcal: 550,
    maxKcal: 650,
    defaultRiceBowls: 1,
    defaultRiceType: 'white',
    advice: 'Khẩu phần chuẩn cho người trưởng thành: 1–1.5 chén cơm kèm đủ đạm, canh thanh mát và rau xanh.',
  },
  muscle_gain: {
    key: 'muscle_gain',
    label: 'Tăng cơ • Bổ dưỡng (700–850 kcal)',
    minKcal: 700,
    maxKcal: 850,
    defaultRiceBowls: 1.5,
    defaultRiceType: 'white',
    advice: 'Phù hợp người tập luyện, lao động hoặc mẹ bầu/sau sinh cần 30–40g Đạm tự nhiên mỗi bữa.',
  },
};

const FAMILY_PROFILES: {
  key: FamilyProfileKey;
  title: string;
  subtitle: string;
  badge: string;
  icon: typeof HeartPulse;
  goalKey: HealthGoalKey;
  riceBowls: number;
  riceType: RiceTypeKey;
  preferredSauceSlug: string;
  keywords: string[];
}[] = [
  {
    key: 'eat-clean',
    title: 'Thực đơn Eat Clean • Giảm mỡ',
    subtitle: 'Ưu tiên món hấp, luộc, ít dầu mỡ ≤ 350 kcal/phần kèm cơm gạo lứt',
    badge: '380–480 kcal/bữa',
    icon: HeartPulse,
    goalKey: 'weight_loss',
    riceBowls: 0.5,
    riceType: 'brown',
    preferredSauceSlug: 'muoi-ot-xanh-chanh-day',
    keywords: ['luộc', 'hấp', 'gà', 'cá', 'đậu hũ', 'thanh', 'rau'],
  },
  {
    key: 'me-bau',
    title: 'Thực đơn Mẹ bầu & Sau sinh',
    subtitle: 'Giàu đạm, sắt, canxi và canh hầm ngọt lành, ít cay nồng',
    badge: 'Giàu Đạm & Sắt',
    icon: Sparkles,
    goalKey: 'muscle_gain',
    riceBowls: 1.5,
    riceType: 'brown',
    preferredSauceSlug: 'xi-dau-toi-ot-me-rang',
    keywords: ['thịt', 'bò', 'cá', 'trứng', 'canh', 'hầm', 'tôm'],
  },
  {
    key: 'nguoi-lon-tuoi',
    title: 'Thực đơn Người lớn tuổi',
    subtitle: 'Mềm dễ tiêu, canh thanh nhiệt, cá/đậu hũ, giảm muối Natri tốt cho huyết áp',
    badge: 'Ít dầu mỡ • Dịu mặn',
    icon: ShieldCheck,
    goalKey: 'balanced',
    riceBowls: 1,
    riceType: 'brown',
    preferredSauceSlug: 'xi-dau-toi-ot-me-rang',
    keywords: ['cá', 'đậu', 'canh', 'luộc', 'mềm', 'chua', 'rau'],
  },
  {
    key: 'cho-be',
    title: 'Thực đơn Cho bé dễ ăn',
    subtitle: 'Mềm ngọt tự nhiên, không cay, giàu đạm và vitamin giúp bé ăn thun thút',
    badge: 'Không cay • Đưa cơm',
    icon: Baby,
    goalKey: 'balanced',
    riceBowls: 1,
    riceType: 'white',
    preferredSauceSlug: 'nuoc-mam-toi-ot-chua-ngot',
    keywords: ['trứng', 'thịt', 'tôm', 'kho', 'canh', 'xào'],
  },
];

interface MealViewProps {
  initialSelection: MealSelection;
  initialServings: number;
  initialProfile?: string | null;
  /** URL có main/soup/side (link chia sẻ hoặc điều hướng nội bộ) → không khôi phục từ localStorage. */
  hasExplicitSelection?: boolean;
  /** Nguyên liệu truyền từ Tủ lạnh (/tu-lanh) sang để mở sẵn gợi ý AI */
  initialAiIngredients?: string[];
}

export function MealView({
  initialSelection,
  initialServings,
  initialProfile = null,
  hasExplicitSelection = false,
  initialAiIngredients = [],
}: MealViewProps) {
  const router = useRouter();
  const [main, setMain] = useState<MealDishSummary | null>(initialSelection.main);
  const [soup, setSoup] = useState<MealDishSummary | null>(initialSelection.soup);
  const [side, setSide] = useState<MealDishSummary | null>(initialSelection.side);
  const [sauce, setSauce] = useState<MealDishSummary | null>(
    initialSelection.sauce ?? BUILT_IN_DIPPING_SAUCES[0]
  );
  const [servings, setServings] = useState<number>(initialServings);

  // State cho Thanh tham khảo Calo & Chén cơm + Thể trạng gia đình
  const matchedInitialProfile = FAMILY_PROFILES.find((p) => p.key === initialProfile) ?? null;
  const [activeProfile, setActiveProfile] = useState<FamilyProfileKey | null>(
    matchedInitialProfile?.key ?? null
  );
  const [healthGoal, setHealthGoal] = useState<HealthGoalKey>(
    matchedInitialProfile?.goalKey ?? 'balanced'
  );
  const [riceBowls, setRiceBowls] = useState<number>(
    matchedInitialProfile?.riceBowls ?? 1
  );
  const [riceType, setRiceType] = useState<RiceTypeKey>(
    matchedInitialProfile?.riceType ?? 'white'
  );

  const [activeModalRole, setActiveModalRole] = useState<MealSlotRole | null>(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [isApplyingProfile, setIsApplyingProfile] = useState<FamilyProfileKey | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(initialAiIngredients.length > 0);

  // Đồng bộ URL và localStorage khi state thay đổi
  const syncState = useCallback(
    (
      currentMain: MealDishSummary | null,
      currentSoup: MealDishSummary | null,
      currentSide: MealDishSummary | null,
      currentSauce: MealDishSummary | null,
      currentServings: number
    ) => {
      if (typeof window === 'undefined') return;

      const mainSlug = currentMain?.slug || '';
      const soupSlug = currentSoup?.slug || '';
      const sideSlug = currentSide?.slug || '';
      const sauceSlug = currentSauce?.slug || '';

      // 1. Lưu vào localStorage
      saveStoredMeal({
        mainSlug,
        soupSlug,
        sideSlug,
        sauceSlug,
        servings: currentServings,
      });

      // 2. Đồng bộ lên URL query params
      const params = new URLSearchParams(window.location.search);
      if (mainSlug) params.set('main', mainSlug);
      if (soupSlug) params.set('soup', soupSlug);
      if (sideSlug) params.set('side', sideSlug);
      if (sauceSlug) params.set('sauce', sauceSlug);
      params.set('servings', String(currentServings));

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    },
    []
  );

  const initialMainSlug = initialSelection.main?.slug ?? '';
  const initialSoupSlug = initialSelection.soup?.slug ?? '';
  const initialSideSlug = initialSelection.side?.slug ?? '';
  const initialSauceSlug = initialSelection.sauce?.slug ?? '';

  useEffect(() => {
    if (hasExplicitSelection) {
      if (initialMainSlug || initialSoupSlug || initialSideSlug) {
        saveStoredMeal({
          mainSlug: initialMainSlug,
          soupSlug: initialSoupSlug,
          sideSlug: initialSideSlug,
          sauceSlug: initialSauceSlug,
          servings: initialServings,
        });
      }
      return;
    }
    const stored = getStoredMeal();
    if (!stored || !(stored.mainSlug || stored.soupSlug || stored.sideSlug)) return;
    const sameMeal =
      stored.mainSlug === initialMainSlug &&
      stored.soupSlug === initialSoupSlug &&
      stored.sideSlug === initialSideSlug &&
      (stored.sauceSlug ?? '') === initialSauceSlug &&
      stored.servings === initialServings;
    if (sameMeal) return;
    router.replace(
      `/meal?${buildMealQuery({
        mainSlug: stored.mainSlug,
        soupSlug: stored.soupSlug,
        sideSlug: stored.sideSlug,
        sauceSlug: stored.sauceSlug,
        servings: stored.servings,
      })}`
    );
  }, [
    hasExplicitSelection,
    initialMainSlug,
    initialSoupSlug,
    initialSideSlug,
    initialSauceSlug,
    initialServings,
    router,
  ]);

  // Xử lý đổi món ở 1 slot (gồm cả ô thứ 4: DIPPING_SAUCE)
  const handleSelectDish = useCallback(
    (newDish: MealDishSummary) => {
      let nextMain = main;
      let nextSoup = soup;
      let nextSide = side;
      let nextSauce = sauce;

      if (newDish.role === 'MAIN') {
        setMain(newDish);
        nextMain = newDish;
      } else if (newDish.role === 'SOUP') {
        setSoup(newDish);
        nextSoup = newDish;
      } else if (newDish.role === 'SIDE') {
        setSide(newDish);
        nextSide = newDish;
      } else if (newDish.role === 'DIPPING_SAUCE') {
        setSauce(newDish);
        nextSauce = newDish;
      }

      syncState(nextMain, nextSoup, nextSide, nextSauce, servings);
      setActiveModalRole(null);
    },
    [main, soup, side, sauce, servings, syncState]
  );

  // Xử lý đổi khẩu phần ăn cả mâm
  const handleServingsChange = useCallback(
    (newServings: number) => {
      setServings(newServings);
      syncState(main, soup, side, sauce, newServings);
    },
    [main, soup, side, sauce, syncState]
  );

  // Xử lý chọn "Mâm cơm theo thể trạng gia đình"
  const handleSelectFamilyProfile = useCallback(
    async (profileKey: FamilyProfileKey) => {
      const profile = FAMILY_PROFILES.find((p) => p.key === profileKey);
      if (!profile) return;

      setActiveProfile(profileKey);
      setHealthGoal(profile.goalKey);
      setRiceBowls(profile.riceBowls);
      setRiceType(profile.riceType);
      setIsApplyingProfile(profileKey);

      try {
        const [mRes, sRes, dRes, sauceRes] = await Promise.all([
          fetch(`/api/meal/options?role=MAIN`).then((r) => r.json()),
          fetch(`/api/meal/options?role=SOUP`).then((r) => r.json()),
          fetch(`/api/meal/options?role=SIDE`).then((r) => r.json()),
          fetch(`/api/meal/options?role=DIPPING_SAUCE`).then((r) => r.json()),
        ]);

        const mains: MealDishSummary[] = mRes?.options || [];
        const soups: MealDishSummary[] = sRes?.options || [];
        const sides: MealDishSummary[] = dRes?.options || [];
        const sauces: MealDishSummary[] = sauceRes?.options || BUILT_IN_DIPPING_SAUCES;

        const pickBestDish = (list: MealDishSummary[]): MealDishSummary | null => {
          if (list.length === 0) return null;
          if (profileKey === 'eat-clean' || profileKey === 'nguoi-lon-tuoi') {
            const withCalories = [...list].filter(
              (d) => typeof d.caloriesPerServing === 'number' && d.caloriesPerServing > 0
            );
            if (withCalories.length > 0) {
              withCalories.sort((a, b) => (a.caloriesPerServing ?? 999) - (b.caloriesPerServing ?? 999));
              return withCalories[0];
            }
          }
          const matchedKeyword = list.find((d) =>
            profile.keywords.some(
              (kw) =>
                d.name.toLowerCase().includes(kw) ||
                d.shortDescription.toLowerCase().includes(kw)
            )
          );
          return matchedKeyword ?? list[0];
        };

        const nextMain = pickBestDish(mains) ?? main;
        const nextSoup = pickBestDish(soups) ?? soup;
        const nextSide = pickBestDish(sides) ?? side;
        const nextSauce =
          sauces.find((s) => s.slug === profile.preferredSauceSlug) ?? sauces[0] ?? sauce;

        if (nextMain) setMain(nextMain);
        if (nextSoup) setSoup(nextSoup);
        if (nextSide) setSide(nextSide);
        if (nextSauce) setSauce(nextSauce);

        syncState(nextMain, nextSoup, nextSide, nextSauce, servings);
      } catch (err) {
        console.error('Lỗi khi áp dụng thực đơn theo thể trạng:', err);
      } finally {
        setIsApplyingProfile(null);
      }
    },
    [main, soup, side, sauce, servings, syncState]
  );

  // Xử lý gợi ý ngẫu nhiên mâm cơm khác
  const handleRandomize = useCallback(async () => {
    setIsRandomizing(true);
    try {
      const res = await fetch('/api/meal/random');
      if (res.ok) {
        const data = await res.json();
        if (data.mainSlug && data.soupSlug && data.sideSlug) {
          const [mRes, sRes, dRes, sauceRes] = await Promise.all([
            fetch(`/api/meal/options?role=MAIN`).then((r) => r.json()),
            fetch(`/api/meal/options?role=SOUP`).then((r) => r.json()),
            fetch(`/api/meal/options?role=SIDE`).then((r) => r.json()),
            fetch(`/api/meal/options?role=DIPPING_SAUCE`).then((r) => r.json()),
          ]);

          const foundMain = mRes?.options?.find((d: MealDishSummary) => d.slug === data.mainSlug) || null;
          const foundSoup = sRes?.options?.find((d: MealDishSummary) => d.slug === data.soupSlug) || null;
          const foundSide = dRes?.options?.find((d: MealDishSummary) => d.slug === data.sideSlug) || null;
          const sauceList: MealDishSummary[] = sauceRes?.options || BUILT_IN_DIPPING_SAUCES;
          const randomSauce =
            sauceList.length > 0
              ? sauceList[Math.floor(Math.random() * sauceList.length)]
              : sauce;

          if (foundMain) setMain(foundMain);
          if (foundSoup) setSoup(foundSoup);
          if (foundSide) setSide(foundSide);
          if (randomSauce) setSauce(randomSauce);

          syncState(
            foundMain || main,
            foundSoup || soup,
            foundSide || side,
            randomSauce || sauce,
            servings
          );
        }
      }
    } catch (err) {
      console.error('Lỗi khi gợi ý mâm cơm ngẫu nhiên:', err);
    } finally {
      setIsRandomizing(false);
    }
  }, [main, soup, side, sauce, servings, syncState]);

  // Xử lý áp dụng mâm cơm AI gợi ý
  const handleApplyAiMeal = useCallback(
    async (mainSlug: string, soupSlug: string, sideSlug: string) => {
      try {
        const [mRes, sRes, dRes] = await Promise.all([
          fetch(`/api/meal/options?role=MAIN`).then((r) => r.json()),
          fetch(`/api/meal/options?role=SOUP`).then((r) => r.json()),
          fetch(`/api/meal/options?role=SIDE`).then((r) => r.json()),
        ]);

        const foundMain = mRes?.options?.find((d: MealDishSummary) => d.slug === mainSlug) || null;
        const foundSoup = sRes?.options?.find((d: MealDishSummary) => d.slug === soupSlug) || null;
        const foundSide = dRes?.options?.find((d: MealDishSummary) => d.slug === sideSlug) || null;

        if (foundMain) setMain(foundMain);
        if (foundSoup) setSoup(foundSoup);
        if (foundSide) setSide(foundSide);

        syncState(foundMain || main, foundSoup || soup, foundSide || side, sauce, servings);
      } catch (err) {
        console.error('Lỗi khi áp dụng mâm cơm AI:', err);
      }
    },
    [main, soup, side, sauce, servings, syncState]
  );

  const handleGoalChange = (nextGoal: HealthGoalKey) => {
    setHealthGoal(nextGoal);
    const cfg = HEALTH_GOALS[nextGoal];
    setRiceBowls(cfg.defaultRiceBowls);
    setRiceType(cfg.defaultRiceType);
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-12">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[var(--color-brand-primary)]/10 via-[var(--color-accent-primary)]/10 to-[var(--color-surface-raised)] p-6 md:p-8 rounded-3xl border border-[var(--color-border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-primary)] uppercase tracking-wider">
            <ChefHat className="w-4 h-4" />
            <span>Thực đơn chuẩn vị cơm nhà</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
            Mâm cơm gia đình
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Chuẩn cấu trúc <strong>1 Món Mặn + 1 Món Canh + 1 Món Rau + 1 Chén Nước Chấm</strong>. Đổi món linh hoạt, chọn thực đơn theo thể trạng và cân chỉnh Calo trực tiếp cho từng người ăn!
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Khẩu phần ăn cả mâm
            </span>
            <MealServingsSelector servings={servings} onChange={handleServingsChange} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Tùy chọn
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="min-h-11 inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all"
                title="Gợi ý mâm cơm từ nguyên liệu tủ lạnh với AI"
              >
                <Sparkles className="w-4 h-4 text-[var(--color-accent-light)]" />
                <span>Gợi ý AI</span>
              </button>
              <button
                type="button"
                onClick={handleRandomize}
                disabled={isRandomizing}
                className="min-h-11 inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] hover:bg-[var(--color-surface-raised)] text-sm font-semibold text-[var(--color-text-primary)] transition-all shadow-xs disabled:opacity-50"
                title="Gợi ý một mâm cơm ngẫu nhiên khác"
              >
                <Shuffle className={`w-4 h-4 text-[var(--color-brand-primary)] ${isRandomizing ? 'animate-spin' : ''}`} />
                <span>Mâm khác</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Gợi ý "Mâm cơm theo thể trạng gia đình" */}
      <section aria-labelledby="family-profiles-heading" className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 id="family-profiles-heading" className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-[var(--color-accent-primary)]" />
            <span>Gợi ý nhanh mâm cơm theo thể trạng gia đình</span>
          </h2>
          <span className="text-xs text-[var(--color-text-muted)]">
            Chạm vào 1 chế độ để tự động chọn bộ 4 món + nước chấm &amp; định lượng cơm phù hợp
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FAMILY_PROFILES.map((prof) => {
            const Icon = prof.icon;
            const isSelected = activeProfile === prof.key;
            const isLoadingThis = isApplyingProfile === prof.key;
            return (
              <button
                key={prof.key}
                type="button"
                onClick={() => handleSelectFamilyProfile(prof.key)}
                disabled={Boolean(isApplyingProfile)}
                className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-[var(--color-brand-light)]/60 border-[var(--color-brand-primary)] ring-1 ring-[var(--color-brand-primary)] shadow-xs'
                    : 'bg-[var(--color-surface-white)] border-[var(--color-border-base)] hover:border-[var(--color-brand-border)] hover:bg-[var(--color-surface-raised)]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-text)]">
                    {isLoadingThis ? 'Đang chọn...' : prof.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {prof.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed line-clamp-2">
                    {prof.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4 Slots Grid: Món Mặn + Món Canh + Món Rau + Nước Chấm */}
      <section aria-label="4 vị trí món ăn và nước chấm trong mâm cơm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Slot 1: MAIN */}
          <MealSlotCard
            role="MAIN"
            dish={main}
            servings={servings}
            onSwapClick={() => setActiveModalRole('MAIN')}
          />

          {/* Slot 2: SOUP */}
          <MealSlotCard
            role="SOUP"
            dish={soup}
            servings={servings}
            onSwapClick={() => setActiveModalRole('SOUP')}
          />

          {/* Slot 3: SIDE */}
          <MealSlotCard
            role="SIDE"
            dish={side}
            servings={servings}
            onSwapClick={() => setActiveModalRole('SIDE')}
          />

          {/* Slot 4: DIPPING_SAUCE */}
          <MealSlotCard
            role="DIPPING_SAUCE"
            dish={sauce}
            servings={servings}
            onSwapClick={() => setActiveModalRole('DIPPING_SAUCE')}
          />
        </div>
      </section>

      {/* Bảng Cân Đối Calo, Chén Cơm & Dinh Dưỡng Cả Mâm Cho Từng Người */}
      <MealNutritionCalculator
        main={main}
        soup={soup}
        side={side}
        sauce={sauce}
        riceBowls={riceBowls}
        riceType={riceType}
        healthGoal={healthGoal}
        onRiceBowlsChange={setRiceBowls}
        onRiceTypeChange={setRiceType}
        onGoalChange={handleGoalChange}
      />

      {/* Gói C: Gợi ý thứ tự đứng bếp nhàn tênh */}
      <CookingOrderGuide main={main} soup={soup} side={side} servings={servings} />

      {/* Summary Bar & CTA */}
      <MealSummaryBar main={main} soup={soup} side={side} sauce={sauce} servings={servings} />

      {/* Swap Dish Modal */}
      {activeModalRole && (
        <SwapDishModal
          isOpen={Boolean(activeModalRole)}
          role={activeModalRole}
          currentSlug={
            activeModalRole === 'MAIN'
              ? main?.slug || ''
              : activeModalRole === 'SOUP'
              ? soup?.slug || ''
              : activeModalRole === 'SIDE'
              ? side?.slug || ''
              : sauce?.slug || ''
          }
          onClose={() => setActiveModalRole(null)}
          onSelect={handleSelectDish}
        />
      )}

      {/* AI Meal Suggestion Modal */}
      <AiMealSuggestionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyMeal={handleApplyAiMeal}
        initialIngredients={initialAiIngredients}
      />
    </div>
  );
}

function MealNutritionCalculator({
  main,
  soup,
  side,
  sauce,
  riceBowls,
  riceType,
  healthGoal,
  onRiceBowlsChange,
  onRiceTypeChange,
  onGoalChange,
}: {
  main: MealDishSummary | null;
  soup: MealDishSummary | null;
  side: MealDishSummary | null;
  sauce: MealDishSummary | null;
  riceBowls: number;
  riceType: RiceTypeKey;
  healthGoal: HealthGoalKey;
  onRiceBowlsChange: (bowls: number) => void;
  onRiceTypeChange: (type: RiceTypeKey) => void;
  onGoalChange: (goal: HealthGoalKey) => void;
}) {
  // Định mức Viện Dinh Dưỡng Quốc Gia cho 1 chén cơm chín (100g)
  const ricePerBowl =
    riceType === 'white'
      ? { kcal: 130, protein: 2.7, fat: 0.3, carbs: 28.2, fiber: 0.4, sodium: 2 }
      : { kcal: 110, protein: 2.6, fat: 0.9, carbs: 23.0, fiber: 1.8, sodium: 4 };

  const riceKcal = Math.round(riceBowls * ricePerBowl.kcal);
  const riceProtein = riceBowls * ricePerBowl.protein;
  const riceFat = riceBowls * ricePerBowl.fat;
  const riceCarbs = riceBowls * ricePerBowl.carbs;
  const riceFiber = riceBowls * ricePerBowl.fiber;

  const items = [
    { label: 'Món mặn', dish: main },
    { label: 'Món canh', dish: soup },
    { label: 'Món rau', dish: side },
    { label: 'Nước chấm', dish: sauce },
  ];

  let dishesKcal = 0;
  let totalProtein = riceProtein;
  let totalFat = riceFat;
  let totalCarbs = riceCarbs;
  let totalFiber = riceFiber;
  let totalSodium = 0;

  for (const item of items) {
    const d = item.dish;
    if (!d) continue;
    if (typeof d.caloriesPerServing === 'number' && d.caloriesPerServing > 0 && d.nutritionStatus !== 'NO_DATA') {
      dishesKcal += d.caloriesPerServing;
    }
    if (d.macrosPerServing) {
      totalProtein += d.macrosPerServing.protein || 0;
      totalFat += d.macrosPerServing.fat || 0;
      totalCarbs += d.macrosPerServing.carbs || 0;
      totalFiber += d.macrosPerServing.fiber ?? 0;
      totalSodium += d.macrosPerServing.sodium ?? 0;
    }
  }

  const totalPersonKcal = dishesKcal + riceKcal;
  const currentGoal = HEALTH_GOALS[healthGoal];

  const isWithinGoal = totalPersonKcal >= currentGoal.minKcal && totalPersonKcal <= currentGoal.maxKcal;
  const isUnderGoal = totalPersonKcal < currentGoal.minKcal;

  return (
    <section
      aria-labelledby="meal-calorie-calc-heading"
      className="rounded-3xl border border-[var(--color-border-base)] bg-gradient-to-br from-[var(--color-surface-white)] via-[var(--color-bg-primary)]/40 to-[var(--color-brand-light)]/25 p-6 md:p-7 shadow-xs flex flex-col gap-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)] mb-1">
            <Scale className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
            <span>Cân đối Calo &amp; Dinh dưỡng cho 1 người ăn (Chuẩn Viện Dinh Dưỡng)</span>
          </div>
          <h2 id="meal-calorie-calc-heading" className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">
            Tham khảo năng lượng thực tế: 3 Món + Nước chấm + Chén cơm
          </h2>
        </div>

        {/* Chọn Mục tiêu sức khỏe */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Chọn mục tiêu sức khỏe">
          {(Object.keys(HEALTH_GOALS) as HealthGoalKey[]).map((key) => {
            const g = HEALTH_GOALS[key];
            const active = healthGoal === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onGoalChange(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[var(--color-brand-primary)] text-white shadow-2xs'
                    : 'bg-[var(--color-surface-white)] text-[var(--color-text-secondary)] border border-[var(--color-border-base)] hover:border-[var(--color-brand-border)]'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Thanh chọn Số chén cơm & Loại cơm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div className="lg:col-span-7 flex flex-col gap-3 p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-subtle)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              1. Chọn lượng cơm mỗi người trong bữa này:
            </span>
            <div className="inline-flex rounded-xl p-0.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)]">
              <button
                type="button"
                onClick={() => onRiceTypeChange('white')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  riceType === 'white'
                    ? 'bg-[var(--color-surface-white)] text-[var(--color-brand-primary)] shadow-2xs'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                🍚 Cơm trắng (130 kcal)
              </button>
              <button
                type="button"
                onClick={() => onRiceTypeChange('brown')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  riceType === 'brown'
                    ? 'bg-[var(--color-surface-white)] text-[var(--color-brand-primary)] shadow-2xs'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                🌾 Cơm gạo lứt (110 kcal)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { bowls: 0.5, label: '½ chén nhỏ' },
              { bowls: 1, label: '1 chén vừa' },
              { bowls: 1.5, label: '1.5 chén' },
              { bowls: 2, label: '2 chén đầy' },
            ].map((opt) => {
              const active = riceBowls === opt.bowls;
              const optKcal = Math.round(opt.bowls * ricePerBowl.kcal);
              return (
                <button
                  key={opt.bowls}
                  type="button"
                  onClick={() => onRiceBowlsChange(opt.bowls)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    active
                      ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-light)]/60 text-[var(--color-brand-primary)] font-bold'
                      : 'border-[var(--color-border-base)] bg-[var(--color-bg-primary)]/50 text-[var(--color-text-secondary)] hover:border-[var(--color-brand-border)]'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[11px] text-[var(--color-accent-primary)] font-semibold">
                    +{optKcal} kcal
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chi tiết đóng góp Calo từng thành phần */}
          <div className="pt-2 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
            {items.map(({ label, dish }) => (
              <span key={label}>
                {label}:{' '}
                <strong className="text-[var(--color-text-primary)]">
                  {dish?.caloriesPerServing && dish.nutritionStatus !== 'NO_DATA'
                    ? `~${dish.caloriesPerServing} kcal`
                    : 'Chưa có số liệu'}
                </strong>
              </span>
            ))}
            <span>
              Cơm:{' '}
              <strong className="text-[var(--color-accent-primary)]">+{riceKcal} kcal</strong>
            </span>
          </div>
        </div>

        {/* Tổng kết Calo & Đạm-Béo-Bột-Natri trên 1 người */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] flex flex-col justify-between gap-3 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                Ước tính 1 người ăn (cả cơm &amp; chấm)
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-brand-primary)] flex items-baseline gap-1.5 mt-0.5">
                <span>~{totalPersonKcal}</span>
                <span className="text-sm font-bold text-[var(--color-text-secondary)]">kcal / bữa</span>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                isWithinGoal
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isUnderGoal
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isWithinGoal
                ? 'Đạt chuẩn mục tiêu'
                : isUnderGoal
                ? `Thấp hơn mục tiêu (${currentGoal.minKcal} kcal)`
                : `Cao hơn mục tiêu (${currentGoal.maxKcal} kcal)`}
            </span>
          </div>

          {/* 4 ô Macro */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-[var(--color-bg-primary)]/80 text-center">
              <div className="text-[11px] text-[var(--color-text-muted)]">Chất đạm</div>
              <div className="text-xs font-bold text-[var(--color-text-primary)]">
                {Math.round(totalProtein * 10) / 10}g
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[var(--color-bg-primary)]/80 text-center">
              <div className="text-[11px] text-[var(--color-text-muted)]">Tinh bột</div>
              <div className="text-xs font-bold text-[var(--color-text-primary)]">
                {Math.round(totalCarbs * 10) / 10}g
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[var(--color-bg-primary)]/80 text-center">
              <div className="text-[11px] text-[var(--color-text-muted)]">Chất béo</div>
              <div className="text-xs font-bold text-[var(--color-text-primary)]">
                {Math.round(totalFat * 10) / 10}g
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[var(--color-bg-primary)]/80 text-center">
              <div className="text-[11px] text-[var(--color-text-muted)]">Chất xơ</div>
              <div className="text-xs font-bold text-emerald-700">
                {Math.round(totalFiber * 10) / 10}g
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-[var(--color-accent-primary)] shrink-0 mt-0.5" />
            <span>{currentGoal.advice}</span>
          </p>

          {totalSodium > 900 && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý muối (Natri ~{Math.round(totalSodium)}mg/phần):</strong> Mâm cơm có cả món đậm vị và nước chấm, người lớn tuổi hoặc cao huyết áp nên chấm nhẹ tay hơn.
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CookingOrderGuide({
  main,
  soup,
  side,
  servings,
}: {
  main: MealDishSummary | null;
  soup: MealDishSummary | null;
  side: MealDishSummary | null;
  servings: number;
}) {
  const activeDishes = [main, soup, side].filter((d): d is MealDishSummary => d !== null);
  if (activeDishes.length < 2) return null;

  const sequentialMinutes = activeDishes.reduce((acc, d) => acc + d.totalTimeMinutes, 0);
  const maxDishTime = Math.max(...activeDishes.map((d) => d.totalTimeMinutes));
  const combinedPrepTime = Math.min(
    25,
    Math.round(activeDishes.reduce((acc, d) => acc + d.prepTimeMinutes, 0) * 0.65)
  );
  const parallelMinutes = Math.max(maxDishTime, combinedPrepTime + Math.max(...activeDishes.map((d) => d.cookTimeMinutes)));
  const savedMinutes = Math.max(5, sequentialMinutes - parallelMinutes);

  // Sắp xếp món đun lâu trước (thường là Món Mặn / Món Canh), món xào nhanh nấu cuối
  const longestCookDish = [...activeDishes].sort((a, b) => b.cookTimeMinutes - a.cookTimeMinutes)[0];

  return (
    <section
      aria-labelledby="cooking-order-heading"
      className="rounded-3xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] p-6 md:p-7 shadow-xs"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-5 border-b border-[var(--color-border-subtle)]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)] mb-1">
            <Flame className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
            <span>Mẹo đứng bếp gia đình</span>
          </div>
          <h2 id="cooking-order-heading" className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">
            Gợi ý thứ tự nấu 3 món nhàn tênh, dọn ra nóng hổi cùng lúc
          </h2>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--color-brand-light)] border border-[var(--color-brand-border)] text-xs font-semibold text-[var(--color-brand-primary)] shrink-0">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            Đứng bếp song song ~<strong>{parallelMinutes} phút</strong> (tiết kiệm ~{savedMinutes} phút)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-subtle)] flex flex-col justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] mb-2">
              Bước 1 • Sơ chế gộp (~{combinedPrepTime} phút)
            </span>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              Rửa &amp; cắt thái 1 lần, ướp món mặn trước
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              Nhặt rau, băm sẵn hành tỏi cho cả {activeDishes.length} món và pha sẵn chén nước chấm.{' '}
              {main ? (
                <>
                  Ướp <strong>{main.name}</strong> trước để thịt/cá ngấm gia vị trong lúc chuẩn bị rau.
                </>
              ) : (
                'Chuẩn bị sẵn nguyên liệu ra từng đĩa.'
              )}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-subtle)] flex flex-col justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--color-accent-light)] text-[var(--color-accent-text)] mb-2">
              Bước 2 • Bếp chính (~{longestCookDish.cookTimeMinutes} phút)
            </span>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              Bắc bếp món lâu nhất trước: {longestCookDish.name}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              {main && soup
                ? `Đun ${main.name} ở bếp 1 và nấu nước dùng ${soup.name} ở bếp 2 để hai món chín song song.`
                : `Đun ${longestCookDish.name} ở lửa vừa cho chín mềm và thấm vị.`}
            </p>
          </div>
          <Link
            href={`/cong-thuc/${longestCookDish.slug}/nau?servings=${servings}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Mở chế độ nấu {longestCookDish.name} &rarr;</span>
          </Link>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-subtle)] flex flex-col justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] mb-2">
              Bước 3 • Hoàn thiện sát giờ ăn (~{side?.cookTimeMinutes ?? 10} phút)
            </span>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              {side ? `Xào nhanh ${side.name} trên lửa lớn` : 'Nêm nếm & rắc hành tiêu hoàn tất'}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              {side
                ? `Chế biến ${side.name} sau cùng ngay trước khi dọn mâm để rau giữ độ giòn ngọt và màu xanh mướt.`
                : 'Nêm lại canh và món chính vừa miệng, tắt bếp và dọn ra bàn ăn khi còn nóng.'}
            </p>
          </div>
          {side && (
            <Link
              href={`/cong-thuc/${side.slug}/nau?servings=${servings}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Mở chế độ nấu {side.name} &rarr;</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
