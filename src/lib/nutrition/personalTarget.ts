export interface PersonalNutritionTarget {
  // User input parameters
  gender: 'female' | 'male';
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number | '';
  bodyFatPct: number | '';
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose_standard' | 'lose_mild' | 'maintain' | 'gain_muscle';

  // Calculated clinical metrics
  bmi: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  dinnerKcal: number;
  rawMeatFishEquivalentGrams: number;
  whiteRiceBowlsPerDay: number;
  brownRiceBowlsPerDay: number;
  waterLiters: number;
  goalTitle: string;
  updatedAt: string;
}

const STORAGE_KEY = 'angimom.personalNutritionTarget.v1';

export function savePersonalNutritionTarget(target: PersonalNutritionTarget): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(target));
    window.dispatchEvent(new CustomEvent('angimom-target-updated', { detail: target }));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadPersonalNutritionTarget(): PersonalNutritionTarget | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersonalNutritionTarget;
    if (!parsed || typeof parsed.targetCalories !== 'number' || parsed.targetCalories < 800) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
