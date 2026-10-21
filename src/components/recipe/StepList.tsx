import { Timer, Lightbulb, ListOrdered, CheckCircle2, ArrowRight } from 'lucide-react';
import type { PublicRecipeStep } from '@/lib/recipes/publicQueries';
import { formatTimer } from '@/lib/recipes/labels';

interface Props {
  steps: PublicRecipeStep[];
  recipeName: string;
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

export function StepList({ steps, recipeName }: Props) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h2 id="steps-heading" className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
          <span>Cách làm theo từng giai đoạn</span>
        </h2>
        <span className="text-xs font-semibold text-[var(--color-text-muted)]">
          {numberedGroups.length} giai đoạn · {steps.length} bước thực hiện
        </span>
      </div>

      {/* Pipeline qua mỗi giai đoạn (Phase Pipeline Stepper) */}
      {numberedGroups.length > 0 && (
        <nav
          aria-label="Chuỗi giai đoạn chế biến"
          className="mb-6 p-3.5 sm:p-4 rounded-2xl bg-[var(--color-surface-white)] border border-[var(--color-border-base)] shadow-2xs"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2.5">
            Lộ trình nấu món này ({numberedGroups.length} giai đoạn)
          </div>
          <ol className="flex flex-wrap items-center gap-2">
            {numberedGroups.map((group, idx) => (
              <li key={group.anchorId} className="inline-flex items-center gap-2">
                <a
                  href={`#${group.anchorId}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-bg-primary)] hover:bg-[var(--color-brand-light)] border border-[var(--color-border-subtle)] hover:border-[var(--color-brand-border)] transition-colors group"
                >
                  <span className="w-5 h-5 rounded-full bg-[var(--color-brand-primary)] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {group.groupNumber}
                  </span>
                  <span className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)]">
                    {group.phase}
                  </span>
                  <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                    ({group.steps.length} bước{group.totalTimerSeconds > 0 ? ` · ${formatTimer(group.totalTimerSeconds)}` : ''})
                  </span>
                </a>
                {idx < numberedGroups.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Danh sách các bước theo từng giai đoạn có đường nối Timeline */}
      <div className="flex flex-col gap-8">
        {numberedGroups.map((group, gi) => (
          <div
            key={`${group.phase}-${gi}`}
            id={group.anchorId}
            className="scroll-mt-24 relative"
          >
            {/* Header của Giai đoạn */}
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[var(--color-accent-light)] text-[var(--color-accent-text)] border border-[var(--color-accent-primary)]/20">
                  <span>Giai đoạn {group.groupNumber}: {group.phase}</span>
                </span>
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  {group.steps.length} bước
                </span>
              </div>
              {group.totalTimerSeconds > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)]">
                  <Timer className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Tổng hẹn giờ: {formatTimer(group.totalTimerSeconds)}</span>
                </span>
              )}
            </div>

            <ol className="flex flex-col gap-4 relative pl-2 sm:pl-3 before:content-[''] before:absolute before:left-6 sm:before:left-7 before:top-5 before:bottom-5 before:w-0.5 before:bg-[var(--color-border-base)]">
              {group.steps.map((step) => {
                return (
                  <li
                    key={step.id}
                    className="group relative flex gap-3.5 sm:gap-4 rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] p-4 sm:p-5 transition-shadow hover:shadow-md z-10"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-sm font-bold text-white transition-transform group-hover:scale-105 ring-4 ring-[var(--color-surface-white)]"
                      aria-hidden="true"
                    >
                      {step.stepNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          Bước {step.stepNumber} · {group.phase}
                        </span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed text-[var(--color-text-primary)]">
                        {renderHighlightedInstruction(step.instruction)}
                      </p>

                      {(step.timerSeconds || step.tipText) && (
                        <div className="mt-3 flex flex-col gap-2">
                          {step.timerSeconds ? (
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-info-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-info-base)]">
                              <Timer className="w-3.5 h-3.5" aria-hidden="true" />
                              {formatTimer(step.timerSeconds)}
                            </span>
                          ) : null}
                          {step.tipText && (
                            <p className="flex items-start gap-2 rounded-xl bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-2.5 text-sm text-[var(--color-text-secondary)]">
                              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-warning-base)]" aria-hidden="true" />
                              <span>{step.tipText}</span>
                            </p>
                          )}
                        </div>
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
        ))}
      </div>
    </section>
  );
}
