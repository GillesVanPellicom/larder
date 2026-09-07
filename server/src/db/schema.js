import { pgTable, serial, varchar, text, integer, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';
export const templates = pgTable('templates', {
    id: varchar('id', { length: 64 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').default('').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    currentVersionId: integer('current_version_id').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
export const templateVersions = pgTable('template_versions', {
    id: serial('id').primaryKey(),
    templateId: varchar('template_id', { length: 64 }).notNull(),
    version: integer('version').notNull(),
    changeSummary: varchar('change_summary', { length: 255 }).default('').notNull(),
    fieldsSchema: jsonb('fields_schema').$type().notNull(),
    cardLayout: jsonb('card_layout').$type().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
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
    ingredients: jsonb('ingredients').$type().default([]).notNull(),
    instructions: jsonb('instructions').$type().default('').notNull(),
    tags: jsonb('tags').$type().default({}).notNull(),
    // Template & dynamic field values
    templateId: varchar('template_id', { length: 64 }).default('tpl_default').notNull(),
    templateVersionId: integer('template_version_id').default(1).notNull(),
    fieldValues: jsonb('field_values').$type().default({}).notNull(),
    archivedValues: jsonb('archived_values').$type().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
export const recipeHistory = pgTable('recipe_history', {
    id: serial('id').primaryKey(),
    recipeId: integer('recipe_id').notNull(),
    templateVersionId: integer('template_version_id').notNull(),
    snapshot: jsonb('snapshot').$type().notNull(),
    savedAt: timestamp('saved_at', { withTimezone: true }).defaultNow().notNull(),
});
export const tagCategories = pgTable('tag_categories', {
    id: varchar('id', { length: 100 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 50 }).default('neutral').notNull(),
    exclusive: boolean('exclusive').default(false).notNull(),
    tags: jsonb('tags').$type().default([]).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
export const metadataConfigTable = pgTable('metadata_config', {
    id: varchar('id', { length: 50 }).primaryKey(),
    mandatoryFields: jsonb('mandatory_fields').$type().notNull(),
    mandatoryCategories: jsonb('mandatory_categories').$type().default([]).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
