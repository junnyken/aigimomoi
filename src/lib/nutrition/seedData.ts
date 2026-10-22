// AG-35+: Từ điển Nguyên liệu & Dinh dưỡng Chuẩn Việt Nam (Mở rộng toàn diện ~185 nguyên liệu)
// Nguồn tham chiếu chính thức:
// 1. VIETNAM_FCT_2007 / VDD_2017: Bảng thành phần thực phẩm Việt Nam - Viện Dinh Dưỡng Quốc Gia (Bộ Y Tế - NXB Y Học)
// 2. ASEANFOODS_FAO: Cơ sở dữ liệu thực phẩm Đông Nam Á (FAO / INFOODS)
// 3. USDA_FDC: USDA FoodData Central (cho nhóm nguyên liệu Eat Clean / Gym hiện đại)
// Invariants Gate P6: Dữ liệu thiếu giữ nguyên null, không được tự gán thành 0!

export type IngredientCategoryName =
  | 'Thực phẩm tươi sống'
  | 'Thủy hải sản'
  | 'Rau củ quả'
  | 'Gia vị nêm nếm'
  | 'Đồ khô';

export interface StandardNutritionItem {
  slug: string;
  name: string;
  category?: IngredientCategoryName;
  standardUnit?: string;
  isPantryStaple?: boolean;
  source: string;
  edibleRate: number;        // Tỷ lệ phần ăn được (0.1 .. 1.0)
  calories100g: number;      // Kcal / 100g phần ăn được
  protein100g: number;       // g
  fat100g: number;           // g
  carbs100g: number;         // g
  fiber100g: number | null;  // g (null nếu chưa phân tích)
  sodium100g: number | null; // mg
  notes?: string;
}

function item(
  slug: string,
  name: string,
  category: IngredientCategoryName,
  standardUnit: string,
  isPantryStaple: boolean,
  edibleRate: number,
  calories100g: number,
  protein100g: number,
  fat100g: number,
  carbs100g: number,
  fiber100g: number | null,
  sodium100g: number | null,
  source = 'VIETNAM_FCT_2007',
  notes?: string
): StandardNutritionItem {
  return {
    slug,
    name,
    category,
    standardUnit,
    isPantryStaple,
    source,
    edibleRate,
    calories100g,
    protein100g,
    fat100g,
    carbs100g,
    fiber100g,
    sodium100g,
    notes,
  };
}

export const VIETNAMESE_STANDARD_FCT: StandardNutritionItem[] = [
  // ==========================================================================
  // 1. THỰC PHẨM TƯƠI SỐNG (Thịt heo, Bò, Gia cầm, Trứng, Đậu phụ) — 42 loại
  // ==========================================================================
  item('thit-ba-chi', 'Thịt ba chỉ heo (Ba rọi)', 'Thực phẩm tươi sống', 'g', false, 1.0, 260, 16.5, 21.5, 0.0, 0.0, 58, 'VIETNAM_FCT_2007', 'Thịt lợn nửa nạc nửa mỡ chuẩn Viện Dinh Dưỡng'),
  item('thit-heo-nac', 'Thịt lợn nạc (Thịt thăn / mông)', 'Thực phẩm tươi sống', 'g', false, 1.0, 139, 19.0, 7.0, 0.0, 0.0, 68, 'VIETNAM_FCT_2007', 'Thịt heo nạc ít mỡ'),
  item('thit-nac-vai-heo', 'Thịt nạc vai heo (Nạc dăm)', 'Thực phẩm tươi sống', 'g', false, 1.0, 178, 18.0, 11.5, 0.0, 0.0, 65, 'VIETNAM_FCT_2007', 'Thịt nạc vai có vân mỡ mềm'),
  item('thit-heo-xay', 'Thịt heo băm (Thịt xay)', 'Thực phẩm tươi sống', 'g', false, 1.0, 165, 18.5, 10.0, 0.0, 0.0, 66, 'VIETNAM_FCT_2007', 'Thịt nạc vai xay nấu canh, nhồi khổ qua'),
  item('suon-heo', 'Sườn heo non', 'Thực phẩm tươi sống', 'g', false, 0.75, 187, 18.2, 12.6, 0.0, 0.0, 62, 'VIETNAM_FCT_2007', 'Trừ 25% khối lượng xương'),
  item('suon-cot-let', 'Sườn cốt lết heo', 'Thực phẩm tươi sống', 'g', false, 0.82, 172, 19.4, 10.2, 0.0, 0.0, 64, 'VIETNAM_FCT_2007', 'Cốt lết rim/nướng cơm tấm'),
  item('chan-gio-heo', 'Thịt chân giò heo', 'Thực phẩm tươi sống', 'g', false, 0.78, 230, 15.7, 18.6, 0.0, 0.0, 65, 'VIETNAM_FCT_2007', 'Chân giò rút xương hoặc kho giả cầy'),
  item('xuong-ong-heo', 'Xương ống heo (Ninh nước dùng)', 'Thực phẩm tươi sống', 'g', false, 0.35, 155, 14.0, 10.8, 0.0, 0.0, 70, 'VIETNAM_FCT_2007', 'Hầm lấy nước ngọt'),
  item('tim-heo', 'Tim heo tươi', 'Thực phẩm tươi sống', 'g', false, 0.95, 89, 15.1, 3.2, 0.0, 0.0, 85, 'VIETNAM_FCT_2007', 'Giàu sắt và vitamin nhóm B'),
  item('gan-heo', 'Gan heo tươi', 'Thực phẩm tươi sống', 'g', false, 0.96, 116, 18.8, 3.6, 2.0, 0.0, 77, 'VIETNAM_FCT_2007', 'Rất giàu sắt và Vitamin A'),
  item('cat-heo', 'Cật heo (Bầu dục)', 'Thực phẩm tươi sống', 'g', false, 0.92, 81, 13.0, 3.1, 0.3, 0.0, 145, 'VIETNAM_FCT_2007', 'Cật heo xào hành răm'),
  item('da-day-heo', 'Bao tử heo (Dạ dày)', 'Thực phẩm tươi sống', 'g', false, 0.90, 97, 14.6, 2.9, 2.0, 0.0, 96, 'VIETNAM_FCT_2007', 'Bao tử khìa nước dừa / luộc'),
  item('long-non-heo', 'Lòng non heo', 'Thực phẩm tươi sống', 'g', false, 0.90, 76, 7.2, 4.5, 1.6, 0.0, 90, 'VIETNAM_FCT_2007', 'Lòng non xào dưa cải'),
  item('gio-song', 'Giò sống (Mọc heo)', 'Thực phẩm tươi sống', 'g', false, 1.0, 204, 15.5, 15.2, 1.2, 0.0, 620, 'VIETNAM_FCT_2007', 'Quết từ thịt thăn heo tươi'),
  item('cha-lua', 'Chả lụa (Giò lụa)', 'Thực phẩm tươi sống', 'g', false, 1.0, 176, 21.5, 9.8, 0.5, 0.0, 780, 'VIETNAM_FCT_2007', 'Giò lụa truyền thống'),
  item('lap-xuong', 'Lạp xưởng tươi / khô', 'Thực phẩm tươi sống', 'g', false, 1.0, 412, 20.8, 33.5, 6.8, 0.0, 980, 'VIETNAM_FCT_2007', 'Lạp xưởng mai quế lộ'),

  item('thit-bo-phi-le', 'Thịt bò phi lê (Thăn nội)', 'Thực phẩm tươi sống', 'g', false, 1.0, 118, 21.5, 3.8, 0.0, 0.0, 80, 'VIETNAM_FCT_2007', 'Thịt bò mềm giàu đạm và sắt'),
  item('thit-bo-bap', 'Thịt bắp bò (Bắp hoa)', 'Thực phẩm tươi sống', 'g', false, 1.0, 130, 21.0, 5.0, 0.0, 0.0, 83, 'VIETNAM_FCT_2007', 'Bắp bò giòn gân'),
  item('thit-ba-chi-bo', 'Thịt ba chỉ bò', 'Thực phẩm tươi sống', 'g', false, 1.0, 250, 17.2, 20.0, 0.0, 0.0, 72, 'USDA_FDC', 'Ba chỉ bò cuộn nấm, nhúng lẩu'),
  item('thit-bo-xay', 'Thịt bò băm (Bò xay nạc)', 'Thực phẩm tươi sống', 'g', false, 1.0, 142, 20.5, 6.5, 0.0, 0.0, 78, 'VIETNAM_FCT_2007', 'Bò băm nấu canh, sốt cà'),
  item('nam-bo', 'Thịt nạm bò / Dẻ sườn bò', 'Thực phẩm tươi sống', 'g', false, 0.95, 195, 18.8, 13.2, 0.0, 0.0, 79, 'VIETNAM_FCT_2007', 'Nấu bò kho, phở bò'),
  item('gan-bo', 'Gân bò tươi', 'Thực phẩm tươi sống', 'g', false, 0.95, 152, 30.2, 3.1, 0.0, 0.0, 85, 'VIETNAM_FCT_2007', 'Giàu collagen tự nhiên'),
  item('thit-trau-tuoi', 'Thịt trâu tươi', 'Thực phẩm tươi sống', 'g', false, 1.0, 115, 22.8, 2.4, 0.0, 0.0, 82, 'VIETNAM_FCT_2007', 'Thịt trâu xào rau muống / lá lốt'),

  item('thit-ga-ta', 'Thịt gà ta (Có xương)', 'Thực phẩm tươi sống', 'g', false, 0.70, 199, 20.3, 13.1, 0.0, 0.0, 70, 'VIETNAM_FCT_2007', 'Gà ta kho gừng, luộc lá chanh'),
  item('uc-ga-phi-le', 'Ức gà phi lê (Không da)', 'Thực phẩm tươi sống', 'g', false, 1.0, 110, 23.1, 1.2, 0.0, 0.0, 65, 'VIETNAM_FCT_2007', 'Chuẩn Eat Clean & Tập Gym giàu Protein'),
  item('ma-dui-ga', 'Má đùi gà / Đùi gà góc tư', 'Thực phẩm tươi sống', 'g', false, 0.78, 177, 19.2, 10.8, 0.0, 0.0, 76, 'VIETNAM_FCT_2007', 'Thịt đùi gà mềm mọng'),
  item('canh-ga', 'Cánh gà tươi', 'Thực phẩm tươi sống', 'g', false, 0.65, 203, 18.5, 14.2, 0.0, 0.0, 78, 'VIETNAM_FCT_2007', 'Cánh gà chiên nước mắm / nướng'),
  item('long-me-ga', 'Lòng mề gà', 'Thực phẩm tươi sống', 'g', false, 0.90, 108, 17.9, 3.6, 0.6, 0.0, 85, 'VIETNAM_FCT_2007', 'Mề gà xào mướp, miến lòng gà'),
  item('thit-vit', 'Thịt vịt xiêm / Vịt cỏ', 'Thực phẩm tươi sống', 'g', false, 0.68, 267, 17.8, 21.8, 0.0, 0.0, 76, 'VIETNAM_FCT_2007', 'Vịt kho gừng, vịt nấu măng, vịt nấu chao'),
  item('chim-cut', 'Chim cút làm sẵn', 'Thực phẩm tươi sống', 'g', false, 0.75, 162, 20.5, 8.8, 0.0, 0.0, 72, 'VIETNAM_FCT_2007', 'Chim cút rô ti'),

  item('trung-ga', 'Trứng gà ta', 'Thực phẩm tươi sống', 'quả', false, 0.88, 166, 14.8, 11.6, 0.5, 0.0, 158, 'VIETNAM_FCT_2007', '1 quả trung bình ~55g'),
  item('trung-vit', 'Trứng vịt', 'Thực phẩm tươi sống', 'quả', false, 0.87, 184, 13.0, 14.2, 1.0, 0.0, 191, 'VIETNAM_FCT_2007', '1 quả trung bình ~65-70g, kho tàu'),
  item('trung-cut', 'Trứng cút', 'Thực phẩm tươi sống', 'quả', false, 0.90, 170, 13.1, 12.5, 1.0, 0.0, 145, 'VIETNAM_FCT_2007', '1 quả ~10-12g'),
  item('trung-muoi', 'Trứng vịt muối (Lòng đỏ)', 'Thực phẩm tươi sống', 'quả', false, 0.88, 195, 13.8, 15.2, 1.2, 0.0, 1650, 'VIETNAM_FCT_2007', 'Chưng mắm thịt, sốt hoàng kim'),

  item('dau-phu', 'Đậu phụ trắng (Đậu hũ)', 'Thực phẩm tươi sống', 'g', false, 1.0, 95, 10.9, 5.4, 0.7, 0.4, 14, 'VIETNAM_FCT_2007', 'Đạm thực vật lành mạnh'),
  item('dau-hu-non', 'Đậu hũ non (Tàu hũ non)', 'Thực phẩm tươi sống', 'g', false, 1.0, 62, 6.5, 3.2, 1.8, 0.2, 12, 'VIETNAM_FCT_2007', 'Nấu canh rong biển, canh hẹ, sốt nấm'),
  item('dau-hu-chien', 'Đậu hũ chiên vàng', 'Thực phẩm tươi sống', 'g', false, 1.0, 158, 13.5, 11.2, 1.2, 0.5, 22, 'VIETNAM_FCT_2007', 'Đậu hũ nhồi thịt, kho nấm'),
  item('tau-hu-ky', 'Tàu hũ ky (Phù trúc)', 'Thực phẩm tươi sống', 'g', false, 1.0, 405, 42.3, 22.8, 10.5, 1.2, 45, 'VIETNAM_FCT_2007', 'Giàu đạm thực vật'),
  item('sua-chua-hy-lap', 'Sữa chua Hy Lạp không đường', 'Thực phẩm tươi sống', 'g', false, 1.0, 59, 10.3, 0.4, 3.6, 0.0, 36, 'USDA_FDC', 'Dùng pha sốt salad giảm cân / ướp gà'),

  // ==========================================================================
  // 2. THỦY HẢI SẢN (Cá sông, Cá biển, Tôm, Mực, Cua, Ốc, Nghêu) — 36 loại
  // ==========================================================================
  item('ca-loc', 'Cá lóc (Cá quả)', 'Thủy hải sản', 'g', false, 0.65, 97, 18.2, 2.7, 0.0, 0.0, 90, 'VIETNAM_FCT_2007', 'Cá lóc kho tộ, canh chua cá lóc'),
  item('ca-dieu-hong', 'Cá diêu hồng', 'Thủy hải sản', 'g', false, 0.62, 108, 19.5, 3.1, 0.0, 0.0, 75, 'VIETNAM_FCT_2007', 'Chưng tương, nấu canh chua, sốt cà'),
  item('ca-ro-phi', 'Cá rô phi phi lê', 'Thủy hải sản', 'g', false, 1.0, 96, 20.1, 1.7, 0.0, 0.0, 52, 'VIETNAM_FCT_2007', 'Cá thịt trắng giàu đạm ít béo'),
  item('ca-chep', 'Cá chép tươi', 'Thủy hải sản', 'g', false, 0.62, 96, 16.0, 3.6, 0.0, 0.0, 65, 'VIETNAM_FCT_2007', 'Cá chép om dưa, nấu cháo'),
  item('ca-tram', 'Cá trắm cỏ', 'Thủy hải sản', 'g', false, 0.65, 91, 17.0, 2.6, 0.0, 0.0, 62, 'VIETNAM_FCT_2007', 'Cá trắm kho riềng miền Bắc'),
  item('ca-hu', 'Cá hú / Cá basa cắt khoanh', 'Thủy hải sản', 'g', false, 0.78, 165, 17.5, 10.5, 0.0, 0.0, 72, 'VIETNAM_FCT_2007', 'Kho tộ, nấu canh chua miền Tây'),
  item('ca-basa-phi-le', 'Cá basa phi lê (Không xương)', 'Thủy hải sản', 'g', false, 1.0, 124, 18.0, 5.6, 0.0, 0.0, 68, 'VIETNAM_FCT_2007', 'Áp chảo, kho lạt, nướng giấy bạc'),
  item('ca-tre', 'Cá trê đồng', 'Thủy hải sản', 'g', false, 0.68, 173, 16.5, 11.9, 0.0, 0.0, 75, 'VIETNAM_FCT_2007', 'Cá trê kho gừng nghệ'),
  item('ca-keo', 'Cá kèo tươi', 'Thủy hải sản', 'g', false, 0.90, 98, 18.6, 2.4, 0.0, 0.0, 92, 'VIETNAM_FCT_2007', 'Cá kèo kho rau răm, lẩu lá giang'),
  item('ca-bong', 'Cá bống sông / Cá bống cát', 'Thủy hải sản', 'g', false, 0.85, 86, 17.8, 1.5, 0.0, 0.0, 88, 'VIETNAM_FCT_2007', 'Cá bống kho tiêu săn chắc'),
  item('ca-thac-lac', 'Chả cá thác lác nạo', 'Thủy hải sản', 'g', false, 1.0, 113, 19.2, 3.8, 0.5, 0.0, 180, 'VIETNAM_FCT_2007', 'Nấu canh khổ qua, canh cải xanh'),
  item('luon-dong', 'Lươn đồng làm sạch', 'Thủy hải sản', 'g', false, 0.72, 185, 20.0, 11.5, 0.0, 0.0, 82, 'VIETNAM_FCT_2007', 'Lươn xào sả ớt, miến lươn'),
  item('ech-dong', 'Thịt ếch đồng làm sạch', 'Thủy hải sản', 'g', false, 0.75, 73, 16.4, 0.3, 0.0, 0.0, 58, 'VIETNAM_FCT_2007', 'Đạm siêu nạc, xào măng / lá lốt'),

  item('ca-hoi-phi-le', 'Cá hồi phi lê tươi', 'Thủy hải sản', 'g', false, 1.0, 208, 20.4, 13.4, 0.0, 0.0, 59, 'USDA_FDC', 'Giàu Omega-3, áp chảo / sốt cam'),
  item('ca-thu', 'Cá thu cắt lát', 'Thủy hải sản', 'g', false, 0.88, 166, 18.2, 10.3, 0.0, 0.0, 110, 'VIETNAM_FCT_2007', 'Cá thu sốt cà chua, kho thơm'),
  item('ca-nuc', 'Cá nục biển tươi', 'Thủy hải sản', 'g', false, 0.68, 111, 20.2, 3.3, 0.0, 0.0, 115, 'VIETNAM_FCT_2007', 'Cá nục kho cà chua, hấp cuốn bánh tráng'),
  item('ca-ngu', 'Cá ngừ đại dương / Cá ngừ bò', 'Thủy hải sản', 'g', false, 0.78, 108, 23.4, 1.5, 0.0, 0.0, 52, 'VIETNAM_FCT_2007', 'Giàu Protein, kho thơm / áp chảo'),
  item('ca-bac-ma', 'Cá bạc má', 'Thủy hải sản', 'g', false, 0.68, 118, 20.0, 4.0, 0.0, 0.0, 105, 'VIETNAM_FCT_2007', 'Hấp hành gừng, kho ngót'),
  item('ca-com-tuoi', 'Cá cơm tươi', 'Thủy hải sản', 'g', false, 0.92, 95, 18.5, 2.2, 0.0, 0.0, 135, 'VIETNAM_FCT_2007', 'Giàu canxi, kho tiêu / chiên giòn'),
  item('ca-chim', 'Cá chim trắng / đen', 'Thủy hải sản', 'g', false, 0.70, 126, 19.0, 5.4, 0.0, 0.0, 95, 'VIETNAM_FCT_2007', 'Chiên sốt mắm xoài, kho riềng'),
  item('ca-hong', 'Cá hồng biển', 'Thủy hải sản', 'g', false, 0.66, 100, 20.5, 1.8, 0.0, 0.0, 78, 'VIETNAM_FCT_2007', 'Hấp xì dầu, nấu canh chua'),

  item('tom-tuoi', 'Tôm sú / Tôm thẻ tươi', 'Thủy hải sản', 'g', false, 0.60, 90, 18.4, 1.8, 0.0, 0.0, 148, 'VIETNAM_FCT_2007', 'Trừ 40% vỏ đầu'),
  item('tom-non', 'Tôm bóc nõn tươi (100% thịt)', 'Thủy hải sản', 'g', false, 1.0, 90, 18.4, 1.4, 0.9, 0.0, 148, 'VIETNAM_FCT_2007', 'Tôm nõn xào rau củ, nấu canh, tập gym'),
  item('tep-dong', 'Tép đồng tươi', 'Thủy hải sản', 'g', false, 0.95, 82, 16.2, 1.6, 0.8, 0.0, 155, 'VIETNAM_FCT_2007', 'Tép rang khế, xào bông điên điển'),
  item('muc-ong', 'Mực ống / Mực lá tươi', 'Thủy hải sản', 'g', false, 0.85, 73, 16.3, 0.9, 0.0, 0.0, 165, 'VIETNAM_FCT_2007', 'Mực hấp gừng, xào cần tỏi, nhồi thịt'),
  item('bach-tuoc', 'Bạch tuộc tươi', 'Thủy hải sản', 'g', false, 0.88, 82, 14.9, 1.0, 2.2, 0.0, 230, 'VIETNAM_FCT_2007', 'Bạch tuộc nướng sa tế, nhúng giấm'),
  item('ngheu-ngao', 'Nghêu (Ngao) tươi', 'Thủy hải sản', 'g', false, 0.25, 49, 9.8, 0.8, 1.2, 0.0, 190, 'VIETNAM_FCT_2007', 'Trừ 75% vỏ cứng; nấu canh chua, hấp sả'),
  item('hen-lam-sach', 'Thịt hến làm sẵn (Ruột hến)', 'Thủy hải sản', 'g', false, 1.0, 65, 11.8, 1.5, 1.5, 0.0, 160, 'VIETNAM_FCT_2007', 'Nấu canh hến rau tập tàng, cơm hến'),
  item('hau-sua', 'Thịt hàu sữa tách vỏ', 'Thủy hải sản', 'g', false, 1.0, 68, 9.5, 2.3, 2.8, 0.0, 175, 'VIETNAM_FCT_2007', 'Giàu kẽm sinh học'),
  item('so-diep', 'Cồi sò điệp tươi', 'Thủy hải sản', 'g', false, 1.0, 88, 16.8, 0.8, 3.2, 0.0, 165, 'USDA_FDC', 'Áp chảo bơ tỏi, nấu cháo'),
  item('cua-dong-xay', 'Cua đồng xay (Lọc nấu riêu)', 'Thủy hải sản', 'g', false, 0.55, 89, 12.3, 3.3, 2.0, 0.0, 316, 'VIETNAM_FCT_2007', 'Canh cua rau đay mồng tơi, bún riêu'),
  item('ghe-tuoi', 'Ghẹ biển / Cua biển tươi', 'Thủy hải sản', 'g', false, 0.48, 93, 19.5, 1.5, 0.5, 0.0, 285, 'VIETNAM_FCT_2007', 'Rang me, hấp bia'),
  item('oc-buou', 'Thịt ốc bươu / Ốc nhồi làm sạch', 'Thủy hải sản', 'g', false, 1.0, 84, 11.2, 0.7, 8.2, 0.0, 125, 'VIETNAM_FCT_2007', 'Ốc om chuối đậu, ốc hấp tiêu xanh'),

  // ==========================================================================
  // 3. RAU CỦ QUẢ & NẤM TƯƠI (Rau lá, Củ quả, Nấm, Trái cây nấu ăn) — 55 loại
  // ==========================================================================
  item('rau-muong', 'Rau muống', 'Rau củ quả', 'bó', false, 0.85, 23, 3.2, 0.4, 1.7, 1.0, 25, 'VIETNAM_FCT_2007', 'Luộc dầm sấu/chanh, xào tỏi'),
  item('rau-ngot', 'Rau ngót', 'Rau củ quả', 'bó', false, 0.76, 36, 5.3, 0.0, 3.4, 2.5, 22, 'VIETNAM_FCT_2007', 'Giàu đạm thực vật và Vitamin C'),
  item('rau-mong-toi', 'Rau mồng tơi', 'Rau củ quả', 'bó', false, 0.78, 14, 2.0, 0.0, 1.4, 2.5, 18, 'VIETNAM_FCT_2007', 'Nấu canh tôm, canh cua thanh nhiệt'),
  item('rau-day', 'Rau đay', 'Rau củ quả', 'bó', false, 0.75, 24, 2.8, 0.3, 2.5, 1.8, 16, 'VIETNAM_FCT_2007', 'Nấu canh cua đồng giải nhiệt'),
  item('cai-ngot', 'Cải ngọt', 'Rau củ quả', 'bó', false, 0.84, 17, 1.7, 0.2, 2.1, 1.8, 32, 'VIETNAM_FCT_2007', 'Luộc, xào thịt bò, nấu canh thịt băm'),
  item('cai-thia', 'Cải thìa (Cải chíp)', 'Rau củ quả', 'g', false, 0.88, 16, 1.5, 0.2, 2.2, 1.2, 35, 'VIETNAM_FCT_2007', 'Xào nấm đông cô dầu hào'),
  item('cai-xanh', 'Cải bẹ xanh (Cải canh)', 'Rau củ quả', 'bó', false, 0.82, 16, 1.7, 0.2, 1.9, 1.8, 28, 'VIETNAM_FCT_2007', 'Nấu canh gừng cá thác lác, tôm'),
  item('cai-thao', 'Cải thảo', 'Rau củ quả', 'g', false, 0.88, 14, 1.2, 0.1, 2.2, 1.0, 12, 'VIETNAM_FCT_2007', 'Canh cải thảo thịt viên, xào'),
  item('bap-cai', 'Bắp cải trắng', 'Rau củ quả', 'g', false, 0.85, 29, 1.8, 0.1, 5.3, 1.6, 18, 'VIETNAM_FCT_2007', 'Luộc chấm trứng, xào cà chua, cuộn thịt'),
  item('bap-cai-tim', 'Bắp cải tím', 'Rau củ quả', 'g', false, 0.86, 31, 1.4, 0.2, 6.0, 2.1, 22, 'VIETNAM_FCT_2007', 'Giàu anthocyanin chống oxy hóa, trộn gỏi/salad'),
  item('cai-bo-xoi', 'Cải bó xôi (Rau chân vịt / Spinach)', 'Rau củ quả', 'g', false, 0.85, 23, 2.9, 0.4, 3.6, 2.2, 79, 'VIETNAM_FCT_2007', 'Siêu thực phẩm giàu sắt, folate'),
  item('cai-xoong', 'Rau cải xoong', 'Rau củ quả', 'bó', false, 0.82, 15, 2.1, 0.2, 1.3, 1.0, 32, 'VIETNAM_FCT_2007', 'Xào tỏi thịt bò, nấu canh'),
  item('rau-den', 'Rau dền đỏ / xanh', 'Rau củ quả', 'bó', false, 0.78, 26, 3.2, 0.3, 2.8, 1.6, 24, 'VIETNAM_FCT_2007', 'Mát gan, bổ máu'),
  item('rau-lang', 'Đọt rau lang', 'Rau củ quả', 'bó', false, 0.76, 22, 2.6, 0.3, 2.8, 2.1, 19, 'VIETNAM_FCT_2007', 'Luộc chấm chao / kho quẹt, xào tỏi'),
  item('rau-bi', 'Đọt bí (Ngọn susu / Ngọn bí)', 'Rau củ quả', 'bó', false, 0.75, 19, 2.7, 0.2, 2.0, 1.8, 14, 'VIETNAM_FCT_2007', 'Xào tỏi giòn ngọt'),
  item('xa-lach', 'Xà lách tươi (Rau diếp / Romaine)', 'Rau củ quả', 'g', false, 0.86, 15, 1.4, 0.2, 2.2, 1.3, 18, 'VIETNAM_FCT_2007', 'Ăn sống, trộn dầu giấm, cuốn'),
  item('cai-cuc', 'Rau tần ô (Cải cúc)', 'Rau củ quả', 'bó', false, 0.84, 18, 1.6, 0.2, 2.5, 1.5, 38, 'VIETNAM_FCT_2007', 'Nấu canh thịt băm rất ngọt'),
  item('hoa-thien-ly', 'Hoa thiên lý', 'Rau củ quả', 'g', false, 0.90, 29, 2.8, 0.3, 3.8, 2.8, 12, 'VIETNAM_FCT_2007', 'Xào thịt bò, nấu canh cua/giò sống'),
  item('bong-dien-dien', 'Bông điên điển miền Tây', 'Rau củ quả', 'g', false, 0.92, 27, 2.5, 0.3, 4.0, 2.4, 10, 'VIETNAM_FCT_2007', 'Nấu canh chua cá linh, xào tép'),
  item('bap-chuoi-bao', 'Bắp chuối bào (Hoa chuối)', 'Rau củ quả', 'g', false, 0.85, 20, 1.5, 0.2, 3.5, 3.2, 8, 'VIETNAM_FCT_2007', 'Bóp gỏi gà, ăn bún bò/canh bún'),
  item('ngo-sen', 'Ngó sen tươi', 'Rau củ quả', 'g', false, 0.88, 46, 1.1, 0.1, 10.2, 2.2, 15, 'VIETNAM_FCT_2007', 'Gỏi ngó sen tôm thịt giòn mát'),

  item('ca-chua', 'Cà chua', 'Rau củ quả', 'quả', false, 0.95, 19, 0.6, 0.2, 3.8, 1.4, 13, 'VIETNAM_FCT_2007', 'Giàu Lycopene'),
  item('dua-leo', 'Dưa leo (Dưa chuột)', 'Rau củ quả', 'quả', false, 0.88, 15, 0.8, 0.1, 2.9, 0.7, 5, 'VIETNAM_FCT_2007', 'Ăn kèm cơm tấm, bóp gỏi'),
  item('bau-sao', 'Quả bầu tươi', 'Rau củ quả', 'quả', false, 0.84, 14, 0.6, 0.0, 2.9, 1.0, 4, 'VIETNAM_FCT_2007', 'Canh bầu nấu tôm / hến, bầu luộc'),
  item('bi-dao', 'Bí đao (Bí xanh)', 'Rau củ quả', 'g', false, 0.78, 12, 0.6, 0.1, 2.4, 1.0, 6, 'VIETNAM_FCT_2007', 'Siêu ít calo (12 kcal/100g), thanh nhiệt giảm cân'),
  item('bi-do', 'Bí đỏ (Bí ngô)', 'Rau củ quả', 'g', false, 0.80, 27, 0.9, 0.1, 6.2, 0.9, 6, 'VIETNAM_FCT_2007', 'Canh bí đỏ hầm sườn / tôm, giàu Beta-caroten'),
  item('muop-huong', 'Mướp hương', 'Rau củ quả', 'quả', false, 0.80, 17, 0.9, 0.1, 3.0, 0.8, 4, 'VIETNAM_FCT_2007', 'Mướp xào lòng gà, canh mướp mồng tơi'),
  item('kho-qua', 'Khổ qua (Mướp đắng)', 'Rau củ quả', 'quả', false, 0.82, 16, 0.9, 0.1, 3.0, 1.4, 6, 'VIETNAM_FCT_2007', 'Khổ qua nhồi thịt, khổ qua xào trứng'),
  item('su-su', 'Quả su su', 'Rau củ quả', 'quả', false, 0.84, 18, 0.8, 0.1, 3.7, 1.2, 4, 'VIETNAM_FCT_2007', 'Su su xào tỏi, luộc chấm muối vừng'),
  item('su-hao', 'Củ su hào', 'Rau củ quả', 'củ', false, 0.76, 26, 1.6, 0.1, 4.8, 1.5, 20, 'VIETNAM_FCT_2007', 'Xào mực, nấu canh sườn, làm nộm'),
  item('cu-cai-trang', 'Củ cải trắng', 'Rau củ quả', 'củ', false, 0.85, 21, 1.5, 0.0, 3.7, 1.2, 24, 'VIETNAM_FCT_2007', 'Kho thịt, hầm canh ngọt nước'),
  item('ca-rot', 'Cà rốt', 'Rau củ quả', 'củ', false, 0.85, 39, 1.5, 0.2, 8.0, 2.8, 45, 'VIETNAM_FCT_2007', 'Giàu Vitamin A'),
  item('ca-tim', 'Cà tím', 'Rau củ quả', 'quả', false, 0.90, 22, 1.0, 0.1, 4.5, 1.5, 6, 'VIETNAM_FCT_2007', 'Cà tím nướng mỡ hành, om đậu thịt'),
  item('dau-bap', 'Đậu bắp', 'Rau củ quả', 'g', false, 0.86, 33, 2.0, 0.2, 6.0, 3.2, 7, 'VIETNAM_FCT_2007', 'Giàu chất xơ hòa tan tốt cho tiêu hóa'),
  item('dau-cove', 'Đậu cô ve (Đậu que)', 'Rau củ quả', 'g', false, 0.90, 29, 2.0, 0.2, 5.0, 1.6, 6, 'VIETNAM_FCT_2007', 'Xào thịt bò / lòng mề'),
  item('dau-dua', 'Đậu đũa', 'Rau củ quả', 'g', false, 0.90, 31, 2.4, 0.2, 5.2, 1.8, 6, 'VIETNAM_FCT_2007', 'Xào tỏi, xào thịt'),
  item('dau-ha-lan', 'Đậu Hà Lan (Quả non / Hạt)', 'Rau củ quả', 'g', false, 0.92, 42, 2.8, 0.2, 7.5, 2.6, 5, 'VIETNAM_FCT_2007', 'Xào tôm mực, nấu súp'),
  item('bong-cai-xanh', 'Bông cải xanh (Súp lơ xanh)', 'Rau củ quả', 'g', false, 0.78, 30, 3.0, 0.3, 5.2, 2.6, 30, 'VIETNAM_FCT_2007', 'Vua rau xanh cho người tập Gym & giảm cân'),
  item('bong-cai-trang', 'Bông cải trắng (Súp lơ trắng)', 'Rau củ quả', 'g', false, 0.75, 25, 2.2, 0.2, 4.5, 2.0, 25, 'VIETNAM_FCT_2007', 'Xào thập cẩm, làm cơm súp lơ low-carb'),
  item('mang-tuoi', 'Măng tươi đã luộc kỹ', 'Rau củ quả', 'g', false, 0.95, 16, 1.8, 0.1, 2.2, 2.5, 8, 'VIETNAM_FCT_2007', 'Kho thịt, nấu canh vịt'),
  item('mang-chua', 'Măng chua', 'Rau củ quả', 'g', false, 0.95, 15, 1.4, 0.1, 2.0, 2.2, 240, 'VIETNAM_FCT_2007', 'Nấu canh chua cá, lẩu măng'),
  item('gia-do', 'Giá đỗ xanh', 'Rau củ quả', 'g', false, 0.95, 43, 5.5, 0.7, 4.1, 2.0, 6, 'VIETNAM_FCT_2007', 'Xào huyết hẹ, nấu canh chua'),
  item('dua-cai-chua', 'Dưa cải bẹ muối chua', 'Rau củ quả', 'g', false, 0.92, 18, 1.5, 0.2, 2.6, 1.8, 650, 'VIETNAM_FCT_2007', 'Canh dưa bò, cá chép om dưa'),

  item('khoai-tay', 'Khoai tây', 'Rau củ quả', 'củ', false, 0.85, 93, 2.0, 0.1, 21.0, 1.4, 7, 'VIETNAM_FCT_2007', 'Hầm bò/sườn, chiên, nghiền'),
  item('khoai-lang', 'Khoai lang mật / Nhật', 'Rau củ quả', 'củ', false, 0.85, 119, 0.8, 0.2, 28.5, 1.3, 31, 'VIETNAM_FCT_2007', 'Tinh bột hấp thu chậm chuẩn Eat Clean'),
  item('khoai-mon', 'Khoai môn / Khoai sọ', 'Rau củ quả', 'g', false, 0.82, 109, 1.8, 0.1, 25.2, 1.5, 10, 'VIETNAM_FCT_2007', 'Canh khoai môn hầm xương, vịt nấu chao'),
  item('khoai-mo', 'Khoai mỡ tím', 'Rau củ quả', 'g', false, 0.82, 96, 1.6, 0.1, 22.2, 1.4, 12, 'VIETNAM_FCT_2007', 'Canh khoai mỡ tôm băm'),
  item('bap-ngot', 'Bắp ngọt (Ngô ngọt tách hạt)', 'Rau củ quả', 'g', false, 1.0, 86, 3.2, 1.2, 19.0, 2.7, 15, 'VIETNAM_FCT_2007', 'Nấu canh, xào bơ, trộn salad'),
  item('hat-sen-tuoi', 'Hạt sen tươi', 'Rau củ quả', 'g', false, 1.0, 96, 4.5, 0.4, 18.6, 1.8, 8, 'VIETNAM_FCT_2007', 'Hầm gà, nấu chè dưỡng nhan'),
  item('cu-sen', 'Củ sen tươi', 'Rau củ quả', 'g', false, 0.85, 74, 2.6, 0.1, 16.0, 3.1, 40, 'VIETNAM_FCT_2007', 'Canh củ sen hầm sườn thanh mát'),

  item('nam-dong-co', 'Nấm đông cô tươi / Nấm đùi gà', 'Rau củ quả', 'g', false, 0.92, 38, 3.3, 0.4, 5.5, 2.5, 12, 'VIETNAM_FCT_2007', 'Xào dầu hào, kho đậu hũ'),
  item('nam-kim-cham', 'Nấm kim châm', 'Rau củ quả', 'g', false, 0.90, 37, 2.7, 0.3, 6.2, 2.6, 6, 'VIETNAM_FCT_2007', 'Cuộn thịt bò, nấu canh, nhúng lẩu'),
  item('nam-rom', 'Nấm rơm tươi', 'Rau củ quả', 'g', false, 0.92, 35, 3.6, 0.3, 4.5, 2.1, 10, 'VIETNAM_FCT_2007', 'Nấm rơm kho tiêu, xào tỏi, nấu canh'),
  item('nam-bao-ngu', 'Nấm bào ngư (Nấm sò)', 'Rau củ quả', 'g', false, 0.92, 33, 3.3, 0.4, 4.8, 2.3, 14, 'VIETNAM_FCT_2007', 'Hấp sả, xào sả ớt, nấu cháo'),

  item('dua-chin', 'Dứa chín (Thơm / Khóm)', 'Rau củ quả', 'g', false, 0.60, 38, 0.8, 0.0, 8.8, 0.8, 2, 'VIETNAM_FCT_2007', 'Nấu canh chua, kho cá, xào chua ngọt'),
  item('xoai-xanh', 'Xoài xanh bào sợi', 'Rau củ quả', 'quả', false, 0.72, 52, 0.6, 0.2, 12.2, 1.6, 4, 'VIETNAM_FCT_2007', 'Làm gỏi xoài khô cá / tôm thịt'),
  item('chuoi-xanh', 'Chuối tiêu xanh', 'Rau củ quả', 'quả', false, 0.65, 76, 1.2, 0.2, 17.5, 2.6, 4, 'VIETNAM_FCT_2007', 'Ốc/ếch/lươn om chuối đậu'),
  item('bo-sap', 'Quả bơ sáp chín', 'Rau củ quả', 'quả', false, 0.72, 160, 2.0, 14.7, 8.5, 6.7, 7, 'USDA_FDC', 'Chất béo không bão hòa tốt cho tim mạch'),

  // ==========================================================================
  // 4. GIA VỊ NÊM NẾM & RAU THƠM (Rau thơm, Củ gia vị, Nước chấm, Sốt) — 36 loại
  // ==========================================================================
  item('hanh-la', 'Hành lá (Hành hoa)', 'Gia vị nêm nếm', 'g', false, 0.85, 26, 1.8, 0.3, 4.3, 1.8, 16, 'VIETNAM_FCT_2007', 'Rau nêm thiết yếu mọi món canh/kho'),
  item('ngo-ri', 'Ngò rí (Rau mùi)', 'Gia vị nêm nếm', 'g', false, 0.85, 23, 2.1, 0.5, 3.2, 2.8, 46, 'VIETNAM_FCT_2007', 'Thơm dịu món canh, súp'),
  item('ngo-gai', 'Ngò gai (Mùi tàu) & Rau ngổ', 'Gia vị nêm nếm', 'g', false, 0.85, 25, 2.0, 0.3, 4.0, 2.4, 28, 'VIETNAM_FCT_2007', 'Gia vị chuẩn cho canh chua'),
  item('rau-ram', 'Rau răm', 'Gia vị nêm nếm', 'g', false, 0.80, 32, 2.4, 0.4, 5.2, 2.6, 20, 'VIETNAM_FCT_2007', 'Kho cá, trộn gỏi gà, nấu canh hến'),
  item('thi-la', 'Rau thì là', 'Gia vị nêm nếm', 'g', false, 0.82, 28, 2.6, 0.4, 4.0, 2.1, 35, 'VIETNAM_FCT_2007', 'Khử tanh tuyệt vời cho món cá, chả mực'),
  item('la-lot', 'Lá lốt tươi', 'Gia vị nêm nếm', 'g', false, 0.85, 39, 4.3, 0.5, 4.4, 2.5, 18, 'VIETNAM_FCT_2007', 'Bò cuốn lá lốt, canh mít/cà bung'),
  item('tia-to', 'Lá tía tô & Kinh giới', 'Gia vị nêm nếm', 'g', false, 0.82, 35, 2.9, 0.6, 4.8, 2.4, 15, 'VIETNAM_FCT_2007', 'Ốc om chuối đậu, cháo giải cảm'),
  item('hung-que', 'Rau húng quế / Húng lủi', 'Gia vị nêm nếm', 'g', false, 0.80, 24, 2.5, 0.5, 3.0, 2.0, 12, 'VIETNAM_FCT_2007', 'Trộn gỏi, ăn kèm phở/bún'),
  item('la-giang', 'Lá giang tươi', 'Gia vị nêm nếm', 'g', false, 0.78, 28, 2.2, 0.3, 4.5, 2.2, 10, 'VIETNAM_FCT_2007', 'Lẩu gà lá giang, canh chua cá kèo'),
  item('la-chanh', 'Lá chanh tươi', 'Gia vị nêm nếm', 'g', true, 0.90, 42, 2.2, 0.6, 8.0, 3.0, 10, 'VIETNAM_FCT_2007', 'Gà luộc, gà rang muối, muối ớt xanh'),
  item('can-tay', 'Cần tây / Cần nước', 'Gia vị nêm nếm', 'g', false, 0.85, 16, 0.9, 0.2, 3.0, 1.6, 80, 'VIETNAM_FCT_2007', 'Xào thịt bò, xào mực, ép nước detox'),

  item('hanh-kho', 'Hành khô / Hành tím', 'Gia vị nêm nếm', 'g', true, 0.88, 40, 1.5, 0.1, 8.3, 1.5, 4, 'VIETNAM_FCT_2007', 'Phi thơm, ướp thịt cá'),
  item('toi', 'Tỏi ta', 'Gia vị nêm nếm', 'g', true, 0.85, 121, 6.0, 0.1, 24.0, 1.5, 10, 'VIETNAM_FCT_2007', 'Giàu Allicin tăng đề kháng'),
  item('hanh-tay', 'Hành tây', 'Gia vị nêm nếm', 'củ', false, 0.90, 41, 1.8, 0.1, 8.2, 1.7, 10, 'VIETNAM_FCT_2007', 'Xào bò, trộn gỏi, ngọt nước dùng'),
  item('gung-tuoi', 'Gừng tươi', 'Gia vị nêm nếm', 'g', true, 0.88, 80, 1.8, 0.8, 17.8, 2.0, 13, 'VIETNAM_FCT_2007', 'Ấm bụng, khử mùi tanh'),
  item('sa-cay', 'Sả cây tươi / Sả băm', 'Gia vị nêm nếm', 'cây', true, 0.75, 99, 1.8, 0.5, 25.3, 2.2, 6, 'VIETNAM_FCT_2007', 'Kho sả ớt, hấp nghêu, nướng gà'),
  item('nghe-tuoi', 'Nghệ tươi / Bột nghệ', 'Gia vị nêm nếm', 'g', true, 0.85, 65, 1.5, 0.5, 13.8, 2.1, 12, 'VIETNAM_FCT_2007', 'Tạo màu vàng đẹp và tốt cho dạ dày'),
  item('rieng-tuoi', 'Củ riềng tươi', 'Gia vị nêm nếm', 'g', false, 0.82, 71, 1.2, 0.4, 15.8, 2.4, 10, 'VIETNAM_FCT_2007', 'Kho cá trắm, nấu giả cầy'),
  item('ot-tuoi', 'Ớt hiểm / Ớt sừng tươi', 'Gia vị nêm nếm', 'quả', true, 0.88, 40, 1.9, 0.4, 8.8, 1.5, 9, 'VIETNAM_FCT_2007', 'Tạo vị cay nồng kích thích vị giác'),
  item('ot-chuong-do', 'Ớt chuông (Đỏ / Xanh / Vàng)', 'Gia vị nêm nếm', 'quả', false, 0.85, 31, 1.0, 0.3, 6.0, 2.1, 4, 'VIETNAM_FCT_2007', 'Rất giàu Vitamin C, xào bò/ức gà'),
  item('chanh-tuoi', 'Chanh tươi / Tắc (Quất)', 'Gia vị nêm nếm', 'quả', true, 0.50, 24, 0.9, 0.2, 4.8, 0.5, 4, 'VIETNAM_FCT_2007', 'Pha nước chấm, trộn gỏi'),
  item('me-chua', 'Me vắt (Me chua nấu canh)', 'Gia vị nêm nếm', 'g', true, 0.85, 165, 2.3, 0.5, 38.0, 3.5, 28, 'VIETNAM_FCT_2007', 'Nấu canh chua, sốt me'),

  item('nuoc-mam', 'Nước mắm truyền thống', 'Gia vị nêm nếm', 'thìa canh', true, 1.0, 35, 6.5, 0.0, 2.2, 0.0, 7720, 'VIETNAM_FCT_2007', 'Linh hồn gia vị Việt'),
  item('nuoc-tuong-dau-nanh', 'Nước tương (Xì dầu)', 'Gia vị nêm nếm', 'thìa canh', true, 1.0, 53, 7.0, 0.1, 5.6, 0.0, 5493, 'VIETNAM_FCT_2007', 'Chấm rau luộc, ướp món xào/chay'),
  item('dau-hao', 'Dầu hào', 'Gia vị nêm nếm', 'thìa canh', true, 1.0, 51, 1.4, 0.2, 10.9, 0.1, 2733, 'VIETNAM_FCT_2007', 'Tạo độ bóng mượt và vị ngọt dịu'),
  item('tuong-ot', 'Tương ớt / Tương cà', 'Gia vị nêm nếm', 'thìa canh', true, 1.0, 95, 1.2, 0.3, 22.0, 0.8, 1150, 'VIETNAM_FCT_2007', 'Sốt chua ngọt, chấm đồ chiên'),
  item('mam-nem', 'Mắm nêm / Mắm tôm / Mắm ruốc', 'Gia vị nêm nếm', 'thìa canh', true, 1.0, 72, 12.5, 1.8, 1.5, 0.0, 6800, 'VIETNAM_FCT_2007', 'Đặc sản mắm truyền thống 3 miền'),
  item('dau-an', 'Dầu thực vật (Dầu đậu nành / hướng dương)', 'Gia vị nêm nếm', 'thìa canh', true, 1.0, 884, 0.0, 100.0, 0.0, 0.0, 0, 'VIETNAM_FCT_2007', '1 thìa canh (10ml) ~88 kcal'),
  item('dau-o-liu', 'Dầu ô liu nguyên chất (Extra Virgin)', 'Gia vị nêm nếm', 'thìa cà phê', true, 1.0, 884, 0.0, 100.0, 0.0, 0.0, 2, 'USDA_FDC', 'Trộn salad, áp chảo lành mạnh'),
  item('dau-me', 'Dầu mè thơm (Dầu vừng)', 'Gia vị nêm nếm', 'thìa cà phê', true, 1.0, 884, 0.0, 100.0, 0.0, 0.0, 0, 'VIETNAM_FCT_2007', 'Tạo hương thơm đặc trưng'),
  item('duong-kinh', 'Đường kính trắng / Đường phèn', 'Gia vị nêm nếm', 'thìa cà phê', true, 1.0, 397, 0.0, 0.0, 99.3, 0.0, 1, 'VIETNAM_FCT_2007', 'Cân bằng vị mặn/chua'),
  item('mat-ong', 'Mật ong nguyên chất', 'Gia vị nêm nếm', 'thìa cà phê', true, 1.0, 304, 0.3, 0.0, 82.4, 0.2, 4, 'VIETNAM_FCT_2007', 'Ướp thịt nướng/áp chảo, pha sốt'),
  item('muoi-an', 'Muối tinh / Muối hạt', 'Gia vị nêm nếm', 'thìa cà phê', true, 1.0, 0, 0.0, 0.0, 0.0, 0.0, 38758, 'VIETNAM_FCT_2007', 'Gia vị cơ bản'),
  item('hat-nem', 'Hạt nêm thịt thăn / nấm hương', 'Gia vị nêm nếm', 'thìa cà phê', true, 1.0, 180, 8.5, 2.0, 32.0, 0.0, 18500, 'VIETNAM_FCT_2007', 'Nêm canh, xào, kho'),
  item('tieu-den', 'Hạt tiêu đen xay / Tiêu xanh', 'Gia vị nêm nếm', 'thìa cà phê', true, 1.0, 251, 10.4, 3.3, 38.7, 25.3, 20, 'VIETNAM_FCT_2007', 'Dậy mùi thơm nồng'),
  item('giam-gao', 'Giấm gạo lên men', 'Gia vị nêm nếm', 'thìa canh', true, 1.0, 18, 0.0, 0.0, 0.9, 0.0, 5, 'VIETNAM_FCT_2007', 'Trộn gỏi, pha sốt chua ngọt'),
  item('nuoc-dua-tuoi', 'Nước dừa tươi', 'Gia vị nêm nếm', 'ml', false, 1.0, 19, 0.3, 0.1, 4.4, 0.0, 25, 'VIETNAM_FCT_2007', 'Kho thịt/cá mềm ngọt tự nhiên'),
  item('nuoc-cot-dua', 'Nước cốt dừa béo', 'Gia vị nêm nếm', 'ml', false, 1.0, 197, 2.0, 21.0, 2.8, 0.0, 15, 'VIETNAM_FCT_2007', 'Nấu cà ri, chè, tép rang dừa'),

  // ==========================================================================
  // 5. ĐỒ KHÔ, GẠO, BÚN, MÌ & HẠT DINH DƯỠNG — 28 loại
  // ==========================================================================
  item('gao-te', 'Gạo tẻ thơm (Cơm trắng)', 'Đồ khô', 'g', true, 1.0, 344, 7.9, 1.0, 76.2, 0.4, 5, 'VIETNAM_FCT_2007', '100g gạo sống nấu được ~250g cơm chín (~130 kcal/chén)'),
  item('gao-lut', 'Gạo lứt huyết rồng / Gạo lứt đen', 'Đồ khô', 'g', true, 1.0, 345, 7.5, 2.7, 72.8, 3.4, 10, 'VIETNAM_FCT_2007', 'Giàu chất xơ và Vitamin B1, no lâu giảm cân'),
  item('gao-nep', 'Gạo nếp cái hoa vàng', 'Đồ khô', 'g', true, 1.0, 344, 8.2, 1.5, 74.9, 0.6, 6, 'VIETNAM_FCT_2007', 'Nấu xôi, chè, cháo'),
  item('yen-mach', 'Yến mạch cán dẹt (Rolled Oats)', 'Đồ khô', 'g', true, 1.0, 379, 13.2, 6.5, 67.7, 10.1, 6, 'USDA_FDC', 'Cháo yến mạch giảm cân, giàu Beta-glucan'),
  item('bun-tuoi', 'Bún tươi', 'Đồ khô', 'g', false, 1.0, 110, 1.7, 0.0, 25.7, 0.3, 12, 'VIETNAM_FCT_2007', 'Bún tươi ăn bún thịt nướng, bún nước'),
  item('banh-pho-tuoi', 'Bánh phở tươi', 'Đồ khô', 'g', false, 1.0, 141, 3.2, 0.4, 31.2, 0.4, 18, 'VIETNAM_FCT_2007', 'Nấu phở bò, phở gà, phở cuốn'),
  item('mien-dong', 'Miến dong khô', 'Đồ khô', 'g', true, 1.0, 332, 0.6, 0.1, 82.2, 1.5, 18, 'VIETNAM_FCT_2007', 'Miến gà, miến xào cua, canh miến'),
  item('hu-tieu-kho', 'Bánh hủ tiếu / Phở khô', 'Đồ khô', 'g', true, 1.0, 340, 6.8, 0.8, 76.5, 0.8, 25, 'VIETNAM_FCT_2007', 'Hủ tiếu Nam Vang, phở trộn'),
  item('mi-trung', 'Mì trứng / Mì vắt', 'Đồ khô', 'g', true, 1.0, 368, 11.2, 3.5, 72.8, 2.2, 180, 'VIETNAM_FCT_2007', 'Mì xào bò, mì xào hải sản'),
  item('banh-trang', 'Bánh tráng cuốn (Bánh đa nem)', 'Đồ khô', 'g', true, 1.0, 333, 6.5, 0.5, 75.8, 0.5, 220, 'VIETNAM_FCT_2007', 'Cuốn gỏi cuốn, chả giò'),
  item('bot-nang', 'Bột năng / Bột bắp', 'Đồ khô', 'g', true, 1.0, 352, 0.3, 0.1, 87.6, 0.2, 8, 'VIETNAM_FCT_2007', 'Tạo độ sánh cho sốt và súp'),
  item('bot-chien-gion', 'Bột chiên giòn / Bột mì', 'Đồ khô', 'g', true, 1.0, 346, 9.8, 1.1, 74.2, 1.8, 320, 'VIETNAM_FCT_2007', 'Áo bột chiên giòn'),

  item('tom-kho', 'Tôm khô', 'Đồ khô', 'g', true, 1.0, 269, 55.6, 3.8, 2.5, 0.0, 850, 'VIETNAM_FCT_2007', 'Nấu canh bầu bí, kho quẹt'),
  item('ca-com-kho', 'Cá cơm khô', 'Đồ khô', 'g', true, 1.0, 275, 52.0, 6.2, 1.5, 0.0, 1250, 'VIETNAM_FCT_2007', 'Kho tiêu mặn ngọt, rang chua ngọt'),
  item('nam-huong-kho', 'Nấm hương khô (Nấm đông cô khô)', 'Đồ khô', 'g', true, 1.0, 274, 12.5, 1.6, 52.3, 11.5, 38, 'VIETNAM_FCT_2007', 'Ngâm nở nấu canh măng, chả giò, kho'),
  item('moc-nhi-kho', 'Mộc nhĩ khô (Nấm mèo)', 'Đồ khô', 'g', true, 1.0, 304, 10.6, 0.2, 65.0, 21.0, 52, 'VIETNAM_FCT_2007', 'Giòn sần sật, làm nhân nem/mọc'),
  item('rong-bien-kho', 'Rong biển khô nấu canh', 'Đồ khô', 'g', true, 1.0, 245, 22.0, 2.5, 45.0, 28.0, 1850, 'ASEANFOODS_FAO', 'Canh rong biển đậu hũ/thịt băm giàu i-ốt'),

  item('dau-phong', 'Đậu phộng nhân (Lạc rang)', 'Đồ khô', 'g', true, 1.0, 573, 27.5, 44.5, 15.5, 4.8, 6, 'VIETNAM_FCT_2007', 'Giã nhỏ rắc gỏi, làm muối lạc'),
  item('hat-dieu', 'Hạt điều rang', 'Đồ khô', 'g', true, 1.0, 553, 18.2, 43.8, 30.2, 3.3, 12, 'VIETNAM_FCT_2007', 'Gà xào hạt điều, sữa hạt điều'),
  item('me-trang', 'Hạt mè trắng / Mè đen (Vừng)', 'Đồ khô', 'g', true, 1.0, 568, 20.1, 46.4, 17.6, 6.2, 11, 'VIETNAM_FCT_2007', 'Giàu canxi và chất béo tốt'),
  item('dau-xanh', 'Đậu xanh cà vỏ', 'Đồ khô', 'g', true, 1.0, 328, 23.4, 2.4, 53.1, 4.7, 6, 'VIETNAM_FCT_2007', 'Nấu chè, nấu cháo, đồ xôi'),
  item('dau-den', 'Đậu đen xanh lòng', 'Đồ khô', 'g', true, 1.0, 325, 24.2, 1.7, 53.3, 4.0, 10, 'VIETNAM_FCT_2007', 'Nấu nước đậu đen, chè, hầm gà'),
  item('dau-do', 'Đậu đỏ', 'Đồ khô', 'g', true, 1.0, 324, 22.0, 1.6, 55.4, 5.2, 8, 'VIETNAM_FCT_2007', 'Hầm canh dưỡng huyết, nấu chè'),
  item('hat-chia', 'Hạt Chia / Hạt lanh', 'Đồ khô', 'g', true, 1.0, 486, 16.5, 30.7, 42.1, 34.4, 16, 'USDA_FDC', 'Siêu giàu chất xơ và Omega-3 thực vật'),
];
