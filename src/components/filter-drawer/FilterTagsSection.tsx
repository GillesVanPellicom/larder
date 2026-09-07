import { Badge } from '@/components/ui/badge'
import type { MatchMode, TagCategory } from '@/shared/types'

interface FilterTagsSectionProps {
  categories: TagCategory[]
  selectedTags: Record<string, string[]>
  matchModes: Record<string, MatchMode>
  onToggleTag: (categoryId: string, tag: string) => void
  onCategoryMatchModeChange: (categoryId: string, mode: MatchMode) => void
}

export function FilterTagsSection({
  categories,
  selectedTags,
  matchModes,
  onToggleTag,
  onCategoryMatchModeChange,
}: FilterTagsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Tag Categories
        </label>
        <span className="text-[11px] text-neutral-400">
          Mode configurable per category
        </span>
      </div>

      {categories.map((cat) => {
        const categorySelectedTags = selectedTags[cat.id] || []
        const mode = matchModes[cat.id] || 'any'

        return (
          <div
            key={cat.id}
            className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  {cat.name}
                </span>
                {categorySelectedTags.length > 0 && (
                  <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.2 rounded-full font-mono">
                    {categorySelectedTags.length}
                  </span>
                )}
              </div>

              {/* Per-Category Any/All Toggle */}
              <div className="flex items-center rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-800 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => onCategoryMatchModeChange(cat.id, 'any')}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded cursor-pointer ${
                    mode === 'any'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  ANY
                </button>
                <button
                  type="button"
                  onClick={() => onCategoryMatchModeChange(cat.id, 'all')}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded cursor-pointer ${
                    mode === 'all'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  ALL
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(cat.tags || []).map((tag) => {
                const isSelected = categorySelectedTags.includes(tag)
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => onToggleTag(cat.id, tag)}
                    className="cursor-pointer transition-transform active:scale-95 text-xs py-1"
                  >
                    {tag}
                  </Badge>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
