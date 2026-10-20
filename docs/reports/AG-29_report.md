# AG-29 Verification Report: AI Authoring Drafts & Recipe Schema Generation

**Ngày:** 20/10/2026  
**Ticket:** AG-29  
**Parent Phase:** Phase P4 — AI có kiểm soát (Controlled AI)  
**Trạng thái:** ✅ COMPLETED & VERIFIED (Option I1)

---

## 1. Mục tiêu và Tiêu chuẩn Nghiệm thu
- **Mục tiêu:** Xây dựng tính năng trợ lý AI hỗ trợ biên tập viên tạo nhanh khung bản thảo công thức có cấu trúc hoàn chỉnh từ tên món ăn, bảo đảm tuân thủ nghiêm ngặt **Invariants Gate P4 & Master Plan (§5.1, §5.5, §8.2)**:
  - **Output Schema Valid**: Cấu trúc dữ liệu sinh ra phải hợp lệ 100% (tên, mô tả, vai trò, thời gian, độ khó, mảng nguyên liệu có `scalePolicy` và mảng bước nấu theo phase có `timerSeconds` và `tipText`).
  - **Nháp có provenance**: Lưu rõ xuất xứ `provenance = 'AI_ASSISTED'` trong cơ sở dữ liệu.
  - **Cấm tự động publish (No Auto-Publish Bypass)**: Bản nháp AI tạo ra luôn bị khóa ở trạng thái `status = 'DRAFT'`. Tuyệt đối không có đường tắt tự động xuất bản (`PUBLISHED`) hay tự động bật cờ kiểm duyệt (`isCookTested = false`, `isEditorialReviewed = false`, `isNutritionVerified = false`).
  - **Kiểm soát phân quyền**: Chỉ người dùng có vai trò `EDITOR` hoặc `ADMIN` mới được phép sử dụng tính năng sinh bản thảo công thức.

---

## 2. Các thành phần đã triển khai

### 2.1. Cơ sở dữ liệu: Cột `provenance` (`drizzle/0004_ag29_ai_provenance.sql`)
- Bổ sung cột `provenance` vào bảng `recipes`: `text('provenance').notNull().default('MANUAL')`.
- Đã chạy migration thành công trên cơ sở dữ liệu PostgreSQL `angimom_postgres`.

### 2.2. Động cơ Sinh Bản thảo AI (`src/lib/ai/recipeDraftGenerator.ts`)
- Tiếp nhận input: tên món ăn, vai trò (`MAIN`, `SOUP`, `SIDE`, `ONE_DISH_MEAL`), vùng miền, ghi chú phong cách.
- System instruction yêu cầu sinh cấu trúc JSON chuẩn theo quy chuẩn ẩm thực gia đình Việt Nam.
- **Lớp Schema Sanitizer & Tự động liên kết nguyên liệu**:
  - Đối chiếu tên nguyên liệu do AI sinh ra với từ điển `ingredients` trong DB.
  - Tự động gán `ingredientId` hợp lệ hoặc khởi tạo nguyên liệu mới vào từ điển nếu chưa có.
  - Ép cứng các invariant an toàn: `status = 'DRAFT'`, `provenance = 'AI_ASSISTED'`, `isCookTested = false`, `isEditorialReviewed = false`, `isNutritionVerified = false`.
- Hàm `saveAiDraftToDatabase`: Lưu trực tiếp bản nháp vào DB trong một transaction an toàn, tạo slug duy nhất và quan hệ đầy đủ với bảng `dishes`, `recipe_ingredients`, `cooking_steps`.

### 2.3. API Endpoint (`src/app/api/ai/recipe-draft/route.ts`)
- Endpoint: `POST /api/ai/recipe-draft`.
- Kiểm tra session đăng nhập: Bắt buộc role `EDITOR` hoặc `ADMIN`, trả về HTTP 403 nếu không đủ quyền.
- Hỗ trợ 2 chế độ:
  - `mode = 'GENERATE'`: Trả về JSON để pre-fill vào form `NewRecipePage`.
  - `mode = 'SAVE_DRAFT'`: Lưu thẳng bản nháp `DRAFT` vào DB và trả về `recipeId`.
- Cập nhật cả `POST /api/recipes` tại `src/app/api/recipes/route.ts` để chặn triệt để mọi hành vi cố tình gửi `provenance: 'AI_ASSISTED'` kèm trạng thái xuất bản.

### 2.4. Giao diện Người dùng (`src/components/editor/AiDraftModal.tsx`)
- Tích hợp nút `✨ Soạn bằng AI` trên thanh điều khiển của cả trang `/editor/recipes/new` và danh sách `/editor/recipes`.
- Giao diện nhập nhanh tên món ăn, vai trò, vùng miền và ghi chú phong cách nấu.
- Màn hình xem trước (Draft Preview) trực quan các nguyên liệu và bước nấu được gợi ý.
- Hai hành động linh hoạt: "Điền vào biểu mẫu này" và "Lưu ngay thành bản nháp & Chỉnh sửa".
- Hiển thị huy hiệu `🤖 AI Assistant` trên thẻ công thức ở danh sách `/editor/recipes` và thanh tiêu đề `/editor/recipes/[id]`.

---

## 3. Kết quả Kiểm thử & Nghiệm thu

### 3.1. Test Suite Chuyên biệt (`src/scripts/test_ai_authoring_drafts.ts`)
- **Tổng số test cases:** 52
- **Kết quả:** **52 PASS, 0 FAIL (100%)**
  - ✅ **Test 1**: Khởi tạo bản thảo AI cho món mặn (MAIN) trả về đầy đủ tên, mô tả, vai trò, thời gian nấu, khẩu phần chuẩn.
  - ✅ **Test 2 (Gate P4 Invariants)**: `status = 'DRAFT'`, `provenance = 'AI_ASSISTED'`, `isCookTested = false`, `isEditorialReviewed = false`, `isNutritionVerified = false`.
  - ✅ **Test 3 (Schema Validity)**: Mọi nguyên liệu đều có `ingredientId > 0`, `amount > 0`, `scalePolicy` thuộc `LINEAR | FIXED | MANUAL_ADJUST`. Mọi bước nấu đều có `phaseName` chuẩn và `instruction` chi tiết.
  - ✅ **Test 4 (Database Persistence)**: Bản nháp lưu trực tiếp vào PostgreSQL bảo toàn 100% các cờ invariants, liên kết đúng khóa ngoại và đã dọn dẹp sạch sẽ sau kiểm thử.
  - ✅ **Test 5 (SOUP Draft)**: Khởi tạo bản thảo món canh đạt chuẩn `role: SOUP`, `status: DRAFT`, `provenance: AI_ASSISTED`.
  - ✅ **Test 6 (SIDE Draft)**: Khởi tạo bản thảo món rau đạt chuẩn `role: SIDE`, `status: DRAFT`, `provenance: AI_ASSISTED`.

### 3.2. Kiểm thử Hồi quy Toàn diện
- `test_ai_meal_suggestion.ts` (AG-28): **30/30 PASS**.
- `test_ai_boundary_budget.ts` (AG-27): **20/20 PASS**.
- `test_p3_pilot_gate.ts` (AG-20..AG-26): **36/36 PASS**.
- `tsc --noEmit -p .`: **0 errors**.
- `npm run build`: **Next.js Production build thành công 100% (37/37 static/dynamic routes)**.

---

## 4. Quyết định kỹ thuật liên quan
- **D49** ghi nhận trong [DECISIONS.md](../DECISIONS.md): AI Recipe Authoring Drafts, Schema Sanitization & Provenance Tracking.

---

## 5. Kết luận
Ticket **AG-29** đã hoàn thành trọn vẹn toàn bộ yêu cầu kỹ thuật và tiêu chuẩn an toàn Invariants của Phase P4. Sẵn sàng đóng ticket và chuyển sang AG-30 (AI Evaluation & Fallback Review — Mốc chốt Gate P4).
