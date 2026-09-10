import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { publicProcedure, router } from '../trpc'
import { db, pool } from '../../db'
import { recipes, tagCategories } from '../../db/schema'
import { recipeViolationService } from '../../services/recipeViolationService'
import type { TagCategory } from '../../../../shared/types'

export const tagsRouter = router({
  list: publicProcedure.query(async (): Promise<TagCategory[]> => {
    const rows = await db.select().from(tagCategories)
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      exclusive: r.exclusive ?? false,
      min_tags: r.minTags !== null && r.minTags !== undefined ? r.minTags : (r.exclusive ? 1 : 0),
      max_tags: r.maxTags !== null && r.maxTags !== undefined ? r.maxTags : (r.exclusive ? 1 : (r.tags?.length || 0)),
      tags: r.tags || [],
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    }))
  }),

  createCategory: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, 'Category name is required'),
        color: z.string().optional().default('neutral'),
        exclusive: z.boolean().optional().default(false),
        min_tags: z.number().optional().default(0),
        max_tags: z.number().optional(),
        tags: z.array(z.string()).optional().default([]),
      })
    )
    .mutation(async ({ input }) => {
      const categoryId = (input.id || input.name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]/g, '-')

      const [created] = await db
        .insert(tagCategories)
        .values({
          id: categoryId,
          name: input.name.trim(),
          color: input.color || 'neutral',
          exclusive: Boolean(input.exclusive),
          minTags: input.min_tags !== undefined ? input.min_tags : 0,
          maxTags: input.max_tags !== undefined ? input.max_tags : (input.tags ? input.tags.length : 0),
          tags: input.tags || [],
        })
        .returning()

      await recipeViolationService.recalculateAllViolations()

      return {
        id: created.id,
        name: created.name,
        color: created.color,
        exclusive: created.exclusive ?? false,
        min_tags: created.minTags ?? 0,
        max_tags: created.maxTags ?? 0,
        tags: created.tags || [],
        created_at: created.createdAt.toISOString(),
        updated_at: created.updatedAt.toISOString(),
      }
    }),

  updateCategory: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          color: z.string().optional(),
          exclusive: z.boolean().optional(),
          min_tags: z.number().optional(),
          max_tags: z.number().optional(),
          tags: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const updatePayload: Record<string, unknown> = {
        updatedAt: new Date(),
      }
      if (input.data.name !== undefined) updatePayload.name = input.data.name.trim()
      if (input.data.color !== undefined) updatePayload.color = input.data.color
      if (input.data.exclusive !== undefined) updatePayload.exclusive = Boolean(input.data.exclusive)
      if (input.data.min_tags !== undefined) updatePayload.minTags = input.data.min_tags
      if (input.data.max_tags !== undefined) updatePayload.maxTags = input.data.max_tags
      if (input.data.tags !== undefined) updatePayload.tags = input.data.tags

      const [updated] = await db
        .update(tagCategories)
        .set(updatePayload)
        .where(eq(tagCategories.id, input.id))
        .returning()

      if (!updated) {
        throw new Error('Tag category not found')
      }

      await recipeViolationService.recalculateAllViolations()

      return {
        id: updated.id,
        name: updated.name,
        color: updated.color,
        exclusive: updated.exclusive ?? false,
        min_tags: updated.minTags ?? 0,
        max_tags: updated.maxTags ?? 0,
        tags: updated.tags || [],
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      }
    }),

  addTag: publicProcedure
    .input(
      z.object({
        categoryId: z.string(),
        tag: z.string().min(1, 'Tag name is required'),
      })
    )
    .mutation(async ({ input }) => {
      const trimmedTag = input.tag.trim()
      const [category] = await db
        .select()
        .from(tagCategories)
        .where(eq(tagCategories.id, input.categoryId))

      if (!category) {
        throw new Error('Category not found')
      }

      const currentTags = category.tags || []
      if (currentTags.some((t: string) => t.toLowerCase() === trimmedTag.toLowerCase())) {
        throw new Error('Tag already exists in this category')
      }

      const updatedTags = [...currentTags, trimmedTag]
      const [updated] = await db
        .update(tagCategories)
        .set({
          tags: updatedTags,
          updatedAt: new Date(),
        })
        .where(eq(tagCategories.id, input.categoryId))
        .returning()

      await recipeViolationService.recalculateAllViolations()

      return {
        id: updated.id,
        name: updated.name,
        color: updated.color,
        exclusive: updated.exclusive ?? false,
        min_tags: updated.minTags ?? 0,
        max_tags: updated.maxTags ?? 0,
        tags: updated.tags || [],
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      }
    }),

  renameTag: publicProcedure
    .input(
      z.object({
        categoryId: z.string(),
        oldName: z.string().min(1),
        newName: z.string().min(1, 'New name is required'),
      })
    )
    .mutation(async ({ input }) => {
      const trimmedNew = input.newName.trim()
      const [category] = await db
        .select()
        .from(tagCategories)
        .where(eq(tagCategories.id, input.categoryId))

      if (!category) {
        throw new Error('Category not found')
      }

      const updatedCategoryTags = (category.tags || []).map((t: string) =>
        t === input.oldName ? trimmedNew : t
      )

      await db
        .update(tagCategories)
        .set({
          tags: updatedCategoryTags,
          updatedAt: new Date(),
        })
        .where(eq(tagCategories.id, input.categoryId))

      const usingResult = await pool.query<{ id: number; tags: Record<string, string[]> }>(
        `SELECT id, tags FROM recipes WHERE deleted_at IS NULL AND coalesce(tags->$1, '[]'::jsonb) ? $2`,
        [input.categoryId, input.oldName]
      )
      let affectedRecipesCount = 0

      for (const r of usingResult.rows) {
        const catTags = r.tags?.[input.categoryId]
        if (Array.isArray(catTags) && catTags.includes(input.oldName)) {
          const nextCatTags = catTags.map((t: string) => (t === input.oldName ? trimmedNew : t))
          const nextTags = {
            ...r.tags,
            [input.categoryId]: nextCatTags,
          }
          await db
            .update(recipes)
            .set({
              tags: nextTags,
              updatedAt: new Date(),
            })
            .where(eq(recipes.id, r.id))

          affectedRecipesCount++
        }
      }

      await recipeViolationService.recalculateAllViolations()

      return {
        success: true,
        categoryId: input.categoryId,
        oldName: input.oldName,
        newName: trimmedNew,
        affectedRecipesCount,
      }
    }),

  getTagUsage: publicProcedure
    .input(
      z.object({
        categoryId: z.string(),
        tag: z.string(),
      })
    )
    .query(async ({ input }) => {
      const usingResult = await pool.query<{ id: number; title: string }>(
        `SELECT id, title FROM recipes WHERE deleted_at IS NULL AND coalesce(tags->$1, '[]'::jsonb) ? $2`,
        [input.categoryId, input.tag]
      )

      return {
        categoryId: input.categoryId,
        tag: input.tag,
        count: usingResult.rows.length,
        recipes: usingResult.rows.map((r: { id: number; title: string }) => ({ id: r.id, title: r.title })),
      }
    }),

  deleteTag: publicProcedure
    .input(
      z.object({
        categoryId: z.string(),
        tag: z.string(),
        resolution: z.enum(['strip', 'reassign']).optional(),
        reassignTo: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [category] = await db
        .select()
        .from(tagCategories)
        .where(eq(tagCategories.id, input.categoryId))

      if (!category) {
        throw new Error('Category not found')
      }

      const usingResult = await pool.query<{ id: number; title: string; tags: Record<string, string[]> }>(
        `SELECT id, title, tags FROM recipes WHERE deleted_at IS NULL AND coalesce(tags->$1, '[]'::jsonb) ? $2`,
        [input.categoryId, input.tag]
      )
      const usingRecipes = usingResult.rows

      if (usingRecipes.length > 0 && !input.resolution) {
        return {
          conflict: true as const,
          error: 'Tag is currently used by recipes',
          usageCount: usingRecipes.length,
          recipes: usingRecipes.map((r: { id: number; title: string }) => ({ id: r.id, title: r.title })),
          availableTags: (category.tags || []).filter((t: string) => t !== input.tag),
        }
      }

      if (usingRecipes.length > 0) {
        for (const r of usingRecipes) {
          const catTags = r.tags[input.categoryId] || []
          let nextCatTags: string[]

          if (input.resolution === 'reassign' && input.reassignTo) {
            nextCatTags = catTags.map((t: string) => (t === input.tag ? input.reassignTo! : t))
            nextCatTags = Array.from(new Set(nextCatTags))
          } else {
            nextCatTags = catTags.filter((t: string) => t !== input.tag)
          }

          const nextTags = {
            ...r.tags,
            [input.categoryId]: nextCatTags,
          }

          await db
            .update(recipes)
            .set({
              tags: nextTags,
              updatedAt: new Date(),
            })
            .where(eq(recipes.id, r.id))
        }
      }

      const updatedCategoryTags = (category.tags || []).filter((t: string) => t !== input.tag)
      const newCount = updatedCategoryTags.length
      const updatePayload: Record<string, unknown> = {
        tags: updatedCategoryTags,
        updatedAt: new Date(),
      }
      if (category.maxTags !== null && category.maxTags !== undefined && category.maxTags > newCount) {
        updatePayload.maxTags = Math.max(0, newCount)
      }
      if (category.minTags !== null && category.minTags !== undefined && category.minTags > newCount) {
        updatePayload.minTags = Math.max(0, newCount)
      }

      await db
        .update(tagCategories)
        .set(updatePayload)
        .where(eq(tagCategories.id, input.categoryId))

      await recipeViolationService.recalculateAllViolations()

      return {
        conflict: false as const,
        success: true as const,
        categoryId: input.categoryId,
        deletedTag: input.tag,
        resolution: input.resolution || 'none',
        affectedRecipesCount: usingRecipes.length,
      }
    }),

  deleteCategory: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const [cat] = await db.select().from(tagCategories).where(eq(tagCategories.id, input.id))
      if (!cat) {
        throw new Error('Category not found')
      }
      if (cat.tags && cat.tags.length > 0) {
        throw new Error('Cannot delete category that still contains tags. Delete or move tags first.')
      }

      await db.delete(tagCategories).where(eq(tagCategories.id, input.id))
      await recipeViolationService.recalculateAllViolations()

      return { success: true, id: input.id }
    }),
})
