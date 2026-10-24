'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Locale, translateViTextToEn } from './dictionary';

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
  t: (viText: string, enOverride?: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'vi',
  setLocale: () => {},
  toggleLocale: () => {},
  t: (viText) => viText,
});

const STORAGE_KEY = 'angimom_locale';

// Lưu trữ bản gốc Tiếng Việt của từng Text Node và Attribute để khôi phục chính xác 100% khi chuyển lại VI
const originalTextMap = new WeakMap<Text, string>();
const lastTranslatedMap = new WeakMap<Text, string>();
const trackedTextNodes = new Set<Text>();
const originalAttrMap = new WeakMap<HTMLElement, { placeholder?: string; title?: string }>();
const lastTranslatedAttrMap = new WeakMap<HTMLElement, { placeholder?: string; title?: string }>();
const trackedElements = new Set<HTMLElement>();

const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'SVG']);

function shouldIgnoreNode(node: Node | null): boolean {
  let curr: Node | null = node;
  while (curr && curr instanceof HTMLElement) {
    if (IGNORED_TAGS.has(curr.tagName) || curr.dataset.noI18n === 'true') {
      return true;
    }
    curr = curr.parentNode;
  }
  return false;
}

function applyDomTranslation(root: Node, targetLocale: Locale) {
  if (typeof document === 'undefined') return;

  if (targetLocale === 'vi') {
    for (const textNode of trackedTextNodes) {
      const orig = originalTextMap.get(textNode);
      if (orig !== undefined && textNode.nodeValue !== orig) {
        textNode.nodeValue = orig;
      }
    }
    for (const el of trackedElements) {
      const origAttrs = originalAttrMap.get(el);
      if (!origAttrs) continue;
      if (origAttrs.placeholder !== undefined && el.getAttribute('placeholder') !== origAttrs.placeholder) {
        el.setAttribute('placeholder', origAttrs.placeholder);
      }
      if (origAttrs.title !== undefined && el.getAttribute('title') !== origAttrs.title) {
        el.setAttribute('title', origAttrs.title);
      }
    }
    return;
  }

  // Khi targetLocale === 'en': duyệt cây DOM và dịch sang Tiếng Anh
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current: Node | null = walker.currentNode;

  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      const textNode = current as Text;
      const parentEl = textNode.parentElement;
      if (parentEl && !shouldIgnoreNode(parentEl)) {
        const val = textNode.nodeValue ?? '';
        if (val.trim().length > 0) {
          const lastEn = lastTranslatedMap.get(textNode);
          // Nếu React vừa cập nhật nội dung mới vào TextNode này (khác với bản dịch EN lần trước)
          if (!originalTextMap.has(textNode) || (lastEn !== undefined && val !== lastEn)) {
            originalTextMap.set(textNode, val);
            trackedTextNodes.add(textNode);
          }
          const baseVi = originalTextMap.get(textNode) ?? val;
          const translated = translateViTextToEn(baseVi);
          lastTranslatedMap.set(textNode, translated);
          if (translated !== val) {
            textNode.nodeValue = translated;
          }
        }
      }
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement;
      if (!shouldIgnoreNode(el)) {
        const placeholder = el.getAttribute('placeholder');
        const title = el.getAttribute('title');
        if (placeholder || title) {
          const lastAttr = lastTranslatedAttrMap.get(el);
          if (!originalAttrMap.has(el)) {
            originalAttrMap.set(el, {
              placeholder: placeholder ?? undefined,
              title: title ?? undefined,
            });
            trackedElements.add(el);
          } else {
            const orig = originalAttrMap.get(el) ?? {};
            if (placeholder && lastAttr?.placeholder && placeholder !== lastAttr.placeholder) {
              orig.placeholder = placeholder;
            }
            if (title && lastAttr?.title && title !== lastAttr.title) {
              orig.title = title;
            }
            originalAttrMap.set(el, orig);
          }
          const orig = originalAttrMap.get(el);
          let nextP = placeholder ?? undefined;
          let nextT = title ?? undefined;
          if (orig?.placeholder) {
            const trP = translateViTextToEn(orig.placeholder);
            nextP = trP;
            if (trP !== placeholder) el.setAttribute('placeholder', trP);
          }
          if (orig?.title) {
            const trT = translateViTextToEn(orig.title);
            nextT = trT;
            if (trT !== title) el.setAttribute('title', trT);
          }
          lastTranslatedAttrMap.set(el, { placeholder: nextP, title: nextT });
        }
      }
    }
    current = walker.nextNode();
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('vi');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === 'en' || saved === 'vi') {
        setLocaleState(saved);
      }
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === 'vi' ? 'en' : 'vi';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
        document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (viText: string, enOverride?: string) => {
      if (locale === 'vi') return viText;
      if (enOverride) return enOverride;
      return translateViTextToEn(viText);
    },
    [locale]
  );

  // Tự động áp dụng dịch DOM khi đổi ngôn ngữ hoặc khi trang/Suspense stream nội dung mới
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;

    let isApplying = false;
    const runPass = () => {
      if (isApplying) return;
      isApplying = true;
      try {
        applyDomTranslation(document.body, locale);
      } finally {
        isApplying = false;
      }
    };

    runPass();

    if (locale !== 'en') return;

    let rafId: number | null = null;
    const observer = new MutationObserver(() => {
      if (isApplying) return;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        runPass();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
