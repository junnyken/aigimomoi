# Báo Cáo Nghiệm Thu AG-33 — Dish Variants, Kitchen Stories & Source Attribution

| Thông tin | Giá trị |
|---|---|
| Mã công việc | **AG-33** |
| Phân hệ | P5 — Cộng đồng và Văn hóa Món ăn |
| Ngày hoàn thành | 21/10/2026 |
| Trạng thái | **ACCEPTED & CLOSED** |
| Bộ kiểm thử | `src/scripts/test_dish_variants_stories.ts` (15/15 PASS, 100%) |

---

## 1. Mục tiêu Đã Đạt Được
- **Lưu trữ văn hóa ẩm thực vùng miền**: Bổ sung trường `region` ('NORTH', 'CENTRAL', 'SOUTH', 'GENERAL') cho từng công thức, tôn vinh sự đa dạng khẩu vị và phong cách nêm nếm đặc trưng Bắc - Trung - Nam.
- **Ký ức & Câu chuyện bếp nhà (Kitchen Story)**: Người nấu có thể chia sẻ câu chuyện tuổi thơ, kỷ niệm sum vầy bên mâm cơm gia đình, mẹo nhỏ gia truyền qua trường `kitchenStory` và trích dẫn nguồn gốc (`sourceAttribution`).
- **Liên kết biến thể món ăn (`variantOfId`)**: Tự động kết nối hai chiều giữa công thức gốc và các biến thể địa phương của cùng một món ăn (ví dụ Thịt kho hột vịt Nam Bộ và Thịt kho tiêu Bắc Bộ).
- **Giao diện trực quan, giàu cảm xúc**:
  - Component `KitchenStorySection`: Trình bày câu chuyện gia đình với phong cách typography ấm cúng, tinh tế, trang nhã.
  - Component `RegionalVariants`: Cho phép độc giả khám phá và chuyển đổi nhanh giữa các phiên bản vùng miền khác nhau của món ăn.
  - Tích hợp vào form đóng góp công thức Bếp Nhà `/contribute/new` và `/contribute/[id]`.

---

## 2. Invariants Gate P5 Đã Xác Minh & Bảo Toàn
1. **Catalog Integrity (Invariants §5.1)**: Khi người đọc xem công thức món ăn, danh sách `variants` gợi ý CHỈ hiển thị các biến thể ở trạng thái `PUBLISHED`. Các bản thảo `DRAFT` hoặc `NEEDS_CHANGES` của tác giả khác tuyệt đối không bị rò rỉ.
2. **Attribution Transparency**: Ghi nhận minh bạch cội nguồn công thức, người chỉ dạy (bà ngoại, mẹ, bạn bè) và câu chuyện gia đình.
3. **Structured Recipe Invariant (§5.4)**: Mỗi biến thể vẫn là một recipe chuẩn cấu trúc với định lượng nguyên liệu, đơn vị đo, `scalePolicy` và các bước nấu hoàn chỉnh.

---

## 3. Kết Quả Kiểm Thử Tự Động (`src/scripts/test_dish_variants_stories.ts`)
| STT | Kịch bản kiểm thử | Kết quả |
|---|---|---|
| 1 | Truy vấn món gốc qua `queryPublishedRecipeBySlug`, kiểm tra đầy đủ `region`, `kitchenStory`, `sourceAttribution` | ✓ PASS |
| 2 | Invariants §5.1: Danh sách biến thể liên kết lọc sạch 100% bản DRAFT miền Trung | ✓ PASS |
| 3 | Truy vấn biến thể miền Bắc: Xác nhận liên kết ngược hai chiều về món gốc Nam Bộ | ✓ PASS |
| 4 | Contributor đóng góp công thức có kèm câu chuyện bếp nhà qua API `/api/contribute/recipes` | ✓ PASS |

**Tổng kết**: 15/15 assertions PASS (100%). TypeScript build sạch (`npx tsc --noEmit` code 0), Next.js production build (`npm run build`) thành công 43/43 routes (code 0).
