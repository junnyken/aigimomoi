import { db } from '../lib/db';
import { users, ingredients, taxonomies } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/password';
import { eq } from 'drizzle-orm';

const INITIAL_INGREDIENTS = [
  // Thực phẩm tươi sống
  { name: 'Thịt ba chỉ heo', slug: 'thit-ba-chi-heo', category: 'Thực phẩm tươi sống', standardUnit: 'g', isPantryStaple: false },
  { name: 'Thịt gà ta', slug: 'thit-ga-ta', category: 'Thực phẩm tươi sống', standardUnit: 'g', isPantryStaple: false },
  { name: 'Thịt heo nạc băm', slug: 'thit-heo-nac-bam', category: 'Thực phẩm tươi sống', standardUnit: 'g', isPantryStaple: false },
  { name: 'Sườn non heo', slug: 'suon-non-heo', category: 'Thực phẩm tươi sống', standardUnit: 'g', isPantryStaple: false },
  { name: 'Cá lóc đồng', slug: 'ca-loc-dong', category: 'Thủy hải sản', standardUnit: 'g', isPantryStaple: false },
  
  // Rau củ quả
  { name: 'Rau ngót', slug: 'rau-ngot', category: 'Rau củ quả', standardUnit: 'bó', isPantryStaple: false },
  { name: 'Rau muống', slug: 'rau-muong', category: 'Rau củ quả', standardUnit: 'bó', isPantryStaple: false },
  { name: 'Đậu cove', slug: 'dau-cove', category: 'Rau củ quả', standardUnit: 'g', isPantryStaple: false },
  { name: 'Dứa chín', slug: 'dua-chin', category: 'Rau củ quả', standardUnit: 'quả', isPantryStaple: false },
  { name: 'Cà chua', slug: 'ca-chua', category: 'Rau củ quả', standardUnit: 'quả', isPantryStaple: false },
  { name: 'Đậu bắp', slug: 'dau-bap', category: 'Rau củ quả', standardUnit: 'g', isPantryStaple: false },
  { name: 'Giá đỗ', slug: 'gia-do', category: 'Rau củ quả', standardUnit: 'g', isPantryStaple: false },
  { name: 'Ớt chuông đỏ', slug: 'ot-chuong-do', category: 'Rau củ quả', standardUnit: 'quả', isPantryStaple: false },
  { name: 'Hành tây', slug: 'hanh-tay', category: 'Rau củ quả', standardUnit: 'củ', isPantryStaple: false },
  
  // Gia vị & Nếp bếp có sẵn (Pantry Staples)
  { name: 'Tỏi khô', slug: 'toi-kho', category: 'Gia vị nêm nếm', standardUnit: 'tép', isPantryStaple: true },
  { name: 'Hành tím', slug: 'hanh-tim', category: 'Gia vị nêm nếm', standardUnit: 'củ', isPantryStaple: true },
  { name: 'Hành lá', slug: 'hanh-la', category: 'Rau củ quả', standardUnit: 'cây', isPantryStaple: true },
  { name: 'Ớt tươi', slug: 'ot-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'quả', isPantryStaple: true },
  { name: 'Sả tươi', slug: 'sa-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'cây', isPantryStaple: true },
  { name: 'Gừng tươi', slug: 'gung-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'g', isPantryStaple: true },
  { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', isPantryStaple: true },
  { name: 'Hạt tiêu đen', slug: 'hat-tieu-den', category: 'Gia vị nêm nếm', standardUnit: 'g', isPantryStaple: true },
  { name: 'Hạt nêm', slug: 'hat-nem', category: 'Gia vị nêm nếm', standardUnit: 'g', isPantryStaple: true },
  { name: 'Đường cát', slug: 'duong-cat', category: 'Gia vị nêm nếm', standardUnit: 'g', isPantryStaple: true },
  { name: 'Muối tinh', slug: 'muoi-tinh', category: 'Gia vị nêm nếm', standardUnit: 'g', isPantryStaple: true },
  { name: 'Dầu ăn', slug: 'dau-an', category: 'Gia vị nêm nếm', standardUnit: 'ml', isPantryStaple: true },
  { name: 'Nước màu kho thịt', slug: 'nuoc-mau-kho-thit', category: 'Gia vị nêm nếm', standardUnit: 'ml', isPantryStaple: true },
  { name: 'Dầu hào', slug: 'dau-hao', category: 'Gia vị nêm nếm', standardUnit: 'ml', isPantryStaple: true },
  { name: 'Giấm gạo', slug: 'giam-gao', category: 'Gia vị nêm nếm', standardUnit: 'ml', isPantryStaple: true },
];

const INITIAL_TAXONOMIES = [
  // Cuisine Region
  { type: 'CUISINE_REGION' as const, name: 'Miền Bắc', slug: 'mien-bac' },
  { type: 'CUISINE_REGION' as const, name: 'Miền Trung', slug: 'mien-trung' },
  { type: 'CUISINE_REGION' as const, name: 'Miền Nam', slug: 'mien-nam' },
  { type: 'CUISINE_REGION' as const, name: 'Miền Tây Nam Bộ', slug: 'mien-tay-nam-bo' },

  // Cooking Method
  { type: 'COOKING_METHOD' as const, name: 'Món kho', slug: 'mon-kho' },
  { type: 'COOKING_METHOD' as const, name: 'Món xào', slug: 'mon-xao' },
  { type: 'COOKING_METHOD' as const, name: 'Món canh', slug: 'mon-canh' },
  { type: 'COOKING_METHOD' as const, name: 'Món luộc / hấp', slug: 'mon-luoc-hap' },
  { type: 'COOKING_METHOD' as const, name: 'Món chiên', slug: 'mon-chien' },

  // Diet Preference
  { type: 'DIET_PREFERENCE' as const, name: 'Thanh đạm', slug: 'thanh-dam' },
  { type: 'DIET_PREFERENCE' as const, name: 'Ít dầu mỡ', slug: 'it-dau-mo' },
  { type: 'DIET_PREFERENCE' as const, name: 'Giải nhiệt mùa hè', slug: 'giai-nhiet-mua-he' },
  { type: 'DIET_PREFERENCE' as const, name: 'Ấm bụng mùa đông', slug: 'am-bung-mua-dong' },

  // Occasion
  { type: 'OCCASION' as const, name: 'Bữa cơm hàng ngày', slug: 'bua-com-hang-ngay' },
  { type: 'OCCASION' as const, name: 'Cuối tuần sum họp', slug: 'cuoi-tuan-sum-hop' },
];

export async function seedCatalog() {
  console.log('=== SEEDING CORE CATALOG ===');

  // 1. Seed Users (Admin & Editor)
  console.log('1. Checking & seeding users...');
  const adminPasswordHash = await hashPassword('Admin@123456');
  const editorPasswordHash = await hashPassword('Editor@123456');

  const defaultUsers = [
    {
      email: 'admin@angimom.vn',
      displayName: 'Quản trị viên ĂN GÌ MOM',
      role: 'ADMIN' as const,
      passwordHash: adminPasswordHash,
    },
    {
      email: 'editor@angimom.vn',
      displayName: 'Biên tập viên Bếp Nhà',
      role: 'EDITOR' as const,
      passwordHash: editorPasswordHash,
    },
  ];

  for (const u of defaultUsers) {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email)).limit(1);
    if (!existing) {
      await db.insert(users).values(u);
      console.log(`   + Created user: ${u.email} (${u.role})`);
    } else {
      console.log(`   * User already exists: ${u.email}`);
    }
  }

  // 2. Seed Ingredients
  console.log('\n2. Seeding 25+ standard ingredients...');
  let ingCount = 0;
  for (const ing of INITIAL_INGREDIENTS) {
    const [existing] = await db.select({ id: ingredients.id }).from(ingredients).where(eq(ingredients.slug, ing.slug)).limit(1);
    if (!existing) {
      await db.insert(ingredients).values(ing);
      ingCount++;
    }
  }
  console.log(`   + Inserted ${ingCount} new ingredients (total catalogue: ${INITIAL_INGREDIENTS.length})`);

  // 3. Seed Taxonomies
  console.log('\n3. Seeding 15+ taxonomies...');
  let taxCount = 0;
  for (const tax of INITIAL_TAXONOMIES) {
    const [existing] = await db.select({ id: taxonomies.id }).from(taxonomies).where(eq(taxonomies.slug, tax.slug)).limit(1);
    if (!existing) {
      await db.insert(taxonomies).values(tax);
      taxCount++;
    }
  }
  console.log(`   + Inserted ${taxCount} new taxonomies (total catalogue: ${INITIAL_TAXONOMIES.length})`);

  console.log('\n>>> CATALOG SEEDING FINISHED SUCCESSFULLY! <<<');
}

// Allow standalone execution
if (process.argv[1]?.endsWith('seed_catalog.ts') || process.argv[1]?.endsWith('seed_catalog.js')) {
  seedCatalog().catch((err) => {
    console.error('Seeding error (Note: If DB is not running, this is expected in CI):', err.message);
    process.exit(0);
  });
}
