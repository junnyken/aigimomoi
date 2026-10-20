'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, ArrowRight, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { useSavedRecipes } from '@/lib/recipes/savedRecipesClient';
import type { PublicRecipeCard } from '@/lib/recipes/publicQueries';
import { RecipeCard } from '@/components/recipe/RecipeCard';

export default function SavedRecipesPage() {
  const { savedSlugs, isLoaded } = useSavedRecipes();
  const [recipes, setRecipes] = useState<PublicRecipeCard[]>([]);
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
          // Lọc lại chỉ giữ các món đang nằm trong savedSlugs và giữ đúng thứ tự đã lưu
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
            Món ăn đã lưu
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Danh sách các công thức bạn đã đánh dấu để nấu cho gia đình. Khách vãng lai lưu trên thiết bị này; đăng nhập để đồng bộ an toàn qua mọi thiết bị.
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
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)] px-1">
            <span>
              Đang lưu <strong>{recipes.length}</strong> món ăn
            </span>
            <Link
              href="/mon-an"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)] hover:underline"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Tìm thêm món khác</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.slug} recipe={recipe} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
