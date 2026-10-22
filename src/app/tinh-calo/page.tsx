'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Scale,
  Flame,
  HeartPulse,
  Dumbbell,
  Utensils,
  Droplets,
  ShieldCheck,
  Info,
  ArrowRight,
  CheckCircle2,
  Activity,
} from 'lucide-react';

type Gender = 'female' | 'male';
type ActivityLevelKey = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type GoalKey = 'lose_weight' | 'eat_clean_light' | 'maintain' | 'gain_muscle';

interface ActivityOption {
  key: ActivityLevelKey;
  label: string;
  desc: string;
  multiplier: number;
}

const ACTIVITY_LEVELS: ActivityOption[] = [
  {
    key: 'sedentary',
    label: 'Ít vận động (PAL 1.2)',
    desc: 'Làm việc văn phòng, nội trợ nhẹ, hầu như không tập thể dục',
    multiplier: 1.2,
  },
  {
    key: 'light',
    label: 'Vận động nhẹ (PAL 1.375)',
    desc: 'Đi bộ, yoga hoặc tập thể dục nhẹ 1 – 3 buổi/tuần',
    multiplier: 1.375,
  },
  {
    key: 'moderate',
    label: 'Vận động vừa (PAL 1.55)',
    desc: 'Tập Gym, chạy bộ, bơi lội hoặc chơi thể thao 3 – 5 buổi/tuần',
    multiplier: 1.55,
  },
  {
    key: 'active',
    label: 'Vận động cao (PAL 1.725)',
    desc: 'Tập luyện cường độ cao 6 – 7 buổi/tuần hoặc công việc đi lại liên tục',
    multiplier: 1.725,
  },
  {
    key: 'very_active',
    label: 'Vận động rất nặng (PAL 1.9)',
    desc: 'Vận động viên chuyên nghiệp hoặc lao động thể lực nặng 2 buổi/ngày',
    multiplier: 1.9,
  },
];

interface GoalConfig {
  key: GoalKey;
  title: string;
  subtitle: string;
  deltaFactor: number; // Tỷ lệ nhân với TDEE
  macroRatio: { proteinPct: number; fatPct: number; carbsPct: number };
  mealProfile: string;
  taxSlug: string;
  badgeColor: string;
}

const GOALS: GoalConfig[] = [
  {
    key: 'lose_weight',
    title: 'Giảm cân • Giảm mỡ bền vững (-20% TDEE)',
    subtitle: 'Thâm hụt ~350–500 kcal/ngày (giảm ~0.4–0.5 kg/tuần), ưu tiên Đạm cao để giữ cơ',
    deltaFactor: 0.8,
    macroRatio: { proteinPct: 30, fatPct: 25, carbsPct: 45 },
    mealProfile: 'eat-clean',
    taxSlug: 'giam-can-it-calo',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    key: 'eat_clean_light',
    title: 'Eat Clean nhẹ nhàng • Siết dáng (-12% TDEE)',
    subtitle: 'Giảm nhẹ năng lượng, hạn chế dầu mỡ chiên rán, dễ duy trì lâu dài cho cả gia đình',
    deltaFactor: 0.88,
    macroRatio: { proteinPct: 25, fatPct: 25, carbsPct: 50 },
    mealProfile: 'eat-clean',
    taxSlug: 'giam-can-it-calo',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  {
    key: 'maintain',
    title: 'Giữ cân & Bữa cơm nhà cân bằng (100% TDEE)',
    subtitle: 'Chuẩn khuyến nghị Viện Dinh Dưỡng Quốc Gia Việt Nam (Đạm 20% : Béo 25% : Tinh bột 55%)',
    deltaFactor: 1.0,
    macroRatio: { proteinPct: 20, fatPct: 25, carbsPct: 55 },
    mealProfile: '',
    taxSlug: '',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  {
    key: 'gain_muscle',
    title: 'Tập Gym • Tăng cơ nạc (+15% TDEE)',
    subtitle: 'Thặng dư ~250–350 kcal/ngày kết hợp giàu Protein tự nhiên từ ức gà, bò, cá, trứng',
    deltaFactor: 1.15,
    macroRatio: { proteinPct: 30, fatPct: 25, carbsPct: 45 },
    mealProfile: 'me-bau',
    taxSlug: 'tap-gym-tang-co',
    badgeColor: 'bg-blue-50 text-blue-900 border-blue-200',
  },
];

export default function CalorieCalculatorPage() {
  const [gender, setGender] = useState<Gender>('female');
  const [age, setAge] = useState<number>(30);
  const [heightCm, setHeightCm] = useState<number>(158);
  const [weightKg, setWeightKg] = useState<number>(54);
  const [activity, setActivity] = useState<ActivityLevelKey>('light');
  const [goal, setGoal] = useState<GoalKey>('lose_weight');

  const metrics = useMemo(() => {
    const safeAge = Math.min(100, Math.max(14, Number(age) || 30));
    const safeHeight = Math.min(220, Math.max(120, Number(heightCm) || 158));
    const safeWeight = Math.min(200, Math.max(30, Number(weightKg) || 54));

    const heightM = safeHeight / 100;
    const bmi = Math.round((safeWeight / (heightM * heightM)) * 10) / 10;

    // Phân loại BMI theo chuẩn WHO Châu Á - Thái Bình Dương (IDI & WPRO / Bộ Y Tế Việt Nam)
    let bmiCategory = '';
    let bmiTone = '';
    let bmiAdvice = '';
    if (bmi < 18.5) {
      bmiCategory = 'Thiếu cân (BMI < 18.5)';
      bmiTone = 'bg-sky-50 text-sky-900 border-sky-200';
      bmiAdvice = 'Cơ thể đang thiếu năng lượng dự trữ. Bạn nên chọn mục tiêu Tăng cân / Tăng cơ (+15% TDEE) với các món giàu đạm và chất béo tốt.';
    } else if (bmi < 23.0) {
      bmiCategory = 'Cân nặng Chuẩn người Việt (BMI 18.5 – 22.9)';
      bmiTone = 'bg-emerald-50 text-emerald-900 border-emerald-200';
      bmiAdvice = 'Chỉ số khối cơ thể của bạn đạt chuẩn lý tưởng theo khuyến nghị WHO Châu Á & Bộ Y Tế Việt Nam!';
    } else if (bmi < 25.0) {
      bmiCategory = 'Thừa cân / Tiền béo phì (BMI 23.0 – 24.9 — Chuẩn Châu Á)';
      bmiTone = 'bg-amber-50 text-amber-900 border-amber-200';
      bmiAdvice = 'Theo chuẩn người Châu Á, mức BMI từ 23 trở lên đã bắt đầu tích mỡ nội tạng. Bạn nên áp dụng thực đơn Eat Clean / Giảm cân nhẹ (-12% đến -20% TDEE).';
    } else if (bmi < 30.0) {
      bmiCategory = 'Béo phì độ I (BMI 25.0 – 29.9 — Chuẩn Châu Á)';
      bmiTone = 'bg-orange-50 text-orange-900 border-orange-200';
      bmiAdvice = 'Ưu tiên giảm 350–500 kcal/ngày bằng cách tăng rau luộc/canh thanh mát, dùng ½ chén cơm gạo lứt và chọn đạm nạc (ức gà, cá, đậu hũ).';
    } else {
      bmiCategory = 'Béo phì độ II (BMI ≥ 30.0)';
      bmiTone = 'bg-red-50 text-red-900 border-red-200';
      bmiAdvice = 'Cần kiểm soát chặt lượng đường bột tinh chế, mỡ động vật và muối Natri; ưu tiên các món hấp, luộc dưới 350 kcal/khẩu phần.';
    }

    // Khoảng cân nặng lý tưởng theo chuẩn người Việt (BMI 18.5 -> 22.9)
    const idealMinKg = Math.round(18.5 * heightM * heightM * 10) / 10;
    const idealMaxKg = Math.round(22.9 * heightM * heightM * 10) / 10;

    // BMR theo phương trình Mifflin-St Jeor (1990) — Chuẩn vàng ADA & Viện Dinh Dưỡng
    const rawBmr =
      gender === 'male'
        ? 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5
        : 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161;
    const bmr = Math.round(rawBmr);

    const actObj = ACTIVITY_LEVELS.find((a) => a.key === activity) || ACTIVITY_LEVELS[1];
    const tdee = Math.round(bmr * actObj.multiplier);

    const goalObj = GOALS.find((g) => g.key === goal) || GOALS[0];
    // Ngưỡng an toàn y khoa: Không giảm thấp hơn BMR hoặc ngưỡng tối thiểu (1.200 kcal nữ / 1.400 kcal nam)
    const minSafeFloor = gender === 'male' ? Math.max(1350, bmr) : Math.max(1150, bmr - 50);
    const rawTarget = Math.round(tdee * goalObj.deltaFactor);
    const targetCalories =
      goalObj.deltaFactor < 1 ? Math.max(minSafeFloor, rawTarget) : rawTarget;

    // Tính số gram Macro theo chuẩn hệ số Atwater (1g Protein = 4 kcal, 1g Carb = 4 kcal, 1g Fat = 9 kcal)
    const proteinKcal = Math.round((targetCalories * goalObj.macroRatio.proteinPct) / 100);
    const fatKcal = Math.round((targetCalories * goalObj.macroRatio.fatPct) / 100);
    const carbsKcal = Math.max(0, targetCalories - proteinKcal - fatKcal);

    const proteinGrams = Math.round(proteinKcal / 4);
    const fatGrams = Math.round(fatKcal / 9);
    const carbsGrams = Math.round(carbsKcal / 4);

    // Chia theo 3 bữa ăn chuẩn gia đình Việt Nam: Sáng (30%) - Trưa (40%) - Tối (30%)
    const breakfastKcal = Math.round(targetCalories * 0.3);
    const lunchKcal = Math.round(targetCalories * 0.4);
    const dinnerKcal = targetCalories - breakfastKcal - lunchKcal;

    // Lượng nước khuyến nghị mỗi ngày: 35ml / kg cân nặng
    const waterLiters = Math.round(safeWeight * 0.035 * 10) / 10;

    return {
      bmi,
      bmiCategory,
      bmiTone,
      bmiAdvice,
      idealMinKg,
      idealMaxKg,
      bmr,
      tdee,
      targetCalories,
      proteinGrams,
      fatGrams,
      carbsGrams,
      proteinKcal,
      fatKcal,
      carbsKcal,
      breakfastKcal,
      lunchKcal,
      dinnerKcal,
      waterLiters,
      goalObj,
    };
  }, [gender, age, heightCm, weightKg, activity, goal]);

  // Mức calo tối đa cho 1 món mặn chính trong bữa tối (trừ đi cơm + canh + rau ~ 220 kcal)
  const recommendedMainMaxKcal = Math.min(600, Math.max(250, Math.round((metrics.dinnerKcal - 150) / 50) * 50));

  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Công cụ Tính TDEE, BMR, BMI & Thực đơn Calo Cá Nhân Hóa — ĂN GÌ MOM',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'All',
    description:
      'Tính chính xác chỉ số BMI chuẩn người Việt (WHO Châu Á), BMR (Mifflin-St Jeor), TDEE và phân bổ lượng Calo, Đạm, Béo, Tinh bột cho từng bữa ăn gia đình.',
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webAppJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-br from-[#EEF5EE] via-[#FDF8F2] to-[#FCEEE5] border border-[var(--color-border-base)] p-6 sm:p-10 shadow-xs">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-surface-white)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)]">
            <Scale className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
            <span>Chuẩn Y Khoa: Mifflin-St Jeor • WHO Châu Á (IDI/WPRO) • Viện Dinh Dưỡng VN</span>
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
            Tính TDEE, BMR, BMI &amp; Định lượng Calo Cơm Nhà Cá Nhân Hóa
          </h1>
          <p className="text-xs sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            Nhập chiều cao, cân nặng và mục tiêu vận động của bạn để biết chính xác mỗi ngày và mỗi bữa (Sáng • Trưa • Tối) cơ thể cần bao nhiêu <strong>Calo, Đạm (Protein), Béo, Tinh bột</strong> — đồng thời kết nối thẳng tới kho món ăn phù hợp trên Ăn Gì Mom.
          </p>
        </div>
      </section>

      {/* Main Grid: Form nhập chỉ số (Trái) + Bảng kết quả Y khoa & Thực đơn (Phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột Trái: Form Nhập Thông Số Cơ Thể */}
        <section className="lg:col-span-5 rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2 border-b border-[var(--color-border-subtle)] pb-3">
            <Activity className="w-4 h-4 text-[var(--color-brand-primary)]" />
            <span>1. Nhập chỉ số cơ thể của bạn</span>
          </h2>

          {/* Giới tính */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2">
              Giới tính sinh học (ảnh hưởng công thức BMR)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)] shadow-2xs'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border-base)]'
                }`}
              >
                👩 Nữ giới
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)] shadow-2xs'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border-base)]'
                }`}
              >
                👨 Nam giới
              </button>
            </div>
          </div>

          {/* Tuổi, Chiều cao, Cân nặng */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                Độ tuổi
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={14}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm font-bold text-[var(--color-text-primary)]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-text-muted)]">
                  tuổi
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                Chiều cao
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={120}
                  max={220}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm font-bold text-[var(--color-text-primary)]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-text-muted)]">
                  cm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                Cân nặng
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min={30}
                  max={200}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-sm font-bold text-[var(--color-text-primary)]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-text-muted)]">
                  kg
                </span>
              </div>
            </div>
          </div>

          {/* Mức độ vận động */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2">
               cường độ vận động hàng tuần (Hệ số PAL chuẩn FAO/WHO)
            </label>
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map((act) => (
                <button
                  key={act.key}
                  type="button"
                  onClick={() => setActivity(act.key)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                    activity === act.key
                      ? 'bg-[var(--color-brand-light)] border-[var(--color-brand-primary)] shadow-2xs'
                      : 'bg-[var(--color-surface-raised)]/60 border-[var(--color-border-subtle)] hover:border-[var(--color-border-base)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                      {act.label}
                    </span>
                    {activity === act.key && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                    {act.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Mục tiêu */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2">
              Mục tiêu dinh dưỡng của bạn
            </label>
            <div className="space-y-2">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGoal(g.key)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                    goal === g.key
                      ? 'bg-amber-50/90 border-[var(--color-accent-primary)] shadow-2xs'
                      : 'bg-[var(--color-surface-raised)]/60 border-[var(--color-border-subtle)] hover:border-[var(--color-border-base)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                      {g.title}
                    </span>
                    {goal === g.key && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-accent-primary)] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                    {g.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Cột Phải: Kết quả phân tích Y khoa & Gợi ý Thực đơn */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* 4 Thẻ chỉ số cốt lõi: BMI, BMR, TDEE, Calo Mục Tiêu */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-muted)]">
                Chỉ số BMI
              </span>
              <p className="text-2xl font-extrabold text-[var(--color-text-primary)] mt-1">
                {metrics.bmi}
              </p>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                Chuẩn: {metrics.idealMinKg}–{metrics.idealMaxKg}kg
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-muted)]">
                BMR (Trao đổi chất nền)
              </span>
              <p className="text-2xl font-extrabold text-[var(--color-brand-primary)] mt-1">
                {metrics.bmr.toLocaleString('vi-VN')}
              </p>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                kcal / ngày (khi nghỉ)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-muted)]">
                TDEE (Tổng tiêu hao)
              </span>
              <p className="text-2xl font-extrabold text-amber-800 mt-1">
                {metrics.tdee.toLocaleString('vi-VN')}
              </p>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                kcal / ngày (giữ cân)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#3F6240] to-[#2E4B2F] text-white shadow-sm">
              <span className="text-[11px] font-bold uppercase text-emerald-100">
                🎯 Calo Mục Tiêu
              </span>
              <p className="text-2xl font-extrabold text-white mt-1">
                {metrics.targetCalories.toLocaleString('vi-VN')}
              </p>
              <span className="text-[11px] text-emerald-100">
                kcal / ngày nên nạp
              </span>
            </div>
          </div>

          {/* Nhận định BMI theo chuẩn WHO Châu Á - Bộ Y Tế Việt Nam */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${metrics.bmiTone} space-y-1.5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Đánh giá thể trạng: {metrics.bmiCategory}</span>
              </h3>
              <span className="text-xs font-bold inline-flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5" />
                Nước cần uống: ~{metrics.waterLiters} lít/ngày
              </span>
            </div>
            <p className="text-xs leading-relaxed">{metrics.bmiAdvice}</p>
          </div>

          {/* Bảng chia Macro (Đạm - Béo - Tinh bột) mỗi ngày */}
          <div className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  2. Định lượng 3 nhóm chất (Macro) mỗi ngày cho mục tiêu của bạn
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Tính theo chuẩn năng lượng Atwater: 1g Đạm = 4 kcal • 1g Tinh bột = 4 kcal • 1g Chất béo = 9 kcal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                <span className="text-xs font-bold text-rose-900">
                  🥩 Chất Đạm (Protein · {metrics.goalObj.macroRatio.proteinPct}%)
                </span>
                <p className="text-2xl font-extrabold text-rose-800">
                  {metrics.proteinGrams}g <span className="text-xs font-semibold">/ ngày</span>
                </p>
                <p className="text-[11px] text-rose-900/80">
                  ≈ {metrics.proteinKcal} kcal (Giữ cơ bắp, no lâu, tăng sinh nhiệt)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                <span className="text-xs font-bold text-amber-900">
                  🍚 Đường Bột (Carbs · {metrics.goalObj.macroRatio.carbsPct}%)
                </span>
                <p className="text-2xl font-extrabold text-amber-800">
                  {metrics.carbsGrams}g <span className="text-xs font-semibold">/ ngày</span>
                </p>
                <p className="text-[11px] text-amber-900/80">
                  ≈ {metrics.carbsKcal} kcal (Năng lượng cho não bộ &amp; vận động)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
                <span className="text-xs font-bold text-sky-900">
                  🥑 Chất Béo Tốt (Fat · {metrics.goalObj.macroRatio.fatPct}%)
                </span>
                <p className="text-2xl font-extrabold text-sky-800">
                  {metrics.fatGrams}g <span className="text-xs font-semibold">/ ngày</span>
                </p>
                <p className="text-[11px] text-sky-900/80">
                  ≈ {metrics.fatKcal} kcal (Hấp thu Vitamin A, D, E, K &amp; nội tiết)
                </p>
              </div>
            </div>
          </div>

          {/* Chia thực đơn 3 bữa ăn trong ngày + Nút dẫn thẳng tới Kho Món Ăn & Ghép Mâm */}
          <div className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              3. Phân bổ Calo vào 3 bữa cơm hàng ngày (Sáng • Trưa • Tối)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-1">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                  ☀️ Bữa Sáng (30%)
                </span>
                <p className="text-xl font-extrabold text-[var(--color-brand-primary)]">
                  ~{metrics.breakfastKcal} kcal
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Gợi ý: Yến mạch sữa chua, bún/phở ít béo hoặc trứng ốp la + bánh mì đen.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-1">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                  🌤️ Bữa Trưa (40%)
                </span>
                <p className="text-xl font-extrabold text-[var(--color-accent-primary)]">
                  ~{metrics.lunchKcal} kcal
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Gợi ý: 1 chén cơm (~130 kcal) + Món mặn giàu đạm (~{Math.round(metrics.lunchKcal * 0.55)} kcal) + Rau/Canh.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-1">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                  🌙 Bữa Tối (30%)
                </span>
                <p className="text-xl font-extrabold text-[var(--color-brand-primary)]">
                  ~{metrics.dinnerKcal} kcal
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Gợi ý: ½–1 chén cơm gạo lứt + Món cá/ức gà/đậu hũ thanh đạm + Canh rau ngọt mát.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <Link
                href={
                  metrics.goalObj.mealProfile
                    ? `/meal?profile=${metrics.goalObj.mealProfile}`
                    : '/meal'
                }
                className="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                <Utensils className="w-4 h-4 shrink-0" />
                <span>Ghép ngay Mâm cơm 3 món khớp mức {metrics.dinnerKcal} kcal/bữa</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>

              <Link
                href={
                  metrics.goalObj.taxSlug
                    ? `/mon-an?tax=${metrics.goalObj.taxSlug}`
                    : `/mon-an?maxCalories=${recommendedMainMaxKcal}&sort=calories_asc`
                }
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs sm:text-sm font-bold transition-colors"
              >
                <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Xem các món ≤ {recommendedMainMaxKcal} kcal/phần</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Giải thích Y khoa minh bạch (E-E-A-T) */}
      <section className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)]">
          <Info className="w-4 h-4" />
          <span>Cơ sở Khoa học &amp; Tiêu chuẩn Y tế áp dụng trên Ăn Gì Mom</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
          <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-subtle)] space-y-1">
            <h3 className="font-bold text-[var(--color-text-primary)]">
              1. Chuẩn BMI Châu Á – Thái Bình Dương (IDI &amp; WPRO)
            </h3>
            <p>
              Người Việt Nam và Châu Á có tỷ lệ mỡ cơ thể cao hơn ở cùng mức BMI so với người phương Tây. Do đó, Bộ Y Tế Việt Nam quy định ngưỡng bình thường là <strong>18.5 – 22.9 kg/m²</strong> (thay vì 24.9 của phương Tây), thừa cân từ <strong>23.0</strong> và béo phì từ <strong>25.0</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-subtle)] space-y-1">
            <h3 className="font-bold text-[var(--color-text-primary)]">
              2. Phương trình BMR Mifflin-St Jeor (ADA)
            </h3>
            <p>
              Hiệp hội Dinh dưỡng Hoa Kỳ (ADA) đánh giá phương trình <strong>Mifflin-St Jeor</strong> có độ chính xác cao nhất (sai số &lt; 10%) để đo mức năng lượng trao đổi chất cơ bản (BMR) cho người trưởng thành hiện đại.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-subtle)] space-y-1">
            <h3 className="font-bold text-[var(--color-text-primary)]">
              3. Ngưỡng sàn an toàn khi giảm cân
            </h3>
            <p>
              Hệ thống tự động khóa ngưỡng an toàn: không bao giờ đề xuất mức Calo thấp hơn <strong>BMR</strong> hoặc dưới <strong>1.150 kcal (Nữ) / 1.350 kcal (Nam)</strong> nhằm tránh suy giảm chuyển hóa, rụng tóc hoặc mất khối lượng cơ nạc.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
