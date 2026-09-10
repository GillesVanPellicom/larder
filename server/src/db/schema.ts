import { pgTable, serial, varchar, text, integer, jsonb, timestamp, boolean, numeric } from 'drizzle-orm/pg-core'
import type {
  FilterCriteria,
  InstructionStep,
  MandatoryFieldsConfig,
  RecipeTags,
  RecipeViolation,
} from '../../../shared/types'

export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').default('').notNull(),
  yieldAmount: integer('yield_amount').default(4).notNull(),
  yieldUnit: varchar('yield_unit', { length: 50 }).default('servings').notNull(),
  prepTimeMinutes: integer('prep_time_minutes').default(0).notNull(),
  cookTimeMinutes: integer('cook_time_minutes').default(0).notNull(),
  totalTimeMinutes: integer('total_time_minutes').default(0).notNull(),
  imageUrl: text('image_url').default('').notNull(),
  sourceUrl: text('source_url').default('').notNull(),
  instructions: jsonb('instructions').$type<string | InstructionStep[]>().default('').notNull(),
  tags: jsonb('tags').$type<RecipeTags>().default({}).notNull(),
  hasViolations: boolean('has_violations').default(false).notNull(),
  violations: jsonb('violations').$type<RecipeViolation[]>().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id, { onDelete: 'restrict' }),
  amount: varchar('amount', { length: 50 }).default('').notNull(),
  unit: varchar('unit', { length: 50 }).default('').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const tagCategories = pgTable('tag_categories', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 50 }).default('neutral').notNull(),
  exclusive: boolean('exclusive').default(false).notNull(),
  minTags: integer('min_tags').default(0),
  maxTags: integer('max_tags'),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const metadataConfigTable = pgTable('metadata_config', {
  id: varchar('id', { length: 50 }).primaryKey(),
  mandatoryFields: jsonb('mandatory_fields').$type<MandatoryFieldsConfig>().notNull(),
  mandatoryCategories: jsonb('mandatory_categories').$type<string[]>().default([]).notNull(),
  timeTrackingMode: varchar('time_tracking_mode', { length: 50 }).default('prep_and_cook'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const filterTemplates = pgTable('filter_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  criteria: jsonb('criteria').$type<FilterCriteria>().notNull(),
  useCount: integer('use_count').default(0).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const shoppingListItems = pgTable('shopping_list_items', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  checkedIngredients: jsonb('checked_ingredients').$type<string[]>().default([]).notNull(),
  multiplier: numeric('multiplier').default('1').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const shoppingListHistory = pgTable('shopping_list_history', {
  id: serial('id').primaryKey(),
  recipeIds: jsonb('recipe_ids').$type<number[]>().default([]).notNull(),
  recipeTitles: jsonb('recipe_titles').$type<string[]>().default([]).notNull(),
  recipeMultipliers: jsonb('recipe_multipliers').$type<Record<string, number>>().default({}).notNull(),
  ingredientCount: integer('ingredient_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type IngredientRow = typeof ingredients.$inferSelect
export type NewIngredientRow = typeof ingredients.$inferInsert
export type RecipeRow = typeof recipes.$inferSelect
export type NewRecipeRow = typeof recipes.$inferInsert
export type RecipeIngredientRow = typeof recipeIngredients.$inferSelect
export type NewRecipeIngredientRow = typeof recipeIngredients.$inferInsert
export type TagCategoryRow = typeof tagCategories.$inferSelect
export type MetadataConfigRow = typeof metadataConfigTable.$inferSelect
export type FilterTemplateRow = typeof filterTemplates.$inferSelect
export type NewFilterTemplateRow = typeof filterTemplates.$inferInsert
export type ShoppingListItemRow = typeof shoppingListItems.$inferSelect
export type NewShoppingListItemRow = typeof shoppingListItems.$inferInsert
export type ShoppingListHistoryRow = typeof shoppingListHistory.$inferSelect
export type NewShoppingListHistoryRow = typeof shoppingListHistory.$inferInsert
