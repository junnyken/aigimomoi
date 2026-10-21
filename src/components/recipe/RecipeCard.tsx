import Link from 'next/link';
import { Clock, Users, ChefHat, UtensilsCrossed, Store, Flame } from 'lucide-react';
import type { PublicRecipeCard } from '@/lib/recipes/publicQueries';
import { ROLE_LABELS, formatDuration, recipePath, isIllustrationImage } from '@/lib/recipes/labels';
import { formatPriceVND } from '@/lib/gating/pricing';
import { BookmarkButton } from './BookmarkButton';

export function RecipeCard({ recipe }: { recipe: PublicRecipeCard }) {
  const isIllustration = recipe.isIllustration ?? isIllustrationImage(recipe.heroImage);
  const hasCalorieData =
    typeof recipe.caloriesPerServing === 'number' &&
    recipe.caloriesPerServing > 0 &&
    recipe.nutritionStatus !== 'NO_DATA';

  return (
    <article className="group relative bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all hover:-translate-y-1 flex flex-col focus-within:ring-2 focus-within:ring-[var(--color-brand-primary)]">
      <div className="relative w-full h-48 bg-[var(--color-surface-raised)] overflow-hidden">
        {recipe.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.heroImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
            <UtensilsCrossed className="w-10 h-10" aria-hidden="true" />
          </div>
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-brand-primary)] text-white">
          {ROLE_LABELS[recipe.role] ?? recipe.role}
        </span>
        {recipe.heroImage && isIllustration && (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white/95 backdrop-blur-xs shadow-xs z-10">
            Ảnh minh họa
          </span>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
          {recipe.isCookTested && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-[var(--color-surface-white)] text-[var(--color-success-base)] shadow-xs">
              <ChefHat className="w-3 h-3" aria-hidden="true" />
              Đã nấu thử
            </span>
          )}
          <BookmarkButton slug={recipe.slug} size="sm" />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
          <Link href={recipePath(recipe.slug)} className="after:absolute after:inset-0 focus:outline-none">
            {recipe.name}
          </Link>
        </h3>
        {recipe.source === 'COMMUNITY' && (
          <p className="mb-1.5 text-xs text-[var(--color-text-muted)] inline-flex items-center gap-1" data-testid="recipe-source-community">
            <Store className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <span className="font-semibold text-amber-700">Chợ công thức</span>
            {recipe.authorName && (
              <>
                <span aria-hidden="true">·</span>
                {recipe.creatorSlug ? (
                  <Link
                    href={`/nguoi-nau/${recipe.creatorSlug}`}
                    className="relative z-10 hover:underline text-[var(--color-text-secondary)]"
                  >
                    {recipe.authorName}
                  </Link>
                ) : (
                  <span>{recipe.authorName}</span>
                )}
              </>
            )}
          </p>
        )}
        <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 flex-1">{recipe.shortDescription}</p>

        <div className="pt-3 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {formatDuration(recipe.totalTimeMinutes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              {recipe.baseServings} người
            </span>
          </div>
          {hasCalorieData && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent-light)]/70 text-[var(--color-accent-text)] font-semibold text-[11px]"
              title="Năng lượng ước tính trên 1 khẩu phần (chưa gồm cơm trắng & nước chấm)"
            >
              <Flame className="w-3 h-3 text-[var(--color-accent-primary)]" aria-hidden="true" />
              ~{recipe.caloriesPerServing} kcal
            </span>
          )}
          {recipe.source === 'COMMUNITY' && (
            <span
              className={`font-semibold ${recipe.isFree ? 'text-emerald-600' : 'text-amber-700'}`}
              data-testid="recipe-price-tag"
            >
              {formatPriceVND(recipe.price)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
