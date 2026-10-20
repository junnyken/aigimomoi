CREATE TABLE IF NOT EXISTS "saved_recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"recipe_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "saved_recipes_user_recipe_idx" ON "saved_recipes" USING btree ("user_id","recipe_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_recipes_user_idx" ON "saved_recipes" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_recipes_recipe_idx" ON "saved_recipes" USING btree ("recipe_id");
