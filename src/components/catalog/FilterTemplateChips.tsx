import type { FilterCriteria, FilterTemplate } from '@/shared/types'
import { Bookmark, Check, Plus } from 'lucide-react'
import { areFilterCriteriaEqual } from '@/lib/recipeFilters'

interface FilterTemplateChipsProps {
  templates: FilterTemplate[]
  currentCriteria: FilterCriteria
  onApplyTemplate: (template: FilterTemplate) => void
  onSaveCurrentAsTemplate?: () => void
  hasActiveFilters?: boolean
}

export function FilterTemplateChips({
  templates,
  currentCriteria,
  onApplyTemplate,
  onSaveCurrentAsTemplate,
  hasActiveFilters,
}: FilterTemplateChipsProps) {
  // Only show the 5 most recent templates in the quick use chips
  const visibleTemplates = templates.slice(0, 5)

  if (visibleTemplates.length === 0 && !hasActiveFilters) {
    return null
  }

  // Check if current criteria matches any saved template
  const matchingTemplate = templates.find((t) =>
    areFilterCriteriaEqual(currentCriteria, t.criteria)
  )

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mr-0.5 select-none">
        <Bookmark className="h-3.5 w-3.5 text-primary" />
        <span>Templates:</span>
      </span>

      {visibleTemplates.map((template) => {
        const isActive = matchingTemplate?.id === template.id

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onApplyTemplate(template)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer select-none ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                : 'bg-card/70 hover:bg-muted/80 text-foreground border-border hover:border-border/80'
            }`}
            title={`Apply "${template.name}" filter template`}
          >
            {isActive && <Check className="h-3 w-3 shrink-0" />}
            <span>{template.name}</span>
          </button>
        )
      })}

      {hasActiveFilters && !matchingTemplate && onSaveCurrentAsTemplate && (
        <button
          type="button"
          onClick={onSaveCurrentAsTemplate}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-dashed border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:border-border transition-all cursor-pointer select-none"
          title="Save current active filters as template"
        >
          <Plus className="h-3 w-3" />
          <span>Save template</span>
        </button>
      )}
    </div>
  )
}
