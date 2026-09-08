import { count, eq } from 'drizzle-orm'
import { db, pool } from './index'
import { metadataConfigTable, recipes, tagCategories, templates, templateVersions } from './schema'

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
          yield_amount VARCHAR(100) NOT NULL DEFAULT '',
          prep_time_minutes INTEGER NOT NULL DEFAULT 0,
          cook_time_minutes INTEGER NOT NULL DEFAULT 0,
          total_time_minutes INTEGER NOT NULL DEFAULT 0,
          image_url TEXT NOT NULL DEFAULT '',
          source_url TEXT NOT NULL DEFAULT '',
          notes TEXT NOT NULL DEFAULT '',
          ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
          instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
          tags JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Safe column additions for existing tables
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS yield_amount VARCHAR(100) NOT NULL DEFAULT '';
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cook_time_minutes INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS total_time_minutes INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_url TEXT NOT NULL DEFAULT '';
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '{}'::jsonb;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS template_id VARCHAR(64) NOT NULL DEFAULT 'tpl_default';
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS template_version_id INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS field_values JSONB NOT NULL DEFAULT '{}'::jsonb;
        ALTER TABLE recipes ADD COLUMN IF NOT EXISTS archived_values JSONB NOT NULL DEFAULT '{}'::jsonb;
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
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Seed global metadata configuration via Drizzle ORM
      const existingConfig = await db
        .select()
        .from(metadataConfigTable)
        .where(eq(metadataConfigTable.id, 'global'))

      if (existingConfig.length === 0) {
        console.log('[Drizzle ORM] Seeding default metadata configuration...')
        await db.insert(metadataConfigTable).values({
          id: 'global',
          mandatoryFields: {
            title: true,
            ingredients: true,
            instructions: true,
            image_url: false,
            description: false,
            yield_amount: false,
            prep_time_minutes: false,
            cook_time_minutes: false,
            total_time_minutes: false,
          },
          mandatoryCategories: [],
        })
      }

      // Seed tag categories via Drizzle ORM
      const [categoryCount] = await db.select({ value: count() }).from(tagCategories)
      if (Number(categoryCount.value) === 0) {
        console.log('[Drizzle ORM] Seeding initial tag categories...')
        const defaultCategories = [
          {
            id: 'season',
            name: 'Season',
            color: 'amber',
            tags: ['Winter', 'Spring', 'Summer', 'Autumn'],
          },
          {
            id: 'course',
            name: 'Course',
            color: 'blue',
            tags: ['Appetizer', 'Main Course', 'Side Dish', 'Dessert', 'Beverage'],
          },
          {
            id: 'cuisine',
            name: 'Cuisine',
            color: 'emerald',
            tags: ['Italian', 'French', 'Spanish', 'Mexican', 'Japanese'],
          },
          {
            id: 'dietary',
            name: 'Dietary',
            color: 'purple',
            tags: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'],
          },
          {
            id: 'difficulty',
            name: 'Difficulty',
            color: 'rose',
            tags: ['Easy', 'Intermediate', 'Advanced'],
          },
        ]

        await db.insert(tagCategories).values(defaultCategories)
      }

      // Seed initial recipes via Drizzle ORM
      const [recipeCount] = await db.select({ value: count() }).from(recipes)
      if (Number(recipeCount.value) === 0) {
        console.log('[Drizzle ORM] Seeding initial culinary recipes...')
        await db.insert(recipes).values([
          {
            title: 'Spaghetti Cacio e Pepe',
            description:
              'Quintessential Roman pasta prepared with freshly crushed Tellicherry black pepper and aged Pecorino Romano.',
            yieldAmount: '2 servings',
            prepTimeMinutes: 10,
            cookTimeMinutes: 15,
            totalTimeMinutes: 25,
            imageUrl:
              'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=1200&q=80',
            sourceUrl: 'https://example.com/cacio-e-pepe',
            notes: 'Do not overheat the pecorino cream or it will turn grainy.',
            ingredients: [
              { id: '1', name: 'Spaghetti or Tonnarelli', amount: '200', unit: 'g' },
              { id: '2', name: 'Pecorino Romano DOP', amount: '120', unit: 'g', notes: 'finely grated' },
              { id: '3', name: 'Whole Black Peppercorns', amount: '2', unit: 'tbsp', notes: 'freshly cracked' },
              { id: '4', name: 'Fine Sea Salt', amount: '1', unit: 'pinch' },
            ],
            instructions: [
              { step: 1, text: 'Bring a pot of water to a gentle boil with minimal salt.' },
              { step: 2, text: 'Toast freshly cracked black peppercorns in a skillet until fragrant.' },
              { step: 3, text: 'In a bowl, mix grated Pecorino with a ladle of hot pasta water into a velvety emulsion.' },
              { step: 4, text: 'Toss pasta with toasted pepper, remove from heat, and stir in cheese emulsion until glossy.' },
            ],
            tags: {
              season: ['Winter', 'Autumn'],
              course: ['Main Course'],
              cuisine: ['Italian'],
              dietary: ['Vegetarian'],
              difficulty: ['Intermediate'],
            },
          },
          {
            title: 'Artisanal Sourdough Focaccia',
            description:
              'Golden blistered crust with an airy crumb infused with extra virgin olive oil and fragrant rosemary.',
            yieldAmount: '8 generous squares',
            prepTimeMinutes: 30,
            cookTimeMinutes: 25,
            totalTimeMinutes: 55,
            imageUrl:
              'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=1200&q=80',
            sourceUrl: '',
            notes: 'Cold ferment for 24 hours yields the deepest flavor and large bubbly pockets.',
            ingredients: [
              { id: '1', name: 'Strong Bread Flour', amount: '500', unit: 'g' },
              { id: '2', name: 'Active Sourdough Starter', amount: '100', unit: 'g' },
              { id: '3', name: 'Lukewarm Water', amount: '400', unit: 'ml' },
              { id: '4', name: 'Extra Virgin Olive Oil', amount: '45', unit: 'ml' },
              { id: '5', name: 'Flaky Maldon Salt', amount: '1.5', unit: 'tsp' },
              { id: '6', name: 'Fresh Rosemary Leaves', amount: '2', unit: 'sprigs' },
            ],
            instructions: [
              { step: 1, text: 'Mix starter, water, and oil, then combine with flour and salt into a shaggy dough.' },
              { step: 2, text: 'Perform 4 stretch-and-folds over 2 hours, then refrigerate for 24 hours.' },
              { step: 3, text: 'Transfer into an oiled baking pan and proof until bubbly and doubled.' },
              { step: 4, text: 'Dimple gently with fingers, scatter rosemary and sea salt.' },
              { step: 5, text: 'Bake at 220°C (425°F) for 25 minutes until golden.' },
            ],
            tags: {
              season: ['Summer', 'Autumn', 'Spring'],
              course: ['Appetizer', 'Side Dish'],
              cuisine: ['Italian'],
              dietary: ['Vegan', 'Dairy-Free'],
              difficulty: ['Intermediate'],
            },
          },
          {
            title: 'Authentic Gazpacho Andaluz',
            description:
              'Refreshing chilled Spanish soup made of sun-ripened tomatoes, cucumbers, bell peppers, and sherry vinegar.',
            yieldAmount: '4 servings',
            prepTimeMinutes: 15,
            cookTimeMinutes: 0,
            totalTimeMinutes: 15,
            imageUrl: '', // Deliberately left without image to demonstrate conflict detection!
            sourceUrl: '',
            notes: 'Serve ice-cold with crusty bread.',
            ingredients: [
              { id: '1', name: 'Vine Ripe Tomatoes', amount: '1', unit: 'kg' },
              { id: '2', name: 'Cucumber', amount: '1', unit: 'medium' },
              { id: '3', name: 'Green Bell Pepper', amount: '1', unit: 'medium' },
              { id: '4', name: 'Garlic Clove', amount: '1', unit: 'clove' },
              { id: '5', name: 'Sherry Vinegar', amount: '2', unit: 'tbsp' },
              { id: '6', name: 'Extra Virgin Olive Oil', amount: '60', unit: 'ml' },
            ],
            instructions: [
              { step: 1, text: 'Chop tomatoes, cucumber, pepper, and garlic.' },
              { step: 2, text: 'Blend smoothly at high speed.' },
              { step: 3, text: 'Stream in olive oil while blending to emulsify.' },
              { step: 4, text: 'Strain and chill for 2 hours.' },
            ],
            tags: {
              season: ['Summer'],
              course: ['Appetizer'],
              cuisine: ['Spanish'],
              dietary: ['Vegan', 'Gluten-Free', 'Dairy-Free'],
              difficulty: ['Easy'],
            },
          },
        ])
        console.log('[Drizzle ORM] Initial recipes seeded successfully.')
      }

      // Seed default template if not present
      const existingTemplate = await db
        .select()
        .from(templates)
        .where(eq(templates.id, 'tpl_default'))

      if (existingTemplate.length === 0) {
        console.log('[Drizzle ORM] Seeding default recipe template (tpl_default)...')
        await db.insert(templates).values({
          id: 'tpl_default',
          name: 'Classic Recipe',
          description:
            'Standard culinary recipe layout with culinary metrics, ingredients table, rich text method, and mobile-friendly card.',
          isDefault: true,
          currentVersionId: 1,
        })

        await db.insert(templateVersions).values({
          templateId: 'tpl_default',
          version: 1,
          changeSummary: 'Default system template',
          fieldsSchema: [
            {
              id: 'fld_title',
              name: 'Recipe Title',
              type: 'text',
              required: true,
              order: 1,
              config: { multiline: false, placeholder: 'e.g. Spaghetti Carbonara' },
            },
            {
              id: 'fld_description',
              name: 'Summary / Description',
              type: 'text',
              required: false,
              order: 2,
              config: { multiline: true, resizable: true, placeholder: 'Briefly describe this dish...' },
            },
            {
              id: 'fld_image',
              name: 'Cover Photo',
              type: 'image',
              required: false,
              order: 3,
              config: { placeholder: 'https://images.unsplash.com/...' },
            },
            {
              id: 'fld_yield',
              name: 'Yield / Portions',
              type: 'text',
              required: false,
              order: 4,
              config: { multiline: false, placeholder: 'e.g. 4 servings' },
            },
            {
              id: 'fld_prep_time',
              name: 'Prep Time',
              type: 'number',
              required: false,
              order: 5,
              config: { min: 0, step: 1, unit: 'min' },
            },
            {
              id: 'fld_cook_time',
              name: 'Cook Time',
              type: 'number',
              required: false,
              order: 6,
              config: { min: 0, step: 1, unit: 'min' },
            },
            {
              id: 'fld_total_time',
              name: 'Total Time',
              type: 'number',
              required: false,
              order: 7,
              config: { min: 0, step: 1, unit: 'min' },
            },
            {
              id: 'fld_tags',
              name: 'Tags & Taxonomy',
              type: 'tag_category',
              required: false,
              order: 8,
              config: {},
            },
            {
              id: 'fld_sep_content',
              name: 'Method & Ingredients',
              type: 'separator',
              required: false,
              order: 9,
              config: { separatorStyle: 'heading' },
            },
            {
              id: 'fld_ingredients',
              name: 'Ingredients Table',
              type: 'ingredient_table',
              required: true,
              order: 10,
              config: {},
            },
            {
              id: 'fld_instructions',
              name: 'Preparation Method',
              type: 'rich_text',
              required: true,
              order: 11,
              config: {},
            },
            {
              id: 'fld_notes',
              name: 'Cook Notes',
              type: 'text',
              required: false,
              order: 12,
              config: { multiline: true, resizable: true, placeholder: 'Storage instructions, pairing ideas...' },
            },
          ],
          cardLayout: {
            columns: 4,
            widgets: [
              { id: 'w_image', fieldId: 'fld_image', widgetType: 'image_banner', col: 1, row: 1, colSpan: 4, rowSpan: 2 },
              { id: 'w_title', fieldId: 'fld_title', widgetType: 'title_header', col: 1, row: 3, colSpan: 4, rowSpan: 1 },
              { id: 'w_prep', fieldId: 'fld_prep_time', widgetType: 'metric_chip', col: 1, row: 4, colSpan: 2, rowSpan: 1, options: { showLabel: true } },
              { id: 'w_cook', fieldId: 'fld_cook_time', widgetType: 'metric_chip', col: 3, row: 4, colSpan: 2, rowSpan: 1, options: { showLabel: true } },
              { id: 'w_tags', fieldId: 'fld_tags', widgetType: 'tag_chips', col: 1, row: 5, colSpan: 4, rowSpan: 1 },
            ],
          },
        })
      }

      // Backfill existing recipes to populate fieldValues if empty
      await pool.query(`
        UPDATE recipes
        SET field_values = jsonb_build_object(
          'fld_title', title,
          'fld_description', description,
          'fld_yield', yield_amount,
          'fld_prep_time', prep_time_minutes,
          'fld_cook_time', cook_time_minutes,
          'fld_total_time', total_time_minutes,
          'fld_image', image_url,
          'fld_ingredients', ingredients,
          'fld_instructions', instructions,
          'fld_tags', tags,
          'fld_notes', notes
        ),
        template_id = 'tpl_default',
        template_version_id = 1
        WHERE field_values IS NULL OR field_values = '{}'::jsonb;
      `)

      console.log('[Database] Schema migrations and Drizzle seeding completed.')
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
