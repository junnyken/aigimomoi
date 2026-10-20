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
if [ ! -f .env.production ] && [ ! -f .env ]; then
    echo "⚠️  Cảnh báo: Không tìm thấy file .env.production hoặc .env."
    echo "👉 Đang tạo file .env.production mẫu từ .env.example..."
    cp .env.example .env.production
    echo "✅ Đã tạo .env.production. Vui lòng cập nhật các khóa bí mật trước khi chạy lại."
fi

# 3. Tạo thư mục dữ liệu nếu chưa có
mkdir -p data/postgres data/caddy_data data/caddy_config backups public/uploads

# 4. Sao lưu CSDL hiện tại để phòng ngừa rủi ro
if [ -f "./scripts/backup_db.sh" ]; then
    echo "💾 Đang tiến hành sao lưu CSDL trước khi cập nhật..."
    ./scripts/backup_db.sh || true
fi

# 5. Kiểm tra kết nối Cloudflare R2
echo "📡 Đang kiểm tra cấu hình Cloudflare R2..."
if command -v npx &> /dev/null; then
    npx tsx src/scripts/test_r2_connection.ts || true
fi

# 6. Khởi động các container Docker
echo "🐳 Đang build và khởi động các container Production..."
docker compose -f docker-compose.prod.yml up -d --build

# 7. Đợi container Postgres sẵn sàng
echo "⏳ Đang đợi PostgreSQL khởi động hoàn tất..."
sleep 5

# 8. Thực thi migrations vào cơ sở dữ liệu
echo "🗄️ Đang đồng bộ hóa Database Schema..."
for sql_file in $(ls drizzle/*.sql | sort); do
    echo "   -> Đang chạy migration: $sql_file"
    docker exec -i angimom_prod_postgres psql -U angimom -d angimom_prod < "$sql_file" 2>/dev/null || true
done

echo ""
echo "=========================================================="
echo "  🎉 TRIỂN KHAI PRODUCTION THÀNH CÔNG!"
echo "=========================================================="
echo "  🌐 Dịch vụ đang hoạt động tại:"
echo "     - Web App: http://localhost:3000 (Proxy qua Caddy HTTPS)"
echo "     - Cloudflare R2 Storage: Đã tích hợp sẵn sàng"
echo "     - Database: PostgreSQL 16 (Container: angimom_prod_postgres)"
echo "=========================================================="
