'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Scale,
  Flame,
  Utensils,
  Droplets,
  ShieldCheck,
  Info,
  ArrowRight,
  CheckCircle2,
  Activity,
  Award,
  Calendar,
  BookOpen,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

type Gender = 'female' | 'male';
type ActivityLevelKey = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type GoalKey = 'lose_standard' | 'lose_mild' | 'maintain' | 'gain_muscle';

interface ActivityOption {
  key: ActivityLevelKey;
  label: string;
  desc: string;
  multiplier: number;
}

// Hệ số hoạt động thể lực PAL chuẩn FAO / WHO / UNU (2004) & Viện Dinh Dưỡng Quốc Gia
const ACTIVITY_LEVELS: ActivityOption[] = [
  {
    key: 'sedentary',
    label: 'Ít vận động (PAL × 1.20)',
    desc: 'Làm việc văn phòng, nội trợ nhẹ, đi bộ dưới 4.000 bước/ngày',
    multiplier: 1.2,
  },
  {
    key: 'light',
    label: 'Vận động nhẹ (PAL × 1.375)',
    desc: 'Tập thể dục nhẹ, đi bộ nhanh hoặc yoga 1 – 3 buổi/tuần',
    multiplier: 1.375,
  },
  {
    key: 'moderate',
    label: 'Vận động vừa (PAL × 1.55)',
    desc: 'Tập Gym, chạy bộ, bơi lội, cầu lông 3 – 5 buổi/tuần',
    multiplier: 1.55,
  },
  {
    key: 'active',
    label: 'Vận động cao (PAL × 1.725)',
    desc: 'Tập luyện cường độ cao 6 – 7 buổi/tuần hoặc công việc di chuyển liên tục',
    multiplier: 1.725,
  },
  {
    key: 'very_active',
    label: 'Vận động rất nặng (PAL × 1.90)',
    desc: 'Vận động viên chuyên nghiệp hoặc lao động thể lực nặng 2 buổi/ngày',
    multiplier: 1.9,
  },
];

interface GoalConfig {
  key: GoalKey;
  title: string;
  subtitle: string;
  dailyKcalDelta: number; // Mức thâm hụt / thặng dư chuẩn lâm sàng (kcal/ngày)
  proteinPerKgRef: number; // g Protein / kg cân nặng hiệu chỉnh (Chuẩn ISSN / ADA)
  fatEnergyPct: number; // % tổng Calo từ chất béo tốt (Chuẩn Viện Dinh Dưỡng: 20-30%)
  weeklyRateKg: number; // Tốc độ thay đổi cân nặng chuẩn (1 kg mỡ ≈ 7.700 kcal)
  mealProfile: string;
  taxSlug: string;
}

const GOALS: GoalConfig[] = [
  {
    key: 'lose_standard',
    title: 'Giảm cân chuẩn Y khoa (-500 kcal/ngày • Giảm ~0.45 kg/tuần)',
    subtitle: 'Mức thâm hụt chuẩn NIH & Bộ Y Tế (3.500 kcal/tuần), kết hợp Đạm cao (1.8g/kg) để giữ 100% cơ nạc',
    dailyKcalDelta: -500,
    proteinPerKgRef: 1.8,
    fatEnergyPct: 25,
    weeklyRateKg: -0.45,
    mealProfile: 'eat-clean',
    taxSlug: 'giam-can-it-calo',
  },
  {
    key: 'lose_mild',
    title: 'Eat Clean nhẹ nhàng • Giảm mỡ bền vững (-300 kcal/ngày • ~0.3 kg/tuần)',
    subtitle: 'Giảm nhẹ năng lượng, không gây đói mệt, rất phù hợp người mới bắt đầu hoặc phụ nữ văn phòng',
    dailyKcalDelta: -300,
    proteinPerKgRef: 1.6,
    fatEnergyPct: 26,
    weeklyRateKg: -0.28,
    mealProfile: 'eat-clean',
    taxSlug: 'giam-can-it-calo',
  },
  {
    key: 'maintain',
    title: 'Giữ dáng & Cơm nhà cân bằng (±0 kcal • 100% TDEE)',
    subtitle: 'Duy trì cân nặng hiện tại theo chuẩn Viện Dinh Dưỡng Quốc Gia (1.3g Đạm/kg • 25% Béo • Tinh bột cân đối)',
    dailyKcalDelta: 0,
    proteinPerKgRef: 1.3,
    fatEnergyPct: 25,
    weeklyRateKg: 0,
    mealProfile: '',
    taxSlug: '',
  },
  {
    key: 'gain_muscle',
    title: 'Tập Gym • Tăng cơ nạc (+300 kcal/ngày • Lean Bulk)',
    subtitle: 'Thặng dư chuẩn +300 kcal/ngày kèm 2.0g Đạm/kg cân nặng (ISSN) giúp tối ưu tổng hợp cơ bắp, hạn chế tích mỡ',
    dailyKcalDelta: 300,
    proteinPerKgRef: 2.0,
    fatEnergyPct: 25,
    weeklyRateKg: 0.28,
    mealProfile: 'me-bau',
    taxSlug: 'tap-gym-tang-co',
  },
];

export default function CalorieCalculatorPage() {
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<number>(31);
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(68);
  const [targetWeightKg, setTargetWeightKg] = useState<number | ''>(62);
  const [bodyFatPct, setBodyFatPct] = useState<number | ''>('');
  const [activity, setActivity] = useState<ActivityLevelKey>('light');
  const [goal, setGoal] = useState<GoalKey>('lose_standard');

  const metrics = useMemo(() => {
    const safeAge = Math.min(100, Math.max(14, Number(age) || 30));
    const safeHeight = Math.min(220, Math.max(120, Number(heightCm) || 165));
    const safeWeight = Math.min(200, Math.max(30, Number(weightKg) || 60));
    const parsedBodyFat =
      bodyFatPct !== '' && Number(bodyFatPct) >= 5 && Number(bodyFatPct) <= 60
        ? Number(bodyFatPct)
        : null;

    const heightM = safeHeight / 100;
    const bmi = Math.round((safeWeight / (heightM * heightM)) * 10) / 10;

    // 1. Phân loại BMI theo chuẩn WHO Châu Á - Thái Bình Dương (IDI & WPRO / Bộ Y Tế Việt Nam)
    // VÀ đối chiếu chuẩn WHO Quốc tế
    let bmiCategoryAsia = '';
    let bmiCategoryWhoGlobal = '';
    let bmiTone = '';
    let bmiAdvice = '';

    if (bmi < 18.5) {
      bmiCategoryAsia = 'Thiếu cân (BMI < 18.5)';
      bmiCategoryWhoGlobal = 'Underweight (< 18.5)';
      bmiTone = 'bg-sky-50 text-sky-950 border-sky-200';
      bmiAdvice =
        'Cơ thể đang thiếu hụt khối lượng cơ và dự trữ năng lượng. Khuyến nghị chọn mục tiêu Tăng cân / Tăng cơ (+300 kcal/ngày) và chia thành 3 bữa chính + 1 bữa phụ.';
    } else if (bmi < 23.0) {
      bmiCategoryAsia = 'Bình thường • Chuẩn người Việt (18.5 – 22.9)';
      bmiCategoryWhoGlobal = 'Normal weight (18.5 – 24.9)';
      bmiTone = 'bg-emerald-50 text-emerald-950 border-emerald-200';
      bmiAdvice =
        'Chỉ số BMI của bạn nằm trong ngưỡng tối ưu theo khuyến nghị của Bộ Y Tế Việt Nam & WHO khu vực Châu Á – Thái Bình Dương (nguy cơ bệnh chuyển hóa thấp nhất).';
    } else if (bmi < 25.0) {
      bmiCategoryAsia = 'Thừa cân / Tiền béo phì (23.0 – 24.9 — Chuẩn Châu Á)';
      bmiCategoryWhoGlobal = 'Normal high (23.0 – 24.9)';
      bmiTone = 'bg-amber-50 text-amber-950 border-amber-200';
      bmiAdvice =
        'Theo dịch tễ học người Việt Nam (Viện Dinh Dưỡng), mức BMI từ 23.0–24.9 đã bắt đầu tăng tỷ lệ mỡ nội tạng. Bạn nên giảm nhẹ 300–500 kcal/ngày để đưa BMI về mốc ~21–22.';
    } else if (bmi < 30.0) {
      bmiCategoryAsia = 'Béo phì độ I (25.0 – 29.9 — Chuẩn Châu Á)';
      bmiCategoryWhoGlobal = 'Overweight (25.0 – 29.9)';
      bmiTone = 'bg-orange-50 text-orange-950 border-orange-200';
      bmiAdvice =
        'Khuyến nghị áp dụng mức thâm hụt chuẩn -500 kcal/ngày (giảm ~0.45–0.5 kg mỡ/tuần). Hệ thống đã tự động dùng "Cân nặng hiệu chỉnh (Adjusted Body Weight)" để tính lượng Đạm chuẩn xác mà không bị dư thừa.';
    } else {
      bmiCategoryAsia = 'Béo phì độ II (BMI ≥ 30.0)';
      bmiCategoryWhoGlobal = 'Obesity Class I+ (≥ 30.0)';
      bmiTone = 'bg-red-50 text-red-950 border-red-200';
      bmiAdvice =
        'Cần giảm 500 kcal/ngày kết hợp kiểm soát chặt lượng muối Natri (< 2.000mg/ngày) và đường đơn; ưu tiên các món hấp, luộc, canh thanh đạm và cơm gạo lứt.';
    }

    // 2. Khoảng cân nặng chuẩn theo chiều cao (BMI 18.5 -> 22.9) và Cân nặng lý tưởng (BMI = 21.0 với nữ, 22.0 với nam)
    const idealMinKg = Math.round(18.5 * heightM * heightM * 10) / 10;
    const idealMaxKg = Math.round(22.9 * heightM * heightM * 10) / 10;
    const optimalBmiRef = gender === 'male' ? 22.0 : 21.0;
    const idealTargetKg = Math.round(optimalBmiRef * heightM * heightM * 10) / 10;

    // 3. Cân nặng tham chiếu tính Protein (Adjusted Body Weight — Chuẩn lâm sàng ADA khi BMI >= 25)
    // Nếu BMI >= 25, mô mỡ không cần nhiều Protein như mô cơ nạc -> ABW = IBW + 0.25 * (Actual - IBW)
    const proteinReferenceWeightKg =
      bmi >= 25 && safeWeight > idealMaxKg
        ? Math.round((idealMaxKg + 0.25 * (safeWeight - idealMaxKg)) * 10) / 10
        : safeWeight;

    // 4. Tính BMR bằng 3 công thức Y khoa được công nhận toàn cầu:
    // (A) Mifflin-St Jeor (1990) — Chuẩn vàng của Hiệp hội Dinh dưỡng Hoa Kỳ (ADA)
    const bmrMifflinRaw =
      gender === 'male'
        ? 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + 5
        : 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge - 161;
    const bmrMifflin = Math.round(bmrMifflinRaw);

    // (B) Revised Harris-Benedict (Roza & Shizgal, 1984) — Để đối chiếu minh bạch
    const bmrHarrisRaw =
      gender === 'male'
        ? 88.362 + 13.397 * safeWeight + 4.799 * safeHeight - 5.677 * safeAge
        : 447.593 + 9.247 * safeWeight + 3.098 * safeHeight - 4.33 * safeAge;
    const bmrHarris = Math.round(bmrHarrisRaw);

    // (C) Katch-McArdle (Dựa trên Khối lượng cơ nạc LBM nếu người dùng nhập % Body Fat)
    const lbmKg =
      parsedBodyFat !== null
        ? Math.round(safeWeight * (1 - parsedBodyFat / 100) * 10) / 10
        : null;
    const bmrKatch = lbmKg !== null ? Math.round(370 + 21.6 * lbmKg) : null;

    // Chọn BMR chính: Ưu tiên Katch-McArdle nếu có % mỡ cơ thể (InBody), ngược lại dùng Mifflin-St Jeor
    const primaryBmrRaw = bmrKatch !== null ? bmrKatch : bmrMifflinRaw;
    const primaryBmr = Math.round(primaryBmrRaw);

    // 5. Tính TDEE từ công thức chính (nhân trực tiếp từ giá trị chưa làm tròn để tránh sai số làm tròn kép)
    const actObj = ACTIVITY_LEVELS.find((a) => a.key === activity) || ACTIVITY_LEVELS[1];
    const tdee = Math.round(primaryBmrRaw * actObj.multiplier);

    // 6. Tính Calo mục tiêu theo chuẩn lâm sàng (Daily Kcal Delta + Khóa sàn an toàn BMR / NIH)
    const goalObj = GOALS.find((g) => g.key === goal) || GOALS[0];
    const clinicalMinFloor = gender === 'male' ? Math.max(1400, primaryBmr) : Math.max(1200, primaryBmr);
    const rawTarget = tdee + goalObj.dailyKcalDelta;
    const targetCalories =
      goalObj.dailyKcalDelta < 0 ? Math.max(clinicalMinFloor, rawTarget) : rawTarget;
    const actualDailyDelta = targetCalories - tdee;

    // 7. Tính Macro theo chuẩn ISSN / Viện Dinh Dưỡng (Protein theo g/kg cân nặng tham chiếu, Fat theo %, Carbs phần còn lại)
    // Hệ số năng lượng Atwater chuẩn: 1g Protein = 4 kcal, 1g Carbs = 4 kcal, 1g Fat = 9 kcal
    const proteinGrams = Math.round(proteinReferenceWeightKg * goalObj.proteinPerKgRef);
    const proteinKcal = proteinGrams * 4;
    const proteinPct = Math.round((proteinKcal / targetCalories) * 100);

    const fatKcal = Math.round((targetCalories * goalObj.fatEnergyPct) / 100);
    const fatGrams = Math.round(fatKcal / 9);
    const fatPct = goalObj.fatEnergyPct;

    const carbsKcal = Math.max(200, targetCalories - proteinKcal - fatKcal);
    const carbsGrams = Math.round(carbsKcal / 4);
    const carbsPct = Math.max(10, 100 - proteinPct - fatPct);

    // Chất xơ khuyến nghị chuẩn Viện Dinh Dưỡng / IOM: 14g trên mỗi 1.000 kcal (tối thiểu 22–25g/ngày)
    const fiberGrams = Math.max(22, Math.round((targetCalories / 1000) * 14));

    // 8. Chia năng lượng & Macro vào 3 bữa ăn Việt Nam: Sáng (28%) • Trưa (40%) • Tối (32%)
    const breakfastKcal = Math.round(targetCalories * 0.28);
    const lunchKcal = Math.round(targetCalories * 0.4);
    const dinnerKcal = targetCalories - breakfastKcal - lunchKcal;

    const breakfastPro = Math.round(proteinGrams * 0.28);
    const lunchPro = Math.round(proteinGrams * 0.38);
    const dinnerPro = proteinGrams - breakfastPro - lunchPro;

    // 9. Quy đổi ra ĐƠN VỊ THỰC PHẨM BẾP VIỆT THỰC TẾ trong 1 ngày (dựa trên Bảng Thành Phần Thực Phẩm VN):
    // - 100g thịt nạc / ức gà / cá tươi sống cung cấp trung bình ~20.5g Protein (sau khi trừ phần lượng đạm đã có trong cơm và rau ~25g/ngày)
    const proteinFromMeatFishGrams = Math.max(40, proteinGrams - 25);
    const rawMeatFishEquivalentGrams = Math.round((proteinFromMeatFishGrams / 20.5) * 100 / 10) * 10;

    // - 1 chén cơm trắng chín (100g) ≈ 130 kcal & 28g Carbs; 1 chén cơm gạo lứt (100g) ≈ 110 kcal & 23g Carbs
    // Trừ đi ~65g Carbs từ bữa sáng (bún/phở/yến mạch) + rau củ/trái cây trong ngày
    const carbsForLunchDinnerRice = Math.max(25, carbsGrams - 75);
    const whiteRiceBowlsPerDay = Math.max(0.5, Math.round((carbsForLunchDinnerRice / 28) * 2) / 2);
    const brownRiceBowlsPerDay = Math.max(0.5, Math.round((carbsForLunchDinnerRice / 23) * 2) / 2);

    // 10. Lượng nước khuyến nghị chuẩn Bộ Y Tế (35ml / kg) + bù vận động
    const exerciseWaterBonus = activity === 'active' || activity === 'very_active' ? 0.5 : activity === 'moderate' ? 0.3 : 0;
    const waterLiters = Math.round((safeWeight * 0.035 + exerciseWaterBonus) * 10) / 10;

    // 11. Tính lộ trình thời gian đạt Cân nặng mục tiêu (1 kg mô mỡ ≈ 7.700 kcal)
    let timelineWeeks: number | null = null;
    let weightDiffKg = 0;
    if (targetWeightKg !== '' && Number(targetWeightKg) >= 35 && Number(targetWeightKg) <= 180) {
      weightDiffKg = Math.round((Number(targetWeightKg) - safeWeight) * 10) / 10;
      const weeklyDeltaKcal = Math.abs(actualDailyDelta) * 7;
      if (Math.abs(weightDiffKg) >= 0.5 && weeklyDeltaKcal >= 1000) {
        const totalKcalNeeded = Math.abs(weightDiffKg) * 7700;
        timelineWeeks = Math.max(1, Math.round(totalKcalNeeded / weeklyDeltaKcal));
      }
    }

    return {
      safeWeight,
      bmi,
      bmiCategoryAsia,
      bmiCategoryWhoGlobal,
      bmiTone,
      bmiAdvice,
      idealMinKg,
      idealMaxKg,
      idealTargetKg,
      proteinReferenceWeightKg,
      bmrMifflin,
      bmrHarris,
      bmrKatch,
      lbmKg,
      primaryBmr,
      tdee,
      targetCalories,
      actualDailyDelta,
      proteinGrams,
      fatGrams,
      carbsGrams,
      fiberGrams,
      proteinKcal,
      fatKcal,
      carbsKcal,
      proteinPct,
      fatPct,
      carbsPct,
      breakfastKcal,
      lunchKcal,
      dinnerKcal,
      breakfastPro,
      lunchPro,
      dinnerPro,
      rawMeatFishEquivalentGrams,
      whiteRiceBowlsPerDay,
      brownRiceBowlsPerDay,
      waterLiters,
      weightDiffKg,
      timelineWeeks,
      goalObj,
      actObj,
    };
  }, [gender, age, heightCm, weightKg, targetWeightKg, bodyFatPct, activity, goal]);

  const recommendedMainMaxKcal = Math.min(
    600,
    Math.max(250, Math.round((metrics.dinnerKcal - 140) / 50) * 50)
  );

  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Công cụ Tính TDEE, BMR, BMI Chuẩn Người Việt & Quy Đổi Khẩu Phần Cơm Nhà — ĂN GÌ MOM',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'All',
    description:
      'Tính chính xác BMI chuẩn WHO Châu Á (Bộ Y Tế VN), BMR (Mifflin-St Jeor, Harris-Benedict, Katch-McArdle), TDEE và quy đổi trực tiếp ra số chén cơm, số gram thịt cá, rau xanh cho từng bữa ăn.',
  };

  return (
    <div className="w-full flex flex-col gap-7 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webAppJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/* Top Banner — Full Width */}
      <section className="w-full rounded-3xl bg-gradient-to-br from-[#EEF5EE] via-[#FDF8F2] to-[#FCEEE5] border border-[var(--color-border-base)] p-5 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-4xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-surface-white)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)]">
                <Scale className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
                <span>Chuẩn Y Khoa: Mifflin-St Jeor (ADA) • WHO Châu Á (IDI/WPRO) • Viện Dinh Dưỡng Quốc Gia</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã hiệu chỉnh cân nặng tham chiếu (ABW) &amp; quy đổi chén cơm Việt</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
              Tính TDEE, BMR, BMI &amp; Quy Đổi Định Lượng Bữa Cơm Gia Đình
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-[var(--color-text-secondary)] leading-relaxed">
              Không chỉ tính con số lý thuyết — công cụ đối chiếu đồng thời <strong>3 phương trình trao đổi chất y khoa</strong>, phân loại thể trạng theo <strong>chuẩn người Việt (Bộ Y Tế)</strong> và quy đổi trực tiếp ra <strong>số chén cơm, số gram thịt/cá tươi sống &amp; rau xanh</strong> bạn cần nấu mỗi ngày.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <Link
              href={metrics.goalObj.mealProfile ? `/meal?profile=${metrics.goalObj.mealProfile}` : '/meal'}
              className="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <Utensils className="w-4 h-4 shrink-0" />
              <span>Ghép mâm cơm theo chỉ số của tôi</span>
            </Link>
            <Link
              href="/editor/ingredients"
              className="min-h-10 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-white/90 hover:bg-white text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] border border-[var(--color-border-base)] text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--color-accent-primary)]" />
              <span>Tra cứu Bảng Calo 214+ nguyên liệu VN</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Full-Width 12-Column Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (4/12): Bảng nhập thông số cơ thể & mục tiêu */}
        <section className="lg:col-span-4 rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-5 lg:sticky lg:top-20">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--color-brand-primary)]" />
              <span>1. Thông số cơ thể của bạn</span>
            </h2>
            <span className="text-[11px] font-semibold text-[var(--color-brand-primary)] bg-[var(--color-brand-light)] px-2.5 py-0.5 rounded-full">
              Tự động tính tức thì
            </span>
          </div>

          {/* Giới tính */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2">
              Giới tính sinh học (Hệ số BMR Mifflin-St Jeor)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setGender('female');
                  if (heightCm === 170 && weightKg === 68) {
                    setHeightCm(158);
                    setWeightKg(54);
                    setTargetWeightKg(50);
                  }
                }}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)] shadow-2xs'
                    : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border-base)]'
                }`}
              >
                👩 Nữ giới (-161)
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
                👨 Nam giới (+5)
              </button>
            </div>
          </div>

          {/* Tuổi, Chiều cao, Cân nặng hiện tại */}
          <div className="grid grid-cols-3 gap-2.5">
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

          {/* Cân nặng mục tiêu & % Mỡ cơ thể (Tùy chọn cho người tập Gym / InBody) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                🎯 Cân nặng mong muốn
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min={35}
                  max={180}
                  placeholder={`VD: ${metrics.idealTargetKg}`}
                  value={targetWeightKg}
                  onChange={(e) =>
                    setTargetWeightKg(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-xs font-bold text-[var(--color-text-primary)]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-text-muted)]">
                  kg
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                💪 % Mỡ cơ thể (Nếu biết)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min={5}
                  max={60}
                  placeholder="Tùy chọn (InBody)"
                  value={bodyFatPct}
                  onChange={(e) =>
                    setBodyFatPct(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] rounded-xl text-xs font-bold text-[var(--color-text-primary)]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-text-muted)]">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Mức độ vận động */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-2">
              Cường độ vận động hàng tuần (Hệ số PAL chuẩn FAO/WHO)
            </label>
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map((act) => (
                <button
                  key={act.key}
                  type="button"
                  onClick={() => setActivity(act.key)}
                  className={`w-full text-left p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
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
              Mục tiêu kiểm soát cân nặng &amp; thể hình
            </label>
            <div className="space-y-2">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGoal(g.key)}
                  className={`w-full text-left p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
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

        {/* CỘT PHẢI (8/12): Bảng Kết Quả Y Khoa, Quy Đổi Thực Phẩm Bếp Việt & Phân Bổ 3 Bữa */}
        <section className="lg:col-span-8 flex flex-col gap-5">
          {/* Hàng 1: 4 Thẻ chỉ số cốt lõi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Chỉ số BMI
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] my-1">
                {metrics.bmi}
                <span className="text-xs font-normal text-[var(--color-text-muted)] ml-1">kg/m²</span>
              </p>
              <span className="text-[11px] text-emerald-800 font-semibold">
                Chuẩn VN: {metrics.idealMinKg}–{metrics.idealMaxKg} kg
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                BMR (Trao đổi chất nền)
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-brand-primary)] my-1">
                {metrics.primaryBmr.toLocaleString('vi-VN')}
              </p>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                kcal/ngày (mức tối thiểu sống)
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                TDEE (Tổng tiêu hao)
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-800 my-1">
                {metrics.tdee.toLocaleString('vi-VN')}
              </p>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                kcal/ngày ({metrics.actObj.label.split('(')[0].trim()})
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#3F6240] to-[#284229] text-white shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                🎯 Calo Mục Tiêu
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-white my-1">
                {metrics.targetCalories.toLocaleString('vi-VN')}
              </p>
              <span className="text-[11px] text-emerald-100 font-medium">
                kcal/ngày ({metrics.actualDailyDelta > 0 ? `+${metrics.actualDailyDelta}` : metrics.actualDailyDelta} so với TDEE)
              </span>
            </div>
          </div>

          {/* Hàng 2: Chẩn đoán Thể trạng BMI (Chuẩn Châu Á vs WHO) & Lộ trình đạt cân nặng mong muốn */}
          <div className={`p-5 rounded-3xl border ${metrics.bmiTone} space-y-3`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-current/15">
              <div>
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>Phân loại Bộ Y Tế VN &amp; WHO Châu Á: {metrics.bmiCategoryAsia}</span>
                </h3>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Đối chiếu chuẩn WHO phương Tây: <strong>{metrics.bmiCategoryWhoGlobal}</strong> • Cân nặng tối ưu gợi ý cho chiều cao {heightCm}cm: <strong>~{metrics.idealTargetKg} kg</strong> ({metrics.idealMinKg} – {metrics.idealMaxKg} kg)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="px-3 py-1 rounded-full bg-white/90 text-xs font-bold shadow-2xs inline-flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span>Nước uống: {metrics.waterLiters} lít/ngày</span>
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed">{metrics.bmiAdvice}</p>

            {metrics.timelineWeeks !== null && (
              <div className="p-3 rounded-2xl bg-white/85 border border-current/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>
                    Lộ trình từ {metrics.safeWeight}kg &rarr; {targetWeightKg}kg ({metrics.weightDiffKg > 0 ? `Tăng +${metrics.weightDiffKg}kg` : `Giảm ${metrics.weightDiffKg}kg`}):
                  </span>
                </div>
                <span className="font-extrabold text-sm">
                  Dự kiến ~{metrics.timelineWeeks} tuần ({Math.max(1, Math.round((metrics.timelineWeeks / 4.3) * 10) / 10)} tháng) an toàn y khoa
                </span>
              </div>
            )}
          </div>

          {/* Hàng 3: Định lượng 3 nhóm chất (Macro) & QUY ĐỔI THỰC TẾ RA ĐƠN VỊ BẾP VIỆT */}
          <div className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                  2. Định lượng Dinh dưỡng Đa lượng (Macro) &amp; Quy đổi ra Thực phẩm Đi chợ
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Đạm tính theo chuẩn <strong>{metrics.goalObj.proteinPerKgRef}g / kg cân nặng tham chiếu ({metrics.proteinReferenceWeightKg}kg)</strong> của Hiệp hội Dinh dưỡng Thể thao Quốc tế (ISSN) &amp; Viện Dinh Dưỡng.
                </p>
              </div>
            </div>

            {/* 4 Thẻ Macro: Đạm - Tinh bột - Béo - Chất xơ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-rose-50/75 border border-rose-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-950">🥩 Chất Đạm (Protein)</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-rose-800 border border-rose-200">
                    {metrics.proteinPct}%
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-rose-800">
                  {metrics.proteinGrams}g <span className="text-xs font-semibold">/ ngày</span>
                </p>
                <p className="text-[11px] text-rose-900">
                  = {metrics.proteinKcal} kcal ({metrics.goalObj.proteinPerKgRef}g × {metrics.proteinReferenceWeightKg}kg)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/75 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950">🍚 Đường Bột (Carbs)</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-amber-800 border border-amber-200">
                    {metrics.carbsPct}%
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-amber-800">
                  {metrics.carbsGrams}g <span className="text-xs font-semibold">/ ngày</span>
                </p>
                <p className="text-[11px] text-amber-900">
                  = {metrics.carbsKcal} kcal (Năng lượng vận động &amp; não bộ)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/75 border border-sky-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-950">🥑 Chất Béo (Fat)</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-sky-800 border border-sky-200">
                    {metrics.fatPct}%
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-sky-800">
                  {metrics.fatGrams}g <span className="text-xs font-semibold">/ ngày</span>
                </p>
                <p className="text-[11px] text-sky-900">
                  = {metrics.fatKcal} kcal (Hấp thu Vitamin A, D, E, K)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/75 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">🥬 Chất Xơ &amp; Vi chất</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200">
                    Chuẩn IOM
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-800">
                  ≥ {metrics.fiberGrams}g <span className="text-xs font-semibold">/ ngày</span>
                </p>
                <p className="text-[11px] text-emerald-900">
                  Muối Natri &lt; 2.000mg • Đường tự do &lt; 25g
                </p>
              </div>
            </div>

            {/* BẢNG QUY ĐỔI THỰC TẾ RA ĐƠN VỊ ĐI CHỢ & NẤU CƠM NHÀ (Rất quan trọng tránh hiểu nhầm 140g Protein = 140g thịt!) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F0] border border-[#EADBC8] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#3F6240] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B75B35] shrink-0" />
                  <span>
                    Quy đổi thực tế ra &ldquo;Đơn vị Bếp Nhà&rdquo; trong 1 ngày (Để bạn đi chợ &amp; đong cơm đúng chuẩn):
                  </span>
                </h3>
              </div>

              <p className="text-xs text-[#5C4A3A] leading-relaxed">
                <strong>Lưu ý quan trọng:</strong> Trong <em>100g thịt/cá tươi sống</em> chỉ chứa khoảng <strong>20g – 23g chất Đạm (Protein) nguyên chất</strong> (phần còn lại là nước và mô liên kết). Do đó, để nạp đủ <strong>{metrics.proteinGrams}g Đạm</strong> và <strong>{metrics.carbsGrams}g Tinh bột</strong> như trên, tổng lượng thức ăn thực tế trong ngày của bạn tương đương:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#EADBC8] space-y-1">
                  <span className="text-xs font-bold text-rose-900">
                    🥩 Lượng Thịt / Cá / Hải sản / Trứng cần nấu:
                  </span>
                  <p className="text-base font-extrabold text-[#2D2A26]">
                    ~{metrics.rawMeatFishEquivalentGrams}g tươi sống / ngày
                  </p>
                  <p className="text-[11px] text-[#7C6A59] leading-relaxed">
                    Chia làm 2–3 bữa (VD: Trưa ~{Math.round(metrics.rawMeatFishEquivalentGrams * 0.45)}g cá/thịt + Tối ~{Math.round(metrics.rawMeatFishEquivalentGrams * 0.4)}g ức gà/tôm + Sáng 1–2 quả trứng).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#EADBC8] space-y-1">
                  <span className="text-xs font-bold text-amber-900">
                    🍚 Số chén cơm (Bữa Trưa + Bữa Tối):
                  </span>
                  <p className="text-base font-extrabold text-[#2D2A26]">
                    {metrics.whiteRiceBowlsPerDay} chén cơm trắng <span className="text-xs font-normal text-[#7C6A59]">hoặc</span> {metrics.brownRiceBowlsPerDay} chén gạo lứt
                  </p>
                  <p className="text-[11px] text-[#7C6A59] leading-relaxed">
                    Mỗi chén cơm vừa (100g chín) = 130 kcal (cơm trắng) hoặc 110 kcal (cơm gạo lứt), ăn kèm bún/phở/yến mạch vào bữa sáng.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#EADBC8] space-y-1">
                  <span className="text-xs font-bold text-emerald-900">
                    🥬 Lượng Rau xanh &amp; Canh mỗi ngày:
                  </span>
                  <p className="text-base font-extrabold text-[#2D2A26]">
                    400g – 500g rau củ tươi / ngày
                  </p>
                  <p className="text-[11px] text-[#7C6A59] leading-relaxed">
                    Tương đương 1 đĩa rau luộc/xào + 1–2 bát canh rau mỗi bữa để cung cấp đủ {metrics.fiberGrams}g chất xơ và tạo cảm giác no.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hàng 4: Phân bổ chi tiết vào 3 bữa ăn (Sáng - Trưa - Tối) + Lối tắt chọn món */}
          <div className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
              3. Phân bổ Định lượng vào 3 Bữa Ăn Hàng Ngày (Sáng 28% • Trưa 40% • Tối 32%)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">☀️ Bữa Sáng (28%)</span>
                  <span className="text-xs font-bold text-rose-800">~{metrics.breakfastPro}g Đạm</span>
                </div>
                <p className="text-2xl font-extrabold text-[var(--color-brand-primary)]">
                  {metrics.breakfastKcal} kcal
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  <strong>Khẩu phần gợi ý:</strong> 1 tô vừa bún/phở/miến gà ít nước béo (~380–450 kcal) hoặc 50g yến mạch + sữa chua Hy Lạp + 2 quả trứng luộc/ốp la.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">🌤️ Bữa Trưa (40%)</span>
                  <span className="text-xs font-bold text-rose-800">~{metrics.lunchPro}g Đạm</span>
                </div>
                <p className="text-2xl font-extrabold text-[var(--color-accent-primary)]">
                  {metrics.lunchKcal} kcal
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  <strong>Khẩu phần gợi ý:</strong> {Math.max(0.5, Math.round(metrics.whiteRiceBowlsPerDay * 0.6 * 2) / 2)} chén cơm + ~{Math.round(metrics.rawMeatFishEquivalentGrams * 0.45)}g thịt/cá kho hoặc áp chảo + 1 đĩa rau xào/luộc + 1 chén canh.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">🌙 Bữa Tối Cơm Nhà (32%)</span>
                  <span className="text-xs font-bold text-rose-800">~{metrics.dinnerPro}g Đạm</span>
                </div>
                <p className="text-2xl font-extrabold text-[var(--color-brand-primary)]">
                  {metrics.dinnerKcal} kcal
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  <strong>Khẩu phần gợi ý:</strong> {Math.max(0.5, Math.round(metrics.brownRiceBowlsPerDay * 0.4 * 2) / 2)} chén cơm gạo lứt + ~{Math.round(metrics.rawMeatFishEquivalentGrams * 0.4)}g cá hấp/ức gà/đậu hũ + 1 tô canh thanh mát.
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
                <span>Ghép ngay Mâm cơm 3 món khớp mức {metrics.dinnerKcal} kcal/bữa tối</span>
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
                <span>Xem các món ăn ≤ {recommendedMainMaxKcal} kcal/khẩu phần</span>
              </Link>

              <Link
                href="/ke-hoach-tuan"
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-surface-raised)] hover:bg-[var(--color-border-base)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] text-xs sm:text-sm font-bold transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
                <span>Lập thực đơn 7 ngày</span>
              </Link>
            </div>
          </div>

          {/* Hàng 5: Bảng Đối Chiếu Minh Bạch 3 Phương Trình Y Khoa (Verification Table) */}
          <div className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Award className="w-4 h-4 text-[var(--color-accent-primary)]" />
                <span>4. Bảng đối chiếu xác thực từ 3 Phương trình Y khoa Quốc tế</span>
              </h2>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified Clinical Formulas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-raised)] border-y border-[var(--color-border-base)] text-[var(--color-text-secondary)] font-bold">
                    <th className="py-2.5 px-3">Phương trình Y khoa</th>
                    <th className="py-2.5 px-3">Cơ quan khuyến nghị</th>
                    <th className="py-2.5 px-3">BMR của bạn</th>
                    <th className="py-2.5 px-3">TDEE của bạn</th>
                    <th className="py-2.5 px-3">Trạng thái áp dụng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
                  <tr>
                    <td className="py-2.5 px-3 font-bold">Mifflin-St Jeor (1990)</td>
                    <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">
                      Hiệp hội Dinh dưỡng Hoa Kỳ (ADA) &amp; Viện Dinh Dưỡng VN
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--color-brand-primary)]">
                      {metrics.bmrMifflin.toLocaleString('vi-VN')} kcal
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {Math.round(metrics.bmrMifflin * metrics.actObj.multiplier).toLocaleString('vi-VN')} kcal
                    </td>
                    <td className="py-2.5 px-3">
                      {metrics.bmrKatch === null ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                          Đang dùng chính (Chuẩn vàng)
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">Đối chiếu</span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-bold">Harris-Benedict Revised (1984)</td>
                    <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">
                      Roza &amp; Shizgal (Phương trình cổ điển hiệu chỉnh)
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--color-brand-primary)]">
                      {metrics.bmrHarris.toLocaleString('vi-VN')} kcal
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {Math.round(metrics.bmrHarris * metrics.actObj.multiplier).toLocaleString('vi-VN')} kcal
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-text-muted)]">Đối chiếu tham khảo</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-bold">Katch-McArdle (Lean Body Mass)</td>
                    <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">
                      Dành cho VĐV / Người biết chính xác % Mỡ cơ thể (InBody)
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--color-brand-primary)]">
                      {metrics.bmrKatch !== null
                        ? `${metrics.bmrKatch.toLocaleString('vi-VN')} kcal (LBM: ${metrics.lbmKg}kg)`
                        : 'Nhập % mỡ ở cột trái'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {metrics.bmrKatch !== null
                        ? `${Math.round(metrics.bmrKatch * metrics.actObj.multiplier).toLocaleString('vi-VN')} kcal`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {metrics.bmrKatch !== null ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                          Đang dùng chính (Theo % Mỡ)
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">Tùy chọn nâng cao</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--color-bg-primary)]/80 border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0 mt-0.5" />
              <div>
                <strong>Nguồn tài liệu xác thực:</strong> (1) <em>Nhu cầu Dinh dưỡng Khuyến nghị cho Người Việt Nam</em> — Viện Dinh Dưỡng Quốc Gia (Bộ Y Tế); (2) <em>The Asia-Pacific Perspective: Redefining Obesity and its Treatment</em> — WHO / IASO / IOTF (2000); (3) Mifflin MD, St Jeor ST et al., <em>Am J Clin Nutr</em> (1990); (4) Jäger R et al., <em>International Society of Sports Nutrition (ISSN) Position Stand: Protein and Exercise</em> (2017).
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
