// Bộ giới hạn tần suất (Rate Limiter) nhẹ trong bộ nhớ cho các API xác thực & nhạy cảm.
// Tự động dọn dẹp các khóa hết hạn để tránh rò rỉ bộ nhớ (Memory Leak).

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();
const MAX_BUCKETS = 2000;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'local';
}

export function checkRateLimit(
  namespace: string,
  identifier: string,
  maxRequests: number,
  windowMs: number = 60_000
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets.entries()) {
      if (now >= v.resetAt) {
        buckets.delete(k);
      }
    }
  }

  const key = `${namespace}:${identifier}`;
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
