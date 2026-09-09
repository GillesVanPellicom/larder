/**
 * Global Date & Time Formatting Utilities
 * Formatted to Belgian standard locale and Europe/Brussels timezone.
 */

/**
 * Formats a date/timestamp to Belgian standard date & time (e.g. "09/09/2026, 22:55")
 */
export function formatBelgianDateTime(
  date: string | Date | number | null | undefined,
  includeSeconds = false
): string {
  if (!date) return '—'
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'

  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hour12: false,
  }).format(d)
}

/**
 * Formats a date/timestamp to Belgian date only (e.g. "09/09/2026")
 */
export function formatBelgianDate(
  date: string | Date | number | null | undefined
): string {
  if (!date) return '—'
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'

  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/**
 * Formats a date/timestamp to Belgian time only (e.g. "22:55")
 */
export function formatBelgianTime(
  date: string | Date | number | null | undefined
): string {
  if (!date) return '—'
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'

  return new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}
