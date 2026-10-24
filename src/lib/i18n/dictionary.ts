// Bộ từ điển song ngữ Việt – Anh (VI ↔ EN) toàn diện cho giao diện, danh mục, công cụ Y khoa (/tinh-calo), cẩm nang và món ăn Ăn Gì Mom

export type Locale = 'vi' | 'en';

export const HEADER_LABELS: Record<Locale, Record<string, string>> = {
  vi: {
    '/': 'Trang chủ',
    '/mon-an': 'Tìm món',
    '/tinh-calo': 'Tính Calo',
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
    '/tinh-calo': 'Calories',
    '/da-luu': 'Saved',
    '/meal': 'Meal Tray',
    '/shopping': 'Grocery',
    '/tu-lanh': 'Pantry',
    '/ke-hoach-tuan': 'Planner',
    '/nhat-ky': 'Diary',
    tagline: 'Healthy family meals, made effortless.',
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
  'Tính TDEE/Calo': 'Calories',
  'Tính Calo': 'Calories',
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
  'Quản trị viên Ăn Gì Mom': 'Editorial Admin',
  'Quản trị viên': 'Editorial Admin',
  'Đăng nhập': 'Sign In',
  'Đăng xuất': 'Sign Out',
  'Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.': 'Healthy family meals, made effortless.',
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
  '⚖️ Tính TDEE, BMI & Calo': '⚖️ TDEE, BMI & Calorie Calculator',
  'Thực đơn Giảm cân · Ít Calo': 'Weight Loss · Low-Calorie Menu',
  'Thực đơn Tập Gym · Tăng cơ': 'Gym · Muscle Gain Menu',
  'Món ăn dưới 300 kcal/khẩu phần': 'Dishes Under 300 kcal/serving',
  'Món dưới 300 kcal/phần': 'Dishes Under 300 kcal/serving',
  'Bữa ăn dưới 500 kcal/khẩu phần': 'Meals Under 500 kcal/serving',
  'Bữa dưới 500 kcal/phần': 'Meals Under 500 kcal/serving',
  'Tiện ích Bếp gia đình': 'Smart Kitchen Tools',
  'Ghép Mâm cơm 3 món': '3-Dish Meal Builder',
  'Lập Kế hoạch Thực đơn Tuần': '7-Day Weekly Meal Planner',
  'Kế hoạch Thực đơn Tuần': '7-Day Meal Planner',
  'Tủ lạnh nhà tôi (Gợi ý từ đồ sẵn có)': 'My Pantry (Cook from What You Have)',
  'Tủ lạnh nhà tôi (Đồ sẵn có)': 'My Kitchen Pantry',
  'Danh sách Đi chợ theo quầy': 'Aisle-Sorted Grocery List',
  'Sơ đồ trang web (Sitemap XML)': 'XML Sitemap',
  'Sơ đồ trang web (Sitemap)': 'XML Sitemap',
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
  'Món rau / phụ': 'Side / Veggies',

  // AI Food Plate Scanner (Homepage HeroFoodScannerCard & /tinh-calo FoodPlateScannerPanel)
  'AI Quét Đĩa Ăn • Chuẩn VDD VN': 'AI Plate Scanner • Vietnam FCT Verified',
  'AI đang nhận diện từng loại rau củ, đạm & tính Kcal...':
    'AI Vision is identifying veggies, protein & calculating Kcal...',
  'AI Vision đang nhận diện từng loại rau củ, đạm & tinh bột trên đĩa...':
    'AI Vision is identifying veggies, protein & carbs on your plate...',
  'Đang đối chiếu với Bảng Thành Phần Thực Phẩm Việt Nam (VDD)':
    'Cross-referencing against the Vietnam Food Composition Table (NIN)',
  'Ẩn nhãn': 'Hide Tags',
  'Hiện nhãn': 'Show Tags',
  'Chụp / Tải ảnh': 'Snap / Upload',
  '📸 Chụp / Tải ảnh món ăn của bạn': '📸 Snap / Upload Your Meal Photo',
  'Đang phân tích ảnh...': 'Analyzing photo...',
  'Đang quét AI...': 'Scanning with AI...',
  'Quét / Phân tích lại': 'Re-scan / Analyze',
  '🍝 Mỳ Ý Pesto': '🍝 Pesto Pasta',
  '🍱 Khay 3 Bữa': '🍱 3-Meal Tray',
  '🧘 Đĩa Yoga': '🧘 Yoga Plate',
  '💪 Đĩa Gym': '💪 Gym Plate',
  '🍝 Mẫu 1: Mỳ Ý Pesto & Tôm': '🍝 Sample 1: Pesto Pasta & Shrimp',
  '🍱 Mẫu 2: Khay 3 Bữa (Sáng-Trưa-Tối)': '🍱 Sample 2: 3-Meal Tray (B-L-D)',
  '🧘 Mẫu 3: Đĩa Yoga & Thanh Lọc': '🧘 Sample 3: Yoga & Clean Plate',
  '💪 Mẫu 4: Đĩa Gym Tăng Cơ': '💪 Sample 4: High-Protein Gym Plate',
  'Mỳ Ý Sốt Pesto Xanh, Tôm Cháy Tỏi, Bơ Hoa & Bông Cải Hấp':
    'Green Pesto Spaghetti, Garlic Shrimp, Avocado Rose & Steamed Broccoli',
  'Mỳ Ý Sốt Pesto Xanh, Tôm Cháy Tỏi, Bơ Sáp Cuộn Hoa & Bông Cải Hấp':
    'Green Pesto Spaghetti, Garlic Shrimp, Avocado Rose & Steamed Broccoli',
  'Thực Đơn 3 Bữa: Sáng (Sữa, Trứng, Cam) • Trưa (Bò Bít Tết, Khoai) • Tối (Bắp, Cà Chua)':
    'Full-Day 3-Meal Tray: Breakfast (Milk, Egg, Orange) • Lunch (Steak, Potato) • Dinner (Corn, Tomato)',
  'Thực Đơn 3 Bữa Sáng – Trưa – Tối Chuẩn Kiểm Soát Calo':
    'Calorie-Controlled 3-Meal Daily Tray (Breakfast – Lunch – Dinner)',
  'Thực Đơn Cả Ngày Thứ Tư: Sáng (Sữa, Trứng, Cam) • Trưa (Bò Bít Tết, Khoai Tây, Cải Thìa) • Tối (Bắp, Cà Chua Bi)':
    'Full-Day Menu: Breakfast (Milk, Egg, Orange) • Lunch (Beef Steak, Potato, Bok Choy) • Dinner (Sweet Corn, Cherry Tomato)',
  'Đĩa Eat Clean & Yoga: Trứng Lòng Đào, Bơ Sáp, Bông Cải & Thanh Long Đỏ':
    'Eat Clean & Yoga Plate: Soft-Boiled Eggs, Avocado, Broccoli & Red Dragon Fruit',
  'Đĩa Eat Clean & Yoga Giàu Chất Xơ, Bơ Sáp & Trứng Lòng Đào':
    'High-Fiber Eat Clean & Yoga Plate with Avocado & Soft-Boiled Eggs',
  'Đĩa Tập Gym Tăng Cơ: Tôm Bóc Nõn, Thịt Thăn Luộc, Bắp Ngọt & Rau Xanh':
    'Muscle-Gain Gym Plate: Steamed Shrimp, Boiled Pork Loin, Sweet Corn & Greens',
  'Đĩa Tập Gym Giàu Đạm Nạc (Tôm Nõn, Thịt Thăn, Ức Gà & Bắp Ngọt)':
    'High-Protein Gym Plate (Peeled Shrimp, Lean Pork Loin, Chicken Breast & Sweet Corn)',
  'Tôm cháy tỏi': 'Garlic Seared Shrimp',
  'Tôm bóc nõn cháy tỏi': 'Garlic Seared Peeled Shrimp',
  'Bông cải xanh hấp': 'Steamed Broccoli',
  'Bông cải xanh hấp & Xà lách': 'Steamed Broccoli & Lettuce',
  'Bơ sáp cuộn hoa': 'Avocado Rose',
  'Quả bơ sáp xếp hoa hồng': 'Avocado Rose Slices',
  'Cà chua bi': 'Cherry Tomatoes',
  'Cà chua bi bổ đôi': 'Halved Cherry Tomatoes',
  'Mỳ Ý sốt Pesto': 'Pesto Spaghetti',
  'Mỳ Ý luộc trộn sốt Pesto & Mè đen': 'Pesto Spaghetti with Black Sesame',
  'Sữa tươi + Trứng + Cam': 'Fresh Milk + Egg + Orange',
  '[Sáng] Sữa tươi không đường': '[Breakfast] Unsweetened Fresh Milk',
  '[Sáng] Trứng gà ốp la & Cam vàng': '[Breakfast] Sunny-Side Egg & Fresh Orange',
  'Thăn bò bít tết áp chảo': 'Pan-Seared Beef Tenderloin Steak',
  '[Trưa] Thăn bò bít tết áp chảo': '[Lunch] Pan-Seared Beef Tenderloin Steak',
  'Khoai tây & Cải thìa': 'Potato & Bok Choy',
  '[Trưa] Khoai tây áp chảo ít dầu': '[Lunch] Light Pan-Roasted Potatoes',
  '[Trưa] Cải thìa luộc xanh': '[Lunch] Boiled Green Bok Choy',
  'Bắp ngọt & Cà chua bi': 'Sweet Corn & Cherry Tomatoes',
  '[Tối] Bắp ngọt luộc & 6 quả Cà chua bi': '[Dinner] Boiled Sweet Corn & 6 Cherry Tomatoes',
  'Trứng gà lòng đào': 'Soft-Boiled Eggs',
  'Trứng gà luộc lòng đào': 'Soft-Boiled Eggs',
  'Bông cải xanh & Cải ngọt hấp': 'Steamed Broccoli & Choy Sum',
  'Bơ sáp thái lát': 'Sliced Ripe Avocado',
  'Quả bơ sáp thái lát': 'Sliced Ripe Avocado',
  'Thanh long ruột đỏ': 'Red Dragon Fruit',
  'Thanh long ruột đỏ cắt miếng': 'Cubed Red Dragon Fruit',
  'Ức gà áp chảo mè': 'Sesame Pan-Seared Chicken Breast',
  'Ức gà áp chảo mè rang': 'Roasted Sesame Chicken Breast',
  'Tôm bóc nõn hấp': 'Steamed Peeled Shrimp',
  'Thịt thăn heo luộc': 'Boiled Lean Pork Loin',
  'Thịt thăn heo nạc luộc thái lát': 'Sliced Boiled Lean Pork Loin',
  'Bắp ngọt luộc': 'Boiled Sweet Corn',
  'Bắp ngọt luộc cắt khúc': 'Boiled Sweet Corn Cob',
  'Cải ngọt & Dưa leo': 'Choy Sum & Cucumber',
  'Cải ngọt & Cải thảo luộc': 'Boiled Choy Sum & Napa Cabbage',
  'Dưa leo gọt vỏ thái lát': 'Peeled Sliced Cucumber',
  'Trứng gà luộc': 'Boiled Egg',
  'Ức gà áp chảo': 'Pan-Seared Chicken Breast',
  'Quả bơ sáp chín': 'Ripe Hass/Booth Avocado',
  'Cơm gạo lứt chín': 'Cooked Brown Rice',
  '💧 Hấp/Luộc': '💧 Steamed/Boiled',
  '🍳 Ít dầu (+36)': '🍳 Light Oil (+36)',
  '🥣 Đẫm sốt (+80)': '🥣 Rich Sauce (+80)',
  '💧 Hấp / Luộc (0 kcal)': '💧 Steamed / Boiled (0 kcal)',
  '🍳 Áp chảo ít dầu (+36 kcal)': '🍳 Light Pan-Seared (+36 kcal)',
  '🥣 Xào / Đẫm sốt (+80 kcal)': '🥣 Stir-Fried / Rich Sauce (+80 kcal)',
  '✓ Tỷ lệ đĩa chuẩn Harvard': '✓ Optimal Harvard Plate Ratio',
  '+ Thêm:': '+ Quick Add:',
  '⚡ Thêm nhanh:': '⚡ Quick Add:',
  '+1 Trứng luộc': '+1 Boiled Egg',
  '+1 Trứng (55g)': '+1 Egg (55g)',
  '+60g Ức gà': '+60g Chicken',
  '+80g Bông cải': '+80g Broccoli',
  '+50g Bơ sáp': '+50g Avocado',
  '+100g Cơm lứt': '+100g Brown Rice',
  'Lưu vào Nhật ký': 'Save to Diary',
  'Mở Bàn Quét Đầy Đủ': 'Open Full AI Scanner',
  'Eat Clean & Yoga': 'Eat Clean & Yoga',
  'Xem Nhật ký →': 'View Diary →',
  'Mở Nhật ký Bữa ăn →': 'Open Meal Diary →',
  'Đăng nhập ngay': 'Sign In Now',
  'Đang lưu...': 'Saving...',
  'CÔNG NGHỆ AI VISION + TỪ ĐIỂN VIỆN DINH DƯỠNG VN (195+ NGUYÊN LIỆU)':
    'AI VISION ENGINE + VIETNAM NIN FOOD DICTIONARY (195+ INGREDIENTS)',
  '📸 AI Quét Ảnh Đĩa Ăn — Bóc Tách Rau Củ, Thịt Cá & Tính Kcal':
    '📸 AI Food Plate Scanner — Detect Veggies, Protein & Calculate Kcal',
  'Chụp hoặc tải ảnh đĩa cơm / đĩa Eat Clean của bạn lên (hoặc bấm chọn':
    'Snap or upload a photo of your meal plate (or try one of the',
  '4 mẫu đĩa thực tế': '4 real meal presets',
  'bên dưới) để xác định từng thành phần và khối lượng Kcal:':
    'below) to break down ingredients, weights & calories:',
  '✨ Hoặc bấm thử ngay với 4 mẫu đĩa ăn Eat Clean / Gym thực tế:':
    '✨ Or test immediately with 4 real Eat Clean / Gym plate presets:',
  '(Bạn có thể chỉnh số gram từng loại rau củ/thịt cá sau khi quét)':
    '(You can fine-tune the gram weight of any ingredient after scanning)',
  'Nhập thêm mô tả nếu muốn AI lưu ý (VD: Đĩa của tôi có ức gà, bông cải, 2 quả trứng luộc, sốt mè rang...)':
    'Optional hint for AI (e.g., My plate has chicken breast, broccoli, 2 boiled eggs, sesame dressing...)',
  '🥩 Cần bổ sung thêm Đạm': '🥩 Add More Protein',
  '🥦 Cần tăng tỷ lệ Rau xanh': '🥦 Add More Greens & Veggies',
  '⚖️ Hơi vượt định mức Calo bữa': '⚖️ Slightly Above Meal Calorie Target',
  '🌟 Đĩa ăn cân bằng chuẩn Vàng': '🌟 Golden Balanced Plate',
  '+ Thêm 1 quả trứng luộc (55g)': '+ Add 1 Boiled Egg (55g)',
  '+ Thêm 80g bông cải xanh hấp': '+ Add 80g Steamed Broccoli',
  '📏 Thước đo tỷ lệ AI:': '📏 AI Visual Scale Anchor:',
  '☀️ Bữa Sáng': '☀️ Breakfast',
  '🌤️ Bữa Trưa': '🌤️ Lunch',
  '🌙 Bữa Tối': '🌙 Dinner',
  'Chuẩn Harvard: 50% Rau • 25% Đạm • 25% Tinh bột':
    'Harvard Guide: 50% Veggies • 25% Protein • 25% Carbs',
  '🥦 Rau củ': '🥦 Veggies',
  '🥩 Đạm (Thịt/Cá)': '🥩 Protein',
  '🍚 Tinh bột': '🍚 Carbs',
  '🥑 Béo & Xơ': '🥑 Fat & Fiber',
  '🍳 Dầu mỡ / Sốt chế biến:': '🍳 Cooking Oil / Sauce Level:',
  'Rau củ': 'Veggies',
  'Đạm': 'Protein',
  'Tinh bột': 'Carbs',
  'Béo tốt': 'Healthy Fat',
  '+ Tìm thêm trong 195+ nguyên liệu Viện Dinh Dưỡng...':
    '+ Search 195+ Vietnam NIN verified ingredients...',
  '+ Thêm': '+ Add',
  '🍲 Công thức tương tự trên web:': '🍲 Similar Verified Recipes on Website:',
  'Xem 49 món →': 'View all 49 →',
  '🧘 Yoga & Eat Clean': '🧘 Yoga & Eat Clean',
  '💪 Gym Tăng Cơ': '💪 Muscle Gain Gym',
  '💪 Giàu Sắt & Cơ Bắp': '💪 Iron & Muscle Recovery',
  '🥗 Poke Bowl Chuẩn': '🥗 Balanced Poke Bowl',
  '🌿 Thanh Đạm Nhẹ Bụng': '🌿 Light & Digestible',
  'Salad Tôm Hấp Trứng Luộc Bơ Tươi': 'Steamed Shrimp, Boiled Egg & Fresh Avocado Salad',
  'Ức Gà Áp Chảo Mè Rang & Bông Cải Xanh Hấp': 'Sesame Seared Chicken Breast & Steamed Broccoli',
  'Thăn Bò Áp Chảo Lúc Lắc & Đậu Que Luộc': 'Shaking Beef Tenderloin & Boiled Green Beans',
  'Cơm Gạo Lứt Cá Hồi Áp Chảo & Đậu Nành Edamame': 'Pan-Seared Salmon Brown Rice & Edamame Bowl',
  'Đậu Hũ Non Sốt Nấm Đông Cô & Cải Thìa Hấp': 'Silken Tofu in Shiitake Sauce & Steamed Bok Choy',
  'Vui lòng đăng nhập tài khoản để lưu đĩa ăn đã quét vào Nhật ký dinh dưỡng hàng ngày.':
    'Please sign in to save your scanned meal plate to your daily Nutrition Diary.',
  'Không thể lưu vào Nhật ký lúc này, vui lòng thử lại.':
    'Could not save to Diary right now. Please try again.',
  'Lỗi kết nối máy chủ khi lưu Nhật ký.': 'Server connection error while saving to Diary.',

  // /tinh-calo Right-side 3 Tabs & PersonalizedMealActionPanel
  '1. Chia 3 Bữa & Chi Tiết Macro': '1. 3-Meal Split & Macro Guide',
  '2. Chọn Thực Đơn & Gắn Món Ăn': '2. Meal Plans & Dish Matcher',
  '3. AI Quét Ảnh Đĩa Ăn (Tính Kcal)': '3. AI Food Photo Scanner (Kcal)',
  'Thịt / Cá / Tôm / Trứng': 'Meat / Fish / Shrimp / Eggs',
  'Rau củ quả & Canh': 'Fresh Veggies & Soup',
  '400 – 500g / ngày': '400 – 500g / day',
  'Gạo trắng (~130 kcal/chén)': 'White Rice (~130 kcal/bowl)',
  'Gạo lứt (~110 kcal/chén)': 'Brown Rice (~110 kcal/bowl)',
  'Bấm sang Bước 2 hoặc Bước 3 bên dưới để áp dụng thực đơn hoặc quét ảnh đĩa ăn của bạn:':
    'Switch to Step 2 or Step 3 below to apply a customized meal plan or scan your food photo:',
  'Chọn Thực Đơn Eat Clean / Gym / Yoga →': 'Choose Eat Clean / Gym / Yoga Menu →',
  '📸 Mở AI Quét Ảnh Đĩa Ăn': '📸 Open AI Food Plate Scanner',
  'Bấm vào từng mục bên dưới nếu bạn muốn xem chi tiết 4 nhóm chất (Đạm, Tinh bột, Béo, Xơ) hoặc bảng đối chiếu 3 phương trình Y khoa:':
    'Click any section below to expand detailed macronutrient breakdowns or the 3-equation clinical comparison table:',
  'Đang mở': 'Expanded',
  'Bấm để xem chi tiết': 'Click to expand',
  'Phân tích chi tiết 4 nhóm chất: Đạm (Protein) • Đường bột (Carbs) • Chất béo (Fat) • Chất xơ':
    'Detailed 4-Macronutrient Breakdown: Protein • Carbohydrates • Healthy Fats • Dietary Fiber',
  '2. Ba Nguyên Tắc Vàng Để Đạt Mục Tiêu Mà Không Cần Cân Tiểu Ly':
    '2. Three Golden Rules to Hit Your Goal Without a Kitchen Scale',
  'Quy tắc Đĩa Ăn 2:1:1 (Harvard)': 'The 2:1:1 Plate Rule (Harvard)',
  'Chia đĩa hoặc khẩu phần ăn của bạn thành 4 phần:': 'Divide your meal plate into 4 quarters:',
  '2 phần (50%) là Rau củ luộc/xào ít dầu': '2 quarters (50%) Boiled/Light Stir-Fried Veggies',
  '1 phần (25%) là Thịt/Cá/Đậu hũ/Trứng': '1 quarter (25%) Lean Meat/Fish/Tofu/Eggs',
  '1 phần (25%) là Cơm/Bún/Khoai lang': '1 quarter (25%) Rice/Noodles/Sweet Potato',
  'Thứ tự ăn kiểm soát đường huyết': 'Blood-Sugar Friendly Eating Order',
  'Nên ăn': 'Start with',
  'Canh & Rau xanh trước': 'Soup & Green Veggies first',
  'tiếp theo ăn đến': 'then eat',
  'Thịt / Cá / Đậu hũ': 'Meat / Fish / Tofu',
  'và ăn': 'and finish with',
  'Cơm trắng / Tinh bột cuối cùng': 'Rice / Carbs last',
  'Cách này giúp no nhanh, giảm hấp thu đường mỡ thừa tới 30%.':
    'This sequence promotes satiety and reduces excess glucose/fat absorption by up to 30%.',
  'Kiểm soát “Calo Ẩn” từ Nước chấm & Dầu': 'Watch "Hidden Calories" in Sauces & Oil',
  '1 muỗng canh dầu ăn (10ml) chứa tới': '1 tablespoon of cooking oil (10ml) contains',
  '90 kcal': '90 kcal',
  'Nếu đang giảm mỡ, hãy ưu tiên món': 'For fat loss, prioritize',
  'Hấp, Luộc, Áp chảo chống dính, Nồi chiên không dầu': 'Steamed, Boiled, Non-Stick Pan-Seared & Air-Fried dishes',
  'và chấm nhẹ tay.': 'and go light on dipping sauces.',
  'Đã hiểu lộ trình 3 bữa? Bấm chuyển sang Bước 2 để chọn món ăn thực tế!':
    'Got your 3-meal roadmap? Proceed to Step 2 to pick real dishes!',
  'Xem Thực Đơn & Gắn Món Ăn Ngay →': 'Explore Menus & Match Dishes Now →',
  'Gợi Ý Thực Đơn & Gắn Món Ăn Vào Lịch Hàng Ngày':
    'Personalized Meal Suggestions & Daily Planner Matcher',
  'Chọn': 'Select',
  'Ngày': 'Date',
  'Ngày:': 'Date:',
  'Bữa ăn': 'Meal',
  'ở góc phải, sau đó bấm': 'on the top right, then click',
  'Gắn cả Mâm Cơm': 'Add Full 3-Dish Tray',
  'hoặc chọn từng món lẻ bạn thích bên dưới:': 'or pick individual dishes below:',
  '🎯 Chọn chế độ ăn / tập luyện:': '🎯 Filter by Diet / Workout Style:',
  'Đang tải và đối chiếu các món ăn phù hợp từ kho công thức...':
    'Loading and matching recipes from our verified catalog...',
  'Xem cách nấu': 'View Recipe',
  '✓ Đã gắn': '✓ Added',
  '+ Gắn món này': '+ Add Dish',
  '✓ Đã gắn cả Mâm vào Thực đơn!': '✓ Full Tray Added to Planner!',
  '📅 Gắn cả Mâm Cơm (3 món) vào Thực đơn': '📅 Add Full 3-Dish Tray to Planner',
  '✓ Đã ghi cả Mâm vào Nhật ký!': '✓ Full Tray Logged to Diary!',
  '📝 Ghi cả Mâm vào Nhật ký hôm nay': '📝 Log Full Tray to Today’s Diary',
  'Mở trên Bàn Ghép Mâm & Đi chợ': 'Open in Meal Builder & Grocery List',
  'Hoặc tự chọn lẻ từng món ăn phù hợp trên Website:':
    'Or pick individual matching dishes from the catalog:',
  'Đề xuất hàng đầu': 'Top Matches',
  'Đã gắn Thực đơn': 'Added to Planner',
  'Gắn vào Thực đơn': 'Add to Planner',
  '✓ Đã ghi': '✓ Logged',
  '+ Nhật ký': '+ Diary',
  'Thu gọn danh sách món ăn': 'Collapse recipe list',
  'Tỷ lệ vàng: Sáng 28% • Trưa 40% • Tối 32%':
    'Golden Ratio: Breakfast 28% • Lunch 40% • Dinner 32%',
  '1. THỨ TỰ ĂN TRÊN BÀN': '1. EATING SEQUENCE AT THE TABLE',
  '2. VẬN ĐỘNG & UỐNG NƯỚC': '2. DAILY STEPS & HYDRATION',
  '3. CỘT MỐC THỜI GIAN': '3. TIMELINE MILESTONES',
  '🧘💪 Yoga & Gym': '🧘💪 Yoga & Gym',
  '🧘 Yoga • Eat Clean': '🧘 Yoga • Eat Clean',
  'Cân bằng': 'Balanced',
  '🧘 Canh Thanh Lọc': '🧘 Detox Soup',
  'Canh thanh • Ít Calo': 'Light • Low-Cal Soup',
  'Canh bổ dưỡng': 'Nourishing Soup',
  'Hỗ trợ phục hồi cơ': 'Muscle Recovery',

  // Auth / Register / Anti-Bot / Email Verification
  'Tham gia Gian bếp Ăn Gì Mom': 'Join the Ăn Gì Mom Kitchen',
  'Tạo tài khoản miễn phí để lưu thực đơn, danh sách đi chợ và đồng bộ trên mọi thiết bị.':
    'Create a free account to save meal plans, grocery lists, and sync across all your devices.',
  'Tên hiển thị của bạn': 'Your Display Name',
  'Địa chỉ Email': 'Email Address',
  'Mật khẩu': 'Password',
  'Xác nhận mật khẩu': 'Confirm Password',
  'Tạo tài khoản ngay': 'Create Account',
  'Đã có tài khoản?': 'Already have an account?',
  'Đăng nhập tại đây': 'Sign in here',
  'Xác minh bảo mật: Tôi là người thật (Chống Bot & Spam)':
    'Security Verification: I Am Human (Anti-Bot & Anti-Spam)',
  'Đã xác minh bạn là người thật': 'Human verification complete',
  'Chỉ chấp nhận email thật (Gmail, Outlook, iCloud, tên miền công ty/trường học). Hệ thống tự động chặn 100% email tạm 10 phút / rác.':
    'Only real emails accepted (Gmail, Outlook, iCloud, work/school domains). 10-minute / disposable temp emails are strictly blocked.',
  'Gửi mã xác nhận (OTP) qua Email →': 'Send Verification Code (OTP) to Email →',
  'Đang gửi mã xác nhận...': 'Sending verification code...',
  'Xác nhận mã OTP & Kích hoạt tài khoản': 'Verify OTP Code & Activate Account',
  'Nhập mã 6 số đã gửi tới email của bạn': 'Enter the 6-digit code sent to your email',
  'Quay lại sửa thông tin': 'Back to edit details',
  'Bảo mật 3 Lớp • Chống Bot & Mail Rác': '3-Layer Security • Anti-Bot & Temp-Mail Shield',
  'Đăng ký tài khoản thành viên': 'Create Member Account',
  'Xác thực Email kích hoạt tài khoản': 'Verify Email to Activate Account',
  'Lưu mâm cơm yêu thích, quản lý tủ lạnh, lập thực đơn 7 ngày và theo dõi Nhật ký Calo miễn phí.':
    'Save favorite meal trays, manage your pantry, plan 7-day menus, and track your Calorie Diary for free.',
  '1. Điền thông tin & Chống Bot': '1. Account Details & Anti-Bot',
  '2. Nhập mã OTP Email': '2. Verify Email OTP',
  'Họ và tên / Tên gọi bếp nhà': 'Full Name / Kitchen Nickname',
  'Ví dụ: Mẹ Bắp, Bố Bo, Linh Chi': 'e.g., Chef Linh, Mom Bap',
  'Địa chỉ Email thật (Nhận mã OTP 6 số để kích hoạt)': 'Real Email Address (Receives 6-Digit Activation OTP)',
  '⚠️ Phát hiện tên miền Email tạm / Email 10 phút! Hệ thống chặn 100% mail rác để chống spam.':
    '⚠️ Temporary / 10-minute email detected! Disposable emails are strictly blocked to prevent spam.',
  'Chỉ chấp nhận email thật (Gmail, Outlook, iCloud, công ty/trường học). Tự động chặn mail 10 phút.':
    'Only real emails accepted (Gmail, Outlook, iCloud, work/school). 10-minute temp emails are automatically blocked.',
  'Mật khẩu bảo mật (tối thiểu 8 ký tự)': 'Secure Password (minimum 8 characters)',
  'Xác nhận lại mật khẩu': 'Confirm Password',
  'Độ dài từ 8 ký tự trở lên': 'At least 8 characters long',
  'Nên kết hợp cả chữ cái và chữ số': 'Combine letters and numbers',
  'Hai ô mật khẩu trùng khớp': 'Both password fields match',
  '🤖 Câu hỏi chống Bot:': '🤖 Anti-Bot Check:',
  '3 + 5 bằng mấy?': 'What is 3 + 5?',
  'Bằng việc bấm tiếp tục, bạn đồng ý với': 'By continuing, you agree to the',
  'Điều khoản sử dụng': 'Terms of Use',
  'Chính sách bảo mật': 'Privacy Policy',
  'của Ăn Gì Mom.': 'of Ăn Gì Mom.',
  'Nhập mã xác nhận 6 số từ Email': 'Enter 6-Digit Email Verification Code',
  'Mã xác nhận 6 chữ số': '6-Digit Verification Code',
  'Xác nhận mã OTP & Vào tài khoản': 'Verify OTP & Enter Account',
  'Đang xác thực & kích hoạt...': 'Verifying & Activating...',
  'Quay lại sửa Email': 'Back to Edit Email',
  'Gửi lại mã OTP mới': 'Resend New OTP Code',
  'Điền nhanh': 'Auto-fill',

  // All 49 Published Recipe Titles (dishName & recipeName)
  'Thịt ba chỉ kho tiêu': 'Braised Pork Belly with Black Pepper',
  'Thịt ba chỉ kho tiêu đậm đà': 'Savory Braised Pork Belly with Black Pepper',
  'Gà rang gừng lá chanh': 'Ginger & Lime Leaf Roasted Chicken',
  'Gà rang gừng lá chanh ấm bụng': 'Warming Ginger & Lime Leaf Roasted Chicken',
  'Cá basa kho tộ': 'Claypot Caramelized Basa Fish',
  'Cá basa kho tộ nước dừa': 'Claypot Basa Fish Braised in Coconut Water',
  'Sườn non rim chua ngọt': 'Sweet & Sour Glazed Pork Ribs',
  'Sườn non rim chua ngọt chuẩn vị': 'Classic Sweet & Sour Glazed Pork Ribs',
  'Thịt nạc xào ớt chuông': 'Stir-Fried Lean Pork with Bell Peppers',
  'Thịt nạc xào ớt chuông giòn ngọt': 'Crisp Stir-Fried Lean Pork with Bell Peppers',
  'Canh rau ngót nấu thịt băm': 'Katuk Leaf Soup with Minced Pork',
  'Canh rau ngót thịt băm thanh mát': 'Refreshing Katuk Leaf & Minced Pork Soup',
  'Canh chua cá lóc miền Tây': 'Mekong Sweet & Sour Snakehead Fish Soup',
  'Canh chua cá lóc thơm lừng ngò om': 'Fragrant Mekong Sweet & Sour Snakehead Fish Soup',
  'Canh sườn nấu chua cà chua': 'Pork Rib & Tomato Sour Soup',
  'Canh sườn nấu chua thanh mát': 'Refreshing Pork Rib & Tomato Tangy Soup',
  'Canh gà nấu gừng': 'Warming Ginger Chicken Soup',
  'Canh gà nấu gừng thơm ấm': 'Fragrant Warming Ginger Chicken Soup',
  'Rau muống xào tỏi': 'Garlic Stir-Fried Morning Glory',
  'Rau muống xào tỏi giòn xanh': 'Crisp Green Garlic Stir-Fried Morning Glory',
  'Đậu hũ sốt cà chua': 'Tofu in Fresh Tomato Sauce',
  'Đậu hũ sốt cà chua mềm béo': 'Golden Tofu Simmered in Fresh Tomato Sauce',
  'Đậu cove xào tỏi': 'Garlic Stir-Fried Green Beans',
  'Đậu cove xào tỏi giòn ngọt': 'Crisp & Sweet Garlic Stir-Fried Green Beans',
  'Ức gà hấp nấm xì dầu': 'Steamed Chicken Breast with Shiitake & Soy Sauce',
  'Ức gà hấp nấm hương xì dầu (Eat Clean giảm cân)':
    'Steamed Chicken Breast with Shiitake & Light Soy (Eat Clean)',
  'Cá diêu hồng hấp gừng hành': 'Steamed Red Tilapia with Ginger & Scallions',
  'Cá diêu hồng hấp gừng hành hoa thanh đạm': 'Light Steamed Red Tilapia with Ginger & Scallions',
  'Trứng chiên thịt băm hành hoa': 'Vietnamese Minced Pork & Scallion Omelette',
  'Trứng chiên thịt băm hành hoa vàng ươm': 'Golden Minced Pork & Scallion Omelette',
  'Thịt bò xào bông cải xanh': 'Stir-Fried Beef with Broccoli',
  'Thịt bò xào bông cải xanh giòn ngọt giàu sắt': 'Iron-Rich Stir-Fried Beef with Crisp Broccoli',
  'Tôm sú rim mặn ngọt': 'Caramelized Savory-Sweet Tiger Prawns',
  'Tôm sú rim mặn ngọt bóng bẩy đưa cơm': 'Glossy Caramelized Tiger Prawns',
  'Đậu hũ nhồi thịt sốt cà': 'Pork-Stuffed Tofu in Tomato Sauce',
  'Đậu hũ nhồi thịt sốt cà chua đậm đà': 'Savory Minced Pork-Stuffed Tofu in Tomato Sauce',
  'Canh bí đao nấu tôm tươi': 'Winter Melon & Fresh Shrimp Soup',
  'Canh bí đao nấu tôm tươi thanh nhiệt ít Calo': 'Low-Calorie Cooling Winter Melon & Fresh Shrimp Soup',
  'Canh mướp hương nấu tôm khô': 'Fragrant Sponge Gourd & Dried Shrimp Soup',
  'Canh mướp hương nấu tôm khô ngọt lịm': 'Naturally Sweet Sponge Gourd & Dried Shrimp Soup',
  'Canh cải ngọt nấu thịt băm': 'Choy Sum & Minced Pork Ginger Soup',
  'Canh cải ngọt nấu thịt băm gừng tươi ấm bụng': 'Warming Choy Sum, Minced Pork & Fresh Ginger Soup',
  'Bông cải xanh luộc Eat Clean': 'Eat Clean Boiled Broccoli & Carrots',
  'Bông cải xanh & cà rốt luộc giòn ngọt (Chuẩn Eat Clean)':
    'Crisp Boiled Broccoli & Carrots (Eat Clean Standard)',
  'Cải thìa xào nấm đông cô': 'Stir-Fried Bok Choy with Shiitake Mushrooms',
  'Cải thìa xào nấm đông cô sốt dầu hào': 'Bok Choy & Shiitake Mushrooms in Oyster Sauce',
  'Nộm dưa leo cà rốt chua ngọt': 'Sweet & Sour Cucumber Carrot Salad',
  'Gỏi dưa leo cà rốt trộn chua ngọt chống ngấy': 'Refreshing Sweet & Sour Cucumber Carrot Salad',
  'Nước mắm tỏi ớt chua ngọt': 'Classic Sweet & Sour Garlic Chili Fish Sauce',
  'Nước mắm tỏi ớt chua ngọt (Tỷ lệ vàng nổi tỏi ớt)':
    'Golden-Ratio Sweet & Sour Garlic Chili Fish Sauce Dip',
  'Kho quẹt tóp mỡ tôm khô': 'Southern Caramelized Dried Shrimp & Pork Crackling Dip (Kho Quet)',
  'Kho quẹt tóp mỡ tôm khô chấm rau củ luộc':
    'Southern Kho Quet Caramelized Dip for Boiled Veggies',
  'Muối ớt xanh lá chanh': 'Green Chili & Kaffir Lime Leaf Dipping Sauce',
  'Muối ớt xanh lá chanh chấm gà luộc & hải sản':
    'Creamy Green Chili & Lime Leaf Dip for Chicken & Seafood',
  'Ức gà áp chảo sốt mật ong tỏi chanh': 'Honey Lemon Garlic Pan-Seared Chicken Breast',
  'Ức gà áp chảo sốt mật ong tỏi chanh (Ít Calo)':
    'Low-Calorie Honey Lemon Garlic Pan-Seared Chicken Breast',
  'Cá diêu hồng hấp xì dầu gừng hành': 'Steamed Red Tilapia with Soy, Ginger & Scallions',
  'Cá diêu hồng hấp xì dầu gừng hành (Chuẩn NHS Ít Béo)':
    'NHS Low-Fat Steamed Tilapia with Soy, Ginger & Scallions',
  'Canh bí đao nấu tôm tươi gừng sợi': 'Winter Melon, Fresh Shrimp & Ginger Soup',
  'Canh bí đao nấu tôm tươi thanh nhiệt giảm cân':
    'Weight-Loss Cooling Winter Melon & Fresh Shrimp Soup',
  'Canh nấm đậu hũ non nấu hẹ': 'Silken Tofu, Mushroom & Chive Clear Soup',
  'Canh nấm đậu hũ non nấu hẹ nhẹ bụng ít Calo':
    'Light Low-Calorie Silken Tofu, Mushroom & Chive Soup',
  'Salad ức gà xé phay dưa leo sốt chanh': 'Shredded Chicken, Cucumber & Lemon Garlic Salad',
  'Salad ức gà xé phay dưa leo cà rốt sốt chanh tươi':
    'Shredded Chicken Breast, Cucumber & Carrot Fresh Lemon Salad',
  'Thăn bò áp chảo bông cải xanh & nấm (Macro-Friendly)':
    'Pan-Seared Beef Tenderloin with Broccoli & Mushrooms (Macro-Friendly)',
  'Thăn bò áp chảo bông cải xanh & nấm sốt tiêu đen (Tăng cơ)':
    'Black Pepper Beef Tenderloin with Broccoli & Shiitake (Muscle Gain)',
  'Cá hồi áp chảo măng tây sốt chanh tỏi': 'Pan-Seared Salmon with Broccoli & Lemon Garlic',
  'Cá hồi áp chảo bông cải sốt chanh tỏi giàu Omega-3 (Fit Men Cook)':
    'Omega-3 Pan-Seared Salmon with Broccoli & Lemon Garlic (Fit Men Cook)',
  'Ức gà xào ớt chuông hạt điều (Meal Prep)': 'Cashew & Bell Pepper Chicken Breast Stir-Fry (Meal Prep)',
  'Ức gà xào ớt chuông & hạt điều (Meal Prep Tăng cơ)':
    'Cashew & Bell Pepper Chicken Stir-Fry (Muscle Meal Prep)',
  'Đậu hũ sốt thịt nạc băm nấm hương giàu đạm': 'High-Protein Minced Lean Pork & Shiitake Braised Tofu',
  'Đậu hũ sốt thịt heo nạc băm & nấm hương (High-Protein)':
    'High-Protein Lean Minced Pork & Shiitake Tofu Skillet',
  'Trứng cuộn tôm tươi & rau cải bó xôi giàu Protein':
    'High-Protein Prawn & Spinach Rolled Omelette',
  'Trứng cuộn tôm nõn & cải bó xôi giàu Protein (10 phút)':
    '10-Min High-Protein Peeled Shrimp & Spinach Omelette',
  'Poke Bowl cá hồi áp chảo, bơ sáp & gạo lứt': 'Pan-Seared Salmon, Avocado & Brown Rice Poke Bowl',
  'Poke Bowl cá hồi áp chảo, bơ sáp & gạo lứt (Chuẩn Yoga & Gym)':
    'Pan-Seared Salmon, Avocado & Brown Rice Poke Bowl (Yoga & Gym)',
  'Ức gà cuộn rong biển áp chảo sốt mè rang': 'Nori-Wrapped Chicken Breast Rolls with Sesame Glaze',
  'Ức gà cuộn rong biển áp chảo (Meal Prep Gym & Yoga 15 phút)':
    '15-Min Nori-Wrapped Chicken Breast Rolls (Gym & Yoga Meal Prep)',
  'Tôm nõn áp chảo dầu ô liu tỏi & bông cải xanh':
    'Olive Oil Garlic Shrimp & Broccoli Skillet',
  'Tôm nõn áp chảo tỏi dầu ô liu & bông cải xanh (High-Protein 10 phút)':
    '10-Min High-Protein Garlic Olive Oil Shrimp & Broccoli',
  'Miến dong trộn ức gà xé, nấm hương & cải bó xôi':
    'Glass Noodles with Shredded Chicken, Shiitake & Spinach',
  'Miến dong trộn ức gà xé, nấm hương & cải bó xôi (Eat Clean nhẹ bụng)':
    'Light Eat Clean Glass Noodles with Chicken, Shiitake & Spinach',
  'Đậu hũ non áp chảo sốt nấm đông cô & cải thìa (Yoga)':
    'Pan-Seared Tofu in Shiitake Sauce with Bok Choy (Yoga Plant Protein)',
  'Đậu hũ áp chảo sốt nấm đông cô & cải thìa (Đạm thực vật Yoga)':
    'Pan-Seared Tofu with Shiitake & Bok Choy (Yoga Plant-Based Protein)',
  'Thăn bò lúc lắc ớt chuông & khoai lang mật áp chảo':
    'Shaking Beef Tenderloin with Bell Peppers & Honey Sweet Potato',
  'Thăn bò lúc lắc ớt chuông & khoai lang mật áp chảo (Tăng cơ Gym)':
    'Shaking Beef Tenderloin with Bell Peppers & Sweet Potato (Gym Muscle)',
  'Canh rong biển đậu hũ non nấu tôm tươi': 'Seaweed, Silken Tofu & Fresh Shrimp Soup',
  'Canh rong biển đậu hũ non nấu tôm nõn (Thanh lọc & Bù khoáng)':
    'Detox & Mineral Seaweed, Silken Tofu & Shrimp Soup',
  'Canh cải bó xôi (Rau chân vịt) nấu bò băm gừng tươi':
    'Spinach & Minced Beef Soup with Fresh Ginger',
  'Canh cải bó xôi nấu thịt bò băm gừng tươi (Giàu sắt & Protein)':
    'Iron & Protein-Rich Spinach & Minced Lean Beef Ginger Soup',
  'Súp bí đỏ kem sữa chua Hy Lạp & hạt Chia': 'Creamy Pumpkin Soup with Greek Yogurt & Chia Seeds',
  'Súp bí đỏ sữa chua Hy Lạp & hạt Chia (Eat Clean ấm bụng)':
    'Warming Eat Clean Pumpkin Soup with Greek Yogurt & Chia Seeds',
  'Salad bơ sáp, trứng gà luộc & bắp cải tím sốt sữa chua Hy Lạp':
    'Avocado, Boiled Egg & Purple Cabbage Salad with Greek Yogurt Dressing',
  'Gỏi cuốn tôm tươi & ức gà xà lách chấm sốt tương đậu phộng':
    'Fresh Shrimp & Chicken Breast Summer Rolls with Peanut Soy Dip',
  'Gỏi cuốn tôm tươi & ức gà rau xanh (Eat Clean không dầu mỡ)':
    'Oil-Free Eat Clean Shrimp & Chicken Breast Fresh Summer Rolls',
  'Bowl Yến mạch, Sữa chua Hy Lạp & Hạt Chia (Pre-Workout 5 phút)':
    '5-Min Rolled Oats, Greek Yogurt & Chia Seeds Pre-Workout Bowl',
  'Bowl Yến mạch, Sữa chua Hy Lạp & Hạt Chia (Bữa sáng / Trước tập 5 phút)':
    '5-Min Rolled Oats, Greek Yogurt & Chia Breakfast / Pre-Workout Bowl',

  // All 49 Recipe Short Descriptions
  'Thịt ba chỉ thái con chì vừa ăn, thắng nước màu cánh gián, kho liu riu đậm đà thơm cay nồng hạt tiêu xay.':
    'Bite-sized pork belly simmered slowly in amber caramel sauce with fragrant cracked black pepper.',
  'Thịt gà ta chắc thịt rang xém cạnh vàng ruộm, thơm nức mùi gừng tươi và lá chanh thái chỉ, vị đậm đà ấm bụng.':
    'Free-range chicken pan-roasted until golden at the edges with julienned fresh ginger and aromatic kaffir lime leaves.',
  'Khúc cá basa béo ngậy được kho trong nồi đất với nước màu dừa, ớt hiểm và đầu hành lá, nước kho sánh quyện đậm đà.':
    'Tender basa fish steaks braised in a traditional claypot with coconut caramel, bird’s eye chili, and scallion whites.',
  'Từng miếng sườn non mềm róc xương ngập trong nước sốt chua ngọt bóng bẩy, vị hài hòa giữa giấm gạo, cà chua và đường thốt nốt.':
    'Fall-off-the-bone baby ribs coated in a glossy sweet-and-tangy glaze of rice vinegar, ripe tomatoes, and palm sugar.',
  'Thịt heo xắt mỏng xào nhanh cùng ớt chuông đỏ giòn ngọt, dậy mùi thơm của tỏi và dầu hào, màu sắc bắt mắt.':
    'Thinly sliced lean pork wok-tossed with crisp red bell peppers, fragrant garlic, and savory oyster sauce.',
  'Bát canh rau ngót xanh mướt, nước canh ngọt lịm tự nhiên từ thịt nạc thăn băm nhỏ, giải nhiệt ngày hè.':
    'Vibrant green katuk leaves in a naturally sweet minced pork loin broth — a classic Vietnamese summer cooling soup.',
  'Vị chua thanh mát từ me dốt, cá lóc ngọt thịt, giòn tươi từ dứa, cà chua và đậu bắp, ngào ngạt rau ngò om.':
    'Refreshing tamarind broth with sweet snakehead fish, pineapple, tomato, okra, and aromatic rice paddy herbs.',
  'Nước canh hầm từ sườn non ngọt đậm đà, kết hợp vị chua dìu dịu của cà chua và hành hoa thái nhỏ.':
    'Savory slow-simmered pork rib broth balanced with ripe tomatoes and fresh chopped scallions.',
  'Canh gà ta nấu cùng gừng tươi thái sợi, nước dùng vàng óng sóng sánh, cay ấm nồng nàn giải cảm mùa đông.':
    'Free-range chicken simmered with julienned fresh ginger in a golden, warming broth.',
  'Ngọn rau muống xanh mướt giòn sần sật, dậy mùi thơm lừng của tỏi phi vàng giòn rụm trên chảo lửa lớn.':
    'Crisp green morning glory stems wok-seared over high heat with golden crispy garlic.',
  'Miếng đậu hũ chiên vàng ươm, mềm mọng ngập trong nước sốt cà chua sánh mịn, phủ đầy hành hoa thơm nức.':
    'Lightly golden tofu cubes simmered in a rich, velvety fresh tomato sauce topped with green onions.',
  'Từng quả đậu cove xanh mướt tước sạch xơ, xào chín tới giữ trọn vị ngọt tự nhiên quyện cùng tỏi phi thơm phức.':
    'Crisp-tender green beans stir-fried with fragrant sautéed garlic to lock in their natural sweetness.',
  'Ức gà phi lê mềm mọng không hề khô bở, hấp cách thủy cùng nấm hương, gừng sợi và nước tương thanh dịu — giàu đạm, cực ít béo.':
    'Juicy, tender chicken breast fillet gently steamed with shiitake mushrooms, ginger strips, and light soy sauce — high protein, ultra-low fat.',
  'Thịt cá diêu hồng trắng ngần ngọt lịm, hấp cùng gừng tươi, đầu hành trắng và chút xì dầu thơm dịu — món mặn lý tưởng cho người lớn tuổi và người giữ dáng.':
    'Delicate white red-tilapia steamed with fresh ginger, scallion whites, and light soy sauce — ideal for seniors and clean eating.',
  'Món quốc dân của mọi gia đình Việt: trứng gà đánh bông quyện thịt nạc băm mềm ngọt và hành hoa thơm phức, bé nhỏ hay người lớn đều mê.':
    'A beloved Vietnamese family staple: fluffy beaten eggs with savory minced lean pork and fragrant scallions.',
  'Thịt bò phi lê mềm ngọt xào lửa lớn cùng bông cải xanh và cà rốt giòn sần sật, bổ sung dồi dào đạm, sắt và chất xơ trong 15 phút.':
    'Tender beef tenderloin flash-seared with crisp broccoli and carrots — packed with protein, iron, and fiber in 15 minutes.',
  'Từng con tôm sú đỏ au săn chắc, áo đều lớp sốt mắm đường keo sánh bóng mượt, thơm nức mùi tỏi phi và hành lá.':
    'Firm tiger prawns glazed in a glossy caramelized fish sauce reduction with crispy garlic and scallions.',
  'Đậu hũ vàng mềm nhồi nhân thịt heo băm mộc nhĩ thơm ngọt, om trong nước sốt cà chua sánh đỏ chua dịu dễ ăn.':
    'Tender tofu pockets stuffed with minced pork and wood-ear mushrooms, braised in a tangy fresh tomato sauce.',
  'Miếng bí đao trong xanh mềm mát nấu cùng tôm tươi giã dập ngọt nước tự nhiên, cực kỳ thanh đạm cho thực đơn giảm cân.':
    'Translucent winter melon slices in a naturally sweet crushed-shrimp broth — ultra-light for weight-loss menus.',
  'Hương thơm dịu dàng đặc trưng của mướp hương quyện cùng vị ngọt đậm của tôm khô ngâm mềm, nấu nhanh trong 10 phút.':
    'Fragrant luffa gourd cooked with umami-rich softened dried shrimp in just 10 minutes.',
  'Cải ngọt xanh non nấu cùng thịt nạc băm và vài lát gừng tươi thơm ấm, dễ tiêu hóa và giàu chất xơ cho cả nhà.':
    'Tender choy sum greens in a warming ginger and minced lean pork broth — easy to digest and high in fiber.',
  'Đĩa rau củ luộc xanh mướt giòn ngọt không dùng dầu mỡ, giữ trọn vitamin và chất xơ cho thực đơn giảm cân hoặc người lớn tuổi.':
    'Vibrant oil-free boiled broccoli and carrots that preserve 100% of vitamins and dietary fiber.',
  'Bẹ cải thìa xanh ngọc giòn ngọt quyện cùng mũ nấm đông cô mềm thơm trong lớp sốt dầu hào bóng mượt như ngoài nhà hàng.':
    'Crisp jade-green bok choy and tender shiitake mushroom caps tossed in a glossy restaurant-style oyster sauce glaze.',
  'Đĩa gỏi dưa leo cà rốt giòn tan, chua ngọt thanh mát giúp giải ngấy cực tốt khi ăn kèm các món kho, chiên hoặc nướng.':
    'Crunchy cucumber and carrot ribbons in a light sweet-and-sour dressing to refresh the palate alongside rich mains.',
  'Bí quyết pha chén nước mắm chua ngọt hài hòa theo tỷ lệ muỗng bếp nhà, tỏi ớt băm nổi đều trên mặt đẹp mắt, chấm cá chiên, chả giò hay thịt luộc đều ngon.':
    'The golden kitchen spoon ratio for Vietnamese sweet & sour dipping fish sauce with floating minced garlic and chili.',
  'Niêu kho quẹt Nam Bộ sệt kẹo màu cánh gián, dậy mùi thơm của tôm khô, tóp mỡ giòn rụm và hạt tiêu xanh, biến đĩa rau luộc thành mỹ vị.':
    'Southern Vietnamese caramelized fish sauce dip with dried shrimp, crispy pork cracklings, and green peppercorns.',
  'Chén sốt chấm màu xanh ngọc bích sánh mịn, thơm lừng lá chanh và ớt xiêm xanh, chấm ức gà hấp Eat Clean hay hải sản đều tuyệt hảo.':
    'Emerald-green dipping sauce blended from green bird’s eye chilies, lime juice, and kaffir lime leaves — perfect for steamed chicken or seafood.',
  'Lấy cảm hứng từ thực đơn giảm cân BBC Good Food & WeightWatchers: ức gà phi lê áp chảo mọng nước không khô bở, áo lớp sốt mật ong tỏi chanh bóng mượt chỉ ~185 kcal/khẩu phần.':
    'Inspired by BBC Good Food & WeightWatchers: juicy pan-seared chicken breast in a glossy honey-garlic-lemon glaze at only ~185 kcal/serving.',
  'Phương pháp hấp thanh đạm chuẩn khuyến nghị NHS Better Health: thịt cá trắng ngọt tự nhiên quyện hương gừng tươi, hành lá và nước tương dịu nhẹ, hoàn toàn không chiên rán.':
    'NHS Better Health recommended steaming method: naturally sweet white fish with fresh ginger, scallions, and light soy sauce — zero frying.',
  'Món canh kiểm soát calo lý tưởng cho bữa tối nhẹ bụng theo phong cách BBC Low-Calorie: bí đao mọng nước giàu chất xơ nấu cùng tôm tươi băm ngọt thanh, dưới 85 kcal/bát.':
    'BBC Low-Calorie style light dinner soup: fiber-rich winter melon with minced fresh shrimp at under 85 kcal per bowl.',
  'Món canh thực dưỡng ít calo chuẩn Hungry Girl & BBC Good Food: đậu hũ non mềm mượt kết hợp nấm tươi ngọt tự nhiên và lá hẹ thơm dịu, chỉ ~75 kcal/khẩu phần.':
    'Hungry Girl & BBC Good Food inspired macrobiotic soup: silky soft tofu with fresh mushrooms and aromatic chives at only ~75 kcal/serving.',
  'Món rau trộn giảm cân giàu đạm nhẹ bụng: ức gà luộc xé phay mềm ngọt trộn cùng dưa leo, cà rốt giòn tan và sốt chanh tỏi thanh mát, giúp no lâu mà không tích mỡ.':
    'High-protein weight-loss salad: tender poached shredded chicken breast tossed with crunchy cucumber, carrot, and fresh lemon-garlic dressing.',
  'Công thức One-Pan giàu Protein theo chuẩn Eat the Gains: thăn bò nạc mềm giàu sắt và creatine tự nhiên, kết hợp bông cải xanh và nấm đông cô chỉ trong 15 phút (~31g Đạm/phần).':
    'Eat the Gains One-Pan high-protein skillet: iron-rich lean beef tenderloin with broccoli and shiitake mushrooms in 15 minutes (~31g Protein/serving).',
  'Món ăn tăng cơ giảm mỡ kinh điển từ Fit Men Cook: cá hồi phi lê áp chảo giòn da, cung cấp đạm chất lượng cao và axit béo tốt Omega-3 hỗ trợ phục hồi cơ bắp sau tập.':
    'Fit Men Cook classic lean-muscle meal: crispy-skin pan-seared salmon fillet rich in high-quality protein and Omega-3 fatty acids for post-workout recovery.',
  'Công thức chuẩn bị hộp cơm (Meal Prep) nổi tiếng từ Fit Men Cook & Strongr Fastr: ức gà thái vuông xào cùng ớt chuông giàu Vitamin C và hạt điều bùi béo, hâm nóng lại vẫn mềm ngon.':
    'Fit Men Cook & Strongr Fastr favorite meal-prep recipe: diced chicken breast stir-fried with Vitamin C-rich bell peppers and roasted cashews.',
  'Sự kết hợp hoàn hảo giữa đạm động vật (thịt thăn nạc băm) và đạm thực vật (đậu hũ), ít chất béo bão hòa, giàu axit amin thiết yếu cho người tập luyện và gia đình.':
    'Balanced animal protein (minced lean pork loin) and plant protein (tofu), low in saturated fat and rich in essential amino acids.',
  'Món phụ tăng cơ siêu tốc lấy cảm hứng từ Eat the Gains: kết hợp đạm sinh học cao từ trứng gà và tôm nõn cùng sắt, folate trong rau cải xanh, chỉ mất 10 phút chế biến.':
    'Eat the Gains 10-minute muscle-building side: high-bioavailability egg and peeled shrimp rolled with iron-rich spinach.',
  'Tô cơm dinh dưỡng hiện đại rất được người tập Yoga & Gym ưa chuộng: cá hồi giàu Omega-3 kết hợp quả bơ sáp béo tốt, dưa leo, rong biển và tinh bột hấp thu chậm từ gạo lứt.':
    'Modern nutrient-dense Poke Bowl loved by Yoga & Gym practitioners: Omega-3 salmon, creamy avocado, cucumber, seaweed, and slow-digesting brown rice.',
  'Cách chế biến giúp ức gà mềm ngọt tuyệt đối, không còn cảm giác khô xơ: ức gà cuộn lá rong biển và cà rốt áp chảo dầu ô liu thơm lừng, cực hợp mang đi làm hoặc ăn sau tập.':
    'Keeps chicken breastextra-juicy: chicken breast rolled with nori seaweed and carrot, pan-seared in olive oil with roasted sesame glaze.',
  'Món ăn tối siêu tốc chỉ 10 phút cho người bận rộn tập Gym/Yoga: tôm bóc nõn săn giòn giàu đạm nạc, áp chảo cùng tỏi thơm, dầu ô liu và bông cải xanh giòn ngọt.':
    '10-minute high-protein dinner for busy Gym/Yoga days: plump peeled shrimp seared in garlic olive oil with crisp-tender broccoli.',
  'Món miến trộn thanh mát giúp đổi vị khi ngán cơm: sợi miến dong dai giòn trộn cùng ức gà xé, rau chân vịt (cải bó xôi), nấm đông cô và dầu mè thơm dịu.':
    'Refreshing glass noodle bowl when you want a break from rice: chewy arrowroot glass noodles tossed with shredded chicken breast, spinach, shiitake, and sesame oil.',
  'Món mặn đạm thực vật nhẹ bụng chuẩn thực dưỡng cho người tập Yoga: đậu phụ trắng áp chảo xém vàng không ngập dầu, quyện cùng sốt nấm đông cô và cải thìa xanh mướt.':
    'Light plant-protein main for Yoga practitioners: golden pan-seared white tofu in savory shiitake mushroom sauce with crisp bok choy.',
  'Bữa ăn phục hồi cơ bắp toàn diện sau buổi tập nặng: thăn bò phi lê giàu đạm & sắt kết hợp ớt chuông giàu Vitamin C và tinh bột tốt từ khoai lang mật.':
    'Complete post-workout muscle recovery plate: high-protein, iron-rich beef tenderloin cubes with bell peppers and pan-roasted honey sweet potato.',
  'Món canh thanh lọc cơ thể cực nhanh (8 phút) cho người tập Yoga và giảm cân: rong biển giàu khoáng chất và chất xơ hòa tan kết hợp đậu hũ non mềm mượt cùng tôm tươi.':
    '8-minute mineral-rich detox soup for Yoga and weight loss: wakame seaweed, silky soft tofu, and sweet fresh peeled shrimp.',
  'Sự kết hợp vàng giữa siêu thực phẩm cải bó xôi (Spinach) và thịt bò nạc băm, bổ sung sắt, folate và đạm phục hồi cơ bắp cho người tập Gym & Yoga.':
    'Golden superfood pairing of fresh spinach and lean minced beef with ginger — rich in iron, folate, and muscle-repairing protein.',
  'Thay thế hoàn toàn kem béo whipping cream bằng sữa chua Hy Lạp giàu đạm và hạt Chia: bát súp bí đỏ sánh mịn, ngọt tự nhiên, cực kỳ nhẹ bụng trước hoặc sau buổi tập Yoga.':
    'Replaces heavy cream with high-protein Greek yogurt and Chia seeds: velvety, naturally sweet pumpkin soup that feels light before or after Yoga.',
  'Đĩa salad chuẩn Eat Clean không dùng sốt Mayonnaise công nghiệp: tận dụng độ béo sánh của sữa chua Hy Lạp và quả bơ sáp, kết hợp trứng gà luộc và rau củ tươi giòn.':
    'Mayo-free Eat Clean salad: creamy Greek yogurt dressing paired with ripe avocado, boiled farm eggs, and crisp purple cabbage.',
  'Biến tấu gỏi cuốn Việt Nam chuẩn Fitness: thay thịt ba chỉ mỡ bằng ức gà phi lê mềm ngọt và tôm tươi, cuốn đầy xà lách, dưa leo và rau thơm thanh mát.':
    'Fitness-friendly Vietnamese summer rolls: swaps fatty pork belly for tender chicken breast and fresh shrimp wrapped with lettuce, cucumber, and herbs.',
  'Món ăn nhanh 5 phút không cần nấu dành cho người tập Yoga buổi sáng hoặc nạp năng lượng sạch trước khi tập Gym: giàu chất xơ hòa tan Beta-glucan, đạm dễ tiêu và Omega-3 thực vật.':
    'No-cook 5-minute morning Yoga or pre-workout bowl: rich in Beta-glucan soluble fiber from rolled oats, Greek yogurt protein, and plant Omega-3 from Chia seeds.',
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
  [/^(\d+) thành phần đã bóc tách$/i, '$1 detected items'],
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
  [/^~(\d+)g tươi sống\/ngày$/i, '~$1g raw weight/day'],
  [/^~(\d+)g Đạm$/i, '~$1g Protein'],
  [/^(\d+(?:\.\d+)?)g Đạm$/i, '$1g Protein'],
  [/^• (\d+)% đĩa$/i, '• $1% of plate'],
  [/^~(\d+) kcal\/người$/i, '~$1 kcal/person'],
  [/^Ghép ngay Mâm cơm 3 món khớp mức (\d+) kcal\/bữa tối$/i, 'Build 3-Dish Meal Tray Matching $1 kcal Dinner'],
  [/^Xem các món ăn ≤ (\d+) kcal\/khẩu phần$/i, 'Browse Dishes ≤ $1 kcal/serving'],
  [/^Đạm (\d+(?:\.\d+)?)g$/i, 'Protein $1g'],
  [/^· Béo (\d+(?:\.\d+)?)g$/i, '· Fat $1g'],
  [/^⭐ Điểm đĩa: (\d+(?:\.\d+)?)\/10$/i, '⭐ Plate Score: $1/10'],
  [/^🥩 (\d+(?:\.\d+)?)g Đạm • 🥦 (\d+(?:\.\d+)?)g Xơ$/i, '🥩 $1g Pro • 🥦 $2g Fiber'],
  [/^Đĩa (\d+)g \((\d+)% bữa\)$/i, 'Plate $1g ($2% of meal)'],
  [/^🥦 Rau (\d+)%$/i, '🥦 Veggies $1%'],
  [/^🥩 Đạm (\d+(?:\.\d+)?)g$/i, '🥩 Pro $1g'],
  [/^🍚 Carb (\d+(?:\.\d+)?)g$/i, '🍚 Carb $1g'],
  [/^🥑 Béo (\d+(?:\.\d+)?)g$/i, '🥑 Fat $1g'],
  [/^(\d+(?:\.\d+)?)g Béo$/i, '$1g Fat'],
  [/^(\d+(?:\.\d+)?)g Xơ$/i, '$1g Fiber'],
  [/^💡 Thiếu đạm\/rau → (.+)$/i, '💡 Boost plate → $1'],
  [/^📊 Tỷ lệ Đĩa Ăn \((\d+)g\)$/i, '📊 Plate Ratio ($1g)'],
  [/^Đạt (\d+)% • Dư (\d+) kcal$/i, '$1% of target • $2 kcal left'],
  [/^Đạt (\d+)% • Vượt (\d+) kcal$/i, '$1% of target • +$2 kcal over'],
  [/^🍽️ Thành phần trên đĩa \((\d+) món\) — Bấm \[-\] \/ \[\+\] để chỉnh gram:$/i, '🍽️ Detected Plate Items ($1 items) — Click [-] / [+] to adjust grams:'],
  [/^🔍 Xem cơ sở đo lường AI \((\d+)% chuẩn\) & lời khuyên$/i, '🔍 View AI Measurement Basis ($1% confidence) & Coach Notes'],
  [/^✅ Tỷ lệ Đạm \((\d+(?:\.\d+)?)g\) & Rau xanh \((\d+)%\) đã cân đối chuẩn vàng!$/i, '✅ Protein ($1g) & Veggies ($2%) are in golden balance!'],
  [/^Lưu vào Nhật Ký \((\d+) kcal\)$/i, 'Save to Diary ($1 kcal)'],
  [/^📝 Lưu đĩa ăn này vào Nhật ký hôm nay \((.+)\):$/i, '📝 Save this scanned plate to today’s Diary ($1):'],
  [/^1\. Chia ([\d.,]+) kcal Vào 3 Bữa Ăn Trong Ngày Như Thế Nào\?$/i, '1. How to Split $1 kcal Across Your 3 Daily Meals?'],
  [/^ĐÃ LỌC (\d+) MÓN ĂN TRÊN WEBSITE KHỚP CHỈ SỐ CỦA BẠN$/i, 'MATCHED $1 VERIFIED RECIPES TO YOUR PERSONAL MACROS'],
  [/^✨ Tất cả \((\d+) món\)$/i, '✨ All ($1 dishes)'],
  [/^🧘 Yoga & Eat Clean \((\d+)\)$/i, '🧘 Yoga & Eat Clean ($1)'],
  [/^💪 Tập Gym Tăng Cơ \((\d+)\)$/i, '💪 Gym Muscle ($1)'],
  [/^📉 Giảm Cân Ít Calo \((\d+)\)$/i, '📉 Low Calorie ($1)'],
  [/^🌤️ Trưa \((\d+) kcal\)$/i, '🌤️ Lunch ($1 kcal)'],
  [/^🌙 Tối \((\d+) kcal\)$/i, '🌙 Dinner ($1 kcal)'],
  [/^☀️ Sáng \((\d+) kcal\)$/i, '☀️ Breakfast ($1 kcal)'],
  [/^🍱 Gợi ý Mâm Cơm 3 Món #(\d+) \((.+)\):$/i, '🍱 Suggested 3-Dish Tray #$1 ($2):'],
  [/^Tổng mâm \+ ([\d.]+) chén cơm: ~(\d+) kcal • ([\d.]+)g Đạm$/i, 'Full tray + $1 bowls rice: ~$2 kcal • $3g Protein'],
  [/^Đổi mâm gợi ý khác \((\d+)\/(\d+)\)$/i, 'Spin another tray ($1/$2)'],
  [/^(\d+) kcal\/phần$/i, '$1 kcal/serving'],
  [/^🥩 Món Mặn \((\d+)\)$/i, '🥩 Mains ($1)'],
  [/^🍲 Món Canh \((\d+)\)$/i, '🍲 Soups ($1)'],
  [/^🥬 Món Rau \((\d+)\)$/i, '🥬 Veggies ($1)'],
  [/^Xem thêm \((\d+) món phù hợp nữa\)$/i, 'Show $1 more matching dishes'],
  [/^💪 Gym • ([\d.]+)g Đạm$/i, '💪 Gym • $1g Pro'],
  [/^🧘 Eat Clean • ([\d.]+)g Đạm$/i, '🧘 Eat Clean • $1g Pro'],
  [/^Giảm cân • ([\d.]+)g Đạm$/i, 'Weight Loss • $1g Pro'],
  [/^🧘 Nhẹ bụng \((\d+) kcal\)$/i, '🧘 Light ($1 kcal)'],
  [/^Ít Calo \((\d+) kcal\)$/i, 'Low Cal ($1 kcal)'],
  [/^Đạm cao \(([\d.]+)g\)$/i, 'High Pro ($1g)'],
  [/^🧘 Eat Clean \((\d+) kcal\)$/i, '🧘 Eat Clean ($1 kcal)'],
  [/^Giàu chất xơ \((\d+) kcal\)$/i, 'High Fiber ($1 kcal)'],
  [/^💪 Tăng cơ • ([\d.]+)g Đạm$/i, '💪 Muscle • $1g Pro'],
  [/^💪 Phục hồi • ([\d.]+)g Đạm$/i, '💪 Recovery • $1g Pro'],
  [/^🥩 ([\d.]+)g Đạm$/i, '🥩 $1g Pro'],
  [/^🥑 ([\d.]+)g Béo$/i, '🥑 $1g Fat'],
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
    trimmed.includes('Cân nặng chuẩn chiều cao') ||
    trimmed.includes('Lộ trình từ ') ||
    trimmed.includes('Dự kiến ~') ||
    trimmed.includes('chén cơm') ||
    trimmed.includes('chén/ngày') ||
    trimmed.includes('tươi sống/ngày') ||
    trimmed.includes('lít/ngày') ||
    trimmed.includes('so với TDEE') ||
    trimmed.includes('Tổng thời gian khoảng') ||
    trimmed.includes('Hiện có ') ||
    trimmed.includes('Đang xem dòng ') ||
    trimmed.includes('Điểm Đĩa Ăn') ||
    trimmed.includes('Bổ sung thêm') ||
    trimmed.includes('Đã lưu') ||
    trimmed.includes('Phù hợp: Phở') ||
    trimmed.includes('Phù hợp: 1 chén cơm') ||
    trimmed.includes('Phù hợp: ½ – 1 chén cơm') ||
    trimmed.includes('Bữa Sáng') ||
    trimmed.includes('Bữa Trưa') ||
    trimmed.includes('Bữa Tối')
  ) {
    const out = trimmed
      .replace(/Phân loại Bộ Y Tế VN & WHO Châu Á:/g, 'VN MOH & WHO Asia Classification:')
      .replace(/Bình thường • Chuẩn người Việt/g, 'Normal Weight • VN Standard')
      .replace(/Thừa cân \/ Tiền béo phì/g, 'Overweight / Pre-Obese')
      .replace(/Béo phì độ I/g, 'Obesity Class I')
      .replace(/Béo phì độ II/g, 'Obesity Class II')
      .replace(/Thiếu cân \/ Thể trạng gầy/g, 'Underweight')
      .replace(/Chuẩn Châu Á/g, 'Asian Standard')
      .replace(/Cân nặng chuẩn chiều cao (\d+)cm:/g, 'Ideal weight for $1cm:')
      .replace(/Lộ trình từ /g, 'Timeline from ')
      .replace(/Lộ trình:/g, 'Target:')
      .replace(/Giảm /g, 'Lose ')
      .replace(/Tăng /g, 'Gain ')
      .replace(/Dự kiến ~(\d+) tuần \(([\d.]+) tháng\) an toàn y khoa/g, 'Est. ~$1 weeks ($2 months) clinically safe')
      .replace(/\(~(\d+) tuần\)/g, '(~$1 weeks)')
      .replace(/chén cơm trắng/g, 'bowls white rice')
      .replace(/chén gạo lứt/g, 'bowls brown rice')
      .replace(/chén\/ngày/g, 'bowls/day')
      .replace(/tươi sống\/ngày/g, 'raw weight/day')
      .replace(/lít\/ngày/g, 'L/day')
      .replace(/(\d+)\s*ml\/kg cân nặng/g, '$1 ml/kg body weight')
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
      .replace(/Phù hợp: Phở bò\/gà ít bánh, Yến mạch sữa chua Hy Lạp hoặc Khoai lang \+ 2 quả trứng luộc\./g, 'Ideal: Light Pho, Greek Yogurt Rolled Oats, or Sweet Potato + 2 Boiled Eggs.')
      .replace(/Phù hợp: 1 chén cơm \+ Ức gà\/Cá\/Thịt bò áp chảo \+ Rau củ luộc hoặc xào ít dầu\./g, 'Ideal: 1 bowl rice + Pan-seared Chicken/Fish/Beef + Boiled or light stir-fried veggies.')
      .replace(/Phù hợp: ½ – 1 chén cơm \(hoặc miến\/khoai\) \+ Món mặn thanh đạm \+ 1 bát canh rau\/nấm ấm bụng\./g, 'Ideal: ½ – 1 bowl rice (or glass noodles) + Light protein main + Warm veggie/mushroom soup.')
      .replace(/Bữa Sáng/g, 'Breakfast')
      .replace(/Bữa Trưa/g, 'Lunch')
      .replace(/Bữa Tối/g, 'Dinner')
      .replace(/Bổ sung thêm \(~(\d+)g\)/g, 'Added item (~$1g)')
      .replace(/Đã lưu \(([\d.,]+) kcal\) vào Nhật ký hôm nay!/g, 'Saved ($1 kcal) to today’s Diary!')
      .replace(/(\d+)\s*người/g, '$1 servings')
      .replace(/(\d+)\s*phút/g, '$1 mins');
    return raw.replace(trimmed, out);
  }

  return raw;
}
