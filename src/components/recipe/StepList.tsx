import { Timer, Lightbulb, ListOrdered } from 'lucide-react';
import type { PublicRecipeStep } from '@/lib/recipes/publicQueries';
import { formatTimer } from '@/lib/recipes/labels';

interface Props {
  steps: PublicRecipeStep[];
  recipeName: string;
}

/** Gom các bước liên tiếp cùng giai đoạn, giữ nguyên thứ tự gốc. */
function groupByPhase(steps: PublicRecipeStep[]) {
  const groups: Array<{ phase: string; steps: PublicRecipeStep[] }> = [];
  for (const step of steps) {
    const last = groups[groups.length - 1];
    if (last && last.phase === step.phaseName) last.steps.push(step);
    else groups.push({ phase: step.phaseName, steps: [step] });
  }
  return groups;
}

export function StepList({ steps, recipeName }: Props) {
  const groups = groupByPhase(steps);
  let stepIndex = 0;
  const numberedGroups = groups.map((group) => ({
    ...group,
    steps: group.steps.map((step) => ({
      ...step,
      stepNumber: ++stepIndex,
    })),
  }));

  return (
    <section aria-labelledby="steps-heading">
      <h2 id="steps-heading" className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-5">
        <ListOrdered className="w-5 h-5 text-[var(--color-brand-primary)]" aria-hidden="true" />
        Cách làm
      </h2>

      <div className="flex flex-col gap-8">
        {numberedGroups.map((group, gi) => (
          <div key={`${group.phase}-${gi}`}>
            <h3 className="mb-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[var(--color-accent-light)] text-[var(--color-accent-text)]">
              {group.phase}
            </h3>
            <ol className="flex flex-col gap-4">
              {group.steps.map((step) => {
                return (
                  <li
                    key={step.id}
                    className="group relative flex gap-4 rounded-2xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] p-4 sm:p-5 transition-shadow hover:shadow-md"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-sm font-bold text-white transition-transform group-hover:scale-105"
                      aria-hidden="true"
                    >
                      {step.stepNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="sr-only">Bước {step.stepNumber}</p>
                      <p className="whitespace-pre-line leading-relaxed text-[var(--color-text-primary)]">{step.instruction}</p>

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
