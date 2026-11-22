'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
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

/** Mã hóa danh sách các món đã tick thành chuỗi chỉ mục gọn nhẹ để gửi URL cho người nhà. */
export function encodeCheckedIndices(allKeys: string[], checkedKeys: string[]): string {
  const checkedSet = new Set(checkedKeys);
  const indices: number[] = [];
  allKeys.forEach((key, idx) => {
    if (checkedSet.has(key)) indices.push(idx);
  });
  return indices.join(',');
}

/** Giải mã tham số ?checked=0,2,5 từ URL thành danh sách item key hợp lệ. */
export function decodeCheckedParam(rawParam: string | null, allKeys: string[]): string[] {
  if (!rawParam) return [];
  const keys: string[] = [];
  for (const part of rawParam.split(',')) {
    const idx = Number.parseInt(part.trim(), 10);
    if (Number.isInteger(idx) && idx >= 0 && idx < allKeys.length) {
      keys.push(allKeys[idx]);
    }
  }
  return keys;
}

function subscribeChecklist(onChange: () => void) {
  window.addEventListener(SHOPPING_EVENT_NAME, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(SHOPPING_EVENT_NAME, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function readRawChecklist(): string {
  try {
    return localStorage.getItem(SHOPPING_CHECKED_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

function parseChecklist(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

const noopSubscribe = () => () => {};

// R3: Đọc localStorage qua useSyncExternalStore thay vì setState trong effect
// (đúng khuyến nghị React 19, đồng bộ giữa các tab qua sự kiện 'storage').
export function useShoppingChecklist() {
  const raw = useSyncExternalStore(subscribeChecklist, readRawChecklist, () => null);
  const isLoaded = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const checkedKeys = useMemo(() => parseChecklist(raw), [raw]);

  const isChecked = useCallback(
    (key: string) => checkedKeys.includes(key),
    [checkedKeys]
  );

  const toggleCheck = useCallback(
    (key: string) => {
      const current = getLocalCheckedKeys();
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      saveLocalCheckedKeys(next);
    },
    []
  );

  const resetAll = useCallback(() => {
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

  // 3. Gia vị & đồ khô cần mua theo định lượng (R2: trước đây bị bỏ sót khỏi văn bản)
  if (result.categories.pantry.length > 0) {
    lines.push('🧄 GIA VỊ & ĐỒ KHÔ CẦN MUA:');
    result.categories.pantry.forEach((item) => {
      lines.push(`- ${item.name}: ${item.formattedTotal} ${item.unit}`);
    });
    lines.push('');
  }

  // 4. Khác
  if (result.categories.other.length > 0) {
    lines.push('📦 NGUYÊN LIỆU KHÁC:');
    result.categories.other.forEach((item) => {
      lines.push(`- ${item.name}: ${item.formattedTotal} ${item.unit}`);
    });
    lines.push('');
  }

  // 5. Gia vị bếp nhà
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
