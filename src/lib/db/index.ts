import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

const connectionString = process.env.DATABASE_URL || 'postgres://angimom:angimom_password@localhost:5432/angimom_db';

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema: { ...schema, ...relations } });

/** Đóng pool kết nối — dùng cho script CLI (seed/test) để process thoát được. */
export async function closeDb(): Promise<void> {
  await client.end({ timeout: 5 });
}

export * from './schema';
export * from './relations';
