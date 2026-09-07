import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { RecipeTemplate } from '@/shared/types'
import {
  Copy,
  Grid,
  Info,
  Layers,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'

interface TemplatesManagerProps {
  templates: RecipeTemplate[]
  loading: boolean
  onOpenEditor: (template: RecipeTemplate | null) => void
  onDuplicateTemplate: (id: string) => Promise<RecipeTemplate>
  onDeleteTemplate: (id: string) => Promise<void>
}

export function TemplatesManager({
  templates,
  loading,
  onOpenEditor,
  onDuplicateTemplate,
  onDeleteTemplate,
}: TemplatesManagerProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">
              Recipe Templates
            </h2>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="text-muted-foreground hover:text-foreground cursor-help">
                    <Info className="h-4 w-4" />
                  </span>
                }
              />
              <TooltipContent side="top">
                Templates define the components and layout for recipes and their cards.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure custom fields and layout presentations for recipes.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => onOpenEditor(null)}
          className="cursor-pointer font-semibold bg-primary text-primary-foreground hover:bg-primary/90 self-start"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>New Template</span>
        </Button>
      </div>

      {/* Templates Grid */}
      {loading && templates.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading templates...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => {
            const fieldCount = tpl.currentVersion?.fieldsSchema?.length || 0
            const widgetCount = tpl.currentVersion?.cardLayout?.widgets?.length || 0
            const verNumber = tpl.currentVersion?.version || 1

            return (
              <div
                key={tpl.id}
                className={`rounded-2xl border p-5 transition-all space-y-4 shadow-xs ${
                  tpl.isDefault
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground truncate">
                        {tpl.name}
                      </h3>
                      {tpl.isDefault && (
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <Star className="h-3 w-3 fill-current" /> Default
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                        v{verNumber}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {tpl.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>{fieldCount} Components</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Grid className="h-3.5 w-3.5 text-primary" />
                    <span>{widgetCount} Card Widgets</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenEditor(tpl)}
                      className="h-8 text-xs font-semibold cursor-pointer border-border hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      <span>Edit Template</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDuplicateTemplate(tpl.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Duplicate template"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {!tpl.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete template "${tpl.name}"?`)) {
                          onDeleteTemplate(tpl.id)
                        }
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
