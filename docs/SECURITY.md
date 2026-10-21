# SECURITY

**Trạng thái: `proposed`** — nguyên tắc từ master plan §11; cơ chế cụ thể chốt tại AG-02/AG-11/AG-14/AG-25.

## Quyền
| Vai trò | Quyền |
|---|---|
| Guest | Đọc nội dung published; luồng guest đã chốt |
| Member | Quản lý saved/meal/checklist của chính mình |
| Editor/Admin | Biên soạn/duyệt theo contract |

- Không dựa vào ẩn nút để bảo vệ API.
- Kiểm cả resource owner và action; test request truy cập dữ liệu user khác.
- Nếu Supabase: kiểm RLS + storage policies. Nếu PostgreSQL tự quản: authorization phía server, DB user hạn chế quyền. Hai cơ chế không giống nhau.

## Ảnh và nội dung
- Giới hạn file type/dung lượng, xác minh nội dung file thật, xử lý tên/path.
- Ảnh nháp không public; chỉ media published được public.
- Rich text sanitize; không render script từ user/AI.
- Lưu nguồn, quyền, quy trình gỡ nội dung bị báo cáo.

## Môi trường và secrets
- Local/staging/production tách cấu hình và dữ liệu.
- Tên biến duy nhất cho session authentication là `AUTH_SECRET`. Tuyệt đối không có fallback secret trong runtime hoặc docker-compose (Zero-Fallback policy, D58).
- Mọi môi trường (kể cả local dev) phải tự sinh khóa ngẫu nhiên mật mã tối thiểu 32 ký tự vào tệp môi trường được gitignore (`.env`); cấm sử dụng các chuỗi mẫu hay placeholder mặc định.
- Khi cấu hình secret thiếu hoặc không hợp lệ, hệ thống phải fail-closed (từ chối ký/xác thực phiên) và phản ánh trạng thái `unhealthy` (HTTP 503) trên endpoint `/api/health` readiness probe.
- Tách bạch Build-time và Runtime: Lệnh build Docker image tuyệt đối không yêu cầu production secret.
- Secrets không commit, không đưa vào tài liệu/report (`.gitignore` đã chặn `.env*`).
- Không cần và không gửi mật khẩu, SSH private key, API key trong hội thoại.
- Migration có review, backup/rollback; destructive migration, DNS/firewall cần plan và duyệt riêng.
- Không overwrite dịch vụ đang chạy trên VPS. Production deploy xin duyệt riêng.

## Quan sát và backup
- Error tracking, structured logs, health checks; không log mật khẩu/token/secrets.
- Audit actions: xuất bản, ẩn, duyệt, đổi quyền, thay nội dung quan trọng.
- Backup chỉ được coi healthy khi đã kiểm restore. RPO/RTO: `unknown`, chốt theo hạ tầng.

## AI (P4)
API key server-side; rate limit; token/retry caps; budget alerts; tách nội dung user/external khỏi instructions; AI không có quyền publish.
