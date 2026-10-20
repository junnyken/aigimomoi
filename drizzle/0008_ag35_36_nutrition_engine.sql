-- AG-35 & AG-36: Nutrition Engine & Vietnamese Standard Calculator
CREATE TABLE IF NOT EXISTS "ingredient_nutrition" (
  "id" serial PRIMARY KEY NOT NULL,
  "ingredient_id" integer NOT NULL UNIQUE,
  "source" text DEFAULT 'VIETNAM_FCT_2007' NOT NULL,
  "edible_rate" double precision DEFAULT 1.0 NOT NULL,
  "calories_100g" double precision,
  "protein_100g" double precision,
  "fat_100g" double precision,
  "carbs_100g" double precision,
  "fiber_100g" double precision,
  "sodium_100g" double precision,
  "is_verified" boolean DEFAULT false NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ingredient_nutrition_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "ingredient_nutrition_ingredient_idx" ON "ingredient_nutrition" ("ingredient_id");
CREATE INDEX IF NOT EXISTS "ingredient_nutrition_verified_idx" ON "ingredient_nutrition" ("is_verified");

-- Lưu Snapshot dinh dưỡng chi tiết trên từng công thức (AG-36)
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "nutrition_snapshot" jsonb;
