import type { IngredientItem } from '@/shared/types'

/**
 * Formats any number with a graceful cutoff of at most 2 decimal places.
 * Trailing zeroes after decimal are dropped (e.g. 2 -> "2", 2.5 -> "2.5", 2.3333 -> "2.33").
 */
export function formatGracefulNumber(num: number): string {
  if (isNaN(num) || !isFinite(num)) return ''
  const rounded = Math.round(num * 100) / 100
  return rounded.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    useGrouping: false,
  })
}

/**
 * Parses a fractional or decimal string into a number.
 * Handles "1 1/2", "3/4", "0.5", "2", etc.
 */
export function parseAmountToNumber(amountStr: string): number | null {
  const trimmed = amountStr.trim()
  if (!trimmed) return null

  // Mixed fraction: "1 1/2" or "2 3/4"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1])
    const num = parseFloat(mixedMatch[2])
    const den = parseFloat(mixedMatch[3])
    if (den !== 0) {
      return whole + num / den
    }
  }

  // Simple fraction: "1/2" or "3/4"
  const fracMatch = trimmed.match(/^(\d+)\/(\d+)$/)
  if (fracMatch) {
    const num = parseFloat(fracMatch[1])
    const den = parseFloat(fracMatch[2])
    if (den !== 0) {
      return num / den
    }
  }

  // Simple number: "2", "2.5"
  const num = parseFloat(trimmed)
  if (!isNaN(num) && isFinite(num)) {
    return num
  }

  return null
}

/**
 * Scales an ingredient quantity string by a multiplier.
 * Handles single numbers, fractions, mixed numbers, ranges, and keeps non-numeric text intact.
 * Always applies graceful cutoff of 2 decimal places.
 */
export function scaleAmount(
  rawAmount: string | number | undefined | null,
  multiplier: number
): string {
  if (rawAmount === undefined || rawAmount === null) return ''
  if (typeof rawAmount === 'number') {
    return formatGracefulNumber(rawAmount * multiplier)
  }

  const str = String(rawAmount).trim()
  if (!str) return ''

  // Range pattern: "2 - 3" or "2-3" or "2 to 3"
  const rangeMatch = str.match(/^([\d\s/.]+)\s*(-|–|to)\s*([\d\s/.]+)$/i)
  if (rangeMatch) {
    const firstVal = parseAmountToNumber(rangeMatch[1])
    const sep = rangeMatch[2]
    const secondVal = parseAmountToNumber(rangeMatch[3])
    if (firstVal !== null && secondVal !== null) {
      const scaled1 = formatGracefulNumber(firstVal * multiplier)
      const scaled2 = formatGracefulNumber(secondVal * multiplier)
      return `${scaled1} ${sep} ${scaled2}`
    }
  }

  // Try direct parse (handles "1 1/2", "3/4", "2.5", "2")
  const parsed = parseAmountToNumber(str)
  if (parsed !== null) {
    return formatGracefulNumber(parsed * multiplier)
  }

  // Number with trailing text, e.g. "2 pinches", "1.5 cups" (if unit was placed in amount)
  const prefixMatch = str.match(/^([\d\s/.]+)\s+(.*)$/)
  if (prefixMatch) {
    const prefixNum = parseAmountToNumber(prefixMatch[1])
    if (prefixNum !== null) {
      return `${formatGracefulNumber(prefixNum * multiplier)} ${prefixMatch[2]}`
    }
  }

  // Fallback: non-numeric string (e.g. "a pinch", "to taste")
  return str
}

/**
 * Scales a yield string by a multiplier.
 * e.g. "6 servings" * 0.5 -> "3 servings"
 * "Serves 4 to 6" * 2 -> "Serves 8 to 12"
 * "6" * 0.5 -> "3"
 */
export function scaleYield(
  yieldValue: number | string | undefined | null,
  multiplier: number,
  unit?: string | null
): string {
  if (typeof yieldValue === 'number') {
    if (yieldValue <= 0) return multiplier === 1 ? '' : `${formatGracefulNumber(multiplier)}×`
    const scaledNum = formatGracefulNumber(yieldValue * multiplier)
    const trimmedUnit = unit?.trim() || 'servings'
    return `${scaledNum} ${trimmedUnit}`
  }

  if (!yieldValue || !String(yieldValue).trim()) {
    return multiplier === 1 ? '' : `${formatGracefulNumber(multiplier)}×`
  }

  const text = String(yieldValue).trim()

  // Range inside text: "Serves 4 to 6" or "4 - 6 portions"
  const rangeMatch = text.match(/^(\D*)(\d+(?:\.\d+)?)\s*(-|–|to)\s*(\d+(?:\.\d+)?)(\D*)$/i)
  if (rangeMatch) {
    const prefix = rangeMatch[1]
    const n1 = parseFloat(rangeMatch[2]) * multiplier
    const sep = rangeMatch[3]
    const n2 = parseFloat(rangeMatch[4]) * multiplier
    const suffix = rangeMatch[5]
    return `${prefix}${formatGracefulNumber(n1)} ${sep} ${formatGracefulNumber(n2)}${suffix}`
  }

  // Single number inside text: "6 servings" or "6"
  const singleMatch = text.match(/^(\D*)(\d+(?:\.\d+)?)(\D*)$/)
  if (singleMatch) {
    const prefix = singleMatch[1]
    const num = parseFloat(singleMatch[2]) * multiplier
    const suffix = singleMatch[3]
    return `${prefix}${formatGracefulNumber(num)}${suffix}`
  }

  // If no number found but multiplier != 1
  if (multiplier !== 1) {
    return `${formatGracefulNumber(multiplier)}× (${text})`
  }

  return text
}

/**
 * Scales an array of ingredients by a multiplier.
 */
export function scaleIngredients(
  ingredients: IngredientItem[],
  multiplier: number
): IngredientItem[] {
  return ingredients.map((item) => ({
    ...item,
    amount: scaleAmount(item.amount, multiplier),
  }))
}
