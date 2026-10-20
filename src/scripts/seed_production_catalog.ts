// AG-26: Production Catalog Seeder — Bộ dữ liệu món ăn hoàn chỉnh cho MVP Pilot Gate P3
// Nạp tối thiểu 12 món ăn chuẩn mực (5 MAIN, 4 SOUP, 3 SIDE), đầy đủ 3 vai trò,
// nguyên liệu có scalePolicy rõ ràng, các bước nấu có timer và mẹo bếp, gắn thẻ taxonomy,
// và đạt trạng thái PUBLISHED với nhãn kiểm duyệt isCookTested & isEditorialReviewed.
// Chạy độc lập: npx tsx src/scripts/seed_production_catalog.ts

import { db, closeDb } from '../lib/db';
import { dishes, recipes, ingredients, recipeIngredients, cookingSteps, taxonomies, recipeTags, users } from '../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

interface RecipeSeedData {
  dishName: string;
  dishSlug: string;
  recipeName: string;
  recipeSlug: string;
  role: 'MAIN' | 'SOUP' | 'SIDE';
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
      { name: 'Hạt tiêu đen', slug: 'hat-tieu-den', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'muỗng cà phê', scalePolicy: 'MANUAL_ADJUST', preparation: 'xay vỡ hạt' },
      { name: 'Nước mắm truyền thống', slug: 'nuoc-mam-truyen-thong', category: 'Gia vị nêm nếm', standardUnit: 'ml', amount: 2, unit: 'muỗng canh', scalePolicy: 'LINEAR' },
      { name: 'Đường cát', slug: 'duong-cat', category: 'Gia vị nêm nếm', standardUnit: 'g', amount: 1, unit: 'muỗng canh', scalePolicy: 'LINEAR', preparation: 'thắng nước màu' },
    ],
    steps: [
      { stepNumber: 1, phaseName: 'Sơ chế & Ướp', instruction: 'Thịt chần qua nước sôi 1 phút rồi rửa sạch. Ướp với 1 muỗng canh nước mắm, hành tím băm và 1/2 muỗng tiêu trong 15 phút.', timerSeconds: 900, tipText: 'Chần thịt sơ giúp miếng thịt thơm sạch và nước kho trong hơn.' },
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
];

export async function seedProductionCatalog() {
  console.log('=== BẮT ĐẦU SEED PRODUCTION CATALOG BATCH 1 (GATE P3) ===\n');

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
        isCookTested: true,
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
