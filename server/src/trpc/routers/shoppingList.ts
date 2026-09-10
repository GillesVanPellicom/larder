import { z } from 'zod'
import { desc, eq, inArray } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { db } from '../../db'
import { recipes, shoppingListItems, shoppingListHistory, shoppingListStoreAssignments } from '../../db/schema'
import { attachIngredientsToRecipes } from '../../services/recipeQueryService'
import type { Recipe, ShoppingListHistoryItem, ShoppingListItem } from '../../../../shared/types'

export const shoppingListRouter = router({
  get: publicProcedure.query(async () => {
    try {
      // 1. Fetch active shopping list items
      const listRows = await db
        .select()
        .from(shoppingListItems)
        .orderBy(shoppingListItems.sortOrder, shoppingListItems.createdAt)

      let formattedItems: ShoppingListItem[] = []

      if (listRows.length > 0) {
        const recipeIds = listRows.map((r) => r.recipeId)
        const recipeRows = await db
          .select()
          .from(recipes)
          .where(inArray(recipes.id, recipeIds))

        const fullRecipes = await attachIngredientsToRecipes(recipeRows)
        const recipesMap = new Map(fullRecipes.map((r) => [r.id, r]))

        formattedItems = listRows
          .map((row) => {
            const recipe = recipesMap.get(row.recipeId)
            if (!recipe) return null
            return {
              id: row.id,
              recipe_id: row.recipeId,
              recipe,
              checked_ingredients: row.checkedIngredients || [],
              multiplier: Number(row.multiplier || 1),
              sort_order: row.sortOrder,
              created_at: row.createdAt.toISOString(),
              updated_at: row.updatedAt.toISOString(),
            }
          })
          .filter((item): item is ShoppingListItem => item !== null)
      }

      // 2. Fetch recent shopping list history snapshots (most recent 10)
      const historyRows = await db
        .select()
        .from(shoppingListHistory)
        .orderBy(desc(shoppingListHistory.createdAt))
        .limit(10)

      let historyRecipesMap = new Map<number, Recipe>()
      const allHistoryRecipeIds = Array.from(
        new Set(historyRows.flatMap((h) => h.recipeIds || []))
      )

      if (allHistoryRecipeIds.length > 0) {
        const historyRecipeRows = await db
          .select()
          .from(recipes)
          .where(inArray(recipes.id, allHistoryRecipeIds))
        const fullHistoryRecipes = await attachIngredientsToRecipes(historyRecipeRows)
        historyRecipesMap = new Map(fullHistoryRecipes.map((r) => [r.id, r]))
      }

      const formattedHistory: ShoppingListHistoryItem[] = historyRows.map((h) => {
        const snapshotRecipes = (h.recipeIds || [])
          .map((id) => historyRecipesMap.get(id))
          .filter((r): r is NonNullable<typeof r> => r !== undefined)

        return {
          id: h.id,
          recipe_ids: h.recipeIds || [],
          recipe_titles: h.recipeTitles || [],
          recipe_multipliers: (h.recipeMultipliers as Record<string, number>) || {},
          ingredient_count: h.ingredientCount,
          created_at: h.createdAt.toISOString(),
          recipes: snapshotRecipes,
        }
      })

      // 3. Fetch store assignments
      const [assignmentRow] = await db
        .select()
        .from(shoppingListStoreAssignments)
        .where(eq(shoppingListStoreAssignments.id, 'current'))

      return {
        items: formattedItems,
        history: formattedHistory,
        storeAssignments: (assignmentRow?.assignments as Record<string, string[]>) || {},
      }
    } catch (err: unknown) {
      console.error('[tRPC ERROR] Failed to fetch shopping list:', err)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Failed to retrieve shopping list',
      })
    }
  }),

  saveStoreAssignments: publicProcedure
    .input(
      z.object({
        assignments: z.record(z.string(), z.array(z.string())),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { assignments } = input
        const [existing] = await db
          .select()
          .from(shoppingListStoreAssignments)
          .where(eq(shoppingListStoreAssignments.id, 'current'))

        if (existing) {
          await db
            .update(shoppingListStoreAssignments)
            .set({
              assignments,
              updatedAt: new Date(),
            })
            .where(eq(shoppingListStoreAssignments.id, 'current'))
        } else {
          await db.insert(shoppingListStoreAssignments).values({
            id: 'current',
            assignments,
            updatedAt: new Date(),
          })
        }

        return { success: true, assignments }
      } catch (err: unknown) {
        console.error('[tRPC ERROR] Failed to update store assignments:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to update store assignments',
        })
      }
    }),

  addItem: publicProcedure
    .input(
      z.object({
        recipeId: z.number(),
        checkedIngredients: z.array(z.string()).optional().default([]),
        multiplier: z.number().optional().default(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { recipeId, checkedIngredients, multiplier } = input

        const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId))
        if (!recipe || recipe.deletedAt) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Recipe not found',
          })
        }

        const existing = await db
          .select()
          .from(shoppingListItems)
          .where(eq(shoppingListItems.recipeId, recipeId))

        if (existing.length > 0) {
          await db
            .update(shoppingListItems)
            .set({
              checkedIngredients,
              multiplier: String(multiplier),
              updatedAt: new Date(),
            })
            .where(eq(shoppingListItems.recipeId, recipeId))
        } else {
          await db.insert(shoppingListItems).values({
            recipeId,
            checkedIngredients,
            multiplier: String(multiplier),
            sortOrder: 0,
          })
        }

        const [itemRow] = await db
          .select()
          .from(shoppingListItems)
          .where(eq(shoppingListItems.recipeId, recipeId))

        const [fullRecipe] = await attachIngredientsToRecipes([recipe])

        const result: ShoppingListItem = {
          id: itemRow.id,
          recipe_id: itemRow.recipeId,
          recipe: fullRecipe,
          checked_ingredients: itemRow.checkedIngredients || [],
          multiplier: Number(itemRow.multiplier || 1),
          sort_order: itemRow.sortOrder,
          created_at: itemRow.createdAt.toISOString(),
          updated_at: itemRow.updatedAt.toISOString(),
        }

        return result
      } catch (err: unknown) {
        if (err instanceof TRPCError) throw err
        console.error('[tRPC ERROR] Failed to add recipe to shopping list:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to add to shopping list',
        })
      }
    }),

  updateChecked: publicProcedure
    .input(
      z.object({
        recipeId: z.number(),
        checkedIngredients: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { recipeId, checkedIngredients } = input
        const [updated] = await db
          .update(shoppingListItems)
          .set({
            checkedIngredients,
            updatedAt: new Date(),
          })
          .where(eq(shoppingListItems.recipeId, recipeId))
          .returning()

        if (!updated) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Recipe not found in shopping list',
          })
        }

        return { success: true, checked_ingredients: updated.checkedIngredients || [] }
      } catch (err: unknown) {
        if (err instanceof TRPCError) throw err
        console.error('[tRPC ERROR] Failed to update checked ingredients:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to update checked ingredients',
        })
      }
    }),

  updateMultiplier: publicProcedure
    .input(
      z.object({
        recipeId: z.number(),
        multiplier: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { recipeId, multiplier } = input
        const [updated] = await db
          .update(shoppingListItems)
          .set({
            multiplier: String(multiplier),
            updatedAt: new Date(),
          })
          .where(eq(shoppingListItems.recipeId, recipeId))
          .returning()

        if (!updated) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Recipe not found in shopping list',
          })
        }

        return { success: true, multiplier: Number(updated.multiplier || 1) }
      } catch (err: unknown) {
        if (err instanceof TRPCError) throw err
        console.error('[tRPC ERROR] Failed to update shopping list multiplier:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to update multiplier',
        })
      }
    }),

  removeItem: publicProcedure
    .input(
      z.object({
        recipeId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { recipeId } = input
        await db.delete(shoppingListItems).where(eq(shoppingListItems.recipeId, recipeId))
        return { success: true, recipeId }
      } catch (err: unknown) {
        console.error('[tRPC ERROR] Failed to remove recipe from shopping list:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to remove from shopping list',
        })
      }
    }),

  clear: publicProcedure.mutation(async () => {
    try {
      const listRows = await db.select().from(shoppingListItems)

      if (listRows.length > 0) {
        const recipeIds = listRows.map((r) => r.recipeId)
        const recipeRows = await db
          .select({ id: recipes.id, title: recipes.title })
          .from(recipes)
          .where(inArray(recipes.id, recipeIds))

        const recipeTitles = recipeRows.map((r) => r.title)

        const recipeMultipliers: Record<string, number> = {}
        for (const r of listRows) {
          recipeMultipliers[String(r.recipeId)] = Number(r.multiplier || 1)
        }

        const fullRecipes = await attachIngredientsToRecipes(
          await db.select().from(recipes).where(inArray(recipes.id, recipeIds))
        )
        const uniqueNames = new Set(
          fullRecipes.flatMap((r) => r.ingredients.map((ing) => ing.name.trim().toLowerCase()))
        )

        await db.insert(shoppingListHistory).values({
          recipeIds,
          recipeTitles,
          recipeMultipliers,
          ingredientCount: uniqueNames.size,
        })

        const allHistories = await db
          .select({ id: shoppingListHistory.id })
          .from(shoppingListHistory)
          .orderBy(desc(shoppingListHistory.createdAt))

        if (allHistories.length > 10) {
          const toDeleteIds = allHistories.slice(10).map((h) => h.id)
          if (toDeleteIds.length > 0) {
            await db.delete(shoppingListHistory).where(inArray(shoppingListHistory.id, toDeleteIds))
          }
        }

        await db.delete(shoppingListItems)

        await db
          .update(shoppingListStoreAssignments)
          .set({ assignments: {}, updatedAt: new Date() })
          .where(eq(shoppingListStoreAssignments.id, 'current'))
      }

      return { success: true }
    } catch (err: unknown) {
      console.error('[tRPC ERROR] Failed to clear shopping list:', err)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Failed to clear shopping list',
      })
    }
  }),

  loadHistory: publicProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const [history] = await db
          .select()
          .from(shoppingListHistory)
          .where(eq(shoppingListHistory.id, input.id))

        if (!history) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'History record not found',
          })
        }

        const recipeIds = history.recipeIds || []
        const multipliers = (history.recipeMultipliers as Record<string, number>) || {}

        if (recipeIds.length > 0) {
          for (const rId of recipeIds) {
            const itemMultiplier = multipliers[String(rId)] ?? multipliers[rId] ?? 1

            const existing = await db
              .select()
              .from(shoppingListItems)
              .where(eq(shoppingListItems.recipeId, rId))

            if (existing.length === 0) {
              const [exists] = await db
                .select({ id: recipes.id })
                .from(recipes)
                .where(eq(recipes.id, rId))

              if (exists) {
                await db.insert(shoppingListItems).values({
                  recipeId: rId,
                  checkedIngredients: [],
                  multiplier: String(itemMultiplier),
                  sortOrder: 0,
                })
              }
            } else {
              await db
                .update(shoppingListItems)
                .set({
                  multiplier: String(itemMultiplier),
                  updatedAt: new Date(),
                })
                .where(eq(shoppingListItems.recipeId, rId))
            }
          }
        }

        return { success: true, loadedRecipeIds: recipeIds }
      } catch (err: unknown) {
        if (err instanceof TRPCError) throw err
        console.error('[tRPC ERROR] Failed to load shopping list history:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to load history',
        })
      }
    }),

  deleteHistory: publicProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await db.delete(shoppingListHistory).where(eq(shoppingListHistory.id, input.id))
        return { success: true, id: input.id }
      } catch (err: unknown) {
        console.error('[tRPC ERROR] Failed to delete shopping list history entry:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to delete history item',
        })
      }
    }),
})
