-- R8: Content Gating, Pricing, Recipe Bundles & User Entitlements (D66)

-- 1. Thêm cột price và is_free vào bảng recipes
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "price" integer DEFAULT 0 NOT NULL;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "is_free" boolean DEFAULT true NOT NULL;

-- 2. Ràng buộc giá món lẻ: hoặc = 0 hoặc nằm trong khoảng 10.000 đến 200.000 VNĐ
DO $$ BEGIN
  ALTER TABLE "recipes" ADD CONSTRAINT "recipes_price_range_check"
    CHECK (price = 0 OR (price >= 10000 AND price <= 200000));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tạo bảng recipe_bundles (Bộ công thức / Combo món)
CREATE TABLE IF NOT EXISTS "recipe_bundles" (
  "id" serial PRIMARY KEY NOT NULL,
  "creator_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "description" text,
  "cover_image" text,
  "price" integer DEFAULT 30000 NOT NULL,
  "status" text DEFAULT 'DRAFT' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "recipe_bundles_price_check" CHECK (price >= 30000 AND price <= 1000000)
);

CREATE INDEX IF NOT EXISTS "recipe_bundles_creator_idx" ON "recipe_bundles" ("creator_id");
CREATE INDEX IF NOT EXISTS "recipe_bundles_slug_idx" ON "recipe_bundles" ("slug");

-- 4. Tạo bảng recipe_bundle_items (Món trong bộ)
CREATE TABLE IF NOT EXISTS "recipe_bundle_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "bundle_id" integer NOT NULL REFERENCES "recipe_bundles"("id") ON DELETE CASCADE,
  "recipe_id" integer NOT NULL REFERENCES "recipes"("id") ON DELETE CASCADE,
  "order_index" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "recipe_bundle_items_bundle_recipe_uniq" UNIQUE ("bundle_id", "recipe_id")
);

CREATE INDEX IF NOT EXISTS "recipe_bundle_items_bundle_idx" ON "recipe_bundle_items" ("bundle_id");
CREATE INDEX IF NOT EXISTS "recipe_bundle_items_recipe_idx" ON "recipe_bundle_items" ("recipe_id");

-- 5. Tạo bảng user_entitlements (Quyền sở hữu công thức / bộ công thức)
CREATE TABLE IF NOT EXISTS "user_entitlements" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "item_type" text NOT NULL,
  "recipe_id" integer REFERENCES "recipes"("id") ON DELETE CASCADE,
  "bundle_id" integer REFERENCES "recipe_bundles"("id") ON DELETE CASCADE,
  "granted_reason" text DEFAULT 'PROMO_CLAIM' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_entitlements_user_recipe_uniq" 
  ON "user_entitlements" ("user_id", "recipe_id") 
  WHERE "item_type" = 'RECIPE';

CREATE UNIQUE INDEX IF NOT EXISTS "user_entitlements_user_bundle_uniq" 
  ON "user_entitlements" ("user_id", "bundle_id") 
  WHERE "item_type" = 'BUNDLE';

CREATE INDEX IF NOT EXISTS "user_entitlements_user_idx" ON "user_entitlements" ("user_id");
