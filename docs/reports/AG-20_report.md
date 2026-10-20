# AG-20 Report — Saved Recipes (Món ăn đã lưu & Đồng bộ khách vãng lai)

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, sẵn sàng đóng ticket**.

---

## 1. Summary
Đã triển khai hoàn chỉnh tính năng Lưu món ăn (`Saved Recipes`) hỗ trợ trải nghiệm liền mạch cho cả khách vãng lai (Guest) và người dùng có tài khoản:
- **Khách vãng lai**: Lưu trữ tức thì vào `localStorage` (`angimom_saved_recipes`) mà không bị popup hay rào cản đăng nhập ngắt quãng luồng xem/nấu ăn (tuân thủ nghiêm ngặt **Invariants §6.7**).
- **Người dùng đã đăng nhập**: Đồng bộ an toàn hai chiều với bảng `saved_recipes` trong Postgres, hỗ trợ truy cập xuyên suốt trên nhiều thiết bị.
- **Tự động hợp nhất (Sync on login)**: Khi khách đăng nhập, toàn bộ danh sách món đã lưu từ `localStorage` tự động được đẩy lên API `/api/saved-recipes/sync` và hợp nhất (`onConflictDoNothing`) vào tài khoản mà không gây trùng lặp.
- **Trang bộ sưu tập `/da-luu`**: Giao diện trực quan với lưới RecipeCard đồng bộ theo thời gian thực, có Empty State tinh tế khuyến khích khám phá khi danh sách trống.
- **Nút tương tác `BookmarkButton`**: Được tích hợp linh hoạt trên thẻ món ăn (`RecipeCard`) và trang chi tiết công thức (`/cong-thuc/[slug]`).

## 2. Invariants & Data Safety Verified
- **Invariants §5.1 (Chỉ hiển thị công thức `PUBLISHED`)**:
  - Truy vấn `saved_recipes` luôn kết nối chặt chẽ với điều kiện `recipes.status = 'PUBLISHED'`.
  - Nếu một món ăn sau khi lưu bị chuyển về trạng thái `DRAFT` hoặc `ARCHIVED`, món đó tự động bị ẩn khỏi danh sách đã lưu, tuyệt đối không rò rỉ dữ liệu nháp hay bản nội bộ.
- **Invariants §6.7 (Không bắt đăng nhập giữa luồng đọc/nấu/lưu)**:
  - Khách vãng lai có thể bấm Lưu/Bỏ lưu ngay lập tức. Không bao giờ xuất hiện modal chặn luồng ép đăng nhập.
- **Ràng buộc toàn vẹn cơ sở dữ liệu**:
  - Cặp `(user_id, recipe_id)` được bảo vệ bởi Unique Index (`unique_user_recipe`) chống lưu trùng lặp.
  - Khóa ngoại `ON DELETE CASCADE` đảm bảo khi user hoặc công thức bị xóa, các bản ghi tham chiếu trong `saved_recipes` tự động được dọn dẹp sạch sẽ.
- **Bảo mật API**:
  - Không rò rỉ ID biên soạn, email hay ghi chú duyệt của tác giả (`queryPublishedRecipeCardsBySlugs`).
  - Kiểm tra và làm sạch input slugs an toàn (chống SQL injection, giới hạn tối đa 100 slugs/lần yêu cầu).

## 3. Changed & Created Files
- `src/lib/db/schema.ts`: Khai báo bảng `savedRecipes` với foreign keys và unique index.
- `src/lib/db/relations.ts`: Định nghĩa quan hệ `savedRecipes` với `users` và `recipes`.
- `drizzle/0003_ag20_saved_recipes.sql`: Migration tạo bảng `saved_recipes` trong PostgreSQL.
- `src/lib/recipes/savedRecipesClient.ts`: Hook `useSavedRecipes()` quản lý state, đồng bộ đa tab qua custom storage events, và xử lý optimistic updates.
- `src/lib/recipes/publicQueries.ts`: Bổ sung hàm `queryPublishedRecipeCardsBySlugs()` an toàn.
- `src/components/recipe/BookmarkButton.tsx`: Nút đánh dấu lưu món ăn hỗ trợ các biến thể kích thước (`sm`, `md`, `lg`) và nhãn hiển thị.
- `src/components/recipe/RecipeCard.tsx`: Tích hợp `BookmarkButton` ở góc trên bên phải ảnh bìa.
- `src/app/cong-thuc/[slug]/page.tsx`: Gắn `BookmarkButton` cạnh nút "Bắt đầu nấu món này".
- `src/app/api/saved-recipes/route.ts`: API endpoints `GET` (lấy slugs đã lưu), `POST` (lưu món), `DELETE` (bỏ lưu món).
- `src/app/api/saved-recipes/sync/route.ts`: API endpoint `POST` đồng bộ danh sách slugs từ khách vào tài khoản người dùng.
- `src/app/api/saved-recipes/cards/route.ts`: API endpoint `POST`/`GET` trả về danh sách thẻ `PublicRecipeCard` đã lưu.
- `src/app/da-luu/page.tsx`: Trang danh sách món ăn đã lưu với Empty State và lưới thẻ món ăn thời gian thực.
- `src/app/layout.tsx`: Thêm mục điều hướng "Đã lưu" trên thanh Header.
- `src/scripts/test_saved_recipes.ts`: Kịch bản kiểm thử tự động toàn diện.

## 4. Test & Verification Results
- `npx tsx src/scripts/test_saved_recipes.ts`: **25/25 PASS** (Lưu, bỏ lưu, unique constraint, cô lập user, Invariants §5.1, cards API helper, guest sync simulation, cascade delete).
- `npx tsx src/scripts/test_cooking_mode.ts`: **19/19 PASS** (Không hồi quy AG-19).
- `npx tsx src/scripts/test_serving_adjustment.ts`: **40/40 PASS** (Không hồi quy AG-18).
- `npx tsx src/scripts/test_search_filters.ts`: **36/36 PASS** (Không hồi quy AG-17).
- `npx tsc --noEmit -p .`: PASS 100% không có cảnh báo hay lỗi kiểu dữ liệu.
- `npm run build`: PASS 100% (Toàn bộ 27/27 static/dynamic routes biên dịch thành công tối ưu).

## 5. Next Steps
Chuyển sang ticket tiếp theo trong Phase P3: **AG-21 (Meal composition & replacement)** — Ghép một bữa cơm gia đình 3 món (mặn, canh, rau) và thuật toán đổi món giữ nguyên phần còn lại theo khẩu phần gia đình.
