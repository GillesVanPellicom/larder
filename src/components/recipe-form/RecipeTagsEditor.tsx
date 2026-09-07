import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/MultiSelect'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { RecipeTags, TagCategory } from '@/shared/types'
import { Info } from 'lucide-react'

interface RecipeTagsEditorProps {
  categories: TagCategory[]
  tags: RecipeTags
  onTagsChange: (updater: (prev: RecipeTags) => RecipeTags) => void
  mandatoryCategories?: string[]
  fieldErrors: Record<string, string>
  onClearFieldError: (field: string) => void
}

export function RecipeTagsEditor({
  categories,
  tags,
  onTagsChange,
  mandatoryCategories = [],
  fieldErrors,
  onClearFieldError,
}: RecipeTagsEditorProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Tags
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
            Assign categories to this recipe. Exclusive categories enforce a single selection; non-exclusive categories allow multiple tags.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const selectedInCat = tags[cat.id] || []
          const isMandatoryCat = mandatoryCategories.includes(cat.id)
          const catError = fieldErrors[`tags.${cat.id}`]

          if (cat.exclusive) {
            // Exclusive (Single Choice) Category
            return (
              <div
                key={cat.id}
                className={`space-y-1.5 rounded-xl border bg-muted/20 p-3.5 flex flex-col justify-between ${
                  catError ? 'border-destructive ring-1 ring-destructive/30' : 'border-border/80'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {cat.name}
                    </span>
                    {isMandatoryCat && <span className="text-destructive text-xs font-bold shrink-0">*</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Select
                    value={selectedInCat[0] || ''}
                    onValueChange={(val) => {
                      onTagsChange((prev) => ({
                        ...prev,
                        [cat.id]: val ? [val] : [],
                      }))
                      if (catError) onClearFieldError(`tags.${cat.id}`)
                    }}
                  >
                    <SelectTrigger className="w-full text-xs font-medium">
                      <SelectValue placeholder={`Select ${cat.name}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(cat.tags || []).map((tag) => (
                        <SelectItem key={tag} value={tag} className="text-xs">
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedInCat.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        onTagsChange((prev) => {
                          const next = { ...prev }
                          delete next[cat.id]
                          return next
                        })
                      }}
                      title="Clear selection"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                    >
                      ✕
                    </Button>
                  )}
                </div>

                {catError && <span className="text-[11px] text-destructive mt-1">{catError}</span>}
              </div>
            )
          }

          // Non-Exclusive Category (Multi-Select)
          return (
            <div
              key={cat.id}
              className={`space-y-1.5 rounded-xl border bg-muted/20 p-3.5 flex flex-col justify-between ${
                catError ? 'border-destructive ring-1 ring-destructive/30' : 'border-border/80'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {cat.name}
                  </span>
                  {isMandatoryCat && <span className="text-destructive text-xs font-bold shrink-0">*</span>}
                </div>
              </div>

              <MultiSelect
                options={cat.tags || []}
                values={selectedInCat}
                onValuesChange={(vals) => {
                  onTagsChange((prev) => {
                    const next = { ...prev }
                    if (vals.length > 0) {
                      next[cat.id] = vals
                    } else {
                      delete next[cat.id]
                    }
                    return next
                  })
                  if (catError) onClearFieldError(`tags.${cat.id}`)
                }}
                placeholder={`Select ${cat.name}...`}
              />

              {catError && <span className="text-[11px] text-destructive mt-1">{catError}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
