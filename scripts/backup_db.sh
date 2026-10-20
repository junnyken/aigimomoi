#!/bin/bash
# AG-26: Database Backup Script — Ăn Gì Mom
# Tuân thủ Invariants §11.4: Tự động sao lưu cơ sở dữ liệu PostgreSQL sang tệp .sql

set -e

BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/angimom_backup_${TIMESTAMP}.sql"

CONTAINER_NAME="angimom_postgres"
DB_USER="${POSTGRES_USER:-angimom}"
DB_NAME="${POSTGRES_DB:-angimom_db}"

echo "=== BẮT ĐẦU SAO LƯU CƠ SỞ DỮ LIỆU ==="
echo "Thời gian: $(date)"
echo "Tệp đích: $BACKUP_FILE"

if docker ps | grep -q "$CONTAINER_NAME"; then
  echo "Sao lưu qua Docker container $CONTAINER_NAME..."
  docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$BACKUP_FILE"
elif command -v pg_dump > /dev/null; then
  echo "Sao lưu qua lệnh pg_dump cục bộ..."
  pg_dump -U "$DB_USER" -d "$DB_NAME" -h localhost -p 5432 --clean --if-exists > "$BACKUP_FILE"
else
  echo "LỖI: Không tìm thấy container $CONTAINER_NAME hoặc lệnh pg_dump trên hệ thống!"
  exit 1
fi

FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "✓ Sao lưu thành công! Dung lượng tệp: $FILE_SIZE"
echo "$BACKUP_FILE"
