# DATA MODEL — Hợp đồng Dữ liệu & Invariants

**Trạng thái:** `approved` tại AG-02 (20/10/2026). Sẽ được hiện thực hóa thành Drizzle Schema tại AG-10.

---

## 1. Danh sách Thực thể Cốt lõi (Core Entities)

| Thực thể | Vai trò nghiệp vụ | Quan hệ chính | Mốc triển khai |
|---|---|---|---|
| **Dish** | Món ăn tổng quát (VD: "Thịt kho tàu"), quản lý tên, alias vùng miền, giới thiệu | 1 Dish có nhiều Recipe | Core (P2) |
| **Recipe** | Công thức cụ thể của một tác giả/người nấu cho 1 Dish | Thuộc về 1 Dish và 1 Profile | Core (P2) |
| **RecipeVersion** | Bản ghi công thức đóng băng tại thời điểm xuất bản (có snapshot đầy đủ nguyên liệu, bước) | Thuộc về 1 Recipe; lưu lịch sử revision | Core (P2) |
| **Ingredient** | Nguyên liệu chuẩn hóa (tên gốc, đơn vị mặc định, nhóm thực phẩm) | Tham chiếu bởi RecipeIngredient | Core (P2) |
| **RecipeIngredient** | Chi tiết nguyên liệu trong công thức: định lượng, đơn vị, trạng thái sơ chế, ghi chú | Thuộc về 1 RecipeVersion và 1 Ingredient | Core (P2) |
| **RecipeStep** | Các bước thực hiện: số thứ tự, tiêu đề giai đoạn, nội dung, thời gian ước tính, lửa | Thuộc về 1 RecipeVersion | Core (P2) |
| **TaxonomyTerm** | Phân loại đa trục (vai trò, cách chế biến, vùng miền, độ khó) | N-N với Recipe | Core (P2) |
| **MediaAsset** | Ảnh món ăn, metadata (kích thước, định dạng WebP, bản quyền, alt text) | Thuộc về Recipe hoặc RecipeStep | Core (P2) |
| **Profile** | Người dùng/tác giả (vai trò Admin/Editor/Member) | Sở hữu Recipe, SavedRecipe, MealPlan | Core (P2) |
| **SavedRecipe** | Món đã lưu riêng tư của người dùng | Thuộc về Profile và Recipe | MVP (P3) |
| **MealPlan** | Bữa ăn gia đình (tên bữa, ngày, số người) | Thuộc về Profile; chứa nhiều MealPlanItem | MVP (P3) |
| **MealPlanItem** | Món cụ thể trong bữa ăn kèm khẩu phần đã chọn | Thuộc về MealPlan và Recipe | MVP (P3) |
| **ShoppingList** | Danh sách nguyên liệu đã gộp từ bữa ăn | Thuộc về Profile hoặc MealPlan | MVP (P3) |
| **ShoppingListItem** | Dòng nguyên liệu gộp: tổng lượng, đơn vị, trạng thái (đã có / cần mua) | Thuộc về ShoppingList và Ingredient | MVP (P3) |
| **ModerationEvent** | Nhật ký duyệt (người duyệt, thời gian, trạng thái, lý do) | Thuộc về Recipe | Core (P2) |

---

## 2. Khóa Danh mục Enum Chuẩn (Standard Enums)

### 2.1. Trạng thái Xuất bản Công thức (`RecipePublishStatus`)
```typescript
export enum RecipePublishStatus {
  DRAFT = 'DRAFT',                     // Bản nháp đang soạn, chỉ tác giả/admin thấy
  SUBMITTED = 'SUBMITTED',             // Đã gửi chờ duyệt
  PUBLISHED = 'PUBLISHED',             // Đã xuất bản công khai
  NEEDS_CHANGES = 'NEEDS_CHANGES',     // Cần chỉnh sửa thêm theo góp ý
  ARCHIVED = 'ARCHIVED',               // Đã lưu trữ / ẩn khỏi kết quả tìm kiếm
}
```

### 2.2. Vai trò Món ăn trong Bữa (`MealRole`)
```typescript
export enum MealRole {
  MAIN = 'MAIN',                       // Món mặn / món chính (thịt, cá kho, chiên, xào đậm)
  SOUP = 'SOUP',                       // Món canh
  SIDE = 'SIDE',                       // Món rau, đồ chua, món ăn kèm
  ONE_DISH_MEAL = 'ONE_DISH_MEAL',     // Món ăn thành bữa riêng (bún, phở, miến, cháo)
  DESSERT = 'DESSERT',                 // Món tráng miệng
  BEVERAGE = 'BEVERAGE',               // Đồ uống
}
```

### 2.3. Quy tắc Co giãn Khẩu phần (`ScalePolicy`)
```typescript
export enum ScalePolicy {
  LINEAR = 'LINEAR',                   // Co giãn theo tỷ lệ số khẩu phần (VD: 300g -> 600g)
  FIXED = 'FIXED',                     // Giữ nguyên bất kể khẩu phần (VD: 1 mẩu gừng đập dập, 1 củ hành nướng)
  MANUAL_ADJUST = 'MANUAL_ADJUST',     // Cần nêm nếm gia giảm theo khẩu vị (VD: ớt, tiêu, mắm muối)
}
```

### 2.4. Trạng thái Dữ liệu Dinh dưỡng (`NutritionDataStatus`)
*Enum độc lập hoàn toàn với trạng thái xuất bản:*
```typescript
export enum NutritionDataStatus {
  NO_DATA = 'NO_DATA',                 // Chưa có dữ liệu dinh dưỡng
  INCOMPLETE = 'INCOMPLETE',           // Thiếu một số nguyên liệu chưa có chỉ số
  ESTIMATED = 'ESTIMATED',             // Ước tính có nguồn dữ liệu tham chiếu
}
```

---

## 3. Quy tắc Nghiệp vụ Bất biến (Domain Invariants)

1. **Tách biệt Dish và Recipe**: Dish chỉ là khái niệm món; mỗi Recipe thuộc về tác giả cụ thể với cách thức nêm nếm và nguyên liệu riêng.
2. **Nguyên liệu có cấu trúc**: Không lưu nguyên liệu thành chuỗi gộp kiểu `"300g thịt ba chỉ thái mỏng"`. Phải tách thành:
   - `ingredientId`: ID của "Thịt ba chỉ heo"
   - `amount`: `300` (dạng số để tính toán)
   - `unit`: `"g"` (đơn vị chuẩn)
   - `preparationNote`: `"thái mỏng 0.5cm"`
   - `isOptional`: `false`
   - `scalePolicy`: `ScalePolicy.LINEAR`
3. **Tính bất biến của RecipeVersion đã xuất bản**:
   - Khi một RecipeVersion đã ở trạng thái `PUBLISHED`, không được cập nhật đè (no silent in-place editing).
   - Mọi thay đổi nội dung sẽ sinh ra một `Revision` mới ở trạng thái `DRAFT`. Bản `PUBLISHED` cũ vẫn phục vụ người dùng cho đến khi Revision mới được kiểm duyệt và thay thế.
4. **Quy tắc Đổi Khẩu phần (Serving Adjustment)**:
   - Lưu `baseServings` cố định (VD: 4 người).
   - Khi đổi sang `targetServings` (VD: 6 người), tỷ lệ scale $R = 6 / 4 = 1.5$.
   - Chỉ áp dụng $R$ cho dòng có `scalePolicy === LINEAR`. Dòng `FIXED` giữ nguyên; dòng `MANUAL_ADJUST` hiển thị kèm ghi chú nêm nếm.
   - Thời gian nấu, dụng cụ nấu và lượng nước hầm không mặc định nhân tuyến tính.
   - Làm tròn số lượng chỉ diễn ra ở tầng hiển thị UI; không lưu đè giá trị làm tròn vào state tính toán để tránh sai số lũy tiến.
5. **Quy tắc Gộp Nguyên liệu Đi chợ (Ingredient Aggregation)**:
   - Chỉ gộp khi thỏa mãn cả 3 điều kiện:
     1. Cùng `ingredientId`
     2. Cùng trạng thái (VD: cùng thịt tươi sống; không tự gộp thịt luộc sẵn với thịt sống)
     3. Đơn vị tương thích có thể quy đổi (VD: `g` và `kg`, `ml` và `l`). Các đơn vị định tính (1 mớ, 2 quả, 1 bó) không tự ý cộng vào số gam nếu chưa có hệ số chuyển đổi đã kiểm nghiệm.
   - Mỗi dòng gộp trên danh sách đi chợ phải truy vết ngược được về danh sách các công thức đóng góp.
6. **3 Nhãn Độc lập trên UI**:
   - `EDITORIAL_REVIEWED`: Đã được ban biên tập đọc và chuẩn hóa văn phong/bước.
   - `COOK_TESTED`: Đã có người thực tế nấu thử thành công theo định lượng này.
   - `NUTRITION_VERIFIED`: Đã có đối chiếu dữ liệu dinh dưỡng tin cậy.
   *(Không tự động gắn nhãn này khi chưa có bằng chứng xác thực).*
