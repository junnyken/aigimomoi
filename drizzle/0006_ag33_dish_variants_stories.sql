-- AG-33: Dish Variants, Kitchen Stories & Source Attribution
-- Mở rộng văn hóa món ăn vùng miền và câu chuyện bếp nhà

ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "region" text DEFAULT 'GENERAL' NOT NULL;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "kitchen_story" text;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "source_attribution" text;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "variant_of_id" integer;

DO $$ BEGIN
 ALTER TABLE "recipes" ADD CONSTRAINT "recipes_variant_of_id_recipes_id_fk" FOREIGN KEY ("variant_of_id") REFERENCES "recipes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "recipes_variant_of_id_idx" ON "recipes" ("variant_of_id");
CREATE INDEX IF NOT EXISTS "recipes_region_idx" ON "recipes" ("region");
