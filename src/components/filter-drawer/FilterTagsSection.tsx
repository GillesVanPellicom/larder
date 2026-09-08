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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Tag Categories
        </label>
      </div>

      {categories.map((cat) => {
        const categorySelectedTags = selectedTags[cat.id] || []
        const mode = matchModes[cat.id] || 'any'

        return (
          <div
            key={cat.id}
            className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {cat.name}
                </span>
                {categorySelectedTags.length > 0 && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded-full font-mono text-foreground">
                    {categorySelectedTags.length}
                  </span>
                )}
              </div>

              {/* Per-Category Any/All Toggle */}
              <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => onCategoryMatchModeChange(cat.id, 'any')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    mode === 'any'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ANY
                </button>
                <button
                  type="button"
                  onClick={() => onCategoryMatchModeChange(cat.id, 'all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    mode === 'all'
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ALL
                </button>
              </div>
            </div>

            <MultiCombobox
              options={cat.tags || []}
              values={categorySelectedTags}
              onValuesChange={(vals) => onCategoryTagsChange(cat.id, vals)}
              placeholder={`Select ${cat.name}...`}
              emptyMessage={`No ${cat.name} tags found.`}
            />
          </div>
        )
      })}
    </div>
  )
}
