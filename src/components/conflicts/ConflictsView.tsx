import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Recipe, RecipeConflict } from '@/shared/types'
import {
  AlertTriangle,
  Edit2,
  Info,
  RefreshCw,
  ShieldCheck,
  Sliders,
} from 'lucide-react'

export interface ConflictsViewProps {
  conflicts: RecipeConflict[]
  loading: boolean
  onRefresh: () => Promise<void>
  onFixRecipe: (recipe: Recipe) => void
  onOpenConfig: () => void
}

export function ConflictsView({
  conflicts,
  loading,
  onRefresh,
  onFixRecipe,
  onOpenConfig,
}: ConflictsViewProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-20 dark:border-neutral-800">
        <RefreshCw className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="mt-3 text-sm text-neutral-500">Checking metadata compliance...</p>
      </div>
    )
  }

  if (conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300/80 bg-emerald-50/40 p-12 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/40">
          <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-emerald-900 dark:text-emerald-100">
          Zero Conflicts Found!
        </h3>
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300 max-w-md">
          All recipes in your Larder library fully satisfy the active global metadata rules.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenConfig}
          className="mt-5 text-xs"
        >
          <Sliders className="h-3.5 w-3.5 mr-1.5" />
          Review Mandatory Rules
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-900/40 dark:bg-red-950/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-950 dark:text-red-100">
              {conflicts.length} Recipe Conflict{conflicts.length > 1 ? 's' : ''} Detected
            </h2>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
              These recipes do not meet the latest mandatory metadata rules. Click &ldquo;Quick Fix&rdquo; on any dish to resolve the conflict.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-xs border-red-200 hover:bg-red-100/50 dark:border-red-800"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Re-check
          </Button>
          <Button
            size="sm"
            onClick={onOpenConfig}
            className="text-xs bg-red-700 hover:bg-red-800 text-white"
          >
            <Sliders className="h-3.5 w-3.5 mr-1" /> Edit Metadata Rules
          </Button>
        </div>
      </div>

      {/* Conflicting Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {conflicts.map(({ recipe, violations }) => (
          <Card
            key={recipe.id}
            className="border-red-200 dark:border-red-900/50 shadow-xs flex flex-col justify-between"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-50 truncate">
                    {recipe.title}
                  </CardTitle>
                  {recipe.description && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button type="button" className="p-0.5 text-muted-foreground hover:text-foreground cursor-help shrink-0">
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        }
                      />
                      <TooltipContent className="max-w-xs">
                        {recipe.description}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <Badge variant="destructive" className="text-xs px-2 shrink-0">
                  {violations.length} Violation{violations.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-1.5 rounded-xl bg-red-50/80 p-3 dark:bg-red-950/40 text-xs border border-red-100 dark:border-red-900/30">
                <span className="font-semibold text-red-900 dark:text-red-200 block mb-1">
                  Required Fixes:
                </span>
                <ul className="space-y-1 text-red-800 dark:text-red-300">
                  {violations.map((v, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                      <span>{v.message}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-4 text-xs text-neutral-500 pt-1">
                <span>Total Time: {recipe.total_time_minutes > 0 ? `${recipe.total_time_minutes}m` : '0m'}</span>
                <span>•</span>
                <span>Ingredients: {recipe.ingredients?.length || 0}</span>
                <span>•</span>
                <span>Image: {recipe.image_url ? 'Yes' : 'Missing'}</span>
              </div>
            </CardContent>

            <CardFooter className="border-t border-neutral-100 dark:border-neutral-800/80 pt-3 pb-3 flex items-center justify-end">
              <Button
                size="sm"
                onClick={() => onFixRecipe(recipe)}
                className="cursor-pointer bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Quick Fix Recipe
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
