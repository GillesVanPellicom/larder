import { db, pool } from './index'
import { seedProduction } from './seeds/production'
import { seedDev } from './seeds/dev'

export async function migrateDb(retries = 5, delayMs = 2000): Promise<void> {
  let attempt = 0

  while (attempt < retries) {
    try {
      attempt++
      console.log(`[Database] Connecting to PostgreSQL (attempt ${attempt}/${retries})...`)

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
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
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
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

        CREATE TABLE IF NOT EXISTS templates (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          is_default BOOLEAN NOT NULL DEFAULT FALSE,
          current_version_id INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        CREATE TABLE IF NOT EXISTS template_versions (
          id SERIAL PRIMARY KEY,
          template_id VARCHAR(64) NOT NULL,
          version INTEGER NOT NULL,
          change_summary VARCHAR(255) NOT NULL DEFAULT '',
          fields_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
          card_layout JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS recipe_history (
          id SERIAL PRIMARY KEY,
          recipe_id INTEGER NOT NULL,
          template_version_id INTEGER NOT NULL,
          snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
          saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tag_categories (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          color VARCHAR(50) NOT NULL DEFAULT 'neutral',
          exclusive BOOLEAN NOT NULL DEFAULT FALSE,
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

      // 1. Seed production schemas (metadata configuration, production tag categories, and system templates)
      await seedProduction(db, pool)

      // 2. Seed development mock recipes if non-production environment
      const isProductionEnv = process.env.NODE_ENV === 'production' && process.env.SEED_DEV !== 'true'
      if (!isProductionEnv) {
        await seedDev(db, pool)
      }

      console.log('[Database] Schema migrations and seeds completed successfully.')
      return
    } catch (err: unknown) {
      const errObj = err as { message?: string; code?: string }
      const message = errObj.message || errObj.code || String(err)
      console.warn(`[Database] Migration attempt ${attempt} failed:`, message)
      if (attempt >= retries) {
        console.error('[Database] All migration attempts failed.')
        throw err
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}
