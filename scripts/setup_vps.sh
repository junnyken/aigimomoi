#!/usr/bin/env bash
# ==============================================================================
# Script Thiết lập Môi trường Ban Đầu trên VPS / Vibe Host (Mắt Bão)
# Sử dụng: ./scripts/setup_vps.sh
# Liên hệ: trieunt6@matbao.com
# ==============================================================================
set -e

echo "=========================================================="
echo "  🛠️ KHỞI TẠO CẤU HÌNH VPS / VIBE HOST — ĂN GÌ MOM"
echo "=========================================================="

# 1. Kiểm tra Docker & Docker Compose
if ! command -v docker &> /dev/null; then
    echo "⚠️ Docker chưa được cài đặt. Đang tiến hành cài đặt Docker tự động..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    rm get-docker.sh
    echo "✅ Đã cài đặt Docker thành công."
else
    echo "✅ Docker đã sẵn sàng: $(docker --version)"
fi

# 2. Tạo .env.production từ template nếu chưa có
if [ ! -f ".env.production" ]; then
    echo "📝 Đang tạo file cấu hình .env.production từ .env.vps.template..."
    cp .env.vps.template .env.production

    # Tự động sinh AUTH_SECRET ngẫu nhiên 32 bytes an toàn
    RANDOM_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    # Tự động sinh mật khẩu PostgreSQL ngẫu nhiên 24 bytes
    RANDOM_PG_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)

    sed -i "s|SinhKhoaNgauNhienItNhat32KyTuBangLenhOpensslRandBase64_32|${RANDOM_SECRET}|g" .env.production
    sed -i "s|DatMatKhauDBSieuManhChoVPS_MatBao_2026!|${RANDOM_PG_PASS}|g" .env.production
    chmod 600 .env.production

    echo "✅ Đã tự động tạo khóa AUTH_SECRET và POSTGRES_PASSWORD ngẫu nhiên an toàn trong .env.production!"
    echo "👉 Hãy mở .env.production để cập nhật DOMAIN_NAME trỏ tới tên miền của bạn nếu cần."
else
    chmod 600 .env.production || true
    echo "✅ Đã tìm thấy file .env.production hiện có."
fi

# 3. Tạo các thư mục dữ liệu cần thiết
mkdir -p data/postgres data/caddy_data data/caddy_config backups public/uploads
chown -R 1001:1001 public/uploads 2>/dev/null || chmod 777 public/uploads || true

echo ""
echo "=========================================================="
echo "  🎉 THIẾT LẬP HOÀN TẤT!"
echo "  Để triển khai dịch vụ lên máy chủ, vui lòng chạy lệnh:"
echo "     ./scripts/deploy_production.sh"
echo "=========================================================="
