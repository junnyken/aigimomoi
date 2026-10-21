#!/usr/bin/env node
/**
 * Migration Runner for Production/Docker Deployments — Ăn Gì Mom
 * Đọc drizzle/meta/_journal.json, kiểm tra drizzle.__drizzle_migrations,
 * và áp dụng các file SQL còn thiếu một cách tuần tự, idempotent và fail-closed.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const containerName = process.env.POSTGRES_CONTAINER || 'angimom_prod_postgres';
const dbUser = process.env.POSTGRES_USER || 'angimom';
const dbName = process.env.POSTGRES_DB || 'angimom_prod';
const journalPath = path.join(__dirname, '..', 'drizzle', 'meta', '_journal.json');

if (!fs.existsSync(journalPath)) {
  console.error(`❌ Lỗi: Không tìm thấy file journal tại ${journalPath}`);
  process.exit(1);
}

const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));

console.log(`🗄️ Bắt đầu tiến trình Migration qua container: ${containerName} (DB: ${dbName}, User: ${dbUser})...`);

// 1. Đảm bảo schema và bảng migration tracking tồn tại
const initSql = `
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
);
`;

try {
  execSync(`docker exec -i ${containerName} psql -v ON_ERROR_STOP=1 -U "${dbUser}" -d "${dbName}" -c "${initSql.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
} catch (err) {
  console.error('❌ Không thể khởi tạo bảng drizzle.__drizzle_migrations:', err.message);
  process.exit(1);
}

// 2. Chạy từng migration
let appliedCount = 0;
let skippedCount = 0;

for (const entry of journal.entries) {
  const checkCmd = `docker exec -i ${containerName} psql -t -A -U "${dbUser}" -d "${dbName}" -c "SELECT count(*) FROM drizzle.__drizzle_migrations WHERE created_at = ${entry.when};"`;
  let isApplied = false;
  try {
    const count = parseInt(execSync(checkCmd, { encoding: 'utf8' }).trim(), 10);
    isApplied = count > 0;
  } catch (err) {
    console.error(`❌ Lỗi khi kiểm tra trạng thái migration ${entry.tag}:`, err.message);
    process.exit(1);
  }

  if (isApplied) {
    console.log(`   -> [Đã áp dụng] ${entry.tag}.sql`);
    skippedCount++;
    continue;
  }

  const sqlFilePath = path.join(__dirname, '..', 'drizzle', `${entry.tag}.sql`);
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Lỗi: File migration không tồn tại: ${sqlFilePath}`);
    process.exit(1);
  }

  console.log(`   -> [Đang thực thi] ${entry.tag}.sql ...`);
  try {
    execSync(`docker exec -i ${containerName} psql -v ON_ERROR_STOP=1 -U "${dbUser}" -d "${dbName}" < "${sqlFilePath}"`, { stdio: 'inherit' });
    execSync(`docker exec -i ${containerName} psql -v ON_ERROR_STOP=1 -U "${dbUser}" -d "${dbName}" -c "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('${entry.tag}', ${entry.when});"`, { stdio: 'inherit' });
    console.log(`   ✅ Hoàn thành: ${entry.tag}.sql`);
    appliedCount++;
  } catch (err) {
    console.error(`❌ Migration thất bại tại ${entry.tag}.sql! Dừng tiến trình ngay lập tức (fail-closed).`);
    process.exit(1);
  }
}

console.log(`🎉 Hoàn tất migration! Mới áp dụng: ${appliedCount}, Đã có sẵn: ${skippedCount}, Tổng số: ${journal.entries.length}.`);
