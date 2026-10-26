'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  ArrowRight,
  UtensilsCrossed,
  RefreshCw,
  Utensils,
  FolderPlus,
  Folder,
  Check,
  Trash2,
} from 'lucide-react';
import { useSavedRecipes, useRecipeCollections } from '@/lib/recipes/savedRecipesClient';
import type { PublicRecipeCard } from '@/lib/recipes/publicQueries';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { ROLE_LABELS } from '@/lib/recipes/labels';
import { buildMealQuery } from '@/lib/meal/flowUrls';

export default function SavedRecipesPage() {
  const { savedSlugs, isLoaded } = useSavedRecipes();
  const {
    collections,
    createCollection,
    deleteCollection,
    toggleRecipeInCollection,
    getRecipeCollections,
  } = useRecipeCollections();

  const [recipes, setRecipes] = useState<PublicRecipeCard[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [activeCollectionId, setActiveCollectionId] = useState<string>('ALL');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [openFolderMenuSlug, setOpenFolderMenuSlug] = useState<string | null>(null);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (savedSlugs.length === 0) {
      setRecipes([]);
      return;
    }

    let isMounted = true;
    setIsLoadingCards(true);
    setError(null);

    fetch('/api/saved-recipes/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: savedSlugs }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải danh sách món ăn đã lưu');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          const fetchedCards: PublicRecipeCard[] = data?.recipes || [];
          const cardMap = new Map(fetchedCards.map((c) => [c.slug, c]));
          const sorted = savedSlugs
            .map((slug) => cardMap.get(slug))
            .filter((c): c is PublicRecipeCard => Boolean(c));
          setRecipes(sorted);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError('Có lỗi xảy ra khi tải danh sách món đã lưu. Vui lòng thử lại.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingCards(false);
      });

    return () => {
      isMounted = false;
    };
  }, [savedSlugs, isLoaded]);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const id = createCollection(newFolderName.trim());
    if (id) {
      setActiveCollectionId(id);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-12">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--color-brand-primary)]/10 to-[var(--color-accent-primary)]/10 p-6 md:p-8 rounded-3xl border border-[var(--color-border-subtle)]">
        <div className="max-w-2xl flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-primary)] uppercase tracking-wider">
            <Bookmark className="w-4 h-4 fill-[var(--color-brand-primary)]" />
            <span>Bộ sưu tập của bạn</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
            Món ăn đã lưu & Thư mục bếp nhà
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Phân loại các công thức yêu thích vào từng thư mục riêng (Món bé thích, Nấu nhanh 15 phút, Mâm cơm tiết kiệm...) để tìm lại ngay khi cần vào bếp.
          </p>
        </div>
      </section>

      {/* Main Content */}
      {!isLoaded || isLoadingCards ? (
        <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-brand-primary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Đang tải danh sách món ăn đã lưu...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl text-center flex flex-col items-center gap-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--color-brand-primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Thử lại
          </button>
        </div>
      ) : recipes.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-3xl text-center flex flex-col items-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Chưa có món ăn nào được lưu
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
            Bạn chưa lưu món ăn nào. Khi xem công thức, hãy bấm nút biểu tượng Đánh dấu (Lưu món) để lưu lại công thức yêu thích và xem lại tại đây!
          </p>
          <Link
            href="/mon-an"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-primary)] text-white text-sm font-semibold rounded-2xl hover:opacity-95 transition-all shadow-xs"
          >
            <span>Khám phá món ăn ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* List Grid */
        <div className="flex flex-col gap-5">
          {(() => {
            const activeCollection = collections.find((c) => c.id === activeCollectionId);
            const byCollection =
              activeCollectionId === 'ALL' || !activeCollection
                ? recipes
                : recipes.filter((r) => activeCollection.slugs.includes(r.slug));

            const filteredRecipes =
              roleFilter === 'ALL'
                ? byCollection
                : roleFilter === 'LOW_CAL'
                ? byCollection.filter(
                    (r) =>
                      typeof r.caloriesPerServing === 'number' &&
                      r.caloriesPerServing > 0 &&
                      r.caloriesPerServing <= 350
                  )
                : byCollection.filter((r) => r.role === roleFilter);

            const firstMain = filteredRecipes.find((r) => r.role === 'MAIN')?.slug ?? null;
            const firstSoup = filteredRecipes.find((r) => r.role === 'SOUP')?.slug ?? null;
            const firstSide = filteredRecipes.find((r) => r.role === 'SIDE')?.slug ?? null;
            const firstSauce = filteredRecipes.find((r) => r.role === 'DIPPING_SAUCE')?.slug ?? null;
            const savedMealQuery = buildMealQuery({
              mainSlug: firstMain,
              soupSlug: firstSoup,
              sideSlug: firstSide,
              sauceSlug: firstSauce,
              servings: 4,
            });

            return (
              <>
                {/* Thanh Thư mục Bộ sưu tập (Collections Bar — Học từ Cookpad) */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-[var(--color-brand-primary)]" />
                      Thư mục bộ sưu tập cá nhân
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFolder((v) => !v)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>{isCreatingFolder ? 'Đóng' : '+ Tạo thư mục mới'}</span>
                    </button>
                  </div>

                  {isCreatingFolder && (
                    <form onSubmit={handleCreateFolder} className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Tên thư mục (VD: Món chay ngày rằm, Thực đơn giảm cân...)"
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[var(--color-border-base)] bg-[var(--color-bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--color-brand-primary)] text-white text-xs font-semibold hover:opacity-90"
                      >
                        Tạo thư mục
                      </button>
                    </form>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCollectionId('ALL')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        activeCollectionId === 'ALL'
                          ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                          : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <span>📚 Tất cả món đã lưu ({recipes.length})</span>
                    </button>

                    {collections.map((col) => {
                      const count = recipes.filter((r) => col.slugs.includes(r.slug)).length;
                      const isActive = activeCollectionId === col.id;
                      return (
                        <div key={col.id} className="inline-flex items-center">
                          <button
                            type="button"
                            onClick={() => setActiveCollectionId(col.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                              isActive
                                ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]'
                                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)]'
                            }`}
                          >
                            <span>{col.icon}</span>
                            <span>{col.name}</span>
                            <span className="opacity-80">({count})</span>
                          </button>
                          {col.isCustom && isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                deleteCollection(col.id);
                                setActiveCollectionId('ALL');
                              }}
                              title="Xóa thư mục này"
                              className="ml-1 p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bộ lọc vai trò món & Nút ghép mâm */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { key: 'ALL', label: `Tất cả (${byCollection.length})` },
                      { key: 'MAIN', label: ROLE_LABELS.MAIN ?? 'Món mặn' },
                      { key: 'SOUP', label: ROLE_LABELS.SOUP ?? 'Món canh' },
                      { key: 'SIDE', label: ROLE_LABELS.SIDE ?? 'Món rau / phụ' },
                      { key: 'LOW_CAL', label: 'Ít Calo (≤350 kcal)' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setRoleFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          roleFilter === tab.key
                            ? 'bg-[var(--color-brand-primary)] text-white'
                            : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {(firstMain || firstSoup || firstSide) && (
                      <Link
                        href={`/meal?${savedMealQuery}`}
                        className="min-h-10 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold transition-colors shadow-2xs"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Ghép mâm từ thư mục này</span>
                      </Link>
                    )}
                    <Link
                      href="/mon-an"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Tìm thêm món</span>
                    </Link>
                  </div>
                </div>

                {filteredRecipes.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-[var(--color-border-base)] text-center bg-[var(--color-surface-white)]">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Chưa có món ăn nào trong bộ lọc / thư mục này
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      Bấm nút &ldquo;📁 Xếp vào thư mục&rdquo; bên dưới mỗi thẻ món ăn để thêm món vào thư mục nhé!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecipes.map((recipe) => {
                      const assignedCols = getRecipeCollections(recipe.slug);
                      const isMenuOpen = openFolderMenuSlug === recipe.slug;

                      return (
                        <div key={recipe.slug} className="flex flex-col gap-2">
                          <RecipeCard recipe={recipe} />

                          {/* Thanh gắn thư mục nhanh dưới mỗi thẻ món */}
                          <div className="relative px-1 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1 min-w-0">
                              {assignedCols.length > 0 ? (
                                assignedCols.map((c) => (
                                  <span
                                    key={c.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)]"
                                  >
                                    <span>{c.icon}</span>
                                    <span className="truncate max-w-[110px]">{c.name}</span>
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-[var(--color-text-muted)]">
                                  Chưa phân vào thư mục
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setOpenFolderMenuSlug(isMenuOpen ? null : recipe.slug)
                              }
                              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--color-surface-white)] border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)] transition-colors"
                            >
                              <Folder className="w-3 h-3" />
                              <span>Xếp thư mục</span>
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 bottom-8 z-30 w-56 p-2 rounded-xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-lg space-y-1">
                                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                                  Chọn thư mục cho món này
                                </div>
                                {collections.map((col) => {
                                  const checked = col.slugs.includes(recipe.slug);
                                  return (
                                    <button
                                      key={col.id}
                                      type="button"
                                      onClick={() => toggleRecipeInCollection(col.id, recipe.slug)}
                                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--color-surface-raised)] text-left"
                                    >
                                      <span className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
                                        <span>{col.icon}</span>
                                        <span>{col.name}</span>
                                      </span>
                                      {checked && (
                                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
