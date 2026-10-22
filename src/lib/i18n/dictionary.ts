// Bộ từ điển song ngữ Việt – Anh (VI ↔ EN) toàn diện cho giao diện, danh mục, công cụ Y khoa (/tinh-calo), cẩm nang và món ăn Ăn Gì Mom

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
  'Tính TDEE/Calo': 'TDEE & Calories',
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
  'Nhật ký': 'Food Diary',
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
  '© 2026 ĂN GÌ MOM — Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.':
    '© 2026 ĂN GÌ MOM — Home-cooked Vietnamese meals, made effortless.',
  'Nền tảng gợi ý bữa cơm gia đình Việt Nam, chuẩn hóa định lượng nguyên liệu theo khẩu phần và tính toán Calo/Macro dựa trên Bảng Thành Phần Thực Phẩm Việt Nam (Viện Dinh Dưỡng).':
    'Vietnamese family meal planning platform with standardized ingredient portions and verified Calorie/Macro calculations based on the Vietnam Food Composition Table (NIN).',
  'Về Ăn Gì Mom': 'About Us',
  'Hỏi đáp (FAQ)': 'FAQ',
  'Danh mục Món ăn': 'Recipe Categories',
  'Tất cả công thức nấu ăn': 'All Cooking Recipes',
  'Món chính (Mặn) đưa cơm': 'Savory Main Dishes',
  'Món canh thanh mát': 'Refreshing Soups',
  'Món phụ & Rau xào': 'Sides & Stir-Fried Veggies',
  'Món một đĩa (Bún, Phở, Mì)': 'One-Bowl Meals (Pho, Noodles)',
  'Mục tiêu Dinh dưỡng': 'Nutrition Goals',
  '⚖️ Tính TDEE, BMI & Calo cá nhân': '⚖️ Personal TDEE, BMI & Calorie Calculator',
  'Thực đơn Giảm cân · Ít Calo': 'Weight Loss · Low-Calorie Menu',
  'Thực đơn Tập Gym · Tăng cơ': 'Gym · Muscle Gain Menu',
  'Món ăn dưới 300 kcal/khẩu phần': 'Dishes Under 300 kcal/serving',
  'Bữa ăn dưới 500 kcal/khẩu phần': 'Meals Under 500 kcal/serving',
  'Tiện ích Bếp gia đình': 'Smart Kitchen Tools',
  'Ghép Mâm cơm 3 món': '3-Dish Meal Builder',
  'Lập Kế hoạch Thực đơn Tuần': '7-Day Weekly Meal Planner',
  'Tủ lạnh nhà tôi (Gợi ý từ đồ sẵn có)': 'My Pantry (Cook from What You Have)',
  'Danh sách Đi chợ theo quầy': 'Aisle-Sorted Grocery List',
  'Sơ đồ trang web (Sitemap XML)': 'XML Sitemap',
  'Giới thiệu & Phương pháp FCT': 'About & FCT Methodology',
  'Câu hỏi thường gặp (FAQ)': 'Frequently Asked Questions (FAQ)',
  'Chính sách Bảo mật': 'Privacy Policy',
  'Điều khoản & Miễn trừ Y khoa': 'Terms & Medical Disclaimer',

  // Homepage Hero & Quick Chips
  'Gian bếp của Mẹ • Bữa cơm gia đình ấm áp mỗi ngày': "Mom's Kitchen • Warm Family Meals Every Day",
  'Cơm nhà chuẩn vị • Bớt nghĩ hôm nay ăn gì': 'Authentic Home Cooking • No More "What to Eat Today?"',
  'Hôm nay nhà mình ăn gì?': 'What Is Our Family Eating Today?',
  'Từ mâm cơm 3 món sum vầy (Mặn • Canh • Rau), bát nước chấm gia truyền đến thực đơn':
    'From cozy 3-dish family trays (Main • Soup • Veggie) and traditional dipping sauces to',
  'Giảm cân ít Calo & Tập Gym': 'Low-Calorie Weight Loss & Gym Menus',
  '— tất cả đã được cân chỉnh định lượng chuẩn xác cho gia đình Việt.':
    '— all accurately portioned and calorie-verified for Vietnamese families.',
  'Từ món mặn đưa cơm, canh thanh mát, rau xào xanh giòn đến nước chấm gia truyền và thực đơn chuẩn Calo — tất cả đã cân chỉnh định lượng rõ ràng cho bếp Việt.':
    'From savory braised dishes, refreshing soups, and crispy stir-fried greens to traditional dipping sauces and calorie-verified menus — all clearly portioned for your kitchen.',
  'Tìm món ăn hoặc nguyên liệu: thịt kho trứng, canh chua, ức gà, cá hồi...':
    'Search dishes or ingredients: braised pork, sour soup, chicken breast, salmon...',
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
  '🎲 Chưa biết ăn gì? Bấm quay mâm cơm ngẫu nhiên!': '🎲 Not sure what to eat? Spin a random meal tray!',
  'Đang chọn mâm cơm ngon...': 'Picking a delicious meal tray...',
  '⚖️ Tính TDEE / BMI & Calo cá nhân': '⚖️ Personal TDEE / BMI & Calorie Calculator',
  'Chuẩn Viện Dinh Dưỡng VN': 'Vietnam NIN Verified',
  '👨‍👩‍👧‍👦 1 – 8 người ăn': '👨‍👩‍👧‍👦 1 – 8 servings',
  'Mâm cơm chiều sum họp': 'Cozy Family Dinner Tray',
  'Đủ đầy 3 món Mặn • Canh • Rau trong 30 phút vào bếp': 'Complete 3-Dish Meal (Main • Soup • Veggie) in 30 Mins',
  'Eat Clean Giảm Cân': 'Eat Clean Weight Loss',
  '≤ 350 – 500 kcal/bữa': '≤ 350 – 500 kcal/meal',
  'Thực Đơn Tập Gym': 'Gym & Fitness Menu',
  'Giàu Đạm 25–45g/phần': 'High Protein 25–45g/serving',

  // Homepage Bento Categories
  'Danh mục bếp nhà': 'Kitchen Categories',
  'Chọn món theo đúng vị & mục tiêu hôm nay': 'Browse by Dish Role & Health Goal',
  'Mở bộ lọc tất cả món': 'Explore All Filters',
  'Món Mặn Đưa Cơm': 'Savory Main Dishes',
  'Kho tộ, rim mặn ngọt, chiên sả, nướng đậm đà': 'Claypot braised, caramelized, lemongrass fried & grilled mains',
  'Kho, rim, chiên, nướng đậm đà làm tâm điểm cho mâm cơm gia đình':
    'Rich braised, caramelized, and grilled main dishes at the heart of the family table',
  'Trụ cột mâm cơm': 'Core Main',
  'Món Canh Thanh Mát': 'Refreshing Soups',
  'Canh chua, canh rau tôm thịt, hầm xương ngọt nước': 'Sweet & sour soup, veggie shrimp broth & slow-simmered ribs',
  'Canh chua, canh rau, canh hầm ngọt nước giúp bữa cơm dịu vị, dễ ăn':
    'Sweet & sour soups, vegetable broths, and slow-simmered soups to balance the meal',
  'Dịu vị bữa ăn': 'Soothing Broth',
  'Rau Xào & Món Phụ': 'Stir-Fries & Sides',
  'Rau Xào & Món Phụ Giòn Ngon': 'Crispy Stir-Fries & Veggie Sides',
  'Rau luộc chấm kho quẹt, xào tỏi xanh giòn, gỏi trộn': 'Boiled greens, garlic stir-fries & fresh Vietnamese salads',
  'Bổ sung chất xơ và vitamin tự nhiên, cân bằng dinh dưỡng mỗi ngày':
    'Rich in natural dietary fiber and vitamins for daily nutritional balance',
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
  'Tập Gym • Giàu Protein': 'Gym • High Protein',
  'Ức gà, thăn bò, cá hồi, tôm trứng chuẩn Macro tăng cơ': 'Chicken breast, beef tenderloin, salmon & shrimp for muscle gain',
  '25–45g Đạm/phần': '25–45g Protein/serving',
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
  'Kết hợp hài hòa đạm, canh thanh mát và chất xơ • Ước tính đứng bếp song song khoảng':
    'Balanced protein, refreshing soup & fiber • Estimated parallel cooking time:',
  '• Năng lượng ước tính:': '• Estimated energy:',
  '(khoảng': '(approx.',
  'nếu ăn kèm 1 chén cơm trắng).': 'with 1 bowl of steamed white rice).',
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
  'Khác với món Âu ăn theo đĩa riêng, cơm gia đình Việt Nam là':
    'Unlike Western individual plates, a traditional Vietnamese meal is a',
  'mâm cơm gắp chung kèm cơm trắng và nước chấm':
    'shared family tray served with steamed rice and dipping sauces',
  '. Để kiểm soát cân nặng và sức khỏe thật chuẩn mà không cần cân tiểu ly từng miếng, bạn chỉ cần nắm quy tắc 3 kịch bản dưới đây:':
    '. To manage your weight and health effortlessly without weighing every bite, simply follow these 3 practical meal scenarios:',
  'Tra cứu món đã kiểm định Calo': 'Browse Calorie-Verified Dishes',
  '380 – 480 kcal / bữa': '380 – 480 kcal / meal',
  '~1.300 – 1.500 kcal/ngày': '~1,300 – 1,500 kcal/day',
  '550 – 650 kcal / bữa': '550 – 650 kcal / meal',
  '~1.800 – 2.000 kcal/ngày': '~1,800 – 2,000 kcal/day',
  '700 – 850 kcal / bữa': '700 – 850 kcal / meal',
  '~2.200 – 2.500 kcal/ngày': '~2,200 – 2,500 kcal/day',
  'Cấu trúc 1 bữa:': '1-Meal Formula:',
  '½ – 1 chén cơm (~90 kcal) + Món mặn hấp/kho ít mỡ (~190 kcal) + Canh rau (~50 kcal) + Rau luộc/gỏi (~70 kcal)':
    '½ – 1 bowl rice (~90 kcal) + Steamed/lean main dish (~190 kcal) + Veggie soup (~50 kcal) + Boiled greens/salad (~70 kcal)',
  '1 – 1.5 chén cơm (~160 kcal) + Món mặn kho/rim vừa (~260 kcal) + Canh (~70 kcal) + Rau xào (~90 kcal)':
    '1 – 1.5 bowls rice (~160 kcal) + Braised/savory main (~260 kcal) + Soup (~70 kcal) + Stir-fried veggies (~90 kcal)',
  '1.5 – 2 chén cơm (~240 kcal) + Món mặn giàu đạm thịt/cá/trứng (~350 kcal) + Canh hầm (~120 kcal) + Rau củ (~90 kcal)':
    '1.5 – 2 bowls rice (~240 kcal) + High-protein meat/fish/egg main (~350 kcal) + Simmered soup (~120 kcal) + Veggies (~90 kcal)',
  '💡 Ưu tiên ức gà, cá hấp, đậu hũ, tôm thịt nạc; chấm nước mắm nguyên chất pha loãng thay vì sốt sệt nhiều đường.':
    '💡 Prioritize chicken breast, steamed fish, tofu & lean shrimp; use light fish sauce dip instead of sugary thick sauces.',
  '💡 Công thức chuẩn cho bữa tối gia đình 4 người: đủ 3 nhóm chất Đạm – Xơ – Tinh bột, không lo tích mỡ thừa.':
    '💡 Ideal formula for a 4-person family dinner: balanced Protein – Fiber – Carbs without excess fat storage.',
  '💡 Tăng khẩu phần thịt bò, cá thu, trứng, thịt heo nạc vai để đạt 30–40g Protein tự nhiên trong mỗi bữa ăn.':
    '💡 Increase lean beef, mackerel, eggs, and pork shoulder portions to hit 30–40g of natural Protein per meal.',
  'Giảm cân nhẹ nhàng (Eat Clean Việt)': 'Gentle Weight Loss (Vietnamese Eat Clean)',
  'Giữ dáng & Cơm nhà cân bằng': 'Balanced Family Maintenance',
  'Tăng cơ • Ngày vận động nhiều': 'Muscle Gain • Active & Gym Days',
  'Xem món ≤ 350 kcal': 'View Dishes ≤ 350 kcal',
  'Ghép mâm cân bằng': 'Build Balanced Meal',
  'Xem món giàu đạm': 'View High-Protein Dishes',
  'Gợi ý Mâm cơm theo thể trạng thành viên trong nhà (1 chạm áp dụng ngay)':
    'One-Click Meal Trays Tailored to Family Members',
  'Mở bàn ghép mâm & tính Calo theo chén cơm →': 'Open Meal Builder & Rice Calorie Calculator →',
  'Thực đơn Eat Clean • Giảm mỡ': 'Eat Clean • Fat Loss Menu',
  'Ưu tiên món hấp, luộc, ít dầu mỡ ≤ 350 kcal/phần kèm ½ chén cơm gạo lứt & muối ớt xanh.':
    'Steamed, poached, low-oil dishes ≤ 350 kcal/serving with ½ bowl of brown rice & green chili salt.',
  '380–480 kcal/bữa': '380–480 kcal/meal',
  'Thực đơn Mẹ bầu & Sau sinh': 'Pregnancy & Postpartum Menu',
  'Giàu đạm tự nhiên, sắt, canxi và canh hầm ngọt lành, ít cay nồng.':
    'Rich in natural protein, iron, calcium, and nourishing mild soups.',
  'Giàu Đạm & Sắt': 'High Protein & Iron',
  'Thực đơn Người lớn tuổi': 'Senior-Friendly Menu',
  'Món mềm dễ tiêu, canh thanh nhiệt, cá/đậu hũ, giảm muối Natri tốt cho huyết áp.':
    'Soft, easy-to-digest fish/tofu dishes, cooling soups & low sodium for healthy blood pressure.',
  'Ít dầu mỡ • Dịu mặn': 'Low Oil • Low Sodium',
  'Thực đơn Cho bé dễ ăn': 'Kid-Friendly Menu',
  'Mềm ngọt tự nhiên, không cay, giàu đạm và vitamin giúp bé ăn ngon miệng.':
    'Naturally sweet, tender, non-spicy dishes rich in protein and vitamins for kids.',
  'Không cay • Đưa cơm': 'Non-Spicy • Appetizing',
  'Áp dụng mâm này': 'Apply This Tray',
  'Quy đổi nhanh "Đơn vị Bếp Nhà" (Phần hay bị quên khi tính Calo)':
    'Quick "Home Kitchen Unit" Calorie Conversions (Often Overlooked)',
  '1 chén cơm trắng vừa (100g chín)': '1 medium bowl of white rice (100g cooked)',
  '28g tinh bột • 2.7g đạm': '28g carbs • 2.7g protein',
  '1 chén cơm gạo lứt (100g chín)': '1 medium bowl of brown rice (100g cooked)',
  'Giàu chất xơ gấp 3 lần, no lâu': '3x more fiber, keeps you full longer',
  '1 muỗng canh dầu ăn / mỡ (10ml)': '1 tbsp cooking oil / fat (10ml)',
  'Lưu ý khi chiên ngập dầu hoặc xào bóng': 'Keep in mind when deep-frying or glossy stir-frying',
  '1 chén nhỏ nước chấm / kho quẹt': '1 small bowl of dipping sauce / kho quet',
  'Chứa ~600–900mg Natri (cần giảm nếu huyết áp cao)': 'Contains ~600–900mg Sodium (reduce if hypertensive)',
  'Gợi ý món Thanh Đạm & Ít Calo (≤ 400 kcal/phần)': 'Light & Low-Calorie Picks (≤ 400 kcal/serving)',
  'Đã đối chiếu định lượng nguyên liệu từ Bảng Thành Phần Thực Phẩm Việt Nam.':
    'Verified against the Vietnamese Food Composition Table (Ministry of Health).',
  'Xem thêm món giảm cân →': 'More Weight-Loss Recipes →',
  'Chọn mâm 3 món cân bằng': 'Pick a Balanced 3-Dish Tray',
  'Đủ 1 Món Mặn + 1 Món Canh + 1 Món Rau. Tự động nhân chia nguyên liệu và ước tính Calo chuẩn xác theo số người ăn.':
    '1 Main + 1 Soup + 1 Veggie Side. Automatically scales ingredient quantities and calories by servings.',
  'Đi chợ 1 lần theo từng quầy': 'Shop Once by Market Aisle',
  'Tự động cộng dồn hành, tỏi, thịt cá của cả 3 món theo quầy hàng và gửi nhanh qua Zalo cho người nhà.':
    'Automatically merges garlic, shallots, meat, and veggies across all dishes by market aisle for easy sharing.',
  'Đứng bếp nhàn tênh từng giai đoạn': 'Cook Effortlessly Phase by Phase',
  'Thanh tiến trình 4 giai đoạn (Sơ chế → Ướp → Nấu → Trình bày), bấm giờ từng bước và gợi ý nấu song song.':
    '4-phase progress bar (Prep → Marinate → Cook → Plate), built-in step timers, and parallel cooking tips.',
  'Góc Bếp Cộng Đồng & Gia Truyền': 'Community & Family Heirloom Kitchen',
  'Bạn có bí quyết món kho, bát canh hay chén nước chấm tâm đắc?':
    'Have a beloved family braised dish, soup, or dipping sauce recipe?',
  'Chia sẻ công thức của gia đình bạn lên Ăn Gì Mom để hệ thống tự động tính bảng dinh dưỡng chuẩn Viện Dinh Dưỡng và lưu giữ cho gian bếp Việt.':
    'Share your family recipe on Ăn Gì Mom to automatically calculate verified nutrition facts and preserve it.',
  'Giải đáp nhanh cho Bếp Nhà': 'Quick Answers for Your Kitchen',
  'Câu hỏi thường gặp về Ăn Gì Mom & Tính Calo Cơm Nhà':
    'Frequently Asked Questions About Ăn Gì Mom & Family Calorie Tracking',
  'Xem toàn bộ Câu hỏi thường gặp (FAQ)': 'View All FAQs',
  '1. Chỉ số Calo & Đạm trên Ăn Gì Mom được tính như thế nào?':
    '1. How are Calories & Protein calculated on Ăn Gì Mom?',
  'Mọi công thức được đối chiếu từ': 'All recipes are cross-referenced against the',
  'Bảng Thành Phần Thực Phẩm Việt Nam (Viện Dinh Dưỡng — Bộ Y Tế)':
    'Vietnamese Food Composition Table (National Institute of Nutrition — Ministry of Health)',
  'và': 'and',
  ', đã trừ hao hụt phần thải bỏ (xương, vỏ, gốc rau) để tính đúng năng lượng thực ăn trên 1 người.':
    ', deducting inedible refuse (bones, shells, stems) to calculate true edible energy per serving.',
  '2. Làm sao ghép mâm cơm 3 món dưới 500–600 kcal/bữa?':
    '2. How do I build a 3-dish family meal under 500–600 kcal/meal?',
  'Bạn chỉ cần vào mục': 'Simply visit the',
  'Ghép mâm cơm': 'Meal Builder',
  'hoặc chọn chế độ': 'or select',
  'Eat Clean • Giảm mỡ': 'Eat Clean • Fat Loss',
  ', hệ thống sẽ tự chọn 1 Món Mặn + 1 Canh + 1 Rau xào cân bằng định lượng và tổng kết Calo cả mâm.':
    ', and the system will pair 1 Main + 1 Soup + 1 Veggie side with full calorie totals.',
  '3. Tôi có thể đổi số người ăn từ 4 người sang 2 hoặc 6 người không?':
    '3. Can I scale servings from 4 people to 2 or 6 people?',
  'Có! Trên mọi trang công thức và mâm cơm, khi bạn bấm tăng/giảm số người ăn, định lượng từng nguyên liệu (thịt, cá, rau, gia vị) sẽ tự động co giãn theo quy tắc bếp thực tế.':
    'Yes! On every recipe and meal tray page, adjusting the serving count automatically scales all ingredients and seasonings.',
  '4. Danh sách đi chợ có gộp chung nguyên liệu nhiều món không?':
    '4. Does the grocery list combine ingredients across multiple dishes?',
  'Có! Tính năng': 'Yes! The',
  'tự động cộng dồn hành, tỏi, thịt cá của tất cả các món trong mâm hoặc cả tuần và chia sẵn theo từng quầy hàng chợ Việt.':
    'feature automatically aggregates ingredients across all dishes in your meal or weekly plan and sorts them by market aisle.',

  // Clinical TDEE / BMI / Calorie Calculator (/tinh-calo)
  'Chuẩn Y Khoa: Mifflin-St Jeor (ADA) • WHO Châu Á (IDI/WPRO) • Viện Dinh Dưỡng Quốc Gia':
    'Clinical Standard: Mifflin-St Jeor (ADA) • WHO Asia-Pacific (IDI/WPRO) • Vietnam NIN',
  'Đã hiệu chỉnh cân nặng tham chiếu (ABW) & quy đổi chén cơm Việt':
    'Adjusted Body Weight (ABW) & Vietnamese Rice Bowl Conversion Verified',
  'Tính TDEE, BMR, BMI & Quy Đổi Định Lượng Bữa Cơm Gia Đình':
    'Clinical TDEE, BMR, BMI & Family Meal Portion Calculator',
  'Không chỉ tính con số lý thuyết — công cụ đối chiếu đồng thời':
    'Beyond theoretical numbers — this clinical tool cross-verifies',
  '3 phương trình trao đổi chất y khoa': '3 medical metabolic equations',
  ', phân loại thể trạng theo': ', classifies body status by',
  'chuẩn người Việt (Bộ Y Tế)': 'Vietnamese Ministry of Health standards',
  'và quy đổi trực tiếp ra': 'and converts results directly into',
  'số chén cơm, số gram thịt/cá tươi sống & rau xanh': 'bowls of rice, grams of raw meat/fish & fresh vegetables',
  'bạn cần nấu mỗi ngày.': 'you need to cook each day.',
  'Ghép mâm cơm theo chỉ số của tôi': 'Build Meal Tray for My Macros',
  'Tra cứu Bảng Calo 214+ nguyên liệu VN': 'Browse 214+ VN Ingredients Calorie Table',
  '1. Thông số cơ thể của bạn': '1. Your Body Metrics',
  'Tự động tính tức thì': 'Instant Calculation',
  'Giới tính sinh học (Hệ số BMR Mifflin-St Jeor)': 'Biological Sex (Mifflin-St Jeor BMR Factor)',
  '👩 Nữ giới (-161)': '👩 Female (-161)',
  '👨 Nam giới (+5)': '👨 Male (+5)',
  'Độ tuổi': 'Age',
  'tuổi': 'yrs',
  'Chiều cao': 'Height',
  'Cân nặng': 'Weight',
  '🎯 Cân nặng mong muốn': '🎯 Target Weight',
  '💪 % Mỡ cơ thể (Nếu biết)': '💪 Body Fat % (Optional)',
  'Tùy chọn (InBody)': 'Optional (InBody)',
  'Cường độ vận động hàng tuần (Hệ số PAL chuẩn FAO/WHO)': 'Weekly Activity Level (FAO/WHO PAL Multiplier)',
  'Ít vận động (PAL × 1.20)': 'Sedentary (PAL × 1.20)',
  'Làm việc văn phòng, nội trợ nhẹ, đi bộ dưới 4.000 bước/ngày': 'Desk job, light housework, < 4,000 steps/day',
  'Vận động nhẹ (PAL × 1.375)': 'Lightly Active (PAL × 1.375)',
  'Tập thể dục nhẹ, đi bộ nhanh hoặc yoga 1 – 3 buổi/tuần': 'Light exercise, brisk walking, or yoga 1–3 days/week',
  'Vận động vừa (PAL × 1.55)': 'Moderately Active (PAL × 1.55)',
  'Tập Gym, chạy bộ, bơi lội, cầu lông 3 – 5 buổi/tuần': 'Gym, running, swimming, or sports 3–5 days/week',
  'Vận động cao (PAL × 1.725)': 'Very Active (PAL × 1.725)',
  'Tập luyện cường độ cao 6 – 7 buổi/tuần hoặc công việc di chuyển liên tục': 'Intense training 6–7 days/week or active physical job',
  'Vận động rất nặng (PAL × 1.90)': 'Extra Active (PAL × 1.90)',
  'Vận động viên chuyên nghiệp hoặc lao động thể lực nặng 2 buổi/ngày': 'Competitive athlete or heavy physical labor twice daily',
  'Mục tiêu kiểm soát cân nặng & thể hình': 'Weight & Body Composition Goal',
  'Giảm cân chuẩn Y khoa (-500 kcal/ngày • Giảm ~0.45 kg/tuần)':
    'Clinical Weight Loss (-500 kcal/day • ~0.45 kg/week)',
  'Mức thâm hụt chuẩn NIH & Bộ Y Tế (3.500 kcal/tuần), kết hợp Đạm cao (1.8g/kg) để giữ 100% cơ nạc':
    'Standard NIH & MOH deficit (3,500 kcal/week) with high Protein (1.8g/kg) to preserve 100% lean muscle',
  'Eat Clean nhẹ nhàng • Giảm mỡ bền vững (-300 kcal/ngày • ~0.3 kg/tuần)':
    'Gentle Eat Clean • Sustainable Fat Loss (-300 kcal/day • ~0.3 kg/week)',
  'Giảm nhẹ năng lượng, không gây đói mệt, rất phù hợp người mới bắt đầu hoặc phụ nữ văn phòng':
    'Mild calorie deficit without hunger or fatigue, ideal for beginners and office workers',
  'Giữ dáng & Cơm nhà cân bằng (±0 kcal • 100% TDEE)':
    'Weight Maintenance & Balanced Family Meals (±0 kcal • 100% TDEE)',
  'Duy trì cân nặng hiện tại, tối ưu tỷ lệ Đạm – Xơ – Tinh bột chuẩn Viện Dinh Dưỡng Quốc Gia':
    'Maintain current weight with optimal Protein – Fiber – Carb ratios per Vietnam NIN',
  'Tập Gym • Tăng cơ nạc (Lean Bulk +300 kcal/ngày)':
    'Gym • Lean Muscle Gain (Lean Bulk +300 kcal/day)',
  'Dư thừa calo kiểm soát (+300 kcal) kèm 2.0g Protein/kg giúp tổng hợp cơ bắp tối đa mà hạn chế tích mỡ':
    'Controlled +300 kcal surplus with 2.0g Protein/kg for maximum muscle synthesis and minimal fat gain',
  'Chỉ số BMI': 'BMI Index',
  'BMR (Trao đổi chất nền)': 'BMR (Basal Metabolic Rate)',
  'kcal/ngày (mức tối thiểu sống)': 'kcal/day (resting baseline)',
  'TDEE (Tổng tiêu hao)': 'TDEE (Total Daily Energy)',
  '🎯 Calo Mục Tiêu': '🎯 Target Calories',
  '2. Định lượng Dinh dưỡng Đa lượng (Macro) & Quy đổi ra Thực phẩm Đi chợ':
    '2. Daily Macronutrient Targets & Real-Food Kitchen Portions',
  '🥩 Chất Đạm (Protein)': '🥩 Protein',
  '🍚 Đường Bột (Carbs)': '🍚 Carbohydrates',
  '🥑 Chất Béo (Fat)': '🥑 Healthy Fats',
  '🥬 Chất Xơ & Vi chất': '🥬 Dietary Fiber & Micros',
  '/ ngày': '/ day',
  'Chuẩn IOM': 'IOM Standard',
  'Muối Natri < 2.000mg • Đường tự do < 25g': 'Sodium < 2,000mg • Free Sugar < 25g',
  'Quy đổi thực tế ra “Đơn vị Bếp Nhà” trong 1 ngày (Để bạn đi chợ & đong cơm đúng chuẩn):':
    'Real-World "Home Kitchen Portions" per Day (For accurate grocery shopping & rice measuring):',
  'Lưu ý quan trọng:': 'Important Note:',
  '100g thịt/cá tươi sống': '100g of raw meat/fish',
  '20g – 23g chất Đạm (Protein) nguyên chất': '20g – 23g of pure Protein',
  '🥩 Lượng Thịt / Cá / Hải sản / Trứng cần nấu:': '🥩 Daily Raw Meat / Fish / Seafood / Eggs to Cook:',
  '🍚 Số chén cơm (Bữa Trưa + Bữa Tối):': '🍚 Daily Rice Bowls (Lunch + Dinner):',
  '🥬 Lượng Rau xanh & Canh mỗi ngày:': '🥬 Daily Fresh Vegetables & Soup:',
  '400g – 500g rau củ tươi / ngày': '400g – 500g fresh veggies / day',
  'Mỗi chén cơm vừa (100g chín) = 130 kcal (cơm trắng) hoặc 110 kcal (cơm gạo lứt), ăn kèm bún/phở/yến mạch vào bữa sáng.':
    'Each medium bowl (100g cooked) = 130 kcal (white rice) or 110 kcal (brown rice), paired with pho/noodles/oats at breakfast.',
  '3. Phân bổ Định lượng vào 3 Bữa Ăn Hàng Ngày (Sáng 28% • Trưa 40% • Tối 32%)':
    '3. Daily 3-Meal Calorie & Protein Distribution (Breakfast 28% • Lunch 40% • Dinner 32%)',
  '☀️ Bữa Sáng (28%)': '☀️ Breakfast (28%)',
  '🌤️ Bữa Trưa (40%)': '🌤️ Lunch (40%)',
  '🌙 Bữa Tối Cơm Nhà (32%)': '🌙 Family Dinner (32%)',
  'Khẩu phần gợi ý:': 'Suggested Portion:',
  'Lập thực đơn 7 ngày': '7-Day Meal Planner',
  '4. Bảng đối chiếu xác thực từ 3 Phương trình Y khoa Quốc tế':
    '4. Multi-Formula Clinical Verification Table (3 International Equations)',
  'Phương trình Y khoa': 'Clinical Equation',
  'Cơ quan khuyến nghị': 'Recommending Authority',
  'BMR của bạn': 'Your BMR',
  'TDEE của bạn': 'Your TDEE',
  'Trạng thái áp dụng': 'Active Status',
  'Hiệp hội Dinh dưỡng Hoa Kỳ (ADA) & Viện Dinh Dưỡng VN': 'American Dietetic Association (ADA) & Vietnam NIN',
  'Đang dùng chính (Chuẩn vàng)': 'Primary Formula (Gold Standard)',
  'Đối chiếu': 'Reference',
  'Roza & Shizgal (Phương trình cổ điển hiệu chỉnh)': 'Roza & Shizgal (Revised Classic Equation)',
  'Đối chiếu tham khảo': 'Cross-Reference',
  'Dành cho VĐV / Người biết chính xác % Mỡ cơ thể (InBody)': 'For Athletes / Known Body Fat % (InBody)',
  'Nhập % mỡ ở cột trái': 'Enter Body Fat % on left',
  'Đang dùng chính (Theo % Mỡ)': 'Primary Formula (Body Fat %)',
  'Tùy chọn nâng cao': 'Advanced Optional',
  'Nguồn tài liệu xác thực:': 'Verified Clinical References:',

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
  'Màn hình luôn sáng': 'Screen Awake ON',
  'Giữ sáng màn hình': 'Keep Screen Awake',
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
  'Ảnh đại diện món ăn (Hero image — Có thể đổi ảnh trực tiếp bất kỳ lúc nào)':
    'Recipe Hero Image (Can be updated directly anytime)',
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
  [/^Chuẩn VN: ([\d.]+)–([\d.]+) kg$/i, 'VN Ideal: $1–$2 kg'],
  [/^kcal\/ngày \((.+)\)$/i, 'kcal/day ($1)'],
  [/^Nước uống: ([\d.]+) lít\/ngày$/i, 'Water Intake: $1 L/day'],
  [/^~(\d+)g tươi sống \/ ngày$/i, '~$1g raw weight / day'],
  [/^~(\d+)g Đạm$/i, '~$1g Protein'],
  [/^~(\d+) kcal\/người$/i, '~$1 kcal/person'],
  [/^Ghép ngay Mâm cơm 3 món khớp mức (\d+) kcal\/bữa tối$/i, 'Build 3-Dish Meal Tray Matching $1 kcal Dinner'],
  [/^Xem các món ăn ≤ (\d+) kcal\/khẩu phần$/i, 'Browse Dishes ≤ $1 kcal/serving'],
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

  // Inline token replacements for mixed dynamic strings
  if (
    trimmed.includes('Phân loại Bộ Y Tế VN') ||
    trimmed.includes('Lộ trình từ ') ||
    trimmed.includes('Dự kiến ~') ||
    trimmed.includes('chén cơm') ||
    trimmed.includes('so với TDEE') ||
    trimmed.includes('Tổng thời gian khoảng') ||
    trimmed.includes('Hiện có ') ||
    trimmed.includes('Đang xem dòng ')
  ) {
    const out = trimmed
      .replace(/Phân loại Bộ Y Tế VN & WHO Châu Á:/g, 'VN MOH & WHO Asia Classification:')
      .replace(/Bình thường • Chuẩn người Việt/g, 'Normal Weight • VN Standard')
      .replace(/Thừa cân \/ Tiền béo phì/g, 'Overweight / Pre-Obese')
      .replace(/Béo phì độ I/g, 'Obesity Class I')
      .replace(/Béo phì độ II/g, 'Obesity Class II')
      .replace(/Thiếu cân \/ Thể trạng gầy/g, 'Underweight')
      .replace(/Chuẩn Châu Á/g, 'Asian Standard')
      .replace(/Lộ trình từ /g, 'Timeline from ')
      .replace(/Giảm /g, 'Lose ')
      .replace(/Tăng /g, 'Gain ')
      .replace(/Dự kiến ~(\d+) tuần \(([\d.]+) tháng\) an toàn y khoa/g, 'Est. ~$1 weeks ($2 months) clinically safe')
      .replace(/chén cơm trắng/g, 'bowls white rice')
      .replace(/chén gạo lứt/g, 'bowls brown rice')
      .replace(/so với TDEE/g, 'vs. TDEE')
      .replace(/Tổng thời gian khoảng/g, 'Total time approx.')
      .replace(/Biên soạn bởi/g, 'Curated by')
      .replace(/Chia sẻ bởi/g, 'Shared by')
      .replace(/Phiên bản/g, 'Version')
      .replace(/Hiện có (\d+) nguyên liệu chuẩn hóa/g, '$1 standardized ingredients')
      .replace(/Đang hoạt động: (\d+) nhãn trên 4 trục/g, 'Active: $1 tags across 4 axes')
      .replace(/Đang xem dòng/g, 'Showing rows')
      .replace(/trên tổng số/g, 'of')
      .replace(/nguyên liệu/g, 'ingredients')
      .replace(/(\d+)\s*người/g, '$1 servings')
      .replace(/(\d+)\s*phút/g, '$1 mins');
    return raw.replace(trimmed, out);
  }

  return raw;
}
