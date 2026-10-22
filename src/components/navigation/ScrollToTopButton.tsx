'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const { locale } = useI18n();

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 320);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  const label = locale === 'en' ? 'Top' : 'Đầu trang';
  const title = locale === 'en' ? 'Scroll back to top' : 'Cuộn nhanh lên đầu trang';

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={title}
      title={title}
      data-no-i18n="true"
      className="no-print fixed right-4 sm:right-6 bottom-20 md:bottom-7 z-40 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white text-xs sm:text-sm font-bold shadow-lg border border-white/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
    >
      <ArrowUp className="w-4 h-4 stroke-[2.5] shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
