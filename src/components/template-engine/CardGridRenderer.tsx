import type { CardGridLayoutConfig, CardGridWidget, TemplateField } from '@/shared/types'
import { Clock, Flame, Image as ImageIcon, Star, Tag, Utensils } from 'lucide-react'

interface CardGridRendererProps {
  cardLayout?: CardGridLayoutConfig
  fieldValues: Record<string, unknown>
  fieldsSchema?: TemplateField[]
}

export function CardGridRenderer({
  cardLayout,
  fieldValues,
  fieldsSchema = [],
}: CardGridRendererProps) {
  if (!cardLayout || !cardLayout.widgets || cardLayout.widgets.length === 0) {
    return null
  }

  // Find field definition map
  const fieldMap = new Map<string, TemplateField>()
  for (const f of fieldsSchema) {
    fieldMap.set(f.id, f)
  }

  // Sort widgets by row, then col
  const sortedWidgets = [...cardLayout.widgets].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })

  // Check for top-level full-bleed image_banner (if present at row 1 or colSpan 4)
  const topImageWidget = sortedWidgets.find(
    (w) => w.widgetType === 'image_banner' && (w.row === 1 || w.colSpan === 4)
  )

  const bodyWidgets = topImageWidget
    ? sortedWidgets.filter((w) => w.id !== topImageWidget.id)
    : sortedWidgets

  // Normalize row positions for body widgets to eliminate top offset gap
  const minRow =
    bodyWidgets.length > 0 ? Math.min(...bodyWidgets.map((w) => w.row)) : 1

  return (
    <div className="w-full flex flex-col">
      {/* Flush Side-to-Side Cover Photo Banner */}
      {topImageWidget && (
        <TopImageBanner
          field={fieldMap.get(topImageWidget.fieldId)}
          value={fieldValues[topImageWidget.fieldId]}
        />
      )}

      {/* Card Body Widgets Grid */}
      {bodyWidgets.length > 0 && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-4 gap-2.5 w-full auto-rows-auto">
            {bodyWidgets.map((widget) => {
              const field = fieldMap.get(widget.fieldId)
              const rawValue = fieldValues[widget.fieldId]
              const adjustedRow = Math.max(1, widget.row - minRow + 1)

              return (
                <div
                  key={widget.id}
                  style={{
                    gridColumn: `${widget.col} / span ${widget.colSpan}`,
                    gridRow: `${adjustedRow} / span ${widget.rowSpan}`,
                  }}
                  className="min-w-0"
                >
                  <RenderWidget
                    widget={widget}
                    field={field}
                    value={rawValue}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TopImageBanner({
  field,
  value,
}: {
  field?: TemplateField
  value: unknown
}) {
  const imageUrl = (value as string) || ''

  return (
    <div className="relative h-48 w-full overflow-hidden bg-muted/60 rounded-t-2xl">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={field?.name || 'Recipe cover'}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-muted/30">
          <Utensils className="h-8 w-8 text-muted-foreground/40" />
          <span className="mt-1.5 text-xs text-muted-foreground font-medium">
            No cover photo
          </span>
        </div>
      )}
    </div>
  )
}

function RenderWidget({
  widget,
  field,
  value,
}: {
  widget: CardGridWidget
  field?: TemplateField
  value: unknown
}) {
  const { widgetType, options } = widget

  // WIDGET 1: IMAGE BANNER (Fallback for non-top images)
  if (widgetType === 'image_banner') {
    const imageUrl = (value as string) || ''
    return (
      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-muted/40 flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={field?.name || 'Recipe'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/40">
            <ImageIcon className="h-6 w-6 stroke-[1.5]" />
            <span className="text-[9px] uppercase tracking-wider font-semibold mt-1">No Photo</span>
          </div>
        )}
      </div>
    )
  }

  // WIDGET 2: TITLE HEADER
  if (widgetType === 'title_header') {
    const titleText = (value as string) || field?.name || 'Untitled Recipe'
    return (
      <h3 className="font-bold text-base text-foreground tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
        {titleText}
      </h3>
    )
  }

  // WIDGET 3: METRIC CHIP
  if (widgetType === 'metric_chip') {
    const num = Number(value)
    if (isNaN(num) || num === 0) return null

    const unit = field?.config?.unit || 'min'
    let IconComp = Clock
    if (field?.id.includes('cook')) IconComp = Flame
    if (field?.id.includes('yield')) IconComp = Utensils

    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-muted/30 text-xs text-foreground font-medium truncate">
        <IconComp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="truncate font-semibold">
          {num} {unit}
        </span>
        {options?.showLabel && field?.name && (
          <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
            ({field.name})
          </span>
        )}
      </div>
    )
  }

  // WIDGET 4: TAG CHIPS
  if (widgetType === 'tag_chips') {
    const tagsDict = (value as Record<string, string[]>) || {}
    const selectedGroups = options?.selectedTagGroups || []

    let filteredTags: string[] = []
    if (selectedGroups.length > 0) {
      for (const [grpKey, tags] of Object.entries(tagsDict)) {
        if (
          selectedGroups.includes(grpKey) ||
          selectedGroups.some((g) => g.toLowerCase() === grpKey.toLowerCase())
        ) {
          if (Array.isArray(tags)) {
            filteredTags.push(...tags)
          }
        }
      }
    } else {
      filteredTags = Object.values(tagsDict).flat()
    }

    if (filteredTags.length === 0) return null

    return (
      <div className="flex flex-wrap items-center gap-1 overflow-hidden max-h-12">
        <Tag className="h-3 w-3 text-muted-foreground shrink-0 mr-0.5" />
        {filteredTags.slice(0, 4).map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border/60 truncate"
          >
            {tag}
          </span>
        ))}
        {filteredTags.length > 4 && (
          <span className="text-[10px] font-mono text-muted-foreground">
            +{filteredTags.length - 4}
          </span>
        )}
      </div>
    )
  }

  // WIDGET 5: RATING STARS
  if (widgetType === 'rating_stars') {
    const score = Number(value) || 0
    if (score === 0) return null

    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold w-fit">
        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
        <span>{score.toFixed(1)}</span>
      </div>
    )
  }

  // WIDGET 6: ICON / STATUS BADGE
  if (widgetType === 'icon_badge') {
    const active = Boolean(value)
    if (!active) return null

    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
        <span>{field?.name || 'Active'}</span>
      </div>
    )
  }

  // WIDGET 7: TEXT SNIPPET
  if (widgetType === 'text_snippet') {
    const text = (value as string) || ''
    if (!text) return null

    return (
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {text}
      </p>
    )
  }

  return null
}
