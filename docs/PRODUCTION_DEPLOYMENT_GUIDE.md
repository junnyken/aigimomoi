# HƯỚNG DẪN TRIỂN KHAI PRODUCTION LÊN MÁY CHỦ VỚI CLOUDFLARE R2

Tài liệu hướng dẫn chi tiết quy trình đưa ứng dụng **Ăn Gì Mom** lên máy chủ VPS/Cloud thực tế kết hợp dịch vụ lưu trữ ảnh đám mây **Cloudflare R2** và chứng chỉ bảo mật SSL/HTTPS tự động từ **Caddy Server**.

---

## 1. THIẾT LẬP CLOUDFLARE R2 OBJECT STORAGE

Cloudflare R2 là giải pháp lưu trữ hình ảnh chuẩn S3 với chi phí rẻ và **hoàn toàn miễn phí băng thông truyền tải dữ liệu (Zero Egress Fees)**, lý tưởng cho website ẩm thực có nhiều ảnh món ăn độ nét cao.

### Các bước tạo bucket trên Cloudflare Dashboard:
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Chọn mục **R2 Object Storage** từ menu bên trái $\to$ bấm **Create bucket**.
3. Đặt tên bucket: `angimom-media` $\to$ chọn Location: `Automatic` hoặc `APAC` $\to$ bấm **Create Bucket**.
4. **Cấu hình Public Access cho ảnh**:
   - Vào bucket `angimom-media` $\to$ chọn tab **Settings**.
   - Tại mục **Public access**:
     - Bật tính năng **R2.dev subdomain** (cho môi trường test/staging), HOẶC
     - Bấm **Custom Domains** $\to$ nhập domain của bạn (ví dụ: `media.angimom.vn`). Cloudflare sẽ tự động định tuyến và cấp SSL cho domain ảnh này.
5. **Tạo R2 API Tokens (Access Key & Secret Key)**:
   - Quay lại trang chủ **R2** $\to$ bấm **Manage R2 API Tokens** ở cột bên phải.
   - Bấm **Create API token**.
   - Quyền hạn (Permissions): Chọn **Object Read & Write**.
   - Áp dụng cho: Chọn bucket `angimom-media`.
   - Bấm **Create API Token**.
   - Lưu trữ an toàn 3 thông tin quan trọng được hiển thị:
     - `Account ID`
     - `Access Key ID`
     - `Secret Access Key`

---

## 2. CHUẨN BỊ MÁY CHỦ (VPS / CLOUD SERVER)

- **Hệ điều hành khuyến nghị**: Ubuntu 22.04 LTS hoặc Debian 12.
- **Yêu cầu phần cứng**: Tối thiểu 1 CPU Cores, 2GB RAM, 20GB SSD.
- **Cài đặt Docker & Docker Compose**:
```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

---

## 3. CẤU HÌNH BIẾN MÔI TRƯỜNG TRÊN MÁY CHỦ

Tạo file `.env.production` trong thư mục dự án trên server:

```bash
# ==============================================================================
# ANGIMOM PRODUCTION ENVIRONMENT CONFIGURATION
# ==============================================================================
NODE_ENV=production
DOMAIN_NAME=angimom.vn

# 1. Cơ sở dữ liệu PostgreSQL
POSTGRES_USER=angimom
POSTGRES_PASSWORD=MatKhauBaoMatCucManh2026!@#
POSTGRES_DB=angimom_prod
DATABASE_URL=postgres://angimom:MatKhauBaoMatCucManh2026!@#@postgres:5432/angimom_prod

# 2. Khóa bảo mật Session (Web Crypto HMAC-SHA256)
# Bắt buộc: Chuỗi ngẫu nhiên chuẩn mật mã tối thiểu 32 ký tự (tạo bằng: openssl rand -base64 32)
# Tuyệt đối không dùng lại các chuỗi mẫu hay placeholder (hệ thống sẽ fail-closed)
AUTH_SECRET=ThayBangChuoiSinhTuLenhTrenKhongDungPlaceholder

# 3. Cloudflare R2 Object Storage (Lưu trữ ảnh món ăn)
CLOUDFLARE_R2_ACCOUNT_ID=d9f48xxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_R2_ACCESS_KEY_ID=287bxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_R2_SECRET_ACCESS_KEY=94a1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_R2_BUCKET_NAME=angimom-media
CLOUDFLARE_R2_PUBLIC_DOMAIN=https://media.angimom.vn

# 4. Email thông báo giao dịch (Resend API)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=no-reply@angimom.vn

# 5. Cấu hình AI có kiểm soát (Gemini Flash)
AI_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 4. TRIỂN KHAI VỚI 1 DÒNG LỆNH (ONE-CLICK DEPLOY)

Hệ thống đã chuẩn bị sẵn script triển khai tự động:

```bash
./scripts/deploy_production.sh
```

### Script sẽ tự động thực hiện:
1. Kiểm tra môi trường Docker và các khóa Cloudflare R2.
2. Sao lưu cơ sở dữ liệu hiện tại để phòng ngừa rủi ro.
3. Build Docker container Next.js 16 Standalone siêu nhẹ (~120MB).
4. Khởi động 3 dịch vụ đồng bộ qua `docker-compose.prod.yml`:
   - `angimom_prod_app`: Ứng dụng Next.js port 3000.
   - `angimom_prod_postgres`: CSDL PostgreSQL 16 bền vững.
   - `angimom_prod_caddy`: Caddy Web Server tự động cấp chứng chỉ SSL HTTPS Let's Encrypt.
5. Đồng bộ toàn bộ 10 file migrations cơ sở dữ liệu.

---

## 5. CẤU HÌNH TỰ ĐỘNG SAO LƯU DỮ LIỆU ĐỊNH KỲ (CRON JOB)

Để đảm bảo an toàn dữ liệu gia đình người dùng, thiết lập cron job chạy script sao lưu DB nén gzip vào 02:00 sáng mỗi ngày:

```bash
# Mở bảng lập lịch cron
crontab -e

# Thêm dòng sau vào cuối file (thay /path/to/angimom bằng đường dẫn thực tế):
0 2 * * * cd /home/ubuntu/angimom && ./scripts/backup_db.sh >> /var/log/angimom_backup.log 2>&1
```

---

## 6. KIỂM TRA HỆ THỐNG SAU KHI TRIỂN KHAI

1. **Kiểm tra trạng thái container**:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
2. **Kiểm tra log ứng dụng**:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f app
   ```
3. **Thử tải ảnh kiểm tra Cloudflare R2**:
   ```bash
   npx tsx src/scripts/test_r2_connection.ts
   ```
4. **Truy cập trình duyệt**:
   Mở `https://angimom.vn` $\to$ Trình duyệt hiển thị ổ khóa xanh SSL HTTPS hợp lệ, tốc độ tải trang dưới 1 giây!
