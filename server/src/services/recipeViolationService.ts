import { eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { metadataConfigTable, recipes, tagCategories } from '../db/schema'
import type {
  InstructionStep,
  MetadataConfig,
  RecipeViolation,
  TagCategory,
  TimeTrackingMode,
} from '../../../shared/types'

export interface RecipeFieldsForValidation {
  title?: string | null
  imageUrl?: string | null
  image_url?: string | null
  description?: string | null
  yieldAmount?: number | null
  yield_amount?: number | null
  prepTimeMinutes?: number | null
  prep_time_minutes?: number | null
  cookTimeMinutes?: number | null
  cook_time_minutes?: number | null
  totalTimeMinutes?: number | null
  total_time_minutes?: number | null
  ingredients?: unknown
  instructions?: string | InstructionStep[] | unknown
  tags?: Record<string, string[]> | null
}

export class RecipeViolationService {
  /**
   * Pure evaluation of violations for a given recipe against metadata config and tag categories.
   */
  computeViolations(
    r: RecipeFieldsForValidation,
    config: MetadataConfig,
    categories: TagCategory[]
  ): RecipeViolation[] {
    const violations: RecipeViolation[] = []
    const mandatory = config.mandatoryFields || {
      title: true,
      ingredients: true,
      instructions: true,
      image_url: false,
      description: false,
      yield_amount: false,
      prep_time_minutes: false,
      cook_time_minutes: false,
      source_url: false,
    }
    const timeTrackingMode = config.timeTrackingMode || 'prep_and_cook'
    const mandatoryCategories = config.mandatoryCategories || []

    const title = r.title ?? ''
    const imageUrl = r.imageUrl ?? r.image_url ?? ''
    const description = r.description ?? ''
    const yieldAmount = r.yieldAmount ?? r.yield_amount ?? 0
    const prepTime = r.prepTimeMinutes ?? r.prep_time_minutes ?? 0
    const cookTime = r.cookTimeMinutes ?? r.cook_time_minutes ?? 0
    const totalTime = r.totalTimeMinutes ?? r.total_time_minutes ?? 0

    // 1. Mandatory Title
    if (mandatory.title && (!title || !title.trim())) {
      violations.push({ field: 'title', message: 'Title is mandatory' })
    }

    // 2. Mandatory Image
    if (mandatory.image_url && (!imageUrl || !imageUrl.trim())) {
      violations.push({
        field: 'image_url',
        message: 'Recipe image is mandatory under current configuration',
      })
    }

    // 3. Mandatory Description
    if (mandatory.description && (!description || !description.trim())) {
      violations.push({ field: 'description', message: 'Description is mandatory' })
    }

    // 4. Mandatory Yield
    if (mandatory.yield_amount && (!yieldAmount || yieldAmount <= 0)) {
      violations.push({ field: 'yield_amount', message: 'Yield is mandatory' })
    }

    // 5. Time Tracking rules
    if (timeTrackingMode !== 'no_cook') {
      if (timeTrackingMode === 'total_only') {
        if (mandatory.prep_time_minutes && prepTime <= 0 && totalTime <= 0) {
          violations.push({ field: 'prep_time_minutes', message: 'Total time is mandatory' })
        }
      } else if (timeTrackingMode === 'prep_and_cook') {
        if (mandatory.prep_time_minutes && prepTime <= 0) {
          violations.push({ field: 'prep_time_minutes', message: 'Preparation time is mandatory' })
        }
        if (mandatory.cook_time_minutes && cookTime <= 0) {
          violations.push({ field: 'cook_time_minutes', message: 'Cooking time is mandatory' })
        }
      }
    }

    // 6. Mandatory Ingredients
    let ingredientsCount = 0
    if (Array.isArray(r.ingredients)) {
      ingredientsCount = r.ingredients.length
    } else if (typeof r.ingredients === 'string') {
      try {
        const parsed = JSON.parse(r.ingredients)
        if (Array.isArray(parsed)) ingredientsCount = parsed.length
      } catch {
        ingredientsCount = r.ingredients.trim() ? 1 : 0
      }
    }
    if (mandatory.ingredients && ingredientsCount === 0) {
      violations.push({ field: 'ingredients', message: `At least one ingredient is required (has ${ingredientsCount})` })
    }

    // 7. Mandatory Instructions
    if (mandatory.instructions) {
      const instr = r.instructions
      if (!instr) {
        violations.push({
          field: 'instructions',
          message: 'Instructions are required under current metadata rules',
        })
      } else if (typeof instr === 'string') {
        const textOnly = instr.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
        if (!textOnly) {
          violations.push({
            field: 'instructions',
            message: 'Instructions are required under current metadata rules',
          })
        }
      } else if (Array.isArray(instr) && instr.length === 0) {
        violations.push({
          field: 'instructions',
          message: 'Instructions are required under current metadata rules',
        })
      }
    }

    // 8. Tag Category Range & Taxonomy checks (min_tags, max_tags, exclusive, mandatory)
    const recipeTags = r.tags || {}
    for (const cat of categories) {
      const catTags = (recipeTags[cat.id] || []) as string[]
      const count = Array.isArray(catTags) ? catTags.length : 0
      const totalCatTags = (cat.tags || []).length
      const isMandatoryByConfig = mandatoryCategories.includes(cat.id)

      const minAllowed =
        cat.min_tags !== null && cat.min_tags !== undefined
          ? cat.min_tags
          : isMandatoryByConfig || cat.exclusive
          ? 1
          : 0

      const maxAllowed =
        cat.max_tags !== null && cat.max_tags !== undefined
          ? cat.max_tags
          : cat.exclusive
          ? 1
          : totalCatTags

      if (count < minAllowed) {
        violations.push({
          field: `tags.${cat.id}`,
          message:
            minAllowed === 1
              ? `Must have at least 1 tag in category "${cat.name}" (has ${count})`
              : `Must have at least ${minAllowed} tags in category "${cat.name}" (has ${count})`,
        })
      } else if (count > maxAllowed) {
        violations.push({
          field: `tags.${cat.id}`,
          message:
            maxAllowed === 0
              ? `Category "${cat.name}" allows no tags (max 0, has ${count}: ${catTags.join(', ')})`
              : maxAllowed === 1
              ? `Category "${cat.name}" allows at most 1 tag (has ${count}: ${catTags.join(', ')})`
              : `Category "${cat.name}" allows at most ${maxAllowed} tags (has ${count}: ${catTags.join(', ')})`,
        })
      }
    }

    return violations
  }

  /**
   * Load active config and category definitions from DB.
   */
  async loadConfigAndCategories(): Promise<{ config: MetadataConfig; categories: TagCategory[] }> {
    const [configRow] = await db
      .select()
      .from(metadataConfigTable)
      .where(eq(metadataConfigTable.id, 'global'))

    const config: MetadataConfig = {
      mandatoryFields: configRow?.mandatoryFields || {
        title: true,
        ingredients: true,
        instructions: true,
        image_url: false,
        description: false,
        yield_amount: false,
        prep_time_minutes: false,
        cook_time_minutes: false,
        source_url: false,
      },
      mandatoryCategories: configRow?.mandatoryCategories || [],
      timeTrackingMode: (configRow?.timeTrackingMode as TimeTrackingMode) || 'prep_and_cook',
    }

    const catRows = await db.select().from(tagCategories)
    const categories: TagCategory[] = catRows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      exclusive: r.exclusive ?? false,
      min_tags: r.minTags !== null && r.minTags !== undefined ? r.minTags : (r.exclusive ? 1 : 0),
      max_tags: r.maxTags !== null && r.maxTags !== undefined ? r.maxTags : (r.exclusive ? 1 : (r.tags?.length || 0)),
      tags: r.tags || [],
    }))

    return { config, categories }
  }

  /**
   * Compute violations for a single in-flight recipe payload against current DB rules.
   */
  async getViolationsForPayload(
    payload: RecipeFieldsForValidation
  ): Promise<{ hasViolations: boolean; violations: RecipeViolation[] }> {
    const { config, categories } = await this.loadConfigAndCategories()
    const violations = this.computeViolations(payload, config, categories)
    return {
      hasViolations: violations.length > 0,
      violations,
    }
  }

  /**
   * Recalculate and update violation status for all non-deleted recipes in the database.
   */
  async recalculateAllViolations(): Promise<void> {
    try {
      const { config, categories } = await this.loadConfigAndCategories()
      const { attachIngredientsToRecipes } = await import('./recipeQueryService')
      const allRecipes = await db
        .select()
        .from(recipes)
        .where(isNull(recipes.deletedAt))

      const formattedRecipes = await attachIngredientsToRecipes(allRecipes)

      for (const r of formattedRecipes) {
        const violations = this.computeViolations(r, config, categories)
        const hasViolations = violations.length > 0

        if (r.has_violations !== hasViolations || JSON.stringify(r.violations) !== JSON.stringify(violations)) {
          await db
            .update(recipes)
            .set({
              hasViolations,
              violations,
            })
            .where(eq(recipes.id, r.id))
        }
      }
    } catch (err) {
      console.error('[RecipeViolationService] Failed to recalculate all violations:', err)
    }
  }
}

export const recipeViolationService = new RecipeViolationService()
