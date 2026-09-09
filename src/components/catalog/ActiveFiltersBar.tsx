import { Badge } from '@/components/ui/badge'
import type { FilterCriteria } from '@/shared/types'
import { X } from 'lucide-react'

interface ActiveFiltersBarProps {
  criteria: FilterCriteria
  onChange: (criteria: FilterCriteria) => void
}

export function ActiveFiltersBar({
  criteria,
  onChange,
}: ActiveFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {criteria.searchQuery && (
        <Badge
          variant="secondary"
          onClick={() => onChange({ ...criteria, searchQuery: '' })}
          className="group gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all select-none"
          title="Click to remove search filter"
        >
          <span>&ldquo;{criteria.searchQuery}&rdquo;</span>
          <X className="h-3 w-3 text-muted-foreground group-hover:text-destructive transition-colors shrink-0" />
        </Badge>
      )}

      {criteria.maxTotalTime && (
        <Badge
          variant="secondary"
          onClick={() => onChange({ ...criteria, maxTotalTime: undefined })}
          className="group gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all select-none"
          title="Click to remove max time filter"
        >
          <span>&le; {criteria.maxTotalTime} min</span>
          <X className="h-3 w-3 text-muted-foreground group-hover:text-destructive transition-colors shrink-0" />
        </Badge>
      )}

      {criteria.selectedIngredients.map((ing) => (
        <Badge
          key={ing}
          variant="secondary"
          onClick={() =>
            onChange({
              ...criteria,
              selectedIngredients: criteria.selectedIngredients.filter((i) => i !== ing),
            })
          }
          className="group gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all select-none"
          title={`Click to remove ingredient filter "${ing}"`}
        >
          <span className="text-muted-foreground font-normal">Ingredient:</span>
          <span>{ing}</span>
          <X className="h-3 w-3 text-muted-foreground group-hover:text-destructive transition-colors shrink-0" />
        </Badge>
      ))}

      {Object.entries(criteria.selectedTags).map(([catId, tags]) =>
        tags.map((tag) => (
          <Badge
            key={`${catId}-${tag}`}
            variant="secondary"
            onClick={() => {
              const updated = tags.filter((t) => t !== tag)
              const next = { ...criteria.selectedTags }
              if (updated.length > 0) next[catId] = updated
              else delete next[catId]
              onChange({ ...criteria, selectedTags: next })
            }}
            className="group gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all select-none"
            title={`Click to remove tag filter "${tag}"`}
          >
            <span className="text-muted-foreground font-normal">{catId}:</span>
            <span>{tag}</span>
            <X className="h-3 w-3 text-muted-foreground group-hover:text-destructive transition-colors shrink-0" />
          </Badge>
        ))
      )}
    </div>
  )
}
