#!/bin/bash
# AG-Production: Script sao lưu tự động PostgreSQL Database
# Sử dụng: ./scripts/backup_db.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/angimom_backup_$TIMESTAMP.sql.gz"

DB_USER="${POSTGRES_USER:-angimom}"
DB_NAME="${POSTGRES_DB:-angimom_db}"
CONTAINER_NAME="${PG_CONTAINER:-angimom_postgres}"

echo "==> Đang tiến hành sao lưu database '$DB_NAME' từ container '$CONTAINER_NAME'..."

docker exec -i "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✓ Sao lưu thành công: $BACKUP_FILE (Kích thước: $FILESIZE)"

# Tự động dọn dẹp các bản sao lưu cũ hơn 30 ngày
echo "==> Dọn dẹp các bản sao lưu cũ hơn 30 ngày..."
find "$BACKUP_DIR" -type f -name "angimom_backup_*.sql.gz" -mtime +30 -delete
echo "✓ Hoàn tất."
