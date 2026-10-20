# BÁO CÁO NGHIỆM THU: AG-39, AG-40, AG-41 — Phase P7

- **Giai đoạn**: Phase P7 (Mở rộng catalog và thực đơn)
- **Mã tính năng**: AG-39 (Expanded Catalog), AG-40 (Pantry Inventory), AG-41 (Weekly Meal Planner)
- **Ngày hoàn thành**: 21/10/2026
- **Trạng thái**: **ACCEPTED & CLOSED** (Gate P7 PASSED)

---

## 1. TỔNG QUAN NĂNG LỰC ĐÃ TRIỂN KHAI

### AG-39: Mở rộng thể loại món ăn (Catalog Expansion)
- Thêm các thể loại ẩm thực đặc sắc vào từ điển `taxonomies`:
  - `an-chay-thuan`: Ăn chay thuần (Vegan)
  - `an-chay-thanh-tinh`: Ăn chay thanh tịnh (Ovo-lacto)
  - `mon-nuoc-an-sang`: Món nước ăn sáng/trưa
  - `trang-mieng-giai-nhiet`: Tráng miệng giải nhiệt
- Nạp 5 công thức mẫu đạt chuẩn vị Việt:
  1. **Phở bò Hà Nội truyền thống**: vai trò `ONE_DISH_MEAL` (Món nước ăn trọn bữa, nước dùng ngọt thanh từ xương bò).
  2. **Bún bò Huế chuẩn vị cố đô**: vai trò `ONE_DISH_MEAL` (Nước dùng sa tế sả mắm ruốc).
  3. **Đậu hũ sốt cà chua chay**: vai trò `MAIN`, gắn thẻ `an-chay-thuan` (Vegan).
  4. **Chè bưởi An Giang giòn sần sật**: vai trò `DESSERT` (Món tráng miệng truyền thống).
  5. **Nước sâm bí đao lá dứa hạt chia**: vai trò `BEVERAGE` (Đồ uống giải nhiệt).

### AG-40: Quản lý Kho Thực phẩm & Tủ lạnh Gia đình (Pantry)
- **Schema & Migration**: Migration `0010_ag39_40_41_p7_catalog_pantry_planner.sql` tạo enum `storage_location` (`FRIDGE`, `FREEZER`, `DRY_PANTRY`) và bảng `pantry_items`.
- **API Backend**:
  - `GET /api/pantry`: Liệt kê thực phẩm kèm cờ cảnh báo `isExpiringSoon` ($\le$ 3 ngày) và `isExpired`.
  - `POST /api/pantry`: Thêm thực phẩm vào ngăn mát/ngăn đông/kho khô.
  - `PUT /api/pantry/[id]`: Cập nhật số lượng và hạn dùng.
  - `DELETE /api/pantry/[id]`: Xóa thực phẩm khỏi tủ lạnh (Privacy Gate: User B không thể xóa đồ của User A).
  - `POST /api/pantry/sync-from-shopping`: Chuyển 1-chạm nguyên liệu từ Giỏ hàng sang Tủ lạnh theo vị trí bảo quản thông minh.
  - `GET /api/recipes/[id]/pantry-check`: Đối chiếu nguyên liệu công thức với kho nhà, trả về tỷ lệ bao phủ (% coverage) và danh sách cần mua thêm.
- **Frontend**:
  - Trang `/tu-lanh`: Giao diện trực quan 3 ngăn, banner cảnh báo cận hạn, modal thêm nhanh, thao tác tăng giảm số lượng.
  - Component `PantryCheckWidget`: Hiển thị ngay trên trang chi tiết công thức `/cong-thuc/[slug]`, báo cho người nấu biết nhà đã có sẵn nguyên liệu nào.

### AG-41: Lập Kế Hoạch Bữa Cơm Tuần (Weekly Meal Planner)
- **Schema & Migration**: Bảng `meal_plans` (`planDate`, `dayOfWeek`, `mealType`, `recipeId`, `customDishName`, `servings`, `isCompleted`).
- **API Backend**:
  - `GET /api/meal-plans?weekStart=YYYY-MM-DD`: Lấy thực đơn 7 ngày trong tuần.
  - `POST /api/meal-plans`: Thêm món vào kế hoạch một ngày cụ thể (Bữa sáng/trưa/tối).
  - `PUT /api/meal-plans/[id]`: Đổi khẩu phần hoặc đánh dấu hoàn thành.
  - `DELETE /api/meal-plans/[id]`: Xóa món khỏi kế hoạch.
  - `POST /api/meal-plans/to-shopping`: Tổng hợp nguyên liệu của cả tuần đưa vào Giỏ đi chợ (hỗ trợ cờ `excludePantry: true` loại trừ món đã có sẵn trong tủ lạnh).
  - `POST /api/meal-plans/[id]/log-to-diary`: Nấu xong, 1-chạm ghi ngay vào Nhật ký dinh dưỡng gia đình (`meal_diary_entries`).
- **Frontend**:
  - Trang `/ke-hoach-tuan`: Lịch 7 ngày trực quan, phân chia 3 bữa, nút "+ Thêm món", nút nấu xong, nút "🛒 Tổng hợp giỏ đi chợ tuần".

---

## 2. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

- Bộ kiểm thử: `src/scripts/test_p7_catalog_pantry_planner.ts`
- **Kết quả: 36/36 tests PASS (100%)**
  - Mở rộng catalog AG-39: 8 tests PASS
  - Tủ lạnh gia đình AG-40: 13 tests PASS
  - Kế hoạch tuần AG-41: 15 tests PASS

---

## 3. TIÊU CHÍ GATE P7

| Tiêu chí Gate P7 | Kết quả | Ghi chú |
|---|:---:|---|
| Không phá vỡ taxonomy và engine hiện có | ĐẠT | Món nước dùng `ONE_DISH_MEAL`, món chay dùng thẻ `an-chay-thuan`, tráng miệng dùng `DESSERT`. |
| Phân quyền sở hữu dữ liệu kho (Privacy Gate) | ĐẠT | User B bị chặn 404 khi cố tình thao tác vào kho hoặc kế hoạch của User A. |
| Đối chiếu tủ lạnh thông minh | ĐẠT | Khớp theo `ingredientId` và tên nguyên liệu không phân biệt hoa thường. |
| Đồng bộ liên thông Giỏ hàng ↔ Tủ lạnh ↔ Kế hoạch ↔ Nhật ký | ĐẠT | 1-chạm xuất giỏ chợ tuần và 1-chạm ghi nhật ký dinh dưỡng không tạo sai lệch calo. |
| Next.js 16 Build | ĐẠT | Toàn bộ 55 routes biên dịch thành công 100%. |

**KẾT LUẬN: GATE P7 ĐÃ ĐẠT (M7 MỞ RỘNG CATALOG, TỦ LẠNH VÀ KẾ HOẠCH TUẦN).**
