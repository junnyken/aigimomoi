# AG-03 Report — Content Operations Plan & Editorial Gate

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, chờ chủ sản phẩm duyệt đóng**.

---

## 1. Summary
Đã hoàn thành kế hoạch vận hành nội dung, tiêu chuẩn biên soạn công thức chuẩn hóa, quy trình kiểm nghiệm nấu thử và quy mô phát hành công thức cho dự án ĂN GÌ MOM. Khóa danh mục món kinh điển cho **Batch 0** (7 món đại diện cho 3 nhóm mặn/canh/rau để làm dữ liệu dựng prototype UI trong Phase P1) và lộ trình **Batch 1** (30 món cơm nhà cho bản phát hành MVP). Chính thức hoàn thành tất cả các mục tiêu của **Gate P0 (Nền móng)**.

## 2. Audit Before Build
- Xem chi tiết tại [mini-specs/AG-03.md](../mini-specs/AG-03.md) §5.
- Gap đã xác nhận: Trước đó dự án chưa có nội dung (D05); chưa có cấu trúc phân rã công thức chuẩn hóa mẫu để hướng dẫn nhập liệu; câu hỏi O5 và O10 còn mở.

## 3. Design Choice
- **Quy mô Batch 0**: Chọn 7 món cơm nhà Việt kinh điển cân bằng hoàn hảo giữa 3 nhóm: Món mặn (Thịt kho tiêu, Gà rang gừng, Cá basa kho tộ), Món canh (Canh rau ngót thịt băm, Canh chua cá lóc), Món rau/phụ (Rau muống xào tỏi, Đậu hũ sốt cà chua).
- **Quy trình biên tập 5 bước**: Tiếp nhận nguồn $\rightarrow$ Cấu trúc hóa định lượng $\rightarrow$ Biên soạn bước nấu rõ lửa & dấu hiệu $\rightarrow$ Thẩm định/Nấu thử $\rightarrow$ Duyệt xuất bản.
- **Tiêu chuẩn dữ liệu**: Cung cấp mẫu JSON Schema chuẩn hóa cho công thức món ăn, tương thích 100% với Domain Invariants trong `DATA_MODEL.md`.
- **Chính sách trung thực & bản quyền**: Nghiêm cấm cào dữ liệu lậu hoặc dùng AI tự động bịa công thức; gắn cờ `[DEMO_FIXTURE]` cho mọi dữ liệu thử nghiệm.

## 4. Changed Files
- `docs/CONTENT_GUIDELINES.md`: Cập nhật chi tiết 5 bước quy trình, danh sách Batch 0/1, checklist 9 tiêu chí và mẫu JSON schema công thức.
- `docs/DECISIONS.md`: Bổ sung D22 (Kế hoạch các đợt nội dung), D23 (Quy trình thẩm định); giải quyết O5, O10.
- `docs/ROADMAP.md`: Cập nhật AG-03 thành `awaiting-close`.
- `docs/TEST_LOG.md`: Ghi nhận kết quả kiểm thử AG-03.
- `docs/mini-specs/AG-03.md`: Cập nhật trạng thái phê duyệt.
- `docs/reports/AG-03_report.md`: Báo cáo này.

## 5. New API/DB/State
- Không tạo runtime code hay DB table.
- Thêm hợp đồng cấu trúc Recipe JSON Schema cho dữ liệu hạt giống (seed data).

## 6. Tests
- **App Tests**: N/A (chưa có app runtime).
- **Consistency Verification**:
  - Danh mục Batch 0 bao phủ đầy đủ 3 vai trò: `MAIN`, `SOUP`, `SIDE`.
  - Mẫu JSON schema tuân thủ chính xác các enum `MealRole`, `ScalePolicy` từ `DATA_MODEL.md`.
  - Checklist 9 tiêu chí bao hàm toàn bộ yêu cầu trong Master Plan §8.4.
  - Secret scan: 0 secret phát hiện.

## 7. Live Verification
N/A (tài liệu quy trình vận hành).

## 8. Remaining Limits / Follow-ups
- Khi bước vào Phase P1 (UX/UI & Prototype), dữ liệu Batch 0 sẽ được đưa vào làm fixtures để kiểm thử các màn hình tương tác.
- **GATE P0 HOÀN TẤT**: Toàn bộ 4 năng lực nền móng (AG-00, AG-01, AG-02, AG-03) đã sẵn sàng. Bước tiếp theo là bước sang **Phase P1 — UX/UI và prototype**, bắt đầu bằng **AG-04 (Design tokens & primitives)**.
