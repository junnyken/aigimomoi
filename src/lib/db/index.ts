import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

const connectionString = process.env.DATABASE_URL || 'postgres://angimom:angimom_password@localhost:5432/angimom_db';

const isLocalDatabase =
  connectionString.includes('localhost') ||
  connectionString.includes('127.0.0.1') ||
  connectionString.includes('@postgres:');

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    prepare: false, // Bắt buộc cho Supabase Transaction Pooler (Supavisor port 6543)
    ssl: isLocalDatabase ? false : 'require', // Tự động bật SSL khi kết nối Supabase / Cloud DB
    max: isLocalDatabase ? 10 : 5,
    connect_timeout: isLocalDatabase ? 3 : 10,
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
