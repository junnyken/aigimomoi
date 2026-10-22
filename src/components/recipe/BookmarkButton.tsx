'use client';

import { Bookmark } from 'lucide-react';
import { useSavedRecipes } from '@/lib/recipes/savedRecipesClient';

interface BookmarkButtonProps {
  slug: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function BookmarkButton({
  slug,
  size = 'md',
  showText = false,
  className = '',
}: BookmarkButtonProps) {
  const { isSaved, toggleSave, isLoaded } = useSavedRecipes();
  const saved = isSaved(slug);

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSave(slug);
      }}
      disabled={!isLoaded}
      className={`relative z-10 inline-flex items-center justify-center gap-2 transition-all ${
        showText
          ? size === 'lg'
            ? `min-h-11 w-full sm:w-auto px-4 sm:px-5 py-3 rounded-2xl text-sm font-semibold ${
                saved
                  ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-surface-white)] border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)]'
              }`
            : `px-3.5 py-2 rounded-xl text-xs font-semibold ${
                saved
                  ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-surface-white)] border border-[var(--color-border-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)]'
              }`
          : `p-2 rounded-full backdrop-blur-xs ${
              saved
                ? 'bg-[var(--color-surface-white)] text-[var(--color-brand-primary)] shadow-sm'
                : 'bg-[var(--color-surface-white)]/80 text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-surface-white)] shadow-xs'
            }`
      } ${className}`}
      title={saved ? 'Bỏ lưu món ăn này' : 'Lưu món ăn này'}
      aria-label={saved ? 'Bỏ lưu món ăn này' : 'Lưu món ăn này'}
    >
      <Bookmark
        className={`${iconSizes[size]} transition-transform active:scale-125 ${
          saved ? 'fill-[var(--color-brand-primary)] text-[var(--color-brand-primary)]' : ''
        }`}
      />
      {showText && <span>{saved ? 'Đã lưu' : 'Lưu món'}</span>}
    </button>
  );
}
