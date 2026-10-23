'use client';

import { useState, useMemo, useEffect } from 'react';
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
  BookmarkCheck,
  Printer,
  HeartPulse,
} from 'lucide-react';
import {
  savePersonalNutritionTarget,
  loadPersonalNutritionTarget,
} from '@/lib/nutrition/personalTarget';
import { PersonalizedMealActionPanel } from '@/components/nutrition/PersonalizedMealActionPanel';

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
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [savedTargetKcal, setSavedTargetKcal] = useState<number | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<'meals' | 'roadmap' | 'clinical'>('meals');

  // Tự động khôi phục thông số đã lưu từ lần tính trước
  useEffect(() => {
    const saved = loadPersonalNutritionTarget();
    if (saved) {
      setGender(saved.gender);
      setAge(saved.age);
      setHeightCm(saved.heightCm);
      setWeightKg(saved.weightKg);
      setTargetWeightKg(saved.targetWeightKg);
      setBodyFatPct(saved.bodyFatPct);
      setActivity(saved.activity);
      setGoal(saved.goal);
      setSavedTargetKcal(saved.targetCalories);
    }
  }, []);

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
    // Trong thực đơn người Việt: ~45-50% tổng Carbs đến từ bữa sáng (bún/phở/yến mạch/khoai lang) + 400-500g rau củ & trái cây ít ngọt.
    // Phần Carbs từ Cơm (Bữa Trưa + Bữa Tối) chiếm ~50% lượng Carbs ngày, và được khóa trần lâm sàng (2.0 – 3.0 chén/ngày khi giảm cân) để kiểm soát đường huyết & Insulin:
    const rawCarbsForRice = Math.max(28, carbsGrams * 0.45);
    const maxRiceBowlsCap =
      goal === 'lose_standard'
        ? 2.5
        : goal === 'lose_mild'
        ? 3.0
        : goal === 'maintain'
        ? 4.0
        : 5.0;
    const whiteRiceBowlsPerDay = Math.min(
      maxRiceBowlsCap,
      Math.max(1.0, Math.round((rawCarbsForRice / 28) * 2) / 2)
    );
    const brownRiceBowlsPerDay = Math.min(
      maxRiceBowlsCap + 0.5,
      Math.max(1.0, Math.round((rawCarbsForRice / 23) * 2) / 2)
    );
    const lunchRiceBowls = Math.max(0.5, Math.round(whiteRiceBowlsPerDay * 0.6 * 2) / 2);
    const dinnerRiceBowls = Math.max(0.5, Math.round((whiteRiceBowlsPerDay - lunchRiceBowls) * 2) / 2);

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
      lunchRiceBowls,
      dinnerRiceBowls,
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

  const handleSavePersonalTarget = () => {
    savePersonalNutritionTarget({
      gender,
      age: Number(age) || 30,
      heightCm: Number(heightCm) || 165,
      weightKg: Number(weightKg) || 60,
      targetWeightKg,
      bodyFatPct,
      activity,
      goal,
      bmi: metrics.bmi,
      bmr: metrics.primaryBmr,
      tdee: metrics.tdee,
      targetCalories: metrics.targetCalories,
      proteinGrams: metrics.proteinGrams,
      carbsGrams: metrics.carbsGrams,
      fatGrams: metrics.fatGrams,
      fiberGrams: metrics.fiberGrams,
      dinnerKcal: metrics.dinnerKcal,
      rawMeatFishEquivalentGrams: metrics.rawMeatFishEquivalentGrams,
      whiteRiceBowlsPerDay: metrics.whiteRiceBowlsPerDay,
      brownRiceBowlsPerDay: metrics.brownRiceBowlsPerDay,
      waterLiters: metrics.waterLiters,
      goalTitle: metrics.goalObj.title,
      updatedAt: new Date().toISOString(),
    });
    setSavedTargetKcal(metrics.targetCalories);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 6000);
  };

  const handlePrintProtocol = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

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

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 no-print">
            <button
              type="button"
              onClick={handleSavePersonalTarget}
              className="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4 shrink-0" />
              <span>
                {savedTargetKcal === metrics.targetCalories
                  ? `✓ Đã lưu mục tiêu (${metrics.targetCalories} kcal)`
                  : `📌 Lưu làm Mục tiêu (${metrics.targetCalories} kcal/ngày)`}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintProtocol}
                className="flex-1 min-h-10 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-white/95 hover:bg-white text-[var(--color-text-primary)] border border-[var(--color-border-base)] text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[var(--color-brand-primary)] shrink-0" />
                <span>In Phác đồ / Lưu PDF</span>
              </button>
              <Link
                href={metrics.goalObj.mealProfile ? `/meal?profile=${metrics.goalObj.mealProfile}` : '/meal'}
                className="flex-1 min-h-10 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-bold shadow-2xs transition-colors"
              >
                <Utensils className="w-3.5 h-3.5 shrink-0" />
                <span>Ghép mâm cơm</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Thông báo xác nhận đã đồng bộ sang Nhật ký & Ghép mâm */}
        {savedToast && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in no-print">
            <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <strong>Đã đồng bộ phác đồ cá nhân ({metrics.targetCalories} kcal • {metrics.proteinGrams}g Đạm • {metrics.carbsGrams}g Tinh bột • {metrics.fatGrams}g Béo)!</strong>
                <span className="block sm:inline sm:ml-1.5 text-emerald-800">
                  Mục tiêu này đã được áp dụng tự động sang trang Nhật Ký Dinh Dưỡng và Ghép Mâm Cơm.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/nhat-ky"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition-colors"
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Mở Nhật ký Bữa ăn &rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Main Full-Width 12-Column Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-7 xl:gap-8 items-start">
        {/* CỘT TRÁI (4/12): Bảng nhập thông số cơ thể & mục tiêu */}
        <section className="lg:col-span-4 rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-6 sm:p-7 shadow-xs space-y-6 lg:sticky lg:top-22">
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

        {/* CỘT PHẢI (8/12): Bố cục 3 Bước Rõ Ràng — Không gây rối mắt */}
        <section className="lg:col-span-8 flex flex-col gap-5">
          {/* Hàng 1: 4 Thẻ chỉ số cốt lõi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Chỉ số BMI
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] my-0.5">
                {metrics.bmi}
                <span className="text-xs font-normal text-[var(--color-text-muted)] ml-1">kg/m²</span>
              </p>
              <span className="text-[11px] text-emerald-800 font-semibold">
                Chuẩn VN: {metrics.idealMinKg}–{metrics.idealMaxKg} kg
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                BMR (Trao đổi chất)
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-brand-primary)] my-0.5">
                {metrics.primaryBmr.toLocaleString('vi-VN')}
              </p>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                kcal/ngày (nền)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                TDEE (Tổng tiêu hao)
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-800 my-0.5">
                {metrics.tdee.toLocaleString('vi-VN')}
              </p>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                kcal/ngày ({metrics.actObj.label.split('(')[0].trim()})
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#3F6240] to-[#284229] text-white shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                🎯 Calo Mục Tiêu
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-white my-0.5">
                {metrics.targetCalories.toLocaleString('vi-VN')}
              </p>
              <span className="text-[11px] text-emerald-100 font-medium">
                kcal/ngày ({metrics.actualDailyDelta > 0 ? `+${metrics.actualDailyDelta}` : metrics.actualDailyDelta} so với TDEE)
              </span>
            </div>
          </div>

          {/* Hàng 2: Hộp Tóm Tắt Nhanh Thể Trạng & 4 Định Lượng Đi Chợ Cần Nhớ Ngay */}
          <div className={`p-4 sm:p-5 rounded-3xl border ${metrics.bmiTone} space-y-3.5`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold">
                  {metrics.bmiCategoryAsia} • Cân nặng chuẩn chiều cao {heightCm}cm: ~{metrics.idealTargetKg}kg
                </span>
              </div>

              {metrics.timelineWeeks !== null && (
                <span className="px-3 py-1 rounded-full bg-white/90 text-xs font-extrabold shadow-2xs inline-flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
                  <span>
                    Lộ trình {metrics.safeWeight}kg &rarr; {targetWeightKg}kg ({metrics.weightDiffKg > 0 ? `+${metrics.weightDiffKg}kg` : `${metrics.weightDiffKg}kg`}): ~{metrics.timelineWeeks} tuần ({Math.max(1, Math.round((metrics.timelineWeeks / 4.3) * 10) / 10)} tháng)
                  </span>
                </span>
              )}
            </div>

            {/* 4 Thẻ Định Lượng Bếp Nhà Cực Ngắn Gọn — Nhìn 3 giây hiểu ngay */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/95 border border-black/5 shadow-2xs">
                <span className="text-[11px] font-bold text-rose-900 block">🥩 Thịt / Cá / Trứng mỗi ngày</span>
                <p className="text-sm sm:text-base font-extrabold text-stone-900 mt-0.5">
                  ~{metrics.rawMeatFishEquivalentGrams}g tươi sống
                </p>
                <span className="text-[11px] text-stone-600 block">
                  Cung cấp đủ <strong>{metrics.proteinGrams}g Đạm</strong>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/95 border border-black/5 shadow-2xs">
                <span className="text-[11px] font-bold text-amber-900 block">🍚 Cơm chín cả ngày</span>
                <p className="text-sm sm:text-base font-extrabold text-stone-900 mt-0.5">
                  {metrics.whiteRiceBowlsPerDay} chén trắng <span className="font-normal text-xs">hoặc</span> {metrics.brownRiceBowlsPerDay} lứt
                </p>
                <span className="text-[11px] text-stone-600 block">
                  Trưa <strong>{metrics.lunchRiceBowls} chén</strong> • Tối <strong>{metrics.dinnerRiceBowls} chén</strong>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/95 border border-black/5 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-900 block">🥬 Rau củ &amp; Canh</span>
                <p className="text-sm sm:text-base font-extrabold text-stone-900 mt-0.5">
                  400g – 500g / ngày
                </p>
                <span className="text-[11px] text-stone-600 block">
                  Đạt chuẩn <strong>≥ {metrics.fiberGrams}g Chất xơ</strong>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/95 border border-black/5 shadow-2xs">
                <span className="text-[11px] font-bold text-sky-900 block">💧 Nước uống khuyến nghị</span>
                <p className="text-sm sm:text-base font-extrabold text-stone-900 mt-0.5">
                  {metrics.waterLiters} lít / ngày
                </p>
                <span className="text-[11px] text-stone-600 block">
                  Chia đều <strong>8 cốc</strong> trong ngày
                </span>
              </div>
            </div>
          </div>

          {/* Hàng 3: Thanh Chuyển Đổi 3 Bước Gọn Gàng (Tránh nhồi nhét gây rối mắt) */}
          <div className="p-1.5 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-1.5 no-print">
            <button
              type="button"
              onClick={() => setActiveStepTab('meals')}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeStepTab === 'meals'
                  ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]'
              }`}
            >
              <span>🍱 1. Chọn Thực Đơn &amp; Gắn Món Ăn</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStepTab('roadmap')}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeStepTab === 'roadmap'
                  ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]'
              }`}
            >
              <span>🧭 2. Chia 3 Bữa &amp; Cách Giảm Cân</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStepTab('clinical')}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeStepTab === 'clinical'
                  ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]'
              }`}
            >
              <span>🔬 3. Chi Tiết Macro &amp; Y Khoa</span>
            </button>
          </div>

          {/* NỘI DUNG TAB 1 (MẶC ĐỊNH): CHỌN THỰC ĐƠN & GẮN MÓN ĂN HÀNG NGÀY */}
          {activeStepTab === 'meals' && (
            <PersonalizedMealActionPanel
              mode="meals"
              gender={gender}
              safeWeight={metrics.safeWeight}
              targetWeightKg={targetWeightKg}
              idealTargetKg={metrics.idealTargetKg}
              bmi={metrics.bmi}
              tdee={metrics.tdee}
              targetCalories={metrics.targetCalories}
              actualDailyDelta={metrics.actualDailyDelta}
              proteinGrams={metrics.proteinGrams}
              carbsGrams={metrics.carbsGrams}
              fatGrams={metrics.fatGrams}
              fiberGrams={metrics.fiberGrams}
              waterLiters={metrics.waterLiters}
              breakfastKcal={metrics.breakfastKcal}
              lunchKcal={metrics.lunchKcal}
              dinnerKcal={metrics.dinnerKcal}
              breakfastPro={metrics.breakfastPro}
              lunchPro={metrics.lunchPro}
              dinnerPro={metrics.dinnerPro}
              whiteRiceBowlsPerDay={metrics.whiteRiceBowlsPerDay}
              brownRiceBowlsPerDay={metrics.brownRiceBowlsPerDay}
              lunchRiceBowls={metrics.lunchRiceBowls}
              dinnerRiceBowls={metrics.dinnerRiceBowls}
              rawMeatFishEquivalentGrams={metrics.rawMeatFishEquivalentGrams}
              timelineWeeks={metrics.timelineWeeks}
              weightDiffKg={metrics.weightDiffKg}
              goal={goal}
              activity={activity}
            />
          )}

          {/* NỘI DUNG TAB 2: PHÂN BỔ 3 BỮA & NGUYÊN TẮC HÀNH ĐỘNG GIẢM CÂN */}
          {activeStepTab === 'roadmap' && (
            <PersonalizedMealActionPanel
              mode="roadmap"
              gender={gender}
              safeWeight={metrics.safeWeight}
              targetWeightKg={targetWeightKg}
              idealTargetKg={metrics.idealTargetKg}
              bmi={metrics.bmi}
              tdee={metrics.tdee}
              targetCalories={metrics.targetCalories}
              actualDailyDelta={metrics.actualDailyDelta}
              proteinGrams={metrics.proteinGrams}
              carbsGrams={metrics.carbsGrams}
              fatGrams={metrics.fatGrams}
              fiberGrams={metrics.fiberGrams}
              waterLiters={metrics.waterLiters}
              breakfastKcal={metrics.breakfastKcal}
              lunchKcal={metrics.lunchKcal}
              dinnerKcal={metrics.dinnerKcal}
              breakfastPro={metrics.breakfastPro}
              lunchPro={metrics.lunchPro}
              dinnerPro={metrics.dinnerPro}
              whiteRiceBowlsPerDay={metrics.whiteRiceBowlsPerDay}
              brownRiceBowlsPerDay={metrics.brownRiceBowlsPerDay}
              lunchRiceBowls={metrics.lunchRiceBowls}
              dinnerRiceBowls={metrics.dinnerRiceBowls}
              rawMeatFishEquivalentGrams={metrics.rawMeatFishEquivalentGrams}
              timelineWeeks={metrics.timelineWeeks}
              weightDiffKg={metrics.weightDiffKg}
              goal={goal}
              activity={activity}
            />
          )}

          {/* NỘI DUNG TAB 3: CHI TIẾT MACRO & BẢNG ĐỐI CHIẾU 3 PHƯƠNG TRÌNH Y KHOA */}
          {activeStepTab === 'clinical' && (
            <div className="flex flex-col gap-5 animate-fade-in">
              {/* 4 Thẻ Macro: Đạm - Tinh bột - Béo - Chất xơ */}
              <div className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                    Định lượng Dinh dưỡng Đa lượng (Macro) Chi Tiết
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Đạm tính theo chuẩn <strong>{metrics.goalObj.proteinPerKgRef}g / kg cân nặng tham chiếu ({metrics.proteinReferenceWeightKg}kg)</strong> của Hiệp hội Dinh dưỡng Thể thao Quốc tế (ISSN) &amp; Viện Dinh Dưỡng.
                  </p>
                </div>

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

                <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#EADBC8] text-xs text-[#4A3C2F] leading-relaxed">
                  <strong>Nhận định Y khoa theo BMI của bạn:</strong> {metrics.bmiAdvice}
                </div>
              </div>

              {/* Bảng Đối Chiếu Minh Bạch 3 Phương Trình Y Khoa (Verification Table) */}
              <div className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Award className="w-4 h-4 text-[var(--color-accent-primary)]" />
                    <span>Bảng đối chiếu xác thực từ 3 Phương trình Y khoa Quốc tế</span>
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
