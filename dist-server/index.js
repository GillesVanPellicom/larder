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
  recipes: () => recipes,
  tagCategories: () => tagCategories
});
import { pgTable, serial, varchar, text, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var tagCategories = pgTable("tag_categories", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 50 }).default("neutral").notNull(),
  exclusive: boolean("exclusive").default(false).notNull(),
  tags: jsonb("tags").$type().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var metadataConfigTable = pgTable("metadata_config", {
  id: varchar("id", { length: 50 }).primaryKey(),
  mandatoryFields: jsonb("mandatory_fields").$type().notNull(),
  mandatoryCategories: jsonb("mandatory_categories").$type().default([]).notNull(),
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

        CREATE TABLE IF NOT EXISTS metadata_config (
          id VARCHAR(50) PRIMARY KEY,
          mandatory_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
          mandatory_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
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
            cook_time_minutes: false,
            total_time_minutes: false
          },
          mandatoryCategories: []
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
import { desc, eq as eq2 } from "drizzle-orm";
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
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString()
  };
}
router2.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(recipes).orderBy(desc(recipes.id));
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
    const [row] = await db.select().from(recipes).where(eq2(recipes.id, id));
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
router2.post("/", async (req, res) => {
  try {
    const body = req.body;
    if (!body.title || !body.title.trim()) {
      return res.status(400).json({ error: "Recipe title is required" });
    }
    const prep = Number(body.prep_time_minutes) || 0;
    const cook = Number(body.cook_time_minutes) || 0;
    const total = Number(body.total_time_minutes) || prep + cook;
    const [created] = await db.insert(recipes).values({
      title: body.title.trim(),
      description: body.description ? body.description.trim() : "",
      yieldAmount: body.yield_amount ? body.yield_amount.trim() : "",
      prepTimeMinutes: prep,
      cookTimeMinutes: cook,
      totalTimeMinutes: total,
      imageUrl: body.image_url ? body.image_url.trim() : "",
      sourceUrl: body.source_url ? body.source_url.trim() : "",
      notes: body.notes ? body.notes.trim() : "",
      ingredients: body.ingredients || [],
      instructions: body.instructions !== void 0 ? body.instructions : "",
      tags: body.tags || {}
    }).returning();
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
    const prep = body.prep_time_minutes !== void 0 ? Number(body.prep_time_minutes) : void 0;
    const cook = body.cook_time_minutes !== void 0 ? Number(body.cook_time_minutes) : void 0;
    const total = body.total_time_minutes !== void 0 ? Number(body.total_time_minutes) : prep !== void 0 && cook !== void 0 ? prep + cook : void 0;
    const updatePayload = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (body.title !== void 0) updatePayload.title = body.title.trim();
    if (body.description !== void 0) updatePayload.description = body.description.trim();
    if (body.yield_amount !== void 0) updatePayload.yieldAmount = body.yield_amount.trim();
    if (prep !== void 0) updatePayload.prepTimeMinutes = prep;
    if (cook !== void 0) updatePayload.cookTimeMinutes = cook;
    if (total !== void 0) updatePayload.totalTimeMinutes = total;
    if (body.image_url !== void 0) updatePayload.imageUrl = body.image_url.trim();
    if (body.source_url !== void 0) updatePayload.sourceUrl = body.source_url.trim();
    if (body.notes !== void 0) updatePayload.notes = body.notes.trim();
    if (body.ingredients !== void 0) updatePayload.ingredients = body.ingredients;
    if (body.instructions !== void 0) updatePayload.instructions = body.instructions;
    if (body.tags !== void 0) updatePayload.tags = body.tags;
    const [updated] = await db.update(recipes).set(updatePayload).where(eq2(recipes.id, id)).returning();
    if (!updated) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(formatRecipe(updated));
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to update recipe:", err);
    res.status(500).json({ error: "Failed to update recipe", details });
  }
});
router2.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }
    const [deleted] = await db.delete(recipes).where(eq2(recipes.id, id)).returning({ id: recipes.id });
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
          cook_time_minutes: false,
          total_time_minutes: false
        },
        mandatoryCategories: []
      };
      return res.json(defaultConfig);
    }
    const row = rows[0];
    const config2 = {
      mandatoryFields: row.mandatoryFields,
      mandatoryCategories: row.mandatoryCategories,
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
    const { mandatoryFields, mandatoryCategories } = req.body;
    if (!mandatoryFields) {
      return res.status(400).json({ error: "mandatoryFields is required" });
    }
    mandatoryFields.title = true;
    mandatoryFields.ingredients = true;
    mandatoryFields.instructions = true;
    const [updated] = await db.insert(metadataConfigTable).values({
      id: "global",
      mandatoryFields,
      mandatoryCategories: mandatoryCategories || [],
      updatedAt: /* @__PURE__ */ new Date()
    }).onConflictDoUpdate({
      target: metadataConfigTable.id,
      set: {
        mandatoryFields,
        mandatoryCategories: mandatoryCategories || [],
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    res.json({
      mandatoryFields: updated.mandatoryFields,
      mandatoryCategories: updated.mandatoryCategories,
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
    const result = rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      exclusive: r.exclusive ?? false,
      tags: r.tags || [],
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString()
    }));
    res.json(result);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("Failed to get tag categories:", err);
    res.status(500).json({ error: "Failed to retrieve tag categories", details });
  }
});
router4.post("/categories", async (req, res) => {
  try {
    const { id, name, color, exclusive, tags } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }
    const categoryId = (id || name).toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");
    const [created] = await db.insert(tagCategories).values({
      id: categoryId,
      name: name.trim(),
      color: color || "neutral",
      exclusive: Boolean(exclusive),
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
    const { name, color, exclusive } = req.body;
    const updatePayload = {
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (name !== void 0) updatePayload.name = name.trim();
    if (color !== void 0) updatePayload.color = color;
    if (exclusive !== void 0) updatePayload.exclusive = Boolean(exclusive);
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
    await db.update(tagCategories).set({
      tags: updatedCategoryTags,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq4(tagCategories.id, categoryId));
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
        violations.push({ field: "yield_amount", message: "Yield / Servings is mandatory" });
      }
      if (mandatory.prep_time_minutes && (!r.prepTimeMinutes || r.prepTimeMinutes <= 0)) {
        violations.push({ field: "prep_time_minutes", message: "Preparation time is mandatory" });
      }
      if (mandatory.cook_time_minutes && (!r.cookTimeMinutes || r.cookTimeMinutes <= 0)) {
        violations.push({ field: "cook_time_minutes", message: "Cooking time is mandatory" });
      }
      if (mandatory.total_time_minutes && (!r.totalTimeMinutes || r.totalTimeMinutes <= 0)) {
        violations.push({ field: "total_time_minutes", message: "Total time is mandatory" });
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

// server/src/index.ts
var app = express();
app.use(cors());
app.use(express.json());
app.use("/api/health", health_default);
app.use("/api/config", config_default);
app.use("/api/tags", tags_default);
app.use("/api/conflicts", conflicts_default);
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
