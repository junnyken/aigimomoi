# BÁO CÁO NGHIỆM THU MINI-SPEC R1: DATA HONESTY & VERIFICATION BADGES

- **Parent Phase:** Recovery / Stabilization
- **Task ID:** `R1` — Data Honesty & Verification Badges
- **Tài liệu đặc tả:** [docs/mini-specs/R1.md](file:///home/coder/workspace/projects/angimom/docs/mini-specs/R1.md)
- **Quyết định phê duyệt:** Quyết định **D59** ([docs/DECISIONS.md](file:///home/coder/workspace/projects/angimom/docs/DECISIONS.md))
- **Trạng thái:** **IMPLEMENTED & VERIFIED** (Đạt chuẩn 100%)
- **Ngày hoàn thành:** 21/10/2026
- **Chủ sản phẩm:** Nguyễn Thiên Triều

---

## 1. Summary

Task R1 đã giải quyết dứt điểm **Vấn đề 3** được chỉ ra trong `docs/HIEN_TRANG_DU_AN.md`, khôi phục tính trung thực dữ liệu theo cam kết tối thượng của Quyết định **D23**: *"Bữa cơm nhà, không nói dối người nấu"*.

Phạm vi hoàn tất bao gồm:
1. **Triệt tiêu nhãn chứng nhận giả mạo:** Chuyển `isCookTested: false` cho toàn bộ 17/17 món ăn trong hai script hạt giống (`seed_production_catalog.ts` và `seed_p7_catalog.ts`). Không một món ăn nào được tự phong "Đã nấu thử" khi chưa có người nấu thực tế và biên bản nghiệm thu bếp.
2. **Minh bạch hình ảnh 100%:** Thiết lập helper `isIllustrationImage()` nhận diện tự động ảnh lấy từ kho ảnh ngoài (Unsplash); gắn nhãn `Ảnh minh họa` tinh tế, trang nhã trên toàn bộ các thẻ món ăn (`RecipeCard`, `MealSlotCard`, `SwapDishModal`) và trang chi tiết `/cong-thuc/[slug]` kèm ghi chú chân thành.
3. **Degrade trung thực nhãn kiểm chứng:** Cập nhật component `VerificationBadges.tsx` hiển thị trạng thái `Chờ kiểm nghiệm bếp mẫu` đối với các công thức chưa nấu thử nghiệm thu.
4. **Bảo toàn luồng người dùng & bộ lọc:** Giữ nguyên vẹn toàn bộ 55 routes công khai và nội bộ; bộ lọc `/mon-an?tested=true` hoạt động trung thực.
5. **Kiểm thử tự động:** Tạo mới suite `npm run test:honesty` với 38/38 ca kiểm thử PASS 100%; bảo toàn bộ test `npm run test:auth` (45/45 PASS); `npx tsc --noEmit` exit 0; `npm run build` exit 0.

---

## 2. Audit Before Build

Đối chiếu giữa hiện trạng audit ban đầu và kết quả xử lý:

| Thành phần | Trước R1 (Commit b9f5937) | Sau R1 (Đã hoàn thiện) |
|---|---|---|
| `seed_production_catalog.ts` | Gán cứng `isCookTested: true` cho 12 món cơm nhà | Đã chuyển về `isCookTested: false` (giữ `isEditorialReviewed: true`) |
| `seed_p7_catalog.ts` | Gán cứng `isCookTested: true` cho 5 món P7 | Đã chuyển về `isCookTested: false` (giữ `isEditorialReviewed: true`) |
| Nguồn ảnh 17 món ăn | Toàn bộ là ảnh Unsplash không ghi chú | Gắn nhãn chỉ báo `Ảnh minh họa` và ghi chú xuất xứ minh bạch |
| `RecipeCard.tsx` | Hiển thị `<ChefHat /> Đã nấu thử` cho toàn bộ món | Ẩn hoàn toàn huy hiệu; chỉ hiện nhãn `Ảnh minh họa` ở góc ảnh |
| `VerificationBadges.tsx` | Trả về `null` khi thiếu nhãn, không giải thích | Hiển thị nhãn trung thực: `Chờ kiểm nghiệm bếp mẫu` |
| `MealSlotCard.tsx` & `SwapDishModal.tsx` | Hiển thị "Đã nấu thử" / "Đã test" giả | Ẩn nhãn kiểm chứng giả; bổ sung chỉ báo `Ảnh minh họa` |
| `test_p3_pilot_gate.ts` | Ép buộc sai lệch `r.isCookTested === true` | Đã sửa: kiểm tra tiêu chuẩn biên tập, không ép buộc cờ giả |

---

## 3. Design Choice

Áp dụng mô hình **Minh Bạch Hai Tầng (Two-Tier Honesty Architecture)**:
- **Tầng 1 — Data Truthfulness:** Tách biệt rõ ràng giữa công tác biên tập cấu trúc (nguyên liệu, bước nấu, timer, mẹo $\to$ `isEditorialReviewed = true`) và kiểm nghiệm thực tế tại gian bếp gia đình (`isCookTested = false`).
- **Tầng 2 — Visual Transparency & Attribution:** Tự động suy diễn cờ `isIllustration` thông qua helper thuần `isIllustrationImage()`, hiển thị huy hiệu `Ảnh minh họa` tinh tế, tạo dựng niềm tin tuyệt đối với người nội trợ mà không làm ảnh hưởng đến thẩm mỹ giao diện Warm Kitchen.

---

## 4. Changed Files

### Mã nguồn chính (Source Code):
1. [src/lib/recipes/labels.ts](file:///home/coder/workspace/projects/angimom/src/lib/recipes/labels.ts): Bổ sung hàm `isIllustrationImage()`.
2. [src/scripts/seed_production_catalog.ts](file:///home/coder/workspace/projects/angimom/src/scripts/seed_production_catalog.ts): Chuyển `isCookTested = false` cho 12 món cơm nhà.
3. [src/scripts/seed_p7_catalog.ts](file:///home/coder/workspace/projects/angimom/src/scripts/seed_p7_catalog.ts): Chuyển `isCookTested = false` cho 5 món P7.
4. [src/lib/recipes/publicQueries.ts](file:///home/coder/workspace/projects/angimom/src/lib/recipes/publicQueries.ts): Bổ sung trường `isIllustration: boolean` cho `PublicRecipeCard` và `PublicRecipe`.
5. [src/lib/recipes/searchQueries.ts](file:///home/coder/workspace/projects/angimom/src/lib/recipes/searchQueries.ts): Tính toán `isIllustration` trong `searchPublishedRecipes`.
6. [src/lib/meal/mealQueries.ts](file:///home/coder/workspace/projects/angimom/src/lib/meal/mealQueries.ts): Bổ sung `isIllustration` trong `MealDishSummary`.
7. [src/components/recipe/RecipeCard.tsx](file:///home/coder/workspace/projects/angimom/src/components/recipe/RecipeCard.tsx): Gắn nhãn `Ảnh minh họa`, bảo vệ điều kiện `recipe.isCookTested`.
8. [src/components/recipe/VerificationBadges.tsx](file:///home/coder/workspace/projects/angimom/src/components/recipe/VerificationBadges.tsx): Bổ sung trạng thái trung thực `Chờ kiểm nghiệm bếp mẫu`.
9. [src/app/cong-thuc/[slug]/page.tsx](file:///home/coder/workspace/projects/angimom/src/app/cong-thuc/[slug]/page.tsx): Hiển thị nhãn `Ảnh minh họa` trên hero image và ghi chú chân thành dưới ảnh.
10. [src/components/meal/MealSlotCard.tsx](file:///home/coder/workspace/projects/angimom/src/components/meal/MealSlotCard.tsx): Hiển thị nhãn `Ảnh minh họa`.
11. [src/components/meal/SwapDishModal.tsx](file:///home/coder/workspace/projects/angimom/src/components/meal/SwapDishModal.tsx): Hiển thị nhãn `Minh họa`.

### Kiểm thử & Kịch bản (Tests & Scripts):
12. [src/scripts/test_p3_pilot_gate.ts](file:///home/coder/workspace/projects/angimom/src/scripts/test_p3_pilot_gate.ts): Điều chỉnh invariant kiểm tra chất lượng catalog.
13. [src/scripts/test_seo_boundaries.ts](file:///home/coder/workspace/projects/angimom/src/scripts/test_seo_boundaries.ts): Đồng bộ mock `PublicRecipe` với trường `isIllustration`.
14. [src/scripts/test_data_honesty.ts](file:///home/coder/workspace/projects/angimom/src/scripts/test_data_honesty.ts): **Tạo mới bộ test tự động 38 assertions.**
15. [package.json](file:///home/coder/workspace/projects/angimom/package.json): Bổ sung lệnh `"test:honesty": "tsx src/scripts/test_data_honesty.ts"`.

### Tài liệu dự án (Documentation):
16. [docs/DECISIONS.md](file:///home/coder/workspace/projects/angimom/docs/DECISIONS.md): Ghi nhận Quyết định **D59**.
17. [docs/ROADMAP.md](file:///home/coder/workspace/projects/angimom/docs/ROADMAP.md): Chuyển R1 sang `closed`.
18. [docs/TEST_LOG.md](file:///home/coder/workspace/projects/angimom/docs/TEST_LOG.md): Ghi nhận log kiểm thử R1.
19. [docs/HIEN_TRANG_DU_AN.md](file:///home/coder/workspace/projects/angimom/docs/HIEN_TRANG_DU_AN.md): Đánh dấu hoàn tất Vấn đề 3.
20. [docs/mini-specs/R1.md](file:///home/coder/workspace/projects/angimom/docs/mini-specs/R1.md): Cập nhật trạng thái `IMPLEMENTED`.

---

## 5. New API/DB/State

- **Database PostgreSQL:** Không thêm bảng mới, không đổi enum, không cần migration.
- **Data Contract:**
  - `PublicRecipeCard`: Thêm trường `isIllustration: boolean`.
  - `PublicRecipe`: Thêm trường `isIllustration: boolean`.
  - `MealDishSummary`: Thêm trường `isIllustration?: boolean`.
- **UI State:** Trạng thái `Chờ kiểm nghiệm bếp mẫu` (`Clock` icon, amber-600) hiển thị khi `isCookTested === false`.

---

## 6. Tests

Chạy 3 bộ kiểm thử độc lập liên hoàn:

1. **`npm run test:honesty` (Bộ test chuyên dụng R1):**
   - 38/38 assertions đạt **PASS 100% (Exit code: 0)**.
   - Bao phủ: Nhận diện ảnh stock vs local uploads, phân tích tĩnh mã nguồn seed, logic suy giảm nhãn kiểm chứng, giao diện thẻ món và truy vấn tìm kiếm.
2. **`npm run test:auth` (Bộ test hồi quy R0):**
   - 45/45 assertions đạt **PASS 100% (Exit code: 0)**.
   - Bảo toàn 100% cơ chế fail-closed của `AUTH_SECRET` và probe 503.
3. **Typecheck & Production Build:**
   - `npx tsc --noEmit` đạt **Exit code: 0** (không có lỗi kiểu dữ liệu).
   - `npm run build` biên dịch thành công toàn bộ **55/55 routes** tĩnh và động.

---

## 7. Remaining Limits & Follow-ups

- **Chưa có ảnh món ăn chụp thật:** Toàn bộ 17 món ăn hiện dùng ảnh Unsplash minh họa. Khi chủ sản phẩm / đội ngũ nấu thử thực tế từng món, ảnh chụp bếp nhà sẽ được đưa vào thư mục `/uploads/...` và cập nhật cờ `isCookTested = true`.
- **Nâng quy mô Catalog (Mục tiêu 30 món cho MVP Batch 1):** Hiện tại có 12 món cơm nhà + 5 món P7. Bước tiếp theo R2 / P8 sẽ bổ sung các món còn lại để đạt chỉ tiêu 30 món hoàn chỉnh.
- **Tiến trình tiếp theo:** Sẵn sàng chuyển tiếp sang **Task R2 — Core MVP Verification & Real Cooking Flows** hoặc chuẩn bị kịch bản diễn tập triển khai thực tế.
