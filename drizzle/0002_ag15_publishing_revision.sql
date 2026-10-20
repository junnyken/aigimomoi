ALTER TABLE "recipes" ADD COLUMN "version_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "revision_of_id" integer;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "reviewed_by_id" integer;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_revision_of_id_recipes_id_fk" FOREIGN KEY ("revision_of_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recipes_revision_of_idx" ON "recipes" USING btree ("revision_of_id");