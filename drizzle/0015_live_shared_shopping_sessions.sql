-- Live Shared Shopping Sessions (Giỏ đi chợ đồng bộ thời gian thực 24h)
CREATE TABLE IF NOT EXISTS "shared_shopping_sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"meal_query" text NOT NULL,
	"servings" integer DEFAULT 4 NOT NULL,
	"checked_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"custom_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shared_shopping_sessions_expires_idx" ON "shared_shopping_sessions" ("expires_at");
