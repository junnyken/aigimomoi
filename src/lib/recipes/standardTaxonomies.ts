import { db } from '@/lib/db';
import { taxonomies, recipes, recipeTags } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type TaxonomyTypeKey = 'CUISINE_REGION' | 'COOKING_METHOD' | 'DIET_PREFERENCE' | 'OCCASION';

export interface StandardTaxonomyDef {
  type: TaxonomyTypeKey;
  slug: string;
  name: string;
}

export const VIETNAMESE_STANDARD_TAXONOMIES: StandardTaxonomyDef[] = [
  // 1. Vùng miền ẩm thực (CUISINE_REGION)
  { type: 'CUISINE_REGION', slug: 'mien-bac', name: 'Miền Bắc' },
  { type: 'CUISINE_REGION', slug: 'mien-trung', name: 'Miền Trung' },
  { type: 'CUISINE_REGION', slug: 'mien-nam', name: 'Miền Nam' },
  { type: 'CUISINE_REGION', slug: 'mien-tay', name: 'Miền Tây sông nước' },
  { type: 'CUISINE_REGION', slug: 'am-thuc-hue', name: 'Cố đô Huế' },
  { type: 'CUISINE_REGION', slug: 'nam-trung-bo', name: 'Duyên hải Nam Trung Bộ' },
  { type: 'CUISINE_REGION', slug: 'tay-nguyen', name: 'Tây Nguyên & Núi rừng' },
  { type: 'CUISINE_REGION', slug: 'giao-thoa-quoc-te', name: 'Giao thoa Á – Âu (Healthy)' },

  // 2. Phương pháp chế biến (COOKING_METHOD)
  { type: 'COOKING_METHOD', slug: 'mon-kho', name: 'Món kho' },
  { type: 'COOKING_METHOD', slug: 'mon-canh', name: 'Món canh' },
  { type: 'COOKING_METHOD', slug: 'mon-xao', name: 'Món xào' },
  { type: 'COOKING_METHOD', slug: 'mon-hap-luoc', name: 'Luộc / Hấp thanh đạm' },
  { type: 'COOKING_METHOD', slug: 'ap-chao-nuong', name: 'Áp chảo / Nướng ít dầu' },
  { type: 'COOKING_METHOD', slug: 'noi-chien-khong-dau', name: 'Nồi chiên không dầu (Air Fryer)' },
  { type: 'COOKING_METHOD', slug: 'mon-chien', name: 'Chiên giòn / Rán' },
  { type: 'COOKING_METHOD', slug: 'mon-ham', name: 'Hầm / Ninh mềm' },
  { type: 'COOKING_METHOD', slug: 'goi-nom-salad', name: 'Gỏi / Nộm / Salad trộn' },
  { type: 'COOKING_METHOD', slug: 'mon-cuon', name: 'Món cuốn & Chấm' },
  { type: 'COOKING_METHOD', slug: 'pha-nuoc-cham', name: 'Pha nước chấm & Sốt' },
  { type: 'COOKING_METHOD', slug: 'nau-mot-noi', name: 'Nấu một nồi (One-Pan)' },

  // 3. Đặc tính & Dinh dưỡng (DIET_PREFERENCE)
  { type: 'DIET_PREFERENCE', slug: 'giam-can-it-calo', name: 'Giảm cân · Ít Calo' },
  { type: 'DIET_PREFERENCE', slug: 'tap-gym-tang-co', name: 'Tập Gym · Tăng cơ – Giảm mỡ' },
  { type: 'DIET_PREFERENCE', slug: 'yoga-thanh-loc', name: 'Yoga · Thanh lọc & Dễ tiêu' },
  { type: 'DIET_PREFERENCE', slug: 'thanh-dam', name: 'Thanh đạm' },
  { type: 'DIET_PREFERENCE', slug: 'eat-clean-viet', name: 'Eat Clean kiểu Việt' },
  { type: 'DIET_PREFERENCE', slug: 'giau-protein', name: 'Giàu Protein (Đạm cao)' },
  { type: 'DIET_PREFERENCE', slug: 'low-carb', name: 'Ít tinh bột (Low-Carb)' },
  { type: 'DIET_PREFERENCE', slug: 'giau-chat-xo', name: 'Giàu chất xơ & Vitamin' },
  { type: 'DIET_PREFERENCE', slug: 'it-muoi-tot-huyet-ap', name: 'Ít muối · Tốt huyết áp' },
  { type: 'DIET_PREFERENCE', slug: 'tot-tim-mach', name: 'Tốt cho tim mạch' },
  { type: 'DIET_PREFERENCE', slug: 'an-chay', name: 'Ăn chay / Thuần chay' },
  { type: 'DIET_PREFERENCE', slug: 'giai-nhiet-mua-he', name: 'Giải nhiệt mùa hè' },
  { type: 'DIET_PREFERENCE', slug: 'am-bung-ngay-lanh', name: 'Ấm bụng ngày mưa lạnh' },
  { type: 'DIET_PREFERENCE', slug: 'me-bau-sau-sinh', name: 'Mẹ bầu & Sau sinh' },
  { type: 'DIET_PREFERENCE', slug: 'mem-de-tieu', name: 'Mềm dễ tiêu (Cho bé & Người già)' },

  // 4. Dịp & Bữa cơm (OCCASION)
  { type: 'OCCASION', slug: 'bua-com-hang-ngay', name: 'Bữa cơm hàng ngày' },
  { type: 'OCCASION', slug: 'nhanh-gon-20-phut', name: 'Nhanh gọn ≤ 20 phút' },
  { type: 'OCCASION', slug: 'mang-com-di-lam', name: 'Mang cơm đi làm (Meal Prep)' },
  { type: 'OCCASION', slug: 'bua-sang-du-chat', name: 'Bữa sáng đủ chất' },
  { type: 'OCCASION', slug: 'bua-toi-nhe-bung', name: 'Bữa tối nhẹ bụng' },
  { type: 'OCCASION', slug: 'cuoi-tuan-doi-vi', name: 'Cuối tuần đổi vị' },
  { type: 'OCCASION', slug: 'tiec-gia-dinh', name: 'Tiệc gia đình & Đãi khách' },
  { type: 'OCCASION', slug: 'mam-co-le-tet', name: 'Mâm cỗ Lễ Tết & Đám giỗ' },
  { type: 'OCCASION', slug: 'ngay-ram-mung-mot', name: 'Ngày Rằm & Mùng Một' },
  { type: 'OCCASION', slug: 'tiet-kiem-cuoi-thang', name: 'Tiết kiệm cuối tháng' },
];

export async function seedStandardTaxonomies(): Promise<number> {
  let count = 0;
  const slugToId = new Map<string, number>();

  for (const item of VIETNAMESE_STANDARD_TAXONOMIES) {
    const [row] = await db
      .insert(taxonomies)
      .values({
        type: item.type,
        slug: item.slug,
        name: item.name,
      })
      .onConflictDoUpdate({
        target: taxonomies.slug,
        set: {
          type: item.type,
          name: item.name,
        },
      })
      .returning({ id: taxonomies.id, slug: taxonomies.slug });

    if (row) {
      slugToId.set(row.slug, row.id);
      count++;
    }
  }

  // Tự động gắn thêm các nhãn phù hợp cho các công thức hiện có để bộ lọc nhãn hoạt động phong phú
  const allRecipes = await db.select().from(recipes);
  for (const r of allRecipes) {
    const lower = `${r.name} ${r.shortDescription}`.toLowerCase();
    const totalTime = (r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0);
    const matchedSlugs = new Set<string>(['bua-com-hang-ngay']);

    if (totalTime <= 22) matchedSlugs.add('nhanh-gon-20-phut');
    if (r.caloriesPerServing && r.caloriesPerServing <= 320) {
      matchedSlugs.add('giam-can-it-calo');
      matchedSlugs.add('bua-toi-nhe-bung');
      matchedSlugs.add('eat-clean-viet');
    }
    if (lower.includes('hấp') || lower.includes('luộc')) matchedSlugs.add('mon-hap-luoc');
    if (lower.includes('áp chảo') || lower.includes('nướng')) matchedSlugs.add('ap-chao-nuong');
    if (lower.includes('gỏi') || lower.includes('salad') || lower.includes('trộn')) matchedSlugs.add('goi-nom-salad');
    if (lower.includes('cuốn')) matchedSlugs.add('mon-cuon');
    if (lower.includes('hầm') || lower.includes('ninh')) matchedSlugs.add('mon-ham');
    if (lower.includes('chiên') || lower.includes('rán')) matchedSlugs.add('mon-chien');
    if (r.role === 'DIPPING_SAUCE') matchedSlugs.add('pha-nuoc-cham');
    if (lower.includes('protein') || lower.includes('tăng cơ') || lower.includes('ức gà') || lower.includes('thăn bò') || lower.includes('cá hồi')) {
      matchedSlugs.add('giau-protein');
      matchedSlugs.add('mang-com-di-lam');
    }
    if (
      lower.includes('yoga') ||
      lower.includes('eat clean') ||
      lower.includes('thanh lọc') ||
      lower.includes('bơ sáp') ||
      lower.includes('yến mạch') ||
      lower.includes('hạt chia') ||
      lower.includes('rong biển') ||
      lower.includes('sữa chua hy lạp') ||
      lower.includes('salad') ||
      lower.includes('gỏi cuốn')
    ) {
      matchedSlugs.add('yoga-thanh-loc');
      matchedSlugs.add('eat-clean-viet');
    }
    if (lower.includes('đậu hũ') || lower.includes('chay') || lower.includes('nấm')) {
      matchedSlugs.add('ngay-ram-mung-mot');
    }
    if (lower.includes('canh') || lower.includes('bầu') || lower.includes('bí') || lower.includes('mồng tơi') || lower.includes('rau')) {
      matchedSlugs.add('giau-chat-xo');
      matchedSlugs.add('giai-nhiet-mua-he');
    }
    if (lower.includes('gừng') || lower.includes('tiêu') || lower.includes('kho')) {
      matchedSlugs.add('am-bung-ngay-lanh');
    }

    for (const s of matchedSlugs) {
      const taxId = slugToId.get(s);
      if (taxId) {
        await db
          .insert(recipeTags)
          .values({ recipeId: r.id, taxonomyId: taxId })
          .onConflictDoNothing();
      }
    }
  }

  return count;
}
