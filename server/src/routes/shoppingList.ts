import { Router } from 'express'
import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import { recipes, shoppingListItems, shoppingListHistory } from '../db/schema'
import { attachIngredientsToRecipes } from '../services/recipeQueryService'
import type { ShoppingListHistoryItem, ShoppingListItem } from '../../../shared/types'

const router = Router()

// GET /api/shopping-list - Retrieve active shopping list items and recent history
router.get('/', async (_req, res) => {
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

    const formattedHistory: ShoppingListHistoryItem[] = historyRows.map((h) => ({
      id: h.id,
      recipe_ids: h.recipeIds || [],
      recipe_titles: h.recipeTitles || [],
      ingredient_count: h.ingredientCount,
      created_at: h.createdAt.toISOString(),
    }))

    res.json({
      items: formattedItems,
      history: formattedHistory,
    })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('[API ERROR] Failed to fetch shopping list:', err)
    res.status(500).json({ error: 'Failed to retrieve shopping list', details })
  }
})

// POST /api/shopping-list - Add or update a recipe in the shopping list
router.post('/', async (req, res) => {
  try {
    const { recipeId, checkedIngredients = [], multiplier = 1 } = req.body

    if (!recipeId || typeof recipeId !== 'number') {
      return res.status(400).json({ error: 'Valid recipeId is required' })
    }

    // Check if recipe exists
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId))
    if (!recipe || recipe.deletedAt) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Upsert into shopping_list_items
    const existing = await db
      .select()
      .from(shoppingListItems)
      .where(eq(shoppingListItems.recipeId, recipeId))

    if (existing.length > 0) {
      const updatePayload: Record<string, unknown> = {
        checkedIngredients,
        updatedAt: new Date(),
      }
      if (req.body.multiplier !== undefined) {
        updatePayload.multiplier = String(multiplier)
      }
      await db
        .update(shoppingListItems)
        .set(updatePayload)
        .where(eq(shoppingListItems.recipeId, recipeId))
    } else {
      await db.insert(shoppingListItems).values({
        recipeId,
        checkedIngredients,
        multiplier: String(multiplier || 1),
        sortOrder: 0,
      })
    }

    // Return the updated full item
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

    res.status(201).json(result)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('[API ERROR] Failed to add recipe to shopping list:', err)
    res.status(500).json({ error: 'Failed to add to shopping list', details })
  }
})

// PUT /api/shopping-list/:recipeId/checked - Update checked ingredients for a recipe
router.put('/:recipeId/checked', async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId, 10)
    const { checkedIngredients } = req.body

    if (isNaN(recipeId) || !Array.isArray(checkedIngredients)) {
      return res.status(400).json({ error: 'Invalid recipeId or checkedIngredients array' })
    }

    const [updated] = await db
      .update(shoppingListItems)
      .set({
        checkedIngredients,
        updatedAt: new Date(),
      })
      .where(eq(shoppingListItems.recipeId, recipeId))
      .returning()

    if (!updated) {
      return res.status(404).json({ error: 'Recipe not found in shopping list' })
    }

    res.json({ success: true, checked_ingredients: updated.checkedIngredients })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('[API ERROR] Failed to update checked ingredients:', err)
    res.status(500).json({ error: 'Failed to update checked ingredients', details })
  }
})

// PUT /api/shopping-list/:recipeId/multiplier - Update yield multiplier for a recipe
router.put('/:recipeId/multiplier', async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId, 10)
    const multiplier = parseFloat(req.body.multiplier)

    if (isNaN(recipeId) || isNaN(multiplier) || multiplier <= 0) {
      return res.status(400).json({ error: 'Valid recipeId and positive multiplier number are required' })
    }

    const [updated] = await db
      .update(shoppingListItems)
      .set({
        multiplier: String(multiplier),
        updatedAt: new Date(),
      })
      .where(eq(shoppingListItems.recipeId, recipeId))
      .returning()

    if (!updated) {
      return res.status(404).json({ error: 'Recipe not found in shopping list' })
    }

    res.json({ success: true, multiplier: Number(updated.multiplier || 1) })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('[API ERROR] Failed to update shopping list multiplier:', err)
    res.status(500).json({ error: 'Failed to update multiplier', details })
  }
})

// DELETE /api/shopping-list/:recipeId - Remove a recipe from the shopping list
router.delete('/:recipeId', async (req, res) => {
  try {
    const recipeId = parseInt(req.params.recipeId, 10)
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: 'Invalid recipeId' })
    }

    await db.delete(shoppingListItems).where(eq(shoppingListItems.recipeId, recipeId))
    res.json({ success: true, recipeId })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('[API ERROR] Failed to remove recipe from shopping list:', err)
    res.status(500).json({ error: 'Failed to remove from shopping list', details })
  }
})

// POST /api/shopping-list/clear - Clear the entire shopping list and archive snapshot to history
router.post('/clear', async (_req, res) => {
  try {
    // 1. Read active items to create history snapshot
    const listRows = await db.select().from(shoppingListItems)

    if (listRows.length > 0) {
      const recipeIds = listRows.map((r) => r.recipeId)
      const recipeRows = await db
        .select({ id: recipes.id, title: recipes.title })
        .from(recipes)
        .where(inArray(recipes.id, recipeIds))

      const recipeTitles = recipeRows.map((r) => r.title)

      // Calculate total unique ingredients for the snapshot
      const fullRecipes = await attachIngredientsToRecipes(
        await db.select().from(recipes).where(inArray(recipes.id, recipeIds))
      )
      const uniqueNames = new Set(
        fullRecipes.flatMap((r) => r.ingredients.map((ing) => ing.name.trim().toLowerCase()))
      )

      await db.insert(shoppingListHistory).values({
        recipeIds,
        recipeTitles,
        ingredientCount: uniqueNames.size,
      })

      // Keep only the most recent 10 history snapshots
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

      // 2. Delete all active items
      await db.delete(shoppingListItems)
    }

    res.json({ success: true })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('[API ERROR] Failed to clear shopping list:', err)
    res.status(500).json({ error: 'Failed to clear shopping list', details })
  }
})

// POST /api/shopping-list/load-history/:id - Restore recipes from a history snapshot
router.post('/load-history/:id', async (req, res) => {
  try {
    const historyId = parseInt(req.params.id, 10)
    if (isNaN(historyId)) {
      return res.status(400).json({ error: 'Invalid history ID' })
    }

    const [history] = await db
      .select()
      .from(shoppingListHistory)
      .where(eq(shoppingListHistory.id, historyId))

    if (!history) {
      return res.status(404).json({ error: 'History record not found' })
    }

    const recipeIds = history.recipeIds || []
    if (recipeIds.length > 0) {
      // Insert into shopping list items (ignore if already in list)
      for (const rId of recipeIds) {
        const existing = await db
          .select()
          .from(shoppingListItems)
          .where(eq(shoppingListItems.recipeId, rId))

        if (existing.length === 0) {
          // Verify recipe exists
          const [exists] = await db
            .select({ id: recipes.id })
            .from(recipes)
            .where(eq(recipes.id, rId))

          if (exists) {
            await db.insert(shoppingListItems).values({
              recipeId: rId,
              checkedIngredients: [],
              sortOrder: 0,
            })
          }
        }
      }
    }

    res.json({ success: true, loadedRecipeIds: recipeIds })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('[API ERROR] Failed to load shopping list history:', err)
    res.status(500).json({ error: 'Failed to load history', details })
  }
})

// DELETE /api/shopping-list/history/:id - Delete a historical snapshot
router.delete('/history/:id', async (req, res) => {
  try {
    const historyId = parseInt(req.params.id, 10)
    if (isNaN(historyId)) {
      return res.status(400).json({ error: 'Invalid history ID' })
    }

    await db.delete(shoppingListHistory).where(eq(shoppingListHistory.id, historyId))
    res.json({ success: true, id: historyId })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('[API ERROR] Failed to delete shopping list history entry:', err)
    res.status(500).json({ error: 'Failed to delete history item', details })
  }
})

export default router
