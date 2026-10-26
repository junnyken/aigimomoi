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

// ============================================================================
// BỘ SƯU TẬP MÓN ĐÃ LƯU (SAVED COLLECTIONS / FOLDERS — HỌC TỪ COOKPAD & WHISK)
// ============================================================================

export interface RecipeCollection {
  id: string;
  name: string;
  icon: string;
  slugs: string[];
  isCustom?: boolean;
}

const COLLECTIONS_KEY = 'angimom_recipe_collections_v1';
const COLLECTIONS_EVENT = 'angimom_recipe_collections_changed';

const DEFAULT_COLLECTIONS: RecipeCollection[] = [
  { id: 'be-thich', name: 'Món bé thích', icon: '👶', slugs: [] },
  { id: 'nau-nhanh', name: 'Nấu nhanh 15 phút', icon: '⚡', slugs: [] },
  { id: 'tiet-kiem', name: 'Mâm cơm tiết kiệm', icon: '💰', slugs: [] },
  { id: 'cuoi-tuan', name: 'Cuối tuần đãi tiệc', icon: '🎉', slugs: [] },
];

function getLocalCollections(): RecipeCollection[] {
  if (typeof window === 'undefined') return DEFAULT_COLLECTIONS;
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY);
    if (!raw) return DEFAULT_COLLECTIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_COLLECTIONS;
    return parsed;
  } catch {
    return DEFAULT_COLLECTIONS;
  }
}

function setLocalCollections(collections: RecipeCollection[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    window.dispatchEvent(new Event(COLLECTIONS_EVENT));
  } catch {
    // Ignore storage error
  }
}

export function useRecipeCollections() {
  const [collections, setCollections] = useState<RecipeCollection[]>(() =>
    getLocalCollections()
  );

  useEffect(() => {
    function onChange() {
      setCollections(getLocalCollections());
    }
    window.addEventListener(COLLECTIONS_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(COLLECTIONS_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const createCollection = useCallback(
    (name: string, icon = '📁') => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const id = `col-${Date.now().toString(36)}`;
      const next: RecipeCollection[] = [
        ...collections,
        { id, name: trimmed, icon, slugs: [], isCustom: true },
      ];
      setCollections(next);
      setLocalCollections(next);
      return id;
    },
    [collections]
  );

  const deleteCollection = useCallback(
    (id: string) => {
      const next = collections.filter((c) => c.id !== id);
      setCollections(next);
      setLocalCollections(next);
    },
    [collections]
  );

  const toggleRecipeInCollection = useCallback(
    (collectionId: string, slug: string) => {
      const next = collections.map((col) => {
        if (col.id !== collectionId) return col;
        const exists = col.slugs.includes(slug);
        return {
          ...col,
          slugs: exists ? col.slugs.filter((s) => s !== slug) : [...col.slugs, slug],
        };
      });
      setCollections(next);
      setLocalCollections(next);
    },
    [collections]
  );

  const getRecipeCollections = useCallback(
    (slug: string) => collections.filter((c) => c.slugs.includes(slug)),
    [collections]
  );

  return {
    collections,
    createCollection,
    deleteCollection,
    toggleRecipeInCollection,
    getRecipeCollections,
  };
}
