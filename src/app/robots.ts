import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo/siteConfig';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/editor/',
        '/quan-tri/',
        '/api/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/profile',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
