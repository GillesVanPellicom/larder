var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/src/index.ts
import fs from "fs";
import path2 from "path";
import express from "express";
import cors from "cors";

// server/src/config.ts
import path from "path";
import dotenv from "dotenv";
dotenv.config();
var config = {
  port: Number(process.env.PORT || (process.env.NODE_ENV === "production" ? 3e3 : 3001)),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgresql://coquinaria:coquinaria_secret@localhost:5432/coquinaria",
  clientDistPath: path.resolve(process.cwd(), "dist")
};

// server/src/db/migrate.ts
import { count, eq } from "drizzle-orm";

// server/src/db/index.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// server/src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  metadataConfigTable: () => metadataConfigTable,
  recipeHistory: () => recipeHistory,
  recipes: () => recipes,
  tagCategories: () => tagCategories,
  templateVersions: () => templateVersions,
  templates: () => templates
});
import { pgTable, serial, varchar, text, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
var templates = pgTable("templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  currentVersionId: integer("current_version_id").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
});
var templateVersions = pgTable("template_versions", {
  id: serial("id").primaryKey(),
  templateId: varchar("template_id", { length: 64 }).notNull(),
  version: integer("version").notNull(),
  changeSummary: varchar("change_summary", { length: 255 }).default("").notNull(),
  fieldsSchema: jsonb("fields_schema").$type().notNull(),
  cardLayout: jsonb("card_layout").$type().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").default("").notNull(),
  yieldAmount: varchar("yield_amount", { length: 100 }).default("").notNull(),
  prepTimeMinutes: integer("prep_time_minutes").default(0).notNull(),
  cookTimeMinutes: integer("cook_time_minutes").default(0).notNull(),
  totalTimeMinutes: integer("total_time_minutes").default(0).notNull(),
  imageUrl: text("image_url").default("").notNull(),
  sourceUrl: text("source_url").default("").notNull(),
  notes: text("notes").default("").notNull(),
  ingredients: jsonb("ingredients").$type().default([]).notNull(),
  instructions: jsonb("instructions").$type().default("").notNull(),
  tags: jsonb("tags").$type().default({}).notNull(),
  // Template & dynamic field values
  templateId: varchar("template_id", { length: 64 }).default("tpl_default").notNull(),
  templateVersionId: integer("template_version_id").default(1).notNull(),
  fieldValues: jsonb("field_values").$type().default({}).notNull(),
  archivedValues: jsonb("archived_values").$type().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true })
});
var recipeHistory = pgTable("recipe_history", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull(),
  templateVersionId: integer("template_version_id").notNull(),
  snapshot: jsonb("snapshot").$type().notNull(),
  savedAt: timestamp("saved_at", { withTimezone: true }).defaultNow().notNull()
});
var tagCategories = pgTable("tag_categories", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 50 }).default("neutral").notNull(),
  exclusive: boolean("exclusive").default(false).notNull(),
  minTags: integer("min_tags").default(0),
  maxTags: integer("max_tags"),
  tags: jsonb("tags").$type().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var metadataConfigTable = pgTable("metadata_config", {
  id: varchar("id", { length: 50 }).primaryKey(),
  mandatoryFields: jsonb("mandatory_fields").$type().notNull(),
  mandatoryCategories: jsonb("mandatory_categories").$type().default([]).notNull(),
  timeTrackingMode: varchar("time_tracking_mode", { length: 50 }).default("prep_and_cook"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

// server/src/db/index.ts
var pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 5e3
});
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});
var db = drizzle(pool, { schema: schema_exports });
async function checkDatabaseHealth() {
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      return { healthy: true };
    } finally {
      client.release();
    }
  } catch (err) {
    const errObj = err;
    const message = errObj.message || errObj.code || "Failed to connect to database";
    return { healthy: false, error: message };
  }
}

// server/src/db/migrate.ts
async function migrateDb(retries = 5, delayMs = 2e3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      attempt++;
      console.log(`[Database] Connecting to PostgreSQL (attempt ${attempt}/${retries})...`);
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
          time_tracking_mode VARCHAR(50) DEFAULT 'prep_and_cook',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE metadata_config ADD COLUMN IF NOT EXISTS time_tracking_mode VARCHAR(50) DEFAULT 'prep_and_cook';
      `);
      const existingConfig = await db.select().from(metadataConfigTable).where(eq(metadataConfigTable.id, "global"));
      if (existingConfig.length === 0) {
        console.log("[Drizzle ORM] Seeding default metadata configuration...");
        await db.insert(metadataConfigTable).values({
          id: "global",
          mandatoryFields: {
            title: true,
            ingredients: true,
            instructions: true,
            image_url: false,
            description: false,
            yield_amount: false,
            prep_time_minutes: false,
            cook_time_minutes: false
          },
          mandatoryCategories: [],
          timeTrackingMode: "prep_and_cook"
        });
      }
      const [categoryCount] = await db.select({ value: count() }).from(tagCategories);
      if (Number(categoryCount.value) === 0) {
        console.log("[Drizzle ORM] Seeding initial tag categories...");
        const defaultCategories = [
          {
            id: "season",
            name: "Season",
            color: "amber",
            tags: ["Winter", "Spring", "Summer", "Autumn"]
          },
          {
            id: "course",
            name: "Course",
            color: "blue",
            tags: ["Appetizer", "Main Course", "Side Dish", "Dessert", "Beverage"]
          },
          {
            id: "cuisine",
            name: "Cuisine",
            color: "emerald",
            tags: ["Italian", "French", "Spanish", "Mexican", "Japanese"]
          },
          {
            id: "dietary",
            name: "Dietary",
            color: "purple",
            tags: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"]
          },
          {
            id: "difficulty",
            name: "Difficulty",
            color: "rose",
            tags: ["Easy", "Intermediate", "Advanced"]
          }
        ];
        await db.insert(tagCategories).values(defaultCategories);
      }
      const [recipeCount] = await db.select({ value: count() }).from(recipes);
      if (Number(recipeCount.value) === 0) {
        console.log("[Drizzle ORM] Seeding initial culinary recipes...");
        await db.insert(recipes).values([
          {
            title: "Spaghetti Cacio e Pepe",
            description: "Quintessential Roman pasta prepared with freshly crushed Tellicherry black pepper and aged Pecorino Romano.",
            yieldAmount: "2 servings",
            prepTimeMinutes: 10,
            cookTimeMinutes: 15,
            totalTimeMinutes: 25,
            imageUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=1200&q=80",
            sourceUrl: "https://example.com/cacio-e-pepe",
            notes: "Do not overheat the pecorino cream or it will turn grainy.",
            ingredients: [
              { id: "1", name: "Spaghetti or Tonnarelli", amount: "200", unit: "g" },
              { id: "2", name: "Pecorino Romano DOP", amount: "120", unit: "g", notes: "finely grated" },
              { id: "3", name: "Whole Black Peppercorns", amount: "2", unit: "tbsp", notes: "freshly cracked" },
              { id: "4", name: "Fine Sea Salt", amount: "1", unit: "pinch" }
            ],
            instructions: [
              { step: 1, text: "Bring a pot of water to a gentle boil with minimal salt." },
              { step: 2, text: "Toast freshly cracked black peppercorns in a skillet until fragrant." },
              { step: 3, text: "In a bowl, mix grated Pecorino with a ladle of hot pasta water into a velvety emulsion." },
              { step: 4, text: "Toss pasta with toasted pepper, remove from heat, and stir in cheese emulsion until glossy." }
            ],
            tags: {
              season: ["Winter", "Autumn"],
              course: ["Main Course"],
              cuisine: ["Italian"],
              dietary: ["Vegetarian"],
              difficulty: ["Intermediate"]
            }
          },
          {
            title: "Artisanal Sourdough Focaccia",
            description: "Golden blistered crust with an airy crumb infused with extra virgin olive oil and fragrant rosemary.",
            yieldAmount: "8 generous squares",
            prepTimeMinutes: 30,
            cookTimeMinutes: 25,
            totalTimeMinutes: 55,
            imageUrl: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=1200&q=80",
            sourceUrl: "",
            notes: "Cold ferment for 24 hours yields the deepest flavor and large bubbly pockets.",
            ingredients: [
              { id: "1", name: "Strong Bread Flour", amount: "500", unit: "g" },
              { id: "2", name: "Active Sourdough Starter", amount: "100", unit: "g" },
              { id: "3", name: "Lukewarm Water", amount: "400", unit: "ml" },
              { id: "4", name: "Extra Virgin Olive Oil", amount: "45", unit: "ml" },
              { id: "5", name: "Flaky Maldon Salt", amount: "1.5", unit: "tsp" },
              { id: "6", name: "Fresh Rosemary Leaves", amount: "2", unit: "sprigs" }
            ],
            instructions: [
              { step: 1, text: "Mix starter, water, and oil, then combine with flour and salt into a shaggy dough." },
              { step: 2, text: "Perform 4 stretch-and-folds over 2 hours, then refrigerate for 24 hours." },
              { step: 3, text: "Transfer into an oiled baking pan and proof until bubbly and doubled." },
              { step: 4, text: "Dimple gently with fingers, scatter rosemary and sea salt." },
              { step: 5, text: "Bake at 220\xB0C (425\xB0F) for 25 minutes until golden." }
            ],
            tags: {
              season: ["Summer", "Autumn", "Spring"],
              course: ["Appetizer", "Side Dish"],
              cuisine: ["Italian"],
              dietary: ["Vegan", "Dairy-Free"],
              difficulty: ["Intermediate"]
            }
          },
          {
            title: "Authentic Gazpacho Andaluz",
            description: "Refreshing chilled Spanish soup made of sun-ripened tomatoes, cucumbers, bell peppers, and sherry vinegar.",
            yieldAmount: "4 servings",
            prepTimeMinutes: 15,
            cookTimeMinutes: 0,
            totalTimeMinutes: 15,
            imageUrl: "",
            // Deliberately left without image to demonstrate conflict detection!
            sourceUrl: "",
            notes: "Serve ice-cold with crusty bread.",
            ingredients: [
              { id: "1", name: "Vine Ripe Tomatoes", amount: "1", unit: "kg" },
              { id: "2", name: "Cucumber", amount: "1", unit: "medium" },
              { id: "3", name: "Green Bell Pepper", amount: "1", unit: "medium" },
              { id: "4", name: "Garlic Clove", amount: "1", unit: "clove" },
              { id: "5", name: "Sherry Vinegar", amount: "2", unit: "tbsp" },
              { id: "6", name: "Extra Virgin Olive Oil", amount: "60", unit: "ml" }
            ],
            instructions: [
              { step: 1, text: "Chop tomatoes, cucumber, pepper, and garlic." },
              { step: 2, text: "Blend smoothly at high speed." },
              { step: 3, text: "Stream in olive oil while blending to emulsify." },
              { step: 4, text: "Strain and chill for 2 hours." }
            ],
            tags: {
              season: ["Summer"],
              course: ["Appetizer"],
              cuisine: ["Spanish"],
              dietary: ["Vegan", "Gluten-Free", "Dairy-Free"],
              difficulty: ["Easy"]
            }
          }
        ]);
        console.log("[Drizzle ORM] Initial recipes seeded successfully.");
      }
      const existingTemplate = await db.select().from(templates).where(eq(templates.id, "tpl_default"));
      if (existingTemplate.length === 0) {
        console.log("[Drizzle ORM] Seeding default recipe template (tpl_default)...");
        await db.insert(templates).values({
          id: "tpl_default",
          name: "Classic Recipe",
          description: "Standard culinary recipe layout with culinary metrics, ingredients table, rich text method, and mobile-friendly card.",
          isDefault: true,
          currentVersionId: 1
        });
        await db.insert(templateVersions).values({
          templateId: "tpl_default",
          version: 1,
          changeSummary: "Default system template",
          fieldsSchema: [
            {
              id: "fld_title",
              name: "Recipe Title",
              type: "text",
              required: true,
              order: 1,
              config: { multiline: false, placeholder: "e.g. Spaghetti Carbonara" }
            },
            {
              id: "fld_description",
              name: "Summary / Description",
              type: "text",
              required: false,
              order: 2,
              config: { multiline: true, resizable: true, placeholder: "Briefly describe this dish..." }
            },
            {
              id: "fld_image",
              name: "Cover Photo",
              type: "image",
              required: false,
              order: 3,
              config: { placeholder: "https://images.unsplash.com/..." }
            },
            {
              id: "fld_yield",
              name: "Yield / Portions",
              type: "text",
              required: false,
              order: 4,
              config: { multiline: false, placeholder: "e.g. 4 servings" }
            },
            {
              id: "fld_prep_time",
              name: "Prep Time",
              type: "number",
              required: false,
              order: 5,
              config: { min: 0, step: 1, unit: "min" }
            },
            {
              id: "fld_cook_time",
              name: "Cook Time",
              type: "number",
              required: false,
              order: 6,
              config: { min: 0, step: 1, unit: "min" }
            },
            {
              id: "fld_total_time",
              name: "Total Time",
              type: "number",
              required: false,
              order: 7,
              config: { min: 0, step: 1, unit: "min" }
            },
            {
              id: "fld_tags",
              name: "Tags & Taxonomy",
              type: "tag_category",
              required: false,
              order: 8,
              config: {}
            },
            {
              id: "fld_sep_content",
              name: "Method & Ingredients",
              type: "separator",
              required: false,
              order: 9,
              config: { separatorStyle: "heading" }
            },
            {
              id: "fld_ingredients",
              name: "Ingredients Table",
              type: "ingredient_table",
              required: true,
              order: 10,
              config: {}
            },
            {
              id: "fld_instructions",
              name: "Preparation Method",
              type: "rich_text",
              required: true,
              order: 11,
              config: {}
            },
            {
              id: "fld_notes",
              name: "Cook Notes",
              type: "text",
              required: false,
              order: 12,
              config: { multiline: true, resizable: true, placeholder: "Storage instructions, pairing ideas..." }
            }
          ],
          cardLayout: {
            columns: 4,
            widgets: [
              { id: "w_image", fieldId: "fld_image", widgetType: "image_banner", col: 1, row: 1, colSpan: 4, rowSpan: 2 },
              { id: "w_title", fieldId: "fld_title", widgetType: "title_header", col: 1, row: 3, colSpan: 4, rowSpan: 1 },
              { id: "w_prep", fieldId: "fld_prep_time", widgetType: "metric_chip", col: 1, row: 4, colSpan: 2, rowSpan: 1, options: { showLabel: true } },
              { id: "w_cook", fieldId: "fld_cook_time", widgetType: "metric_chip", col: 3, row: 4, colSpan: 2, rowSpan: 1, options: { showLabel: true } },
              { id: "w_tags", fieldId: "fld_tags", widgetType: "tag_chips", col: 1, row: 5, colSpan: 4, rowSpan: 1 }
            ]
          }
        });
      }
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
      `);
      console.log("[Database] Schema migrations and Drizzle seeding completed.");
      return;
    } catch (err) {
      const errObj = err;
      const message = errObj.message || errObj.code || String(err);
      console.warn(`[Database] Migration attempt ${attempt} failed:`, message);
      if (attempt >= retries) {
        console.error("[Database] All migration attempts failed.");
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// server/src/routes/health.ts
import { Router } from "express";
var router = Router();
var startTime = Date.now();
router.get("/", async (_req, res) => {
  const dbHealth = await checkDatabaseHealth();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1e3);
  const response = {
    status: dbHealth.healthy ? "healthy" : "unhealthy",
    database: dbHealth.healthy ? "connected" : "disconnected",
    error: dbHealth.error,
    uptimeSeconds,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  const statusCode = dbHealth.healthy ? 200 : 503;
  res.status(statusCode).json(response);
});
var health_default = router;

// server/src/routes/recipes.ts
import { Router as Router2 } from "express";
import { and, desc, eq as eq2, isNull } from "drizzle-orm";
var router2 = Router2();
function formatRecipe(r) {
  let ingredients = r.ingredients || [];
  if (typeof ingredients === "string") {
    try {
      ingredients = JSON.parse(ingredients);
    } catch {
      ingredients = ingredients.split(",").map((name, i) => ({ id: String(i + 1), name: name.trim() }));
    }
  }
  let instructions = r.instructions || "";
  if (typeof instructions === "string") {
    try {
      const parsed = JSON.parse(instructions);
      if (typeof parsed === "string" || Array.isArray(parsed)) {
        instructions = parsed;
      }
    } catch {
    }
  }
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    yield_amount: r.yieldAmount,
    prep_time_minutes: r.prepTimeMinutes,
    cook_time_minutes: r.cookTimeMinutes,
    total_time_minutes: r.totalTimeMinutes,
    image_url: r.imageUrl,
    source_url: r.sourceUrl,
    notes: r.notes,
    ingredients,
    instructions,
    tags: r.tags || {},
    template_id: r.templateId || "tpl_default",
    template_version_id: r.templateVersionId || 1,
    field_values: r.fieldValues || {},
    archived_values: r.archivedValues || {},
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString()
  };
}
router2.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(recipes).where(isNull(recipes.deletedAt)).orderBy(desc(recipes.id));
    res.json(rows.map(formatRecipe));
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch recipes:", err);
    res.status(500).json({ error: "Failed to fetch recipes from database", details });
  }
});
router2.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }
    const [row] = await db.select().from(recipes).where(and(eq2(recipes.id, id), isNull(recipes.deletedAt)));
    if (!row) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(formatRecipe(row));
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch recipe:", err);
    res.status(500).json({ error: "Failed to fetch recipe", details });
  }
});
function syncCoreColumnsFromFieldValues(body) {
  const fv = body.field_values || {};
  const title = body.title !== void 0 ? body.title : fv.fld_title || "";
  const description = body.description !== void 0 ? body.description : fv.fld_description || "";
  const yieldAmount = body.yield_amount !== void 0 ? body.yield_amount : fv.fld_yield || "";
  const prep = body.prep_time_minutes !== void 0 ? Number(body.prep_time_minutes) : Number(fv.fld_prep_time) || 0;
  const cook = body.cook_time_minutes !== void 0 ? Number(body.cook_time_minutes) : Number(fv.fld_cook_time) || 0;
  const total = body.total_time_minutes !== void 0 ? Number(body.total_time_minutes) : Number(fv.fld_total_time) || prep + cook;
  const imageUrl = body.image_url !== void 0 ? body.image_url : fv.fld_image || "";
  const sourceUrl = body.source_url || "";
  const notes = body.notes !== void 0 ? body.notes : fv.fld_notes || "";
  const ingredients = body.ingredients !== void 0 ? body.ingredients : fv.fld_ingredients || [];
  const instructions = body.instructions !== void 0 ? body.instructions : fv.fld_instructions || "";
  const tags = body.tags !== void 0 ? body.tags : fv.fld_tags || {};
  return {
    title: String(title).trim(),
    description: String(description).trim(),
    yieldAmount: String(yieldAmount).trim(),
    prepTimeMinutes: prep,
    cookTimeMinutes: cook,
    totalTimeMinutes: total,
    imageUrl: String(imageUrl).trim(),
    sourceUrl: String(sourceUrl).trim(),
    notes: String(notes).trim(),
    ingredients,
    instructions,
    tags,
    templateId: body.template_id || "tpl_default",
    templateVersionId: body.template_version_id || 1,
    fieldValues: {
      ...fv,
      fld_title: title,
      fld_description: description,
      fld_yield: yieldAmount,
      fld_prep_time: prep,
      fld_cook_time: cook,
      fld_total_time: total,
      fld_image: imageUrl,
      fld_notes: notes,
      fld_ingredients: ingredients,
      fld_instructions: instructions,
      fld_tags: tags
    },
    archivedValues: body.archived_values || {}
  };
}
router2.post("/", async (req, res) => {
  try {
    const body = req.body;
    const synced = syncCoreColumnsFromFieldValues(body);
    if (!synced.title) {
      return res.status(400).json({ error: "Recipe title is required" });
    }
    const [created] = await db.insert(recipes).values(synced).returning();
    await db.insert(recipeHistory).values({
      recipeId: created.id,
      templateVersionId: created.templateVersionId,
      snapshot: {
        title: created.title,
        fieldValues: created.fieldValues,
        archivedValues: created.archivedValues
      }
    });
    res.status(201).json(formatRecipe(created));
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to create recipe:", err);
    res.status(500).json({ error: "Failed to create recipe", details });
  }
});
router2.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }
    const body = req.body;
    const synced = syncCoreColumnsFromFieldValues(body);
    const updatePayload = {
      ...synced,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const [updated] = await db.update(recipes).set(updatePayload).where(eq2(recipes.id, id)).returning();
    if (!updated) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    await db.insert(recipeHistory).values({
      recipeId: updated.id,
      templateVersionId: updated.templateVersionId,
      snapshot: {
        title: updated.title,
        fieldValues: updated.fieldValues,
        archivedValues: updated.archivedValues
      }
    });
    res.json(formatRecipe(updated));
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to update recipe:", err);
    res.status(500).json({ error: "Failed to update recipe", details });
  }
});
router2.get("/:id/history", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }
    const historyRows = await db.select().from(recipeHistory).where(eq2(recipeHistory.recipeId, id)).orderBy(desc(recipeHistory.savedAt));
    res.json(
      historyRows.map((h) => ({
        id: h.id,
        recipeId: h.recipeId,
        templateVersionId: h.templateVersionId,
        snapshot: h.snapshot,
        savedAt: h.savedAt.toISOString()
      }))
    );
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch recipe history:", err);
    res.status(500).json({ error: "Failed to fetch recipe history", details });
  }
});
router2.post("/:id/restore-version/:historyId", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const historyId = parseInt(req.params.historyId, 10);
    if (isNaN(id) || isNaN(historyId)) {
      return res.status(400).json({ error: "Invalid recipe or history ID" });
    }
    const [historyEntry] = await db.select().from(recipeHistory).where(and(eq2(recipeHistory.id, historyId), eq2(recipeHistory.recipeId, id)));
    if (!historyEntry) {
      return res.status(404).json({ error: "History snapshot not found" });
    }
    const snapshot = historyEntry.snapshot;
    const synced = syncCoreColumnsFromFieldValues({
      field_values: snapshot.fieldValues,
      archived_values: snapshot.archivedValues,
      title: snapshot.title,
      template_version_id: historyEntry.templateVersionId
    });
    const [restored] = await db.update(recipes).set({
      ...synced,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(recipes.id, id)).returning();
    await db.insert(recipeHistory).values({
      recipeId: restored.id,
      templateVersionId: restored.templateVersionId,
      snapshot: {
        title: restored.title,
        fieldValues: restored.fieldValues,
        archivedValues: restored.archivedValues,
        restoredFromHistoryId: historyId
      }
    });
    res.json(formatRecipe(restored));
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to restore recipe history version:", err);
    res.status(500).json({ error: "Failed to restore recipe version", details });
  }
});
router2.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }
    const [deleted] = await db.update(recipes).set({ deletedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq2(recipes.id, id)).returning({ id: recipes.id });
    if (!deleted) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json({ success: true, id: deleted.id });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to delete recipe:", err);
    res.status(500).json({ error: "Failed to delete recipe", details });
  }
});
var recipes_default = router2;

// server/src/routes/config.ts
import { Router as Router3 } from "express";
import { eq as eq3 } from "drizzle-orm";
var router3 = Router3();
router3.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(metadataConfigTable).where(eq3(metadataConfigTable.id, "global"));
    if (rows.length === 0) {
      const defaultConfig = {
        mandatoryFields: {
          title: true,
          ingredients: true,
          instructions: true,
          image_url: false,
          description: false,
          yield_amount: false,
          prep_time_minutes: false,
          cook_time_minutes: false
        },
        mandatoryCategories: [],
        timeTrackingMode: "prep_and_cook"
      };
      return res.json(defaultConfig);
    }
    const row = rows[0];
    const config2 = {
      mandatoryFields: row.mandatoryFields,
      mandatoryCategories: row.mandatoryCategories,
      timeTrackingMode: row.timeTrackingMode || "prep_and_cook",
      updated_at: row.updatedAt ? row.updatedAt.toISOString() : void 0
    };
    res.json(config2);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to get metadata config:", err);
    res.status(500).json({ error: "Failed to retrieve metadata config", details });
  }
});
router3.put("/", async (req, res) => {
  try {
    const { mandatoryFields, mandatoryCategories, timeTrackingMode } = req.body;
    if (!mandatoryFields) {
      return res.status(400).json({ error: "mandatoryFields is required" });
    }
    mandatoryFields.title = true;
    mandatoryFields.ingredients = true;
    mandatoryFields.instructions = true;
    if (timeTrackingMode === "no_cook") {
      mandatoryFields.prep_time_minutes = false;
      mandatoryFields.cook_time_minutes = false;
    } else if (timeTrackingMode === "total_only") {
      mandatoryFields.cook_time_minutes = false;
    }
    const [updated] = await db.insert(metadataConfigTable).values({
      id: "global",
      mandatoryFields,
      mandatoryCategories: mandatoryCategories || [],
      timeTrackingMode: timeTrackingMode || "prep_and_cook",
      updatedAt: /* @__PURE__ */ new Date()
    }).onConflictDoUpdate({
      target: metadataConfigTable.id,
      set: {
        mandatoryFields,
        mandatoryCategories: mandatoryCategories || [],
        timeTrackingMode: timeTrackingMode || "prep_and_cook",
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    res.json({
      mandatoryFields: updated.mandatoryFields,
      mandatoryCategories: updated.mandatoryCategories,
      timeTrackingMode: updated.timeTrackingMode,
      updated_at: updated.updatedAt.toISOString()
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to update metadata config:", err);
    res.status(500).json({ error: "Failed to update metadata config", details });
  }
});
var config_default = router3;

// server/src/routes/tags.ts
import { Router as Router4 } from "express";
import { eq as eq4 } from "drizzle-orm";
var router4 = Router4();
router4.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(tagCategories);
    const result = rows.map((r) => {
      var _a;
      return {
        id: r.id,
        name: r.name,
        color: r.color,
        exclusive: r.exclusive ?? false,
        min_tags: r.minTags !== null && r.minTags !== void 0 ? r.minTags : r.exclusive ? 1 : 0,
        max_tags: r.maxTags !== null && r.maxTags !== void 0 ? r.maxTags : r.exclusive ? 1 : ((_a = r.tags) == null ? void 0 : _a.length) || 0,
        tags: r.tags || [],
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString()
      };
    });
    res.json(result);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to get tag categories:", err);
    res.status(500).json({ error: "Failed to retrieve tag categories", details });
  }
});
router4.post("/categories", async (req, res) => {
  try {
    const { id, name, color, exclusive, min_tags, max_tags, tags } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }
    const categoryId = (id || name).toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");
    const [created] = await db.insert(tagCategories).values({
      id: categoryId,
      name: name.trim(),
      color: color || "neutral",
      exclusive: Boolean(exclusive),
      minTags: min_tags !== void 0 ? min_tags : 0,
      maxTags: max_tags !== void 0 ? max_tags : tags ? tags.length : 0,
      tags: tags || []
    }).returning();
    res.status(201).json(created);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to create tag category:", err);
    res.status(500).json({ error: "Failed to create tag category", details });
  }
});
router4.put("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, exclusive, min_tags, max_tags, tags } = req.body;
    const updatePayload = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (name !== void 0) updatePayload.name = name.trim();
    if (color !== void 0) updatePayload.color = color;
    if (exclusive !== void 0) updatePayload.exclusive = Boolean(exclusive);
    if (min_tags !== void 0) updatePayload.minTags = min_tags;
    if (max_tags !== void 0) updatePayload.maxTags = max_tags;
    if (tags !== void 0) updatePayload.tags = tags;
    const [updated] = await db.update(tagCategories).set(updatePayload).where(eq4(tagCategories.id, id)).returning();
    if (!updated) {
      return res.status(404).json({ error: "Tag category not found" });
    }
    res.json(updated);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to update tag category:", err);
    res.status(500).json({ error: "Failed to update tag category", details });
  }
});
router4.post("/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { tag } = req.body;
    if (!tag || !tag.trim()) {
      return res.status(400).json({ error: "Tag name is required" });
    }
    const trimmedTag = tag.trim();
    const [category] = await db.select().from(tagCategories).where(eq4(tagCategories.id, categoryId));
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const currentTags = category.tags || [];
    if (currentTags.some((t) => t.toLowerCase() === trimmedTag.toLowerCase())) {
      return res.status(400).json({ error: "Tag already exists in this category" });
    }
    const updatedTags = [...currentTags, trimmedTag];
    const [updated] = await db.update(tagCategories).set({
      tags: updatedTags,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(tagCategories.id, categoryId)).returning();
    res.status(201).json(updated);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to add tag:", err);
    res.status(500).json({ error: "Failed to add tag", details });
  }
});
router4.put("/:categoryId/rename", async (req, res) => {
  var _a;
  try {
    const { categoryId } = req.params;
    const { oldName, newName } = req.body;
    if (!oldName || !newName || !newName.trim()) {
      return res.status(400).json({ error: "Both oldName and newName are required" });
    }
    const trimmedNew = newName.trim();
    const [category] = await db.select().from(tagCategories).where(eq4(tagCategories.id, categoryId));
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const updatedCategoryTags = (category.tags || []).map(
      (t) => t === oldName ? trimmedNew : t
    );
    await db.update(tagCategories).set({
      tags: updatedCategoryTags,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(tagCategories.id, categoryId));
    const allRecipes = await db.select().from(recipes);
    let affectedRecipesCount = 0;
    for (const r of allRecipes) {
      const catTags = (_a = r.tags) == null ? void 0 : _a[categoryId];
      if (Array.isArray(catTags) && catTags.includes(oldName)) {
        const nextCatTags = catTags.map((t) => t === oldName ? trimmedNew : t);
        const nextTags = {
          ...r.tags,
          [categoryId]: nextCatTags
        };
        await db.update(recipes).set({
          tags: nextTags,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq4(recipes.id, r.id));
        affectedRecipesCount++;
      }
    }
    res.json({
      success: true,
      categoryId,
      oldName,
      newName: trimmedNew,
      affectedRecipesCount
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to rename tag:", err);
    res.status(500).json({ error: "Failed to rename tag", details });
  }
});
router4.get("/:categoryId/:tag/usage", async (req, res) => {
  try {
    const { categoryId, tag } = req.params;
    const allRecipes = await db.select().from(recipes);
    const usingRecipes = allRecipes.filter((r) => {
      var _a;
      const catTags = (_a = r.tags) == null ? void 0 : _a[categoryId];
      return Array.isArray(catTags) && catTags.includes(tag);
    });
    res.json({
      categoryId,
      tag,
      count: usingRecipes.length,
      recipes: usingRecipes.map((r) => ({ id: r.id, title: r.title }))
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to get tag usage:", err);
    res.status(500).json({ error: "Failed to get tag usage", details });
  }
});
router4.delete("/:categoryId/:tag", async (req, res) => {
  try {
    const { categoryId, tag } = req.params;
    const { resolution, reassignTo } = req.body || {};
    const [category] = await db.select().from(tagCategories).where(eq4(tagCategories.id, categoryId));
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const allRecipes = await db.select().from(recipes);
    const usingRecipes = allRecipes.filter((r) => {
      var _a;
      const catTags = (_a = r.tags) == null ? void 0 : _a[categoryId];
      return Array.isArray(catTags) && catTags.includes(tag);
    });
    if (usingRecipes.length > 0 && !resolution) {
      return res.status(409).json({
        error: "Tag is currently used by recipes",
        usageCount: usingRecipes.length,
        recipes: usingRecipes.map((r) => ({ id: r.id, title: r.title })),
        availableTags: (category.tags || []).filter((t) => t !== tag)
      });
    }
    if (usingRecipes.length > 0) {
      for (const r of usingRecipes) {
        const catTags = r.tags[categoryId] || [];
        let nextCatTags;
        if (resolution === "reassign" && reassignTo) {
          nextCatTags = catTags.map((t) => t === tag ? reassignTo : t);
          nextCatTags = Array.from(new Set(nextCatTags));
        } else {
          nextCatTags = catTags.filter((t) => t !== tag);
        }
        const nextTags = {
          ...r.tags,
          [categoryId]: nextCatTags
        };
        await db.update(recipes).set({
          tags: nextTags,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq4(recipes.id, r.id));
      }
    }
    const updatedCategoryTags = (category.tags || []).filter((t) => t !== tag);
    const newCount = updatedCategoryTags.length;
    const updatePayload = {
      tags: updatedCategoryTags,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (category.maxTags !== null && category.maxTags !== void 0 && category.maxTags > newCount) {
      updatePayload.maxTags = Math.max(0, newCount);
    }
    if (category.minTags !== null && category.minTags !== void 0 && category.minTags > newCount) {
      updatePayload.minTags = Math.max(0, newCount);
    }
    await db.update(tagCategories).set(updatePayload).where(eq4(tagCategories.id, categoryId));
    res.json({
      success: true,
      categoryId,
      deletedTag: tag,
      resolution: resolution || "none",
      affectedRecipesCount: usingRecipes.length
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to delete tag:", err);
    res.status(500).json({ error: "Failed to delete tag", details });
  }
});
router4.delete("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [cat] = await db.select().from(tagCategories).where(eq4(tagCategories.id, id));
    if (!cat) {
      return res.status(404).json({ error: "Category not found" });
    }
    if (cat.tags && cat.tags.length > 0) {
      return res.status(400).json({ error: "Cannot delete category that still contains tags. Delete or move tags first." });
    }
    await db.delete(tagCategories).where(eq4(tagCategories.id, id));
    res.json({ success: true, id });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to delete category", details });
  }
});
var tags_default = router4;

// server/src/routes/conflicts.ts
import { Router as Router5 } from "express";
import { eq as eq5 } from "drizzle-orm";
var router5 = Router5();
router5.get("/", async (_req, res) => {
  var _a, _b, _c;
  try {
    const [configRow] = await db.select().from(metadataConfigTable).where(eq5(metadataConfigTable.id, "global"));
    const mandatory = (configRow == null ? void 0 : configRow.mandatoryFields) || {
      title: true,
      ingredients: true,
      instructions: true,
      image_url: false,
      description: false,
      yield_amount: false,
      prep_time_minutes: false,
      cook_time_minutes: false,
      total_time_minutes: false
    };
    const mandatoryCategories = (configRow == null ? void 0 : configRow.mandatoryCategories) || [];
    const timeTrackingMode = (configRow == null ? void 0 : configRow.timeTrackingMode) || "prep_and_cook";
    const allCategories = await db.select().from(tagCategories);
    const categoryTagMap = /* @__PURE__ */ new Map();
    for (const cat of allCategories) {
      categoryTagMap.set(cat.id, new Set(cat.tags || []));
    }
    const recipeRows = await db.select().from(recipes);
    const conflicts = [];
    for (const r of recipeRows) {
      const violations = [];
      if (mandatory.title && (!r.title || !r.title.trim())) {
        violations.push({ field: "title", message: "Title is mandatory" });
      }
      if (mandatory.image_url && (!r.imageUrl || !r.imageUrl.trim())) {
        violations.push({ field: "image_url", message: "Recipe image is mandatory under current configuration" });
      }
      if (mandatory.description && (!r.description || !r.description.trim())) {
        violations.push({ field: "description", message: "Description is mandatory" });
      }
      if (mandatory.yield_amount && (!r.yieldAmount || !r.yieldAmount.trim())) {
        violations.push({ field: "yield_amount", message: "Yield is mandatory" });
      }
      if (timeTrackingMode !== "no_cook") {
        if (timeTrackingMode === "total_only") {
          if (mandatory.prep_time_minutes && (!r.prepTimeMinutes || r.prepTimeMinutes <= 0) && (!r.totalTimeMinutes || r.totalTimeMinutes <= 0)) {
            violations.push({ field: "prep_time_minutes", message: "Total time is mandatory" });
          }
        } else if (timeTrackingMode === "prep_and_cook") {
          if (mandatory.prep_time_minutes && (!r.prepTimeMinutes || r.prepTimeMinutes <= 0)) {
            violations.push({ field: "prep_time_minutes", message: "Preparation time is mandatory" });
          }
          if (mandatory.cook_time_minutes && (!r.cookTimeMinutes || r.cookTimeMinutes <= 0)) {
            violations.push({ field: "cook_time_minutes", message: "Cooking time is mandatory" });
          }
        }
      }
      if (mandatory.ingredients && (!r.ingredients || r.ingredients.length === 0)) {
        violations.push({ field: "ingredients", message: "At least one ingredient is required" });
      }
      if (mandatory.instructions) {
        const instr = r.instructions;
        if (!instr) {
          violations.push({ field: "instructions", message: "Instructions are required under current metadata rules" });
        } else if (typeof instr === "string") {
          const textOnly = instr.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
          if (!textOnly) {
            violations.push({ field: "instructions", message: "Instructions are required under current metadata rules" });
          }
        } else if (Array.isArray(instr) && instr.length === 0) {
          violations.push({ field: "instructions", message: "Instructions are required under current metadata rules" });
        }
      }
      for (const catId of mandatoryCategories) {
        const catTags = (_a = r.tags) == null ? void 0 : _a[catId];
        if (!Array.isArray(catTags) || catTags.length === 0) {
          const catName = ((_b = allCategories.find((c) => c.id === catId)) == null ? void 0 : _b.name) || catId;
          violations.push({
            field: `tags.${catId}`,
            message: `Must have at least one tag in category "${catName}"`
          });
        }
      }
      for (const cat of allCategories) {
        if (cat.exclusive) {
          const catTags = (_c = r.tags) == null ? void 0 : _c[cat.id];
          if (Array.isArray(catTags) && catTags.length > 1) {
            violations.push({
              field: `tags.${cat.id}`,
              message: `Category "${cat.name}" is exclusive (single tag only), but recipe has ${catTags.length} tags: ${catTags.join(", ")}`
            });
          }
        }
      }
      if (violations.length > 0) {
        let ingredients = r.ingredients || [];
        if (typeof ingredients === "string") {
          try {
            ingredients = JSON.parse(ingredients);
          } catch {
            ingredients = ingredients.split(",").map((name, i) => ({ id: String(i + 1), name: name.trim() }));
          }
        }
        let instructions = r.instructions || "";
        if (typeof instructions === "string") {
          try {
            const parsed = JSON.parse(instructions);
            if (typeof parsed === "string" || Array.isArray(parsed)) {
              instructions = parsed;
            }
          } catch {
          }
        }
        const formattedRecipe = {
          id: r.id,
          title: r.title,
          description: r.description,
          yield_amount: r.yieldAmount,
          prep_time_minutes: r.prepTimeMinutes,
          cook_time_minutes: r.cookTimeMinutes,
          total_time_minutes: r.totalTimeMinutes,
          image_url: r.imageUrl,
          source_url: r.sourceUrl,
          notes: r.notes,
          ingredients,
          instructions,
          tags: r.tags || {},
          created_at: r.createdAt.toISOString(),
          updated_at: r.updatedAt.toISOString()
        };
        conflicts.push({
          recipe: formattedRecipe,
          violations
        });
      }
    }
    res.json({
      totalConflicts: conflicts.length,
      conflicts
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to get conflicts:", err);
    res.status(500).json({ error: "Failed to analyze metadata conflicts", details });
  }
});
var conflicts_default = router5;

// server/src/routes/templates.ts
import { Router as Router6 } from "express";
import { and as and2, desc as desc2, eq as eq6, isNull as isNull2 } from "drizzle-orm";
var router6 = Router6();
function formatTemplate(t, v, allVersions) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    isDefault: t.isDefault,
    currentVersionId: t.currentVersionId,
    currentVersion: v ? {
      id: v.id,
      templateId: v.templateId,
      version: v.version,
      changeSummary: v.changeSummary,
      fieldsSchema: v.fieldsSchema,
      cardLayout: v.cardLayout,
      createdAt: v.createdAt.toISOString()
    } : void 0,
    versions: allVersions == null ? void 0 : allVersions.map((ver) => ({
      id: ver.id,
      templateId: ver.templateId,
      version: ver.version,
      changeSummary: ver.changeSummary,
      fieldsSchema: ver.fieldsSchema,
      cardLayout: ver.cardLayout,
      createdAt: ver.createdAt.toISOString()
    })),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString()
  };
}
router6.get("/", async (_req, res) => {
  try {
    const templateRows = await db.select().from(templates).where(isNull2(templates.deletedAt)).orderBy(desc2(templates.isDefault), desc2(templates.createdAt));
    const versionRows = await db.select().from(templateVersions);
    const versionMap = /* @__PURE__ */ new Map();
    for (const v of versionRows) {
      versionMap.set(v.id, v);
    }
    const result = templateRows.map(
      (t) => formatTemplate(t, versionMap.get(t.currentVersionId))
    );
    res.json(result);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch templates:", err);
    res.status(500).json({ error: "Failed to fetch templates", details });
  }
});
router6.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [templateRow] = await db.select().from(templates).where(and2(eq6(templates.id, id), isNull2(templates.deletedAt)));
    if (!templateRow) {
      return res.status(404).json({ error: "Template not found" });
    }
    const allVersions = await db.select().from(templateVersions).where(eq6(templateVersions.templateId, id)).orderBy(desc2(templateVersions.version));
    const currentVersion = allVersions.find((v) => v.id === templateRow.currentVersionId) || allVersions[0];
    res.json(formatTemplate(templateRow, currentVersion, allVersions));
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch template detail:", err);
    res.status(500).json({ error: "Failed to fetch template", details });
  }
});
router6.post("/:id/check-field-usage", async (req, res) => {
  var _a;
  try {
    const { id } = req.params;
    const { fieldIds } = req.body;
    if (!Array.isArray(fieldIds) || fieldIds.length === 0) {
      return res.json([]);
    }
    const reports = [];
    for (const fieldId of fieldIds) {
      const result = await pool.query(
        `SELECT id, title FROM recipes 
         WHERE template_id = $1 
           AND deleted_at IS NULL
           AND field_values ? $2 
           AND (field_values->>$2) IS NOT NULL 
           AND (field_values->>$2) != '' 
           AND (field_values->>$2) != '[]' 
           AND (field_values->>$2) != '{}'
         LIMIT 10`,
        [id, fieldId]
      );
      const countResult = await pool.query(
        `SELECT COUNT(*)::int as count FROM recipes 
         WHERE template_id = $1 
           AND deleted_at IS NULL
           AND field_values ? $2 
           AND (field_values->>$2) IS NOT NULL 
           AND (field_values->>$2) != '' 
           AND (field_values->>$2) != '[]' 
           AND (field_values->>$2) != '{}'`,
        [id, fieldId]
      );
      const usedByCount = ((_a = countResult.rows[0]) == null ? void 0 : _a.count) || 0;
      reports.push({
        fieldId,
        inUse: usedByCount > 0,
        usedByCount,
        recipeTitles: result.rows.map((r) => r.title)
      });
    }
    res.json(reports);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to check field usage:", err);
    res.status(500).json({ error: "Failed to check field usage", details });
  }
});
router6.post("/", async (req, res) => {
  try {
    const body = req.body;
    if (!body.name || !body.name.trim()) {
      return res.status(400).json({ error: "Template name is required" });
    }
    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (body.isDefault) {
      await db.update(templates).set({ isDefault: false }).where(eq6(templates.isDefault, true));
    }
    const [createdVersion] = await db.insert(templateVersions).values({
      templateId,
      version: 1,
      changeSummary: "Initial version",
      fieldsSchema: body.fieldsSchema || [],
      cardLayout: body.cardLayout || { columns: 4, widgets: [] }
    }).returning();
    const [createdTemplate] = await db.insert(templates).values({
      id: templateId,
      name: body.name.trim(),
      description: body.description ? body.description.trim() : "",
      isDefault: Boolean(body.isDefault),
      currentVersionId: createdVersion.id
    }).returning();
    res.status(201).json(formatTemplate(createdTemplate, createdVersion, [createdVersion]));
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to create template:", err);
    res.status(500).json({ error: "Failed to create template", details });
  }
});
router6.put("/:id", async (req, res) => {
  var _a, _b;
  try {
    const { id } = req.params;
    const body = req.body;
    const [existing] = await db.select().from(templates).where(and2(eq6(templates.id, id), isNull2(templates.deletedAt)));
    if (!existing) {
      return res.status(404).json({ error: "Template not found" });
    }
    const [latestVersion] = await db.select().from(templateVersions).where(eq6(templateVersions.id, existing.currentVersionId));
    const prevFields = (latestVersion == null ? void 0 : latestVersion.fieldsSchema) || [];
    const newFields = body.fieldsSchema || [];
    const prevFieldIds = new Set(prevFields.map((f) => f.id));
    const newFieldIds = new Set(newFields.map((f) => f.id));
    const removedFieldIds = [...prevFieldIds].filter((fid) => !newFieldIds.has(fid));
    if (removedFieldIds.length > 0 && !body.archiveRemovedFields && !body.confirmPurgeRemovedFields) {
      const inUseFields = [];
      for (const fid of removedFieldIds) {
        const countRes = await pool.query(
          `SELECT COUNT(*)::int as count FROM recipes 
           WHERE template_id = $1 
             AND deleted_at IS NULL
             AND field_values ? $2 
             AND (field_values->>$2) IS NOT NULL 
             AND (field_values->>$2) != '' 
             AND (field_values->>$2) != '[]' 
             AND (field_values->>$2) != '{}'`,
          [id, fid]
        );
        const count2 = ((_a = countRes.rows[0]) == null ? void 0 : _a.count) || 0;
        if (count2 > 0) {
          const sampleRes = await pool.query(
            `SELECT title FROM recipes 
             WHERE template_id = $1 
               AND deleted_at IS NULL
               AND field_values ? $2 
             LIMIT 5`,
            [id, fid]
          );
          const fieldDef = prevFields.find((f) => f.id === fid);
          inUseFields.push({
            fieldId: fid,
            name: (fieldDef == null ? void 0 : fieldDef.name) || fid,
            usedByCount: count2,
            recipeTitles: sampleRes.rows.map((r) => r.title)
          });
        }
      }
      if (inUseFields.length > 0) {
        return res.status(409).json({
          error: "Removed fields contain data in existing recipes",
          requiresResolution: true,
          inUseFields
        });
      }
    }
    let finalFieldsSchema = newFields;
    if (body.archiveRemovedFields && removedFieldIds.length > 0) {
      const archivedFields = prevFields.filter((f) => removedFieldIds.includes(f.id)).map((f) => ({ ...f, isArchived: true }));
      finalFieldsSchema = [...newFields, ...archivedFields];
    }
    const allVersions = await db.select({ version: templateVersions.version }).from(templateVersions).where(eq6(templateVersions.templateId, id));
    const nextVersionNumber = Math.max(...allVersions.map((v) => v.version), 0) + 1;
    if (body.isDefault) {
      await db.update(templates).set({ isDefault: false }).where(eq6(templates.isDefault, true));
    }
    const [newVersionRow] = await db.insert(templateVersions).values({
      templateId: id,
      version: nextVersionNumber,
      changeSummary: ((_b = body.changeSummary) == null ? void 0 : _b.trim()) || `Updated to version ${nextVersionNumber}`,
      fieldsSchema: finalFieldsSchema,
      cardLayout: body.cardLayout || (latestVersion == null ? void 0 : latestVersion.cardLayout) || { columns: 4, widgets: [] }
    }).returning();
    const updatePayload = {
      currentVersionId: newVersionRow.id,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (body.name !== void 0) updatePayload.name = body.name.trim();
    if (body.description !== void 0) updatePayload.description = body.description.trim();
    if (body.isDefault !== void 0) updatePayload.isDefault = Boolean(body.isDefault);
    const [updatedTemplate] = await db.update(templates).set(updatePayload).where(eq6(templates.id, id)).returning();
    if (body.confirmPurgeRemovedFields && removedFieldIds.length > 0) {
      for (const fid of removedFieldIds) {
        await pool.query(
          `UPDATE recipes 
           SET archived_values = archived_values || jsonb_build_object($2, field_values->$2),
               field_values = field_values - $2
           WHERE template_id = $1 AND field_values ? $2`,
          [id, fid]
        );
      }
    }
    res.json(formatTemplate(updatedTemplate, newVersionRow));
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to update template:", err);
    res.status(500).json({ error: "Failed to update template", details });
  }
});
router6.post("/:id/rollback", async (req, res) => {
  try {
    const { id } = req.params;
    const { targetVersionId } = req.body;
    const [templateRow] = await db.select().from(templates).where(and2(eq6(templates.id, id), isNull2(templates.deletedAt)));
    if (!templateRow) {
      return res.status(404).json({ error: "Template not found" });
    }
    const [targetVersion] = await db.select().from(templateVersions).where(and2(eq6(templateVersions.id, targetVersionId), eq6(templateVersions.templateId, id)));
    if (!targetVersion) {
      return res.status(404).json({ error: "Target version not found" });
    }
    const allVersions = await db.select({ version: templateVersions.version }).from(templateVersions).where(eq6(templateVersions.templateId, id));
    const nextVersionNumber = Math.max(...allVersions.map((v) => v.version), 0) + 1;
    const [rollbackVersion] = await db.insert(templateVersions).values({
      templateId: id,
      version: nextVersionNumber,
      changeSummary: `Rolled back to v${targetVersion.version}`,
      fieldsSchema: targetVersion.fieldsSchema,
      cardLayout: targetVersion.cardLayout
    }).returning();
    const [updatedTemplate] = await db.update(templates).set({
      currentVersionId: rollbackVersion.id,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq6(templates.id, id)).returning();
    res.json(formatTemplate(updatedTemplate, rollbackVersion));
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to rollback template:", err);
    res.status(500).json({ error: "Failed to rollback template", details });
  }
});
router6.post("/:id/duplicate", async (req, res) => {
  try {
    const { id } = req.params;
    const [sourceTemplate] = await db.select().from(templates).where(and2(eq6(templates.id, id), isNull2(templates.deletedAt)));
    if (!sourceTemplate) {
      return res.status(404).json({ error: "Source template not found" });
    }
    const [sourceVersion] = await db.select().from(templateVersions).where(eq6(templateVersions.id, sourceTemplate.currentVersionId));
    const newTemplateId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const [newVersion] = await db.insert(templateVersions).values({
      templateId: newTemplateId,
      version: 1,
      changeSummary: `Cloned from ${sourceTemplate.name}`,
      fieldsSchema: (sourceVersion == null ? void 0 : sourceVersion.fieldsSchema) || [],
      cardLayout: (sourceVersion == null ? void 0 : sourceVersion.cardLayout) || { columns: 4, widgets: [] }
    }).returning();
    const [newTemplate] = await db.insert(templates).values({
      id: newTemplateId,
      name: `${sourceTemplate.name} (Copy)`,
      description: sourceTemplate.description,
      isDefault: false,
      currentVersionId: newVersion.id
    }).returning();
    res.status(201).json(formatTemplate(newTemplate, newVersion, [newVersion]));
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to duplicate template:", err);
    res.status(500).json({ error: "Failed to duplicate template", details });
  }
});
router6.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id === "tpl_default") {
      return res.status(400).json({ error: "The default template cannot be deleted." });
    }
    await pool.query(
      `UPDATE recipes 
       SET template_id = 'tpl_default', template_version_id = 1 
       WHERE template_id = $1`,
      [id]
    );
    await db.update(templates).set({ deletedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq6(templates.id, id));
    res.json({ success: true, message: "Template removed successfully" });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to delete template:", err);
    res.status(500).json({ error: "Failed to delete template", details });
  }
});
var templates_default = router6;

// server/src/index.ts
var app = express();
app.use(cors());
app.use(express.json());
app.use("/api/health", health_default);
app.use("/api/config", config_default);
app.use("/api/tags", tags_default);
app.use("/api/conflicts", conflicts_default);
app.use("/api/templates", templates_default);
app.use("/api/recipes", recipes_default);
if (fs.existsSync(config.clientDistPath)) {
  console.log(`[Server] Serving static client build from ${config.clientDistPath}`);
  app.use(express.static(config.clientDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path2.join(config.clientDistPath, "index.html"));
  });
}
async function startServer() {
  try {
    await migrateDb().catch((err) => {
      console.warn("[Server] Initial DB migration failed, server will continue startup:", err.message);
    });
    app.listen(config.port, "0.0.0.0", () => {
      console.log(`[Server] Larder backend is listening on http://0.0.0.0:${config.port}`);
      console.log(`[Server] Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error("[Server] Fatal startup error:", err);
    process.exit(1);
  }
}
startServer();
