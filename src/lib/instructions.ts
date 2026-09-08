import type { InstructionStep } from '@/shared/types'

/**
 * Normalizes any instructions representation (HTML string, multiline string, or InstructionStep[])
 * into clean HTML suitable for rendering in Quill or the recipe view.
 */
export function normalizeInstructionsToHtml(
  instructions?: string | InstructionStep[] | null
): string {
  if (!instructions) return ''

  if (Array.isArray(instructions)) {
    if (instructions.length === 0) return ''
    return `<ol>${instructions
      .filter((s) => s && (typeof s === 'string' || (s.text && s.text.trim())))
      .map((s) => `<li>${typeof s === 'string' ? s : s.text.trim()}</li>`)
      .join('')}</ol>`
  }

  if (typeof instructions === 'string') {
    const trimmed = instructions.trim()
    if (!trimmed) return ''

    // If already contains HTML markup
    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
      return trimmed.replace(/<span class="ql-ui"[^>]*>[\s\S]*?<\/span>/gi, '')
    }

    // Handle plain text with newlines or numbered lists
    const lines = trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length === 0) return ''

    const isNumbered = lines.every((l) => /^\d+[.)]\s*/.test(l))
    if (isNumbered) {
      return `<ol>${lines
        .map((l) => `<li>${l.replace(/^\d+[.)]\s*/, '')}</li>`)
        .join('')}</ol>`
    }

    return lines.map((l) => `<p>${l}</p>`).join('')
  }

  return ''
}

/**
 * Extracts pure text from an HTML instructions string to check for meaningful content.
 */
export function getInstructionsPlainText(html?: string | null): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
