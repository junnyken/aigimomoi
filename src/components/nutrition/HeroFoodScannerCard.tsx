'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
  Eye,
  EyeOff,
  HeartPulse,
  Flame,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import type { ScannedFoodItem, FoodScanResponse } from '@/app/api/ai/food-scanner/route';

interface HeroPreset {
  id: string;
  shortLabel: string;
  imageUrl: string;
  scanData: FoodScanResponse;
}

const HERO_PRESETS: HeroPreset[] = [
  {
    id: 'pesto-shrimp',
    shortLabel: '🍝 Mỳ Ý Pesto',
    imageUrl: '/images/scan-samples/sample-pesto-shrimp.jpg',
    scanData: {
      dishTitle: 'Mỳ Ý Sốt Pesto Xanh, Tôm Cháy Tỏi, Bơ Hoa & Bông Cải Hấp',
      mealFormat: 'SINGLE_PLATE',
      healthScore: 94,
      coachSummary: 'Cân bằng hoàn hảo giữa Đạm nạc (Tôm), Chất béo tốt (Bơ sáp) và Rau xanh.',
      provider: 'gemini-vision + VIETNAM_FCT_2007',
      items: [
        {
          id: 'hp-1',
          name: 'Tôm cháy tỏi',
          category: 'PROTEIN',
          estimatedGrams: 85,
          portionNote: '4 con lớn',
          pinX: 52,
          pinY: 24,
          calories100g: 90,
          protein100g: 18.4,
          fat100g: 1.4,
          carbs100g: 0.9,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hp-2',
          name: 'Bông cải xanh hấp',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 90,
          portionNote: '3 nhánh lớn',
          pinX: 26,
          pinY: 46,
          calories100g: 30,
          protein100g: 3.0,
          fat100g: 0.3,
          carbs100g: 5.2,
          fiber100g: 2.6,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hp-3',
          name: 'Bơ sáp cuộn hoa',
          category: 'HEALTHY_FAT',
          estimatedGrams: 65,
          portionNote: '1/2 quả bơ',
          pinX: 50,
          pinY: 43,
          calories100g: 160,
          protein100g: 2.0,
          fat100g: 14.7,
          carbs100g: 8.5,
          fiber100g: 6.7,
          source: 'USDA_FDC',
        },
        {
          id: 'hp-4',
          name: 'Cà chua bi',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 45,
          portionNote: '4 nửa quả',
          pinX: 75,
          pinY: 42,
          calories100g: 19,
          protein100g: 0.6,
          fat100g: 0.2,
          carbs100g: 3.8,
          fiber100g: 1.4,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hp-5',
          name: 'Mỳ Ý sốt Pesto',
          category: 'CARB',
          estimatedGrams: 130,
          portionNote: '2 cuộn mỳ',
          pinX: 53,
          pinY: 68,
          calories100g: 175,
          protein100g: 5.8,
          fat100g: 3.2,
          carbs100g: 30.9,
          fiber100g: 1.8,
          source: 'USDA_FDC',
        },
      ],
    },
  },
  {
    id: 'three-meals',
    shortLabel: '🍱 Khay 3 Bữa',
    imageUrl: '/images/scan-samples/sample-3-meals-tray.jpg',
    scanData: {
      dishTitle: 'Thực Đơn 3 Bữa: Sáng (Sữa, Trứng, Cam) • Trưa (Bò Bít Tết, Khoai) • Tối (Bắp, Cà Chua)',
      mealFormat: 'DAILY_3_MEALS',
      healthScore: 92,
      coachSummary: 'Thực đơn cả ngày kiểm soát calo và giàu đạm sắt từ bò bít tết.',
      provider: 'gemini-vision + VIETNAM_FCT_2007',
      items: [
        {
          id: 'hm-1',
          name: 'Sữa tươi + Trứng + Cam',
          category: 'PROTEIN',
          estimatedGrams: 280,
          portionNote: 'Khay Sáng',
          pinX: 48,
          pinY: 19,
          calories100g: 78,
          protein100g: 5.2,
          fat100g: 3.4,
          carbs100g: 6.2,
          fiber100g: 0.8,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hm-2',
          name: 'Thăn bò bít tết áp chảo',
          category: 'PROTEIN',
          estimatedGrams: 140,
          portionNote: 'Khay Trưa',
          pinX: 66,
          pinY: 54,
          calories100g: 118,
          protein100g: 21.5,
          fat100g: 3.8,
          carbs100g: 0,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hm-3',
          name: 'Khoai tây & Cải thìa',
          category: 'CARB',
          estimatedGrams: 200,
          portionNote: 'Khay Trưa',
          pinX: 34,
          pinY: 48,
          calories100g: 65,
          protein100g: 1.8,
          fat100g: 0.2,
          carbs100g: 14.0,
          fiber100g: 1.3,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hm-4',
          name: 'Bắp ngọt & Cà chua bi',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 190,
          portionNote: 'Khay Tối',
          pinX: 46,
          pinY: 81,
          calories100g: 61,
          protein100g: 2.2,
          fat100g: 0.8,
          carbs100g: 13.4,
          fiber100g: 2.2,
          source: 'VIETNAM_FCT_2007',
        },
      ],
    },
  },
  {
    id: 'yoga-plate',
    shortLabel: '🧘 Đĩa Yoga',
    imageUrl: '/images/scan-samples/sample-eatclean-grid.jpg',
    scanData: {
      dishTitle: 'Đĩa Eat Clean & Yoga: Trứng Lòng Đào, Bơ Sáp, Bông Cải & Thanh Long Đỏ',
      mealFormat: 'SINGLE_PLATE',
      healthScore: 96,
      coachSummary: 'Giàu chất xơ, vitamin và chất béo thực vật dễ tiêu hóa trước/sau tập Yoga.',
      provider: 'gemini-vision + VIETNAM_FCT_2007',
      items: [
        {
          id: 'hy-1',
          name: 'Trứng gà lòng đào',
          category: 'PROTEIN',
          estimatedGrams: 110,
          portionNote: '2 quả',
          pinX: 28,
          pinY: 18,
          calories100g: 166,
          protein100g: 14.8,
          fat100g: 11.6,
          carbs100g: 0.5,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hy-2',
          name: 'Bông cải xanh hấp',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 100,
          portionNote: '1 góc đĩa',
          pinX: 65,
          pinY: 16,
          calories100g: 30,
          protein100g: 3.0,
          fat100g: 0.3,
          carbs100g: 5.2,
          fiber100g: 2.6,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hy-3',
          name: 'Bơ sáp thái lát',
          category: 'HEALTHY_FAT',
          estimatedGrams: 60,
          portionNote: '4 lát bơ',
          pinX: 66,
          pinY: 28,
          calories100g: 160,
          protein100g: 2.0,
          fat100g: 14.7,
          carbs100g: 8.5,
          fiber100g: 6.7,
          source: 'USDA_FDC',
        },
        {
          id: 'hy-4',
          name: 'Thanh long ruột đỏ',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 85,
          portionNote: '5 miếng',
          pinX: 28,
          pinY: 42,
          calories100g: 50,
          protein100g: 1.1,
          fat100g: 0.4,
          carbs100g: 11.0,
          fiber100g: 3.0,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hy-5',
          name: 'Ức gà áp chảo mè',
          category: 'PROTEIN',
          estimatedGrams: 100,
          portionNote: '1 miếng phi lê',
          pinX: 25,
          pinY: 82,
          calories100g: 110,
          protein100g: 23.1,
          fat100g: 1.2,
          carbs100g: 0,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
        },
      ],
    },
  },
  {
    id: 'gym-plate',
    shortLabel: '💪 Đĩa Gym',
    imageUrl: '/images/scan-samples/sample-gym-grid.jpg',
    scanData: {
      dishTitle: 'Đĩa Tập Gym Tăng Cơ: Tôm Bóc Nõn, Thịt Thăn Luộc, Bắp Ngọt & Rau Xanh',
      mealFormat: 'SINGLE_PLATE',
      healthScore: 95,
      coachSummary: 'Đạm kép từ tôm nõn và thịt thăn luộc không dầu mỡ, tối ưu phục hồi cơ bắp.',
      provider: 'gemini-vision + VIETNAM_FCT_2007',
      items: [
        {
          id: 'hg-1',
          name: 'Tôm bóc nõn hấp',
          category: 'PROTEIN',
          estimatedGrams: 100,
          portionNote: '8 con tôm',
          pinX: 18,
          pinY: 50,
          calories100g: 90,
          protein100g: 18.4,
          fat100g: 1.4,
          carbs100g: 0.9,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hg-2',
          name: 'Thịt thăn heo luộc',
          category: 'PROTEIN',
          estimatedGrams: 110,
          portionNote: '1 phần nạc',
          pinX: 68,
          pinY: 45,
          calories100g: 139,
          protein100g: 19.0,
          fat100g: 7.0,
          carbs100g: 0,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hg-3',
          name: 'Bắp ngọt luộc',
          category: 'CARB',
          estimatedGrams: 95,
          portionNote: '2 khúc bắp',
          pinX: 20,
          pinY: 84,
          calories100g: 86,
          protein100g: 3.2,
          fat100g: 1.2,
          carbs100g: 19.0,
          fiber100g: 2.7,
          source: 'VIETNAM_FCT_2007',
        },
        {
          id: 'hg-4',
          name: 'Cải ngọt & Dưa leo',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 150,
          portionNote: 'Rau xanh luộc',
          pinX: 80,
          pinY: 54,
          calories100g: 17,
          protein100g: 1.5,
          fat100g: 0.2,
          carbs100g: 2.5,
          fiber100g: 1.6,
          source: 'VIETNAM_FCT_2007',
        },
      ],
    },
  },
];

const PIN_COLOR_BY_CATEGORY: Record<ScannedFoodItem['category'], string> = {
  PROTEIN: 'bg-rose-700/95 text-white border-rose-300',
  VEGGIE_FRUIT: 'bg-emerald-700/95 text-white border-emerald-300',
  CARB: 'bg-amber-700/95 text-white border-amber-300',
  HEALTHY_FAT: 'bg-teal-700/95 text-white border-teal-300',
  SAUCE: 'bg-purple-700/95 text-white border-purple-300',
};

export function HeroFoodScannerCard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activePresetId, setActivePresetId] = useState<string>(HERO_PRESETS[0].id);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>(HERO_PRESETS[0].imageUrl);
  const [scanning, setScanning] = useState<boolean>(false);
  const [showPins, setShowPins] = useState<boolean>(true);
  const [scanResult, setScanResult] = useState<FoodScanResponse>(HERO_PRESETS[0].scanData);
  const [items, setItems] = useState<ScannedFoodItem[]>(HERO_PRESETS[0].scanData.items);
  const [cookingOilMode, setCookingOilMode] = useState<'NONE' | 'LIGHT_OIL' | 'SAUCE_RICH'>('LIGHT_OIL');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const oilExtraKcal = cookingOilMode === 'LIGHT_OIL' ? 36 : cookingOilMode === 'SAUCE_RICH' ? 80 : 0;
  const oilExtraFat = cookingOilMode === 'LIGHT_OIL' ? 4 : cookingOilMode === 'SAUCE_RICH' ? 8.5 : 0;

  const totals = useMemo(() => {
    let kcal = 0;
    let protein = 0;
    let fat = 0;
    let carbs = 0;
    let fiber = 0;
    let totalGrams = 0;

    let veggieGrams = 0;
    let proteinGrams = 0;
    let carbGrams = 0;

    for (const it of items) {
      const ratio = it.estimatedGrams / 100;
      kcal += it.calories100g * ratio;
      protein += it.protein100g * ratio;
      fat += it.fat100g * ratio;
      carbs += it.carbs100g * ratio;
      fiber += (it.fiber100g || 0) * ratio;
      totalGrams += it.estimatedGrams;

      if (it.category === 'VEGGIE_FRUIT') veggieGrams += it.estimatedGrams;
      else if (it.category === 'PROTEIN') proteinGrams += it.estimatedGrams;
      else if (it.category === 'CARB') carbGrams += it.estimatedGrams;
    }

    const safeTotal = Math.max(1, totalGrams);
    const veggiePct = Math.round((veggieGrams / safeTotal) * 100);
    const proteinPct = Math.round((proteinGrams / safeTotal) * 100);
    const carbPct = Math.round((carbGrams / safeTotal) * 100);
    const fatPct = Math.max(0, 100 - veggiePct - proteinPct - carbPct);

    return {
      kcal: Math.round(kcal + oilExtraKcal),
      protein: Math.round(protein * 10) / 10,
      fat: Math.round((fat + oilExtraFat) * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      totalGrams: Math.round(totalGrams),
      veggiePct,
      proteinPct,
      carbPct,
      fatPct,
    };
  }, [items, oilExtraKcal, oilExtraFat]);

  function handleSelectPreset(preset: HeroPreset) {
    setActivePresetId(preset.id);
    setPreviewImageUrl(preset.imageUrl);
    setScanResult(preset.scanData);
    setItems(preset.scanData.items.map((i) => ({ ...i })));
    setCookingOilMode(preset.id === 'gym-plate' || preset.id === 'yoga-plate' ? 'NONE' : 'LIGHT_OIL');
    setSavedNotice(null);
  }

  function adjustGrams(id: string, delta: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, estimatedGrams: Math.max(10, Math.min(800, it.estimatedGrams + delta)) }
          : it
      )
    );
  }

  async function compressImageToBase64(file: File): Promise<{ dataUrl: string; base64: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 920;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const base64 = dataUrl.split('base64,')[1] || '';
          resolve({ dataUrl, base64 });
        };
        img.onerror = reject;
        img.src = String(ev.target?.result || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setActivePresetId('custom');
    setSavedNotice(null);
    setScanning(true);

    try {
      const { dataUrl, base64 } = await compressImageToBase64(file);
      setPreviewImageUrl(dataUrl);

      const res = await fetch('/api/ai/food-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: 'image/jpeg',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setScanResult(data.result);
          setItems(data.result.items || []);
        }
      }
    } catch (err) {
      console.error('Lỗi quét ảnh trên trang chủ:', err);
    } finally {
      setScanning(false);
    }
  }

  async function handleQuickSaveToDiary() {
    setSavedNotice(null);
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeName: `📸 ${scanResult.dishTitle}`,
          diaryDate: todayStr,
          mealType: 'LUNCH',
          memberName: 'Tôi',
          consumedPortion: 1,
          customCalories: totals.kcal,
          customProtein: totals.protein,
          customFat: totals.fat,
          customCarbs: totals.carbs,
          customFiber: totals.fiber,
        }),
      });

      if (res.status === 401) {
        window.location.href = '/login?from=/';
        return;
      }

      if (res.ok) {
        setSavedNotice(`Đã lưu (${totals.kcal} kcal) vào Nhật ký hôm nay!`);
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="lg:col-span-5 flex flex-col gap-3">
      {/* Khung Quét Ảnh AI Trực Quan Thay Thế Ảnh Tĩnh */}
      <div className="rounded-3xl bg-white border-2 border-white shadow-md overflow-hidden flex flex-col">
        {/* Vùng Ảnh Đĩa Ăn + Nhãn Bong Bóng Thành Phần */}
        <div className="relative aspect-[16/11] bg-stone-900 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImageUrl}
            alt={scanResult.dishTitle}
            className={`w-full h-full object-cover transition-all duration-300 ${
              scanning ? 'opacity-40 blur-[1px]' : 'opacity-95'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/25 pointer-events-none" />

          {/* Hiệu ứng đang quét AI */}
          {scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 text-white p-4 text-center z-20">
              <RefreshCw className="w-7 h-7 animate-spin text-emerald-400 mb-2" />
              <p className="text-xs sm:text-sm font-extrabold">
                AI đang nhận diện từng loại rau củ, đạm &amp; tính Kcal...
              </p>
            </div>
          )}

          {/* Huy hiệu góc trên */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-[#2F4F30] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Quét Đĩa Ăn • Chuẩn VDD VN</span>
            </span>

            <button
              type="button"
              onClick={() => setShowPins((p) => !p)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/65 hover:bg-black/80 text-white border border-white/25 cursor-pointer"
            >
              {showPins ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showPins ? 'Ẩn nhãn' : 'Hiện nhãn'}</span>
            </button>
          </div>

          {/* Các Nhãn Bong Bóng (Smart Pin Tags) gắn trực tiếp lên từng món trong ảnh */}
          {!scanning &&
            showPins &&
            items.map((item, idx) => {
              const itemKcal = Math.round((item.calories100g * item.estimatedGrams) / 100);
              const pinStyle =
                PIN_COLOR_BY_CATEGORY[item.category] || 'bg-stone-800/95 text-white border-stone-400';

              return (
                <div
                  key={item.id}
                  style={{
                    left: `${Math.min(84, Math.max(16, item.pinX))}%`,
                    top: `${Math.min(82, Math.max(18, item.pinY))}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                >
                  <div
                    className={`px-2 py-0.5 rounded-full border shadow-md text-[10px] font-extrabold whitespace-nowrap flex items-center gap-1 backdrop-blur-xs ${pinStyle}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white/25 inline-flex items-center justify-center text-[9px]">
                      {idx + 1}
                    </span>
                    <span className="max-w-[110px] truncate">{item.name}</span>
                    <span className="text-amber-200 font-black">• {itemKcal} kcal</span>
                  </div>
                </div>
              );
            })}

          {/* Thanh Tổng Kcal + Nút Chụp / Tải Ảnh ở góc dưới ảnh */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 z-10">
            <div className="text-white min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[11px] font-black">
                  🔥 Tổng đĩa: {totals.kcal} kcal
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white text-[11px] font-bold">
                  🥩 {totals.protein}g Đạm • 🥦 {totals.fiber}g Xơ
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold leading-snug mt-1 truncate">
                {scanResult.dishTitle}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-extrabold shadow-md transition-transform hover:scale-105 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Chụp / Tải ảnh</span>
            </button>
          </div>
        </div>

        {/* Thanh Chọn Nhanh 4 Mẫu Đĩa Thực Tế + Chỉnh Gram Từng Thành Phần */}
        <div className="p-3 sm:p-3.5 bg-[#FAF7F0] border-t border-[#E5DAC8] space-y-2.5">
          {/* 4 Nút đổi mẫu đĩa + Chế biến dầu sốt */}
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-0.5">
            {HERO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap transition-colors cursor-pointer ${
                  activePresetId === preset.id
                    ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                    : 'bg-white text-[var(--color-text-secondary)] border-[#DFD2C0] hover:border-[var(--color-brand-primary)]'
                }`}
              >
                {preset.shortLabel}
              </button>
            ))}
          </div>

          {/* Thanh Tỷ Lệ % Cấu Trúc Đĩa Ăn (Chuẩn Harvard Plate) + Nút Chọn Dầu Sốt */}
          <div className="p-2.5 rounded-xl bg-white border border-[#E5DAC8] space-y-2">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="font-extrabold text-[#2F4F30]">
                📊 Tỷ lệ đĩa ({totals.totalGrams}g): 🥦 {totals.veggiePct}% Rau • 🥩 {totals.proteinPct}% Đạm • 🍚 {totals.carbPct}% Tinh bột
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold shrink-0">
                🎯 {scanResult.overallConfidence || 94}% chuẩn
              </span>
            </div>

            <div className="w-full h-2 rounded-full overflow-hidden flex bg-stone-100">
              {totals.veggiePct > 0 && (
                <div style={{ width: `${totals.veggiePct}%` }} className="bg-emerald-600 h-full" />
              )}
              {totals.proteinPct > 0 && (
                <div style={{ width: `${totals.proteinPct}%` }} className="bg-rose-600 h-full" />
              )}
              {totals.carbPct > 0 && (
                <div style={{ width: `${totals.carbPct}%` }} className="bg-amber-500 h-full" />
              )}
              {totals.fatPct > 0 && (
                <div style={{ width: `${totals.fatPct}%` }} className="bg-teal-600 h-full" />
              )}
            </div>

            <div className="flex items-center justify-between gap-1 pt-0.5">
              <span className="text-[10px] font-bold text-stone-600">Chế biến:</span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { key: 'NONE', label: '💧 Hấp/Luộc (0 dầu)' },
                    { key: 'LIGHT_OIL', label: '🍳 Áp chảo (+36 kcal)' },
                    { key: 'SAUCE_RICH', label: '🥣 Xào/Sốt (+80 kcal)' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setCookingOilMode(m.key)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition-colors ${
                      cookingOilMode === m.key
                        ? 'bg-amber-700 text-white border-amber-700'
                        : 'bg-[#FAF7F0] text-stone-700 border-[#DFD2C0]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Danh sách gọn các thành phần trên đĩa (cho phép bấm +/- gram trực tiếp) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
            {items.map((item, idx) => {
              const itemKcal = Math.round((item.calories100g * item.estimatedGrams) / 100);
              return (
                <div
                  key={item.id}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E5DAC8] flex items-center justify-between gap-1.5 text-[11px]"
                >
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="block text-[10px] text-[var(--color-accent-primary)] font-extrabold">
                      {itemKcal} kcal • {Math.round(item.protein100g * (item.estimatedGrams / 100) * 10) / 10}g Đạm
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => adjustGrams(item.id, -15)}
                      className="w-5 h-5 rounded-md bg-stone-100 hover:bg-stone-200 inline-flex items-center justify-center text-stone-700 cursor-pointer"
                      title="Giảm 15g"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="min-w-[36px] text-center font-extrabold text-[10px] text-stone-800">
                      {item.estimatedGrams}g
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustGrams(item.id, 15)}
                      className="w-5 h-5 rounded-md bg-stone-100 hover:bg-stone-200 inline-flex items-center justify-center text-stone-700 cursor-pointer"
                      title="Tăng 15g"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {savedNotice && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px] font-bold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {savedNotice}
              </span>
              <Link href="/nhat-ky" className="underline font-extrabold">
                Xem Nhật ký →
              </Link>
            </div>
          )}

          {/* Thanh hành động dưới cùng */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleQuickSaveToDiary}
              className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-[var(--color-brand-primary)] border border-[var(--color-brand-border)] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              <span>Lưu vào Nhật ký</span>
            </button>

            <Link
              href="/tinh-calo?tab=scan"
              className="flex-1 py-2 px-3 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Mở Bàn Quét Đầy Đủ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2 Thẻ điểm nhấn nhanh dưới khung Quét Ảnh */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/mon-an?tax=giam-can-it-calo"
          className="p-3 rounded-2xl bg-[var(--color-surface-white)]/95 hover:bg-[var(--color-surface-white)] border border-emerald-200 shadow-2xs flex items-center gap-2.5 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">
              Eat Clean &amp; Yoga
            </p>
            <p className="text-[11px] text-emerald-700 font-medium truncate">
              ≤ 350 – 500 kcal/bữa
            </p>
          </div>
        </Link>

        <Link
          href="/mon-an?tax=tap-gym-tang-co"
          className="p-3 rounded-2xl bg-[var(--color-surface-white)]/95 hover:bg-[var(--color-surface-white)] border border-amber-200 shadow-2xs flex items-center gap-2.5 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">
              Thực Đơn Tập Gym
            </p>
            <p className="text-[11px] text-amber-800 font-medium truncate">
              Giàu Đạm 25–45g/phần
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
