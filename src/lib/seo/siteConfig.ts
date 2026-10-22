export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'https://angimom.vibe.tinhgon.xyz';
  return raw.replace(/\/+$/, '');
}

export function toAbsoluteUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const base = getSiteUrl();
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export function buildWebsiteJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'ĂN GÌ MOM',
        alternateName: 'An Gi Mom - Bữa cơm nhà, bớt nghĩ hôm nay ăn gì',
        url: siteUrl,
        description:
          'Nền tảng công thức nấu ăn gia đình Việt Nam, thực đơn giảm cân ít calo, thực đơn tập gym tăng cơ và bảng thành phần dinh dưỡng chuẩn Viện Dinh Dưỡng Quốc Gia.',
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'ĂN GÌ MOM',
        description:
          'Khám phá công thức nấu cơm nhà 3 miền, tự động tính Calo & Macro theo khẩu phần, ghép mâm cơm và lên thực đơn đi chợ thông minh.',
        publisher: {
          '@id': `${siteUrl}/#organization`,
        },
        inLanguage: ['vi-VN', 'en-US'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/mon-an?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}
