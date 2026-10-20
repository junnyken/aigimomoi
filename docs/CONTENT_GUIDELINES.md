# CONTENT GUIDELINES

**Trạng thái: `proposed`** — chốt tại AG-03. Nguồn: master plan §8.

## Trách nhiệm
- Chủ sản phẩm: người duyệt cuối.
- Người kiểm/nấu thử: `unknown` (O5). Không ghi “đã được chuyên gia kiểm” khi chưa có người và evidence.
- Antigravity: hỗ trợ form, nhập liệu có cấu trúc, kiểm thiếu; **không** thay thế xác nhận công thức thực tế, **không** sinh công thức để lấp chỗ trống.

## Quy trình
Chọn danh sách món → chọn nguồn hợp lệ → biên soạn → chuẩn hóa nguyên liệu → kiểm định lượng/bước → nấu thử hoặc kiểm theo quy trình duyệt → ảnh có quyền → biên tập → publish.

Nguồn hợp lệ: công thức gia đình, nội dung tự làm, cộng tác được phép. Không scrape/copy hàng loạt rồi đổi chữ.

## Batch — số lượng `proposed` (O10)
- Batch 0: 6–10 công thức thật để thử schema/UI.
- Batch 1: ~30 (15 món mặn, 8 canh, 7 rau/món phụ).
- Batch 2: đến 50, không bắt buộc cho dùng thử.

Chưa đủ nguồn → báo `content-blocked`; không bù bằng data giả.

## Checklist mỗi công thức
- [ ] Tên, aliases, nhóm món, vai trò trong bữa
- [ ] Tác giả/nguồn và quyền sử dụng
- [ ] Khẩu phần mặc định và ý nghĩa khẩu phần
- [ ] Nguyên liệu, lượng, đơn vị, optional/substitution
- [ ] Giai đoạn, bước, lửa/thời gian khi có căn cứ, dấu hiệu hoàn thành
- [ ] Dụng cụ và ghi chú đổi khẩu phần
- [ ] Ảnh đúng món, có quyền, có alt text
- [ ] Trạng thái biên tập/nấu thử và evidence riêng
- [ ] Dinh dưỡng chỉ hiện khi có nguồn và công thức tính đã kiểm

## Không trộn data
Fixture/design seed có tag môi trường, không lên production. Release checklist kiểm không lọt tác giả/review/counter giả.
