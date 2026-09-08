import { normalizeInstructionsToHtml } from '@/lib/instructions'
import type { InstructionStep } from '@/shared/types'

interface RecipeInstructionsViewProps {
  instructions?: string | InstructionStep[]
}

export function RecipeInstructionsView({
  instructions,
}: RecipeInstructionsViewProps) {
  const instructionsHtml = normalizeInstructionsToHtml(instructions)

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-foreground">
        Instructions
      </h2>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs min-h-48">
        {instructionsHtml ? (
          <div
            className="recipe-instructions-content"
            dangerouslySetInnerHTML={{ __html: instructionsHtml }}
          />
        ) : (
          <p className="text-xs text-muted-foreground italic">No instructions provided.</p>
        )}
      </div>
    </div>
  )
}
