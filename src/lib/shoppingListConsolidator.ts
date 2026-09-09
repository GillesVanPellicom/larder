import { formatGracefulNumber, scaleAmount } from './recipeMath'
import type { ConsolidatedIngredient, ShoppingListItem } from '@/shared/types'

/**
 * Parses numeric value from ingredient amount string (supports decimals and simple fractions).
 * Returns null if the amount is absent, unparseable, or non-numeric (e.g. 'to taste', 'pinch', '').
 */
export function parseAmountNumber(rawAmount?: string): number | null {
  if (!rawAmount) return null
  const trimmed = rawAmount.trim()
  if (!trimmed) return null

  // Mixed fraction like "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1])
    const num = parseFloat(mixedMatch[2])
    const den = parseFloat(mixedMatch[3])
    if (den !== 0) return whole + num / den
  }

  // Simple fraction like "1/2" or "3/4"
  const fracMatch = trimmed.match(/^(\d+)\/(\d+)$/)
  if (fracMatch) {
    const num = parseFloat(fracMatch[1])
    const den = parseFloat(fracMatch[2])
    if (den !== 0) return num / den
  }

  // Plain float / integer like "12", "0.5", "12.5"
  const parsed = parseFloat(trimmed)
  if (!isNaN(parsed) && isFinite(parsed)) {
    return parsed
  }

  return null
}

/**
 * Normalizes unit string for aggregation (e.g. "grams" -> "g", "tablespoon" -> "tbsp").
 */
export function normalizeUnit(rawUnit?: string): { key: string; display: string } {
  if (!rawUnit) return { key: '', display: '' }
  const trimmed = rawUnit.trim().toLowerCase()
  if (!trimmed) return { key: '', display: '' }

  if (trimmed === 'g' || trimmed === 'gram' || trimmed === 'grams') return { key: 'g', display: 'g' }
  if (trimmed === 'kg' || trimmed === 'kilogram' || trimmed === 'kilograms') return { key: 'kg', display: 'kg' }
  if (trimmed === 'ml' || trimmed === 'milliliter' || trimmed === 'milliliters') return { key: 'ml', display: 'ml' }
  if (trimmed === 'l' || trimmed === 'liter' || trimmed === 'liters') return { key: 'l', display: 'l' }
  if (trimmed === 'tbsp' || trimmed === 'tablespoon' || trimmed === 'tablespoons') return { key: 'tbsp', display: 'tbsp' }
  if (trimmed === 'tsp' || trimmed === 'teaspoon' || trimmed === 'teaspoons') return { key: 'tsp', display: 'tsp' }
  if (trimmed === 'cup' || trimmed === 'cups') return { key: 'cup', display: 'cups' }
  if (trimmed === 'clove' || trimmed === 'cloves') return { key: 'clove', display: 'cloves' }
  if (trimmed === 'can' || trimmed === 'cans') return { key: 'can', display: 'cans' }
  if (trimmed === 'slice' || trimmed === 'slices') return { key: 'slice', display: 'slices' }
  if (trimmed === 'pinch' || trimmed === 'pinches') return { key: 'pinch', display: 'pinches' }

  return { key: trimmed, display: rawUnit.trim() }
}

/**
 * Consolidates all ingredients across active shopping list recipes.
 * Aggregates quantities by unit and provides unique count.
 */
export function consolidateShoppingList(shoppingItems: ShoppingListItem[]): {
  consolidated: ConsolidatedIngredient[]
  uniqueCount: number
} {
  const groupsMap = new Map<
    string,
    {
      displayName: string
      instances: ConsolidatedIngredient['instances']
    }
  >()

  // 1. Gather all ingredient instances
  for (const item of shoppingItems) {
    const recipe = item.recipe
    if (!recipe || !Array.isArray(recipe.ingredients)) continue

    const multiplier = item.multiplier || 1
    const checkedSet = new Set(item.checked_ingredients || [])

    recipe.ingredients.forEach((ing, index) => {
      const name = (ing.name || '').trim()
      if (!name) return

      const normKey = name.toLowerCase()
      const itemKey = String(ing.id ?? index)
      const isChecked = checkedSet.has(itemKey)
      const scaledAmount = ing.amount ? scaleAmount(ing.amount, multiplier) : ''

      if (!groupsMap.has(normKey)) {
        groupsMap.set(normKey, {
          displayName: name,
          instances: [],
        })
      }

      groupsMap.get(normKey)!.instances.push({
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        amount: scaledAmount,
        unit: (ing.unit || '').trim(),
        itemKey,
        isChecked,
      })
    })
  }

  // 2. Consolidate quantities per group
  const consolidated: ConsolidatedIngredient[] = []

  for (const [, group] of groupsMap.entries()) {
    const { displayName, instances } = group
    const allChecked = instances.length > 0 && instances.every((i) => i.isChecked)
    const someChecked = instances.some((i) => i.isChecked)
    const isChecked = allChecked
    const isPartial = someChecked && !allChecked

    // Aggregate by normalized unit
    const unitTotals = new Map<string, { display: string; sum: number }>()
    let hasExtra = false

    for (const inst of instances) {
      const num = parseAmountNumber(inst.amount)
      if (num !== null) {
        const { key, display } = normalizeUnit(inst.unit)
        if (!unitTotals.has(key)) {
          unitTotals.set(key, { display, sum: 0 })
        }
        unitTotals.get(key)!.sum += num
      } else {
        hasExtra = true
      }
    }

    // Build consolidated string: e.g. "32g + 3" or "2 + 12g + extra"
    const parts: string[] = []

    // Units with non-empty display first (e.g. 32g), then unitless (e.g. 3)
    const sortedUnitEntries = Array.from(unitTotals.entries()).sort(([aKey], [bKey]) => {
      if (aKey === '' && bKey !== '') return 1
      if (aKey !== '' && bKey === '') return -1
      return aKey.localeCompare(bKey)
    })

    for (const [, data] of sortedUnitEntries) {
      const formattedNum = formatGracefulNumber(data.sum)
      if (data.display) {
        // e.g. "32g" or "2 tbsp"
        const separator = data.display.length <= 2 ? '' : ' '
        parts.push(`${formattedNum}${separator}${data.display}`)
      } else {
        parts.push(formattedNum)
      }
    }

    if (hasExtra) {
      if (parts.length > 0) {
        parts.push('extra')
      }
    }

    const displayQuantity = parts.join(' + ')

    consolidated.push({
      name: displayName,
      displayQuantity,
      instances,
      isChecked,
      isPartial,
    })
  }

  // Sort alphabetically by name
  consolidated.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  return {
    consolidated,
    uniqueCount: consolidated.length,
  }
}
