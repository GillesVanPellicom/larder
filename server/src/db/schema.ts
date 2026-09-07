import { pgTable, serial, varchar, text, integer, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core'
import type { IngredientItem, InstructionStep, MandatoryFieldsConfig, RecipeTags } from '../../../shared/types'

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').default('').notNull(),
  yieldAmount: varchar('yield_amount', { length: 100 }).default('').notNull(),
  prepTimeMinutes: integer('prep_time_minutes').default(0).notNull(),
  cookTimeMinutes: integer('cook_time_minutes').default(0).notNull(),
  totalTimeMinutes: integer('total_time_minutes').default(0).notNull(),
  imageUrl: text('image_url').default('').notNull(),
  sourceUrl: text('source_url').default('').notNull(),
  notes: text('notes').default('').notNull(),
  ingredients: jsonb('ingredients').$type<IngredientItem[]>().default([]).notNull(),
  instructions: jsonb('instructions').$type<string | InstructionStep[]>().default('').notNull(),
  tags: jsonb('tags').$type<RecipeTags>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const tagCategories = pgTable('tag_categories', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 50 }).default('neutral').notNull(),
  exclusive: boolean('exclusive').default(false).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const metadataConfigTable = pgTable('metadata_config', {
  id: varchar('id', { length: 50 }).primaryKey(),
  mandatoryFields: jsonb('mandatory_fields').$type<MandatoryFieldsConfig>().notNull(),
  mandatoryCategories: jsonb('mandatory_categories').$type<string[]>().default([]).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type RecipeRow = typeof recipes.$inferSelect
export type NewRecipeRow = typeof recipes.$inferInsert
export type TagCategoryRow = typeof tagCategories.$inferSelect
export type MetadataConfigRow = typeof metadataConfigTable.$inferSelect
