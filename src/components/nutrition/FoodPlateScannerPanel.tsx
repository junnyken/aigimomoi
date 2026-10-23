'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Eye,
  EyeOff,
  HeartPulse,
  RefreshCw,
  LogIn,
  ShieldCheck,
  Flame,
  Info,
} from 'lucide-react';
import { VIETNAMESE_STANDARD_FCT } from '@/lib/nutrition/seedData';
import type { ScannedFoodItem, FoodScanResponse } from '@/app/api/ai/food-scanner/route';

interface FoodPlateScannerPanelProps {
  targetCalories: number;
  proteinGrams: number;
  breakfastKcal: number;
  lunchKcal: number;
  dinnerKcal: number;
  breakfastPro: number;
  lunchPro: number;
  dinnerPro: number;
}

interface SamplePreset {
  id: string;
  badge: string;
  title: string;
  imageUrl: string;
  defaultMealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  scanData: FoodScanResponse;
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'pesto-shrimp',
    badge: '🍝 Mẫu 1: Mỳ Ý Pesto & Tôm',
    title: 'Mỳ Ý Sốt Pesto Xanh, Tôm Cháy Tỏi, Bơ Sáp Cuộn Hoa & Bông Cải Hấp',
    imageUrl: '/images/scan-samples/sample-pesto-shrimp.jpg',
    defaultMealType: 'LUNCH',
    scanData: {
      dishTitle: 'Mỳ Ý Sốt Pesto Xanh, Tôm Cháy Tỏi, Bơ Hoa & Bông Cải Hấp',
      mealFormat: 'SINGLE_PLATE',
      healthScore: 94,
      coachSummary:
        'Đĩa ăn Eat Clean giao thoa Á – Âu cực kỳ cân đối: Tôm áp chảo cung cấp đạm nạc tinh khiết, bông cải xanh và cà chua bi giàu chất xơ – chống oxy hóa, quả bơ sáp xếp hoa ở giữa bổ sung axit béo không bão hòa đơn tốt cho tim mạch.',
      provider: 'gemini-vision + VIETNAM_FCT_2007',
      items: [
        {
          id: 'pesto-1',
          name: 'Tôm bóc nõn cháy tỏi',
          category: 'PROTEIN',
          estimatedGrams: 85,
          portionNote: '4 con tôm lớn (~85g)',
          pinX: 52,
          pinY: 25,
          calories100g: 90,
          protein100g: 18.4,
          fat100g: 1.4,
          carbs100g: 0.9,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Tôm bóc nõn tươi (100% thịt)',
        },
        {
          id: 'pesto-2',
          name: 'Bông cải xanh hấp & Xà lách',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 90,
          portionNote: '3 nhánh lớn (~90g)',
          pinX: 27,
          pinY: 46,
          calories100g: 30,
          protein100g: 3.0,
          fat100g: 0.3,
          carbs100g: 5.2,
          fiber100g: 2.6,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Bông cải xanh (Súp lơ xanh)',
        },
        {
          id: 'pesto-3',
          name: 'Quả bơ sáp xếp hoa hồng',
          category: 'HEALTHY_FAT',
          estimatedGrams: 65,
          portionNote: '1/2 quả bơ cuộn hoa (~65g)',
          pinX: 50,
          pinY: 43,
          calories100g: 160,
          protein100g: 2.0,
          fat100g: 14.7,
          carbs100g: 8.5,
          fiber100g: 6.7,
          source: 'USDA_FDC',
          matchedFctName: 'Quả bơ sáp chín',
        },
        {
          id: 'pesto-4',
          name: 'Cà chua bi bổ đôi',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 45,
          portionNote: '4 nửa quả (~45g)',
          pinX: 74,
          pinY: 42,
          calories100g: 19,
          protein100g: 0.6,
          fat100g: 0.2,
          carbs100g: 3.8,
          fiber100g: 1.4,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Cà chua',
        },
        {
          id: 'pesto-5',
          name: 'Mỳ Ý luộc trộn sốt Pesto & Mè đen',
          category: 'CARB',
          estimatedGrams: 130,
          portionNote: '2 cuộn mỳ vừa (~130g)',
          pinX: 53,
          pinY: 66,
          calories100g: 175,
          protein100g: 5.8,
          fat100g: 3.2,
          carbs100g: 30.9,
          fiber100g: 1.8,
          source: 'USDA_FDC',
          matchedFctName: 'Mỳ Ý (Spaghetti / Pasta đã luộc chín)',
        },
      ],
    },
  },
  {
    id: 'three-meals-tray',
    badge: '🍱 Mẫu 2: Khay 3 Bữa (Sáng-Trưa-Tối)',
    title: 'Thực Đơn Cả Ngày Thứ Tư: Sáng (Sữa, Trứng, Cam) • Trưa (Bò Bít Tết, Khoai Tây, Cải Thìa) • Tối (Bắp, Cà Chua Bi)',
    imageUrl: '/images/scan-samples/sample-3-meals-tray.jpg',
    defaultMealType: 'LUNCH',
    scanData: {
      dishTitle: 'Thực Đơn 3 Bữa Sáng – Trưa – Tối Chuẩn Kiểm Soát Calo',
      mealFormat: 'DAILY_3_MEALS',
      healthScore: 92,
      coachSummary:
        'Thực đơn 3 khay Sáng – Trưa – Tối được phân bổ rất khoa học theo nhịp sinh học: Sáng nạp đạm + Vitamin C, Trưa nạp đạm sắt từ bò bít tết và tinh bột khoai tây, Tối ăn nhẹ bụng với bắp ngọt và cà chua bi giàu chất xơ.',
      provider: 'gemini-vision + VIETNAM_FCT_2007',
      items: [
        {
          id: 'tray-1',
          name: '[Sáng] Sữa tươi không đường',
          category: 'PROTEIN',
          estimatedGrams: 200,
          portionNote: '1 cốc thủy tinh (200ml)',
          pinX: 26,
          pinY: 19,
          calories100g: 48,
          protein100g: 3.3,
          fat100g: 1.8,
          carbs100g: 4.7,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Sữa tươi không đường / Sữa hạt',
        },
        {
          id: 'tray-2',
          name: '[Sáng] Trứng gà ốp la & Cam vàng',
          category: 'PROTEIN',
          estimatedGrams: 135,
          portionNote: '1 quả trứng (55g) + 3 múi cam (80g)',
          pinX: 55,
          pinY: 20,
          calories100g: 95,
          protein100g: 6.6,
          fat100g: 4.8,
          carbs100g: 7.2,
          fiber100g: 1.4,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Trứng gà ta & Cam tươi',
        },
        {
          id: 'tray-3',
          name: '[Trưa] Thăn bò bít tết áp chảo',
          category: 'PROTEIN',
          estimatedGrams: 140,
          portionNote: '1 miếng thăn bò cắt lát (~140g)',
          pinX: 66,
          pinY: 54,
          calories100g: 118,
          protein100g: 21.5,
          fat100g: 3.8,
          carbs100g: 0,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Thịt bò phi lê (Thăn nội)',
        },
        {
          id: 'tray-4',
          name: '[Trưa] Khoai tây áp chảo ít dầu',
          category: 'CARB',
          estimatedGrams: 130,
          portionNote: '1 góc khay khoai tây (~130g)',
          pinX: 30,
          pinY: 50,
          calories100g: 93,
          protein100g: 2.0,
          fat100g: 0.1,
          carbs100g: 21.0,
          fiber100g: 1.4,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Khoai tây',
        },
        {
          id: 'tray-5',
          name: '[Trưa] Cải thìa luộc xanh',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 90,
          portionNote: '3 cây cải thìa (~90g)',
          pinX: 63,
          pinY: 41,
          calories100g: 16,
          protein100g: 1.5,
          fat100g: 0.2,
          carbs100g: 2.2,
          fiber100g: 1.2,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Cải thìa (Cải chíp)',
        },
        {
          id: 'tray-6',
          name: '[Tối] Bắp ngọt luộc & 6 quả Cà chua bi',
          category: 'CARB',
          estimatedGrams: 190,
          portionNote: '1 bắp ngô (120g) + 6 quả cà chua bi (70g)',
          pinX: 46,
          pinY: 81,
          calories100g: 61,
          protein100g: 2.2,
          fat100g: 0.8,
          carbs100g: 13.4,
          fiber100g: 2.2,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Bắp ngọt (Ngô ngọt tách hạt)',
        },
      ],
    },
  },
  {
    id: 'yoga-eatclean-plate',
    badge: '🧘 Mẫu 3: Đĩa Yoga & Thanh Lọc',
    title: 'Đĩa Eat Clean & Yoga: Trứng Gà Lòng Đào, Bơ Sáp, Bông Cải Xanh, Thanh Long Đỏ & Đậu Gà',
    imageUrl: '/images/scan-samples/sample-eatclean-grid.jpg',
    defaultMealType: 'DINNER',
    scanData: {
      dishTitle: 'Đĩa Eat Clean & Yoga Giàu Chất Xơ, Bơ Sáp & Trứng Lòng Đào',
      mealFormat: 'SINGLE_PLATE',
      healthScore: 96,
      coachSummary:
        'Thực đơn chuẩn Yoga & Eat Clean: kết hợp đạm sinh học cao từ trứng gà lòng đào/ức gà áp chảo với nhóm thực vật đa sắc màu (Bông cải xanh, Thanh long ruột đỏ, Bơ sáp, Cà rốt, Đậu gà) giúp no lâu, đẹp da và cực kỳ nhẹ bụng.',
      provider: 'gemini-vision + VIETNAM_FCT_2007',
      items: [
        {
          id: 'yoga-1',
          name: 'Trứng gà luộc lòng đào',
          category: 'PROTEIN',
          estimatedGrams: 110,
          portionNote: '2 quả bổ đôi (~110g)',
          pinX: 28,
          pinY: 18,
          calories100g: 166,
          protein100g: 14.8,
          fat100g: 11.6,
          carbs100g: 0.5,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Trứng gà ta',
        },
        {
          id: 'yoga-2',
          name: 'Bông cải xanh & Cải ngọt hấp',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 100,
          portionNote: '1 góc đĩa rau xanh (~100g)',
          pinX: 65,
          pinY: 16,
          calories100g: 30,
          protein100g: 3.0,
          fat100g: 0.3,
          carbs100g: 5.2,
          fiber100g: 2.6,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Bông cải xanh (Súp lơ xanh)',
        },
        {
          id: 'yoga-3',
          name: 'Quả bơ sáp thái lát',
          category: 'HEALTHY_FAT',
          estimatedGrams: 60,
          portionNote: '4 lát bơ chín (~60g)',
          pinX: 66,
          pinY: 27,
          calories100g: 160,
          protein100g: 2.0,
          fat100g: 14.7,
          carbs100g: 8.5,
          fiber100g: 6.7,
          source: 'USDA_FDC',
          matchedFctName: 'Quả bơ sáp chín',
        },
        {
          id: 'yoga-4',
          name: 'Thanh long ruột đỏ cắt miếng',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 85,
          portionNote: '5 miếng vuông (~85g)',
          pinX: 28,
          pinY: 42,
          calories100g: 50,
          protein100g: 1.1,
          fat100g: 0.4,
          carbs100g: 11.0,
          fiber100g: 3.0,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Thanh long ruột đỏ / trắng',
        },
        {
          id: 'yoga-5',
          name: 'Ức gà áp chảo mè rang',
          category: 'PROTEIN',
          estimatedGrams: 100,
          portionNote: '1 miếng phi lê cắt lát (~100g)',
          pinX: 25,
          pinY: 82,
          calories100g: 110,
          protein100g: 23.1,
          fat100g: 1.2,
          carbs100g: 0,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Ức gà phi lê (Không da)',
        },
      ],
    },
  },
  {
    id: 'gym-protein-plate',
    badge: '💪 Mẫu 4: Đĩa Gym Tăng Cơ',
    title: 'Đĩa Tập Gym High-Protein: Tôm Bóc Nõn, Thịt Thăn Luộc, Ức Gà, Bắp Ngọt & Rau Luộc',
    imageUrl: '/images/scan-samples/sample-gym-grid.jpg',
    defaultMealType: 'LUNCH',
    scanData: {
      dishTitle: 'Đĩa Tập Gym Giàu Đạm Nạc (Tôm Nõn, Thịt Thăn, Ức Gà & Bắp Ngọt)',
      mealFormat: 'SINGLE_PLATE',
      healthScore: 95,
      coachSummary:
        'Đĩa ăn lý tưởng cho người tập Gym muốn tăng cơ – giảm mỡ: 100% chế biến bằng phương pháp hấp/luộc không dầu mỡ, kết hợp đạm kép từ tôm bóc nõn và thịt thăn heo/ức gà cùng bắp ngọt và rau cải xanh.',
      provider: 'gemini-vision + VIETNAM_FCT_2007',
      items: [
        {
          id: 'gym-1',
          name: 'Tôm bóc nõn hấp',
          category: 'PROTEIN',
          estimatedGrams: 100,
          portionNote: '8 con tôm nõn (~100g)',
          pinX: 16,
          pinY: 50,
          calories100g: 90,
          protein100g: 18.4,
          fat100g: 1.4,
          carbs100g: 0.9,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Tôm bóc nõn tươi (100% thịt)',
        },
        {
          id: 'gym-2',
          name: 'Thịt thăn heo nạc luộc thái lát',
          category: 'PROTEIN',
          estimatedGrams: 110,
          portionNote: '1 phần thịt nạc luộc (~110g)',
          pinX: 68,
          pinY: 45,
          calories100g: 139,
          protein100g: 19.0,
          fat100g: 7.0,
          carbs100g: 0,
          fiber100g: 0,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Thịt lợn nạc (Thịt thăn / mông)',
        },
        {
          id: 'gym-3',
          name: 'Bắp ngọt luộc cắt khúc',
          category: 'CARB',
          estimatedGrams: 95,
          portionNote: '2 khúc bắp ngọt (~95g)',
          pinX: 18,
          pinY: 84,
          calories100g: 86,
          protein100g: 3.2,
          fat100g: 1.2,
          carbs100g: 19.0,
          fiber100g: 2.7,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Bắp ngọt (Ngô ngọt tách hạt)',
        },
        {
          id: 'gym-4',
          name: 'Cải ngọt & Cải thảo luộc',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 120,
          portionNote: '1 góc lớn rau luộc (~120g)',
          pinX: 82,
          pinY: 52,
          calories100g: 17,
          protein100g: 1.7,
          fat100g: 0.2,
          carbs100g: 2.1,
          fiber100g: 1.8,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Cải ngọt',
        },
        {
          id: 'gym-5',
          name: 'Dưa leo gọt vỏ thái lát',
          category: 'VEGGIE_FRUIT',
          estimatedGrams: 80,
          portionNote: '1 góc đĩa dưa leo (~80g)',
          pinX: 32,
          pinY: 86,
          calories100g: 15,
          protein100g: 0.8,
          fat100g: 0.1,
          carbs100g: 2.9,
          fiber100g: 0.7,
          source: 'VIETNAM_FCT_2007',
          matchedFctName: 'Dưa leo (Dưa chuột)',
        },
      ],
    },
  },
];

const CATEGORY_BADGES: Record<
  ScannedFoodItem['category'],
  { label: string; badgeClass: string; pinColor: string }
> = {
  PROTEIN: {
    label: '🥩 Nhóm Đạm (Protein)',
    badgeClass: 'bg-rose-50 text-rose-900 border-rose-200',
    pinColor: 'bg-rose-700 text-white border-rose-300',
  },
  VEGGIE_FRUIT: {
    label: '🥦 Rau Củ & Trái Cây',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    pinColor: 'bg-emerald-700 text-white border-emerald-300',
  },
  CARB: {
    label: '🍚 Tinh Bột (Carb)',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    pinColor: 'bg-amber-700 text-white border-amber-300',
  },
  HEALTHY_FAT: {
    label: '🥑 Chất Béo Tốt',
    badgeClass: 'bg-teal-50 text-teal-900 border-teal-200',
    pinColor: 'bg-teal-700 text-white border-teal-300',
  },
  SAUCE: {
    label: '🥣 Nước Sốt / Gia Vị',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-200',
    pinColor: 'bg-purple-700 text-white border-purple-300',
  },
};

export function FoodPlateScannerPanel({
  targetCalories,
  proteinGrams,
  breakfastKcal,
  lunchKcal,
  dinnerKcal,
  breakfastPro,
  lunchPro,
  dinnerPro,
}: FoodPlateScannerPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activePresetId, setActivePresetId] = useState<string>(SAMPLE_PRESETS[0].id);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>(SAMPLE_PRESETS[0].imageUrl);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [userHint, setUserHint] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const [showPinsOnImage, setShowPinsOnImage] = useState<boolean>(true);

  const [scanResult, setScanResult] = useState<FoodScanResponse>(SAMPLE_PRESETS[0].scanData);
  const [items, setItems] = useState<ScannedFoodItem[]>(SAMPLE_PRESETS[0].scanData.items);

  // Thêm nguyên liệu thủ công từ từ điển Viện Dinh Dưỡng
  const [selectedQuickSlug, setSelectedQuickSlug] = useState<string>('trung-ga');
  const [selectedQuickGrams, setSelectedQuickGrams] = useState<number>(60);

  // Chọn bữa ăn để đối chiếu & lưu vào Nhật ký (/nhat-ky)
  const [selectedMealSlot, setSelectedMealSlot] = useState<'LUNCH' | 'DINNER' | 'BREAKFAST'>('LUNCH');
  const [savingDiary, setSavingDiary] = useState<boolean>(false);
  const [diaryFeedback, setDiaryFeedback] = useState<{
    type: 'success' | 'auth' | 'error';
    message: string;
  } | null>(null);

  // Tính toán tổng Kcal, Đạm, Béo, Tinh bột, Chất xơ theo thời gian thực khi người dùng chỉnh gram
  const totals = useMemo(() => {
    let kcal = 0;
    let protein = 0;
    let fat = 0;
    let carbs = 0;
    let fiber = 0;
    let totalGrams = 0;

    for (const it of items) {
      const ratio = it.estimatedGrams / 100;
      kcal += it.calories100g * ratio;
      protein += it.protein100g * ratio;
      fat += it.fat100g * ratio;
      carbs += it.carbs100g * ratio;
      fiber += (it.fiber100g || 0) * ratio;
      totalGrams += it.estimatedGrams;
    }

    return {
      kcal: Math.round(kcal),
      protein: Math.round(protein * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      totalGrams: Math.round(totalGrams),
    };
  }, [items]);

  const targetSlotKcal =
    scanResult.mealFormat === 'DAILY_3_MEALS'
      ? targetCalories
      : selectedMealSlot === 'BREAKFAST'
      ? breakfastKcal
      : selectedMealSlot === 'DINNER'
      ? dinnerKcal
      : lunchKcal;

  const targetSlotPro =
    scanResult.mealFormat === 'DAILY_3_MEALS'
      ? proteinGrams
      : selectedMealSlot === 'BREAKFAST'
      ? breakfastPro
      : selectedMealSlot === 'DINNER'
      ? dinnerPro
      : lunchPro;

  const kcalPercentOfTarget =
    targetSlotKcal > 0 ? Math.round((totals.kcal / targetSlotKcal) * 100) : 100;

  function handleSelectPreset(preset: SamplePreset) {
    setActivePresetId(preset.id);
    setPreviewImageUrl(preset.imageUrl);
    setUploadedBase64(null);
    setScanResult(preset.scanData);
    setItems(preset.scanData.items.map((it) => ({ ...it })));
    setSelectedMealSlot(preset.defaultMealType);
    setDiaryFeedback(null);
  }

  function updateItemGrams(id: string, delta: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              estimatedGrams: Math.max(5, Math.min(1000, it.estimatedGrams + delta)),
            }
          : it
      )
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function handleAddQuickIngredient() {
    const fct = VIETNAMESE_STANDARD_FCT.find((f) => f.slug === selectedQuickSlug);
    if (!fct) return;

    const category: ScannedFoodItem['category'] =
      fct.slug === 'bo-sap' || fct.slug.includes('dau-o-liu') || fct.slug.includes('dau-me')
        ? 'HEALTHY_FAT'
        : fct.category === 'Thực phẩm tươi sống' || fct.category === 'Thủy hải sản'
        ? 'PROTEIN'
        : fct.slug.includes('com-') || fct.slug.includes('khoai-') || fct.slug === 'bap-ngot'
        ? 'CARB'
        : 'VEGGIE_FRUIT';

    const newItem: ScannedFoodItem = {
      id: `manual-${Date.now()}`,
      name: fct.name.split('(')[0].trim(),
      category,
      estimatedGrams: selectedQuickGrams,
      portionNote: `Bổ sung thêm (~${selectedQuickGrams}g)`,
      pinX: 50,
      pinY: 50,
      calories100g: fct.calories100g,
      protein100g: fct.protein100g,
      fat100g: fct.fat100g,
      carbs100g: fct.carbs100g,
      fiber100g: fct.fiber100g ?? 1.0,
      source: fct.source,
      matchedFctName: fct.name,
    };

    setItems((prev) => [...prev, newItem]);
  }

  async function compressImageFileToBase64(file: File): Promise<{ dataUrl: string; base64: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 960;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const base64 = dataUrl.split('base64,')[1] || '';
          resolve({ dataUrl, base64 });
        };
        img.onerror = reject;
        img.src = String(e.target?.result || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setActivePresetId('custom');
    setDiaryFeedback(null);
    setScanning(true);

    try {
      const { dataUrl, base64 } = await compressImageFileToBase64(file);
      setPreviewImageUrl(dataUrl);
      setUploadedBase64(base64);

      const res = await fetch('/api/ai/food-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: 'image/jpeg',
          userHint,
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
      console.error('Lỗi khi quét ảnh đĩa ăn:', err);
    } finally {
      setScanning(false);
    }
  }

  async function handleRescanWithHint() {
    setScanning(true);
    setDiaryFeedback(null);

    try {
      let base64ToSend = uploadedBase64;

      // Nếu đang chọn ảnh mẫu có sẵn và người dùng bấm Quét bằng AI thực tế
      if (!base64ToSend && previewImageUrl.startsWith('/')) {
        const imgResp = await fetch(previewImageUrl);
        const blob = await imgResp.blob();
        const file = new File([blob], 'sample.jpg', { type: 'image/jpeg' });
        const compressed = await compressImageFileToBase64(file);
        base64ToSend = compressed.base64;
      }

      const res = await fetch('/api/ai/food-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64ToSend || '',
          mimeType: 'image/jpeg',
          userHint,
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
      console.error('Lỗi khi quét lại:', err);
    } finally {
      setScanning(false);
    }
  }

  async function handleSaveScannedPlateToDiary() {
    setSavingDiary(true);
    setDiaryFeedback(null);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      const itemSummaryNames = items
        .slice(0, 4)
        .map((i) => `${i.name} (${i.estimatedGrams}g)`)
        .join(', ');

      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeName: `📸 ${scanResult.dishTitle} [${itemSummaryNames}]`,
          diaryDate: todayStr,
          mealType: selectedMealSlot,
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
        setDiaryFeedback({
          type: 'auth',
          message: 'Vui lòng đăng nhập tài khoản để lưu đĩa ăn đã quét vào Nhật ký dinh dưỡng hàng ngày.',
        });
        return;
      }

      if (res.ok) {
        setDiaryFeedback({
          type: 'success',
          message: `Đã lưu "${scanResult.dishTitle}" (${totals.kcal} kcal • ${totals.protein}g Đạm • ${totals.fiber}g Xơ) vào Nhật ký hôm nay!`,
        });
      } else {
        setDiaryFeedback({
          type: 'error',
          message: 'Không thể lưu vào Nhật ký lúc này, vui lòng thử lại.',
        });
      }
    } catch {
      setDiaryFeedback({
        type: 'error',
        message: 'Lỗi kết nối máy chủ khi lưu Nhật ký.',
      });
    } finally {
      setSavingDiary(false);
    }
  }

  return (
    <div className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 sm:p-6 shadow-xs space-y-6 animate-fade-in">
      {/* Header + Nút Chụp / Tải Ảnh */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>CÔNG NGHỆ AI VISION + TỪ ĐIỂN VIỆN DINH DƯỠNG VN (195+ NGUYÊN LIỆU)</span>
          </div>
          <h2 className="text-base sm:text-xl font-extrabold text-[var(--color-text-primary)]">
            📸 AI Quét Ảnh Đĩa Ăn — Bóc Tách Rau Củ, Thịt Cá &amp; Tính Kcal
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Chụp hoặc tải ảnh đĩa cơm / đĩa Eat Clean của bạn lên (hoặc bấm chọn <strong>4 mẫu đĩa thực tế</strong> bên dưới) để xác định từng thành phần và khối lượng Kcal:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="min-h-11 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>{scanning ? 'Đang phân tích ảnh...' : '📸 Chụp / Tải ảnh món ăn của bạn'}</span>
          </button>
        </div>
      </div>

      {/* Thanh chọn nhanh 4 Mẫu Đĩa Ăn Thực Tế (từ bộ ảnh Eat Clean / Gym / Yoga) */}
      <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E5DAC8] space-y-2.5 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-[#3F6240]">
            ✨ Hoặc bấm thử ngay với 4 mẫu đĩa ăn Eat Clean / Gym thực tế:
          </span>
          <span className="text-[11px] text-[#6B5A48]">
            (Bạn có thể chỉnh số gram từng loại rau củ/thịt cá sau khi quét)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                activePresetId === preset.id
                  ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)] shadow-2xs'
                  : 'bg-white text-[var(--color-text-primary)] border-[#DFD2C0] hover:border-[var(--color-brand-primary)]'
              }`}
            >
              <img
                src={preset.imageUrl}
                alt={preset.badge}
                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/40"
              />
              <div className="min-w-0">
                <p className="text-xs font-extrabold truncate">{preset.badge}</p>
                <p
                  className={`text-[10px] truncate ${
                    activePresetId === preset.id ? 'text-emerald-100' : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  {preset.scanData.items.length} thành phần đã bóc tách
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Ô ghi chú thêm cho AI nếu món có nước sốt đặc biệt */}
        <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={userHint}
            onChange={(e) => setUserHint(e.target.value)}
            placeholder="Nhập thêm mô tả nếu muốn AI lưu ý (VD: Đĩa của tôi có ức gà, bông cải, 2 quả trứng luộc, sốt mè rang...)"
            className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#D8C7B0] text-xs text-[var(--color-text-primary)] focus:outline-hidden focus:ring-2 focus:ring-[var(--color-brand-primary)]"
          />
          <button
            type="button"
            onClick={handleRescanWithHint}
            disabled={scanning}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-[var(--color-brand-primary)] border border-[var(--color-brand-border)] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Đang quét AI...' : 'Quét / Phân tích lại'}</span>
          </button>
        </div>
      </div>

      {/* Bố cục 2 Cột: Cột Trái (Ảnh Đĩa Ăn Gắn Nhãn Trực Quan) + Cột Phải (Bảng Bóc Tách Thành Phần & Chỉnh Gram) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (5/12): BẢN ĐỒ ĐĨA ĂN GẮN NHÃN THÔNG MINH */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border-2 border-[#DFD2C0] bg-stone-900 shadow-sm group">
            <img
              src={previewImageUrl}
              alt={scanResult.dishTitle}
              className={`w-full aspect-square object-cover transition-opacity duration-300 ${
                scanning ? 'opacity-40 blur-[1px]' : 'opacity-95'
              }`}
            />

            {/* Hiệu ứng đang quét AI */}
            {scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-6 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-sm font-extrabold">
                  AI Vision đang nhận diện từng loại rau củ, đạm &amp; tinh bột trên đĩa...
                </p>
                <p className="text-xs text-stone-200">
                  Đang đối chiếu với Bảng Thành Phần Thực Phẩm Việt Nam (VDD)
                </p>
              </div>
            )}

            {/* Các Nhãn Bong Bóng (Smart Pin Tags) gắn trực tiếp lên từng món trên đĩa */}
            {!scanning &&
              showPinsOnImage &&
              items.map((item, idx) => {
                const itemKcal = Math.round((item.calories100g * item.estimatedGrams) / 100);
                const catStyle =
                  CATEGORY_BADGES[item.category]?.pinColor || 'bg-stone-800 text-white border-stone-400';

                return (
                  <div
                    key={item.id}
                    style={{
                      left: `${Math.min(86, Math.max(14, item.pinX))}%`,
                      top: `${Math.min(88, Math.max(12, item.pinY))}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto"
                  >
                    <div
                      className={`px-2.5 py-1 rounded-full border shadow-md text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1.5 backdrop-blur-xs ${catStyle}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white/25 inline-flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="max-w-[125px] sm:max-w-[155px] truncate">{item.name}</span>
                      <span className="text-amber-200 font-black">• {itemKcal} kcal</span>
                    </div>
                  </div>
                );
              })}

            {/* Thanh điều khiển dưới chân ảnh */}
            <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-2 bg-black/70 backdrop-blur-xs text-white px-3 py-2 rounded-xl text-xs">
              <span className="font-bold truncate">
                🎯 Điểm cân bằng: <strong className="text-emerald-300">{scanResult.healthScore}/100</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowPinsOnImage((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
              >
                {showPinsOnImage ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ẩn nhãn</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Hiện nhãn</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Nhận xét của Chuyên gia Dinh dưỡng về Đĩa ăn */}
          <div className="p-4 rounded-2xl bg-[#F4F8F4] border border-[var(--color-brand-border)] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#2F4F30] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Đánh giá Đĩa Ăn so với Mục tiêu của bạn:</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-extrabold">
                {kcalPercentOfTarget}% định mức
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {scanResult.coachSummary}
            </p>
          </div>
        </div>

        {/* CỘT PHẢI (7/12): BẢNG BÓC TÁCH THÀNH PHẦN RAU CỦ / THỊT CÁ & TỔNG KCAL */}
        <div className="lg:col-span-7 space-y-4">
          {/* Thanh Tổng Kcal & 4 Chỉ Số Macro Của Đĩa Ăn */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF7F0] to-[#F3EFE6] border border-[#DFD2C0] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text-primary)]">
                  {scanResult.dishTitle}
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Tổng khối lượng ước tính trên đĩa: <strong>~{totals.totalGrams}g</strong> ({items.length} thành phần)
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D8C7B0] shrink-0">
                <Flame className="w-4 h-4 text-[var(--color-accent-primary)]" />
                <span className="text-lg font-black text-[var(--color-accent-primary)]">
                  {totals.kcal} kcal
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  / mục tiêu {targetSlotKcal} kcal
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white border border-rose-200">
                <span className="text-[11px] font-bold text-rose-900 block">🥩 Tổng Đạm (Protein)</span>
                <span className="text-base font-extrabold text-rose-700">{totals.protein}g</span>
                <span className="text-[10px] text-stone-500 block">Mục tiêu: ~{targetSlotPro}g</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 block">🍚 Tinh Bột (Carbs)</span>
                <span className="text-base font-extrabold text-amber-700">{totals.carbs}g</span>
                <span className="text-[10px] text-stone-500 block">Năng lượng chính</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-teal-200">
                <span className="text-[11px] font-bold text-teal-900 block">🥑 Chất Béo (Fat)</span>
                <span className="text-base font-extrabold text-teal-700">{totals.fat}g</span>
                <span className="text-[10px] text-stone-500 block">Ưu tiên béo thực vật</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-900 block">🥦 Chất Xơ (Fiber)</span>
                <span className="text-base font-extrabold text-emerald-700">{totals.fiber}g</span>
                <span className="text-[10px] text-stone-500 block">Từ rau củ &amp; hạt</span>
              </div>
            </div>
          </div>

          {/* Danh sách từng thành phần Rau củ / Thịt cá trên đĩa (Cho phép bấm +/- gram) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-extrabold text-[var(--color-text-primary)]">
                Chi tiết từng thành phần nhận diện trên đĩa (Bấm +/- để chỉnh số gram):
              </h4>
              <span className="text-[11px] font-semibold text-emerald-800">
                Tự động tính lại Kcal tức thì
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => {
                const ratio = item.estimatedGrams / 100;
                const itemKcal = Math.round(item.calories100g * ratio);
                const itemPro = Math.round(item.protein100g * ratio * 10) / 10;
                const itemCarb = Math.round(item.carbs100g * ratio * 10) / 10;
                const itemFat = Math.round(item.fat100g * ratio * 10) / 10;
                const itemFiber = Math.round((item.fiber100g || 0) * ratio * 10) / 10;
                const catMeta = CATEGORY_BADGES[item.category] || CATEGORY_BADGES.VEGGIE_FRUIT;

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[var(--color-bg-primary)]/70 border border-[var(--color-border-base)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[var(--color-brand-primary)] text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-[var(--color-text-primary)]">
                          {item.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catMeta.badgeClass}`}
                        >
                          {catMeta.label}
                        </span>
                        {item.source === 'VIETNAM_FCT_2007' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                            ✓ Chuẩn Viện Dinh Dưỡng
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[var(--color-text-secondary)]">
                        <span className="text-[var(--color-text-muted)]">{item.portionNote}</span> •{' '}
                        <strong className="text-[var(--color-accent-primary)]">{itemKcal} kcal</strong> • Đạm:{' '}
                        <strong>{itemPro}g</strong> • Carb: {itemCarb}g • Béo: {itemFat}g • Xơ: {itemFiber}g
                      </p>
                    </div>

                    {/* Cụm nút chỉnh số gram [- 15g] [85g] [+ 15g] */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center no-print">
                      <button
                        type="button"
                        onClick={() => updateItemGrams(item.id, -15)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 border border-[var(--color-border-base)] inline-flex items-center justify-center text-[var(--color-text-primary)] cursor-pointer"
                        title="Giảm 15g"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="min-w-[54px] text-center text-xs font-extrabold text-[var(--color-text-primary)] bg-white px-2 py-1 rounded-lg border border-[var(--color-border-base)]">
                        {item.estimatedGrams}g
                      </span>

                      <button
                        type="button"
                        onClick={() => updateItemGrams(item.id, 15)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 border border-[var(--color-border-base)] inline-flex items-center justify-center text-[var(--color-text-primary)] cursor-pointer"
                        title="Tăng 15g"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-red-50 border border-[var(--color-border-base)] hover:border-red-200 inline-flex items-center justify-center text-stone-400 hover:text-red-600 cursor-pointer ml-1"
                        title="Xóa thành phần này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Thanh cộng thêm nhanh nguyên liệu nếu đĩa ăn còn món ẩn (VD: Dầu ô liu, Trứng, Cơm gạo lứt...) */}
            <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#E5DAC8] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 no-print">
              <span className="text-xs font-bold text-[#3F6240] shrink-0">
                + Thêm thành phần khác trên đĩa:
              </span>
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <select
                  value={selectedQuickSlug}
                  onChange={(e) => setSelectedQuickSlug(e.target.value)}
                  aria-label="Chọn nguyên liệu bổ sung"
                  className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-xl bg-white border border-[#D8C7B0] text-xs font-semibold text-[var(--color-text-primary)]"
                >
                  {VIETNAMESE_STANDARD_FCT.map((ing) => (
                    <option key={ing.slug} value={ing.slug}>
                      {ing.name} ({ing.calories100g} kcal/100g)
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={5}
                  max={500}
                  step={10}
                  value={selectedQuickGrams}
                  onChange={(e) => setSelectedQuickGrams(Number(e.target.value) || 50)}
                  aria-label="Khối lượng gram bổ sung"
                  className="w-20 px-2.5 py-1.5 rounded-xl bg-white border border-[#D8C7B0] text-xs font-bold text-center"
                />
                <span className="text-xs text-[var(--color-text-muted)]">g</span>

                <button
                  type="button"
                  onClick={handleAddQuickIngredient}
                  className="px-3 py-1.5 rounded-xl bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  + Thêm vào đĩa
                </button>
              </div>
            </div>
          </div>

          {/* Khu vực Lưu Đĩa Ăn Đã Quét Vào Nhật Ký Hàng Ngày (/nhat-ky) */}
          <div className="p-4 rounded-2xl bg-[#F4F8F4] border border-[var(--color-brand-border)] space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#2F4F30]">Chọn bữa để lưu vào Nhật ký:</span>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#D5E2D5]">
                  {(
                    [
                      { key: 'BREAKFAST', label: '☀️ Sáng' },
                      { key: 'LUNCH', label: '🌤️ Trưa' },
                      { key: 'DINNER', label: '🌙 Tối' },
                    ] as const
                  ).map((slot) => (
                    <button
                      key={slot.key}
                      type="button"
                      onClick={() => setSelectedMealSlot(slot.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        selectedMealSlot === slot.key
                          ? 'bg-[var(--color-brand-primary)] text-white'
                          : 'text-[var(--color-text-secondary)] hover:bg-stone-100'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveScannedPlateToDiary}
                disabled={savingDiary || items.length === 0}
                className="min-h-10 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white text-xs sm:text-sm font-extrabold shadow-2xs transition-colors cursor-pointer"
              >
                <HeartPulse className="w-4 h-4" />
                <span>
                  {savingDiary
                    ? 'Đang lưu...'
                    : `📝 Ghi đĩa ăn này (${totals.kcal} kcal) vào Nhật Ký hôm nay`}
                </span>
              </button>
            </div>

            {diaryFeedback && (
              <div
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${
                  diaryFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : diaryFeedback.type === 'auth'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-red-50 border-red-300 text-red-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  {diaryFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <LogIn className="w-4 h-4 text-amber-700 shrink-0" />
                  )}
                  <span>{diaryFeedback.message}</span>
                </div>
                {diaryFeedback.type === 'success' ? (
                  <Link
                    href="/nhat-ky"
                    className="shrink-0 px-3 py-1 rounded-lg bg-[var(--color-brand-primary)] text-white text-xs font-bold"
                  >
                    Mở Nhật ký Bữa ăn →
                  </Link>
                ) : diaryFeedback.type === 'auth' ? (
                  <Link
                    href="/login?from=/tinh-calo"
                    className="shrink-0 px-3 py-1 rounded-lg bg-[var(--color-brand-primary)] text-white text-xs font-bold"
                  >
                    Đăng nhập ngay
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
