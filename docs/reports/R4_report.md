# BÁO CÁO NGHIỆM THU R4 — ĐỒNG BỘ MIGRATION JOURNAL & TỐI ƯU HÓA DEPLOYMENT

Ngày: 21/10/2026  
Chủ sản phẩm: Nguyễn Thiên Triều  
Trạng thái: **IMPLEMENTED & VERIFIED** (Quyết định D62)  

---

## 1. Kết quả tóm tắt

| Mục | Trước R4 | Sau R4 | Kết quả |
|---|---|---|---|
| **Drizzle Journal** | 3/11 mục (`0000`–`0002`) | 11/11 mục (`0000`–`0010`) | `drizzle-kit migrate` tạo đủ 18 bảng trên DB sạch |
| **Deploy Migration** | `psql < file 2>/dev/null \|\| true` | `scripts/migrate_production.js` (fail-closed, idempotent) | Bỏ triệt để `\|\| true`, có tracking chuẩn Drizzle |
| **Database Readiness** | `sleep 5` cố định | Polling `pg_isready` tối đa 30 lần (60s) | Không lo race condition khi Postgres khởi động chậm |
| **Prerender Log** | Bị `NEXT_STATIC_GEN_BAILOUT` ở `/cong-thuc/[slug]/nau` | Suspense boundary bọc `searchParams` | 55/55 routes prerender sạch, 0 cảnh báo |
| **ESLint Scoped** | Lỗi `set-state-in-effect` ở `SwapDishModal.tsx` | Refactor component keyed by `role` + mở rộng lint | `npm run lint:scoped` đạt 0 errors, 0 warnings |

---

## 2. Chi tiết thực hiện

### 2.1. Đồng bộ Migration Journal (`drizzle/meta/_journal.json`)
- Đã bổ sung chính xác 8 mục migration thiếu vào `_journal.json`:
  - `0003_ag20_saved_recipes`
  - `0004_ag29_ai_provenance`
  - `0005_ag32_recipe_reports`
  - `0006_ag33_dish_variants_stories`
  - `0007_ag34_cooked_feedback`
  - `0008_ag35_36_nutrition_engine`
  - `0009_ag37_38_meal_diary`
  - `0010_ag39_40_41_p7_catalog_pantry_planner`
- Đã kiểm chứng thực tế:
  - Tạo DB trắng `angimom_migration_test` trên Docker PostgreSQL 16.
  - Chạy `npx drizzle-kit migrate`: thành công tuyệt đối, tạo đủ 18 bảng và ghi nhận đủ 11 bản ghi vào `drizzle.__drizzle_migrations`.

### 2.2. Nâng cấp Script Triển khai Production (`scripts/deploy_production.sh`)
- Tạo `scripts/migrate_production.js`:
  - Đảm bảo `drizzle.__drizzle_migrations` tồn tại.
  - Đọc `_journal.json`, kiểm tra xem migration đã áp dụng chưa theo `created_at`.
  - Thực thi migration mới qua Docker với `ON_ERROR_STOP=1`.
  - Dừng script ngay lập tức nếu có lỗi (fail-closed), tuyệt đối không bỏ qua lỗi.
  - Đã kiểm chứng tính Idempotent: chạy lần 2 tự động nhận diện 11/11 file đã áp dụng và bỏ qua an toàn.
- Cập nhật `scripts/deploy_production.sh`:
  - Polling `docker exec angimom_prod_postgres pg_isready` trước khi chạy migration.
  - Chạy `node scripts/migrate_production.js`.

### 2.3. Khắc phục Prerender Bailout tại `/cong-thuc/[slug]/nau`
- Bọc phần đọc `searchParams` trong component `CookingModeContent` bên trong `<Suspense fallback={<CookingLoadingShell />}>`.
- Kiểm chứng qua `npm run build`:
  - Toàn bộ 55 routes được sinh tĩnh/partial prerender hoàn chỉnh.
  - Cảnh báo `NEXT_STATIC_GEN_BAILOUT` hoàn toàn biến mất khỏi terminal và log.

### 2.4. Chuẩn hóa ESLint
- Tách `SwapDishModal` thành container cha và `SwapDishModalContent` bên trong có `key={role}`:
  - `isLoading` được khởi tạo là `true` ngay từ đầu, fetch dữ liệu và chỉ `setState` khi promise trả về.
  - Loại bỏ hoàn toàn việc gọi `setState` đồng bộ bên trong effect body.
- Cập nhật `package.json` đưa `SwapDishModal.tsx` và `cong-thuc/[slug]/nau/page.tsx` vào `lint:scoped`.
- Dọn sạch các import thừa tại `mealQueries.ts`, `test_auth_hardening.ts`, `test_data_honesty.ts`.

---

## 3. Nhật ký kiểm tra tổng thể trước khi Push

1. `npm run lint:scoped`: **PASS** (0 errors, 0 warnings).
2. `npx tsc --noEmit`: **PASS** (0 errors).
3. `npm run test:auth`: **PASS** (45/45 assertions).
4. `npm run test:honesty`: **PASS** (38/38 assertions).
5. `npm run test:core`: **PASS** (99/99 assertions).
6. `npm run test:e2e:db`: **PASS** (11 migration files áp dụng thành công, seed catalog thành công).
7. `npm run test:e2e`: **PASS** (13 passed, 1 skipped).
8. `npm run build`: **PASS** (55/55 routes, 0 lỗi prerender).
