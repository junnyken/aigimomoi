'use client';

import { useState, useEffect, useEffectEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Lightbulb,
  ShoppingBasket,
  X,
  UtensilsCrossed,
  Sparkles,
  Volume2,
  VolumeX,
  Square,
  Sun,
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoReadStep, setAutoReadStep] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [keepScreenAwake, setKeepScreenAwake] = useState(true);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const currentStep: PublicRecipeStep | undefined = steps[currentIdx];

  // Screen Wake Lock API — Giữ màn hình điện thoại không tự tắt khi đang đứng bếp tay ướt
  useEffect(() => {
    let sentinel: any = null;
    let cancelled = false;

    async function requestWakeLock() {
      if (!keepScreenAwake || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
        setWakeLockActive(false);
        return;
      }
      try {
        sentinel = await (navigator as any).wakeLock.request('screen');
        if (!cancelled) {
          setWakeLockActive(true);
        }
        sentinel.addEventListener('release', () => {
          if (!cancelled) setWakeLockActive(false);
        });
      } catch {
        if (!cancelled) setWakeLockActive(false);
      }
    }

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && keepScreenAwake) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sentinel && typeof sentinel.release === 'function') {
        sentinel.release().catch(() => {});
      }
    };
  }, [keepScreenAwake]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
      // Warm up voices list on Chrome/Android/iOS
      window.speechSynthesis.getVoices();
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }

  function speakCurrentStep(stepToRead?: PublicRecipeStep, idxToRead?: number) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const step = stepToRead ?? currentStep;
    const idx = idxToRead ?? currentIdx;
    if (!step) return;

    window.speechSynthesis.cancel();

    const parts: string[] = [
      `Bước ${idx + 1}, giai đoạn ${step.phaseName || 'Chế biến'}.`,
      step.instruction,
    ];
    if (step.tipText) {
      parts.push(`Mẹo hay: ${step.tipText}`);
    }
    if ((step.timerSeconds ?? 0) > 0) {
      const mins = Math.max(1, Math.round((step.timerSeconds ?? 0) / 60));
      parts.push(`Bước này có hẹn giờ khoảng ${mins} phút.`);
    }

    const utterance = new SpeechSynthesisUtterance(parts.join(' '));
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('vi') || v.name.toLowerCase().includes('vietnam')
    );
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  const triggerAutoRead = useEffectEvent((step: PublicRecipeStep | undefined, idx: number, enabled: boolean) => {
    if (!enabled || !step) {
      stopSpeaking();
      return;
    }
    speakCurrentStep(step, idx);
  });

  useEffect(() => {
    triggerAutoRead(currentStep, currentIdx, autoReadStep);
  }, [currentIdx, autoReadStep, currentStep]);

  // Scale nguyên liệu theo servings
  const scaledIngredients = scaleRecipeIngredients(recipe.ingredients, recipe.baseServings, servings);

  // R3: Bỏ useCallback thủ công — React Compiler tự memo (trước đây lint báo không giữ được memo).
  function goToNext() {
    if (currentIdx < totalSteps - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsCompletedModalOpen(true);
    }
  }

  function goToPrev() {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  }

  // Hỗ trợ phím tắt bàn phím (useEffectEvent: luôn đọc state mới nhất, chỉ đăng ký listener 1 lần)
  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (isIngredientsOpen || isCompletedModalOpen) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      goToNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goToPrev();
    }
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  // Tỷ lệ tiến độ (%)
  const progressPercent = totalSteps > 0 ? Math.round(((currentIdx + 1) / totalSteps) * 100) : 0;

  // Gom nhóm giai đoạn (Phase Pipeline) để người đứng bếp biết đang ở giai đoạn nào
  const phaseGroups = steps.reduce<
    Array<{ phaseName: string; startIndex: number; endIndex: number; count: number }>
  >((acc, step, idx) => {
    const pName = step.phaseName?.trim() || 'Chế biến';
    const last = acc[acc.length - 1];
    if (last && last.phaseName === pName) {
      last.endIndex = idx;
      last.count += 1;
    } else {
      acc.push({ phaseName: pName, startIndex: idx, endIndex: idx, count: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-bg-primary)] flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="h-16 px-4 sm:px-6 bg-[var(--color-surface-white)] border-b border-[var(--color-border-base)] flex items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={recipePath(recipe.slug)}
            className="min-h-11 min-w-11 flex items-center justify-center p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors shrink-0"
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
            onClick={() => setKeepScreenAwake((prev) => !prev)}
            title="Giữ màn hình điện thoại luôn sáng khi đang đứng bếp tay ướt (Screen Wake Lock)"
            className={`min-h-11 min-w-11 justify-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              keepScreenAwake
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border-base)]'
            }`}
          >
            <Sun className={`w-4 h-4 ${keepScreenAwake ? 'text-amber-600' : ''}`} />
            <span className="hidden md:inline">
              {keepScreenAwake
                ? wakeLockActive
                  ? 'Giữ sáng màn hình: BẬT'
                  : 'Giữ sáng: Tự động'
                : 'Giữ sáng: TẮT'}
            </span>
          </button>

          {speechSupported && (
            <button
              type="button"
              onClick={() => {
                const next = !autoReadStep;
                setAutoReadStep(next);
                if (next && currentStep) {
                  speakCurrentStep(currentStep, currentIdx);
                } else {
                  stopSpeaking();
                }
              }}
              aria-label={autoReadStep ? 'Tắt tự động đọc giọng nói' : 'Bật tự động đọc giọng nói'}
              title="Tự động đọc to bước nấu bằng giọng nói khi chuyển bước (rảnh tay khi tay ướt)"
              className={`min-h-11 min-w-11 justify-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                autoReadStep
                  ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)] shadow-2xs'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-[var(--color-border-base)]'
              }`}
            >
              {autoReadStep ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{autoReadStep ? 'Tự động đọc: BẬT' : 'Tự động đọc'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsIngredientsOpen(true)}
            aria-label="Xem nguyên liệu"
            className="min-h-11 min-w-11 justify-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] hover:opacity-90 transition-opacity border border-[var(--color-brand-primary)]/20"
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

      {/* Phase Pipeline Stepper Bar (hiển thị trên cả Mobile & Desktop) */}
      {phaseGroups.length > 0 && (
        <div
          aria-label="Giai đoạn chế biến"
          className="bg-[var(--color-surface-white)]/90 border-b border-[var(--color-border-subtle)] px-4 py-2 shrink-0 overflow-x-auto scrollbar-none"
        >
          <div className="max-w-3xl mx-auto flex items-center gap-2 whitespace-nowrap">
            {phaseGroups.map((pg, idx) => {
              const isCompleted = currentIdx > pg.endIndex;
              const isActive = currentIdx >= pg.startIndex && currentIdx <= pg.endIndex;
              const currentStepInPhase = isActive ? currentIdx - pg.startIndex + 1 : 0;

              return (
                <div key={`${pg.phaseName}-${pg.startIndex}`} className="inline-flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentIdx(pg.startIndex)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[var(--color-brand-primary)] text-white shadow-2xs'
                        : isCompleted
                        ? 'bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] border border-[var(--color-brand-border)]'
                        : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        isActive
                          ? 'bg-white text-[var(--color-brand-primary)]'
                          : isCompleted
                          ? 'bg-[var(--color-brand-primary)] text-white'
                          : 'bg-[var(--color-border-base)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                    </span>
                    <span>{pg.phaseName}</span>
                    {isActive && pg.count > 1 && (
                      <span className="text-[10px] opacity-90">
                        ({currentStepInPhase}/{pg.count})
                      </span>
                    )}
                  </button>
                  {idx < phaseGroups.length - 1 && (
                    <span className="w-4 h-0.5 bg-[var(--color-border-base)] rounded-full" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Focus Step Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between max-w-3xl w-full mx-auto">
        {currentStep ? (
          <div className="flex flex-col gap-6 my-auto">
            {/* Phase & Step Indicator */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-surface-white)] border border-[var(--color-border-base)] text-[var(--color-text-secondary)]">
                {currentStep.phaseName || 'Giai đoạn nấu'}
              </span>

              <div className="flex items-center gap-2.5">
                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => (isSpeaking ? stopSpeaking() : speakCurrentStep(currentStep, currentIdx))}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                      isSpeaking
                        ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                        : 'bg-[var(--color-brand-light)] text-[var(--color-brand-primary)] hover:opacity-90 border border-[var(--color-brand-primary)]/25'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Dừng đọc</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Đọc to bước này</span>
                      </>
                    )}
                  </button>
                )}

                <span className="text-xs font-bold text-[var(--color-brand-primary)]">
                  Bước {currentIdx + 1} / {totalSteps}
                </span>
              </div>
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
              {(currentStep.timerSeconds ?? 0) > 0 && (
                <StepTimer
                  key={`${currentStep.id}-${currentIdx}`}
                  initialSeconds={currentStep.timerSeconds ?? 0}
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
      <footer className="h-20 px-4 sm:px-8 bg-[var(--color-surface-white)] border-t border-[var(--color-border-base)] flex items-center justify-between gap-3 shrink-0 shadow-lg">
        <button
          type="button"
          onClick={goToPrev}
          disabled={currentIdx === 0}
          className="min-h-11 inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-2xl text-sm font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface-raised)] border border-[var(--color-border-base)] hover:bg-[var(--color-surface-subtle)] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Bước trước</span>
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
          className="min-h-11 inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl text-sm font-bold text-white bg-[var(--color-brand-primary)] hover:opacity-90 transition-all shadow-sm"
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
