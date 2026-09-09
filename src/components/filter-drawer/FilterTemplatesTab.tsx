import type { FilterCriteria, FilterTemplate } from '@/shared/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bookmark,
  Check,
  Edit2,
  MoreVertical,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { areFilterCriteriaEqual } from '@/lib/recipeFilters'
import { formatBelgianDateTime } from '@/lib/dateTime'
import { InfoTooltip } from '@/components/ui/info-tooltip'

interface FilterTemplatesTabProps {
  templates: FilterTemplate[]
  currentCriteria: FilterCriteria
  onApplyTemplate: (template: FilterTemplate) => void
  onOverwriteTemplate: (template: FilterTemplate) => void
  onRenameTemplate: (template: FilterTemplate) => void
  onDeleteTemplate: (template: FilterTemplate) => void
  hasActiveFilters: boolean
}

export function FilterTemplatesTab({
  templates,
  currentCriteria,
  onApplyTemplate,
  onOverwriteTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  hasActiveFilters,
}: FilterTemplatesTabProps) {
  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            Saved templates
          </span>
          <InfoTooltip content="Saved filter presets can be applied with a single click from the catalog or filter drawer." />
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Bookmark className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">No saved templates</p>
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              Set your favorite filter combinations on the Filters tab and save them for 1-click reuse.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {templates.map((template) => {
            const isMatch = areFilterCriteriaEqual(currentCriteria, template.criteria)
            const c = template.criteria

            return (
              <div
                key={template.id}
                className={`group relative rounded-xl border transition-all p-3.5 flex flex-col gap-2.5 ${
                  isMatch
                    ? 'border-primary/50 bg-primary/5 shadow-xs'
                    : 'border-border bg-card/60 hover:bg-muted/30 hover:border-border/80'
                }`}
              >
                {/* Template Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {template.name}
                    </span>
                    {isMatch && (
                      <Badge
                        variant="default"
                        className="text-[10px] px-1.5 py-0 h-4 font-bold flex items-center gap-1 shrink-0"
                      >
                        <Check className="h-2.5 w-2.5" />
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant={isMatch ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => onApplyTemplate(template)}
                      className="h-7 text-xs px-2.5 cursor-pointer font-medium"
                    >
                      {isMatch ? 'Applied' : 'Apply'}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-md">
                        {hasActiveFilters && !isMatch && (
                          <DropdownMenuItem
                            onClick={() => onOverwriteTemplate(template)}
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-primary" />
                            <span>Overwrite with current</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onRenameTemplate(template)}
                          className="cursor-pointer gap-2 text-xs"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteTemplate(template)}
                          className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Individual Filter Tags (matching catalogue style) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {c.searchQuery?.trim() && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                    >
                      <span>&ldquo;{c.searchQuery.trim()}&rdquo;</span>
                    </Badge>
                  )}

                  {c.maxTotalTime && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                    >
                      <span>&le; {c.maxTotalTime} min</span>
                    </Badge>
                  )}

                  {c.selectedIngredients?.map((ing) => (
                    <Badge
                      key={ing}
                      variant="secondary"
                      className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                    >
                      <span className="text-muted-foreground font-normal">Ingredient:</span>
                      <span>{ing}</span>
                    </Badge>
                  ))}

                  {Object.entries(c.selectedTags || {}).map(([catId, tags]) =>
                    (tags || []).map((tag) => (
                      <Badge
                        key={`${catId}-${tag}`}
                        variant="secondary"
                        className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                      >
                        <span className="text-muted-foreground font-normal">{catId}:</span>
                        <span>{tag}</span>
                      </Badge>
                    ))
                  )}

                  {c.onlyConflicts && c.onlyConflicts !== 'any' && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                    >
                      <span className="text-muted-foreground font-normal">Violations:</span>
                      <span>{c.onlyConflicts === 'only' ? 'Only' : 'None'}</span>
                    </Badge>
                  )}

                  {c.hasImage && c.hasImage !== 'any' && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                    >
                      <span className="text-muted-foreground font-normal">Image:</span>
                      <span>{c.hasImage === 'only' ? 'Only' : 'None'}</span>
                    </Badge>
                  )}
                </div>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/70 pt-1 border-t border-border/40">
                  <span>
                    {template.use_count > 0
                      ? `Used ${template.use_count} time${template.use_count > 1 ? 's' : ''}`
                      : 'Never used'}
                  </span>
                  {template.last_used_at && (
                    <span>Last used {formatBelgianDateTime(template.last_used_at)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
