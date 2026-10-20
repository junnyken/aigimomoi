#!/bin/bash
# AG-26: Database Restore Script — Ăn Gì Mom
# Tuân thủ Invariants §11.4: Khôi phục cơ sở dữ liệu từ tệp .sql sao lưu

set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "LỖI: Thiếu đường dẫn tệp sao lưu!"
  echo "Cách dùng: $0 <path_to_backup_file.sql>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "LỖI: Tệp sao lưu không tồn tại: $BACKUP_FILE"
  exit 1
fi

CONTAINER_NAME="angimom_postgres"
DB_USER="${POSTGRES_USER:-angimom}"
DB_NAME="${POSTGRES_DB:-angimom_db}"

echo "=== BẮT ĐẦU PHỤC HỒI CƠ SỞ DỮ LIỆU ==="
echo "Tệp nguồn: $BACKUP_FILE"
echo "Cơ sở dữ liệu đích: $DB_NAME"

if docker ps | grep -q "$CONTAINER_NAME"; then
  echo "Khôi phục qua Docker container $CONTAINER_NAME..."
  docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
elif command -v psql > /dev/null; then
  echo "Khôi phục qua lệnh psql cục bộ..."
  psql -U "$DB_USER" -d "$DB_NAME" -h localhost -p 5432 < "$BACKUP_FILE"
else
  echo "LỖI: Không tìm thấy container $CONTAINER_NAME hoặc lệnh psql trên hệ thống!"
  exit 1
fi

echo "✓ Phục hồi cơ sở dữ liệu thành công!"
