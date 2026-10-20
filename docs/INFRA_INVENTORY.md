# INFRA INVENTORY

Cập nhật: AG-01, 20/10/2026. Audit **chỉ đọc**, không in secrets.

Nhãn evidence: `verified` (agent kiểm bằng lệnh/tài liệu) · `declared` (chủ sản phẩm khai báo, chưa kiểm) · `unknown` (chưa có thông tin).

## Hướng chủ sản phẩm chọn
- **S2 — VPS/domain riêng là nền chính** cho ĂN GÌ MOM — `declared` (D17). Chi tiết chủ sản phẩm sẽ bổ sung sau.
- S1 — Mắt Bão Cloud IDE/Coolify: là **môi trường phát triển** hiện tại; có thể dùng xem thử nội bộ. Vai trò cuối cùng chốt ở AG-02.

## S2 — VPS / domain riêng (nền chính)
| Hạng mục | Giá trị | Nhãn | Nguồn |
|---|---|---|---|
| Domain dùng cho dự án | — | `unknown` | Chờ chủ sản phẩm |
| DNS provider | — | `unknown` | Chờ chủ sản phẩm |
| Nhà cung cấp VPS | — | `unknown` | Chờ chủ sản phẩm |
| CPU / RAM / disk còn trống | — | `unknown` | Chờ chủ sản phẩm hoặc SSH read-only |
| OS, runtime | — | `unknown` | — |
| Dịch vụ khác đang chạy chung | — | `unknown` | — |
| Reverse proxy / TLS / firewall | — | `unknown` | — |
| Container / process manager | — | `unknown` | — |
| Database | — | `unknown` | — |
| Storage ảnh | — | `unknown` | — |
| Email gửi đi | — | `unknown` | — |
| Log / monitoring | — | `unknown` | — |
| Backup hiện có | — | `unknown` | — |
| Staging | — | `unknown` | — |
| Cập nhật / rollback / khôi phục | — | `unknown` | — |

## S1 — Mắt Bão Cloud IDE + Coolify (môi trường dev)
| Hạng mục | Giá trị | Nhãn | Nguồn |
|---|---|---|---|
| Máy workspace | Ubuntu 24.04.5 LTS, kernel 5.15, x86_64, 12 CPU | `verified` | `uname`, `/etc/os-release`, `nproc` |
| RAM | 62 GiB, ~40 GiB khả dụng (máy dùng chung) | `verified` | `free -h` |
| Disk `/home/coder` | 485G, **đã dùng 89%, còn 55G** | `verified` | `df -h` |
| Runtime | Node 22.23.2, npm 10.9.8, git 2.43; Python 3.12, Go 1.25 theo CLAUDE.md | `verified` / `declared` | lệnh `-v`; CLAUDE.md |
| Container | Docker 29.1.3 (DinD); không có container đang chạy | `verified` | `docker version`, `docker ps` |
| Deploy CLI | `mb-deploy`: preview, create, redeploy, allow-ip, set-scope, status, logs, info | `verified` | `mb-deploy --help` |
| Hosting app | Coolify (qua `mb-deploy create`) | `declared` | CLAUDE.md |
| Domain | `<project>.<team>.dev.matbao.ai` | `declared` | CLAUDE.md |
| Phạm vi truy cập | Mặc định **chỉ IP Mắt Bão (tòa nhà + VPN)**; `allow-ip` thêm IP; public cần `set-scope public` + lý do + manager duyệt | `verified` | `mb-deploy --help` |
| Source hosting | GitLab (theo quy trình mẫu); chưa có remote cho angimom | `declared` | CLAUDE.md |
| CLI DB/hosting khác | Không có psql, pg_dump, supabase, vercel, gh, glab; có ssh | `verified` | `command -v` |
| Database / storage / email / backup / monitoring | — | `unknown` | Không có tài liệu trong workspace |

## Hệ quả cần mang sang AG-02 (ghi nhận, không phải quyết định)
1. Thiếu toàn bộ thông tin S2 → AG-02 **chưa chốt được lớp hosting/DB/storage/email/backup**. Lớp ứng dụng (framework, UI, test) không phụ thuộc hạ tầng nên vẫn chốt được.
2. Nếu dùng S1 để xem thử: điện thoại ngoài mạng Mắt Bão không vào được nếu chưa `allow-ip` hoặc được duyệt public → ảnh hưởng bước dùng thử trên điện thoại (master plan §12.4).
3. Disk workspace còn 55G (89%) → không nên giữ DB/ảnh lớn ở local dev lâu dài.
