// AG-16 — Lớp cache Next.js cho dữ liệu công khai.
// Toàn bộ kết quả gắn tag PUBLIC_RECIPES_TAG; route publish gọi revalidateTag để
// bản mới (và redirect từ bản ARCHIVED) có hiệu lực ngay sau khi duyệt.
import { cacheLife, cacheTag } from 'next/cache';
import {
  queryCurrentSlugForArchived,
  queryPublishedRecipeBySlug,
  queryPublishedRecipeCards,
} from './publicQueries';

export const PUBLIC_RECIPES_TAG = 'public-recipes';

export async function getPublishedRecipeBySlug(slug: string) {
  'use cache';
  cacheTag(PUBLIC_RECIPES_TAG);
  cacheLife('days');
  return queryPublishedRecipeBySlug(slug);
}

export async function getCurrentSlugForArchived(slug: string) {
  'use cache';
  cacheTag(PUBLIC_RECIPES_TAG);
  cacheLife('days');
  return queryCurrentSlugForArchived(slug);
}

export async function listPublishedRecipes(limit = 12) {
  'use cache';
  cacheTag(PUBLIC_RECIPES_TAG);
  cacheLife('days');
  return queryPublishedRecipeCards(limit);
}
