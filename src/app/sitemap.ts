import type { MetadataRoute } from 'next';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes } from '@/lib/db/schema';
import { recipePath } from '@/lib/recipes/labels';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://angimom.vn';

  // 1. Các trang tĩnh công khai chính
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/mon-an`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/meal`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/da-luu`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/shopping`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // 2. Các công thức PUBLISHED từ Database (Invariants §5.1)
  try {
    const publishedRecipes = await db
      .select({
        slug: recipes.slug,
        publishedAt: recipes.publishedAt,
        updatedAt: recipes.updatedAt,
      })
      .from(recipes)
      .where(eq(recipes.status, 'PUBLISHED'))
      .orderBy(desc(recipes.publishedAt));

    const recipeRoutes: MetadataRoute.Sitemap = publishedRecipes.map((r) => ({
      url: `${baseUrl}${recipePath(r.slug)}`,
      lastModified: r.updatedAt || r.publishedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...recipeRoutes];
  } catch {
    // Fallback an toàn khi build không kết nối được database
    return staticRoutes;
  }
}
