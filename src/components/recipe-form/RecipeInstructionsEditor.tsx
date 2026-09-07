import { QuillEditor } from '@/components/QuillEditor'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface RecipeInstructionsEditorProps {
  value: string
  onChange: (html: string) => void
  isMandatory: boolean
  error?: string
}

export function RecipeInstructionsEditor({
  value,
  onChange,
  isMandatory,
  error,
}: RecipeInstructionsEditorProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Preparation & Cooking Instructions {isMandatory && <span className="text-destructive">*</span>}
        </h2>
        <Tooltip>
          <TooltipTrigger
            render={
              <button type="button" className="p-0.5 text-muted-foreground hover:text-foreground cursor-help">
                <Info className="h-3.5 w-3.5" />
              </button>
            }
          />
          <TooltipContent>
            Type directions freely. Use formatting tools for bold, lists, and links.
          </TooltipContent>
        </Tooltip>
      </div>

      {error && (
        <div className="text-xs text-destructive font-medium">{error}</div>
      )}

      <div className={error ? 'border border-destructive rounded-xl' : ''}>
        <QuillEditor
          value={value}
          onChange={onChange}
          placeholder="Describe how to prepare this recipe. Use bullet points or numbered steps as you wish..."
        />
      </div>
    </div>
  )
}
