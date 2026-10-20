import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://angimom:angimom_password@localhost:5432/angimom_db';

// Disable prefetch as it is not supported for "Transaction" pool mode if using PgBouncer
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
