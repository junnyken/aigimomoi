import fs from 'fs';
import path from 'path';
import { sql, eq } from 'drizzle-orm';
import { db, recipes, users, ingredients, taxonomies } from './index';
import { hashPassword } from '../auth/password';
import { seedProductionCatalog } from '../../scripts/seed_production_catalog';
import { calculateRecipeNutrition, seedNutritionStandards } from '../nutrition/calculator';
import { seedStandardTaxonomies } from '../recipes/standardTaxonomies';
import { logger } from '../logger';

let bootstrapPromise: Promise<void> | null = null;

export function ensureDatabaseBootstrapped(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().catch((err) => {
      logger.warn('Auto-bootstrap database skipped or failed (fallback catalog remains active)', {
        error: err instanceof Error ? err.message : String(err),
      });
      bootstrapPromise = null;
    });
  }
  return bootstrapPromise;
}

async function runBootstrap(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    return;
  }

  // 1. Kiểm tra kết nối DB
  await db.execute(sql`SELECT 1`);

  // 2. Đồng bộ toàn bộ file SQL migration trong thư mục drizzle/
  const journalPath = path.join(process.cwd(), 'drizzle', 'meta', '_journal.json');
  if (fs.existsSync(journalPath)) {
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as {
      entries: Array<{ idx: number; tag: string; when: number }>;
    };

    await db.execute(sql`
      CREATE SCHEMA IF NOT EXISTS drizzle;
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `);

    for (const entry of journal.entries) {
      const checkRes = await db.execute(
        sql`SELECT count(*)::int AS cnt FROM drizzle.__drizzle_migrations WHERE created_at = ${entry.when} OR hash = ${entry.tag}`
      );
      const cnt = Number((checkRes[0] as { cnt?: number } | undefined)?.cnt ?? 0);
      if (cnt > 0) continue;

      const sqlFilePath = path.join(process.cwd(), 'drizzle', `${entry.tag}.sql`);
      if (!fs.existsSync(sqlFilePath)) continue;

      const rawSql = fs.readFileSync(sqlFilePath, 'utf8');
      const statements = rawSql
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter(Boolean);

      logger.info(`Auto-applying migration ${entry.tag}.sql (${statements.length} statements)`);
      for (const stmt of statements) {
        await db.execute(sql.raw(stmt));
      }

      await db.execute(
        sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${entry.tag}, ${entry.when})`
      );
    }
  }

  // 3. Khởi tạo / đồng bộ tài khoản Admin & Editor từ SEED_ADMIN_PASSWORD / SEED_EDITOR_PASSWORD
  const adminPass = process.env.SEED_ADMIN_PASSWORD;
  if (adminPass && adminPass.length >= 8) {
    const passwordHash = await hashPassword(adminPass);
    for (const adminEmail of ['admin@angimom.vn', 'trieunt6@matbao.com']) {
      const existingAdmin = await db.query.users.findFirst({
        where: eq(users.email, adminEmail),
      });
      if (!existingAdmin) {
        await db.insert(users).values({
          email: adminEmail,
          displayName: 'Quản trị viên Ăn Gì Mom',
          role: 'ADMIN',
          passwordHash,
        });
      } else {
        await db
          .update(users)
          .set({ passwordHash, role: 'ADMIN' })
          .where(eq(users.id, existingAdmin.id));
      }
    }
  }

  const editorPass = process.env.SEED_EDITOR_PASSWORD;
  if (editorPass && editorPass.length >= 8) {
    const passwordHash = await hashPassword(editorPass);
    const existingEditor = await db.query.users.findFirst({
      where: eq(users.email, 'editor@angimom.vn'),
    });
    if (!existingEditor) {
      await db.insert(users).values({
        email: 'editor@angimom.vn',
        displayName: 'Biên tập viên Ăn Gì Mom',
        role: 'EDITOR',
        passwordHash,
      });
    } else {
      await db
        .update(users)
        .set({ passwordHash, role: 'EDITOR' })
        .where(eq(users.id, existingEditor.id));
    }
  }

  // 4. Tự động seed bộ công thức món Việt chuẩn (bao gồm bộ Giảm cân · Ít Calo, Tập Gym · Tăng cơ & Yoga · Eat Clean) nếu chưa có
  const existingYogaGymBatch = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.slug, 'poke-bowl-ca-hoi-bo-gao-lut-yoga-gym'))
    .limit(1);

  if (existingYogaGymBatch.length === 0) {
    logger.info('Seeding updated production catalog (including Yoga, Eat Clean & Gym/Macro recipes)...');
    await seedProductionCatalog();
    logger.info('Auto-seed production catalog completed!');
  }

  // 4b. Tự động seed Từ điển Nguyên liệu Việt Nam mở rộng (~185 nguyên liệu + FCT) nếu chưa có
  const existingFullCatalogIng = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(eq(ingredients.slug, 'yen-mach'))
    .limit(1);

  if (existingFullCatalogIng.length === 0) {
    logger.info('Seeding expanded Vietnamese ingredients & FCT nutrition dictionary...');
    await seedNutritionStandards();
    logger.info('Expanded Vietnamese ingredients dictionary seeded!');
  }

  // 4c. Tự động seed Hệ thống Phân loại Đa trục chuẩn Việt Nam (bao gồm Yoga · Thanh lọc & Dễ tiêu) nếu chưa có
  const existingStandardTax = await db
    .select({ id: taxonomies.id })
    .from(taxonomies)
    .where(eq(taxonomies.slug, 'yoga-thanh-loc'))
    .limit(1);

  if (existingStandardTax.length === 0) {
    logger.info('Seeding standard Vietnamese culinary & nutrition taxonomies (including Yoga & Gym)...');
    await seedStandardTaxonomies();
    logger.info('Standard taxonomies seeded!');
  }

  // 5. Đảm bảo tất cả công thức đều có Snapshot Dinh dưỡng 100% cho từng thành phần
  const allRecipes = await db
    .select({
      id: recipes.id,
      nutritionSnapshot: recipes.nutritionSnapshot,
    })
    .from(recipes);

  for (const r of allRecipes) {
    const snap = r.nutritionSnapshot as { coveragePercent?: number } | null;
    if (!snap || (snap.coveragePercent ?? 0) < 100) {
      try {
        await calculateRecipeNutrition(r.id);
      } catch {
        // Bỏ qua nếu có lỗi đơn lẻ
      }
    }
  }
}
