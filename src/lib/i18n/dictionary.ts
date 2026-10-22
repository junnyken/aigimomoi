// Bộ từ điển song ngữ Việt – Anh (VI ↔ EN) cho toàn bộ giao diện, danh mục, nhãn phân loại và nguyên liệu Ăn Gì Mom

export type Locale = 'vi' | 'en';

export const HEADER_LABELS: Record<Locale, Record<string, string>> = {
  vi: {
    '/': 'Trang chủ',
    '/mon-an': 'Tìm món',
    '/tinh-calo': 'Tính TDEE/Calo',
    '/da-luu': 'Đã lưu',
    '/meal': 'Mâm cơm',
    '/shopping': 'Đi chợ',
    '/tu-lanh': 'Tủ lạnh',
    '/ke-hoach-tuan': 'Kế hoạch',
    '/nhat-ky': 'Nhật ký',
    tagline: 'Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.',
    admin: 'Quản trị',
    login: 'Đăng nhập',
    account: 'Tài khoản',
    switchLangTitle: 'Chuyển đổi ngôn ngữ Tiếng Việt / English',
  },
  en: {
    '/': 'Home',
    '/mon-an': 'Recipes',
    '/tinh-calo': 'TDEE & Calories',
    '/da-luu': 'Saved',
    '/meal': 'Meal Tray',
    '/shopping': 'Grocery',
    '/tu-lanh': 'Pantry',
    '/ke-hoach-tuan': 'Planner',
    '/nhat-ky': 'Food Diary',
    tagline: 'Home-cooked Vietnamese meals, made effortless.',
    admin: 'Admin',
    login: 'Sign In',
    account: 'Account',
    switchLangTitle: 'Switch language: Vietnamese / English',
  },
};

export const EXACT_VI_TO_EN: Record<string, string> = {
  // Header, Footer & Navigation
  'Trang chủ': 'Home',
  'Tìm món': 'Recipes',
  'Món ăn': 'Recipes',
  'Đã lưu': 'Saved',
  'Lưu món': 'Save Recipe',
  'Mâm cơm': 'Meal Tray',
  'Đi chợ': 'Grocery',
  'Đi chợ ngay': 'Shop Ingredients',
  'Lên danh sách đi chợ': 'Create Grocery List',
  'Xem danh sách đi chợ': 'View Grocery List',
  'Tủ lạnh': 'Pantry',
  'Tủ lạnh nhà': 'My Pantry',
  'Tủ lạnh nhà mình': 'My Kitchen Pantry',
  'Kế hoạch': 'Planner',
  'Nhật ký': 'Diary',
  'Nhật ký bữa cơm': 'Meal Diary',
  'Xem nhật ký bữa cơm': 'View Meal Diary',
  'Góp món ngon': 'Submit Recipe',
  'Gửi công thức': 'Submit Recipe',
  'Gửi công thức mới': 'Submit New Recipe',
  'Tài khoản': 'Account',
  'Ban biên tập': 'Editorial Hub',
  'Quản trị': 'Admin',
  'Đăng nhập': 'Sign In',
  'Đăng xuất': 'Sign Out',
  'Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.': 'Home-cooked Vietnamese meals, made effortless.',
  'ĂN GÌ MOM — Bữa cơm nhà, bớt nghĩ hôm nay ăn gì. Nền tảng Bếp gia đình Việt.':
    'ĂN GÌ MOM — Effortless Vietnamese Home Cooking & Family Nutrition Platform.',

  // Homepage Hero & Quick Chips
  'Cơm nhà chuẩn vị • Bớt nghĩ hôm nay ăn gì': 'Authentic Home Cooking • No More "What to Eat Today?"',
  'Hôm nay nhà mình ăn gì?': 'What Is Our Family Eating Today?',
  'Từ món mặn đưa cơm, canh thanh mát, rau xào xanh giòn đến nước chấm gia truyền và thực đơn chuẩn Calo — tất cả đã cân chỉnh định lượng rõ ràng cho bếp Việt.':
    'From savory braised dishes, refreshing soups, and crispy stir-fried greens to traditional dipping sauces and calorie-verified menus — all clearly portioned for your kitchen.',
  'Tìm món, nước chấm hoặc nguyên liệu: thịt kho, canh chua, nước mắm...':
    'Search dishes, dipping sauces, or ingredients: braised pork, sour soup, chicken...',
  'Nhanh gọn ≤ 25 phút': 'Quick ≤ 25 mins',
  'Món mặn đưa cơm': 'Savory Main Dishes',
  'Canh thanh mát': 'Refreshing Soups',
  'Rau xào xanh giòn': 'Stir-Fried & Veggies',
  'Giảm cân ≤ 350 kcal': 'Weight Loss ≤ 350 kcal',
  'Nước chấm & Sốt': 'Dipping Sauces',
  'Đã nấu thử tại bếp': 'Kitchen-Tested',
  'Ghép mâm cơm 3 món': 'Build 3-Dish Meal Tray',
  'Tùy chỉnh mâm': 'Customize Tray',
  'Tùy chỉnh mâm này': 'Customize This Tray',

  // Homepage Bento Categories
  'Danh mục bếp nhà': 'Kitchen Categories',
  'Chọn món theo đúng vị & mục tiêu hôm nay': 'Browse by Dish Role & Health Goal',
  'Mở bộ lọc tất cả món': 'Explore All Filters',
  'Món Mặn Đưa Cơm': 'Savory Main Dishes',
  'Kho tộ, rim mặn ngọt, chiên sả, nướng đậm đà': 'Claypot braised, caramelized, lemongrass fried & grilled mains',
  'Trụ cột mâm cơm': 'Core Main',
  'Món Canh Thanh Mát': 'Refreshing Soups',
  'Canh chua, canh rau tôm thịt, hầm xương ngọt nước': 'Sweet & sour soup, veggie shrimp broth & slow-simmered ribs',
  'Dịu vị bữa ăn': 'Soothing Broth',
  'Rau Xào & Món Phụ': 'Stir-Fries & Sides',
  'Rau luộc chấm kho quẹt, xào tỏi xanh giòn, gỏi trộn': 'Boiled greens, garlic stir-fries & fresh Vietnamese salads',
  'Giàu chất xơ': 'High Fiber',
  'Nước mắm tỏi ớt, mắm nêm, kho quẹt, muối ớt xanh': 'Garlic chili fish sauce, caramelized dip & green chili lime salt',
  'Linh hồn món Việt': 'Vietnamese Soul',
  'Món Giảm Cân • Ít Calo': 'Weight Loss • Low Calorie',
  'Hấp, luộc, áp chảo ít dầu mỡ ≤ 350 kcal/khẩu phần': 'Steamed, poached & light pan-seared dishes ≤ 350 kcal/serving',
  'Eat Clean kiểu Việt': 'Vietnamese Eat Clean',
  'Món Nước & Trọn Bữa': 'Noodles & One-Bowl Meals',
  'Bún, phở, miến gà, hủ tiếu, cơm chiên đổi vị cuối tuần': 'Pho, vermicelli bowls, glass noodles & healthy rice bowls',
  'Đổi gió 1 tô': 'One-Bowl Meal',
  'Tráng Miệng & Đồ Uống': 'Desserts & Drinks',
  'Chè thanh nhiệt, sữa hạt, nước sâm, trà trái cây': 'Herbal sweet soups, nut milks & refreshing fruit teas',
  'Ngọt lành': 'Natural Sweet',
  'Đã Kiểm Chứng Bếp Mẫu': 'Kitchen-Tested Recipes',
  'Công thức đã nấu thử thực tế và chuẩn hóa định lượng': 'Cook-tested recipes with verified measurements & timings',
  'Chuẩn vị 100%': '100% Verified',
  'Khám phá': 'Explore',
  'Khám phá ngay': 'Explore Now',
  'Xem tất cả': 'View All',
  'Khám phá tất cả món': 'Explore All Recipes',
  'Món ngon mới lên kệ': 'Newly Published Recipes',
  'Công thức cơm nhà đã qua biên tập, kiểm chứng định lượng và duyệt xuất bản.':
    'Editorially reviewed, portion-verified recipes ready for your family kitchen.',

  // Today Meal Tray & Nutrition Guide
  'Gợi ý thực đơn gia đình hôm nay': "Today's Family Meal Suggestion",
  'Mâm cơm 3 món tròn vị (4 người)': 'Balanced 3-Dish Family Meal Tray (4 Servings)',
  'Món Mặn': 'Main Dish',
  'Món Canh': 'Soup',
  'Món Rau / Xào': 'Side / Veggies',
  'Nước Chấm Đi Kèm': 'Dipping Sauce',
  'Xem cách nấu →': 'View Recipe →',
  'Tùy chỉnh nước chấm →': 'Customize Sauce →',
  'Cẩm nang dinh dưỡng cơm nhà • Viện Dinh Dưỡng Quốc Gia':
    'Family Nutrition Guide • National Institute of Nutrition (Vietnam FCT)',
  'Tham khảo Calo mâm cơm Việt sao cho chuẩn sức khỏe?':
    'How to Balance Calories in a Traditional Vietnamese Family Meal?',
  'Tra cứu món đã kiểm định Calo': 'Browse Calorie-Verified Dishes',
  'Giảm cân nhẹ nhàng (Eat Clean Việt)': 'Gentle Weight Loss (Vietnamese Eat Clean)',
  'Giữ dáng & Cơm nhà cân bằng': 'Balanced Family Maintenance',
  'Tăng cơ • Ngày vận động nhiều': 'Muscle Gain • Active & Gym Days',
  'Xem món ≤ 350 kcal': 'View Dishes ≤ 350 kcal',
  'Ghép mâm cân bằng': 'Build Balanced Meal',
  'Xem món giàu đạm': 'View High-Protein Dishes',
  'Gợi ý món Thanh Đạm & Ít Calo (≤ 400 kcal/phần)': 'Light & Low-Calorie Picks (≤ 400 kcal/serving)',
  'Đã đối chiếu định lượng nguyên liệu từ Bảng Thành Phần Thực Phẩm Việt Nam.':
    'Verified against the Vietnamese Food Composition Table (Ministry of Health).',
  'Xem thêm món giảm cân →': 'More Weight-Loss Recipes →',

  // Search Page (/mon-an)
  'Món ngon mỗi ngày': 'Everyday Delicious Meals',
  'Khám phá món ăn cho bữa cơm nhà': 'Explore Recipes for Your Family Table',
  'Tìm món theo tên, nguyên liệu, vai trò trong mâm cơm (món mặn, canh, rau) hoặc thời gian nấu để bữa cơm luôn tròn vị và bớt nghĩ.':
    'Search by dish name, ingredient, meal role (main, soup, side), calorie target, or cooking time.',
  'Mục tiêu dinh dưỡng:': 'Nutrition Goals:',
  '🥗 Giảm cân · Ít Calo (NHS / BBC Good Food)': '🥗 Weight Loss · Low Calorie (NHS / BBC Good Food)',
  '💪 Tập Gym · Tăng cơ – Giảm mỡ (High Protein)': '💪 Gym · High Protein & Lean Macro',
  '≤ 300 kcal/phần': '≤ 300 kcal/serving',
  'Dưới 300 kcal / khẩu phần': 'Under 300 kcal / serving',
  'Tất cả món': 'All Recipes',
  'Không có kết quả': 'No matching recipes found',

  // Recipe Detail Page (/cong-thuc/[slug])
  'Khám phá món khác': 'Back to Recipes',
  'Ảnh minh họa': 'Illustration Photo',
  'Đã duyệt biên tập': 'Editorially Reviewed',
  'Đã nấu thử': 'Cook-Tested',
  'Đã kiểm chứng dinh dưỡng': 'Nutrition Verified',
  'Sơ chế': 'Prep Time',
  'Nấu': 'Cook Time',
  'Độ khó': 'Difficulty',
  'Khẩu phần gốc': 'Base Servings',
  'Bắt đầu nấu món này': 'Start Cooking Mode',
  'Đưa vào mâm': 'Add to Tray',
  'Đưa vào mâm cơm': 'Add to Meal Tray',
  'Ghi vào Nhật ký': 'Log to Diary',
  '3. Cảm nhận': '3. Reviews',
  'Cảm nhận': 'Reviews',
  'Nguyên liệu & Calo': 'Ingredients & Calories',
  '🥄 Mẹo đong không cần cân': '🥄 Kitchen Measuring Tips',
  'Ẩn mẹo đong bếp': 'Hide Measuring Tips',
  'Tuỳ chọn thêm': 'Optional Ingredients',
  'cố định': 'fixed',
  'Dinh dưỡng 1 khẩu phần': 'Nutrition per Serving',
  '🥩 Chất đạm:': '🥩 Protein:',
  '🧈 Chất béo:': '🧈 Fat:',
  '🍚 Đường bột:': '🍚 Carbs:',
  '🧂 Natri:': '🧂 Sodium:',
  '🥗 Chất xơ thực phẩm:': '🥗 Dietary Fiber:',
  'Thông số Calo từng thành phần (Cả nồi)': 'Calorie Breakdown by Ingredient (Full Batch)',
  '🩺 Căn cứ tính Calo & chế biến (Viện Dinh Dưỡng)': '🩺 Nutrition Methodology (Vietnam FCT)',
  '🌿 Ít Calo (≤350 kcal)': '🌿 Low Calorie (≤350 kcal)',
  '💪 Giàu Đạm tự nhiên': '💪 High Natural Protein',
  '🥗 Giàu Chất xơ': '🥗 High Fiber',
  '💚 Dịu mặn (Tốt huyết áp)': '💚 Low Sodium (Heart Friendly)',
  '🧂 Đậm đà (Lưu ý muối)': '🧂 Savory (Watch Sodium)',
  'Món này chấm gì ngon nhất?': 'Recommended Dipping Sauce',
  'Ghép món này + nước chấm vào mâm': 'Pair Dish + Dipping Sauce in Meal Tray',
  'Cách làm theo từng giai đoạn': 'Step-by-Step Cooking by Phase',
  'Phân loại': 'Tags & Categories',

  // Cooking Mode (Voice & Stepper)
  'Tự động đọc': 'Auto Voice',
  'Tự động đọc: BẬT': 'Auto Voice: ON',
  'Đọc to bước này': 'Read Step Aloud',
  'Dừng đọc': 'Stop Reading',
  'Xem nguyên liệu': 'Ingredients',
  'Bước trước': 'Previous Step',
  'Bước tiếp theo': 'Next Step',
  'Hoàn thành món': 'Finish Cooking',
  'Nấu xong món rồi!': 'Dish Completed!',
  'Xem lại công thức': 'Back to Recipe',

  // Roles & Difficulty
  'Món chính': 'Main Dish',
  'Món chính (Mặn)': 'Main Dish (Savory)',
  'Món canh': 'Soup',
  'Món phụ': 'Side Dish',
  'Món phụ / Rau': 'Side / Veggies',
  'Nước chấm': 'Dipping Sauce',
  'Món ăn một đĩa': 'One-Dish Meal',
  'Tráng miệng': 'Dessert',
  'Đồ uống': 'Beverage',
  'Dễ': 'Easy',
  'Trung bình': 'Medium',
  'Khó': 'Hard',

  // 44 Standard Taxonomies
  'Miền Bắc': 'Northern Vietnam',
  'Miền Trung': 'Central Vietnam',
  'Miền Nam': 'Southern Vietnam',
  'Miền Tây sông nước': 'Mekong Delta',
  'Cố đô Huế': 'Imperial Hue',
  'Duyên hải Nam Trung Bộ': 'South Central Coast',
  'Tây Nguyên & Núi rừng': 'Central Highlands',
  'Giao thoa Á – Âu (Healthy)': 'Asian–Western Healthy Fusion',
  'Món kho': 'Braised / Caramelized',
  'Món xào': 'Stir-Fried',
  'Luộc / Hấp thanh đạm': 'Steamed / Poached',
  'Áp chảo / Nướng ít dầu': 'Pan-Seared / Grilled',
  'Nồi chiên không dầu (Air Fryer)': 'Air Fryer',
  'Chiên giòn / Rán': 'Crispy Fried',
  'Hầm / Ninh mềm': 'Slow-Simmered',
  'Gỏi / Nộm / Salad trộn': 'Vietnamese Salad',
  'Món cuốn & Chấm': 'Fresh Rolls & Wraps',
  'Pha nước chấm & Sốt': 'Dipping Sauces',
  'Nấu một nồi (One-Pan)': 'One-Pan / One-Pot',
  'Giảm cân · Ít Calo': 'Weight Loss · Low Calorie',
  'Tập Gym · Tăng cơ – Giảm mỡ': 'Gym · Muscle Gain & Fat Loss',
  'Thanh đạm': 'Light & Wholesome',
  'Giàu Protein (Đạm cao)': 'High Protein',
  'Ít tinh bột (Low-Carb)': 'Low-Carb',
  'Giàu chất xơ & Vitamin': 'High Fiber & Vitamins',
  'Ít muối · Tốt huyết áp': 'Low Sodium · Blood Pressure Friendly',
  'Tốt cho tim mạch': 'Heart Healthy',
  'Ăn chay / Thuần chay': 'Vegetarian / Vegan',
  'Giải nhiệt mùa hè': 'Summer Cooling',
  'Ấm bụng ngày mưa lạnh': 'Warming Comfort Food',
  'Mẹ bầu & Sau sinh': 'Pregnancy & Postpartum',
  'Mềm dễ tiêu (Cho bé & Người già)': 'Soft & Easy to Digest (Kids & Seniors)',
  'Bữa cơm hàng ngày': 'Everyday Family Meal',
  'Nhanh gọn ≤ 20 phút': 'Quick ≤ 20 Mins',
  'Mang cơm đi làm (Meal Prep)': 'Lunchbox / Meal Prep',
  'Bữa sáng đủ chất': 'Nutritious Breakfast',
  'Bữa tối nhẹ bụng': 'Light Dinner',
  'Cuối tuần đổi vị': 'Weekend Special',
  'Tiệc gia đình & Đãi khách': 'Family Gathering',
  'Mâm cỗ Lễ Tết & Đám giỗ': 'Holiday & Traditional Feast',
  'Ngày Rằm & Mùng Một': 'Lunar Vegetarian Days',
  'Tiết kiệm cuối tháng': 'Budget-Friendly',

  // Editor Pages (/editor/ingredients, /editor/taxonomies, /editor/recipes)
  'Từ điển Nguyên liệu & Dinh dưỡng Bếp Việt': 'Vietnamese Ingredients & Nutrition Dictionary',
  'Hệ thống phân loại đa trục (Taxonomies)': 'Multi-Axis Culinary Taxonomies',
  'Quay lại Ban biên tập': 'Back to Editorial Hub',
  'Quay lại trang chủ': 'Back to Home',
  'Nguồn dữ liệu nguyên liệu': 'Nutrition Data Sources',
  'Ẩn nguồn tra cứu': 'Hide Data Sources',
  'Đồng bộ Kho Nguyên Liệu VN (180+ loại)': 'Sync VN Ingredient Catalog (180+ items)',
  'Đồng bộ 44 Nhãn Phổ Biến Chuẩn VN': 'Sync 44 Standard VN Tags',
  'Thêm nguyên liệu mới': 'Add New Ingredient',
  'Thêm nhãn phân loại mới': 'Add New Category Tag',
  'Thêm nhãn': 'Add Tag',
  'Tất cả': 'All',
  'Thực phẩm tươi sống': 'Fresh Meat, Poultry & Tofu',
  'Thủy hải sản': 'Fish & Seafood',
  'Rau củ quả': 'Vegetables, Roots & Mushrooms',
  'Gia vị nêm nếm': 'Herbs, Spices & Sauces',
  'Đồ khô': 'Dry Goods, Grains & Nuts',
  'Tên nguyên liệu & Công dụng': 'Ingredient Name & Culinary Use',
  'Nhóm thực phẩm': 'Food Group',
  'Đơn vị chuẩn': 'Std Unit',
  'Dinh dưỡng / 100g ăn được': 'Nutrition / 100g Edible',
  'Tỷ lệ thực ăn & Nguồn': 'Edible Rate & Source',
  'Tủ bếp': 'Pantry Status',
  'Thao tác': 'Actions',
  'Sẵn ở bếp': 'Pantry Staple',
  'Mua tươi': 'Buy Fresh',
  'Trước': 'Prev',
  'Sau': 'Next',
  '✨ AI Tự điền Calo & Dinh dưỡng': '✨ AI Auto-Fill Calories & Nutrition',
  'AI đang tra cứu...': 'AI Looking up...',
  'Tự động tính từ tên nguyên liệu': 'Auto-calculate from name',
  'Thêm nguyên liệu mới vào Từ điển': 'Add New Ingredient to Dictionary',
  'Thông số dinh dưỡng / 100g ăn được (AI hỗ trợ điền)': 'Nutrition per 100g Edible Portion (AI-Assisted)',
  'Tải ảnh mới từ thiết bị': 'Upload New Image from Device',
  'Chọn ảnh từ thiết bị': 'Choose Image from Device',
  'Dán link ảnh (URL)': 'Paste Image Link (URL)',
  'Gỡ ảnh hiện tại': 'Remove Current Image',
  'Áp dụng ảnh': 'Apply Image',
  'Đổi ảnh từ máy': 'Change Image',
  'Ảnh đại diện món ăn (Hero image — Có thể đổi ảnh trực tiếp bất kỳ lúc nào)': 'Recipe Hero Image (Can be updated directly anytime)',
};

const PATTERN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/^1\. Nguyên liệu \((\d+)\)$/i, '1. Ingredients ($1)'],
  [/^2\. Cách làm \((\d+) bước\)$/i, '2. Instructions ($1 steps)'],
  [/^Tìm thấy (\d+) món ăn$/i, 'Found $1 recipes'],
  [/^Trang (\d+) \/ (\d+)$/i, 'Page $1 / $2'],
  [/^Bước (\d+) \/ (\d+)$/i, 'Step $1 / $2'],
  [/^Bước (\d+) · (.+)$/i, 'Step $1 · $2'],
  [/^Giai đoạn (\d+): (.+)$/i, 'Phase $1: $2'],
  [/^(\d+) giai đoạn · (\d+) bước thực hiện$/i, '$1 phases · $2 cooking steps'],
  [/^Lộ trình nấu món này \((\d+) giai đoạn\)$/i, 'Cooking Roadmap ($1 phases)'],
  [/^Năng lượng 1 người ăn \(1\/(\d+) nồi\)$/i, 'Energy per serving (1/$1 of batch)'],
  [/^(\d+) thành phần$/i, '$1 ingredients'],
  [/^(\d+) nhãn$/i, '$1 tags'],
  [/^Ăn được: (\d+)%$/i, 'Edible: $1%'],
  [/^Độ khó: Dễ$/i, 'Difficulty: Easy'],
  [/^Độ khó: Trung bình$/i, 'Difficulty: Medium'],
  [/^Độ khó: Khó$/i, 'Difficulty: Hard'],
  [/^Chế độ nấu · Khẩu phần (\d+) người$/i, 'Cooking Mode · $1 Servings'],
  [/^\(thực ăn ~(\d+)g\)$/i, '(edible ~$1g)'],
  [/^Thực ăn: (\d+)g \((\d+)%\)$/i, 'Edible: $1g ($2%)'],
  [/^Đạm (\d+(?:\.\d+)?)g$/i, 'Protein $1g'],
  [/^· Béo (\d+(?:\.\d+)?)g$/i, '· Fat $1g'],
  [/^(\d+) người$/i, '$1 servings'],
  [/^(\d+) phút$/i, '$1 mins'],
  [/^(\d+(?:\.\d+)?)\s*muỗng canh$/i, '$1 tbsp'],
  [/^(\d+(?:\.\d+)?)\s*thìa canh$/i, '$1 tbsp'],
  [/^(\d+(?:\.\d+)?)\s*muỗng cà phê$/i, '$1 tsp'],
  [/^(\d+(?:\.\d+)?)\s*thìa cà phê$/i, '$1 tsp'],
  [/^(\d+(?:\.\d+)?)\s*quả$/i, '$1 pcs'],
  [/^(\d+(?:\.\d+)?)\s*trái$/i, '$1 pcs'],
  [/^(\d+(?:\.\d+)?)\s*củ$/i, '$1 bulbs'],
  [/^(\d+(?:\.\d+)?)\s*tép$/i, '$1 cloves'],
  [/^(\d+(?:\.\d+)?)\s*bó$/i, '$1 bunch'],
  [/^(\d+(?:\.\d+)?)\s*cây$/i, '$1 stalks'],
  [/^(\d+(?:\.\d+)?)\s*nhánh$/i, '$1 sprigs'],
];

export function translateViTextToEn(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  const exact = EXACT_VI_TO_EN[trimmed];
  if (exact) {
    return raw.replace(trimmed, exact);
  }

  for (const [regex, replacement] of PATTERN_REPLACEMENTS) {
    if (regex.test(trimmed)) {
      const converted = trimmed.replace(regex, replacement);
      return raw.replace(trimmed, converted);
    }
  }

  // Inline token replacements for mixed strings
  if (
    trimmed.includes('Đạm ') ||
    trimmed.includes('Béo ') ||
    trimmed.includes('người') ||
    trimmed.includes('phút') ||
    trimmed.includes('Tổng thời gian khoảng') ||
    trimmed.includes('Hiện có ') ||
    trimmed.includes('Đang xem dòng ')
  ) {
    let out = trimmed
      .replace(/Tổng thời gian khoảng/g, 'Total time approx.')
      .replace(/Biên soạn bởi/g, 'Curated by')
      .replace(/Chia sẻ bởi/g, 'Shared by')
      .replace(/Phiên bản/g, 'Version')
      .replace(/Hiện có (\d+) nguyên liệu chuẩn hóa/g, '$1 standardized ingredients')
      .replace(/Đang hoạt động: (\d+) nhãn trên 4 trục/g, 'Active: $1 tags across 4 axes')
      .replace(/Đang xem dòng/g, 'Showing rows')
      .replace(/trên tổng số/g, 'of')
      .replace(/nguyên liệu/g, 'ingredients')
      .replace(/Đạm /g, 'Protein ')
      .replace(/Béo /g, 'Fat ')
      .replace(/Bột /g, 'Carbs ')
      .replace(/(\d+)\s*người/g, '$1 servings')
      .replace(/(\d+)\s*phút/g, '$1 mins');
    return raw.replace(trimmed, out);
  }

  return raw;
}
