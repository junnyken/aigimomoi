// R3 — Dựng cơ sở dữ liệu cho E2E/CI từ đầu: xóa schema, áp toàn bộ drizzle/*.sql theo thứ tự
// (dừng ngay khi có lỗi), rồi seed catalog thật.
// Chỉ chạy trên DB có tên chứa "_test" để không bao giờ đụng DB thật.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import postgres from 'postgres';

const url = process.env.DATABASE_URL ?? '';

function assertTestDatabase(connectionString: string) {
  let dbName = '';
  try {
    dbName = new URL(connectionString).pathname.replace(/^\//, '');
  } catch {
    // ignore
  }
  if (!dbName.endsWith('_test')) {
    console.error(`[e2e-db] Từ chối chạy: DATABASE_URL phải trỏ tới DB có tên kết thúc bằng "_test" (hiện tại: "${dbName || 'không đọc được'}").`);
    process.exit(2);
  }
}

async function main() {
  assertTestDatabase(url);
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    console.log('[e2e-db] Xóa schema public…');
    await sql.unsafe('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');

    const dir = path.join(process.cwd(), 'drizzle');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const statements = content
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of statements) {
        try {
          await sql.unsafe(stmt);
        } catch (err) {
          console.error(`[e2e-db] Migration lỗi ở ${file}:\n${stmt.slice(0, 300)}\n`, err);
          process.exit(1);
        }
      }
      console.log(`[e2e-db] ✓ ${file} (${statements.length} câu lệnh)`);
    }
  } finally {
    await sql.end();
  }

  for (const seed of ['src/scripts/seed_production_catalog.ts', 'src/scripts/seed_p7_catalog.ts', 'src/scripts/seed_e2e_creator.ts']) {
    console.log(`[e2e-db] Seed ${seed}…`);
    execFileSync('npx', ['tsx', seed], { stdio: 'inherit', env: process.env });
  }
  console.log('[e2e-db] Hoàn tất.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
