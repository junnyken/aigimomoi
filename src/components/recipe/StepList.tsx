'use client';

import { useState } from 'react';
import { Timer, Lightbulb, ListOrdered, Check, ArrowRight } from 'lucide-react';
import type { PublicRecipeStep, PublicRecipeIngredient } from '@/lib/recipes/publicQueries';
import { formatTimer } from '@/lib/recipes/labels';
import { formatScaledAmount } from '@/lib/recipes/scaling';

interface Props {
  steps: PublicRecipeStep[];
  recipeName: string;
  ingredients?: PublicRecipeIngredient[];
}

/** Tự động tìm các nguyên liệu xuất hiện trong câu hướng dẫn của bước đó để hiển thị định lượng ngay tại bước */
function matchIngredientsForStep(
  instruction: string,
  ingredients?: PublicRecipeIngredient[]
): PublicRecipeIngredient[] {
  if (!ingredients || ingredients.length === 0) return [];
  const lowerInst = instruction.toLowerCase();
  const matched: PublicRecipeIngredient[] = [];

  for (const ing of ingredients) {
    const cleanName = ing.name
      .split('(')[0]
      .split('/')[0]
      .toLowerCase()
      .trim();
    if (!cleanName || cleanName.length < 2) continue;

    // Khớp tên nguyên liệu hoặc từ khóa chính của nguyên liệu (ví dụ: "cá lăng", "nước mắm", "cà chua")
    const words = cleanName.split(/\s+/);
    const shortKey = words.length >= 2 ? words.slice(0, 2).join(' ') : cleanName;

    if (lowerInst.includes(cleanName) || (shortKey.length >= 4 && lowerInst.includes(shortKey))) {
      matched.push(ing);
    }
  }

  return matched.slice(0, 5);
}

/** Làm nổi bật các thông số quan trọng (thời gian, độ lửa, định lượng) trong câu hướng dẫn nấu */
function renderHighlightedInstruction(text: string) {
  const pattern =
    /(\b\d+(?:[.,–-]\d+)?\s*(?:phút|giây|giờ|tiếng|g|kg|ml|lít|muỗng canh|muỗng cà phê|muỗng|thìa|chén|bát|củ|trái|quả|nhánh|tép|lát|khúc|cm)\b|lửa lớn|lửa vừa|lửa nhỏ|lửa liu riu|sôi bùng)/gi;

  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (!part) return null;
    if (pattern.test(part)) {
      pattern.lastIndex = 0;
      const lower = part.toLowerCase();
      const isHeat = lower.includes('lửa') || lower.includes('sôi');
      const isTime = lower.includes('phút') || lower.includes('giây') || lower.includes('giờ') || lower.includes('tiếng');
      return (
        <strong
          key={i}
          className={
            isHeat
              ? 'font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md'
              : isTime
              ? 'font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md'
              : 'font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-light)]/70 px-1.5 py-0.5 rounded-md'
          }
        >
          {part}
        </strong>
      );
    }
    return part;
  });
}

/** Gom các bước liên tiếp cùng giai đoạn, giữ nguyên thứ tự gốc. */
function groupByPhase(steps: PublicRecipeStep[]) {
  const groups: Array<{ phase: string; steps: PublicRecipeStep[] }> = [];
  for (const step of steps) {
    const phaseName = step.phaseName?.trim() || 'Chế biến';
    const last = groups[groups.length - 1];
    if (last && last.phase === phaseName) last.steps.push(step);
    else groups.push({ phase: phaseName, steps: [step] });
  }
  return groups;
}

export function StepList({ steps, recipeName, ingredients }: Props) {
  const [completedStepIds, setCompletedStepIds] = useState<Record<number, boolean>>({});

  function toggleStepCompleted(id: number) {
    setCompletedStepIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const completedCount = Object.values(completedStepIds).filter(Boolean).length;
  const groups = groupByPhase(steps);
  let stepIndex = 0;
  const numberedGroups = groups.map((group, groupIdx) => ({
    ...group,
    groupNumber: groupIdx + 1,
    anchorId: `phase-group-${groupIdx + 1}`,
    totalTimerSeconds: group.steps.reduce((acc, s) => acc + (s.timerSeconds ?? 0), 0),
    steps: group.steps.map((step) => ({
      ...step,
      stepNumber: ++stepIndex,
    })),
  }));

  return (
    <section id="recipe-steps-section" aria-labelledby="steps-heading" className="scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
        <h2 id="steps-heading" className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
          <span>Các bước thực hiện</span>
        </h2>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
          {completedCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              ✓ Đã nấu {completedCount}/{steps.length} bước
            </span>
          )}
          <span>{steps.length} bước · Chạm từng bước khi làm xong</span>
        </div>
      </div>

      {/* Thanh nhảy nhanh giai đoạn (chỉ hiện gọn 1 hàng khi có từ 2 giai đoạn trở lên) */}
      {numberedGroups.length > 1 && (
        <nav
          aria-label="Chuỗi giai đoạn chế biến"
          className="mb-5 flex flex-wrap items-center gap-1.5"
        >
          {numberedGroups.map((group, idx) => (
            <span key={group.anchorId} className="inline-flex items-center gap-1.5">
              <a
                href={`#${group.anchorId}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-surface-white)] hover:bg-[var(--color-brand-light)] border border-[var(--color-border-base)] hover:border-[var(--color-brand-border)] transition-colors text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)]"
              >
                <span className="w-4 h-4 rounded-full bg-[var(--color-brand-primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {group.groupNumber}
                </span>
                <span>{group.phase}</span>
                {group.steps.length > 1 && (
                  <span className="text-[11px] font-normal text-[var(--color-text-muted)]">
                    ({group.steps.length})
                  </span>
                )}
              </a>
              {idx < numberedGroups.length - 1 && (
                <ArrowRight className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Danh sách các bước: tự động gộp tiêu đề khi giai đoạn chỉ có 1 bước để không lặp chữ */}
      <div className="flex flex-col gap-4">
        {numberedGroups.map((group, gi) => {
          const isMultiStepPhase = group.steps.length > 1;
          return (
            <div
              key={`${group.phase}-${gi}`}
              id={group.anchorId}
              className="scroll-mt-24 relative"
            >
              {isMultiStepPhase && (
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[var(--color-accent-light)] text-[var(--color-accent-text)] border border-[var(--color-accent-primary)]/20">
                    <span>Giai đoạn {group.groupNumber}: {group.phase} ({group.steps.length} bước)</span>
                  </span>
                  {group.totalTimerSeconds > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)]">
                      <Timer className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{formatTimer(group.totalTimerSeconds)}</span>
                    </span>
                  )}
                </div>
              )}

              <ol className="flex flex-col gap-3.5">
                {group.steps.map((step) => {
                  const isDone = Boolean(completedStepIds[step.id]);
                  const stepIngredients = matchIngredientsForStep(step.instruction, ingredients);

                  return (
                    <li
                      key={step.id}
                      id={`step-${step.stepNumber}`}
                      className={`group relative flex gap-3.5 sm:gap-4 rounded-2xl border p-4 sm:p-5 transition-all ${
                        isDone
                          ? 'border-emerald-300 bg-emerald-50/35 opacity-80'
                          : 'border-[var(--color-border-base)] bg-[var(--color-surface-white)] hover:shadow-md'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleStepCompleted(step.id)}
                        title={isDone ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu đã làm xong bước này'}
                        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-transform cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 scale-95'
                            : 'bg-[var(--color-brand-primary)] group-hover:scale-105'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : step.stepNumber}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-accent-text)]">
                            {isMultiStepPhase ? `Bước ${step.stepNumber}` : group.phase}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {step.timerSeconds ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-info-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-info-base)]">
                                <Timer className="w-3 h-3" aria-hidden="true" />
                                {formatTimer(step.timerSeconds)}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => toggleStepCompleted(step.id)}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer transition-colors ${
                                isDone
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] border-[var(--color-border-base)] hover:border-emerald-400 hover:text-emerald-700'
                              }`}
                            >
                              {isDone ? '✓ Đã xong' : 'Xong bước này'}
                            </button>
                          </div>
                        </div>

                        {/* Hiển thị các nguyên liệu cần dùng ngay tại bước này để người nấu không phải liếc sang cột trái */}
                        {stepIngredients.length > 0 && (
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            {stepIngredients.map((ing) => (
                              <span
                                key={ing.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF7F0] border border-[#E5DAC8] text-[11px] font-semibold text-[var(--color-text-primary)]"
                              >
                                <span className="text-[var(--color-brand-primary)] font-bold">
                                  {ing.name}:
                                </span>
                                <span>
                                  {formatScaledAmount(ing.amount)} {ing.unit}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}

                        <p
                          className={`whitespace-pre-line leading-relaxed text-[var(--color-text-primary)] ${
                            isDone ? 'line-through text-[var(--color-text-secondary)]' : ''
                          }`}
                        >
                          {renderHighlightedInstruction(step.instruction)}
                        </p>

                        {step.tipText && (
                          <p className="mt-2.5 flex items-start gap-2 rounded-xl bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-2.5 text-xs sm:text-sm text-[var(--color-text-secondary)]">
                            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-warning-base)]" aria-hidden="true" />
                            <span>{step.tipText}</span>
                          </p>
                        )}

                        {step.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={step.image}
                            alt={`${recipeName} — bước ${step.stepNumber}`}
                            loading="lazy"
                            className="mt-3 w-full max-h-80 rounded-xl object-cover bg-[var(--color-surface-raised)]"
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}
