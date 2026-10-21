'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'angimom_saved_recipes';
const EVENT_NAME = 'angimom_saved_recipes_changed';

function getLocalSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalSlugs(slugs: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // Quota exceeded hoặc private browsing
  }
}

/**
 * Hook quản lý trạng thái các món đã lưu (hỗ trợ cả khách vãng lai và user đã đăng nhập).
 */
export function useSavedRecipes() {
  const [savedSlugs, setSavedSlugs] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return getLocalSlugs();
    }
    return [];
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(() => typeof window !== 'undefined');

  const refresh = useCallback(async () => {
    // Thử fetch từ server xem user có đăng nhập không
    try {
      const local = getLocalSlugs();
      const res = await fetch('/api/saved-recipes');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.savedSlugs)) {
          // Gộp giữa server và local nếu có
          const merged = Array.from(new Set([...data.savedSlugs, ...local]));
          setSavedSlugs(merged);
          setLocalSlugs(merged);

          // Nếu có món ở local mà server chưa có, gửi sync
          const unSynced = local.filter((s) => !data.savedSlugs.includes(s));
          if (unSynced.length > 0) {
            fetch('/api/saved-recipes/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slugs: unSynced }),
            }).catch(() => {});
          }
        }
      }
    } catch {
      // Giữ local slugs nếu mất mạng hoặc chưa login
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();

    function onStorageChange() {
      setSavedSlugs(getLocalSlugs());
    }

    window.addEventListener(EVENT_NAME, onStorageChange);
    window.addEventListener('storage', onStorageChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onStorageChange);
      window.removeEventListener('storage', onStorageChange);
    };
  }, [refresh]);

  const isSaved = useCallback(
    (slug: string) => savedSlugs.includes(slug),
    [savedSlugs]
  );

  const toggleSave = useCallback(
    async (slug: string) => {
      const currentlySaved = savedSlugs.includes(slug);
      const nextSlugs = currentlySaved
        ? savedSlugs.filter((s) => s !== slug)
        : [...savedSlugs, slug];

      // Optimistic update
      setSavedSlugs(nextSlugs);
      setLocalSlugs(nextSlugs);

      // Gọi server nếu có session
      try {
        if (currentlySaved) {
          await fetch(`/api/saved-recipes?slug=${encodeURIComponent(slug)}`, {
            method: 'DELETE',
          });
        } else {
          await fetch('/api/saved-recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
          });
        }
      } catch {
        // Vẫn giữ ở local nếu server không phản hồi
      }

      return !currentlySaved;
    },
    [savedSlugs]
  );

  return {
    savedSlugs,
    isLoaded,
    isSaved,
    toggleSave,
  };
}
