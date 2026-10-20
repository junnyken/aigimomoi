# AG-23 Report — Shopping Checklist Persistence (Danh sách đi chợ tương tác & Lưu trạng thái)

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, sẵn sàng đóng ticket**.

---

## 1. Summary
Đã triển khai hoàn chỉnh trang Danh sách đi chợ thông minh (`Shopping Checklist Persistence`) tại route `/shopping`:
- **Đồng bộ tự động từ mâm cơm 3 món**: Tiếp nhận mâm cơm và khẩu phần từ URL query params (`/shopping?main=...&soup=...&side=...&servings=...`) hoặc fallback về mâm cơm mặc định từ DB.
- **Theo dõi tiến độ đi chợ (Progress Tracking)**: Thanh tiến độ trực quan hiển thị số món và tỷ lệ hoàn thành (`Đã mua X / Y món (Z%)`), đổi màu gradient xanh lá và hiển thị badge hoàn thành khi mua đủ 100%.
- **Trải nghiệm tương tác mượt mà & Touch Target $\ge 44\text{px}$**: Hàng nguyên liệu `ShoppingItemRow` hỗ trợ bấm cả hàng trên màn hình cảm ứng, hiển thị checkbox, định lượng gộp, đơn vị, và các nhãn truy vết nguồn gốc (món nào dùng bao nhiêu).
- **Phân loại quầy chợ khoa học**:
  - 🥩 Quầy Thịt, cá & thủy hải sản (`meatSeafood`).
  - 🥦 Quầy Rau củ & nông sản tươi (`produce`).
  - 📦 Nguyên liệu tươi khác (`other`).
  - 🧂 Gia vị & đồ khô bếp nhà (`seasoningItems`): Bảng kiểm tra nhanh kệ bếp (Pantry Check) cho các món `MANUAL_ADJUST`.
- **Lưu trạng thái check bền vững (Invariants §6.7)**:
  - Trạng thái các món đã tick được lưu tức thời vào `localStorage` (`angimom_shopping_checked_v1`), không bị mất khi reload, khóa màn hình điện thoại hay đổi app khi đang ở chợ.
  - Hỗ trợ nút "Đặt lại" để xóa toàn bộ checklist cho lần đi chợ tiếp theo.
- **Tiện ích sao chép danh sách đi chợ (Copy to Clipboard)**:
  - Một chạm sao chép danh sách đi chợ định dạng văn bản tiếng Việt chuẩn mực để gửi nhanh qua Zalo/tin nhắn cho người thân đi chợ hộ.

## 2. Invariants & Usability Verified
- **Invariants §5.4 (Định lượng & Traceability)**:
  - Kế thừa trọn vẹn từ AG-22: Định lượng gộp chính xác cùng đơn vị tính, bảo toàn số lượng món nêm nếm `MANUAL_ADJUST`.
- **Invariants §6.7 (Offline-friendly & Không bắt buộc đăng nhập)**:
  - Khách vãng lai sử dụng trọn vẹn 100% tính năng checklist đi chợ trên thiết bị mà không bị rào cản đăng nhập.
- **Trợ năng & Mobile-first**:
  - Hỗ trợ bàn phím (Space / Enter để toggle check), nhãn `aria-checked`, vùng chạm cảm ứng lớn.

## 3. Changed & Created Files
- `src/lib/shopping/shoppingClient.ts`: Hook `useShoppingChecklist()` quản lý trạng thái checked, lưu `localStorage`, đồng bộ đa tab và hàm xuất văn bản `generateShoppingPlainText()`.
- `src/components/shopping/ShoppingProgressBar.tsx`: Thanh tiến độ % đã mua kèm số lượng món.
- `src/components/shopping/ShoppingItemRow.tsx`: Dòng nguyên liệu tương tác có checkbox to, hiệu ứng gạch ngang khi đã tick và badges nguồn gốc.
- `src/components/shopping/ShoppingView.tsx`: Client view tích hợp toàn bộ tính năng đi chợ, bộ lọc quầy, sao chép văn bản, đặt lại và nút dẫn vào bếp nấu.
- `src/app/shopping/page.tsx`: Server Component trang đi chợ kết hợp Partial Prerendering và metadata SEO.
- `src/scripts/test_shopping_checklist.ts`: Kịch bản kiểm thử tự động toàn diện.

## 4. Test & Verification Results
- `npx tsx src/scripts/test_shopping_checklist.ts`: **22/22 PASS** (Khởi tạo danh sách, phân nhóm quầy, tiến độ %, check/uncheck, sao chép văn bản, đặt lại).
- `npx tsx src/scripts/test_ingredient_aggregation.ts`: **37/37 PASS** (Không hồi quy AG-22).
- `npx tsx src/scripts/test_meal_composition.ts`: **37/37 PASS** (Không hồi quy AG-21).
- `npx tsx src/scripts/test_saved_recipes.ts`: **25/25 PASS** (Không hồi quy AG-20).
- `npx tsx src/scripts/test_cooking_mode.ts`: **19/19 PASS** (Không hồi quy AG-19).
- `npx tsx src/scripts/test_serving_adjustment.ts`: **40/40 PASS** (Không hồi quy AG-18).
- `npx tsx src/scripts/test_search_filters.ts`: **36/36 PASS** (Không hồi quy AG-17).
- `npx tsc --noEmit -p .`: PASS 100% không có lỗi kiểu dữ liệu.
- `npm run build`: PASS 100% (32/32 routes biên dịch tối ưu).

## 5. Next Steps
Chuyển sang ticket tiếp theo trong Phase P3: **AG-24 (SEO & index boundaries)** — Chuẩn hóa Sitemap động (`/sitemap.xml`), file chỉ dẫn robots (`/robots.txt`), OpenGraph meta tags, canonical URL boundaries và JSON-LD structured data (Recipe schema) chuẩn Google Search Console.
