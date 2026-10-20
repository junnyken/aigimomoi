'use client';

import { useState, useEffect, useCallback } from 'react';
import { clampServings } from '@/lib/recipes/scaling';

export const MEAL_STORAGE_KEY = 'angimom_current_meal';
export const MEAL_EVENT_NAME = 'angimom_meal_changed';

export interface StoredMealState {
  mainSlug: string;
  soupSlug: string;
  sideSlug: string;
  servings: number;
}

export function getStoredMeal(): StoredMealState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MEAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.mainSlug === 'string' &&
      typeof parsed?.soupSlug === 'string' &&
      typeof parsed?.sideSlug === 'string'
    ) {
      return {
        mainSlug: parsed.mainSlug,
        soupSlug: parsed.soupSlug,
        sideSlug: parsed.sideSlug,
        servings: clampServings(parsed.servings, 4),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveStoredMeal(state: StoredMealState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(MEAL_EVENT_NAME));
  } catch {
    // Quota exceeded
  }
}

export function useMealState(initial: StoredMealState) {
  const [meal, setMeal] = useState<StoredMealState>(initial);

  useEffect(() => {
    // Khi component mount, kiểm tra xem localStorage có state khác không
    const local = getStoredMeal();
    if (local) {
      // Ưu tiên param từ URL nếu có, nếu URL không có param riêng biệt thì lấy từ local
      setMeal((curr) => ({
        mainSlug: curr.mainSlug || local.mainSlug,
        soupSlug: curr.soupSlug || local.soupSlug,
        sideSlug: curr.sideSlug || local.sideSlug,
        servings: curr.servings || local.servings,
      }));
    }
  }, []);

  const swapDish = useCallback((role: 'MAIN' | 'SOUP' | 'SIDE', newSlug: string) => {
    setMeal((prev) => {
      const next: StoredMealState = {
        ...prev,
        mainSlug: role === 'MAIN' ? newSlug : prev.mainSlug,
        soupSlug: role === 'SOUP' ? newSlug : prev.soupSlug,
        sideSlug: role === 'SIDE' ? newSlug : prev.sideSlug,
      };
      saveStoredMeal(next);
      return next;
    });
  }, []);

  const updateServings = useCallback((servings: number) => {
    const safe = clampServings(servings, 4);
    setMeal((prev) => {
      const next: StoredMealState = { ...prev, servings: safe };
      saveStoredMeal(next);
      return next;
    });
  }, []);

  const replaceAll = useCallback((newMeal: StoredMealState) => {
    const safeMeal = { ...newMeal, servings: clampServings(newMeal.servings, 4) };
    setMeal(safeMeal);
    saveStoredMeal(safeMeal);
  }, []);

  return {
    meal,
    swapDish,
    updateServings,
    replaceAll,
  };
}
