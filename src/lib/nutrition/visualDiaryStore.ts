// Kho lưu trữ ảnh Nhật Ký Ăn Uống (Visual Food Diary), Chuỗi Streak & Điểm Đĩa Cân Bằng Harvard

export const VISUAL_DIARY_STORAGE_KEY = 'angimom_visual_diary_v1';
export const ACTIVE_DIARY_DATES_KEY = 'angimom_active_diary_dates_v1';

export interface VisualDiaryPhoto {
  id: string;
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  title: string;
  imageUrl: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export async function createCompactThumbnailDataUrl(
  imgSrc: string,
  maxDim = 280
): Promise<string | null> {
  if (!imgSrc || typeof window === 'undefined') return null;

  // Giữ nguyên đường dẫn cục bộ /uploads/ hoặc URL HTTPS ngắn để tránh lỗi CORS canvas và tiết kiệm quota
  if (imgSrc.startsWith('/uploads/') || (imgSrc.startsWith('https://') && imgSrc.length < 400)) {
    return imgSrc;
  }

  if (!imgSrc.startsWith('data:image/')) {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const largestSide = Math.max(img.width, img.height, 1);
        const scale = largestSide > maxDim ? maxDim / largestSide : 1;
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imgSrc;
  });
}

export function loadVisualDiaryPhotos(): VisualDiaryPhoto[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VISUAL_DIARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is VisualDiaryPhoto =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.date === 'string' &&
          typeof item.imageUrl === 'string'
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function persistVisualDiaryList(list: VisualDiaryPhoto[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VISUAL_DIARY_STORAGE_KEY, JSON.stringify(list.slice(0, 36)));
  } catch {
    try {
      localStorage.setItem(VISUAL_DIARY_STORAGE_KEY, JSON.stringify(list.slice(0, 18)));
    } catch {
      // Ignore quota exceeded
    }
  }
}

export function saveVisualDiaryPhoto(
  photo: Omit<VisualDiaryPhoto, 'id' | 'createdAt'>
): VisualDiaryPhoto[] {
  const entry: VisualDiaryPhoto = {
    ...photo,
    id: `${photo.date}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...loadVisualDiaryPhotos()].slice(0, 36);
  persistVisualDiaryList(next);
  markDiaryDateActive(photo.date);
  return next;
}

export function deleteVisualDiaryPhoto(id: string): VisualDiaryPhoto[] {
  const next = loadVisualDiaryPhotos().filter((item) => item.id !== id);
  persistVisualDiaryList(next);
  return next;
}

export function loadActiveDiaryDates(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACTIVE_DIARY_DATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed.filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
      )
    ).sort();
  } catch {
    return [];
  }
}

export function markDiaryDateActive(dateStr: string): string[] {
  if (typeof window === 'undefined' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return [];
  const current = loadActiveDiaryDates();
  if (current.includes(dateStr)) return current;
  const next = [...current, dateStr].sort().slice(-120);
  try {
    localStorage.setItem(ACTIVE_DIARY_DATES_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota errors
  }
  return next;
}

function shiftDateString(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().split('T')[0];
}

export function computeLoggingStreak(todayStr: string, datesInput?: string[]): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(todayStr)) return 0;
  const dateSet = new Set(datesInput ?? loadActiveDiaryDates());
  if (dateSet.size === 0) return 0;

  let cursor = dateSet.has(todayStr) ? todayStr : shiftDateString(todayStr, -1);
  if (!dateSet.has(cursor)) return 0;

  let streak = 0;
  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = shiftDateString(cursor, -1);
  }
  return streak;
}

export function computeHarvardPlateScore(
  summary: {
    totalCalories: number;
    totalProtein: number;
    totalFat: number;
    totalCarbs: number;
    totalFiber: number | null;
    totalSodium: number | null;
  },
  targetCalories: number,
  waterCups: number
): { score: number; gradeLabel: string; tips: string[] } {
  if (summary.totalCalories <= 0) {
    return {
      score: 0,
      gradeLabel: 'Chưa chấm điểm hôm nay',
      tips: ['Ghi bữa ăn đầu tiên để xem điểm Đĩa Cân Bằng Harvard hôm nay.'],
    };
  }

  let score = 0;
  const tips: string[] = [];

  // 1. Năng lượng bám sát mục tiêu (tối đa 30đ)
  const kcalRatio = summary.totalCalories / Math.max(1200, targetCalories);
  if (kcalRatio >= 0.85 && kcalRatio <= 1.1) {
    score += 30;
  } else if (kcalRatio >= 0.7 && kcalRatio <= 1.25) {
    score += 22;
  } else {
    score += 14;
    tips.push(
      kcalRatio > 1.25
        ? 'Năng lượng đang vượt mục tiêu >25% — bữa sau ưu tiên rau luộc & đạm nạc.'
        : 'Năng lượng hôm nay còn khá thấp — bổ sung thêm bữa phụ lành mạnh nếu đói.'
    );
  }

  // 2. Tỷ lệ Đạm tự nhiên (tối đa 25đ)
  const proKcal = summary.totalProtein * 4;
  const proShare = summary.totalCalories > 0 ? proKcal / summary.totalCalories : 0;
  if (proShare >= 0.18 && summary.totalProtein >= 55) {
    score += 25;
  } else if (proShare >= 0.14 || summary.totalProtein >= 40) {
    score += 18;
    tips.push('Đạm ở mức khá — thêm 100g ức gà, cá hoặc 1 quả trứng để chắc cơ no lâu.');
  } else {
    score += 10;
    tips.push('Thiếu đạm rõ rệt (<14% tổng Kcal) — dễ thèm ăn vặt ban đêm.');
  }

  // 3. Chất xơ / Rau củ (tối đa 20đ)
  if (summary.totalFiber === null) {
    score += 12;
  } else if (summary.totalFiber >= 22) {
    score += 20;
  } else if (summary.totalFiber >= 14) {
    score += 14;
    tips.push('Thêm 1 đĩa rau luộc hoặc dưa leo để đạt 25g chất xơ/ngày.');
  } else {
    score += 8;
    tips.push('Rau củ/chất xơ hôm nay còn ít (<14g) — cần bổ sung canh rau xanh.');
  }

  // 4. Kiểm soát Natri / Muối (tối đa 15đ)
  if (summary.totalSodium === null) {
    score += 11;
  } else if (summary.totalSodium <= 2000) {
    score += 15;
  } else if (summary.totalSodium <= 2500) {
    score += 10;
  } else {
    score += 4;
    tips.push('Lượng Natri cao (>2500mg) — hạn chế húp hết nước phở/canh mặn.');
  }

  // 5. Uống đủ nước (tối đa 10đ)
  if (waterCups >= 6) {
    score += 10;
  } else if (waterCups >= 3) {
    score += 6;
    tips.push('Uống thêm vài cốc nước lọc để đạt mốc chuẩn trong ngày.');
  } else {
    score += 2;
    tips.push('Nhớ uống đủ nước (hiện mới ghi dưới 3 cốc).');
  }

  const finalScore = Math.min(100, Math.max(0, score));
  let gradeLabel = 'Cần bổ sung rau/đạm & nước';
  if (finalScore >= 85) gradeLabel = 'Xuất sắc · Chuẩn Đĩa Harvard';
  else if (finalScore >= 70) gradeLabel = 'Rất cân bằng & lành mạnh';
  else if (finalScore >= 55) gradeLabel = 'Khá ổn · Cần tinh chỉnh nhẹ';

  return { score: finalScore, gradeLabel, tips: tips.slice(0, 2) };
}
