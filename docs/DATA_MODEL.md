# DATA MODEL

**Trạng thái: `proposed`** — contract định hướng từ master plan §5. **Chưa có schema/bảng nào.** Tên enum cụ thể khóa tại AG-10.

## Entity
| Entity | Vai trò | Mốc |
|---|---|---|
| Dish | Món tổng quát, tên gọi/alias | Core |
| Recipe | Công thức cụ thể của một tác giả | Core |
| RecipeVersion | Bản công thức cố định, có lịch sử | Core publishing |
| Ingredient | Nguyên liệu chuẩn hóa | Core |
| RecipeIngredient | Lượng, đơn vị, trạng thái, nhóm | Core |
| RecipeStep | Giai đoạn, nội dung, thời gian, tham chiếu nguyên liệu | Core |
| TaxonomyTerm | Phân loại đa trục | Core |
| MediaAsset | Ảnh, chủ sở hữu, nguồn, quyền, trạng thái | Core |
| Profile | Người dùng/tác giả | Core |
| SavedRecipe | Món đã lưu riêng tư | MVP |
| MealPlan / MealPlanItem | Bữa ăn và món | MVP |
| ShoppingList / ShoppingListItem | Nguyên liệu gộp, trạng thái đã có | MVP |
| ModerationEvent | Lịch sử duyệt | Core |
| AIJob | Task AI, provenance, chi phí | Sau MVP |
| NutrientSource / IngredientNutrient | Dinh dưỡng | P6 |
| MealLog / MealLogItem | Lượng đã ăn, snapshot | P6 |

Chỉ tạo schema cần cho spec hiện tại; không tạo bảng giả để tuyên bố feature xong.

## Invariants công thức
- Dish ≠ Recipe; một món nhiều cách nấu.
- Ingredient có cấu trúc, không chỉ chuỗi văn bản; quantity và unit là hai trường.
- Cho phép optional và quantity chưa định lượng, ghi rõ giới hạn.
- Trạng thái sống/chín, phần ăn được có khi ảnh hưởng tính toán.
- Số khẩu phần ≠ vai trò trong bữa ≠ khối lượng thành phẩm.
- RecipeVersion đã xuất bản không sửa âm thầm; sửa = revision, bản cũ hiển thị đến khi revision được duyệt.
- Nhãn “đã biên tập”, “đã nấu thử”, “đủ dữ liệu dinh dưỡng” độc lập nhau.

## Đổi khẩu phần
- Lưu base servings + quy tắc scale từng dòng: tuyến tính / cố định / người dùng tự điều chỉnh.
- Nói rõ lượng không scale được; không tạo số giả chính xác.
- Thời gian, dụng cụ, nước không mặc định tuyến tính.
- Làm tròn chỉ khi hiển thị; đổi qua lại không tích lũy sai số.

## Gộp nguyên liệu
- Chỉ gộp khi cùng ingredient, trạng thái phù hợp, đơn vị tương thích (300 g + 0,2 kg được; 1 bó + 100 g không khi chưa có mapping).
- Không gộp sống với chín, không gộp nguyên liệu thay thế chưa chọn.
- Truy được về từng công thức; đổi món/khẩu phần phải tính lại.
- Lượng “tùy khẩu vị” hiển thị riêng.

## Trạng thái
- Publishing: draft → submitted → published; rejected/needs_changes, archived — chốt tại spec.
- Dinh dưỡng (enum riêng): chưa có dữ liệu / thiếu dữ liệu / ước tính có nguồn.
