import { Badge } from '@/components/ui/badge'
import { formatGracefulNumber } from '@/lib/recipeMath'
import type { Recipe, TagCategory, TimeTrackingMode } from '@/shared/types'

interface RecipeHeroProps {
  recipe: Recipe
  categories?: TagCategory[]
  scaledYield?: string
  yieldMultiplier?: number
  timeTrackingMode?: TimeTrackingMode
  onTagClick?: (catId: string, tag: string) => void
  onOpenYieldModal?: () => void
}

function renderYieldValue(yieldText: string, isScaled: boolean) {
  if (!yieldText) return '—'
  if (!isScaled) {
    return yieldText
  }

  // Split on numbers (integers, decimals, fractions) to isolate numeric characters
  const tokens = yieldText.split(/(\d+(?:\.\d+)?|\d+\/\d+)/g)

  return (
    <>
      {tokens.map((token, i) => {
        if (/\d/.test(token)) {
          return (
            <span key={i} className="text-amber-600 dark:text-amber-400">
              {token}
            </span>
          )
        }
        return <span key={i}>{token}</span>
      })}
    </>
  )
}

export function RecipeHero({
  recipe,
  categories = [],
  scaledYield,
  yieldMultiplier = 1,
  timeTrackingMode = 'prep_and_cook',
  onTagClick,
  onOpenYieldModal,
}: RecipeHeroProps) {
  const hasTags = Object.keys(recipe.tags || {}).length > 0

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
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
              {recipe.description}
            </p>
          )}
        </div>
      )}

      {/* Symmetrical Consolidated Metrics Grid */}
      <div
        className={`grid ${
          timeTrackingMode === 'prep_and_cook'
            ? 'grid-cols-2 sm:grid-cols-4'
            : timeTrackingMode === 'total_only'
            ? 'grid-cols-2'
            : 'grid-cols-1'
        } gap-px bg-border border-t border-border`}
      >
        {/* Prep Time (Shown in prep_and_cook only) */}
        {timeTrackingMode === 'prep_and_cook' && (
          <div className="bg-card py-3 px-2 sm:py-3.5 sm:px-4 text-center">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
              Prep Time
            </span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-sm sm:text-base font-bold text-foreground">
                {recipe.prep_time_minutes > 0 ? `${recipe.prep_time_minutes} min` : '—'}
              </span>
            </div>
          </div>
        )}

        {/* Cook Time (Shown in prep_and_cook only) */}
        {timeTrackingMode === 'prep_and_cook' && (
          <div className="bg-card py-3 px-2 sm:py-3.5 sm:px-4 text-center">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
              Cook Time
            </span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-sm sm:text-base font-bold text-foreground">
                {recipe.cook_time_minutes > 0 ? `${recipe.cook_time_minutes} min` : '—'}
              </span>
            </div>
          </div>
        )}

        {/* Total Time (Shown in prep_and_cook and total_only) */}
        {timeTrackingMode !== 'no_cook' && (
          <div className="bg-card py-3 px-2 sm:py-3.5 sm:px-4 text-center">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
              Total Time
            </span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-sm sm:text-base font-bold text-foreground">
                {recipe.total_time_minutes > 0 ? `${recipe.total_time_minutes} min` : '—'}
              </span>
            </div>
          </div>
        )}

        {/* Yield (Clickable to open Yield Multiplier) */}
        <div
          onClick={onOpenYieldModal}
          role={onOpenYieldModal ? 'button' : undefined}
          tabIndex={onOpenYieldModal ? 0 : undefined}
          onKeyDown={(e) => {
            if (onOpenYieldModal && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onOpenYieldModal()
            }
          }}
          className={`bg-card py-3 px-2 sm:py-3.5 sm:px-4 text-center select-none ${
            onOpenYieldModal
              ? 'cursor-pointer hover:bg-muted/40 transition-colors group focus:outline-none focus-visible:bg-muted/60'
              : ''
          }`}
          title={onOpenYieldModal ? 'Click to adjust recipe yield' : undefined}
        >
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
            Yield
          </span>
          <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-foreground underline underline-offset-4 decoration-muted-foreground/50 group-hover:decoration-foreground transition-colors">
              {renderYieldValue(scaledYield || recipe.yield_amount || '—', Math.abs(yieldMultiplier - 1) > 0.001)}
            </span>
            {Math.abs(yieldMultiplier - 1) > 0.001 && (
              <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {formatGracefulNumber(yieldMultiplier)}×
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Tags Section */}
      {hasTags && (
        <div className="p-4 sm:p-5 border-t border-border bg-muted/20 flex flex-wrap items-center gap-x-6 gap-y-2.5">
          {Object.entries(recipe.tags).map(([catId, tags]) => {
            if (!tags || tags.length === 0) return null
            const category = categories.find((c) => c.id === catId)
            const categoryName = category?.name || catId

            return (
              <div key={catId} className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  {categoryName}:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {tags.map((t) => (
                    <Badge
                      key={`${catId}-${t}`}
                      variant="secondary"
                      onClick={() => onTagClick?.(catId, t)}
                      title={`Filter recipes by ${categoryName}: ${t}`}
                      className={`text-xs sm:text-sm px-2.5 py-1 font-medium border border-border bg-card text-foreground shadow-2xs transition-all ${
                        onTagClick
                          ? 'cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary'
                          : ''
                      }`}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
