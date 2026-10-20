import type { NextRequest } from 'next/server';

/**
 * Phòng thủ CSRF tối thiểu cho các endpoint thay đổi trạng thái dùng cookie session:
 * yêu cầu header Origin (hoặc Referer) trùng host của request.
 * TODO(security): bổ sung CSRF token (double-submit) và rate limiting toàn cục cho API.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!host) return false;

  const source = request.headers.get('origin') || request.headers.get('referer');
  if (!source) return false; // fail closed

  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}
