-- Migration: 0011_r7_creator_marketplace
-- R7: Hồ sơ người nấu (Chợ công thức), bất biến nhãn kiểm chứng, 1 đánh giá / người / món.
-- Idempotent: chạy lại an toàn.

CREATE TABLE IF NOT EXISTS creator_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  region TEXT NOT NULL DEFAULT 'GENERAL',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  identity_verified_at TIMESTAMP WITH TIME ZONE,
  identity_verified_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_professional BOOLEAN NOT NULL DEFAULT FALSE,
  seller_terms_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS creator_profiles_slug_idx ON creator_profiles(slug);

-- Bất biến D23/R7: món cộng đồng không bao giờ mang nhãn "Đã nấu thử" của Bếp Mom.
-- Chuẩn hóa dữ liệu cũ (nếu có) trước khi thêm ràng buộc.
UPDATE recipes SET is_cook_tested = FALSE
WHERE provenance = 'COMMUNITY_SUBMITTED' AND is_cook_tested = TRUE;

DO $$ BEGIN
  ALTER TABLE recipes
    ADD CONSTRAINT recipes_community_not_cook_tested
    CHECK (provenance <> 'COMMUNITY_SUBMITTED' OR is_cook_tested = FALSE);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Mỗi người dùng đăng nhập chỉ có 1 đánh giá / công thức.
-- API (AG-34) vốn đã upsert theo (recipe_id, user_id); nếu có bản trùng do race cũ,
-- giữ bản mới nhất (id lớn nhất) trước khi tạo unique index.
DELETE FROM recipe_cooked_feedbacks a
USING recipe_cooked_feedbacks b
WHERE a.user_id IS NOT NULL
  AND a.user_id = b.user_id
  AND a.recipe_id = b.recipe_id
  AND a.id < b.id;

CREATE UNIQUE INDEX IF NOT EXISTS recipe_cooked_feedbacks_user_recipe_uniq
  ON recipe_cooked_feedbacks(recipe_id, user_id)
  WHERE user_id IS NOT NULL;
