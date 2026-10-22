'use client';

// Nút Ghi nhanh món ăn vào Nhật Ký Bữa Ăn Gia Đình
import { useState } from 'react';
import Link from 'next/link';
import { HeartPulse, Plus, Check, X, Calendar } from 'lucide-react';

interface LogToDiaryButtonProps {
  recipeId: number;
  recipeName: string;
  className?: string;
}

export function LogToDiaryButton({ recipeId, recipeName, className = '' }: LogToDiaryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mealType, setMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>('LUNCH');
  const [portion, setPortion] = useState(1.0);
  const [memberName, setMemberName] = useState('Cả nhà');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          recipeName,
          diaryDate: todayStr,
          mealType,
          memberName: memberName.trim() || 'Cả nhà',
          consumedPortion: portion,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError('Vui lòng đăng nhập để lưu vào nhật ký bữa ăn gia đình.');
        } else {
          setError(data.error || 'Có lỗi xảy ra.');
        }
      } else {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 1800);
      }
    } catch {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`min-h-11 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold border border-[var(--color-border-base)] bg-[var(--color-surface-white)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)] transition-all shadow-xs text-sm ${className}`}
        title="Ghi món ăn này vào nhật ký bữa cơm gia đình hôm nay"
      >
        <HeartPulse className="w-4 h-4 text-red-500" />
        <span>Ghi vào Nhật ký</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-surface-white)] border border-[var(--color-border-base)] rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-1">
              <HeartPulse className="w-4 h-4 text-red-500" />
              Ghi vào Nhật Ký Hôm Nay
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4 truncate">
              Món: <strong>{recipeName}</strong>
            </p>

            {success ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Đã ghi vào nhật ký! <Link href="/nhat-ky" className="underline font-bold">Xem nhật ký</Link></span>
              </div>
            ) : (
              <form onSubmit={handleLog} className="space-y-3">
                {error && (
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">
                    Bữa ăn
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none"
                  >
                    <option value="BREAKFAST">🌅 Bữa sáng</option>
                    <option value="LUNCH">☀️ Bữa trưa</option>
                    <option value="DINNER">🌙 Bữa tối</option>
                    <option value="SNACK">🍎 Bữa phụ</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">
                      Thành viên ăn
                    </label>
                    <input
                      type="text"
                      placeholder="Bố, Mẹ, Bé..."
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">
                      Khẩu phần
                    </label>
                    <select
                      value={portion}
                      onChange={(e) => setPortion(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-white)] text-[var(--color-text-primary)] focus:outline-none"
                    >
                      <option value={0.5}>0.5 phần (ít)</option>
                      <option value={1.0}>1.0 phần</option>
                      <option value={1.5}>1.5 phần</option>
                      <option value={2.0}>2.0 phần</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border-base)] text-[var(--color-text-secondary)]"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover,#b3391b)] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Ghi nhận'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
