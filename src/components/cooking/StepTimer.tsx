'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, BellRing } from 'lucide-react';
import { formatTimer } from '@/lib/recipes/labels';

interface StepTimerProps {
  initialSeconds: number;
  stepNumber: number;
}

// Âm thanh cảnh báo nhẹ qua Web Audio API (không phụ thuộc tệp ngoài)
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Note D5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Bỏ qua nếu browser chặn audio tự động
  }
}

// R3: Timer chỉ báo hiệu (chuông + đổi màu), KHÔNG BAO GIỜ tự chuyển bước (D39).
// Khi đổi bước, CookingModeView remount component qua `key` nên state tự về giá trị bước mới.
export function StepTimer({ initialSeconds, stepNumber }: StepTimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  // Mốc kết thúc tuyệt đối: đếm đúng kể cả khi trình duyệt mobile làm chậm setInterval.
  const endAtRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        // Xử lý hết giờ ngay trong callback (không nằm trong updater của setState)
        // → chuông kêu đúng 1 lần, kể cả ở StrictMode.
        clearInterval(id);
        setIsRunning(false);
        setHasFinished(true);
        playBeep();
      }
    }, 250);
    return () => clearInterval(id);
  }, [isRunning]);

  function start(fromSeconds: number) {
    endAtRef.current = Date.now() + fromSeconds * 1000;
    setRemaining(fromSeconds);
    setHasFinished(false);
    setIsRunning(true);
  }

  function handleToggle() {
    if (hasFinished) {
      // Nếu đã hết giờ, bấm lại sẽ reset và chạy tiếp
      start(initialSeconds);
    } else if (isRunning) {
      setIsRunning(false);
    } else {
      start(remaining);
    }
  }

  function handleReset() {
    setIsRunning(false);
    setRemaining(initialSeconds);
    setHasFinished(false);
  }

  const isLow = remaining > 0 && remaining <= 10;

  return (
    <div
      role="timer"
      aria-label={`Hẹn giờ bước ${stepNumber}`}
      data-testid="step-timer"
      data-state={hasFinished ? 'finished' : isRunning ? 'running' : 'idle'}
      className={`rounded-2xl border p-4 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
        hasFinished
          ? 'bg-[var(--color-danger-subtle)]/20 border-[var(--color-danger-base)] shadow-sm'
          : isRunning
          ? 'bg-[var(--color-brand-primary)]/5 border-[var(--color-brand-primary)]'
          : 'bg-[var(--color-surface-raised)] border-[var(--color-border-base)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            hasFinished
              ? 'bg-[var(--color-danger-base)] text-white animate-bounce'
              : isRunning
              ? 'bg-[var(--color-brand-primary)] text-white'
              : 'bg-[var(--color-surface-white)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
          }`}
        >
          {hasFinished ? <BellRing className="w-5 h-5" /> : <TimerIcon className="w-5 h-5" />}
        </div>

        <div>
          <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {hasFinished ? 'Hết giờ hẹn!' : isRunning ? 'Đang đếm ngược' : 'Hẹn giờ bước này'}
          </div>
          <div
            className={`text-2xl font-bold tabular-nums tracking-tight ${
              hasFinished
                ? 'text-[var(--color-danger-base)]'
                : isLow
                ? 'text-[var(--color-accent-text)] animate-pulse'
                : 'text-[var(--color-text-primary)]'
            }`}
          >
            {formatTimer(remaining)}
          </div>
        </div>
      </div>

      {/* Điều khiển Timer */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggle}
          data-testid="step-timer-toggle"
          className={`min-h-11 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
            hasFinished
              ? 'bg-[var(--color-danger-base)] text-white hover:opacity-90'
              : isRunning
              ? 'bg-[var(--color-surface-white)] border border-[var(--color-border-base)] text-[var(--color-text-primary)] hover:border-[var(--color-brand-primary)]'
              : 'bg-[var(--color-brand-primary)] text-white hover:opacity-90'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Tạm dừng</span>
            </>
          ) : hasFinished ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hẹn giờ lại</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Bắt đầu</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="min-h-11 min-w-11 flex items-center justify-center p-2 rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-colors"
          title="Đặt lại thời gian"
          aria-label="Đặt lại thời gian hẹn giờ"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
