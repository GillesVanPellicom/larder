import { db, pool } from './index'
import { seedProduction } from './seeds/production'
import { seedDev } from './seeds/dev'

export async function migrateDb(retries = 5, delayMs = 2000): Promise<void> {
  let attempt = 0

  while (attempt < retries) {
    try {
      attempt++
      console.log(`[Database] Connecting to PostgreSQL (attempt ${attempt}/${retries})...`)

      // Check if schema already exists before running DDL
      const tableCheck = await pool.query<{ exists: boolean }>(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'recipes'
        ) AS exists;
      `)
      const isInitialDatabase = !tableCheck.rows[0]?.exists

      // Ensure base tables and columns exist in PostgreSQL
      await pool.query(`
        CREATE TABLE IF NOT EXISTS recipes (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          yield_amount INTEGER NOT NULL DEFAULT 4,
          yield_unit VARCHAR(50) NOT NULL DEFAULT 'servings',
          prep_time_minutes INTEGER NOT NULL DEFAULT 0,
          cook_time_minutes INTEGER NOT NULL DEFAULT 0,
          total_time_minutes INTEGER NOT NULL DEFAULT 0,
          image_url TEXT NOT NULL DEFAULT '',
          source_url TEXT NOT NULL DEFAULT '',
          ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
          instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
          tags JSONB NOT NULL DEFAULT '{}'::jsonb,
          has_violations BOOLEAN NOT NULL DEFAULT FALSE,
          violations JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Safe column additions for existing tables
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS yield_unit VARCHAR(50) NOT NULL DEFAULT 'servings';
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'recipes' AND column_name = 'yield_amount' AND data_type = 'character varying'
          ) THEN
            ALTER TABLE recipes ALTER COLUMN yield_amount TYPE INTEGER USING COALESCE(NULLIF(regexp_replace(yield_amount, '\D', '', 'g'), '')::INTEGER, 4);
            ALTER TABLE recipes ALTER COLUMN yield_amount SET DEFAULT 4;
          END IF;
        END $$;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS yield_amount INTEGER NOT NULL DEFAULT 4;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cook_time_minutes INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS total_time_minutes INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_url TEXT NOT NULL DEFAULT '';
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '{}'::jsonb;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS has_violations BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS violations JSONB NOT NULL DEFAULT '[]'::jsonb;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

        CREATE TABLE IF NOT EXISTS ingredients (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS recipe_ingredients (
          id SERIAL PRIMARY KEY,
          recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
          ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
          amount VARCHAR(50) NOT NULL DEFAULT '',
          unit VARCHAR(50) NOT NULL DEFAULT '',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
        CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

        -- If recipes table had an ingredients JSON column, backfill into recipe_ingredients
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'recipes' AND column_name = 'ingredients'
          ) THEN
            -- 1. Insert distinct ingredient names
            INSERT INTO ingredients (name)
            SELECT DISTINCT trim(elem->>'name')
            FROM recipes, jsonb_array_elements(CASE WHEN jsonb_typeof(recipes.ingredients) = 'array' THEN recipes.ingredients ELSE '[]'::jsonb END) AS elem
            WHERE recipes.deleted_at IS NULL
              AND elem->>'name' IS NOT NULL
              AND length(trim(elem->>'name')) > 0
            ON CONFLICT (name) DO NOTHING;

            -- 2. Populate recipe_ingredients if empty
            IF NOT EXISTS (SELECT 1 FROM recipe_ingredients LIMIT 1) THEN
              INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit, sort_order)
              SELECT 
                r.id AS recipe_id,
                i.id AS ingredient_id,
                COALESCE(elem->>'amount', '') AS amount,
                COALESCE(elem->>'unit', '') AS unit,
                (ord - 1)::integer AS sort_order
              FROM recipes r,
              jsonb_array_elements(CASE WHEN jsonb_typeof(r.ingredients) = 'array' THEN r.ingredients ELSE '[]'::jsonb END) WITH ORDINALITY AS arr(elem, ord)
              JOIN ingredients i ON lower(i.name) = lower(trim(elem->>'name'))
              WHERE r.deleted_at IS NULL
              ON CONFLICT DO NOTHING;
            END IF;

            -- 3. Drop obsolete JSON column from recipes table
            ALTER TABLE recipes DROP COLUMN IF EXISTS ingredients;
          END IF;
        END $$;

        -- Drop obsolete template tables
        DROP TABLE IF EXISTS template_versions CASCADE;
        DROP TABLE IF EXISTS templates CASCADE;
        DROP TABLE IF EXISTS recipe_history CASCADE;

        CREATE TABLE IF NOT EXISTS tag_categories (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          color VARCHAR(50) NOT NULL DEFAULT 'neutral',
          exclusive BOOLEAN NOT NULL DEFAULT FALSE,
          min_tags INTEGER DEFAULT 0,
          max_tags INTEGER,
          tags JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE tag_categories ADD COLUMN IF NOT EXISTS exclusive BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE tag_categories ADD COLUMN IF NOT EXISTS min_tags INTEGER DEFAULT 0;
        ALTER TABLE tag_categories ADD COLUMN IF NOT EXISTS max_tags INTEGER;

        CREATE TABLE IF NOT EXISTS metadata_config (
          id VARCHAR(50) PRIMARY KEY,
          mandatory_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
          mandatory_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
          time_tracking_mode VARCHAR(50) DEFAULT 'prep_and_cook',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE metadata_config ADD COLUMN IF NOT EXISTS time_tracking_mode VARCHAR(50) DEFAULT 'prep_and_cook';
      `)

      if (isInitialDatabase) {
        console.log('[Database] Empty database detected. Seeding initial data...')
        // 1. Seed production schemas (metadata configuration and production tag categories)
        await seedProduction(db, pool)

        // 2. Seed development mock recipes if non-production environment
        const isProductionEnv = process.env.NODE_ENV === 'production' && process.env.SEED_DEV !== 'true'
        if (!isProductionEnv) {
          await seedDev(db, pool)
        }

        // 3. Recalculate violations on newly seeded recipes
        const { recipeViolationService } = await import('../services/recipeViolationService')
        await recipeViolationService.recalculateAllViolations()
      } else {
        console.log('[Database] Existing database detected. Migrated schema without re-seeding.')
      }

      console.log('[Database] Database migration ready.')
      return
    } catch (err: unknown) {
      console.error(`[DATABASE ERROR] Migration attempt ${attempt} failed:`, err)
      if (attempt >= retries) {
        console.error('[DATABASE ERROR] All migration attempts failed.')
        throw err
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}
