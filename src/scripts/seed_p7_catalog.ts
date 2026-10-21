// AG-39: Mở rộng Catalog P7 — Món nước trọn bữa (ONE_DISH_MEAL), Món chay (VEGAN), Đồ uống (BEVERAGE) & Tráng miệng (DESSERT)
import { db, closeDb } from '../lib/db';
import { dishes, recipes, ingredients, recipeIngredients, cookingSteps, taxonomies, recipeTags, users } from '../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

interface RecipeP7SeedData {
  dishName: string;
  dishSlug: string;
  recipeName: string;
  recipeSlug: string;
  role: 'MAIN' | 'SOUP' | 'SIDE' | 'ONE_DISH_MEAL' | 'DESSERT' | 'BEVERAGE';
  shortDescription: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  baseServings: number;
  heroImage: string;
  taxonomySlugs: string[];
  ingredients: Array<{
    name: string;
    slug: string;
    category: string;
    standardUnit: string;
    amount: number;
    unit: string;
    scalePolicy: 'LINEAR' | 'FIXED' | 'MANUAL_ADJUST';
    preparation?: string;
    isOptional?: boolean;
  }>;
  steps: Array<{
    stepNumber: number;
    phaseName: string;
    instruction: string;
    timerSeconds?: number;
    tipText?: string;
  }>;
}

const P7_NEW_TAXONOMIES = [
  { type: 'DIET_PREFERENCE' as const, name: 'Ăn chay thuần (Vegan)', slug: 'an-chay-thuan' },
  { type: 'DIET_PREFERENCE' as const, name: 'Ăn chay thanh tịnh', slug: 'an-chay-thanh-tinh' },
  { type: 'OCCASION' as const, name: 'Món nước ăn sáng/trưa', slug: 'mon-nuoc-an-sang' },
  { type: 'OCCASION' as const, name: 'Tráng miệng giải nhiệt', slug: 'trang-mieng-giai-nhiet' },
];

const P7_RECIPES: RecipeP7SeedData[] = [
  {
    dishName: 'Phở bò Hà Nội',
    dishSlug: 'pho-bo-ha-noi',
    recipeName: 'Phở bò Hà Nội truyền thống nước dùng trong veo',
    recipeSlug: 'pho-bo-ha-noi-truyen-thong',
    role: 'ONE_DISH_MEAL',
    shortDescription: 'Tô phở bốc khói ngào ngạt hương hoa hồi, quế, thảo quả nướng; nước dùng trong veo ngọt thanh từ xương bò hầm liu riu; bánh phở mềm mướt quyện thịt bò tái lăn thơm nức.',
    difficulty: 'Khó',
    prepTimeMinutes: 30,
    cookTimeMinutes: 180,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-nuoc-an-sang'],
    ingredients: [
      { name: 'Xương ống bò', slug: 'xuong-ong-bo', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 1000, unit: 'g', scalePolicy: 'LINEAR', preparation: 'chần kỹ nước sôi gừng' },
      { name: 'Thịt bò phi lê', slug: 'thit-bo-phi-le', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 350, unit: 'g', scalePolicy: 'LINEAR', preparation: 'thái lát thật mỏng' },
      { name: 'Bánh phở tươi', slug: 'banh-pho-tuoi', category: 'Bún miến mì khô', standardUnit: 'g', amount: 600, unit: 'g', scalePolicy: 'LINEAR', preparation: 'chần nóng' },
      { name: 'Gừng già', slug: 'gung-gia', category: 'Gia vị & Hương liệu', standardUnit: 'g', amount: 50, unit: 'g', scalePolicy: 'FIXED', preparation: 'nướng xém vỏ đập dập' },
      { name: 'Hành tây', slug: 'hanh-tay', category: 'Rau củ tươi', standardUnit: 'g', amount: 150, unit: 'g', scalePolicy: 'LINEAR', preparation: '1 củ nướng, nửa củ bào mỏng' },
      { name: 'Hoa hồi và thảo quả', slug: 'hoa-hoi-thao-qua', category: 'Gia vị & Hương liệu', standardUnit: 'g', amount: 15, unit: 'g', scalePolicy: 'FIXED', preparation: 'rang thơm bọc túi vải' },
      { name: 'Hành lá và rau mùi', slug: 'hanh-la-rau-mui', category: 'Rau thơm gia vị', standardUnit: 'g', amount: 50, unit: 'g', scalePolicy: 'LINEAR', preparation: 'cắt nhỏ' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị cơ bản', standardUnit: 'ml', amount: 40, unit: 'ml', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế & Hầm xương', instruction: 'Rửa sạch xương ống, chần nước sôi với gừng đập dập 5 phút rồi rửa lại. Cho xương vào nồi 3.5 lít nước lạnh hầm liu riu 3 tiếng, liên tục vớt bọt để nước trong.', timerSeconds: 10800, tipText: 'Không đậy nung kín vung nồi để nước dùng không bị đục.' },
      { stepNumber: 2, phaseName: 'Thả hương liệu nướng', instruction: 'Nướng xém vỏ gừng, hành củ và rang thơm hoa hồi, thảo quả. Thả túi hương liệu vào nồi nước dùng ở 45 phút cuối cùng để dậy mùi thơm nồng nàn.', timerSeconds: 2700 },
      { stepNumber: 3, phaseName: 'Nêm nếm & Hoàn tất', instruction: 'Nêm nước mắm cốt ngon và muối hạt vừa miệng. Chần bánh phở xếp vào tô, trải thịt bò thái mỏng lên trên, rắc hành hoa rồi chan nước dùng đang sôi sùng sục.', tipText: 'Nước dùng phải thật sôi khi chan để thịt bò chín tái hồng ngọt mềm.' },
    ],
  },
  {
    dishName: 'Bún bò Huế',
    dishSlug: 'bun-bo-hue',
    recipeName: 'Bún bò Huế đậm đà chuẩn vị cố đô',
    recipeSlug: 'bun-bo-hue-chuan-vi-co-do',
    role: 'ONE_DISH_MEAL',
    shortDescription: 'Màu đỏ cam sóng sánh của dầu màu điều và sa tế sả ớt, hương mắm ruốc Huế quyến rũ, nạm bò giòn sần sật và chả cua béo ngậy.',
    difficulty: 'Khó',
    prepTimeMinutes: 30,
    cookTimeMinutes: 120,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1594998893017-36147cbcae05?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-trung', 'mon-nuoc-an-sang'],
    ingredients: [
      { name: 'Bắp bò hoặc nạm bò', slug: 'bap-bo-nam-bo', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 500, unit: 'g', scalePolicy: 'LINEAR', preparation: 'cuộn tròn bó chặt' },
      { name: 'Bún sợi to', slug: 'bun-soi-to', category: 'Bún miến mì khô', standardUnit: 'g', amount: 600, unit: 'g', scalePolicy: 'LINEAR' },
      { name: 'Sả cây', slug: 'sa-cay', category: 'Gia vị & Hương liệu', standardUnit: 'g', amount: 100, unit: 'g', scalePolicy: 'LINEAR', preparation: 'đập dập bó lại' },
      { name: 'Mắm ruốc Huế', slug: 'mam-ruoc-hue', category: 'Gia vị cơ bản', standardUnit: 'g', amount: 30, unit: 'g', scalePolicy: 'FIXED', preparation: 'hòa nước lạnh lọc trong' },
      { name: 'Ớt sa tế và dầu điều', slug: 'ot-sa-te-dau-dieu', category: 'Gia vị & Hương liệu', standardUnit: 'g', amount: 20, unit: 'g', scalePolicy: 'LINEAR' },
      { name: 'Hành tây và rau răm', slug: 'hanh-tay-rau-ram', category: 'Rau củ tươi', standardUnit: 'g', amount: 60, unit: 'g', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Nấu nước dùng sả', instruction: 'Luộc bắp bò cùng sả đập dập và chút muối cho đến khi thịt chín mềm vừa tới (khoảng 45 phút). Vớt thịt ra ngâm nước đá rồi thái lát.', timerSeconds: 2700 },
      { stepNumber: 2, phaseName: 'Pha mắm ruốc & sa tế', instruction: 'Khuấy mắm ruốc với nước lạnh cho lắng cặn, chỉ chắt lấy phần nước trong đổ vào nồi nước dùng. Phi thơm ớt sa tế với dầu màu điều rồi cho vào nồi tạo màu đặc trưng.' },
      { stepNumber: 3, phaseName: 'Thưởng thức', instruction: 'Chần bún sợi to, xếp thịt bắp bò, hành tây thái mỏng và chan ngập nước dùng thơm nức sả ruốc.' },
    ],
  },
  {
    dishName: 'Đậu hũ sốt cà chua chay',
    dishSlug: 'dau-hu-sot-ca-chua-chay',
    recipeName: 'Đậu hũ sốt cà chua thanh đạm giàu đạm thực vật',
    recipeSlug: 'dau-hu-sot-ca-chua-chay-thanh-dam',
    role: 'MAIN',
    shortDescription: 'Miếng đậu hũ chiên vàng ruộm bọc ngoài, bên trong mềm béo mịn màng, áo đều lớp sốt cà chua tươi sánh mịn thơm ngát mùi boa-rô.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['an-chay-thuan', 'an-chay-thanh-tinh', 'mon-xao', 'thanh-dam'],
    ingredients: [
      { name: 'Đậu hũ trắng', slug: 'dau-hu-trang', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: 'cắt miếng vuông vừa ăn' },
      { name: 'Cà chua chín', slug: 'ca-chua-chin-do', category: 'Rau củ tươi', standardUnit: 'g', amount: 300, unit: 'g', scalePolicy: 'LINEAR', preparation: 'băm nhuyễn' },
      { name: 'Hành boa-rô (tỏi tây)', slug: 'hanh-boa-ro', category: 'Rau thơm gia vị', standardUnit: 'g', amount: 40, unit: 'g', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Nước tương đậu nành', slug: 'nuoc-tuong-dau-nanh', category: 'Gia vị cơ bản', standardUnit: 'ml', amount: 25, unit: 'ml', scalePolicy: 'LINEAR' },
      { name: 'Hạt nêm nấm chay', slug: 'hat-nem-nam-chay', category: 'Gia vị cơ bản', standardUnit: 'g', amount: 10, unit: 'g', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Chiên đậu hũ', instruction: 'Thấm khô miếng đậu hũ. Cho vào chảo dầu nóng chiên vàng đều các mặt rồi vớt ra giấy thấm dầu.', timerSeconds: 420 },
      { stepNumber: 2, phaseName: 'Xào sốt cà chua', instruction: 'Phi thơm boa-rô với chút dầu ăn, trút cà chua băm vào xào nhuyễn với 50ml nước lọc, nêm nước tương và hạt nêm nấm chay cho vừa vị chua ngọt thanh dịu.', timerSeconds: 300 },
      { stepNumber: 3, phaseName: 'Om thấm vị', instruction: 'Trút đậu hũ đã chiên vào nồi sốt, đậy vung om liu riu 5 phút cho sốt ngấm vào từng thớ đậu, rắc thêm lá boa-rô xanh lên trên.', timerSeconds: 300 },
    ],
  },
  {
    dishName: 'Chè bưởi An Giang',
    dishSlug: 'che-buoi-an-giang',
    recipeName: 'Chè bưởi An Giang giòn sần sật béo ngậy nước cốt dừa',
    recipeSlug: 'che-buoi-an-giang-gion-san-sat',
    role: 'DESSERT',
    shortDescription: 'Cùi bưởi trong veo giòn tan không còn chút vị đắng, đậu xanh đồ chín tơi xốp quyện bột năng sánh mượt và chan nước cốt dừa béo ngậy thơm lừng.',
    difficulty: 'Trung bình',
    prepTimeMinutes: 40,
    cookTimeMinutes: 30,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-nam', 'trang-mieng-giai-nhiet'],
    ingredients: [
      { name: 'Cùi bưởi da xanh', slug: 'cui-buoi-da-xanh', category: 'Rau củ tươi', standardUnit: 'g', amount: 200, unit: 'g', scalePolicy: 'LINEAR', preparation: 'cắt hạt lựu khử đắng' },
      { name: 'Đậu xanh bóc vỏ', slug: 'dau-xanh-boc-vo', category: 'Bún miến mì khô', standardUnit: 'g', amount: 150, unit: 'g', scalePolicy: 'LINEAR', preparation: 'ngâm mềm hấp chín' },
      { name: 'Bột năng', slug: 'bot-nang-loc', category: 'Gia vị & Bột', standardUnit: 'g', amount: 100, unit: 'g', scalePolicy: 'LINEAR' },
      { name: 'Nước cốt dừa', slug: 'nuoc-cot-dua-tuoi', category: 'Gia vị cơ bản', standardUnit: 'ml', amount: 150, unit: 'ml', scalePolicy: 'LINEAR' },
      { name: 'Đường phèn', slug: 'duong-phen-sach', category: 'Gia vị cơ bản', standardUnit: 'g', amount: 120, unit: 'g', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Khử đắng cùi bưởi', instruction: 'Bóp cùi bưởi với muối hạt nhiều lần rồi xả sạch nước cho hết đắng. Luộc nhanh cùi bưởi qua nước sôi rồi ngâm nước đá để giữ độ giòn.', timerSeconds: 600 },
      { stepNumber: 2, phaseName: 'Áo bột năng', instruction: 'Ướp cùi bưởi với 40g đường cho tan, sau đó lăn đều qua bột năng rồi luộc trong nước sôi đến khi cùi nổi lên trong suốt thì vớt ra ngâm nước đường.' },
      { stepNumber: 3, phaseName: 'Nấu chè', instruction: 'Đun sôi nước với đường phèn, xuống bột năng từ từ khuấy đều tay tạo độ sánh. Trút đậu xanh đã hấp chín và cùi bưởi giòn vào khuấy đều. Múc ra chén chan nước cốt dừa.' },
    ],
  },
  {
    dishName: 'Nước sâm bí đao',
    dishSlug: 'nuoc-sam-bi-dao',
    recipeName: 'Nước sâm bí đao lá dứa hạt chia giải nhiệt mùa hè',
    recipeSlug: 'nuoc-sam-bi-dao-la-dua-hat-chia',
    role: 'BEVERAGE',
    shortDescription: 'Ly nước sâm mát lạnh màu nâu cánh gián thơm ngát hương lá dứa và la hán quả, vị ngọt thanh mát của đường phèn quyện cùng hạt chia giòn vui miệng.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 45,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['trang-mieng-giai-nhiet', 'giai-nhiet-mua-he'],
    ingredients: [
      { name: 'Bí đao già', slug: 'bi-dao-gia', category: 'Rau củ tươi', standardUnit: 'g', amount: 600, unit: 'g', scalePolicy: 'LINEAR', preparation: 'cắt khoanh dày để cả vỏ hạt' },
      { name: 'Lá dứa tươi', slug: 'la-dua-tuoi-thom', category: 'Rau thơm gia vị', standardUnit: 'g', amount: 50, unit: 'g', scalePolicy: 'LINEAR', preparation: 'rửa sạch bó lại' },
      { name: 'Quả la hán', slug: 'qua-la-han', category: 'Gia vị & Hương liệu', standardUnit: 'g', amount: 20, unit: 'g', scalePolicy: 'FIXED', preparation: 'bóp vỡ' },
      { name: 'Thục địa', slug: 'thuc-dia-den', category: 'Gia vị & Hương liệu', standardUnit: 'g', amount: 10, unit: 'g', scalePolicy: 'FIXED' },
      { name: 'Đường phèn', slug: 'duong-phen-sach', category: 'Gia vị cơ bản', standardUnit: 'g', amount: 80, unit: 'g', scalePolicy: 'LINEAR' },
      { name: 'Hạt chia', slug: 'hat-chia-organic', category: 'Bún miến mì khô', standardUnit: 'g', amount: 20, unit: 'g', scalePolicy: 'LINEAR', preparation: 'ngâm nở' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Nấu nước sâm', instruction: 'Cho bí đao, la hán quả, thục địa và lá dứa vào nồi với 2.5 lít nước lạnh. Đun sôi rồi hạ lửa nhỏ nấu liu riu 45 phút cho ra hết chất ngọt thanh.', timerSeconds: 2700 },
      { stepNumber: 2, phaseName: 'Lọc nước & Nêm đường', instruction: 'Vớt bỏ bã bí đao và thảo mộc, chắt nước qua rây sạch. Cho đường phèn vào khuấy tan hoàn toàn.', timerSeconds: 300 },
      { stepNumber: 3, phaseName: 'Làm mát & Uống', instruction: 'Để nguội rồi bảo quản trong ngăn mát tủ lạnh. Khi uống rót ra ly kèm đá lạnh và cho thêm 1 thìa hạt chia đã nở.' },
    ],
  },
];

async function seedP7() {
  console.log('--- SEEDING PHASE P7: EXPANDED CATALOG ---');
  
  // 1. Author
  const [editor] = await db.select().from(users).where(eq(users.role, 'EDITOR')).limit(1);
  const authorId = editor ? editor.id : 1;

  // 2. Taxonomies
  for (const tax of P7_NEW_TAXONOMIES) {
    const existing = await db.select().from(taxonomies).where(eq(taxonomies.slug, tax.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(taxonomies).values(tax);
      console.log(`+ Added taxonomy: ${tax.name} (${tax.slug})`);
    }
  }

  // 3. Recipes
  for (const item of P7_RECIPES) {
    let [dish] = await db.select().from(dishes).where(eq(dishes.slug, item.dishSlug)).limit(1);
    if (!dish) {
      [dish] = await db.insert(dishes).values({
        slug: item.dishSlug,
        name: item.dishName,
        defaultRole: item.role,
      }).returning();
      console.log(`+ Created dish: ${dish.name}`);
    }

    let [recipe] = await db.select().from(recipes).where(eq(recipes.slug, item.recipeSlug)).limit(1);
    if (!recipe) {
      [recipe] = await db.insert(recipes).values({
        dishId: dish.id,
        authorId,
        slug: item.recipeSlug,
        name: item.recipeName,
        role: item.role,
        shortDescription: item.shortDescription,
        status: 'PUBLISHED',
        difficulty: item.difficulty,
        prepTimeMinutes: item.prepTimeMinutes,
        cookTimeMinutes: item.cookTimeMinutes,
        baseServings: item.baseServings,
        heroImage: item.heroImage,
        isEditorialReviewed: true,
        // Invariants D23 & R1: Chưa nấu thử thực nghiệm trong bếp mẫu -> false
        isCookTested: false,
        publishedAt: new Date(),
      }).returning();
      console.log(`+ Created recipe: ${recipe.name} [${recipe.role}]`);

      // Tags
      const taxRecords = await db.select().from(taxonomies).where(inArray(taxonomies.slug, item.taxonomySlugs));
      for (const t of taxRecords) {
        await db.insert(recipeTags).values({
          recipeId: recipe.id,
          taxonomyId: t.id,
        });
      }

      // Ingredients
      let sortOrder = 1;
      for (const ingData of item.ingredients) {
        let [ing] = await db.select().from(ingredients).where(eq(ingredients.slug, ingData.slug)).limit(1);
        if (!ing) {
          [ing] = await db.insert(ingredients).values({
            slug: ingData.slug,
            name: ingData.name,
            category: ingData.category,
            standardUnit: ingData.standardUnit,
          }).returning();
        }

        await db.insert(recipeIngredients).values({
          recipeId: recipe.id,
          ingredientId: ing.id,
          amount: ingData.amount,
          unit: ingData.unit,
          scalePolicy: ingData.scalePolicy,
          sortOrder: sortOrder++,
          preparation: ingData.preparation,
          isOptional: ingData.isOptional || false,
        });
      }

      // Steps
      for (const stepData of item.steps) {
        await db.insert(cookingSteps).values({
          recipeId: recipe.id,
          stepNumber: stepData.stepNumber,
          phaseName: stepData.phaseName,
          instruction: stepData.instruction,
          timerSeconds: stepData.timerSeconds,
          tipText: stepData.tipText,
        });
      }
    } else {
      console.log(`= Recipe exists: ${recipe.name}`);
    }
  }

  console.log('✅ Phase P7 Catalog Seeding Complete!');
  await closeDb();
}

seedP7().catch((e) => {
  console.error('Seed P7 error:', e);
  process.exit(1);
});
