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

function formatTagCategoryRuleText(min: number, max: number, total: number): string {
  if (total === 0) return 'No tags available'
  if (min === 1 && max === 1) return 'Exactly 1'
  if (min === 0 && max === 1) return 'At most 1'
  if (min === 0 && max < total) return `At most ${max}`
  if (min === 0 && max >= total) return 'Optional'
  if (min > 0 && max === total) return min === 1 ? 'At least 1' : `At least ${min}`
  if (min === max) return `Exactly ${min}`
  if (min > 0 && max > min) return `Between ${min} and ${max}`
  return 'Optional'
}

export function RecipeTagsEditor({
  categories,
  tags,
  onTagsChange,
  mandatoryCategories = [],
  fieldErrors,
  onClearFieldError,
}: RecipeTagsEditorProps) {
  if (categories.length === 0) return null

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-xs">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Tags
        </h2>
        <InfoTooltip content="Assign tags to this recipe. The allowed number of tags for each category is shown above its field." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
          const ruleText = formatTagCategoryRuleText(minAllowed, maxAllowed, totalCatTags)

          return (
            <div key={cat.id} data-field={`tags.${cat.id}`} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1 truncate">
                  <span className="truncate">{cat.name}</span>
                  {isRequired && <span className="text-destructive font-bold">*</span>}
                </label>
                <span className="text-[11px] text-muted-foreground shrink-0 font-normal">
                  {ruleText}
                </span>
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
                className={catError ? 'border-destructive ring-destructive/20 ring-2' : ''}
              />

              {catError && (
                <span className="text-[11px] text-destructive block mt-1">
                  {catError}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

