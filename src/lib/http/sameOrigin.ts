import type { NextRequest } from 'next/server';

/**
 * Phòng thủ CSRF cho các endpoint thay đổi trạng thái dùng cookie session:
 * yêu cầu header Origin (hoặc Referer) trùng host của request.
 */
export function isSameOrigin(request: Request | NextRequest): boolean {
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const host = rawHost?.split(',')[0]?.trim();
  if (!host) return false;

  const source = request.headers.get('origin') || request.headers.get('referer');
  if (!source) return false; // fail closed

  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

/**
 * Kiểm tra xem request từ trình duyệt có phải là Cross-Site (CSRF) hay không.
 * Chặn khi trình duyệt gửi `Sec-Fetch-Site: cross-site` hoặc `Origin`/`Referer` khác `Host`.
 */
export function isCrossSiteRequest(request: Request | NextRequest): boolean {
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') return true;

  const source = request.headers.get('origin') || request.headers.get('referer');
  if (!source) return false;

  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const host = rawHost?.split(',')[0]?.trim();
  if (!host) return false;

  try {
    return new URL(source).host !== host;
  } catch {
    return true;
  }
}
