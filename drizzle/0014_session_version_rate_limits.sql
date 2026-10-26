-- Thu hồi phiên đăng nhập: tăng session_version khi đổi mật khẩu / vai trò / email → mọi cookie cũ mất hiệu lực
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
-- Bộ đếm giới hạn tần suất dùng chung giữa các instance và không mất khi khởi động lại
CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limit_buckets_reset_at_idx" ON "rate_limit_buckets" ("reset_at");
