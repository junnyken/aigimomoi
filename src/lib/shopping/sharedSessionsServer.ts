import { lt, sql } from 'drizzle-orm';
import { db, sharedShoppingSessions, type SharedShoppingCustomItem } from '@/lib/db';

const TOKEN_REGEX = /^[a-zA-Z0-9_-]{16,40}$/;

let ensureTablePromise: Promise<void> | null = null;

/** Đảm bảo bảng shared_shopping_sessions tồn tại trước khi autoBootstrap hoàn tất. */
export function ensureSharedShoppingTable(): Promise<void> {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "shared_shopping_sessions" (
          "token" text PRIMARY KEY NOT NULL,
          "meal_query" text NOT NULL,
          "servings" integer DEFAULT 4 NOT NULL,
          "checked_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
          "custom_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
          "expires_at" timestamp with time zone NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        );
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS "shared_shopping_sessions_expires_idx"
        ON "shared_shopping_sessions" ("expires_at");
      `);
    })().catch((err) => {
      ensureTablePromise = null;
      throw err;
    });
  }
  return ensureTablePromise;
}

export async function purgeExpiredShoppingSessions(): Promise<void> {
  try {
    await db
      .delete(sharedShoppingSessions)
      .where(lt(sharedShoppingSessions.expiresAt, new Date()));
  } catch {
    // Non-critical background cleanup
  }
}

export function isValidShoppingToken(token: string): boolean {
  return TOKEN_REGEX.test(token);
}

export function sanitizeCheckedKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const cleaned = raw
    .filter((k): k is string => typeof k === 'string')
    .map((k) => k.trim().slice(0, 120))
    .filter(Boolean);
  return Array.from(new Set(cleaned)).slice(0, 150);
}

export function sanitizeCustomItems(raw: unknown): SharedShoppingCustomItem[] {
  if (!Array.isArray(raw)) return [];
  const items: SharedShoppingCustomItem[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const obj = entry as Partial<SharedShoppingCustomItem>;
    const name = typeof obj.name === 'string' ? obj.name.trim().slice(0, 100) : '';
    const id = typeof obj.id === 'string' ? obj.id.trim().slice(0, 40) : '';
    if (!name || !id || seen.has(id)) continue;
    seen.add(id);
    items.push({
      id,
      name,
      checked: Boolean(obj.checked),
    });
    if (items.length >= 30) break;
  }

  return items;
}
