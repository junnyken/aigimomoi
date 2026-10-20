# INFRA INVENTORY

**Trạng thái: `unknown`** — điền tại AG-01 bằng audit read-only. Không in secrets.

| Hạng mục | Giá trị | Trạng thái | Nguồn evidence |
|---|---|---|---|
| Domain dùng cho dự án | — | `unknown` | — |
| DNS provider | — | `unknown` | — |
| VPS: CPU/RAM/disk còn trống | — | `unknown` | — |
| VPS: OS, runtime | — | `unknown` | — |
| Dịch vụ khác đang chạy chung | — | `unknown` | — |
| Reverse proxy / TLS / firewall | — | `unknown` | — |
| Container / process manager | — | `unknown` | — |
| Database | — | `unknown` | — |
| Storage ảnh | — | `unknown` | — |
| Email | — | `unknown` | — |
| Log / monitoring | — | `unknown` | — |
| Backup hiện có | — | `unknown` | — |
| Staging | — | `unknown` | — |
| Cập nhật / rollback / khôi phục | — | `unknown` | — |

## Quan sát từ AG-00 (môi trường phát triển, không phải production)
- Workspace là Mắt Bão Cloud IDE; có CLI `mb-deploy` → Coolify, domain mẫu `<project>.<team>.dev.matbao.ai` (nguồn: `/home/coder/workspace/CLAUDE.md`).
- Có Docker (DinD), Node 22, Python 3.12, Go 1.25.
- Chưa xác minh đây có phải hạ tầng chủ sản phẩm muốn dùng (O2).
