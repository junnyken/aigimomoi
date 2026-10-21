/**
 * Cloud / Supabase PostgreSQL Migration Runner — Ăn Gì Mom
 * Chạy trực tiếp toàn bộ file migration trong thư mục `drizzle/` qua biến môi trường `DATABASE_URL`
 * (Hỗ trợ đầy đủ Supabase Transaction Pooler / Session Pooler & SSL mà không cần Docker hay psql CLI).
 *
 * Cách chạy:
 *   npx tsx src/scripts/migrate_supabase.ts
 *   hoặc: npm run db:migrate:cloud
 */
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Lỗi: Chưa cấu hình biến môi trường DATABASE_URL (ví dụ: chuỗi kết nối Supabase PostgreSQL).');
  process.exit(1);
}

const isLocalDatabase =
  connectionString.includes('localhost') ||
  connectionString.includes('127.0.0.1') ||
  connectionString.includes('@postgres:');

const sql = postgres(connectionString, {
  prepare: false,
  ssl: isLocalDatabase ? false : 'require',
  max: 1,
  connect_timeout: 15,
});

async function runCloudMigrations() {
  const journalPath = path.join(process.cwd(), 'drizzle', 'meta', '_journal.json');
  if (!fs.existsSync(journalPath)) {
    console.error(`❌ Không tìm thấy file journal tại: ${journalPath}`);
    process.exit(1);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as {
    entries: Array<{ idx: number; tag: string; when: number }>;
  };

  console.log('☁️  Đang kết nối tới PostgreSQL (Supabase / Cloud) để kiểm tra Migration...');

  await sql.unsafe(`
    CREATE SCHEMA IF NOT EXISTS drizzle;
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);

  let appliedCount = 0;
  let skippedCount = 0;

  for (const entry of journal.entries) {
    const existing = await sql`
      SELECT count(*)::int AS cnt
      FROM drizzle.__drizzle_migrations
      WHERE created_at = ${entry.when} OR hash = ${entry.tag}
    `;

    if ((existing[0]?.cnt ?? 0) > 0) {
      console.log(`   ✔ [Đã có] ${entry.tag}.sql`);
      skippedCount++;
      continue;
    }

    const sqlFilePath = path.join(process.cwd(), 'drizzle', `${entry.tag}.sql`);
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Không tìm thấy file SQL: ${sqlFilePath}`);
    }

    const rawSql = fs.readFileSync(sqlFilePath, 'utf8');
    const statements = rawSql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`   ⏳ [Đang áp dụng] ${entry.tag}.sql (${statements.length} câu lệnh)...`);

    for (const stmt of statements) {
      await sql.unsafe(stmt);
    }

    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${entry.tag}, ${entry.when})
    `;

    console.log(`   ✅ Hoàn tất: ${entry.tag}.sql`);
    appliedCount++;
  }

  console.log(
    `\n🎉 Hoàn tất Migration trên Cloud/Supabase! Mới áp dụng: ${appliedCount}, Đã có sẵn: ${skippedCount}, Tổng: ${journal.entries.length}.`
  );
}

runCloudMigrations()
  .catch((err) => {
    console.error('❌ Lỗi khi chạy Cloud Migration:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
