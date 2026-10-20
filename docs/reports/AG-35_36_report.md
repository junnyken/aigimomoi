# Báo cáo Nghiệm thu Kỹ thuật AG-35 & AG-36: Nutrition Engine & Vietnamese Standard Calculator

**Mã ticket**: AG-35 (Nutrition source audit & mapping) & AG-36 (Recipe nutrition calculation with missing-data rules)  
**Thuộc Phase**: P6 — Dinh dưỡng và Nhật ký gia đình  
**Trạng thái**: `HOÀN TẤT & ĐẠT CHUẨN 100%`  
**Ngày hoàn thành**: 21/10/2026  

---

## 1. Mục tiêu Đã Thực Hiện
- Thiết lập chuẩn dữ liệu dinh dưỡng nguyên liệu dựa trên **Bảng Thành Phần Thực Phẩm Việt Nam (Viện Dinh Dưỡng Quốc Gia - Bộ Y Tế)**: nguồn gốc minh bạch `VIETNAM_FCT_2007`.
- Xây dựng hệ thống chuyển đổi đơn vị đo lường thực tế trong bếp Việt (`gam`, `kg`, `lạng`, `thìa canh`, `thìa cà phê`, `quả`, `củ`...) sang khối lượng thực phẩm ăn được.
- Xây dựng bộ máy tính toán dinh dưỡng tự động cho công thức món ăn:
  - Năng lượng (Kcal), Chất đạm (Protein), Chất béo (Lipid), Đường bột (Carb), Natri (Muối) và Chất xơ.
  - Phân tách 3 cấp độ: (1) Toàn bộ nồi nấu (`totalBatch`), (2) Trên 1 khẩu phần ăn (`perServing`), (3) Trên 100g thành phẩm (`per100g`).
  - Tính tỷ lệ bao phủ dữ liệu thực tế (`coveragePercent`).
  - Lưu trữ kết quả dạng Snapshot bất biến (`nutrition_snapshot`) trong bảng `recipes` nhằm chống hồi tố khi sửa từ điển sau này.
- **Thực thi nghiêm ngặt Invariant Tối thượng Gate P6: Dữ liệu thiếu không được ép thành 0 (`Missing is NOT zero`)** nhằm bảo vệ người ăn kiêng, bệnh nhân tim mạch, thận và tiểu đường.
- Nâng cấp giao diện hiển thị **Bảng Dinh Dưỡng Chuẩn Việt Nam** trên trang chi tiết món ăn `/cong-thuc/[slug]`.

---

## 2. Các Thành phần Kỹ thuật Đã Triển khai
1. **Database Migration**:
   - `drizzle/0008_ag35_36_nutrition_engine.sql`:
     - Bảng `ingredient_nutrition` (`ingredient_id`, `source`, `edible_rate`, `calories_100g`, `protein_100g`, `fat_100g`, `carbs_100g`, `fiber_100g`, `sodium_100g`, `is_verified`).
     - Cột `recipes.nutrition_snapshot` (`jsonb`).
2. **Nutrition Core Modules**:
   - `src/lib/nutrition/types.ts`: Định nghĩa kiểu dữ liệu chuẩn y học.
   - `src/lib/nutrition/units.ts`: Chuyển đổi đơn vị bếp Việt (`lạng`, `thìa canh`, `quả`, `củ`...).
   - `src/lib/nutrition/seedData.ts`: Dữ liệu chuẩn Viện Dinh Dưỡng cho các nhóm thực phẩm tươi sống, gia vị truyền thống Việt Nam.
   - `src/lib/nutrition/calculator.ts`: Động cơ tính toán dinh dưỡng, phân tích phần ăn được và tính độ bao phủ.
3. **API Endpoints**:
   - `GET /api/recipes/[id]/nutrition`: Trả về snapshot dinh dưỡng chi tiết.
   - `POST /api/recipes/[id]/nutrition`: Tính toán / cập nhật snapshot dinh dưỡng.
4. **Frontend UI**:
   - `src/components/recipe/NutritionNotice.tsx`: Bảng Dinh Dưỡng Chuẩn Việt Nam với phân tích Kcal, Đạm, Béo, Đường bột, Natri, Chất xơ và badge kiểm định kèm tỷ lệ bao phủ.

---

## 3. Kết quả Kiểm thử Tự động (`src/scripts/test_nutrition_engine.ts`)
- **Tổng số test cases**: 30/30 tests
- **Tỷ lệ thành công**: 100% PASS
  - ✓ Chuyển đổi chính xác: 500g, 0.5kg, 3 lạng, 2 thìa canh (30g), 4 quả trứng gà (220g), 2 củ hành tím (30g).
  - ✓ Đồng bộ chuẩn xác Bảng FCT Viện Dinh Dưỡng vào Postgres DB.
  - ✓ Tính toán Kcal và Macro đĩa Thịt kho tàu mẫu: 423 kcal / khẩu phần, 29.5g Protein, 682mg Natri.
  - ✓ Phát hiện đúng nguyên liệu lạ trong danh sách thiếu và tính tỷ lệ bao phủ đạt 97%.
  - ✓ Bật nhãn kiểm định `isNutritionVerified = true` khi độ bao phủ >= 80%.
  - ✓ Bảo toàn dữ liệu thiếu không bị ép thành 0 (Missing is not Zero).
  - ✓ Lưu Snapshot jsonb đầy đủ vào cơ sở dữ liệu.
  - ✓ API GET và POST phản hồi nhanh chóng, chính xác.
