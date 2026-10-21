// AG-26: Production Catalog Seeder — Bộ dữ liệu món ăn hoàn chỉnh cho MVP Pilot Gate P3
// Nạp tối thiểu 12 món ăn chuẩn mực (5 MAIN, 4 SOUP, 3 SIDE), đầy đủ 3 vai trò,
// nguyên liệu có scalePolicy rõ ràng, các bước nấu có timer và mẹo bếp, gắn thẻ taxonomy,
// và đạt trạng thái PUBLISHED với nhãn kiểm duyệt isCookTested & isEditorialReviewed.
// Chạy độc lập: npx tsx src/scripts/seed_production_catalog.ts

import { db, closeDb } from '../lib/db';
import { dishes, recipes, ingredients, recipeIngredients, cookingSteps, taxonomies, recipeTags, users } from '../lib/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { seedNutritionStandards, calculateRecipeNutrition } from '../lib/nutrition/calculator';

interface RecipeSeedData {
  dishName: string;
  dishSlug: string;
  recipeName: string;
  recipeSlug: string;
  role: 'MAIN' | 'SOUP' | 'SIDE' | 'DIPPING_SAUCE';
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

const PRODUCTION_RECIPES: RecipeSeedData[] = [
  // ===================== MÓN MẶN (MAIN) =====================
  {
    dishName: 'Thịt ba chỉ kho tiêu',
    dishSlug: 'thit-ba-chi-kho-tieu',
    recipeName: 'Thịt ba chỉ kho tiêu đậm đà',
    recipeSlug: 'thit-ba-chi-kho-tieu',
    role: 'MAIN',
    shortDescription: 'Thịt ba chỉ thái con chì vừa ăn, thắng nước màu cánh gián, kho liu riu đậm đà thơm cay nồng hạt tiêu xay.',
    difficulty: 'Dễ',
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-kho', 'bua-com-hang-ngay'],
    ingredients: [
      { name: 'Thịt ba chỉ heo', slug: 'thit-ba-chi-heo', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: 'thái con chì dày 1cm' },
      { name: 'Hành tím', slug: 'hanh-tim', category: 'Gia vị nêm nếm', standardUnit: 'củ', amount: 3, unit: 'củ', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      // D61: kịch bản nấu có tỏi băm → seed phải có; dùng cùng slug/đơn vị với rau muống xào tỏi để gộp được khi đi chợ.
      { name: 'Tỏi khô', slug: 'toi-kho', category: 'Gia vị nêm nếm', standardUnit: 'tép', amount: 3, unit: 'tép', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Hạt tiêu đen', slug: 'hat-tieu-den', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'muỗng cà phê', scalePolicy: 'MANUAL_ADJUST', preparation: 'xay vỡ hạt' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Đường cát', slug: 'duong-cat', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'muỗng canh', scalePolicy: 'LINEAR', preparation: 'thắng nước màu' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế & Ướp', instruction: 'Thịt chần qua nước sôi 1 phút rồi rửa sạch. Ướp với 1 muỗng canh nước mắm, hành tím và tỏi băm, 1/2 muỗng tiêu trong 15 phút.', timerSeconds: 900, tipText: 'Chần thịt sơ giúp miếng thịt thơm sạch và nước kho trong hơn.' },
      { stepNumber: 2, phaseName: 'Thắng nước màu', instruction: 'Đun 1 muỗng đường với chút dầu ăn đến màu cánh gián đậm thì cho thịt vào đảo săn đều.', timerSeconds: 180, tipText: 'Canh lửa nhỏ khi thắng đường để tránh bị cháy khét.' },
      { stepNumber: 3, phaseName: 'Kho liu riu', instruction: 'Thêm nước mắm và 50ml nước sôi xâm xấp mặt thịt, đậy vung đun nhỏ lửa 20 phút đến khi nước sốt keo sánh quyện.', timerSeconds: 1200 },
      { stepNumber: 4, phaseName: 'Hoàn thiện', instruction: 'Rắc hạt tiêu đen xay và hành hoa lên trên, tắt bếp và múc ra đĩa dùng nóng với cơm trắng.', tipText: 'Nên ăn cùng rau luộc chấm nước thịt kho rất đưa cơm.' },
    ],
  },
  {
    dishName: 'Gà rang gừng lá chanh',
    dishSlug: 'ga-rang-gung-la-chanh',
    recipeName: 'Gà rang gừng lá chanh ấm bụng',
    recipeSlug: 'ga-rang-gung-la-chanh',
    role: 'MAIN',
    shortDescription: 'Thịt gà ta chắc thịt rang xém cạnh vàng ruộm, thơm nức mùi gừng tươi và lá chanh thái chỉ, vị đậm đà ấm bụng.',
    difficulty: 'Dễ',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-xao', 'am-bung-mua-dong'],
    ingredients: [
      { name: 'Thịt gà ta', slug: 'thit-ga-ta', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 600, unit: 'g', scalePolicy: 'LINEAR', preparation: 'chặt miếng vừa ăn' },
      { name: 'Gừng tươi', slug: 'gung-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'nhánh', scalePolicy: 'FIXED', preparation: 'thái sợi chỉ' },
      { name: 'Hành tím', slug: 'hanh-tim', category: 'Gia vị nêm nếm', standardUnit: 'củ', amount: 2, unit: 'củ', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế & Ướp', instruction: 'Thịt gà xát muối rửa sạch, chặt miếng vừa ăn. Ướp với 1 muỗng nước mắm và hành băm trong 10 phút.', timerSeconds: 600 },
      { stepNumber: 2, phaseName: 'Rang xém cạnh', instruction: 'Phi thơm một nửa lượng gừng rồi cho gà vào đảo lửa lớn đến khi da gà săn xém cạnh và tiết mỡ vàng.', timerSeconds: 300, tipText: 'Đảo lửa lớn giúp da gà giòn dai không bị chảy nước.' },
      { stepNumber: 3, phaseName: 'Đảo ngấm vị', instruction: 'Hạ lửa vừa, cho phần gừng còn lại cùng 1 muỗng nước mắm vào đảo đều trong 10 phút cho ngấm đượm vị cay ấm.', timerSeconds: 600 },
      { stepNumber: 4, phaseName: 'Hoàn thiện', instruction: 'Tắt bếp, rắc lá chanh thái chỉ mỏng lên trên rồi đảo đều cho dậy mùi thơm nức.' },
    ],
  },
  {
    dishName: 'Cá basa kho tộ',
    dishSlug: 'ca-basa-kho-to',
    recipeName: 'Cá basa kho tộ nước dừa',
    recipeSlug: 'ca-basa-kho-to',
    role: 'MAIN',
    shortDescription: 'Khúc cá basa béo ngậy được kho trong nồi đất với nước màu dừa, ớt hiểm và đầu hành lá, nước kho sánh quyện đậm đà.',
    difficulty: 'Trung bình',
    prepTimeMinutes: 20,
    cookTimeMinutes: 30,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-nam', 'mon-kho', 'bua-com-hang-ngay'],
    ingredients: [
      { name: 'Cá lóc đồng', slug: 'ca-loc-dong', category: 'Thủy hải sản', standardUnit: 'g', amount: 500, unit: 'g', scalePolicy: 'LINEAR', preparation: 'cắt khúc làm sạch' },
      { name: 'Thịt ba chỉ heo', slug: 'thit-ba-chi-heo', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 100, unit: 'g', scalePolicy: 'LINEAR', preparation: 'thái mỏng tạo mỡ béo' },
      { name: 'Hành tím', slug: 'hanh-tim', category: 'Gia vị nêm nếm', standardUnit: 'củ', amount: 3, unit: 'củ', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 3, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Ớt tươi', slug: 'ot-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'quả', amount: 2, unit: 'quả', scalePolicy: 'MANUAL_ADJUST', preparation: 'để nguyên quả' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Ướp cá', instruction: 'Ướp cá với nước mắm, đường, hành tím băm và ớt trong 20 phút cho thấm gia vị.', timerSeconds: 1200 },
      { stepNumber: 2, phaseName: 'Rán thịt mỡ', instruction: 'Cho thịt ba chỉ vào nồi đất đảo săn để tiết ra mỡ béo thơm.', timerSeconds: 180 },
      { stepNumber: 3, phaseName: 'Kho tộ', instruction: 'Xếp cá vào nồi đất, đun sôi bùng 2 phút rồi hạ lửa liu riu trong 25 phút cho nước kho keo sánh lại.', timerSeconds: 1500, tipText: 'Kho bằng nồi đất giữ nhiệt lâu và cá chắc thịt hơn.' },
      { stepNumber: 4, phaseName: 'Hoàn thiện', instruction: 'Rắc hạt tiêu đen và đầu hành lá tước sợi, dùng nóng với cơm cháy hoặc cơm trắng.' },
    ],
  },
  {
    dishName: 'Sườn non rim chua ngọt',
    dishSlug: 'suon-non-rim-chua-ngot',
    recipeName: 'Sườn non rim chua ngọt chuẩn vị',
    recipeSlug: 'suon-non-rim-chua-ngot',
    role: 'MAIN',
    shortDescription: 'Từng miếng sườn non mềm róc xương ngập trong nước sốt chua ngọt bóng bẩy, vị hài hòa giữa giấm gạo, cà chua và đường thốt nốt.',
    difficulty: 'Trung bình',
    prepTimeMinutes: 20,
    cookTimeMinutes: 25,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-xao', 'cuoi-tuan-sum-hop'],
    ingredients: [
      { name: 'Sườn non heo', slug: 'suon-non-heo', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 500, unit: 'g', scalePolicy: 'LINEAR', preparation: 'chặt khúc 3-4cm' },
      { name: 'Cà chua', slug: 'ca-chua', category: 'Rau củ quả', standardUnit: 'quả', amount: 2, unit: 'quả', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Tỏi khô', slug: 'toi-kho', category: 'Gia vị nêm nếm', standardUnit: 'tép', amount: 4, unit: 'tép', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Giấm gạo', slug: 'giam-gao', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Đường cát', slug: 'duong-cat', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế sườn', instruction: 'Chần sườn qua nước sôi có chút muối, vớt ra rửa sạch để ráo.', timerSeconds: 300 },
      { stepNumber: 2, phaseName: 'Rán vàng mặt', instruction: 'Chiên sườn trên chảo dầu nóng đến khi hai mặt xém vàng nhẹ rồi gắp ra đĩa.', timerSeconds: 400 },
      { stepNumber: 3, phaseName: 'Pha sốt & rim', instruction: 'Phi thơm tỏi, xào cà chua nát nhuyễn rồi cho giấm, đường, nước mắm và sườn vào rim nhỏ lửa 15 phút.', timerSeconds: 900, tipText: 'Tỷ lệ vàng cho sốt chua ngọt là 2 mắm : 2 đường : 2 giấm.' },
      { stepNumber: 4, phaseName: 'Thành phẩm', instruction: 'Khi nước sốt sệt bóng bao bọc quanh miếng sườn thì rắc chút tiêu và tắt bếp.' },
    ],
  },
  {
    dishName: 'Thịt nạc xào ớt chuông',
    dishSlug: 'thit-nac-xao-ot-chuong',
    recipeName: 'Thịt nạc xào ớt chuông giòn ngọt',
    recipeSlug: 'thit-nac-xao-ot-chuong',
    role: 'MAIN',
    shortDescription: 'Thịt heo xắt mỏng xào nhanh cùng ớt chuông đỏ giòn ngọt, dậy mùi thơm của tỏi và dầu hào, màu sắc bắt mắt.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-xao', 'bua-com-hang-ngay'],
    ingredients: [
      { name: 'Thịt heo nạc băm', slug: 'thit-heo-nac-bam', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 300, unit: 'g', scalePolicy: 'LINEAR', preparation: 'thái mỏng' },
      { name: 'Ớt chuông đỏ', slug: 'ot-chuong-do', category: 'Rau củ quả', standardUnit: 'quả', amount: 2, unit: 'quả', scalePolicy: 'LINEAR', preparation: 'thái miếng vuông' },
      { name: 'Hành tây', slug: 'hanh-tay', category: 'Rau củ quả', standardUnit: 'củ', amount: 1, unit: 'củ', scalePolicy: 'LINEAR', preparation: 'bổ múi cau' },
      { name: 'Dầu hào', slug: 'dau-hao', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Ướp thịt', instruction: 'Ướp thịt với 1 muỗng dầu hào và chút tiêu xay trong 10 phút.', timerSeconds: 600 },
      { stepNumber: 2, phaseName: 'Xào thịt', instruction: 'Phi thơm tỏi băm, cho thịt vào xào nhanh lửa lớn vừa chín tới thì trút ra đĩa riêng.', timerSeconds: 180 },
      { stepNumber: 3, phaseName: 'Xào rau củ', instruction: 'Đảo ớt chuông và hành tây trên lửa lớn 2 phút cho giòn ngọt.', timerSeconds: 120 },
      { stepNumber: 4, phaseName: 'Hòa quyện', instruction: 'Trút thịt lại vào chảo rau củ, đảo đều 1 phút cho ngấm sốt rồi tắt bếp.' },
    ],
  },

  // ===================== MÓN CANH (SOUP) =====================
  {
    dishName: 'Canh rau ngót nấu thịt băm',
    dishSlug: 'canh-rau-ngot-thit-bam',
    recipeName: 'Canh rau ngót thịt băm thanh mát',
    recipeSlug: 'canh-rau-ngot-thit-bam',
    role: 'SOUP',
    shortDescription: 'Bát canh rau ngót xanh mướt, nước canh ngọt lịm tự nhiên từ thịt nạc thăn băm nhỏ, giải nhiệt ngày hè.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-canh', 'giai-nhiet-mua-he', 'thanh-dam'],
    ingredients: [
      { name: 'Rau ngót', slug: 'rau-ngot', category: 'Rau củ quả', standardUnit: 'bó', amount: 2, unit: 'bó', scalePolicy: 'LINEAR', preparation: 'tuốt lá, rửa sạch và vò nhẹ' },
      { name: 'Thịt heo nạc băm', slug: 'thit-heo-nac-bam', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 150, unit: 'g', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Hành tím', slug: 'hanh-tim', category: 'Gia vị nêm nếm', standardUnit: 'củ', amount: 1, unit: 'củ', scalePolicy: 'LINEAR', preparation: 'thái mỏng' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1, unit: 'muỗng canh', scalePolicy: 'MANUAL_ADJUST', preparation: 'nêm canh' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Xào thịt', instruction: 'Phi thơm hành tím, trút thịt băm vào xào săn với chút gia vị.', timerSeconds: 120 },
      { stepNumber: 2, phaseName: 'Nấu nước dùng', instruction: 'Đổ 800ml nước vào nồi đun sôi bùng, vớt bọt nếu có.', timerSeconds: 300 },
      { stepNumber: 3, phaseName: 'Nấu rau ngót', instruction: 'Cho rau ngót đã vò nhẹ vào nồi, đun sôi lại trong 2-3 phút cho rau vừa mềm chín tới thì nêm mắm và tắt bếp.', timerSeconds: 180, tipText: 'Vò nhẹ rau ngót trước khi nấu giúp rau mềm ngọt và không bị dai.' },
    ],
  },
  {
    dishName: 'Canh chua cá lóc miền Tây',
    dishSlug: 'canh-chua-ca-loc',
    recipeName: 'Canh chua cá lóc thơm lừng ngò om',
    recipeSlug: 'canh-chua-ca-loc',
    role: 'SOUP',
    shortDescription: 'Vị chua thanh mát từ me dốt, cá lóc ngọt thịt, giòn tươi từ dứa, cà chua và đậu bắp, ngào ngạt rau ngò om.',
    difficulty: 'Trung bình',
    prepTimeMinutes: 20,
    cookTimeMinutes: 15,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-nam', 'mon-canh', 'giai-nhiet-mua-he'],
    ingredients: [
      { name: 'Cá lóc đồng', slug: 'ca-loc-dong', category: 'Thủy hải sản', standardUnit: 'g', amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: 'làm sạch cắt khúc' },
      { name: 'Cà chua', slug: 'ca-chua', category: 'Rau củ quả', standardUnit: 'quả', amount: 2, unit: 'quả', scalePolicy: 'LINEAR', preparation: 'bổ múi cau' },
      { name: 'Dứa chín', slug: 'dua-chin', category: 'Rau củ quả', standardUnit: 'quả', amount: 0.5, unit: 'quả', scalePolicy: 'LINEAR', preparation: 'thái lát tam giác' },
      { name: 'Đậu bắp', slug: 'dau-bap', category: 'Rau củ quả', standardUnit: 'g', amount: 100, unit: 'g', scalePolicy: 'LINEAR', preparation: 'cắt vát chéo' },
      { name: 'Giá đỗ', slug: 'gia-do', category: 'Rau củ quả', standardUnit: 'g', amount: 100, unit: 'g', scalePolicy: 'LINEAR' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Nấu nước chua', instruction: 'Đun sôi 1 lít nước, cho nước cốt me dầm, dứa và cà chua vào đun sôi.', timerSeconds: 300 },
      { stepNumber: 2, phaseName: 'Nấu cá', instruction: 'Thả khúc cá lóc vào đun sôi 7 phút đến khi cá chín ngọt thịt.', timerSeconds: 420 },
      { stepNumber: 3, phaseName: 'Thêm rau củ', instruction: 'Cho đậu bắp và giá đỗ vào đun sôi bùng trong 1 phút rồi tắt bếp ngay.', timerSeconds: 60, tipText: 'Đậu bắp nấu nhanh chín, không nên đun lâu để giữ độ giòn.' },
      { stepNumber: 4, phaseName: 'Hoàn tất', instruction: 'Nêm 2 muỗng nước mắm ngon và rắc rau ngò om, ớt tươi thái lát lên mặt bát canh.' },
    ],
  },
  {
    dishName: 'Canh sườn nấu chua cà chua',
    dishSlug: 'canh-suon-nau-chua',
    recipeName: 'Canh sườn nấu chua thanh mát',
    recipeSlug: 'canh-suon-nau-chua',
    role: 'SOUP',
    shortDescription: 'Nước canh hầm từ sườn non ngọt đậm đà, kết hợp vị chua dìu dịu của cà chua và hành hoa thái nhỏ.',
    difficulty: 'Dễ',
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-canh', 'bua-com-hang-ngay'],
    ingredients: [
      { name: 'Sườn non heo', slug: 'suon-non-heo', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: 'chặt miếng vừa ăn' },
      { name: 'Cà chua', slug: 'ca-chua', category: 'Rau củ quả', standardUnit: 'quả', amount: 3, unit: 'quả', scalePolicy: 'LINEAR', preparation: 'bổ múi cau' },
      { name: 'Hành tím', slug: 'hanh-tim', category: 'Gia vị nêm nếm', standardUnit: 'củ', amount: 2, unit: 'củ', scalePolicy: 'LINEAR' },
      { name: 'Hành lá', slug: 'hanh-la', category: 'Rau củ quả', standardUnit: 'cây', amount: 3, unit: 'cây', scalePolicy: 'FIXED', preparation: 'thái nhỏ' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Hầm sườn', instruction: 'Chần sườn sạch rồi cho vào nồi cùng 1 lít nước hầm nhỏ lửa 20 phút cho mềm ngọt.', timerSeconds: 1200 },
      { stepNumber: 2, phaseName: 'Xào cà chua', instruction: 'Phi hành tím, xào cà chua mềm tạo màu đỏ đẹp rồi trút vào nồi canh sườn.', timerSeconds: 300 },
      { stepNumber: 3, phaseName: 'Nêm nếm & hoàn tất', instruction: 'Đun sôi thêm 5 phút, nêm gia vị vừa ăn rồi rắc hành hoa lên trên.', timerSeconds: 300 },
    ],
  },
  {
    dishName: 'Canh gà nấu gừng',
    dishSlug: 'canh-ga-nau-gung',
    recipeName: 'Canh gà nấu gừng thơm ấm',
    recipeSlug: 'canh-ga-nau-gung',
    role: 'SOUP',
    shortDescription: 'Canh gà ta nấu cùng gừng tươi thái sợi, nước dùng vàng óng sóng sánh, cay ấm nồng nàn giải cảm mùa đông.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-canh', 'am-bung-mua-dong'],
    ingredients: [
      { name: 'Thịt gà ta', slug: 'thit-ga-ta', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: 'chặt miếng nhỏ' },
      { name: 'Gừng tươi', slug: 'gung-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'nhánh', scalePolicy: 'FIXED', preparation: 'thái sợi mỏng' },
      { name: 'Hành lá', slug: 'hanh-la', category: 'Rau củ quả', standardUnit: 'cây', amount: 2, unit: 'cây', scalePolicy: 'FIXED' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Xào gà', instruction: 'Xào săn gà với gừng thái sợi và 1 muỗng mắm cho ngấm sâu vị thơm ấm.', timerSeconds: 300 },
      { stepNumber: 2, phaseName: 'Nấu nước canh', instruction: 'Đổ 900ml nước vào đun sôi bùng, hạ lửa vừa đun 15 phút cho gà chín mềm ngọt nước.', timerSeconds: 900 },
      { stepNumber: 3, phaseName: 'Thành phẩm', instruction: 'Nêm nếm lại cho vừa miệng, rắc hành hoa và múc ra tô thưởng thức nóng.', timerSeconds: 60 },
    ],
  },

  // ===================== MÓN RAU / PHỤ (SIDE) =====================
  {
    dishName: 'Rau muống xào tỏi',
    dishSlug: 'rau-muong-xao-toi',
    recipeName: 'Rau muống xào tỏi giòn xanh',
    recipeSlug: 'rau-muong-xao-toi',
    role: 'SIDE',
    shortDescription: 'Ngọn rau muống xanh mướt giòn sần sật, dậy mùi thơm lừng của tỏi phi vàng giòn rụm trên chảo lửa lớn.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-xao', 'thanh-dam'],
    ingredients: [
      { name: 'Rau muống', slug: 'rau-muong', category: 'Rau củ quả', standardUnit: 'bó', amount: 1, unit: 'bó (400g)', scalePolicy: 'LINEAR', preparation: 'nhặt lá già, rửa sạch' },
      { name: 'Tỏi khô', slug: 'toi-kho', category: 'Gia vị nêm nếm', standardUnit: 'tép', amount: 6, unit: 'tép', scalePolicy: 'LINEAR', preparation: 'đập dập' },
      { name: 'Dầu ăn', slug: 'dau-an', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Dầu hào', slug: 'dau-hao', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1, unit: 'muỗng canh', scalePolicy: 'MANUAL_ADJUST' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Chần sơ (tùy chọn)', instruction: 'Chần rau qua nước sôi có chút muối 30 giây rồi vớt ra âu nước đá để rau giòn xanh.', timerSeconds: 30, tipText: 'Nước đá giữ cho diệp lục của rau muống luôn xanh mướt.' },
      { stepNumber: 2, phaseName: 'Phi thơm tỏi', instruction: 'Làm nóng chảo với dầu ăn, phi thơm 1/2 lượng tỏi đập dập.', timerSeconds: 60 },
      { stepNumber: 3, phaseName: 'Xào lửa lớn', instruction: 'Bật lửa thật lớn, trút rau muống vào đảo nhanh tay trong 2 phút, nêm dầu hào và cho nốt tỏi còn lại vào đảo đều rồi tắt bếp ngay.', timerSeconds: 120 },
    ],
  },
  {
    dishName: 'Đậu hũ sốt cà chua',
    dishSlug: 'dau-hu-sot-ca-chua',
    recipeName: 'Đậu hũ sốt cà chua mềm béo',
    recipeSlug: 'dau-hu-sot-ca-chua',
    role: 'SIDE',
    shortDescription: 'Miếng đậu hũ chiên vàng ươm, mềm mọng ngập trong nước sốt cà chua sánh mịn, phủ đầy hành hoa thơm nức.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-kho', 'thanh-dam'],
    ingredients: [
      { name: 'Cà chua', slug: 'ca-chua', category: 'Rau củ quả', standardUnit: 'quả', amount: 3, unit: 'quả', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Hành tím', slug: 'hanh-tim', category: 'Gia vị nêm nếm', standardUnit: 'củ', amount: 1, unit: 'củ', scalePolicy: 'LINEAR', preparation: 'thái mỏng' },
      { name: 'Hành lá', slug: 'hanh-la', category: 'Rau củ quả', standardUnit: 'cây', amount: 2, unit: 'cây', scalePolicy: 'FIXED', preparation: 'thái nhỏ' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Nấu sốt cà', instruction: 'Phi thơm hành tím, trút cà chua băm vào xào nhuyễn cùng chút gia vị đến khi tạo thành sốt sánh đỏ.', timerSeconds: 300 },
      { stepNumber: 2, phaseName: 'Om đậu', instruction: 'Thả đậu hũ cắt miếng vuông vào chảo sốt, đậy vung nhỏ lửa 7 phút cho đậu ngấm đều sốt chua ngọt.', timerSeconds: 420 },
      { stepNumber: 3, phaseName: 'Hoàn thiện', instruction: 'Rắc hành lá thái nhỏ lên trên, múc ra đĩa sâu lòng và ăn cùng cơm nóng.', timerSeconds: 60 },
    ],
  },
  {
    dishName: 'Đậu cove xào tỏi',
    dishSlug: 'dau-cove-xao-toi',
    recipeName: 'Đậu cove xào tỏi giòn ngọt',
    recipeSlug: 'dau-cove-xao-toi',
    role: 'SIDE',
    shortDescription: 'Từng quả đậu cove xanh mướt tước sạch xơ, xào chín tới giữ trọn vị ngọt tự nhiên quyện cùng tỏi phi thơm phức.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 8,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-xao', 'thanh-dam'],
    ingredients: [
      { name: 'Đậu cove', slug: 'dau-cove', category: 'Rau củ quả', standardUnit: 'g', amount: 350, unit: 'g', scalePolicy: 'LINEAR', preparation: 'tước xơ, bẻ đôi' },
      { name: 'Tỏi khô', slug: 'toi-kho', category: 'Gia vị nêm nếm', standardUnit: 'tép', amount: 5, unit: 'tép', scalePolicy: 'LINEAR', preparation: 'đập dập' },
      { name: 'Dầu ăn', slug: 'dau-an', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Hạt nêm', slug: 'hat-nem', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'muỗng cà phê', scalePolicy: 'MANUAL_ADJUST' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế đậu', instruction: 'Đậu cove tước xơ 2 bên, rửa sạch và bẻ khúc 5cm.', timerSeconds: 300 },
      { stepNumber: 2, phaseName: 'Phi tỏi', instruction: 'Phi thơm tỏi đập dập với dầu ăn trên chảo nóng.', timerSeconds: 60 },
      { stepNumber: 3, phaseName: 'Xào đậu', instruction: 'Cho đậu vào đảo nhanh trên lửa lớn trong 5-6 phút, nêm hạt nêm vừa miệng rồi tắt bếp.', timerSeconds: 360, tipText: 'Thêm 2 muỗng nước lọc vào chảo khi xào giúp đậu nhanh chín mà không bị cháy.' },
    ],
  },

  // ===================== PHASE P3.5: MỞ RỘNG MÓN MẶN EAT CLEAN & CƠM NHÀ =====================
  {
    dishName: 'Ức gà hấp nấm xì dầu',
    dishSlug: 'uc-ga-hap-nam-xi-dau',
    recipeName: 'Ức gà hấp nấm hương xì dầu (Eat Clean giảm cân)',
    recipeSlug: 'uc-ga-hap-nam-xi-dau',
    role: 'MAIN',
    shortDescription: 'Ức gà phi lê mềm mọng không hề khô bở, hấp cách thủy cùng nấm hương, gừng sợi và nước tương thanh dịu — giàu đạm, cực ít béo.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['thanh-dam', 'bua-com-hang-ngay'],
    ingredients: [
      { name: 'Ức gà phi lê', slug: 'uc-ga-phi-le', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 450, unit: 'g', scalePolicy: 'LINEAR', preparation: 'khứa nhẹ bề mặt' },
      { name: 'Nấm hương / Nấm đùi gà', slug: 'nam-dong-co', category: 'Rau củ quả', standardUnit: 'g', amount: 150, unit: 'g', scalePolicy: 'LINEAR', preparation: 'thái lát' },
      { name: 'Gừng tươi', slug: 'gung-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'nhánh', scalePolicy: 'FIXED', preparation: 'thái sợi' },
      { name: 'Nước tương (Xì dầu)', slug: 'nuoc-tuong-dau-nanh', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Hành lá', slug: 'hanh-la', category: 'Rau củ quả', standardUnit: 'cây', amount: 2, unit: 'cây', scalePolicy: 'FIXED', preparation: 'cắt khúc' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế & Ướp', instruction: 'Ức gà rửa sạch thấm khô, ướp với 2 muỗng nước tương, gừng thái sợi và chút tiêu trong 10 phút.', timerSeconds: 600, tipText: 'Khứa nhẹ mặt thịt giúp ức gà nhanh ngấm và chín đều.' },
      { stepNumber: 2, phaseName: 'Hấp cách thủy', instruction: 'Xếp nấm dưới đáy đĩa sâu lòng, đặt ức gà lên trên rồi đưa vào xửng hấp lửa vừa 12-15 phút.', timerSeconds: 840 },
      { stepNumber: 3, phaseName: 'Hoàn thiện', instruction: 'Rắc hành lá cắt khúc lên trên, đậy vung thêm 1 phút rồi lấy ra thái miếng vừa ăn, rưới nước hấp nấm ngọt thanh lên mặt.' },
    ],
  },
  {
    dishName: 'Cá diêu hồng hấp gừng hành',
    dishSlug: 'ca-dieu-hong-hap-gung-hanh',
    recipeName: 'Cá diêu hồng hấp gừng hành hoa thanh đạm',
    recipeSlug: 'ca-dieu-hong-hap-gung-hanh',
    role: 'MAIN',
    shortDescription: 'Thịt cá diêu hồng trắng ngần ngọt lịm, hấp cùng gừng tươi, đầu hành trắng và chút xì dầu thơm dịu — món mặn lý tưởng cho người lớn tuổi và người giữ dáng.',
    difficulty: 'Dễ',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-nam', 'thanh-dam', 'cuoi-tuan-sum-hop'],
    ingredients: [
      { name: 'Cá diêu hồng', slug: 'ca-dieu-hong', category: 'Thủy hải sản', standardUnit: 'g', amount: 700, unit: 'g', scalePolicy: 'LINEAR', preparation: 'làm sạch, khứa chéo thân' },
      { name: 'Gừng tươi', slug: 'gung-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'nhánh', scalePolicy: 'FIXED', preparation: 'thái chỉ' },
      { name: 'Hành lá', slug: 'hanh-la', category: 'Rau củ quả', standardUnit: 'cây', amount: 4, unit: 'cây', scalePolicy: 'LINEAR', preparation: 'chẻ sợi phần đầu trắng' },
      { name: 'Nước tương (Xì dầu)', slug: 'nuoc-tuong-dau-nanh', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 2.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế khử tanh', instruction: 'Cá xát muối và chút gừng đập dập rửa sạch, khứa vài đường chéo trên mình cá rồi ướp 1 muỗng nước tương.', timerSeconds: 600 },
      { stepNumber: 2, phaseName: 'Hấp cá', instruction: 'Đặt cá lên đĩa cùng một nửa gừng sợi, hấp cách thủy 15-18 phút cho thịt cá chín trắng mềm.', timerSeconds: 1000 },
      { stepNumber: 3, phaseName: 'Trình bày', instruction: 'Trải phần hành lá chẻ sợi và gừng còn lại lên mình cá, rưới nước tương nóng lên trên rồi thưởng thức.' },
    ],
  },
  {
    dishName: 'Trứng chiên thịt băm hành hoa',
    dishSlug: 'trung-chien-thit-bam',
    recipeName: 'Trứng chiên thịt băm hành hoa vàng ươm',
    recipeSlug: 'trung-chien-thit-bam',
    role: 'MAIN',
    shortDescription: 'Món quốc dân của mọi gia đình Việt: trứng gà đánh bông quyện thịt nạc băm mềm ngọt và hành hoa thơm phức, bé nhỏ hay người lớn đều mê.',
    difficulty: 'Dễ',
    prepTimeMinutes: 5,
    cookTimeMinutes: 8,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'bua-com-hang-ngay'],
    ingredients: [
      { name: 'Trứng gà', slug: 'trung-ga', category: 'Thực phẩm tươi sống', standardUnit: 'quả', amount: 4, unit: 'quả', scalePolicy: 'LINEAR' },
      { name: 'Thịt heo nạc băm', slug: 'thit-heo-nac-bam', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 120, unit: 'g', scalePolicy: 'LINEAR' },
      { name: 'Hành lá', slug: 'hanh-la', category: 'Rau củ quả', standardUnit: 'cây', amount: 2, unit: 'cây', scalePolicy: 'LINEAR', preparation: 'thái nhỏ' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Dầu ăn', slug: 'dau-an', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Đánh trứng', instruction: 'Đập trứng gà vào tô cùng thịt nạc băm, hành lá thái nhỏ và 1 muỗng nước mắm, đánh đều tay.', timerSeconds: 120, tipText: 'Thêm 1 muỗng cà phê nước lọc giúp trứng chiên xốp mềm không bị khô.' },
      { stepNumber: 2, phaseName: 'Chiên vàng hai mặt', instruction: 'Làm nóng dầu ăn trên chảo, đổ trứng vào dàn đều, hạ lửa vừa chiên 3 phút mỗi mặt đến khi vàng ruộm.', timerSeconds: 360 },
      { stepNumber: 3, phaseName: 'Hoàn thiện', instruction: 'Cuộn tròn hoặc cắt miếng tam giác xếp ra đĩa, ăn nóng cùng cơm trắng và tương ớt/nước mắm.' },
    ],
  },
  {
    dishName: 'Thịt bò xào bông cải xanh',
    dishSlug: 'thit-bo-xao-bong-cai-xanh',
    recipeName: 'Thịt bò xào bông cải xanh giòn ngọt giàu sắt',
    recipeSlug: 'thit-bo-xao-bong-cai-xanh',
    role: 'MAIN',
    shortDescription: 'Thịt bò phi lê mềm ngọt xào lửa lớn cùng bông cải xanh và cà rốt giòn sần sật, bổ sung dồi dào đạm, sắt và chất xơ trong 15 phút.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 8,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mon-xao', 'bua-com-hang-ngay', 'thanh-dam'],
    ingredients: [
      { name: 'Thịt bò phi lê', slug: 'thit-bo-phi-le', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 250, unit: 'g', scalePolicy: 'LINEAR', preparation: 'thái lát mỏng ngang thớ' },
      { name: 'Bông cải xanh (Súp lơ xanh)', slug: 'bong-cai-xanh', category: 'Rau củ quả', standardUnit: 'g', amount: 350, unit: 'g', scalePolicy: 'LINEAR', preparation: 'tách nhánh vừa ăn' },
      { name: 'Cà rốt', slug: 'ca-rot', category: 'Rau củ quả', standardUnit: 'g', amount: 80, unit: 'g', scalePolicy: 'LINEAR', preparation: 'tỉa hoa thái mỏng' },
      { name: 'Tỏi khô', slug: 'toi-kho', category: 'Gia vị nêm nếm', standardUnit: 'tép', amount: 4, unit: 'tép', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Dầu hào', slug: 'dau-hao', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Dầu ăn', slug: 'dau-an', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế & Chần rau', instruction: 'Ướp thịt bò với tỏi băm và 1/2 muỗng dầu hào. Chần nhanh bông cải xanh và cà rốt qua nước sôi 1 phút rồi vớt ra để ráo.', timerSeconds: 180 },
      { stepNumber: 2, phaseName: 'Xào thịt bò lửa lớn', instruction: 'Phi thơm tỏi, cho thịt bò vào đảo nhanh tay trên lửa lớn 90 giây vừa chín tái thì trút ra đĩa.', timerSeconds: 90, tipText: 'Không xào thịt bò quá lâu trên chảo để giữ độ mềm ngọt.' },
      { stepNumber: 3, phaseName: 'Đảo gộp & Hoàn thiện', instruction: 'Cho bông cải và cà rốt vào đảo 2 phút với dầu hào, trút thịt bò trở lại đảo đều 30 giây rồi tắt bếp.' },
    ],
  },
  {
    dishName: 'Tôm sú rim mặn ngọt',
    dishSlug: 'tom-su-rim-man-ngot',
    recipeName: 'Tôm sú rim mặn ngọt bóng bẩy đưa cơm',
    recipeSlug: 'tom-su-rim-man-ngot',
    role: 'MAIN',
    shortDescription: 'Từng con tôm sú đỏ au săn chắc, áo đều lớp sốt mắm đường keo sánh bóng mượt, thơm nức mùi tỏi phi và hành lá.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 12,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-nam', 'mon-kho', 'bua-com-hang-ngay'],
    ingredients: [
      { name: 'Tôm sú / Tôm tươi', slug: 'tom-tuoi', category: 'Thủy hải sản', standardUnit: 'g', amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: 'cắt râu, rút chỉ lưng' },
      { name: 'Hành tím', slug: 'hanh-tim', category: 'Gia vị nêm nếm', standardUnit: 'củ', amount: 2, unit: 'củ', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Tỏi khô', slug: 'toi-kho', category: 'Gia vị nêm nếm', standardUnit: 'tép', amount: 3, unit: 'tép', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Đường cát', slug: 'duong-cat', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Dầu ăn', slug: 'dau-an', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế & Ướp tôm', instruction: 'Tôm rửa sạch để ráo, ướp với chút hành tỏi băm và 1/2 muỗng đường trong 10 phút cho thịt tôm trong và giòn.', timerSeconds: 600 },
      { stepNumber: 2, phaseName: 'Rim tôm', instruction: 'Phi thơm hành tỏi, cho tôm vào đảo lửa vừa đến khi vỏ tôm chuyển màu đỏ gạch săn lại thì nêm nước mắm và đường.', timerSeconds: 360 },
      { stepNumber: 3, phaseName: 'Hoàn thiện', instruction: 'Đảo đều thêm 3 phút cho sốt mắm đường áo bóng quanh vỏ tôm, rắc hành lá và tiêu xay rồi tắt bếp.' },
    ],
  },
  {
    dishName: 'Đậu hũ nhồi thịt sốt cà',
    dishSlug: 'dau-hu-nhoi-thit-sot-ca',
    recipeName: 'Đậu hũ nhồi thịt sốt cà chua đậm đà',
    recipeSlug: 'dau-hu-nhoi-thit-sot-ca',
    role: 'MAIN',
    shortDescription: 'Đậu hũ vàng mềm nhồi nhân thịt heo băm mộc nhĩ thơm ngọt, om trong nước sốt cà chua sánh đỏ chua dịu dễ ăn.',
    difficulty: 'Dễ',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-bac', 'mon-kho', 'bua-com-hang-ngay'],
    ingredients: [
      { name: 'Đậu phụ', slug: 'dau-phu', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 350, unit: 'g', scalePolicy: 'LINEAR', preparation: 'cắt miếng dày, khoét rỗng giữa' },
      { name: 'Thịt heo nạc băm', slug: 'thit-heo-nac-bam', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 200, unit: 'g', scalePolicy: 'LINEAR' },
      { name: 'Cà chua', slug: 'ca-chua', category: 'Rau củ quả', standardUnit: 'quả', amount: 3, unit: 'quả', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Hành tím', slug: 'hanh-tim', category: 'Gia vị nêm nếm', standardUnit: 'củ', amount: 2, unit: 'củ', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Dầu ăn', slug: 'dau-an', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Trộn nhân & Nhồi đậu', instruction: 'Trộn thịt băm với phần ruột đậu phụ nghiền nhỏ, hành tím và chút hạt tiêu rồi nhồi gọn vào từng miếng đậu.', timerSeconds: 480 },
      { stepNumber: 2, phaseName: 'Áp chảo mặt thịt', instruction: 'Đặt mặt có thịt úp xuống chảo dầu nóng áp chảo 3 phút cho se vàng định hình nhân.', timerSeconds: 180 },
      { stepNumber: 3, phaseName: 'Om sốt cà chua', instruction: 'Xào cà chua băm với nước mắm tạo sốt sánh, xếp đậu nhồi thịt vào om nhỏ lửa 12 phút cho chín thấm vị.', timerSeconds: 720 },
    ],
  },

  // ===================== PHASE P3.5: MỞ RỘNG MÓN CANH (SOUP) =====================
  {
    dishName: 'Canh bí đao nấu tôm tươi',
    dishSlug: 'canh-bi-dao-nau-tom',
    recipeName: 'Canh bí đao nấu tôm tươi thanh nhiệt ít Calo',
    recipeSlug: 'canh-bi-dao-nau-tom',
    role: 'SOUP',
    shortDescription: 'Miếng bí đao trong xanh mềm mát nấu cùng tôm tươi giã dập ngọt nước tự nhiên, cực kỳ thanh đạm cho thực đơn giảm cân.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mon-canh', 'giai-nhiet-mua-he', 'thanh-dam'],
    ingredients: [
      { name: 'Bí đao (Bí xanh)', slug: 'bi-dao', category: 'Rau củ quả', standardUnit: 'g', amount: 450, unit: 'g', scalePolicy: 'LINEAR', preparation: 'gọt vỏ, thái miếng dày 1cm' },
      { name: 'Tôm sú / Tôm tươi', slug: 'tom-tuoi', category: 'Thủy hải sản', standardUnit: 'g', amount: 150, unit: 'g', scalePolicy: 'LINEAR', preparation: 'bóc vỏ, băm thô' },
      { name: 'Hành lá', slug: 'hanh-la', category: 'Rau củ quả', standardUnit: 'cây', amount: 2, unit: 'cây', scalePolicy: 'FIXED', preparation: 'thái nhỏ' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1, unit: 'muỗng canh', scalePolicy: 'MANUAL_ADJUST' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Xào tôm', instruction: 'Xào sơ tôm bóc vỏ với đầu hành trắng cho dậy mùi thơm rồi đổ 900ml nước sôi vào nồi.', timerSeconds: 180 },
      { stepNumber: 2, phaseName: 'Nấu bí đao', instruction: 'Khi nước sôi bùng, thả bí đao vào đun lửa vừa 5-6 phút đến khi miếng bí vừa chuyển màu trong.', timerSeconds: 360, tipText: 'Không đun bí đao quá nhừ để giữ vị ngọt mát và độ giòn nhẹ.' },
      { stepNumber: 3, phaseName: 'Hoàn thiện', instruction: 'Nêm chút nước mắm, rắc hành lá và tiêu xay rồi tắt bếp.' },
    ],
  },
  {
    dishName: 'Canh mướp hương nấu tôm khô',
    dishSlug: 'canh-muop-huong-tom-kho',
    recipeName: 'Canh mướp hương nấu tôm khô ngọt lịm',
    recipeSlug: 'canh-muop-huong-tom-kho',
    role: 'SOUP',
    shortDescription: 'Hương thơm dịu dàng đặc trưng của mướp hương quyện cùng vị ngọt đậm của tôm khô ngâm mềm, nấu nhanh trong 10 phút.',
    difficulty: 'Dễ',
    prepTimeMinutes: 8,
    cookTimeMinutes: 8,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mon-canh', 'bua-com-hang-ngay', 'thanh-dam'],
    ingredients: [
      { name: 'Mướp hương', slug: 'muop-huong', category: 'Rau củ quả', standardUnit: 'g', amount: 500, unit: 'g', scalePolicy: 'LINEAR', preparation: 'gọt vỏ, thái vát' },
      { name: 'Tôm khô', slug: 'tom-kho', category: 'Thủy hải sản', standardUnit: 'g', amount: 40, unit: 'g', scalePolicy: 'LINEAR', preparation: 'ngâm nước ấm 10 phút cho mềm' },
      { name: 'Hành tím', slug: 'hanh-tim', category: 'Gia vị nêm nếm', standardUnit: 'củ', amount: 1, unit: 'củ', scalePolicy: 'LINEAR' },
      { name: 'Hành lá', slug: 'hanh-la', category: 'Rau củ quả', standardUnit: 'cây', amount: 2, unit: 'cây', scalePolicy: 'FIXED' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Ninh tôm khô', instruction: 'Cho tôm khô cùng cả phần nước ngâm tôm vào 800ml nước đun sôi nhỏ lửa 5 phút cho tiết vị ngọt.', timerSeconds: 300 },
      { stepNumber: 2, phaseName: 'Thả mướp hương', instruction: 'Thả mướp hương thái vát vào đun sôi bùng 2-3 phút cho mướp vừa chín mềm xanh.', timerSeconds: 180 },
      { stepNumber: 3, phaseName: 'Hoàn thiện', instruction: 'Nêm gia vị vừa miệng, rắc hành hoa rồi múc ra tô.' },
    ],
  },
  {
    dishName: 'Canh cải ngọt nấu thịt băm',
    dishSlug: 'canh-cai-ngot-thit-bam',
    recipeName: 'Canh cải ngọt nấu thịt băm gừng tươi ấm bụng',
    recipeSlug: 'canh-cai-ngot-thit-bam',
    role: 'SOUP',
    shortDescription: 'Cải ngọt xanh non nấu cùng thịt nạc băm và vài lát gừng tươi thơm ấm, dễ tiêu hóa và giàu chất xơ cho cả nhà.',
    difficulty: 'Dễ',
    prepTimeMinutes: 8,
    cookTimeMinutes: 8,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mon-canh', 'bua-com-hang-ngay', 'thanh-dam'],
    ingredients: [
      { name: 'Cải ngọt / Cải thìa', slug: 'cai-ngot', category: 'Rau củ quả', standardUnit: 'g', amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: 'cắt khúc 4cm' },
      { name: 'Thịt heo nạc băm', slug: 'thit-heo-nac-bam', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 120, unit: 'g', scalePolicy: 'LINEAR' },
      { name: 'Gừng tươi', slug: 'gung-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'nhánh', scalePolicy: 'FIXED', preparation: 'đập dập' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1, unit: 'muỗng canh', scalePolicy: 'MANUAL_ADJUST' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Nấu nước thịt', instruction: 'Đun sôi 850ml nước với gừng đập dập, thả từng viên thịt băm vào đun sôi và hớt bọt.', timerSeconds: 240 },
      { stepNumber: 2, phaseName: 'Thả rau cải', instruction: 'Cho phần cọng cải vào trước 1 phút rồi cho phần lá vào đun sôi lại 1 phút.', timerSeconds: 120 },
      { stepNumber: 3, phaseName: 'Hoàn thiện', instruction: 'Nêm chút nước mắm cho dậy mùi thơm rồi tắt bếp ngay để rau giữ màu xanh.' },
    ],
  },

  // ===================== PHASE P3.5: MỞ RỘNG RAU / XÀO & MÓN PHỤ (SIDE) =====================
  {
    dishName: 'Bông cải xanh luộc Eat Clean',
    dishSlug: 'bong-cai-xanh-luoc-eat-clean',
    recipeName: 'Bông cải xanh & cà rốt luộc giòn ngọt (Chuẩn Eat Clean)',
    recipeSlug: 'bong-cai-xanh-luoc-eat-clean',
    role: 'SIDE',
    shortDescription: 'Đĩa rau củ luộc xanh mướt giòn ngọt không dùng dầu mỡ, giữ trọn vitamin và chất xơ cho thực đơn giảm cân hoặc người lớn tuổi.',
    difficulty: 'Dễ',
    prepTimeMinutes: 8,
    cookTimeMinutes: 4,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['thanh-dam', 'bua-com-hang-ngay'],
    ingredients: [
      { name: 'Bông cải xanh (Súp lơ xanh)', slug: 'bong-cai-xanh', category: 'Rau củ quả', standardUnit: 'g', amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: 'tách nhánh nhỏ vừa ăn' },
      { name: 'Cà rốt', slug: 'ca-rot', category: 'Rau củ quả', standardUnit: 'g', amount: 120, unit: 'g', scalePolicy: 'LINEAR', preparation: 'thái lát dày 0.5cm' },
      { name: 'Muối tinh', slug: 'muoi-an', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 0.5, unit: 'muỗng cà phê', scalePolicy: 'FIXED' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế ngâm rửa', instruction: 'Ngâm bông cải xanh trong nước muối loãng 5 phút rồi rửa sạch, cắt miếng vừa ăn.', timerSeconds: 300 },
      { stepNumber: 2, phaseName: 'Luộc rau củ', instruction: 'Đun sôi nồi nước với chút muối, thả cà rốt vào trước 1 phút rồi cho bông cải xanh vào luộc sôi 2 phút.', timerSeconds: 180, tipText: 'Vớt ra ngâm qua nước mát giúp bông cải giòn sần sật và xanh biếc.' },
      { stepNumber: 3, phaseName: 'Trình bày', instruction: 'Xếp bông cải và cà rốt ra đĩa, chấm cùng nước tương tỏi ớt hoặc kho quẹt.' },
    ],
  },
  {
    dishName: 'Cải thìa xào nấm đông cô',
    dishSlug: 'cai-thia-xao-nam-dong-co',
    recipeName: 'Cải thìa xào nấm đông cô sốt dầu hào',
    recipeSlug: 'cai-thia-xao-nam-dong-co',
    role: 'SIDE',
    shortDescription: 'Bẹ cải thìa xanh ngọc giòn ngọt quyện cùng mũ nấm đông cô mềm thơm trong lớp sốt dầu hào bóng mượt như ngoài nhà hàng.',
    difficulty: 'Dễ',
    prepTimeMinutes: 10,
    cookTimeMinutes: 7,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mon-xao', 'thanh-dam', 'cuoi-tuan-sum-hop'],
    ingredients: [
      { name: 'Cải ngọt / Cải thìa', slug: 'cai-ngot', category: 'Rau củ quả', standardUnit: 'g', amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: 'chẻ đôi dọc cây' },
      { name: 'Nấm hương / Nấm đùi gà', slug: 'nam-dong-co', category: 'Rau củ quả', standardUnit: 'g', amount: 150, unit: 'g', scalePolicy: 'LINEAR' },
      { name: 'Tỏi khô', slug: 'toi-kho', category: 'Gia vị nêm nếm', standardUnit: 'tép', amount: 4, unit: 'tép', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Dầu hào', slug: 'dau-hao', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Dầu ăn', slug: 'dau-an', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Chần cải thìa', instruction: 'Chần cải thìa trong nước sôi 1 phút rồi vớt ra xếp gọn lên đĩa.', timerSeconds: 60 },
      { stepNumber: 2, phaseName: 'Xào nấm sốt dầu hào', instruction: 'Phi thơm tỏi với dầu ăn, cho nấm vào xào cùng 2 muỗng dầu hào và 30ml nước lọc trong 4 phút.', timerSeconds: 240 },
      { stepNumber: 3, phaseName: 'Hoàn thiện', instruction: 'Trút phần nấm và nước sốt dầu hào sánh thơm lên đĩa cải thìa xanh mướt.' },
    ],
  },
  {
    dishName: 'Nộm dưa leo cà rốt chua ngọt',
    dishSlug: 'nom-dua-leo-ca-rot',
    recipeName: 'Gỏi dưa leo cà rốt trộn chua ngọt chống ngấy',
    recipeSlug: 'nom-dua-leo-ca-rot',
    role: 'SIDE',
    shortDescription: 'Đĩa gỏi dưa leo cà rốt giòn tan, chua ngọt thanh mát giúp giải ngấy cực tốt khi ăn kèm các món kho, chiên hoặc nướng.',
    difficulty: 'Dễ',
    prepTimeMinutes: 12,
    cookTimeMinutes: 0,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['thanh-dam', 'giai-nhiet-mua-he'],
    ingredients: [
      { name: 'Dưa leo (Dưa chuột)', slug: 'dua-leo', category: 'Rau củ quả', standardUnit: 'g', amount: 400, unit: 'g', scalePolicy: 'LINEAR', preparation: 'bỏ ruột, thái vát mỏng' },
      { name: 'Cà rốt', slug: 'ca-rot', category: 'Rau củ quả', standardUnit: 'g', amount: 100, unit: 'g', scalePolicy: 'LINEAR', preparation: 'bào sợi' },
      { name: 'Tỏi khô', slug: 'toi-kho', category: 'Gia vị nêm nếm', standardUnit: 'tép', amount: 3, unit: 'tép', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Chanh tươi (Nước cốt chanh)', slug: 'chanh-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'quả', amount: 1, unit: 'quả', scalePolicy: 'LINEAR' },
      { name: 'Đường cát', slug: 'duong-cat', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 1.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế giòn rau', instruction: 'Dưa leo bỏ ruột thái mỏng, ướp với chút đường 5 phút rồi chắt bỏ nước tiết ra để dưa thật giòn.', timerSeconds: 300 },
      { stepNumber: 2, phaseName: 'Pha nước trộn gỏi', instruction: 'Khuấy tan 1.5 muỗng đường, 1.5 muỗng nước mắm, nước cốt 1 quả chanh cùng tỏi ớt băm.' },
      { stepNumber: 3, phaseName: 'Trộn gỏi', instruction: 'Rưới nước sốt vào dưa leo và cà rốt ngay trước khi ăn 5 phút, trộn đều và bày ra đĩa.' },
    ],
  },

  // ===================== PHASE P3.5: NƯỚC CHẤM & SỐT GIA TRUYỀN (DIPPING_SAUCE) =====================
  {
    dishName: 'Nước mắm tỏi ớt chua ngọt',
    dishSlug: 'nuoc-mam-toi-ot-chua-ngot',
    recipeName: 'Nước mắm tỏi ớt chua ngọt (Tỷ lệ vàng nổi tỏi ớt)',
    recipeSlug: 'nuoc-mam-toi-ot-chua-ngot',
    role: 'DIPPING_SAUCE',
    shortDescription: 'Bí quyết pha chén nước mắm chua ngọt hài hòa theo tỷ lệ muỗng bếp nhà, tỏi ớt băm nổi đều trên mặt đẹp mắt, chấm cá chiên, chả giò hay thịt luộc đều ngon.',
    difficulty: 'Dễ',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['bua-com-hang-ngay'],
    ingredients: [
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Đường cát', slug: 'duong-cat', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1.5, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Chanh tươi (Nước cốt chanh)', slug: 'chanh-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'quả', amount: 1, unit: 'quả', scalePolicy: 'LINEAR', preparation: 'vắt lấy 1 muỗng canh cốt' },
      { name: 'Tỏi khô', slug: 'toi-kho', category: 'Gia vị nêm nếm', standardUnit: 'tép', amount: 3, unit: 'tép', scalePolicy: 'LINEAR', preparation: 'băm thật nhuyễn' },
      { name: 'Ớt tươi', slug: 'ot-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'quả', amount: 1, unit: 'quả', scalePolicy: 'MANUAL_ADJUST', preparation: 'băm nhuyễn' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Hòa tan đường mắm', instruction: 'Hòa tan 1.5 muỗng đường với 4 muỗng canh nước ấm, sau đó thêm 2 muỗng canh nước mắm và 1 muỗng cốt chanh vào khuấy đều.', timerSeconds: 60 },
      { stepNumber: 2, phaseName: 'Thả tỏi ớt nổi đều', instruction: 'Cho tỏi và ớt băm nhuyễn vào sau cùng để tỏi ớt nổi hoàn toàn trên mặt chén nước chấm.', tipText: 'Luôn cho tỏi ớt vào sau khi đã pha nước mắm-đường-chanh để tỏi ớt không bị chìm.' },
    ],
  },
  {
    dishName: 'Kho quẹt tóp mỡ tôm khô',
    dishSlug: 'kho-quet-top-mo-tom-kho',
    recipeName: 'Kho quẹt tóp mỡ tôm khô chấm rau củ luộc',
    recipeSlug: 'kho-quet-top-mo-tom-kho',
    role: 'DIPPING_SAUCE',
    shortDescription: 'Niêu kho quẹt Nam Bộ sệt kẹo màu cánh gián, dậy mùi thơm của tôm khô, tóp mỡ giòn rụm và hạt tiêu xanh, biến đĩa rau luộc thành mỹ vị.',
    difficulty: 'Dễ',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['mien-nam', 'mon-kho', 'bua-com-hang-ngay'],
    ingredients: [
      { name: 'Tôm khô', slug: 'tom-kho', category: 'Thủy hải sản', standardUnit: 'g', amount: 30, unit: 'g', scalePolicy: 'LINEAR', preparation: 'ngâm mềm' },
      { name: 'Thịt ba chỉ heo', slug: 'thit-ba-chi-heo', category: 'Thực phẩm tươi sống', standardUnit: 'g', amount: 80, unit: 'g', scalePolicy: 'LINEAR', preparation: 'thái hạt lựu thắng tóp mỡ' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 3, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Đường cát', slug: 'duong-cat', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Hành tím', slug: 'hanh-tim', category: 'Gia vị nêm nếm', standardUnit: 'củ', amount: 2, unit: 'củ', scalePolicy: 'LINEAR', preparation: 'băm nhỏ' },
      { name: 'Hạt tiêu đen', slug: 'hat-tieu-den', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'muỗng cà phê', scalePolicy: 'MANUAL_ADJUST' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Thắng tóp mỡ & xào tôm', instruction: 'Đảo thịt ba chỉ thái hạt lựu trên lửa vừa đến khi tóp mỡ vàng giòn, phi thơm hành tím rồi cho tôm khô vào xào săn.', timerSeconds: 240 },
      { stepNumber: 2, phaseName: 'Rim sốt kho quẹt', instruction: 'Pha 3 muỗng nước mắm, 2 muỗng đường và 2 muỗng nước lọc đổ vào nồi, đun liu riu 6 phút cho sốt sánh kẹo lại rồi rắc tiêu.', timerSeconds: 360 },
    ],
  },
  {
    dishName: 'Muối ớt xanh lá chanh',
    dishSlug: 'muoi-ot-xanh-chanh-day',
    recipeName: 'Muối ớt xanh lá chanh chấm gà luộc & hải sản',
    recipeSlug: 'muoi-ot-xanh-chanh-day',
    role: 'DIPPING_SAUCE',
    shortDescription: 'Chén sốt chấm màu xanh ngọc bích sánh mịn, thơm lừng lá chanh và ớt xiêm xanh, chấm ức gà hấp Eat Clean hay hải sản đều tuyệt hảo.',
    difficulty: 'Dễ',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    baseServings: 4,
    heroImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    taxonomySlugs: ['thanh-dam', 'bua-com-hang-ngay'],
    ingredients: [
      { name: 'Ớt tươi', slug: 'ot-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'quả', amount: 5, unit: 'quả', scalePolicy: 'MANUAL_ADJUST', preparation: 'ớt xiêm xanh bỏ hạt' },
      { name: 'Chanh tươi (Nước cốt chanh)', slug: 'chanh-tuoi', category: 'Gia vị nêm nếm', standardUnit: 'quả', amount: 2, unit: 'quả', scalePolicy: 'LINEAR' },
      { name: 'Đường cát', slug: 'duong-cat', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Muối tinh', slug: 'muoi-an', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'muỗng cà phê', scalePolicy: 'LINEAR' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Xay nhuyễn sốt', instruction: 'Cho ớt xanh, muối, đường và nước cốt chanh vào cối xay thật nhuyễn mịn trong 1 phút đến khi hỗn hợp sánh đặc.', timerSeconds: 60 },
    ],
  },
];

export async function seedProductionCatalog() {
  console.log('=== BẮT ĐẦU SEED PRODUCTION CATALOG BATCH 1 & P3.5 (GATE P3 & P6) ===\n');

  // Đảm bảo enum meal_role có sẵn DIPPING_SAUCE trước khi seed
  await db.execute(sql`ALTER TYPE "public"."meal_role" ADD VALUE IF NOT EXISTS 'DIPPING_SAUCE'`);

  // Lấy hoặc tạo user tác giả mặc định
  let author = await db.query.users.findFirst({
    where: eq(users.role, 'ADMIN'),
  });

  if (!author) {
    author = await db.query.users.findFirst();
  }

  if (!author) {
    const [newAuthor] = await db
      .insert(users)
      .values({
        email: 'bepme@angimom.vn',
        displayName: 'Đầu Bếp Ăn Gì Mom',
        role: 'ADMIN',
        passwordHash: 'seeded_dummy_hash_no_login',
      })
      .returning();
    author = newAuthor;
  }

  let totalRecipes = 0;

  for (const item of PRODUCTION_RECIPES) {
    console.log(`-> Xử lý công thức: [${item.role}] ${item.recipeName}`);

    // 1. Tạo hoặc lấy Dish
    let [dish] = await db.select().from(dishes).where(eq(dishes.slug, item.dishSlug)).limit(1);
    if (!dish) {
      const [createdDish] = await db
        .insert(dishes)
        .values({
          name: item.dishName,
          slug: item.dishSlug,
        })
        .returning();
      dish = createdDish;
    }

    // 2. Xóa công thức cũ nếu đã có (Idempotent seed)
    const [existingRecipe] = await db.select().from(recipes).where(eq(recipes.slug, item.recipeSlug)).limit(1);
    if (existingRecipe) {
      await db.delete(recipes).where(eq(recipes.id, existingRecipe.id));
    }

    // 3. Insert Recipe với đầy đủ Invariants §5.1 & §5.5
    const [createdRecipe] = await db
      .insert(recipes)
      .values({
        dishId: dish.id,
        authorId: author.id,
        name: item.recipeName,
        slug: item.recipeSlug,
        shortDescription: item.shortDescription,
        role: item.role,
        status: 'PUBLISHED',
        baseServings: item.baseServings,
        prepTimeMinutes: item.prepTimeMinutes,
        cookTimeMinutes: item.cookTimeMinutes,
        difficulty: item.difficulty,
        heroImage: item.heroImage,
        isEditorialReviewed: true,
        // Invariants D23 & R1: Chưa nấu thử thực nghiệm trong bếp mẫu -> false (không giả mạo nhãn)
        isCookTested: false,
        isNutritionVerified: false,
        versionNumber: 1,
        publishedAt: new Date(),
      })
      .returning();

    // 4. Xử lý nguyên liệu (Ingredients & RecipeIngredients)
    let sortOrder = 0;
    for (const ing of item.ingredients) {
      let [dbIng] = await db.select().from(ingredients).where(eq(ingredients.slug, ing.slug)).limit(1);
      if (!dbIng) {
        const [createdIng] = await db
          .insert(ingredients)
          .values({
            name: ing.name,
            slug: ing.slug,
            category: ing.category,
            standardUnit: ing.standardUnit,
          })
          .returning();
        dbIng = createdIng;
      }

      await db.insert(recipeIngredients).values({
        recipeId: createdRecipe.id,
        ingredientId: dbIng.id,
        amount: ing.amount,
        unit: ing.unit,
        scalePolicy: ing.scalePolicy,
        preparation: ing.preparation || null,
        isOptional: ing.isOptional || false,
        sortOrder: sortOrder++,
      });
    }

    // 5. Xử lý các bước nấu (CookingSteps)
    for (const step of item.steps) {
      await db.insert(cookingSteps).values({
        recipeId: createdRecipe.id,
        stepNumber: step.stepNumber,
        phaseName: step.phaseName,
        instruction: step.instruction,
        timerSeconds: step.timerSeconds || null,
        tipText: step.tipText || null,
      });
    }

    // 6. Gắn Taxonomy tags
    if (item.taxonomySlugs.length > 0) {
      const matchedTaxonomies = await db
        .select()
        .from(taxonomies)
        .where(inArray(taxonomies.slug, item.taxonomySlugs));

      for (const tax of matchedTaxonomies) {
        await db.insert(recipeTags).values({
          recipeId: createdRecipe.id,
          taxonomyId: tax.id,
        }).onConflictDoNothing();
      }
    }

    totalRecipes++;
  }

  console.log(`\n✓ ĐÃ SEED THÀNH CÔNG ${totalRecipes} CÔNG THỨC PUBLISHED VÀO DATABASE!`);

  // 7. Nạp dữ liệu dinh dưỡng chuẩn Viện Dinh Dưỡng (VIETNAM_FCT_2007) và tính toán tự động cho toàn bộ công thức PUBLISHED
  console.log('\n=== ĐỒNG BỘ TỪ ĐIỂN DINH DƯỠNG & TÍNH CALO TỰ ĐỘNG (GATE P6) ===');
  const seededNutCount = await seedNutritionStandards();
  console.log(`-> Đã đồng bộ ${seededNutCount} bản ghi nguyên liệu chuẩn Viện Dinh Dưỡng Quốc Gia.`);

  const allPublished = await db
    .select({ id: recipes.id, name: recipes.name })
    .from(recipes)
    .where(eq(recipes.status, 'PUBLISHED'));

  let calcCount = 0;
  for (const r of allPublished) {
    try {
      const snap = await calculateRecipeNutrition(r.id);
      console.log(`   + [${r.name}] => ~${snap.perServing.calories} kcal/phần (Bao phủ: ${snap.coveragePercent}%)`);
      calcCount++;
    } catch (err) {
      console.warn(`   ! Không thể tính dinh dưỡng cho recipe #${r.id}:`, err);
    }
  }
  console.log(`✓ Đã tính toán và lưu Snapshot dinh dưỡng cho ${calcCount}/${allPublished.length} công thức!`);
}

if (process.argv[1]?.endsWith('seed_production_catalog.ts')) {
  seedProductionCatalog()
    .then(() => {
      console.log('Hoàn tất seeder!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Lỗi khi seed catalog:', err);
      process.exit(1);
    })
    .finally(() => closeDb());
}
