# AG-25 Report — Staging Deploy & Observability (Triển khai staging độc lập, Giám sát hệ thống & Logging an toàn)

Theo Mini-Spec Playbook §7. Trạng thái: **Hoàn tất, sẵn sàng đóng ticket**.

---

## 1. Summary
Đã hoàn thành chuẩn hóa toàn diện hạ tầng triển khai độc lập (VPS containerization) và cơ chế giám sát/logging an toàn cho ứng dụng Ăn Gì Mom:
- **Giám sát sức khỏe hệ thống (`src/app/api/health/route.ts`)**:
  - Cung cấp endpoint liveness/readiness probe tại `GET /api/health`.
  - Kiểm tra kết nối cơ sở dữ liệu thời gian thực (`SELECT 1`).
  - Phản hồi HTTP 200 OK (`healthy`, `database: connected`, `uptimeSeconds`, `version: 0.1.0`) kèm header `Cache-Control: no-store`.
  - Phản hồi HTTP 503 Service Unavailable khi mất kết nối DB; tuyệt đối không rò rỉ stack trace nội bộ hay credentials.
- **Hệ thống Structured Logging & Khử nhạy cảm (`src/lib/logger.ts`)**:
  - Tuân thủ nghiêm ngặt **Invariant "Log không lộ secrets"** (Master Plan AG-25).
  - Thuật toán `redactSensitiveData()` đệ quy tự động quét và che giấu các trường nhạy cảm: `password`, `token`, `secret`, `jwt`, `cookie`, `database_url`, `authorization` thành `[REDACTED]`.
  - Che giấu mật khẩu trong PostgreSQL connection strings (`postgres://user:[REDACTED]@host...`).
  - Xuất log định dạng JSON trong môi trường production (`NODE_ENV === 'production'`) tương thích hoàn hảo với các hệ thống log collector.
- **Điều phối Container hóa (`docker-compose.yml`, `Dockerfile`, `Caddyfile`)**:
  - Cấu hình healthcheck probe cho service `web` kiểm tra `http://localhost:3000/api/health` chu kỳ 15s.
  - Cấu hình service `caddy` phụ thuộc `web: condition: service_healthy` để chỉ chuyển tiếp lưu lượng người dùng khi backend đã thực sự sẵn sàng.
  - Đảm bảo 100% dữ liệu database (`pgdata`) và ảnh media tải lên (`uploads_data`) được lưu bền vững qua Docker Named Volumes trên VPS (D20, D34).

## 2. Invariants & Usability Verified
- **Invariant "Log không lộ secrets"**:
  - Kiểm thử tự động chứng minh mật khẩu người dùng, JWT token, Authorization Bearer, và URL PostgreSQL chứa mật khẩu đều bị che giấu 100% trước khi ghi log.
- **Invariant "Bảo mật phản hồi Healthcheck"**:
  - Payload của `/api/health` không bao giờ chứa thông tin cấu hình nhạy cảm hay số cổng nội bộ của cơ sở dữ liệu.
- **Kiến trúc Containerization độc lập**:
  - Ứng dụng Next.js 16 chạy dưới quyền `USER nextjs:nodejs` (non-root), base image alpine siêu nhẹ và bảo mật.

## 3. Changed & Created Files
- `src/lib/logger.ts`: Module ghi log có cấu trúc tích hợp bộ lọc che giấu dữ liệu nhạy cảm.
- `src/app/api/health/route.ts`: API endpoint giám sát sức khỏe ứng dụng và kết nối DB.
- `docker-compose.yml`: Bổ sung healthcheck định kỳ cho `web` và ràng buộc `caddy` phụ thuộc `service_healthy`.
- `src/scripts/test_staging_observability.ts`: Kịch bản kiểm thử tự động toàn diện cho logger, healthcheck, và cấu hình hạ tầng.

## 4. Test & Verification Results
- `npx tsx src/scripts/test_staging_observability.ts`: **39/39 PASS** (Redaction, DB URL masking, Bearer/JWT token masking, healthcheck 200, healthcheck 503 error resilience, Dockerfile & Compose validation).
- `npx tsx src/scripts/test_seo_boundaries.ts`: **37/37 PASS** (Không hồi quy AG-24).
- `npx tsx src/scripts/test_shopping_checklist.ts`: **22/22 PASS** (Không hồi quy AG-23).
- `npx tsx src/scripts/test_ingredient_aggregation.ts`: **37/37 PASS** (Không hồi quy AG-22).
- `npx tsx src/scripts/test_meal_composition.ts`: **37/37 PASS** (Không hồi quy AG-21).
- `npx tsx src/scripts/test_saved_recipes.ts`: **25/25 PASS** (Không hồi quy AG-20).
- `npx tsc --noEmit -p .`: PASS 100% không có lỗi kiểu dữ liệu.
- `npm run build`: PASS 100% (35/35 routes biên dịch tối ưu, bao gồm `ƒ /api/health`).
- `docker compose config`: PASS 100% cú pháp hợp lệ.

## 5. Next Steps
Chuyển sang ticket cuối cùng của Phase P3:
- **AG-26 (Content batch review & MVP pilot gate)**: Rà soát toàn bộ chất lượng catalog nội dung Batch 1, kiểm tra các tiêu chí Gate P3 để chính thức công bố hoàn tất Phase P3 và sẵn sàng bàn giao bản MVP thử nghiệm thực tế.
