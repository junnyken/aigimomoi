CREATE TYPE "public"."meal_role" AS ENUM('MAIN', 'SOUP', 'SIDE', 'ONE_DISH_MEAL', 'DESSERT', 'BEVERAGE');--> statement-breakpoint
CREATE TYPE "public"."nutrition_status" AS ENUM('NO_DATA', 'INCOMPLETE', 'ESTIMATED');--> statement-breakpoint
CREATE TYPE "public"."recipe_publish_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'NEEDS_CHANGES', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."scale_policy" AS ENUM('LINEAR', 'FIXED', 'MANUAL_ADJUST');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_type" AS ENUM('CUISINE_REGION', 'COOKING_METHOD', 'DIET_PREFERENCE', 'OCCASION');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'EDITOR', 'COOK');--> statement-breakpoint
CREATE TABLE "cooking_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"phase_name" text DEFAULT 'Chế biến' NOT NULL,
	"instruction" text NOT NULL,
	"timer_seconds" integer,
	"tip_text" text,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "dish_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"dish_id" integer NOT NULL,
	"alias_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_role" "meal_role" DEFAULT 'MAIN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dishes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Thực phẩm tươi sống' NOT NULL,
	"standard_unit" text DEFAULT 'g' NOT NULL,
	"is_pantry_staple" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingredients_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "meal_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer NOT NULL,
	"recipe_id" integer NOT NULL,
	"role" "meal_role" DEFAULT 'MAIN' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Mâm cơm gia đình' NOT NULL,
	"user_id" integer,
	"servings" integer DEFAULT 4 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"amount" double precision NOT NULL,
	"unit" text NOT NULL,
	"scale_policy" "scale_policy" DEFAULT 'LINEAR' NOT NULL,
	"preparation" text,
	"is_optional" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_tags" (
	"recipe_id" integer NOT NULL,
	"taxonomy_id" integer NOT NULL,
	CONSTRAINT "recipe_tags_recipe_id_taxonomy_id_pk" PRIMARY KEY("recipe_id","taxonomy_id")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"dish_id" integer,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_description" text NOT NULL,
	"role" "meal_role" DEFAULT 'MAIN' NOT NULL,
	"status" "recipe_publish_status" DEFAULT 'DRAFT' NOT NULL,
	"base_servings" integer DEFAULT 4 NOT NULL,
	"prep_time_minutes" integer DEFAULT 15 NOT NULL,
	"cook_time_minutes" integer DEFAULT 30 NOT NULL,
	"difficulty" text DEFAULT 'Dễ' NOT NULL,
	"calories_per_serving" integer,
	"nutrition_status" "nutrition_status" DEFAULT 'NO_DATA' NOT NULL,
	"hero_image" text,
	"is_editorial_reviewed" boolean DEFAULT false NOT NULL,
	"is_cook_tested" boolean DEFAULT false NOT NULL,
	"is_nutrition_verified" boolean DEFAULT false NOT NULL,
	"author_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "taxonomies" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "taxonomy_type" NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "taxonomies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'COOK' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cooking_steps" ADD CONSTRAINT "cooking_steps_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dish_aliases" ADD CONSTRAINT "dish_aliases_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_taxonomy_id_taxonomies_id_fk" FOREIGN KEY ("taxonomy_id") REFERENCES "public"."taxonomies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cooking_steps_recipe_id_idx" ON "cooking_steps" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "dish_aliases_dish_id_idx" ON "dish_aliases" USING btree ("dish_id");--> statement-breakpoint
CREATE INDEX "dish_aliases_name_idx" ON "dish_aliases" USING btree ("alias_name");--> statement-breakpoint
CREATE INDEX "dishes_slug_idx" ON "dishes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "dishes_name_idx" ON "dishes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ingredients_slug_idx" ON "ingredients" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ingredients_name_idx" ON "ingredients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "meal_items_meal_id_idx" ON "meal_items" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "meal_items_recipe_id_idx" ON "meal_items" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_ingredient_id_idx" ON "recipe_ingredients" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX "recipe_tags_recipe_idx" ON "recipe_tags" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_tags_taxonomy_idx" ON "recipe_tags" USING btree ("taxonomy_id");--> statement-breakpoint
CREATE INDEX "recipes_slug_idx" ON "recipes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "recipes_role_idx" ON "recipes" USING btree ("role");--> statement-breakpoint
CREATE INDEX "recipes_status_idx" ON "recipes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recipes_author_idx" ON "recipes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "taxonomies_type_idx" ON "taxonomies" USING btree ("type");--> statement-breakpoint
CREATE INDEX "taxonomies_slug_idx" ON "taxonomies" USING btree ("slug");