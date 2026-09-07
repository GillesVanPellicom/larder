import { normalizeInstructionsToHtml } from '@/lib/instructions'
import type { InstructionStep } from '@/shared/types'
import { BookOpen } from 'lucide-react'

interface RecipeInstructionsViewProps {
  instructions?: string | InstructionStep[]
}

export function RecipeInstructionsView({
  instructions,
}: RecipeInstructionsViewProps) {
  const instructionsHtml = normalizeInstructionsToHtml(instructions)

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-amber-500" />
        <span>Instructions</span>
      </h2>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs min-h-48">
        {instructionsHtml ? (
          <div
            className="recipe-instructions-content text-sm text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: instructionsHtml }}
          />
        ) : (
          <p className="text-xs text-muted-foreground italic">No instructions provided.</p>
        )}
      </div>
    </div>
  )
}
