'use client';

import { useState, useCallback } from 'react';
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
} from 'lucide-react';
import type { AggregationResult } from '@/lib/recipes/aggregation';
import { useShoppingChecklist, generateShoppingPlainText } from '@/lib/shopping/shoppingClient';
import { mealQueryFromDishes } from '@/lib/meal/flowUrls';
import { estimateIngredientCostVnd, formatVndRounded1k, formatVndCurrency } from '@/lib/recipes/priceDictionary';
import { ShoppingProgressBar } from './ShoppingProgressBar';
import { ShoppingItemRow } from './ShoppingItemRow';

interface ShoppingViewProps {
  result: AggregationResult;
  dishes: { name: string; slug: string; role: string }[];
  servings: number;
}

export function ShoppingView({ result, dishes, servings }: ShoppingViewProps) {
  const { isChecked, toggleCheck, resetAll } = useShoppingChecklist();
  const [copied, setCopied] = useState(false);

  // Tính toán số lượng đã mua
  const allFreshKeys = result.freshItems.map((i) => i.key);
  const allSeasoningKeys = result.seasoningItems.map((s) => s.key);
  const allKeys = [...allFreshKeys, ...allSeasoningKeys];

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

  const handleNativeShare = useCallback(async () => {
    const dishNames = dishes.map((d) => d.name);
    const text = generateShoppingPlainText(result, dishNames);

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Danh sách đi chợ (${servings} người) — Ăn Gì Mom`,
          text,
        });
        return;
      } catch {
        // Nếu người dùng đóng hộp thoại share hoặc trình duyệt từ chối, fallback sang copy
      }
    }
    handleCopy();
  }, [result, dishes, servings, handleCopy]);

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
              onClick={handleNativeShare}
              className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-light)] hover:bg-[var(--color-accent-primary)] text-[var(--color-accent-text)] hover:text-white text-xs font-semibold transition-all shadow-xs"
              title="Chia sẻ nhanh danh sách đi chợ cho người nhà qua ứng dụng nhắn tin"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ người nhà</span>
            </button>

            <button
              type="button"
              onClick={resetAll}
              className="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-xs font-semibold text-[var(--color-text-muted)] transition-all shadow-xs"
              title="Đặt lại toàn bộ danh sách đã tick"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

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
                    onToggle={toggleCheck}
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
                    onToggle={toggleCheck}
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
                    onToggle={toggleCheck}
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
                    onToggle={toggleCheck}
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
                      onToggle={toggleCheck}
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
