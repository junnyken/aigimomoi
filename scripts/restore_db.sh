#!/bin/bash
# AG-Production: Script phục hồi PostgreSQL Database từ bản sao lưu
# Sử dụng: ./scripts/restore_db.sh <đường_dẫn_tệp_backup.sql.gz>

set -eo pipefail

if [ -f ".env.production" ]; then
  set -a
  # shellcheck disable=SC1091
  source ".env.production"
  set +a
elif [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Lỗi: Vui lòng chỉ định đường dẫn tệp sao lưu hợp lệ."
  echo "Ví dụ: ./scripts/restore_db.sh ./backups/angimom_backup_20261021_000000.sql.gz"
  exit 1
fi

DB_USER="${POSTGRES_USER:-angimom}"
if [ -z "${PG_CONTAINER:-}" ]; then
  if docker ps --format '{{.Names}}' | grep -q '^angimom_prod_postgres$'; then
    CONTAINER_NAME="angimom_prod_postgres"
    DB_NAME="${POSTGRES_DB:-angimom_prod}"
  else
    CONTAINER_NAME="angimom_postgres"
    DB_NAME="${POSTGRES_DB:-angimom_db}"
  fi
else
  CONTAINER_NAME="$PG_CONTAINER"
  DB_NAME="${POSTGRES_DB:-angimom_prod}"
fi

echo "CẢNH BÁO: Thao tác này sẽ ghi đè toàn bộ dữ liệu trong database '$DB_NAME'!"
read -p "Bạn có chắc chắn muốn tiếp tục? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "Đã hủy thao tác phục hồi."
  exit 0
fi

echo "==> Đang phục hồi cơ sở dữ liệu từ '$BACKUP_FILE'..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"

echo "✓ Phục hồi dữ liệu thành công!"
