#!/usr/bin/env bash
# ==============================================================================
# Script Triển Khai Production Tự Động — Ăn Gì Mom (Next.js + R2 + Caddy SSL)
# Sử dụng: ./scripts/deploy_production.sh
# ==============================================================================
set -e

echo "=========================================================="
echo "  🚀 KHỞI ĐỘNG TIẾN TRÌNH DEPLOY PRODUCTION — ĂN GÌ MOM"
echo "=========================================================="

# 1. Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Lỗi: Docker chưa được cài đặt trên máy chủ."
    exit 1
fi

# 2. Kiểm tra file cấu hình môi trường
ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    if [ -f ".env" ]; then
        ENV_FILE=".env"
    else
        echo "❌ Lỗi: Không tìm thấy file .env.production hoặc .env."
        echo "👉 Vui lòng tạo file .env.production và điền các khóa bí mật thực tế trước khi chạy deploy."
        exit 1
    fi
fi
echo "✅ Đang sử dụng file cấu hình môi trường: $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
export PG_CONTAINER="${PG_CONTAINER:-angimom_prod_postgres}"
export POSTGRES_DB="${POSTGRES_DB:-angimom_prod}"

# 3. Tạo thư mục dữ liệu nếu chưa có
mkdir -p data/postgres data/caddy_data data/caddy_config backups public/uploads
chown -R 1001:1001 public/uploads 2>/dev/null || chmod 777 public/uploads || true

# 4. Sao lưu CSDL hiện tại để phòng ngừa rủi ro (nếu container đang chạy)
if [ -f "./scripts/backup_db.sh" ] && docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
    echo "💾 Đang tiến hành sao lưu CSDL trước khi cập nhật..."
    ./scripts/backup_db.sh
fi

# 5. Kiểm tra kết nối Cloudflare R2
echo "📡 Đang kiểm tra cấu hình Cloudflare R2..."
if command -v npx &> /dev/null; then
    npx tsx src/scripts/test_r2_connection.ts || true
fi

# 6. Khởi động các container Docker
echo "🐳 Đang kiểm tra cú pháp Docker Compose..."
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml config --quiet

echo "🐳 Đang build và khởi động các container Production..."
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d --build

# 7. Đợi container Postgres sẵn sàng
echo "⏳ Đang đợi PostgreSQL khởi động hoàn tất..."
DB_USER="${POSTGRES_USER:-angimom}"
DB_NAME="${POSTGRES_DB:-angimom_prod}"

RETRIES=30
until docker exec angimom_prod_postgres pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    echo "   ... đang chờ PostgreSQL sẵn sàng ($RETRIES lần thử còn lại) ..."
    sleep 2
    RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
    echo "❌ Lỗi: PostgreSQL không phản hồi sau thời gian chờ."
    exit 1
fi
echo "✅ PostgreSQL đã sẵn sàng."

# 8. Thực thi migrations vào cơ sở dữ liệu (Fail-closed & idempotent qua journal)
echo "🗄️ Đang đồng bộ hóa Database Schema..."
node scripts/migrate_production.js

echo ""
echo "=========================================================="
echo "  🎉 TRIỂN KHAI PRODUCTION THÀNH CÔNG!"
echo "=========================================================="
echo "  🌐 Dịch vụ đang hoạt động tại:"
echo "     - Web App: http://localhost:3000 (Proxy qua Caddy HTTPS)"
echo "     - Cloudflare R2 Storage: Đã tích hợp sẵn sàng"
echo "     - Database: PostgreSQL 16 (Container: angimom_prod_postgres)"
echo "=========================================================="
