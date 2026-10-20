-- AG-34: Cooked-it Feedback & Photos
DO $$ BEGIN
 CREATE TYPE "feedback_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "recipe_cooked_feedbacks" (
  "id" serial PRIMARY KEY NOT NULL,
  "recipe_id" integer NOT NULL,
  "user_id" integer,
  "cook_name" text NOT NULL,
  "cook_email" text,
  "rating" integer DEFAULT 5 NOT NULL,
  "notes" text,
  "photo_url" text,
  "status" "feedback_status" DEFAULT 'PENDING' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "approved_at" timestamp with time zone,
  "approved_by_id" integer,
  CONSTRAINT "recipe_cooked_feedbacks_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "recipe_cooked_feedbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "recipe_cooked_feedbacks_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "recipe_cooked_feedbacks_recipe_idx" ON "recipe_cooked_feedbacks" ("recipe_id");
CREATE INDEX IF NOT EXISTS "recipe_cooked_feedbacks_status_idx" ON "recipe_cooked_feedbacks" ("status");
CREATE INDEX IF NOT EXISTS "recipe_cooked_feedbacks_created_at_idx" ON "recipe_cooked_feedbacks" ("created_at");
CREATE INDEX IF NOT EXISTS "recipe_cooked_feedbacks_user_recipe_idx" ON "recipe_cooked_feedbacks" ("recipe_id", "user_id");
