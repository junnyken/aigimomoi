-- Migration: 0010_ag39_40_41_p7_catalog_pantry_planner
-- AG-39: Mở rộng Catalog
-- AG-40: Quản lý Kho thực phẩm gia đình (Pantry)
-- AG-41: Lập kế hoạch mâm cơm tuần (Weekly Meal Planner)

DO $$ BEGIN
  CREATE TYPE storage_location AS ENUM ('FRIDGE', 'FREEZER', 'DRY_PANTRY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS pantry_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE SET NULL,
  custom_name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL DEFAULT 'gam',
  location storage_location NOT NULL DEFAULT 'FRIDGE',
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pantry_items_user_idx ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS pantry_items_ingredient_idx ON pantry_items(ingredient_id);
CREATE INDEX IF NOT EXISTS pantry_items_expires_idx ON pantry_items(expires_at);

CREATE TABLE IF NOT EXISTS meal_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_date TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  meal_type diary_meal_type NOT NULL DEFAULT 'LUNCH',
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  custom_dish_name TEXT,
  servings INTEGER NOT NULL DEFAULT 4,
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meal_plans_user_date_idx ON meal_plans(user_id, plan_date);
CREATE INDEX IF NOT EXISTS meal_plans_recipe_idx ON meal_plans(recipe_id);
