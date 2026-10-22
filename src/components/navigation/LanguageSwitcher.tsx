'use client';

import { Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function LanguageSwitcher() {
  const { locale, toggleLocale } = useI18n();
  const isEn = locale === 'en';

  return (
    <button
      type="button"
      onClick={toggleLocale}
      data-no-i18n="true"
      aria-label={isEn ? 'Switch language to Vietnamese (Tiếng Việt)' : 'Chuyển sang Tiếng Anh (English)'}
      title={isEn ? 'Đang dùng Tiếng Anh (EN) — Bấm để chuyển sang Tiếng Việt (VI)' : 'Đang dùng Tiếng Việt (VI) — Bấm để chuyển sang Tiếng Anh (EN)'}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--color-surface-raised)] hover:bg-[var(--color-brand-light)] border border-[var(--color-border-base)] hover:border-[var(--color-brand-border)] text-xs sm:text-sm font-bold text-[var(--color-text-primary)] hover:text-[var(--color-brand-primary)] transition-all shrink-0 shadow-2xs cursor-pointer"
    >
      <Globe className="w-4 h-4 text-[var(--color-brand-primary)] shrink-0" />
      <span className="inline-flex items-center gap-1 tracking-tight">
        <span className={locale === 'vi' ? 'text-[var(--color-brand-primary)] font-extrabold' : 'text-[var(--color-text-muted)] font-medium'}>
          VI
        </span>
        <span className="text-[var(--color-border-strong)]">/</span>
        <span className={locale === 'en' ? 'text-[var(--color-brand-primary)] font-extrabold' : 'text-[var(--color-text-muted)] font-medium'}>
          EN
        </span>
      </span>
    </button>
  );
}
