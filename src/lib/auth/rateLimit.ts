// Bộ giới hạn tần suất (Rate Limiter) cho các API xác thực & nhạy cảm.
// - checkRateLimit: bộ đếm trong bộ nhớ (nhẹ, theo từng tiến trình), tự dọn khóa hết hạn.
// - checkRateLimitShared: bộ đếm trong PostgreSQL, dùng chung giữa các instance và không mất khi restart;
//   CSDL lỗi thì lùi về bộ đếm trong bộ nhớ (vẫn chặn, không mở toang).

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

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

export async function checkRateLimitShared(
  namespace: string,
  identifier: string,
  maxRequests: number,
  windowMs: number = 60_000
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = `${namespace}:${identifier}`;
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const rows = await db.execute(sql`
      INSERT INTO rate_limit_buckets (key, count, reset_at)
      VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limit_buckets.reset_at <= now() THEN 1 ELSE rate_limit_buckets.count + 1 END,
        reset_at = CASE WHEN rate_limit_buckets.reset_at <= now() THEN EXCLUDED.reset_at ELSE rate_limit_buckets.reset_at END
      RETURNING count, EXTRACT(EPOCH FROM (reset_at - now()))::float8 AS seconds_left
    `);
    const row = rows[0] as { count: number | string; seconds_left: number | string } | undefined;
    const count = Number(row?.count ?? 1);
    const retryAfterSeconds = Math.max(1, Math.ceil(Number(row?.seconds_left ?? windowSeconds)));

    // Dọn dẹp thưa các bucket đã hết hạn
    if (Math.random() < 0.01) {
      void db
        .execute(sql`DELETE FROM rate_limit_buckets WHERE reset_at < now() - interval '1 hour'`)
        .catch(() => {});
    }

    return { allowed: count <= maxRequests, retryAfterSeconds };
  } catch (err) {
    console.warn('[RateLimit] CSDL không sẵn sàng, dùng bộ đếm trong bộ nhớ:', err instanceof Error ? err.message : err);
    return checkRateLimit(namespace, identifier, maxRequests, windowMs);
  }
}
