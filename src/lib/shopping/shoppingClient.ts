'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AggregationResult } from '@/lib/recipes/aggregation';

const SHOPPING_CHECKED_KEY = 'angimom_shopping_checked_v1';
const SHOPPING_EVENT_NAME = 'angimom_shopping_checked_changed';

export function getLocalCheckedKeys(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SHOPPING_CHECKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCheckedKeys(keys: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHOPPING_CHECKED_KEY, JSON.stringify(keys));
    window.dispatchEvent(new Event(SHOPPING_EVENT_NAME));
  } catch {
    // Quota exceeded
  }
}

export function useShoppingChecklist() {
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCheckedKeys(getLocalCheckedKeys());
    setIsLoaded(true);

    function onStorage() {
      setCheckedKeys(getLocalCheckedKeys());
    }

    window.addEventListener(SHOPPING_EVENT_NAME, onStorage);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SHOPPING_EVENT_NAME, onStorage);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const isChecked = useCallback(
    (key: string) => checkedKeys.includes(key),
    [checkedKeys]
  );

  const toggleCheck = useCallback(
    (key: string) => {
      setCheckedKeys((prev) => {
        const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
        saveLocalCheckedKeys(next);
        return next;
      });
    },
    []
  );

  const resetAll = useCallback(() => {
    setCheckedKeys([]);
    saveLocalCheckedKeys([]);
  }, []);

  return {
    checkedKeys,
    isLoaded,
    isChecked,
    toggleCheck,
    resetAll,
  };
}

/**
 * Xuất danh sách đi chợ thành văn bản thuần túy để người dùng sao chép gửi qua Zalo / tin nhắn.
 */
export function generateShoppingPlainText(
  result: AggregationResult,
  dishNames: string[]
): string {
  const lines: string[] = [];

  lines.push('🛒 DANH SÁCH ĐI CHỢ — ĂN GÌ MOM');
  lines.push(`Khẩu phần: ${result.targetServings} người`);
  if (dishNames.length > 0) {
    lines.push(`Mâm cơm: ${dishNames.join(', ')}`);
  }
  lines.push('');

  // 1. Quầy thịt / cá / hải sản
  if (result.categories.meatSeafood.length > 0) {
    lines.push('🥩 THỊT & THỦY HẢI SẢN:');
    result.categories.meatSeafood.forEach((item) => {
      lines.push(`- ${item.name}: ${item.formattedTotal} ${item.unit}`);
    });
    lines.push('');
  }

  // 2. Quầy rau củ quả
  if (result.categories.produce.length > 0) {
    lines.push('🥦 RAU CỦ & NÔNG SẢN TƯƠI:');
    result.categories.produce.forEach((item) => {
      lines.push(`- ${item.name}: ${item.formattedTotal} ${item.unit}`);
    });
    lines.push('');
  }

  // 3. Khác
  if (result.categories.other.length > 0) {
    lines.push('📦 NGUYÊN LIỆU KHÁC:');
    result.categories.other.forEach((item) => {
      lines.push(`- ${item.name}: ${item.formattedTotal} ${item.unit}`);
    });
    lines.push('');
  }

  // 4. Gia vị bếp nhà
  if (result.seasoningItems.length > 0) {
    lines.push('🧂 GIA VỊ BẾP NHÀ (KIỂM TRA TRƯỚC KHI NẤU):');
    result.seasoningItems.forEach((item) => {
      lines.push(`- ${item.name}`);
    });
    lines.push('');
  }

  lines.push('---');
  lines.push('ĂN GÌ MOM — Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.');

  return lines.join('\n');
}
