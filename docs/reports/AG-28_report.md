# AG-28 Verification Report: AI Recipe & Meal Suggestion with Strict Catalog Grounding

**Ngày:** 20/10/2026  
**Ticket:** AG-28  
**Parent Phase:** Phase P4 — AI có kiểm soát (Controlled AI)  
**Trạng thái:** ✅ COMPLETED & VERIFIED (Option I1)

---

## 1. Mục tiêu và Tiêu chuẩn Nghiệm thu
- **Mục tiêu:** Xây dựng tính năng trợ lý AI gợi ý mâm cơm gia đình 3 món từ nguyên liệu sẵn có trong tủ lạnh, bảo đảm tuân thủ nghiêm ngặt **Catalog Grounding (Invariants §5.1, §5.3, Gate P4)**:
  - 100% món ăn được gợi ý phải là công thức thật tồn tại trong database và có trạng thái `PUBLISHED`.
  - Không bao giờ cho phép AI trả về món ảo (hallucination) hay bản nháp (`DRAFT`).
  - Đảm bảo cấu trúc mâm cơm 3 vai trò: 1 Món Mặn (`MAIN`), 1 Món Canh (`SOUP`), 1 Món Rau/Xào (`SIDE`).
  - Hỗ trợ trải nghiệm khách vãng lai và fallback Heuristic tự động khi không có API key hay mất kết nối.

---

## 2. Các thành phần đã triển khai

### 2.1. Động cơ Gợi ý & Lớp Thẩm định Grounding (`src/lib/ai/mealSuggester.ts`)
- Lấy bối cảnh toàn bộ danh mục công thức `PUBLISHED` từ PostgreSQL.
- Xây dựng prompt có cấu trúc chặt chẽ, hướng dẫn AI chọn công thức từ catalog có sẵn và trả về JSON schema chuẩn (`mainSlug`, `soupSlug`, `sideSlug`, `rationale`, `matchingIngredients`).
- **Grounding Validation Layer**:
  - Đối chiếu từng slug trả về với database.
  - Tự động phát hiện và chặn slug bịa đặt hoặc sai vai trò, kích hoạt cơ chế fallback chọn công thức phù hợp nhất trong danh mục có sẵn.

### 2.2. API Route (`src/app/api/ai/meal-suggestion/route.ts`)
- Endpoint: `POST /api/ai/meal-suggestion`.
- Header Cache-Control: `no-store, no-cache, must-revalidate`.
- Tích hợp rate limiting theo client IP và logger che giấu thông tin nhạy cảm.

### 2.3. Giao diện Người dùng (`src/components/meal/AiMealSuggestionModal.tsx` & `MealView.tsx`)
- Nút "✨ Gợi ý AI" nổi bật trên thanh điều khiển của trang `/meal`.
- Modal hỗ trợ chọn nhanh các thẻ nguyên liệu tủ lạnh phổ biến và nhập nguyên liệu tùy biến.
- Hiển thị trực quan mâm cơm 3 món kèm lời giải thích ấm áp (`rationale`) và tỷ lệ khớp nguyên liệu.
- Nút "Áp dụng mâm này" đồng bộ ngay lập tức 3 món vào mâm cơm hiện tại, URL query params và localStorage.

---

## 3. Kết quả Kiểm thử & Nghiệm thu

### 3.1. Test Suite Chuyên biệt (`src/scripts/test_ai_meal_suggestion.ts`)
- **Tổng số test cases:** 30
- **Kết quả:** **30 PASS, 0 FAIL (100%)**
  - ✅ **Test 1**: Gợi ý mâm cơm với nguyên liệu tủ lạnh (thịt ba chỉ, rau muống) trả về đủ 3 món và rationale.
  - ✅ **Test 2**: 100% slug trả về (`thit-ba-chi-kho-tieu`, `canh-rau-ngot-thit-bam`, `rau-muong-xao-toi`) là công thức `PUBLISHED` thật trong database, đúng chuẩn vai trò MAIN, SOUP, SIDE.
  - ✅ **Test 3**: Nhận diện chính xác danh sách nguyên liệu đã tận dụng (`matchingIngredients`).
  - ✅ **Test 4**: Hoạt động trơn tru khi người dùng không nhập nguyên liệu cụ thể.
  - ✅ **Test 5**: DTO trả về đầy đủ các trường hiển thị UI (`heroImage`, `prepTimeMinutes`, `cookTimeMinutes`, `difficulty`, `baseServings`).
  - ✅ **Test 6 (Anti-Hallucination)**: Giả lập AI sinh slug bịa đặt (`mon-thit-rong-bien-fake-12345`), Grounding Validator tự động chặn đứng và thay thế bằng slug `PUBLISHED` hợp lệ trong DB.

### 3.2. Kiểm thử Hồi quy Hệ thống
- `test_ai_boundary_budget.ts` (AG-27): **20/20 PASS**.
- `test_p3_pilot_gate.ts` (AG-20..AG-26): **36/36 PASS**.
- `tsc --noEmit -p .`: **0 errors**.
- `npm run build`: **Next.js Production build thành công 100% (36/36 static/dynamic routes)**.

---

## 4. Quyết định kỹ thuật liên quan
- **D48** ghi nhận trong [DECISIONS.md](../DECISIONS.md): Strict Catalog Grounding & AI Meal Assistant with Pantry Ingredients.

---

## 5. Kết luận
Ticket **AG-28** đã hoàn thành xuất sắc toàn bộ tiêu chí kỹ thuật và Invariants của Phase P4. Sẵn sàng đóng ticket và chuyển sang AG-29 (AI Authoring Drafts & Recipe Schema Generation).
