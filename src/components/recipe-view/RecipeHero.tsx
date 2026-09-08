import type { Recipe } from '@/shared/types'
import { formatGracefulNumber } from '@/lib/recipeMath'
import { Clock, Users } from 'lucide-react'

interface RecipeHeroProps {
  recipe: Recipe
  scaledYield?: string
  yieldMultiplier?: number
}

export function RecipeHero({
  recipe,
  scaledYield,
  yieldMultiplier = 1,
}: RecipeHeroProps) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
      {recipe.image_url ? (
        <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-muted">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold block mb-1">
              Recipe Details
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {recipe.title}
            </h1>
            {recipe.description && (
              <p className="text-sm text-neutral-200 mt-2 max-w-2xl leading-relaxed">
                {recipe.description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 border-b border-border">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold block mb-1">
            Recipe Details
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
              {recipe.description}
            </p>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border border-t border-border bg-muted/20 text-center p-4">
        <div className="py-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
            Prep Time
          </span>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">
              {recipe.prep_time_minutes > 0 ? `${recipe.prep_time_minutes} min` : '—'}
            </span>
          </div>
        </div>

        <div className="py-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
            Cook Time
          </span>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">
              {recipe.cook_time_minutes > 0 ? `${recipe.cook_time_minutes} min` : '—'}
            </span>
          </div>
        </div>

        <div className="py-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
            Total Time
          </span>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {recipe.total_time_minutes > 0 ? `${recipe.total_time_minutes} min` : '—'}
            </span>
          </div>
        </div>

        <div className="py-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
            Yield
          </span>
          <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">
              {scaledYield || recipe.yield_amount || '—'}
            </span>
            {Math.abs(yieldMultiplier - 1) > 0.001 && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {formatGracefulNumber(yieldMultiplier)}×
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
