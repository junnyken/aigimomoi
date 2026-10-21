// R7 — Lớp cache Next.js cho hồ sơ người nấu công khai.
// Gắn chung PUBLIC_RECIPES_TAG (xuất bản món mới → làm mới hồ sơ) và CREATOR_PROFILES_TAG
// (người nấu sửa hồ sơ / admin xác minh → làm mới ngay).
import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { PUBLIC_RECIPES_TAG } from '@/lib/recipes/public';
import { getPublicCreatorBySlug } from './queries';

export const CREATOR_PROFILES_TAG = 'creator-profiles';

export async function getCachedPublicCreator(slug: string) {
  'use cache';
  cacheTag(PUBLIC_RECIPES_TAG, CREATOR_PROFILES_TAG);
  cacheLife('hours');
  return getPublicCreatorBySlug(slug);
}

/**
 * Làm mới cache hồ sơ + trang công thức (link "Chợ công thức · tên" nằm trong cache món).
 * Bỏ qua lỗi khi chạy ngoài runtime Next (script test gọi trực tiếp route handler).
 */
export function revalidateCreatorCaches(): void {
  try {
    revalidateTag(CREATOR_PROFILES_TAG, { expire: 0 });
    revalidateTag(PUBLIC_RECIPES_TAG, { expire: 0 });
  } catch {
    // ngoài Next runtime: không có cache để làm mới
  }
}
