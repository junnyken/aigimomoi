# API

**Trạng thái: N/A — chưa có endpoint nào.**

Contract API được định nghĩa từ AG-09 trở đi, theo từng MINI-SPEC. Mỗi endpoint ghi: method, path, quyền (guest/member/editor/admin), payload, response, lỗi, MINI-SPEC tạo ra.

Nguyên tắc định hướng (`proposed`, master plan §11.1):
- Kiểm quyền phía server cho cả resource owner và action; không dựa vào ẩn nút.
- Chỉ trả nội dung `published` cho guest.
- Secrets (kể cả AI key) chỉ phía server.
