-- AG-37 & AG-38: Family Meal Diary & Daily Summaries
DO $$ BEGIN
 CREATE TYPE "diary_meal_type" AS ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "meal_diary_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "recipe_id" integer,
  "recipe_name" text NOT NULL,
  "diary_date" text NOT NULL,
  "meal_type" "diary_meal_type" DEFAULT 'LUNCH' NOT NULL,
  "member_name" text DEFAULT 'Cả nhà' NOT NULL,
  "consumed_portion" double precision DEFAULT 1.0 NOT NULL,
  "calories" integer NOT NULL,
  "protein" double precision NOT NULL,
  "fat" double precision NOT NULL,
  "carbs" double precision NOT NULL,
  "sodium" integer,
  "fiber" double precision,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "meal_diary_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "meal_diary_entries_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "meal_diary_entries_user_idx" ON "meal_diary_entries" ("user_id");
CREATE INDEX IF NOT EXISTS "meal_diary_entries_user_date_idx" ON "meal_diary_entries" ("user_id", "diary_date");
CREATE INDEX IF NOT EXISTS "meal_diary_entries_recipe_idx" ON "meal_diary_entries" ("recipe_id");
