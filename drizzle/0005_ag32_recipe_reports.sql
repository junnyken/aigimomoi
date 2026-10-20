-- AG-32: Recipe Reports & Content Moderation
DO $$ BEGIN
 CREATE TYPE "report_status" AS ENUM('PENDING', 'RESOLVED', 'DISMISSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "report_reason" AS ENUM('UNSAFE_FOOD', 'INCORRECT_RECIPE', 'COPYRIGHT', 'INAPPROPRIATE', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "recipe_reports" (
  "id" serial PRIMARY KEY NOT NULL,
  "recipe_id" integer NOT NULL,
  "reporter_id" integer,
  "reporter_email" text,
  "reason" "report_reason" DEFAULT 'OTHER' NOT NULL,
  "details" text,
  "status" "report_status" DEFAULT 'PENDING' NOT NULL,
  "moderator_notes" text,
  "resolved_by_id" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone,
  CONSTRAINT "recipe_reports_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "recipe_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "recipe_reports_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "recipe_reports_recipe_idx" ON "recipe_reports" ("recipe_id");
CREATE INDEX IF NOT EXISTS "recipe_reports_status_idx" ON "recipe_reports" ("status");
CREATE INDEX IF NOT EXISTS "recipe_reports_created_at_idx" ON "recipe_reports" ("created_at");
