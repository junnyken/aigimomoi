import type { MetadataRoute } from 'next';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes } from '@/lib/db/schema';
import { recipePath } from '@/lib/recipes/labels';
import { getSiteUrl } from '@/lib/seo/siteConfig';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  // 1. Các trang tĩnh công khai chính + Landing pages chuyên mục SEO
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/mon-an`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/tinh-calo`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/meal`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ke-hoach-tuan`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tu-lanh`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shopping`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/da-luu`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/gioi-thieu`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/hoi-dap`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/chinh-sach-bao-mat`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/dieu-khoan`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Chuyên mục SEO trọng tâm (Món mặn, Món canh, Món rau, Giảm cân ít calo, Tập gym tăng cơ)
    {
      url: `${baseUrl}/mon-an?role=MAIN`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/mon-an?role=SOUP`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/mon-an?role=SIDE`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/mon-an?tax=giam-can-it-calo`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mon-an?tax=tap-gym-tang-co`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
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
      lastModified: r.updatedAt || r.publishedAt || now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...recipeRoutes];
  } catch {
    // Fallback an toàn khi build không kết nối được database
    return staticRoutes;
  }
}
