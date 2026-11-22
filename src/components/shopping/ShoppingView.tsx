'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  RotateCcw,
  ArrowLeft,
  UtensilsCrossed,
  Sparkles,
  ChefHat,
  ShoppingBag,
  Share2,
  Wallet,
  Store,
  Refrigerator,
  CheckCircle2,
  LogIn,
  Link2,
  Radio,
  Plus,
  Trash2,
} from 'lucide-react';
import type { AggregationResult } from '@/lib/recipes/aggregation';
import type { SharedShoppingCustomItem } from '@/lib/db/schema';
import {
  useShoppingChecklist,
  generateShoppingPlainText,
  getLocalCheckedKeys,
  saveLocalCheckedKeys,
  encodeCheckedIndices,
  decodeCheckedParam,
} from '@/lib/shopping/shoppingClient';
import { mealQueryFromDishes } from '@/lib/meal/flowUrls';
import { estimateIngredientCostVnd, formatVndRounded1k, formatVndCurrency } from '@/lib/recipes/priceDictionary';
import { ShoppingProgressBar } from './ShoppingProgressBar';
import { ShoppingItemRow } from './ShoppingItemRow';

function normalizeVnIngredientName(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

function matchesPantryName(itemName: string, pantryNamesNormalized: string[]): boolean {
  const n = normalizeVnIngredientName(itemName);
  if (!n) return false;
  return pantryNamesNormalized.some((p) => {
    if (p === n) return true;
    if (p.length >= 3 && n.includes(p)) return true;
    if (n.length >= 3 && p.includes(n)) return true;
    return false;
  });
}

interface ShoppingViewProps {
  result: AggregationResult;
  dishes: { name: string; slug: string; role: string }[];
  servings: number;
  availablePantryNames?: string[];
  initialSessionToken?: string | null;
}

export function ShoppingView({
  result,
  dishes,
  servings,
  availablePantryNames = [],
  initialSessionToken = null,
}: ShoppingViewProps) {
  const { checkedKeys, isChecked, toggleCheck, resetAll } = useShoppingChecklist();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [syncingPantry, setSyncingPantry] = useState(false);
  const hydratedFromUrlRef = useRef(false);
  const [liveSessionToken, setLiveSessionToken] = useState<string | null>(initialSessionToken);
  const [creatingLiveSession, setCreatingLiveSession] = useState(false);
  const [liveExpiresAt, setLiveExpiresAt] = useState<string | null>(null);
  const [liveLastSyncedAt, setLiveLastSyncedAt] = useState<string | null>(null);
  const [liveStatusMsg, setLiveStatusMsg] = useState<string | null>(null);
  const [customItems, setCustomItems] = useState<SharedShoppingCustomItem[]>([]);
  const [newCustomItemName, setNewCustomItemName] = useState('');
  const [pantrySyncFeedback, setPantrySyncFeedback] = useState<{
    type: 'success' | 'auth' | 'error';
    message: string;
  } | null>(null);

  // Tính toán số lượng đã mua
  const allKeys = useMemo(
    () => [
      ...result.freshItems.map((i) => i.key),
      ...result.seasoningItems.map((s) => s.key),
    ],
    [result]
  );

  const pantryKeySet = useMemo(() => {
    const normalizedPantry = availablePantryNames
      .map(normalizeVnIngredientName)
      .filter(Boolean);
    if (normalizedPantry.length === 0) return new Set<string>();
    const matched = new Set<string>();
    for (const item of result.freshItems) {
      if (matchesPantryName(item.name, normalizedPantry)) matched.add(item.key);
    }
    for (const s of result.seasoningItems) {
      if (matchesPantryName(s.name, normalizedPantry)) matched.add(s.key);
    }
    return matched;
  }, [result, availablePantryNames]);

  const uncheckedPantryKeys = useMemo(
    () => Array.from(pantryKeySet).filter((k) => !isChecked(k)),
    [pantryKeySet, isChecked]
  );

  // Đồng bộ trạng thái đã tick từ link giỏ chung (?checked=0,2,5) khi người nhà mở link Zalo
  useEffect(() => {
    if (hydratedFromUrlRef.current || allKeys.length === 0 || typeof window === 'undefined') return;
    hydratedFromUrlRef.current = true;
    const rawChecked = new URLSearchParams(window.location.search).get('checked');
    const urlKeys = decodeCheckedParam(rawChecked, allKeys);
    if (urlKeys.length > 0) {
      const merged = Array.from(new Set([...getLocalCheckedKeys(), ...urlKeys]));
      saveLocalCheckedKeys(merged);
    }
  }, [allKeys]);

  // Polling giỏ đi chợ đồng bộ PostgreSQL 24h mỗi 5 giây
  useEffect(() => {
    if (!liveSessionToken) return;
    let active = true;

    const pullSession = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        const res = await fetch(`/api/shopping/sessions/${liveSessionToken}`);
        if (!active) return;
        if (res.status === 404) {
          setLiveStatusMsg('Link giỏ đi chợ đồng bộ đã hết hạn 24h hoặc không tồn tại.');
          setLiveSessionToken(null);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        if (Array.isArray(data.checkedKeys)) {
          const remoteKeys: string[] = data.checkedKeys;
          const localKeys = getLocalCheckedKeys();
          if (JSON.stringify(remoteKeys) !== JSON.stringify(localKeys)) {
            saveLocalCheckedKeys(remoteKeys);
          }
        }
        if (Array.isArray(data.customItems)) {
          setCustomItems(data.customItems);
        }
        if (typeof data.expiresAt === 'string') setLiveExpiresAt(data.expiresAt);
        if (typeof data.updatedAt === 'string') setLiveLastSyncedAt(data.updatedAt);
      } catch {
        // Ignore transient offline errors during polling
      }
    };

    pullSession();
    const timer = window.setInterval(pullSession, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [liveSessionToken]);

  const patchLiveSession = useCallback(
    async (
      token: string,
      nextCheckedKeys: string[],
      nextCustomItems: SharedShoppingCustomItem[]
    ) => {
      try {
        const res = await fetch(`/api/shopping/sessions/${token}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkedKeys: nextCheckedKeys,
            customItems: nextCustomItems,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.updatedAt === 'string') {
            setLiveLastSyncedAt(data.updatedAt);
          }
        }
      } catch {
        // Ignore transient sync error
      }
    },
    []
  );

  const handleToggleItem = useCallback(
    (key: string) => {
      toggleCheck(key);
      if (liveSessionToken) {
        const nextKeys = getLocalCheckedKeys();
        patchLiveSession(liveSessionToken, nextKeys, customItems);
      }
    },
    [toggleCheck, liveSessionToken, customItems, patchLiveSession]
  );

  const handleResetAll = useCallback(() => {
    resetAll();
    if (liveSessionToken) {
      patchLiveSession(liveSessionToken, [], customItems);
    }
  }, [resetAll, liveSessionToken, customItems, patchLiveSession]);

  const handleDeductFromPantry = useCallback(() => {
    if (uncheckedPantryKeys.length === 0) return;
    const merged = Array.from(new Set([...getLocalCheckedKeys(), ...uncheckedPantryKeys]));
    saveLocalCheckedKeys(merged);
    if (liveSessionToken) {
      patchLiveSession(liveSessionToken, merged, customItems);
    }
  }, [uncheckedPantryKeys, liveSessionToken, customItems, patchLiveSession]);

  const handleAddCustomItem = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newCustomItemName.trim();
      if (!trimmed) return;
      const nextCustom: SharedShoppingCustomItem[] = [
        ...customItems,
        {
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: trimmed.slice(0, 100),
          checked: false,
        },
      ].slice(0, 30);
      setCustomItems(nextCustom);
      setNewCustomItemName('');
      if (liveSessionToken) {
        patchLiveSession(liveSessionToken, checkedKeys, nextCustom);
      }
    },
    [newCustomItemName, customItems, liveSessionToken, checkedKeys, patchLiveSession]
  );

  const handleToggleCustomItem = useCallback(
    (id: string) => {
      const nextCustom = customItems.map((c) =>
        c.id === id ? { ...c, checked: !c.checked } : c
      );
      setCustomItems(nextCustom);
      if (liveSessionToken) {
        patchLiveSession(liveSessionToken, checkedKeys, nextCustom);
      }
    },
    [customItems, liveSessionToken, checkedKeys, patchLiveSession]
  );

  const handleDeleteCustomItem = useCallback(
    (id: string) => {
      const nextCustom = customItems.filter((c) => c.id !== id);
      setCustomItems(nextCustom);
      if (liveSessionToken) {
        patchLiveSession(liveSessionToken, checkedKeys, nextCustom);
      }
    },
    [customItems, liveSessionToken, checkedKeys, patchLiveSession]
  );

  const totalItemsCount = allKeys.length;
  const checkedItemsCount = allKeys.filter((k) => isChecked(k)).length;

  // Dự toán ngân sách giỏ đi chợ theo chuẩn đơn giá Bách Hóa Xanh & Chợ
  let totalMarketVnd = 0;
  let remainingToBuyVnd = 0;
  for (const item of result.freshItems) {
    const c = estimateIngredientCostVnd(item.name, item.totalAmount, item.unit);
    totalMarketVnd += c.usedCostVnd;
    if (!isChecked(item.key)) {
      remainingToBuyVnd += c.usedCostVnd;
    }
  }
  const perPersonVnd = Math.max(2000, Math.round(totalMarketVnd / Math.max(1, servings) / 500) * 500);

  const buildShareUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const baseQuery = mealQueryFromDishes(dishes, servings);
    if (liveSessionToken) {
      return `${window.location.origin}/shopping?${baseQuery}&session=${encodeURIComponent(
        liveSessionToken
      )}`;
    }
    const encoded = encodeCheckedIndices(allKeys, checkedKeys);
    return `${window.location.origin}/shopping?${baseQuery}${
      encoded ? `&checked=${encodeURIComponent(encoded)}` : ''
    }`;
  }, [dishes, servings, allKeys, checkedKeys, liveSessionToken]);

  const handleCreateLiveSession = useCallback(async () => {
    if (liveSessionToken) {
      const liveUrl = buildShareUrl();
      if (liveUrl && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(liveUrl).catch(() => {});
        setLiveStatusMsg('Đã sao chép lại link Giỏ Đồng Bộ 24h!');
      }
      return;
    }

    setCreatingLiveSession(true);
    setLiveStatusMsg(null);
    try {
      const baseQuery = mealQueryFromDishes(dishes, servings);
      const res = await fetch('/api/shopping/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealQuery: baseQuery,
          servings,
          checkedKeys,
          customItems,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setLiveStatusMsg(errData.error || 'Không thể tạo giỏ đồng bộ thời gian thực lúc này.');
        return;
      }
      const data = await res.json();
      setLiveSessionToken(data.token);
      setLiveExpiresAt(data.expiresAt);
      setLiveLastSyncedAt(data.updatedAt);

      if (typeof window !== 'undefined') {
        const nextRelative = `/shopping?${baseQuery}&session=${encodeURIComponent(data.token)}`;
        window.history.replaceState(null, '', nextRelative);
        const fullUrl = `${window.location.origin}${nextRelative}`;
        await navigator.clipboard?.writeText(fullUrl).catch(() => {});
      }
      setLiveStatusMsg(
        'Đã tạo & sao chép link Giỏ Đi Chợ Đồng Bộ 24h! Người nhà mở link tick món sẽ tự đồng bộ mỗi 5 giây.'
      );
    } catch {
      setLiveStatusMsg('Lỗi kết nối khi tạo giỏ đi chợ đồng bộ 24h.');
    } finally {
      setCreatingLiveSession(false);
    }
  }, [liveSessionToken, buildShareUrl, dishes, servings, checkedKeys, customItems]);

  const handleCopy = useCallback(() => {
    const dishNames = dishes.map((d) => d.name);
    const text = generateShoppingPlainText(result, dishNames);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  }, [result, dishes]);

  const handleCopyShareLink = useCallback(() => {
    const shareUrl = buildShareUrl();
    if (!shareUrl || !navigator?.clipboard?.writeText) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  }, [buildShareUrl]);

  const handleNativeShare = useCallback(async () => {
    const dishNames = dishes.map((d) => d.name);
    const shareUrl = buildShareUrl();
    const text = `${generateShoppingPlainText(result, dishNames)}\n\n🔗 Giỏ đi chợ chung (đã tick ${checkedItemsCount}/${totalItemsCount}): ${shareUrl}`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Danh sách đi chợ (${servings} người) — Ăn Gì Mom`,
          text,
          url: shareUrl || undefined,
        });
        return;
      } catch {
        // Nếu người dùng đóng hộp thoại share hoặc trình duyệt từ chối, fallback sang copy
      }
    }
    handleCopy();
  }, [result, dishes, servings, checkedItemsCount, totalItemsCount, buildShareUrl, handleCopy]);

  const handleSyncToPantry = useCallback(async () => {
    const checkedFresh = result.freshItems
      .filter((i) => isChecked(i.key))
      .map((i) => ({
        name: i.name,
        quantity: i.totalAmount || 1,
        unit: i.unit || 'g',
        category: i.category === 'MEAT_SEAFOOD' ? 'Thực phẩm tươi sống' : i.category === 'PRODUCE' ? 'Rau củ quả' : 'Đồ khô',
      }));

    const checkedSeasonings = result.seasoningItems
      .filter((s) => isChecked(s.key))
      .map((s) => ({
        name: s.name,
        quantity: 1,
        unit: s.unit || 'gói',
        category: 'Gia vị nêm nếm',
      }));

    const payloadItems = [...checkedFresh, ...checkedSeasonings];
    if (payloadItems.length === 0) return;

    setSyncingPantry(true);
    setPantrySyncFeedback(null);
    try {
      const res = await fetch('/api/pantry/sync-from-shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems }),
      });

      if (res.status === 401) {
        setPantrySyncFeedback({
          type: 'auth',
          message: 'Hãy đăng nhập để lưu tự động các món vừa mua vào Tủ lạnh gia đình của bạn.',
        });
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPantrySyncFeedback({
          type: 'success',
          message:
            data.message ||
            `Đã cất thành công ${payloadItems.length} nguyên liệu vào Tủ lạnh của bạn!`,
        });
      } else {
        setPantrySyncFeedback({
          type: 'error',
          message: data.error || 'Không thể đồng bộ nguyên liệu vào Tủ lạnh lúc này.',
        });
      }
    } catch {
      setPantrySyncFeedback({
        type: 'error',
        message: 'Lỗi kết nối máy chủ khi đồng bộ Tủ lạnh.',
      });
    } finally {
      setSyncingPantry(false);
    }
  }, [result.freshItems, result.seasoningItems, isChecked]);

  return (
    <div className="w-full flex flex-col gap-6 pb-16">
      {/* Top Banner & Controls */}
      <section className="bg-gradient-to-r from-[var(--color-brand-primary)]/10 via-[var(--color-accent-primary)]/10 to-[var(--color-surface-raised)] p-6 md:p-8 rounded-3xl border border-[var(--color-border-subtle)] flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-primary)] uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" />
              <span>Đi chợ thông minh một lần duy nhất</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              Danh sách đi chợ
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Nguyên liệu đã gộp sẵn cho mâm cơm{' '}
              <strong className="text-[var(--color-brand-primary)]">{servings} người</strong> ăn.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/meal?${mealQueryFromDishes(dishes, servings)}`}
              className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] hover:bg-[var(--color-surface-raised)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Đổi món / khẩu phần</span>
            </Link>

            <button
              type="button"
              onClick={handleCopy}
              className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-light)] hover:bg-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:text-white text-xs font-semibold transition-all shadow-xs"
              title="Sao chép danh sách dạng văn bản để gửi qua Zalo/tin nhắn"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép gửi Zalo'}</span>
            </button>

            <button
              type="button"
              onClick={handleCreateLiveSession}
              disabled={creatingLiveSession}
              className={`min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                liveSessionToken
                  ? 'border-emerald-500 bg-emerald-600 text-white'
                  : 'border-emerald-400 bg-emerald-50 hover:bg-emerald-600 text-emerald-900 hover:text-white'
              }`}
              title="Khởi tạo giỏ đi chợ đồng bộ PostgreSQL 24h cho hai vợ chồng tick cùng lúc"
            >
              <Radio className={`w-3.5 h-3.5 ${liveSessionToken ? 'animate-pulse' : ''}`} />
              <span>
                {creatingLiveSession
                  ? 'Đang tạo giỏ Live...'
                  : liveSessionToken
                  ? '🟢 Đang đồng bộ 24h (Copy link)'
                  : '🟢 Tạo giỏ đồng bộ 24h'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-600 text-indigo-800 hover:text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Sao chép đường dẫn giỏ đi chợ giữ nguyên các món bạn đã tick mua để vợ/chồng mở xem chung"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Link2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Đã copy link giỏ chung!' : 'Copy link giỏ chung'}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-light)] hover:bg-[var(--color-accent-primary)] text-[var(--color-accent-text)] hover:text-white text-xs font-semibold transition-all shadow-xs"
              title="Chia sẻ nhanh danh sách đi chợ cho người nhà qua ứng dụng nhắn tin"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ người nhà</span>
            </button>

            <button
              type="button"
              onClick={handleSyncToPantry}
              disabled={syncingPantry || checkedItemsCount === 0}
              className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-500/30 bg-teal-50 hover:bg-teal-600 text-teal-800 hover:text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
              title="Đưa toàn bộ nguyên liệu bạn đã tick mua xong vào kho Tủ lạnh cá nhân"
            >
              <Refrigerator className="w-3.5 h-3.5" />
              <span>
                {syncingPantry
                  ? 'Đang cất vào tủ...'
                  : `🧊 Cất món đã mua vào Tủ lạnh (${checkedItemsCount})`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleResetAll}
              className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-xs font-semibold text-[var(--color-text-muted)] transition-all shadow-xs"
              title="Đặt lại toàn bộ danh sách đã tick"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

        {(liveStatusMsg || liveSessionToken) && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <Radio className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
              <span>
                {liveStatusMsg ||
                  'Phiên giỏ đi chợ đồng bộ thời gian thực (tự làm mới mỗi 5 giây) đang hoạt động.'}
              </span>
            </div>
            {(liveLastSyncedAt || liveExpiresAt) && (
              <span className="text-[11px] text-emerald-800 shrink-0">
                {liveLastSyncedAt
                  ? `Cập nhật: ${new Date(liveLastSyncedAt).toLocaleTimeString('vi-VN')}`
                  : ''}
                {liveExpiresAt
                  ? ` • Hết hạn: ${new Date(liveExpiresAt).toLocaleTimeString('vi-VN')}`
                  : ''}
              </span>
            )}
          </div>
        )}

        {pantrySyncFeedback && (
          <div
            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${
              pantrySyncFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : pantrySyncFeedback.type === 'auth'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-red-50 border-red-300 text-red-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {pantrySyncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <LogIn className="w-4 h-4 text-amber-700 shrink-0" />
              )}
              <span>{pantrySyncFeedback.message}</span>
            </div>
            {pantrySyncFeedback.type === 'success' && (
              <Link
                href="/tu-lanh"
                className="shrink-0 px-3 py-1.5 rounded-xl bg-[var(--color-brand-primary)] text-white text-xs font-bold"
              >
                Mở Tủ lạnh gia đình →
              </Link>
            )}
            {pantrySyncFeedback.type === 'auth' && (
              <Link
                href="/login?next=/shopping"
                className="shrink-0 px-3 py-1.5 rounded-xl bg-[var(--color-brand-primary)] text-white text-xs font-bold"
              >
                Đăng nhập ngay →
              </Link>
            )}
          </div>
        )}

        {/* Dishes Chips */}
        {dishes.length > 0 && (
          <div className="pt-2 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Món ăn trong mâm:</span>
            {dishes.map((d) => (
              <span
                key={d.slug}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface-white)] border border-[var(--color-border-base)] text-[var(--color-text-primary)] shadow-2xs"
              >
                <UtensilsCrossed className="w-3 h-3 text-[var(--color-brand-primary)]" />
                {d.name}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Progress Bar */}
      <ShoppingProgressBar total={totalItemsCount} checkedCount={checkedItemsCount} />

      {/* Tự động phát hiện & trừ đồ có sẵn trong Tủ lạnh */}
      {uncheckedPantryKeys.length > 0 && (
        <div className="rounded-3xl border border-teal-300 bg-teal-50/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Refrigerator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-teal-950">
                Phát hiện {uncheckedPantryKeys.length} nguyên liệu đã có sẵn trong Tủ lạnh nhà bạn
              </h2>
              <p className="text-xs text-teal-800 mt-0.5">
                Hệ thống đối chiếu từ danh sách còn hạn ở /tu-lanh. Bấm để tick trừ tự động khỏi chi phí đi chợ hôm nay.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDeductFromPantry}
            className="shrink-0 min-h-10 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold cursor-pointer shadow-xs"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Trừ tự động ({uncheckedPantryKeys.length} món)</span>
          </button>
        </div>
      )}

      {/* Bảng Dự toán Ngân sách Giỏ Đi Chợ Hôm Nay (Tham khảo Bách Hóa Xanh & Chợ) */}
      {totalMarketVnd > 0 && (
        <section
          aria-label="Dự toán chi phí đi chợ hôm nay"
          className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-sm sm:text-base font-bold text-emerald-950">
                  Dự toán tiền đi chợ hôm nay
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Store className="w-3 h-3" />
                  Tham chiếu giá Bách Hóa Xanh & Chợ
                </span>
              </div>
              <p className="text-xs text-emerald-800/90 mt-0.5">
                Tick vào các nguyên liệu đã có sẵn trong tủ lạnh để biết chính xác số tiền cần cầm đi chợ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200/60 text-right">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-medium text-emerald-700">Tổng cả mâm</span>
              <strong className="text-sm sm:text-base font-bold text-emerald-950">
                ~{formatVndRounded1k(totalMarketVnd)}
              </strong>
              <span className="text-[10px] text-emerald-700">~{formatVndCurrency(perPersonVnd)}/người</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-medium text-emerald-700">Đã có / Đã mua</span>
              <strong className="text-sm sm:text-base font-bold text-teal-700">
                {totalMarketVnd - remainingToBuyVnd > 0
                  ? `~${formatVndRounded1k(totalMarketVnd - remainingToBuyVnd)}`
                  : '0đ'}
              </strong>
              <span className="text-[10px] text-emerald-700">{checkedItemsCount}/{totalItemsCount} mục</span>
            </div>
            <div className="flex flex-col items-end bg-emerald-600 text-white px-3 py-1.5 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-90">Cần mua thêm</span>
              <strong className="text-sm sm:text-base font-extrabold">
                {remainingToBuyVnd > 0 ? `~${formatVndRounded1k(remainingToBuyVnd)}` : '0đ'}
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* Empty State nếu không có nguyên liệu nào */}
      {totalItemsCount === 0 ? (
        <div className="py-16 px-4 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-3xl text-center flex flex-col items-center max-w-md mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Chưa có nguyên liệu nào
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
            Hãy quay lại trang Mâm cơm để chọn 3 món ăn ngon cho bữa cơm gia đình!
          </p>
          <Link
            href="/meal"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-primary)] text-white text-sm font-semibold rounded-2xl hover:opacity-95 transition-all shadow-xs"
          >
            <ChefHat className="w-4 h-4" />
            <span>Ghép mâm cơm ngay</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* 1. Quầy Thịt & Thủy Hải Sản */}
          {result.categories.meatSeafood.length > 0 && (
            <section aria-labelledby="heading-meat-seafood" className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h2 id="heading-meat-seafood" className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <span>🥩</span>
                  <span>Thịt, cá & thủy hải sản</span>
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  {result.categories.meatSeafood.length} món
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.categories.meatSeafood.map((item) => (
                  <ShoppingItemRow
                    key={item.key}
                    itemKey={item.key}
                    name={item.name}
                    totalAmount={item.totalAmount}
                    formattedAmount={item.formattedTotal}
                    unit={item.unit}
                    isChecked={isChecked(item.key)}
                    onToggle={handleToggleItem}
                    inPantry={pantryKeySet.has(item.key)}
                    traces={item.traces}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 2. Quầy Rau Củ & Nông Sản Tươi */}
          {result.categories.produce.length > 0 && (
            <section aria-labelledby="heading-produce" className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h2 id="heading-produce" className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <span>🥦</span>
                  <span>Rau củ quả & nông sản tươi</span>
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {result.categories.produce.length} món
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.categories.produce.map((item) => (
                  <ShoppingItemRow
                    key={item.key}
                    itemKey={item.key}
                    name={item.name}
                    totalAmount={item.totalAmount}
                    formattedAmount={item.formattedTotal}
                    unit={item.unit}
                    isChecked={isChecked(item.key)}
                    onToggle={handleToggleItem}
                    inPantry={pantryKeySet.has(item.key)}
                    traces={item.traces}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 3. Gia vị & đồ khô cần mua (R2: trước đây không được render) */}
          {result.categories.pantry.length > 0 && (
            <section aria-labelledby="heading-pantry" className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h2 id="heading-pantry" className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <span>🧄</span>
                  <span>Gia vị &amp; đồ khô cần mua</span>
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {result.categories.pantry.length} món
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.categories.pantry.map((item) => (
                  <ShoppingItemRow
                    key={item.key}
                    itemKey={item.key}
                    name={item.name}
                    totalAmount={item.totalAmount}
                    formattedAmount={item.formattedTotal}
                    unit={item.unit}
                    isChecked={isChecked(item.key)}
                    onToggle={handleToggleItem}
                    inPantry={pantryKeySet.has(item.key)}
                    traces={item.traces}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 4. Nguyên Liệu Khác (Đậu hũ, trứng...) */}
          {result.categories.other.length > 0 && (
            <section aria-labelledby="heading-other" className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h2 id="heading-other" className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <span>📦</span>
                  <span>Nguyên liệu tươi khác</span>
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {result.categories.other.length} món
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.categories.other.map((item) => (
                  <ShoppingItemRow
                    key={item.key}
                    itemKey={item.key}
                    name={item.name}
                    totalAmount={item.totalAmount}
                    formattedAmount={item.formattedTotal}
                    unit={item.unit}
                    isChecked={isChecked(item.key)}
                    onToggle={handleToggleItem}
                    inPantry={pantryKeySet.has(item.key)}
                    traces={item.traces}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 4. Gia Vị Bếp Nhà (Pantry Check) */}
          {result.seasoningItems.length > 0 && (
            <section aria-labelledby="heading-seasonings" className="flex flex-col gap-3 pt-2">
              <div className="bg-[var(--color-surface-raised)]/60 border border-[var(--color-border-subtle)] rounded-3xl p-5 md:p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <h2 id="heading-seasonings" className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                      <span>🧂</span>
                      <span>Gia vị & đồ khô bếp nhà</span>
                    </h2>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Kiểm tra nhanh kệ bếp nhà xem còn hay hết trước khi nấu.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-surface-white)] border border-[var(--color-border-base)] text-[var(--color-text-secondary)]">
                    {result.seasoningItems.length} loại
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {result.seasoningItems.map((s) => (
                    <ShoppingItemRow
                      key={s.key}
                      itemKey={s.key}
                      name={s.name}
                      isChecked={isChecked(s.key)}
                      onToggle={handleToggleItem}
                      inPantry={pantryKeySet.has(s.key)}
                      traces={s.traces.map((t) => ({
                        recipeName: t.recipeName,
                        recipeSlug: t.recipeSlug,
                        scaledAmount: t.amount,
                        baseAmount: t.amount,
                        unit: t.unit,
                        preparation: t.preparation,
                      }))}
                      isSeasoning={true}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 5. Đồ Mua Thêm Ngoài Mâm (Đồng bộ trực tiếp với người đang ở siêu thị) */}
          <section
            aria-labelledby="heading-extra-shopping"
            className="rounded-3xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] p-5 md:p-6 space-y-3.5 shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2
                  id="heading-extra-shopping"
                  className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2"
                >
                  <span>🛍️ Đồ mua thêm ngoài mâm</span>
                  {liveSessionToken && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Đồng bộ Live
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Thêm nhanh sữa, trái cây, giấy ăn hoặc đồ lặt vặt — tự động đồng bộ qua link 24h cho vợ/chồng cùng xem.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddCustomItem} className="flex gap-2">
              <input
                type="text"
                maxLength={100}
                value={newCustomItemName}
                onChange={(e) => setNewCustomItemName(e.target.value)}
                placeholder="VD: 1 lốc sữa tươi ít đường, dưa hấu 1kg, giấy ăn..."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
              />
              <button
                type="submit"
                disabled={!newCustomItemName.trim()}
                className="px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-white text-xs font-extrabold inline-flex items-center gap-1.5 hover:opacity-95 disabled:opacity-45 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm vào giỏ</span>
              </button>
            </form>

            {customItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {customItems.map((extra) => (
                  <div
                    key={extra.id}
                    className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                      extra.checked
                        ? 'bg-[var(--color-surface-raised)]/60 border-[var(--color-border-subtle)] opacity-75'
                        : 'bg-[var(--color-surface-subtle)] border-[var(--color-border-base)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCustomItem(extra.id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                          extra.checked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-[var(--color-border-base)]'
                        }`}
                      >
                        {extra.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          extra.checked
                            ? 'line-through text-[var(--color-text-muted)]'
                            : 'text-[var(--color-text-primary)]'
                        }`}
                      >
                        {extra.name}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomItem(extra.id)}
                      aria-label={`Xóa ${extra.name}`}
                      className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ready to Cook CTA */}
          <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-[var(--color-brand-primary)]/10 to-[var(--color-accent-primary)]/10 border border-[var(--color-border-subtle)] rounded-3xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-primary)] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Đã sắm đủ nguyên liệu?
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Quay lại mâm cơm để bắt đầu nấu từng bước cho gia đình.
                </p>
              </div>
            </div>

            <Link
              href={`/meal?${mealQueryFromDishes(dishes, servings)}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[var(--color-brand-primary)] text-white font-bold text-sm shadow-xs hover:opacity-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Vào bếp nấu mâm cơm này</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
