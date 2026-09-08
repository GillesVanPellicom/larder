import { MultiCombobox } from '@/components/ui/multi-combobox'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { RecipeTags, TagCategory } from '@/shared/types'

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
        <InfoTooltip content="Assign categories to this recipe. Configure tags using the combobox." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const selectedInCat = tags[cat.id] || []
          const totalCatTags = cat.tags?.length || 0
          const minAllowed =
            cat.min_tags !== undefined
              ? cat.min_tags
              : cat.exclusive
              ? 1
              : mandatoryCategories.includes(cat.id)
              ? 1
              : 0
          const maxAllowed =
            cat.max_tags !== undefined
              ? cat.max_tags
              : cat.exclusive
              ? 1
              : totalCatTags
          const isRequired = minAllowed > 0
          const catError = fieldErrors[`tags.${cat.id}`]

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
                  {isRequired && <span className="text-destructive text-xs font-bold shrink-0">*</span>}
                </div>
                {maxAllowed < totalCatTags && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    max {maxAllowed}
                  </span>
                )}
              </div>

              <MultiCombobox
                options={cat.tags || []}
                values={selectedInCat}
                maxSelected={maxAllowed}
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
                emptyMessage={`No ${cat.name} tags found.`}
                className={catError ? 'border-destructive ring-1 ring-destructive/30' : ''}
              />

              {catError && <span className="text-[11px] text-destructive mt-1">{catError}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

