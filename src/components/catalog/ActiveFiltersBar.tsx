import { Badge } from '@/components/ui/badge'
import type { FilterCriteria } from '@/shared/types'
import { X } from 'lucide-react'

interface ActiveFiltersBarProps {
  criteria: FilterCriteria
  onChange: (criteria: FilterCriteria) => void
  onResetAll: () => void
}

export function ActiveFiltersBar({
  criteria,
  onChange,
  onResetAll,
}: ActiveFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-xs shadow-2xs">
      <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] mr-1">
        Active Filters:
      </span>

      {criteria.searchQuery && (
        <Badge variant="secondary" className="gap-1 py-0.5 text-xs">
          <span>&ldquo;{criteria.searchQuery}&rdquo;</span>
          <button
            type="button"
            onClick={() => onChange({ ...criteria, searchQuery: '' })}
            className="cursor-pointer hover:text-foreground"
            aria-label="Remove search query filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {criteria.maxTotalTime && (
        <Badge variant="secondary" className="gap-1 py-0.5 text-xs">
          <span>&le; {criteria.maxTotalTime}m</span>
          <button
            type="button"
            onClick={() => onChange({ ...criteria, maxTotalTime: undefined })}
            className="cursor-pointer hover:text-foreground"
            aria-label="Remove max time filter"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {criteria.selectedIngredients.map((ing) => (
        <Badge key={ing} variant="secondary" className="gap-1 py-0.5 text-xs">
          <span>Ing: {ing}</span>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...criteria,
                selectedIngredients: criteria.selectedIngredients.filter((i) => i !== ing),
              })
            }
            className="cursor-pointer hover:text-foreground"
            aria-label={`Remove ingredient ${ing}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {Object.entries(criteria.selectedTags).map(([catId, tags]) =>
        tags.map((tag) => (
          <Badge key={`${catId}-${tag}`} variant="secondary" className="gap-1 py-0.5 text-xs">
            <span>
              {catId}: {tag}
            </span>
            <button
              type="button"
              onClick={() => {
                const updated = tags.filter((t) => t !== tag)
                const next = { ...criteria.selectedTags }
                if (updated.length > 0) next[catId] = updated
                else delete next[catId]
                onChange({ ...criteria, selectedTags: next })
              }}
              className="cursor-pointer hover:text-foreground"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))
      )}

      <button
        type="button"
        onClick={onResetAll}
        className="text-muted-foreground hover:text-foreground ml-auto font-medium text-xs underline cursor-pointer"
      >
        Reset all
      </button>
    </div>
  )
}
