-- Bổ sung vai trò mới DIPPING_SAUCE (Nước chấm / Sốt gia truyền) cho bữa cơm gia đình Việt
ALTER TYPE "public"."meal_role" ADD VALUE IF NOT EXISTS 'DIPPING_SAUCE';
