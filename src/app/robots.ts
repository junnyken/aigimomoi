import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://angimom.vn';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/editor/', '/api/', '/login'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
