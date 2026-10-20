# AG-01 Report — Existing Infrastructure Inventory

Theo Mini-Spec Playbook §7. Trạng thái: **hoàn tất một phần, chờ chủ sản phẩm duyệt đóng**. Phần S2 (VPS/domain riêng) bị chặn vì thiếu thông tin.

## 1. Summary
Đã kiểm kê hạ tầng bằng lệnh chỉ đọc. S1 (Mắt Bão Cloud IDE + Coolify) đã kiểm và ghi evidence. Chủ sản phẩm chốt VPS/domain riêng là nền chính (D17), nhưng chưa cung cấp chi tiết → toàn bộ S2 là `unknown`. Không có thay đổi nào trên hạ tầng.

## 2. Audit Before Build
Xem [mini-specs/AG-01.md](../mini-specs/AG-01.md) §5. Gap chính: S2 chưa có thông tin; Coolify mặc định chặn truy cập từ ngoài mạng Mắt Bão; disk dev còn 55G (89%).

## 3. Design Choice
Một bảng cho hai nguồn, mỗi dòng có nhãn `verified`/`declared`/`unknown` và nguồn evidence. Không đưa ra khuyến nghị kiến trúc (để AG-02).

## 4. Changed Files
- Code / migration: không có.
- Docs: `INFRA_INVENTORY.md` (viết lại theo nhãn evidence), `DECISIONS.md` (D17, D18; O1/O2 thu hẹp), `TEST_LOG.md`, `COST_LOG.md`, `ROADMAP.md`, `reports/AG-01_report.md`.

## 5. New API/DB/State
Không có API/DB. State tài liệu mới: nhãn evidence `verified` / `declared` / `unknown`.

## 6. Tests
- App tests: N/A.
- Mỗi dòng inventory có nhãn và nguồn: PASS.
- Secret scan docs: PASS.
- Lệnh đã chạy đều chỉ đọc: `uname`, `/etc/os-release`, `nproc`, `free`, `df`, `command -v`, `mb-deploy --help`, `docker version`, `docker ps`. Không chạy `mb-deploy` create/redeploy/allow-ip/set-scope/preview: PASS.

## 7. Live Verification
Không áp dụng (chỉ kiểm kê). Chưa SSH vào VPS nào.

## 8. Remaining Limits / Follow-ups
- **S2 blocked:** cần chủ sản phẩm cung cấp: domain, DNS provider, nhà cung cấp VPS và cấu hình (CPU/RAM/disk), OS, các dịch vụ đang chạy trên VPS, có sẵn DB/storage/email/backup chưa. Không gửi mật khẩu/key.
- Khi có thông tin: cập nhật INFRA_INVENTORY (nhãn `declared`; lên `verified` nếu có SSH read-only).
- Bước tiếp theo không phụ thuộc hạ tầng (theo D18):
  - **AG-03 Content operations plan** (phụ thuộc AG-00).
  - **AG-02 phần lớp ứng dụng** (framework/UI/test/domain contract); lớp hosting/DB/storage để `blocked` đến khi có S2.
