# DECISIONS

Nguồn ưu tiên cao nhất khi có xung đột (master plan §0). Chỉ ghi `approved` khi chủ sản phẩm đã chốt.

## Đã chốt (`approved`) — nguồn: master plan §1.1

| ID | Nội dung | Hệ quả |
|---|---|---|
| D01 | Chưa có code/dự án | Bắt đầu bằng workspace audit và bootstrap |
| D02 | Người dùng chính là người nấu cơm gia đình | Luồng bữa cơm là trung tâm |
| D03 | MVP theo lựa chọn B | Tìm món, công thức, khẩu phần, chế độ nấu, lưu món, thực đơn, đi chợ |
| D04 | Quản trị đăng trước, cộng đồng mở sau | Tái sử dụng editor |
| D05 | Chưa có nội dung | Content pipeline là workstream bắt buộc |
| D06 | AI gợi ý từ kho đã duyệt và hỗ trợ soạn nháp | Hai capability riêng; không tự xuất bản nội dung AI |
| D07 | Đã có hạ tầng/tài khoản muốn tận dụng | Audit trước, không mặc định mua thêm |
| D08 | Tên ĂN GÌ MOM; chưa có logo | Wordmark tạm, chờ duyệt |
| D09 | Kem nhạt + xanh lá, bếp gia đình pha trẻ trung | Sáng, ấm, thoáng, mobile-first |
| D10 | Tiếng Việt ban đầu | Chưa đa ngôn ngữ |
| D11 | Làm một mình cùng Antigravity | Giới hạn công việc song song |
| D12 | Dùng thử khi hoàn thiện | **Diễn giải `proposed`**: = qua release gate P3, chưa chốt |
| D13 | Xin duyệt sau từng MINI-SPEC | Không chạy roadmap tự động |

## Quyết định trong AG-00 (`approved` ngày 20/10/2026)

| ID | Nội dung |
|---|---|
| D14 | Dự án dùng repo Git riêng tại `projects/angimom/`, tách khỏi repo cha workspace; chỉ commit cục bộ, không remote/push khi chưa duyệt |
| D15 | Skill dự án đặt tại `.agents/skills/` (theo master plan §14) |
| D16 | Ba file nguồn gốc giữ nguyên ở thư mục gốc; docs/skill dùng bản sao nguyên văn |

## Còn mở (`unknown`)

| # | Vấn đề | Quyết định tại |
|---|---|---|
| O1 | Domain, VPS, dịch vụ đang chạy, DB/storage/email | AG-01 |
| O2 | Có dùng Coolify/`mb-deploy` (Mắt Bão Cloud IDE) làm hosting không | AG-01/02 |
| O3 | Ngân sách vận hành/tháng | AG-02 |
| O4 | Nhà cung cấp AI/model và budget | Trước P4 |
| O5 | Người kiểm/nấu thử công thức | AG-03 |
| O6 | Nghĩa của “ăn theo thì” | P7 |
| O7 | Nút chọn món không cần AI trong discovery | AG-05 |
| O8 | Xác nhận diễn giải D12 | Duyệt phạm vi MVP |
| O9 | Tagline “Bữa cơm nhà, bớt nghĩ hôm nay ăn gì.” và wordmark tạm | AG-04 |
| O10 | Số lượng công thức Batch 0/1/2 | AG-03 |
