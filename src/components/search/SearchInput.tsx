'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';

export function SearchInput({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    params.delete('page'); // Reset trang về 1 khi tìm mới

    startTransition(() => {
      router.push(`/mon-an?${params.toString()}`);
    });
  }

  function handleClear() {
    setValue('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('page');

    startTransition(() => {
      router.push(`/mon-an?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-[var(--color-text-muted)] pointer-events-none flex items-center">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-brand-primary)]" aria-hidden="true" />
          ) : (
            <Search className="w-4 h-4" aria-hidden="true" />
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Tìm theo tên món (thịt kho, canh chua, cá rán...)"
          className="w-full pl-10 pr-24 py-2.5 bg-[var(--color-surface-white)] text-[var(--color-text-primary)] border border-[var(--color-border-base)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent transition-all shadow-xs"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-md transition-colors"
              title="Xóa từ khóa"
              aria-label="Xóa từ khóa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="px-3 py-1 bg-[var(--color-brand-primary)] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Tìm
          </button>
        </div>
      </div>
    </form>
  );
}
