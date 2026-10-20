'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  ShoppingBasket,
  X,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react';
import type { PublicRecipe, PublicRecipeStep } from '@/lib/recipes/publicQueries';
import { scaleRecipeIngredients, clampServings } from '@/lib/recipes/scaling';
import { recipePath } from '@/lib/recipes/labels';
import { StepTimer } from './StepTimer';
import { QuickIngredientsSheet } from './QuickIngredientsSheet';

interface CookingModeViewProps {
  recipe: PublicRecipe;
  initialServings?: number;
  initialStepIndex?: number;
}

export function CookingModeView({
  recipe,
  initialServings,
  initialStepIndex = 0,
}: CookingModeViewProps) {
  const servings = clampServings(initialServings ?? recipe.baseServings, recipe.baseServings);
  const steps = recipe.steps;
  const totalSteps = steps.length;

  const [currentIdx, setCurrentIdx] = useState(() => {
    const idx = Number(initialStepIndex);
    return Number.isFinite(idx) && idx >= 0 && idx < totalSteps ? idx : 0;
  });

  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);

  const currentStep: PublicRecipeStep | undefined = steps[currentIdx];

  // Scale nguyên liệu theo servings
  const scaledIngredients = scaleRecipeIngredients(recipe.ingredients, recipe.baseServings, servings);

  const goToNext = useCallback(() => {
    if (currentIdx < totalSteps - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsCompletedModalOpen(true);
    }
  }, [currentIdx, totalSteps]);

  const goToPrev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  }, [currentIdx]);

  // Hỗ trợ phím tắt bàn phím
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isIngredientsOpen || isCompletedModalOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPrev();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, isIngredientsOpen, isCompletedModalOpen]);

  // Tỷ lệ tiến độ (%)
  const progressPercent = totalSteps > 0 ? Math.round(((currentIdx + 1) / totalSteps) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-bg-primary)] flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="h-16 px-4 sm:px-6 bg-[var(--color-surface-white)] border-b border-[var(--color-border-base)] flex items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={recipePath(recipe.slug)}
            className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors shrink-0"
            title="Thoát chế độ nấu"
            aria-label="Thoát chế độ nấu"
          >
            <X className="w-5 h-5" />
          </Link>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[var(--color-text-primary)] truncate">
              {recipe.name}
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Chế độ nấu · Khẩu phần {servings} người
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsIngredientsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] hover:opacity-90 transition-opacity border border-[var(--color-brand-primary)]/20"
          >
            <ShoppingBasket className="w-4 h-4" />
            <span className="hidden sm:inline">Xem nguyên liệu</span>
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-[var(--color-surface-raised)] h-1.5 shrink-0">
        <div
          className="bg-[var(--color-brand-primary)] h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Focus Step Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between max-w-3xl w-full mx-auto">
        {currentStep ? (
          <div className="flex flex-col gap-6 my-auto">
            {/* Phase & Step Indicator */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-surface-white)] border border-[var(--color-border-base)] text-[var(--color-text-secondary)]">
                {currentStep.phaseName || 'Giai đoạn nấu'}
              </span>

              <span className="text-xs font-bold text-[var(--color-brand-primary)]">
                Bước {currentIdx + 1} / {totalSteps}
              </span>
            </div>

            {/* Step Instruction (Big Typography) */}
            <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
              <p className="text-xl sm:text-2xl font-semibold leading-relaxed text-[var(--color-text-primary)]">
                {currentStep.instruction}
              </p>

              {/* Step Image if available */}
              {currentStep.image && (
                <div className="rounded-2xl overflow-hidden aspect-video bg-[var(--color-surface-raised)] max-h-72">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentStep.image}
                    alt={`Hình ảnh bước ${currentStep.stepNumber}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Cooking Tip if available */}
              {currentStep.tipText && (
                <div className="rounded-2xl bg-[var(--color-accent-light)] border border-[var(--color-accent-primary)]/20 p-4 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-[var(--color-accent-text)] shrink-0 mt-0.5" />
                  <div className="text-sm text-[var(--color-accent-text)] leading-relaxed">
                    <span className="font-bold">Mẹo hay: </span>
                    {currentStep.tipText}
                  </div>
                </div>
              )}

              {/* Cooking Timer if available (Invariants §6.7) */}
              {currentStep.timerSeconds && currentStep.timerSeconds > 0 && (
                <StepTimer
                  initialSeconds={currentStep.timerSeconds}
                  stepNumber={currentStep.stepNumber}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="my-auto text-center p-8">
            <UtensilsCrossed className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Công thức chưa có bước nấu</p>
          </div>
        )}
      </main>

      {/* Bottom Step Control Bar */}
      <footer className="h-20 px-4 sm:px-8 bg-[var(--color-surface-white)] border-t border-[var(--color-border-base)] flex items-center justify-between gap-4 shrink-0 shadow-lg">
        <button
          type="button"
          onClick={goToPrev}
          disabled={currentIdx === 0}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] hover:bg-[var(--color-surface-subtle)] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Bước trước</span>
        </button>

        {/* Step dots on larger screens */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-xs px-2">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIdx(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentIdx
                  ? 'w-6 bg-[var(--color-brand-primary)]'
                  : i < currentIdx
                  ? 'w-2 bg-[var(--color-brand-primary)]/40'
                  : 'w-2 bg-[var(--color-border-strong)]'
              }`}
              title={`Chuyển tới bước ${i + 1}`}
              aria-label={`Chuyển tới bước ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goToNext}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-[var(--color-brand-primary)] hover:opacity-90 transition-all shadow-sm"
        >
          {currentIdx === totalSteps - 1 ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Hoàn thành món</span>
            </>
          ) : (
            <>
              <span>Bước tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </footer>

      {/* Quick Ingredients Sheet */}
      <QuickIngredientsSheet
        ingredients={scaledIngredients}
        servings={servings}
        isOpen={isIngredientsOpen}
        onClose={() => setIsIngredientsOpen(false)}
      />

      {/* Completed Modal */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[var(--color-success-subtle)]/30 text-[var(--color-success-base)] flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              Nấu xong món rồi!
            </h2>

            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Bạn đã hoàn thành toàn bộ các bước nấu món <span className="font-semibold text-[var(--color-text-primary)]">{recipe.name}</span>. Chúc gia đình có bữa cơm thật ngon miệng!
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              <Link
                href={recipePath(recipe.slug)}
                className="w-full py-3 bg-[var(--color-brand-primary)] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-xs"
              >
                Xem lại công thức
              </Link>
              <Link
                href="/mon-an"
                className="w-full py-3 bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] text-[var(--color-text-primary)] font-semibold text-sm rounded-xl hover:bg-[var(--color-surface-subtle)] transition-colors"
              >
                Khám phá món khác
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
