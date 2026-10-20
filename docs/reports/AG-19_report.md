# AG-19 Report — Cooking Mode (Chế độ nấu từng bước)

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, sẵn sàng đóng ticket**.

---

## 1. Summary
Chế độ nấu từng bước chuyên dụng (`Cooking Mode`) đã được triển khai hoàn tất tại route `/cong-thuc/[slug]/nau`. Giao diện tập trung toàn màn hình được thiết kế mobile-first tối ưu cho người đứng bếp: typography cỡ to (`text-xl sm:text-2xl`), độ tương phản cao, phím bấm lớn dễ thao tác, thanh tiến độ trực quan và hỗ trợ phím mũi tên bàn phím. Tích hợp bộ hẹn giờ nhà bếp `StepTimer` an toàn (không tự động nhảy bước khi hết giờ) và ngăn kéo tra cứu nguyên liệu nhanh `QuickIngredientsSheet` mà không làm mất vị trí bước đang nấu.

## 2. Invariants & Kitchen Safety Verified (§6.7)
- **Timer an toàn nhà bếp (Invariants §6.7)**: Khi bộ đếm ngược hết giờ (`remaining = 0`), đồng hồ chuyển trạng thái cảnh báo âm thanh và hiệu ứng thị giác nhưng **tuyệt đối không tự ý nhảy bước**. Người nấu tự quan sát độ chín thực tế và chủ động bấm "Bước tiếp theo".
- **Không mất vị trí nấu**: Ngăn kéo `QuickIngredientsSheet` cho phép người dùng mở xem nhanh định lượng nêm nếm gia vị bất kỳ lúc nào mà không làm reset lại bước đang nấu dở.
- **Kế thừa khẩu phần ăn đã co giãn (AG-18, §5.4)**: Danh sách nguyên liệu trong chế độ nấu hiển thị chính xác định lượng theo số người đã chọn (`?servings=X`).
- **Chỉ công thức `PUBLISHED` được mở chế độ nấu**: Các bản `DRAFT`, `SUBMITTED`, hoặc `ARCHIVED` bị từ chối truy cập và trả về 404 thật.
- **Không che khuất bước nấu**: Không đặt quảng cáo, animation rườm rà hay popup che khuất hướng dẫn nấu.

## 3. Changed & Created Files
- `src/components/cooking/StepTimer.tsx`: Bộ hẹn giờ đếm ngược an toàn với âm báo Web Audio API, nút Play/Pause/Reset.
- `src/components/cooking/QuickIngredientsSheet.tsx`: Drawer tra cứu nhanh bảng nguyên liệu có tính năng tick hoàn thành từng mục.
- `src/components/cooking/CookingModeView.tsx`: Client view toàn màn hình quản lý trạng thái bước nấu, phím tắt điều hướng, thanh tiến độ và modal chúc mừng nấu xong.
- `src/app/cong-thuc/[slug]/nau/page.tsx`: Server Component chế độ nấu với Partial Prerendering và placeholder build.
- `src/app/cong-thuc/[slug]/page.tsx`: Thêm nút CTA "Bắt đầu nấu món này" dẫn tới `/cong-thuc/[slug]/nau`.
- `src/scripts/test_cooking_mode.ts`: Kịch bản kiểm thử tự động toàn diện.

## 4. Test & Verification Results
- `npx tsx src/scripts/test_cooking_mode.ts`: **19/19 PASS** (Invariants PUBLISHED, thứ tự bước, timer seconds, mẹo nấu, tích hợp khẩu phần AG-18, bounds checking).
- `npx tsx src/scripts/test_serving_adjustment.ts`: **40/40 PASS** (Không hồi quy AG-18).
- `npx tsx src/scripts/test_search_filters.ts`: **36/36 PASS** (Không hồi quy AG-17).
- `npx tsx src/scripts/test_public_rendering.ts`: **31/31 PASS** (Không hồi quy AG-16).
- `npx tsc --noEmit -p .`: PASS 100% không có lỗi TypeScript.
- `npm run build`: PASS 100% (23/23 routes biên dịch thành công).

## 5. Next Steps
Chuyển sang ticket tiếp theo trong Phase P3: **AG-20 (Saved recipes)** — Lưu trữ công thức yêu thích riêng tư của người dùng (Saved recipes) liên kết với danh tính người dùng (`AG-11`).
