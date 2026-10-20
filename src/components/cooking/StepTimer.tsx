'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, BellRing } from 'lucide-react';
import { formatTimer } from '@/lib/recipes/labels';

interface StepTimerProps {
  initialSeconds: number;
  stepNumber: number;
}

export function StepTimer({ initialSeconds, stepNumber }: StepTimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Khi chuyển bước khác, reset timer về giá trị của bước mới
  useEffect(() => {
    setRemaining(initialSeconds);
    setIsRunning(false);
    setHasFinished(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [initialSeconds, stepNumber]);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setHasFinished(true);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remaining]);

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

  function handleToggle() {
    if (hasFinished) {
      // Nếu đã hết giờ, bấm lại sẽ reset và chạy tiếp
      setRemaining(initialSeconds);
      setHasFinished(false);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
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
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
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
          className="p-2 rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-colors"
          title="Đặt lại thời gian"
          aria-label="Đặt lại thời gian hẹn giờ"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
