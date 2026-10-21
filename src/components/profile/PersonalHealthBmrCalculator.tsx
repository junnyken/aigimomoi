'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HeartPulse,
  Scale,
  Flame,
  CheckCircle2,
  Stethoscope,
  Info,
  ArrowRight,
  Utensils,
} from 'lucide-react';

interface SavedHealthProfile {
  gender: 'FEMALE' | 'MALE';
  age: number;
  heightCm: number;
  weightKg: number;
  activityFactor: number;
  goalOffset: number;
  updatedAt: string;
}

const ACTIVITY_LEVELS = [
  {
    factor: 1.2,
    label: 'Ít vận động (Làm văn phòng, nội trợ nhẹ)',
    desc: 'Hầu như ngồi nhiều, ít tập thể dục',
  },
  {
    factor: 1.375,
    label: 'Vận động nhẹ (Đi bộ, tập nhẹ 1–3 buổi/tuần)',
    desc: 'Đi chợ, nấu nướng, dọn dẹp nhà cửa hàng ngày',
  },
  {
    factor: 1.55,
    label: 'Vận động vừa (Tập thể thao 3–5 buổi/tuần)',
    desc: 'Tập gym, chạy bộ, bơi lội hoặc công việc đi lại nhiều',
  },
  {
    factor: 1.725,
    label: 'Năng động cao (Tập nặng 6–7 buổi/tuần)',
    desc: 'Lao động thể lực hoặc vận động viên bán chuyên',
  },
];

const HEALTH_GOALS = [
  {
    offset: -350,
    label: '🌿 Giảm mỡ an toàn (-350 kcal/ngày)',
    desc: 'Giảm ~0.35kg/tuần bền vững, không gây mệt mỏi hay mất cơ',
  },
  {
    offset: 0,
    label: '⚖️ Giữ cân & Duy trì sức khỏe (Chuẩn TDEE)',
    desc: 'Cân bằng năng lượng nạp vào và tiêu hao mỗi ngày',
  },
  {
    offset: 300,
    label: '💪 Tăng cân / Bồi bổ thể lực (+300 kcal/ngày)',
    desc: 'Phù hợp người gầy, người mới ốm dậy cần phục hồi',
  },
  {
    offset: 400,
    label: '🤰 Mẹ bầu (3 tháng giữa/cuối) & Sau sinh (+400 kcal)',
    desc: 'Theo khuyến nghị Viện Dinh Dưỡng Bộ Y Tế cho mẹ & bé',
  },
];

export function PersonalHealthBmrCalculator() {
  const [gender, setGender] = useState<'FEMALE' | 'MALE'>('FEMALE');
  const [age, setAge] = useState<number>(32);
  const [heightCm, setHeightCm] = useState<number>(158);
  const [weightKg, setWeightKg] = useState<number>(54);
  const [activityFactor, setActivityFactor] = useState<number>(1.375);
  const [goalOffset, setGoalOffset] = useState<number>(0);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [showMedicalNotes, setShowMedicalNotes] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('angimom_health_profile');
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedHealthProfile>;
        if (parsed.gender === 'FEMALE' || parsed.gender === 'MALE') setGender(parsed.gender);
        if (typeof parsed.age === 'number' && parsed.age >= 10 && parsed.age <= 100) setAge(parsed.age);
        if (typeof parsed.heightCm === 'number' && parsed.heightCm >= 100 && parsed.heightCm <= 220) {
          setHeightCm(parsed.heightCm);
        }
        if (typeof parsed.weightKg === 'number' && parsed.weightKg >= 25 && parsed.weightKg <= 200) {
          setWeightKg(parsed.weightKg);
        }
        if (typeof parsed.activityFactor === 'number') setActivityFactor(parsed.activityFactor);
        if (typeof parsed.goalOffset === 'number') setGoalOffset(parsed.goalOffset);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // 1. Tính BMI và phân loại theo ngưỡng Châu Á - Thái Bình Dương (WHO WPRO / IDI)
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? Math.round((weightKg / (heightM * heightM)) * 10) / 10 : 0;

  const getAsianBmiStatus = (val: number) => {
    if (val < 18.5) {
      return {
        label: 'Thiếu cân (Cần bồi bổ)',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
        advice: 'Nên ưu tiên nhóm món giàu đạm dễ tiêu, thêm bữa phụ và tăng +300 kcal/ngày.',
      };
    }
    if (val < 23.0) {
      return {
        label: 'Chuẩn thể trạng Châu Á (18.5 – 22.9)',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        advice: 'Cân nặng lý tưởng! Hãy duy trì mâm cơm đủ 4 nhóm chất và rau xanh mỗi bữa.',
      };
    }
    if (val < 25.0) {
      return {
        label: 'Thừa cân nhẹ (Ngưỡng Châu Á ≥ 23)',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        advice: 'Nên chuyển sang 1–1.5 chén cơm gạo lứt/bữa, ưu tiên món hấp/luộc và giảm đồ chiên.',
      };
    }
    return {
      label: 'Béo phì độ I/II (Ngưỡng Châu Á ≥ 25)',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      advice: 'Khuyến nghị giảm 350–500 kcal/ngày, ăn rau và canh trước khi ăn cơm để kiểm soát đường huyết.',
    };
  };

  const bmiMeta = getAsianBmiStatus(bmi);

  // 2. Công thức BMR Mifflin-St Jeor (Chuẩn lâm sàng ADA & Viện Dinh Dưỡng)
  const rawBmr =
    gender === 'MALE'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const bmr = Math.max(1000, Math.round(rawBmr));

  // 3. TDEE & Mục tiêu Calo trong ngày (Không cho phép thấp hơn ngưỡng an toàn BMR * 0.9)
  const tdee = Math.round(bmr * activityFactor);
  const recommendedDailyCalories = Math.max(Math.round(bmr * 0.92), tdee + goalOffset);

  // 4. Phân bổ 3 bữa chính + 1 bữa phụ chuẩn nhịp sinh học bác sĩ khuyến nghị
  const breakfastKcal = Math.round(recommendedDailyCalories * 0.3);
  const lunchKcal = Math.round(recommendedDailyCalories * 0.4);
  const dinnerKcal = Math.round(recommendedDailyCalories * 0.25);
  const snackKcal = Math.max(50, recommendedDailyCalories - breakfastKcal - lunchKcal - dinnerKcal);

  // 5. Định mức Đa lượng (Macronutrients chuẩn Viện Dinh Dưỡng: Đạm 20% - Béo 25% - Đường bột 55%)
  const proteinGrams = Math.round((recommendedDailyCalories * 0.2) / 4);
  const fatGrams = Math.round((recommendedDailyCalories * 0.25) / 9);
  const carbsGrams = Math.round((recommendedDailyCalories * 0.55) / 4);

  const handleSaveProfile = () => {
    try {
      const payload: SavedHealthProfile = {
        gender,
        age,
        heightCm,
        weightKg,
        activityFactor,
        goalOffset,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('angimom_health_profile', JSON.stringify(payload));
      localStorage.setItem('angimom_daily_calorie_target', String(recommendedDailyCalories));
      setSavedNotice(
        `Đã lưu hồ sơ & đồng bộ mục tiêu ${recommendedDailyCalories.toLocaleString('vi-VN')} kcal/ngày sang Nhật ký Dinh dưỡng!`
      );
      setTimeout(() => setSavedNotice(null), 5000);
    } catch {
      // Ignore storage error
    }
  };

  return (
    <section className="bg-white rounded-2xl p-6 border border-[#E8D5B7] shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-stone-900">
                Hồ Sơ Thể Trạng & Phác Đồ Calo Chuẩn Y Khoa
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Mifflin-St Jeor & WHO Châu Á
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Tính chỉ số BMI người Việt, chuyển hóa cơ bản (BMR), tổng tiêu hao (TDEE) và định mức năng lượng từng bữa cơm.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowMedicalNotes((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors self-start sm:self-center cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-amber-700" />
          {showMedicalNotes ? 'Ẩn căn cứ y khoa' : 'Căn cứ y khoa & Công thức'}
        </button>
      </div>

      {/* Hộp giải thích căn cứ y khoa của Bác sĩ Dinh dưỡng */}
      {showMedicalNotes && (
        <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-amber-200/80 text-xs text-stone-700 space-y-2.5 leading-relaxed">
          <p className="font-bold text-stone-900 flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            Tiêu chuẩn Y khoa áp dụng trên hệ thống Ăn Gì Mom:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Ngưỡng BMI Người Châu Á (WHO WPRO & Viện Dinh Dưỡng):</strong> Người Việt Nam có tỷ lệ mỡ nội tạng cao hơn người phương Tây ở cùng mức BMI. Do đó ngưỡng bình thường chuẩn là{' '}
              <strong>18.5 – 22.9 kg/m²</strong> (thừa cân từ <strong>≥ 23.0</strong>, béo phì từ <strong>≥ 25.0</strong>).
            </li>
            <li>
              <strong>Công thức BMR Mifflin-St Jeor:</strong> Được Hiệp hội Dinh dưỡng Lâm sàng Hoa Kỳ (ADA) đánh giá chính xác nhất hiện nay (sai số dưới 10%):{' '}
              <code>BMR = 10×Cân nặng(kg) + 6.25×Chiều cao(cm) - 5×Tuổi + (5 với Nam / -161 với Nữ)</code>.
            </li>
            <li>
              <strong>Nguyên tắc An toàn Lâm sàng:</strong> Không bao giờ cắt giảm năng lượng xuống thấp hơn ngưỡng chuyển hóa cơ bản tối thiểu, đồng thời kiểm soát <strong>Natri &lt; 2.000 mg/ngày</strong> (tương đương &lt; 5g muối/ngày theo WHO) để bảo vệ tim mạch và huyết áp gia đình.
            </li>
          </ul>
        </div>
      )}

      {/* Khu vực nhập chỉ số cơ thể & Kết quả trực tiếp */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Nhập thông số cá nhân (5 cột) */}
        <div className="lg:col-span-5 space-y-4 bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">Giới tính sinh học</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('FEMALE')}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  gender === 'FEMALE'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                👩 Nữ giới / Mẹ
              </button>
              <button
                type="button"
                onClick={() => setGender('MALE')}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  gender === 'MALE'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                👨 Nam giới / Bố
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Tuổi (năm)</label>
              <input
                type="number"
                min={10}
                max={100}
                value={age}
                onChange={(e) => setAge(Math.max(10, Math.min(100, Number(e.target.value) || 30)))}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Chiều cao (cm)</label>
              <input
                type="number"
                min={110}
                max={220}
                value={heightCm}
                onChange={(e) => setHeightCm(Math.max(110, Math.min(220, Number(e.target.value) || 158)))}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Cân nặng (kg)</label>
              <input
                type="number"
                min={25}
                max={180}
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(Math.max(25, Math.min(180, Number(e.target.value) || 54)))}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Cường độ vận động hàng ngày</label>
            <select
              value={activityFactor}
              onChange={(e) => setActivityFactor(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {ACTIVITY_LEVELS.map((act) => (
                <option key={act.factor} value={act.factor}>
                  {act.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Mục tiêu sức khỏe cá nhân</label>
            <select
              value={goalOffset}
              onChange={(e) => setGoalOffset(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {HEALTH_GOALS.map((g) => (
                <option key={g.offset} value={g.offset}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Lưu Hồ Sơ & Đồng Bộ Định Mức Sang Nhật Ký
          </button>

          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{savedNotice}</span>
            </div>
          )}
        </div>

        {/* Cột phải: Phác đồ Dinh dưỡng & Phân bổ 3 bữa (7 cột) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 3 thẻ chỉ số cốt lõi: BMI Châu Á, BMR, Khuyến nghị Calo/ngày */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl border border-stone-200 bg-[#FAF7F2]">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>Chỉ số BMI Châu Á</span>
                <Scale className="w-4 h-4 text-stone-400" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900 mt-1">{bmi}</p>
              <span
                className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${bmiMeta.badgeClass}`}
              >
                {bmiMeta.label}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl border border-stone-200 bg-[#FAF7F2]">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>Chuyển hóa nền (BMR)</span>
                <HeartPulse className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-extrabold text-stone-900 mt-1">
                {bmr.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-stone-500">kcal</span>
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Tiêu hao toàn phần (TDEE): <strong>{tdee.toLocaleString('vi-VN')} kcal</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/70">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
                <span>Định mức Khuyến nghị</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-950 mt-1">
                {recommendedDailyCalories.toLocaleString('vi-VN')}{' '}
                <span className="text-xs font-bold text-emerald-700">kcal/ngày</span>
              </p>
              <p className="text-[11px] text-emerald-800 mt-1 font-medium">
                Đạm {proteinGrams}g • Béo {fatGrams}g • Tinh bột {carbsGrams}g
              </p>
            </div>
          </div>

          {/* Lời khuyên lâm sàng theo BMI */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
            <Stethoscope className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lời khuyên Dinh dưỡng Gia đình: </span>
              <span>{bmiMeta.advice}</span>
            </div>
          </div>

          {/* Phân bổ năng lượng 3 bữa chính + 1 bữa phụ trong ngày */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Phân bổ Năng lượng Mâm cơm trong ngày (Chuẩn nhịp sinh học)
              </h3>
              <span className="text-[11px] font-semibold text-emerald-700">
                Muối khuyến nghị: &lt; 2.000mg Natri/ngày
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/70">
                <p className="text-[11px] font-bold text-amber-900">🌅 Bữa sáng (30%)</p>
                <p className="text-base font-extrabold text-stone-900 mt-0.5">~{breakfastKcal} kcal</p>
                <p className="text-[10px] text-stone-500 mt-0.5">Bún/Phở thanh đạm hoặc trứng + khoai</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <p className="text-[11px] font-bold text-emerald-900">☀️ Bữa trưa (40%)</p>
                <p className="text-base font-extrabold text-stone-900 mt-0.5">~{lunchKcal} kcal</p>
                <p className="text-[10px] text-stone-500 mt-0.5">Mâm cơm đủ Mặn + Canh + Rau + 1–1.5 chén cơm</p>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200">
                <p className="text-[11px] font-bold text-sky-900">🌙 Bữa tối (25%)</p>
                <p className="text-base font-extrabold text-stone-900 mt-0.5">~{dinnerKcal} kcal</p>
                <p className="text-[10px] text-stone-500 mt-0.5">Giảm cơm (½–1 chén), ưu tiên cá/đậu hũ & canh rau</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/70">
                <p className="text-[11px] font-bold text-purple-900">🍎 Bữa phụ (5%)</p>
                <p className="text-base font-extrabold text-stone-900 mt-0.5">~{snackKcal} kcal</p>
                <p className="text-[10px] text-stone-500 mt-0.5">Trái cây ít ngọt, sữa chua không đường</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
              <p className="text-[11px] text-stone-500">
                💡 Áp dụng ngay định mức <strong>~{lunchKcal} kcal</strong> cho bữa trưa hoặc{' '}
                <strong>~{dinnerKcal} kcal</strong> cho bữa tối trên Mâm cơm:
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href="/meal"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FDF8F2] hover:bg-amber-100/70 text-amber-900 border border-[#E8D5B7] text-xs font-bold transition-colors"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  Ghép mâm cơm theo chuẩn này
                </Link>
                <Link
                  href="/nhat-ky"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
                >
                  Xem Nhật ký Calo
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
