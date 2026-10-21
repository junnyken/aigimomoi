# BÁO CÁO TRIỂN KHAI MINI-SPEC R2: CORE MVP VERIFICATION & REAL COOKING FLOWS

- **Parent Phase:** Recovery / Stabilization
- **Task ID:** `R2` — Core MVP Verification & Real Cooking Flows
- **Tài liệu đặc tả:** [docs/mini-specs/R2.md](file:///home/coder/workspace/projects/angimom/docs/mini-specs/R2.md)
- **Quyết định:** **D60** ([docs/DECISIONS.md](file:///home/coder/workspace/projects/angimom/docs/DECISIONS.md))
- **Trạng thái:** **IMPLEMENTED** — đã kiểm chứng logic và kiểm tra tĩnh; **chưa** có E2E trình duyệt / kiểm thử trên điện thoại thật
- **Ngày:** 21/10/2026
- **Chủ sản phẩm:** Nguyễn Thiên Triều

> Báo cáo do agent (Antigravity) tự lập. Mọi kết quả "PASS" dưới đây đến từ test do chính agent viết và chạy; **không phải nghiệm thu độc lập**.

---

## 1. Summary

R2 kiểm chứng hành trình cốt lõi: Tìm món → Đổi khẩu phần → Ghép mâm 3 món → Đi chợ (gộp + gửi Zalo) → Nấu từng bước. Khi dùng dữ liệu bám sát seed thật thay vì fixture mã tiếng Anh, audit phát hiện **5 lỗi thật (B1–B5)** và đã sửa. Vì vậy phạm vi R2 vượt "chỉ kiểm chứng" — điều này được ghi minh bạch ở spec §5.1 và D60.

Điểm quan trọng nhất: **trước R2, mọi nguyên liệu thật trên `/shopping` đều rơi vào mục "Nguyên liệu khác"** (B1), và nhóm gia vị/đồ khô cần mua bị mất khỏi danh sách (B2). Các gate PASS cũ (AG-22/AG-23) không bắt được lỗi này vì fixture không khớp dữ liệu production.

## 2. Audit Before Build — lỗi phát hiện

| Mã | Mức | Lỗi người dùng gặp | Nguyên nhân |
|---|---|---|---|
| B1 | Cao | Danh sách đi chợ không chia quầy; tất cả vào "khác" | DB/seed lưu nhãn tiếng Việt, engine chỉ so mã `MEAT_SEAFOOD/PRODUCE/PANTRY` |
| B2 | Cao | Hành tím, nước mắm, đường, tỏi… (LINEAR) biến mất khỏi `/shopping` và tin Zalo | `categories.pantry` được tính nhưng không UI nào hiển thị |
| B3 | Trung bình | Chọn 6 người ở trang chi tiết, bấm "Bắt đầu nấu" → về lại 4 người | Link tĩnh không mang `?servings` |
| B4 | Trung bình | Từ `/shopping` bấm quay lại → mâm đã chọn bị thay bằng mâm ngẫu nhiên | Link back không mang `main/soup/side` |
| B5 | Thấp | Ký tự "0" lạc trên màn hình nấu khi bước có `timerSeconds = 0` | `{0 && …}` trong JSX render số 0 |

Đã xác minh, **không cần sửa**: `scaling.ts` (LINEAR×R, FIXED/MANUAL_ADJUST giữ gốc, kẹp 1–20, làm tròn chỉ khi hiển thị); `StepTimer` không có cơ chế tự chuyển bước; Chế độ nấu truyền `scaledIngredients` vào ngăn kéo nguyên liệu.

## 3. Thay đổi

| File | Loại | Nội dung |
|---|---|---|
| [aggregation.ts](file:///home/coder/workspace/projects/angimom/src/lib/recipes/aggregation.ts) | sửa | `MarketCategory`, `normalizeMarketCategory()`; áp dụng cho nguyên liệu và gia vị |
| [shoppingClient.ts](file:///home/coder/workspace/projects/angimom/src/lib/shopping/shoppingClient.ts) | sửa | Mục "🧄 GIA VỊ & ĐỒ KHÔ CẦN MUA" trong văn bản Zalo |
| [ShoppingView.tsx](file:///home/coder/workspace/projects/angimom/src/components/shopping/ShoppingView.tsx) | sửa | Section `heading-pantry`; link quay lại giữ mâm |
| [StartCookingButton.tsx](file:///home/coder/workspace/projects/angimom/src/components/recipe/StartCookingButton.tsx) | mới | Đọc `?servings` hiện tại khi bấm |
| [page.tsx (chi tiết món)](file:///home/coder/workspace/projects/angimom/src/app/cong-thuc/[slug]/page.tsx) | sửa | Dùng `StartCookingButton` |
| [flowUrls.ts](file:///home/coder/workspace/projects/angimom/src/lib/meal/flowUrls.ts) | mới | `buildMealQuery`, `mealQueryFromDishes`, `buildCookingHref` |
| [MealSummaryBar.tsx](file:///home/coder/workspace/projects/angimom/src/components/meal/MealSummaryBar.tsx) | sửa | Link đi chợ dùng `buildMealQuery` |
| [CookingModeView.tsx](file:///home/coder/workspace/projects/angimom/src/components/cooking/CookingModeView.tsx) | sửa | `(timerSeconds ?? 0) > 0` |
| [test_core_mvp_flows.ts](file:///home/coder/workspace/projects/angimom/src/scripts/test_core_mvp_flows.ts) | mới | 85 assertions, không cần DB |
| `package.json` | sửa | `"test:core"` |

Không đổi schema, migration, seed hay dữ liệu.

## 4. Kết quả kiểm thử

| Lệnh | Kết quả |
|---|---|
| `npm run test:core` | **85/85 PASS** (7 nhóm; nhóm `[STATIC]` là đọc mã nguồn) |
| `npm run test:auth` (R0) | 45/45 PASS |
| `npm run test:honesty` (R1) | 38/38 PASS |
| `test_shopping_checklist.ts`, `test_serving_adjustment.ts` | 22/22, 40/40 PASS |
| `test_ingredient_aggregation.ts`, `test_cooking_mode.ts` | **NOT RUN** — cần Postgres (ECONNREFUSED) |
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 (log lỗi kết nối DB khi pre-render do môi trường không có Postgres) |
| ESLint file đã chạm | 4 lỗi `react-hooks` **có sẵn từ HEAD** (`CookingModeView` useCallback, `shoppingClient` setState trong effect) — không do R2, chưa sửa |

Mô phỏng mâm Thịt ba chỉ kho tiêu + Canh chua cá lóc + Rau muống xào tỏi cho **6 người** (gốc 4): thịt 600 g, cá lóc 600 g, nước mắm 6 muỗng canh (gộp 2 món), hành tím 4,5 củ, dứa 0,75 quả, đậu bắp/giá 150 g, rau muống 1,5 bó, tỏi 9 tép, dầu ăn 3 muỗng canh, hành lá 2 cây (FIXED); tiêu đen + dầu hào ở mục "nêm theo khẩu vị".

## 5. Sai lệch spec ↔ dữ liệu (cần chủ sản phẩm quyết)

- Kịch bản §6 nói "nước mắm giữ nguyên vì là gia vị nêm", nhưng seed đặt Nước mắm `LINEAR` ở thịt kho/canh chua và `MANUAL_ADJUST` ở canh rau ngót. Engine làm theo dữ liệu. Cần quyết định biên tập thống nhất (đề xuất: nước mắm → `MANUAL_ADJUST` khi biên tập lại).
- Kịch bản nhắc "tỏi băm trong thịt kho" nhưng seed thịt kho không có tỏi.

## 6. Remaining Limits (giới hạn còn lại)

1. **Chưa chạy E2E trình duyệt / Playwright** — luồng click thật, clipboard, Web Audio beep chưa được quan sát.
2. **Chưa chạy với Postgres thật**; 2 script cũ phụ thuộc DB chưa chạy lại.
3. **Chưa kiểm thử trên điện thoại** (vùng chạm ≥44px, không tràn ngang — spec §7.4).
4. `MealView`: effect khôi phục mâm từ localStorage hiện là no-op (chưa sửa, ngoài phạm vi).
5. `StepTimer`: `playBeep` gọi trong updater của `setState` → có thể kêu 2 lần ở StrictMode dev (production không ảnh hưởng). Chưa sửa.
6. 4 lỗi ESLint `react-hooks` có sẵn từ trước.
7. Chưa có CI; test do AI viết, không phải nghiệm thu độc lập.

## 7. Đề xuất bước tiếp theo

- Chủ sản phẩm hoặc người thật bấm thử luồng trên điện thoại (15 phút, theo kịch bản §6) để xác nhận B1–B5.
- R3 đề xuất: Playwright E2E cho luồng chính + CI chạy `test:auth`, `test:honesty`, `test:core`, `tsc`, `build`; sửa no-op khôi phục mâm & double-beep.
