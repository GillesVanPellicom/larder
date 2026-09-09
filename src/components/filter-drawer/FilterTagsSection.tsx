import { MultiCombobox } from '@/components/ui/multi-combobox'
import type { MatchMode, TagCategory } from '@/shared/types'

interface FilterTagsSectionProps {
  categories: TagCategory[]
  selectedTags: Record<string, string[]>
  matchModes: Record<string, MatchMode>
  onCategoryTagsChange: (categoryId: string, tags: string[]) => void
  onCategoryMatchModeChange: (categoryId: string, mode: MatchMode) => void
}

export function FilterTagsSection({
  categories,
  selectedTags,
  matchModes,
  onCategoryTagsChange,
  onCategoryMatchModeChange,
}: FilterTagsSectionProps) {
  if (categories.length === 0) return null

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const categorySelectedTags = selectedTags[cat.id] || []
        const mode = matchModes[cat.id] || 'any'

        return (
          <div key={cat.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  {cat.name}
                </label>
                {categorySelectedTags.length > 0 && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-mono text-foreground">
                    {categorySelectedTags.length}
                  </span>
                )}
              </div>

              {/* Per-Category Any/All/None Toggle */}
              <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
                <button
                  type="button"
                  onClick={() => onCategoryMatchModeChange(cat.id, 'any')}
                  className={`min-h-[30px] min-w-[44px] px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                    mode === 'any'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Any
                </button>
                <button
                  type="button"
                  onClick={() => onCategoryMatchModeChange(cat.id, 'all')}
                  className={`min-h-[30px] min-w-[44px] px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                    mode === 'all'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => onCategoryMatchModeChange(cat.id, 'none')}
                  className={`min-h-[30px] min-w-[44px] px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                    mode === 'none'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  None
                </button>
              </div>
            </div>

            <MultiCombobox
              options={cat.tags || []}
              values={categorySelectedTags}
              onValuesChange={(vals) => onCategoryTagsChange(cat.id, vals)}
              placeholder={`Select ${cat.name.toLowerCase()}...`}
              emptyMessage={`No ${cat.name} tags found.`}
            />
          </div>
        )
      })}
    </div>
  )
}
