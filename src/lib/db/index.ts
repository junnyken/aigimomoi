import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

const connectionString = process.env.DATABASE_URL || 'postgres://angimom:angimom_password@localhost:5432/angimom_db';

const requiresSsl =
  connectionString.includes('supabase.co') ||
  connectionString.includes('supabase.com') ||
  connectionString.includes('neon.tech') ||
  connectionString.includes('sslmode=require');

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    prepare: false, // Tương thích cả PostgreSQL 16 chuẩn (Vibe Host / Docker) và Pooler
    ssl: requiresSsl ? 'require' : false,
    max: requiresSsl ? 5 : 10,
    connect_timeout: 3,
    idle_timeout: 20,
    max_lifetime: 300,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema: { ...schema, ...relations } });

/** Đóng pool kết nối — dùng cho script CLI (seed/test) để process thoát được. */
export async function closeDb(): Promise<void> {
  await client.end({ timeout: 5 });
}

export * from './schema';
export * from './relations';
