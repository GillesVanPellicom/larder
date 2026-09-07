import { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CardGridRenderer } from '@/components/template-engine/CardGridRenderer'
import { FIELD_CATALOG } from '@/components/template-engine/fieldCatalog'
import type { CardGridLayoutConfig, CardGridWidget, TagCategory, TemplateField } from '@/shared/types'
import {
  Clock,
  Eye,
  EyeOff,
  GripVertical,
  Info,
  Plus,
  Star,
  Tag,
  Trash2,
} from 'lucide-react'

export interface CardGridDesignerProps {
  fields: TemplateField[]
  cardLayout: CardGridLayoutConfig
  categories?: TagCategory[]
  onChange: (layout: CardGridLayoutConfig) => void
}

type ActiveDragState =
  | {
      type: 'move'
      widgetId: string
      startX: number
      startY: number
      origin: { col: number; row: number; colSpan: number; rowSpan: number }
    }
  | {
      type: 'resize'
      widgetId: string
      startX: number
      startY: number
      startColSpan: number
      startRowSpan: number
      allowVertical: boolean
      minSpan: number
    }
  | {
      type: 'palette'
      field: TemplateField
      defaultSpan: number
      defaultRowSpan: number
    }

interface HoverGhost {
  col: number
  row: number
  colSpan: number
  rowSpan: number
  isValid: boolean
}

export function CardGridDesigner({
  fields,
  cardLayout,
  categories = [],
  onChange,
}: CardGridDesignerProps) {
  const [previewMode, setPreviewMode] = useState(false)
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null)
  const [hoverGhost, setHoverGhost] = useState<HoverGhost | null>(null)
  const [snapNotice, setSnapNotice] = useState<string | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)

  // Filter fields that have widget representations
  const eligibleFields = fields.filter((f) => {
    const def = FIELD_CATALOG[f.type]
    return def && def.hasWidgetForm && !f.isArchived
  })

  const placedFieldIds = new Set(cardLayout.widgets.map((w) => w.fieldId))
  const unplacedFields = eligibleFields.filter((f) => !placedFieldIds.has(f.id))

  const updateWidget = useCallback(
    (id: string, patch: Partial<CardGridWidget>) => {
      onChange({
        ...cardLayout,
        widgets: cardLayout.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      })
    },
    [cardLayout, onChange]
  )

  const removeWidget = useCallback(
    (id: string) => {
      onChange({
        ...cardLayout,
        widgets: cardLayout.widgets.filter((w) => w.id !== id),
      })
      if (selectedWidgetId === id) setSelectedWidgetId(null)
    },
    [cardLayout, onChange, selectedWidgetId]
  )

  // Add widget at bottom on click
  const addWidgetAtBottom = (field: TemplateField) => {
    const def = FIELD_CATALOG[field.type]
    const nextRow =
      cardLayout.widgets.length > 0
        ? Math.max(...cardLayout.widgets.map((w) => w.row + w.rowSpan - 1)) + 1
        : 1

    const defaultSpan = field.type === 'image' ? 4 : field.type === 'text' ? 4 : 2
    const defaultRowSpan = field.type === 'image' ? 2 : 1

    const newWidget: CardGridWidget = {
      id: `w_${field.id}_${cardLayout.widgets.length + 1}`,
      fieldId: field.id,
      widgetType: def.defaultWidgetType || 'metric_chip',
      col: 1,
      row: nextRow,
      colSpan: defaultSpan,
      rowSpan: defaultRowSpan,
      options: { showLabel: true },
    }

    onChange({
      ...cardLayout,
      widgets: [...cardLayout.widgets, newWidget],
    })
    setSelectedWidgetId(newWidget.id)
  }

  // Calculate (col, row) from client coordinates relative to grid
  const calculateGridCoords = useCallback((clientX: number, clientY: number) => {
    if (!gridRef.current) return null
    const rect = gridRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const colStep = (rect.width - 24) / 4
    const rowStep = 48 + 8 // 48px cell + 8px gap
    const col = Math.min(4, Math.max(1, Math.floor(x / (colStep + 8)) + 1))
    const row = Math.max(1, Math.floor(y / rowStep) + 1)
    return { col, row }
  }, [])

  // MOVE WIDGET HANDLERS (Delta-based to prevent jumping on pointer down)
  const handleMovePointerDown = (e: React.PointerEvent, widget: CardGridWidget) => {
    e.preventDefault()
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    setSelectedWidgetId(widget.id)

    setActiveDrag({
      type: 'move',
      widgetId: widget.id,
      startX: e.clientX,
      startY: e.clientY,
      origin: { col: widget.col, row: widget.row, colSpan: widget.colSpan, rowSpan: widget.rowSpan },
    })
    setHoverGhost({
      col: widget.col,
      row: widget.row,
      colSpan: widget.colSpan,
      rowSpan: widget.rowSpan,
      isValid: true,
    })
  }

  const handleMovePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || activeDrag.type !== 'move' || !gridRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    const colStep = (rect.width - 24) / 4
    const rowStep = 48 + 8 // 56px

    const deltaX = e.clientX - activeDrag.startX
    const deltaY = e.clientY - activeDrag.startY

    const deltaCols = Math.round(deltaX / (colStep + 8))
    const deltaRows = Math.round(deltaY / rowStep)

    const newCol = Math.min(
      5 - activeDrag.origin.colSpan,
      Math.max(1, activeDrag.origin.col + deltaCols)
    )
    const newRow = Math.max(1, activeDrag.origin.row + deltaRows)

    setHoverGhost({
      col: newCol,
      row: newRow,
      colSpan: activeDrag.origin.colSpan,
      rowSpan: activeDrag.origin.rowSpan,
      isValid: true,
    })
  }

  const handleMovePointerUp = (e: React.PointerEvent) => {
    if (!activeDrag || activeDrag.type !== 'move') return
    const target = e.currentTarget as HTMLElement
    try {
      target.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }

    if (hoverGhost && hoverGhost.isValid) {
      updateWidget(activeDrag.widgetId, { col: hoverGhost.col, row: hoverGhost.row })
    } else {
      setSnapNotice(`Snapped back to Col ${activeDrag.origin.col}, Row ${activeDrag.origin.row}`)
      setTimeout(() => setSnapNotice(null), 1500)
    }
    setActiveDrag(null)
    setHoverGhost(null)
  }

  // RESIZE WIDGET HANDLERS
  const handleResizePointerDown = (
    e: React.PointerEvent,
    widget: CardGridWidget,
    allowVertical: boolean
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    setSelectedWidgetId(widget.id)

    const minSpan =
      widget.widgetType === 'image_banner' ? 2 : widget.widgetType === 'title_header' ? 2 : 1

    setActiveDrag({
      type: 'resize',
      widgetId: widget.id,
      startX: e.clientX,
      startY: e.clientY,
      startColSpan: widget.colSpan,
      startRowSpan: widget.rowSpan,
      allowVertical,
      minSpan,
    })
    setHoverGhost({
      col: widget.col,
      row: widget.row,
      colSpan: widget.colSpan,
      rowSpan: widget.rowSpan,
      isValid: true,
    })
  }

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || activeDrag.type !== 'resize' || !gridRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    const colWidth = rect.width / 4
    const deltaX = e.clientX - activeDrag.startX
    const deltaCols = Math.round(deltaX / colWidth)
    const widget = cardLayout.widgets.find((w) => w.id === activeDrag.widgetId)
    if (!widget) return

    const maxColSpan = 5 - widget.col
    const newColSpan = Math.min(
      maxColSpan,
      Math.max(activeDrag.minSpan, activeDrag.startColSpan + deltaCols)
    )

    let newRowSpan = activeDrag.startRowSpan
    if (activeDrag.allowVertical) {
      const deltaY = e.clientY - activeDrag.startY
      const deltaRows = Math.round(deltaY / 56)
      newRowSpan = Math.min(3, Math.max(1, activeDrag.startRowSpan + deltaRows))
    }

    setHoverGhost({
      col: widget.col,
      row: widget.row,
      colSpan: newColSpan,
      rowSpan: newRowSpan,
      isValid: true,
    })
  }

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!activeDrag || activeDrag.type !== 'resize') return
    const target = e.currentTarget as HTMLElement
    try {
      target.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }

    if (hoverGhost) {
      updateWidget(activeDrag.widgetId, {
        colSpan: hoverGhost.colSpan,
        rowSpan: hoverGhost.rowSpan,
      })
    }
    setActiveDrag(null)
    setHoverGhost(null)
  }

  // PALETTE DRAG HANDLERS (Drag from tray onto card)
  const handlePalettePointerDown = (e: React.PointerEvent, field: TemplateField) => {
    e.preventDefault()
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    const defaultSpan = field.type === 'image' ? 4 : field.type === 'text' ? 4 : 2
    const defaultRowSpan = field.type === 'image' ? 2 : 1

    setActiveDrag({
      type: 'palette',
      field,
      defaultSpan,
      defaultRowSpan,
    })
  }

  const handlePalettePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || activeDrag.type !== 'palette') return
    const coords = calculateGridCoords(e.clientX, e.clientY)
    if (!coords) {
      setHoverGhost(null)
      return
    }
    const isValid = coords.col + activeDrag.defaultSpan - 1 <= 4
    setHoverGhost({
      col: coords.col,
      row: coords.row,
      colSpan: activeDrag.defaultSpan,
      rowSpan: activeDrag.defaultRowSpan,
      isValid,
    })
  }

  const handlePalettePointerUp = (e: React.PointerEvent) => {
    if (!activeDrag || activeDrag.type !== 'palette') return
    const target = e.currentTarget as HTMLElement
    try {
      target.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }

    if (hoverGhost && hoverGhost.isValid) {
      const def = FIELD_CATALOG[activeDrag.field.type]
      const newWidget: CardGridWidget = {
        id: `w_${activeDrag.field.id}_${cardLayout.widgets.length + 1}`,
        fieldId: activeDrag.field.id,
        widgetType: def.defaultWidgetType || 'metric_chip',
        col: hoverGhost.col,
        row: hoverGhost.row,
        colSpan: hoverGhost.colSpan,
        rowSpan: hoverGhost.rowSpan,
        options: { showLabel: true },
      }
      onChange({
        ...cardLayout,
        widgets: [...cardLayout.widgets, newWidget],
      })
      setSelectedWidgetId(newWidget.id)
    }
    setActiveDrag(null)
    setHoverGhost(null)
  }

  const selectedWidget = cardLayout.widgets.find((w) => w.id === selectedWidgetId)
  const selectedField = selectedWidget
    ? fields.find((f) => f.id === selectedWidget.fieldId)
    : null

  // Calculate background cell grid dimensions
  const maxRow =
    cardLayout.widgets.length > 0
      ? Math.max(...cardLayout.widgets.map((w) => w.row + w.rowSpan - 1), 4)
      : 4
  const totalGridRows = Math.max(maxRow + 2, 5)

  const backgroundCells = []
  for (let r = 1; r <= totalGridRows; r++) {
    for (let c = 1; c <= 4; c++) {
      backgroundCells.push({ col: c, row: r })
    }
  }

  // Realistic mock data for accurate card previewing
  const mockValues: Record<string, unknown> = {}
  for (const f of fields) {
    if (f.type === 'image') {
      mockValues[f.id] =
        'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80'
    } else if (f.type === 'text' && f.id.includes('title')) {
      mockValues[f.id] = 'Classic Margherita Pizza'
    } else if (f.type === 'text') {
      mockValues[f.id] =
        'Crisp, airy crust topped with San Marzano tomatoes, fresh mozzarella, and fragrant basil.'
    } else if (f.type === 'number' && f.id.includes('prep')) {
      mockValues[f.id] = 20
    } else if (f.type === 'number' && f.id.includes('cook')) {
      mockValues[f.id] = 12
    } else if (f.type === 'number') {
      mockValues[f.id] = 30
    } else if (f.type === 'tag_category') {
      mockValues[f.id] = {
        cuisine: ['Italian'],
        course: ['Main Course'],
      }
    } else if (f.type === 'rating') {
      mockValues[f.id] = 4.8
    } else if (f.type === 'boolean') {
      mockValues[f.id] = true
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            Recipe Card Layout
          </h3>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex items-center text-muted-foreground hover:text-foreground cursor-help">
                  <Info className="h-3.5 w-3.5" />
                </span>
              }
            />
            <TooltipContent side="top">
              Customize how recipes appear in the catalog. Drag widgets to move them, drag edge handles to snap width across columns, or drag new widgets from the tray.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          {snapNotice && (
            <span className="text-xs text-amber-500 font-medium animate-in fade-in">
              {snapNotice}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="h-8 text-xs cursor-pointer border-border"
          >
            {previewMode ? (
              <>
                <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                <span>Layout Editor</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                <span>Card Preview</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Available Widgets Palette */}
        <div className="md:col-span-4 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Available Widgets
              </span>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="text-muted-foreground hover:text-foreground cursor-help">
                      <Info className="h-3 w-3" />
                    </span>
                  }
                />
                <TooltipContent side="top">
                  Click to add at the bottom, or drag directly onto the card grid to drop anywhere.
                </TooltipContent>
              </Tooltip>
            </div>

            {unplacedFields.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                All eligible fields have been placed on the card.
              </div>
            ) : (
              <div className="space-y-2">
                {unplacedFields.map((field) => {
                  const def = FIELD_CATALOG[field.type]
                  const IconComp = def ? def.icon : Clock
                  const isBeingDragged =
                    activeDrag?.type === 'palette' && activeDrag.field.id === field.id

                  return (
                    <div
                      key={field.id}
                      onPointerDown={(e) => handlePalettePointerDown(e, field)}
                      onPointerMove={handlePalettePointerMove}
                      onPointerUp={handlePalettePointerUp}
                      onClick={() => addWidgetAtBottom(field)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 transition-all cursor-grab active:cursor-grabbing select-none ${
                        isBeingDragged ? 'opacity-40 ring-2 ring-primary' : ''
                      }`}
                      title="Click to add or drag onto card"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center border border-border shrink-0">
                          <IconComp className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {field.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Selected Widget Quick Inspector */}
          {selectedWidget && selectedField && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in duration-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground truncate">
                  {selectedField.name} Widget
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWidget(selectedWidget.id)}
                  className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                  title="Remove from card"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center justify-between">
                  <span>Size:</span>
                  <span className="font-semibold text-foreground">
                    {selectedWidget.colSpan} columns × {selectedWidget.rowSpan} row{selectedWidget.rowSpan > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Position:</span>
                  <span className="font-semibold text-foreground">
                    Column {selectedWidget.col}, Row {selectedWidget.row}
                  </span>
                </div>
              </div>

              {/* Tag Display Group Multiselect */}
              {selectedWidget.widgetType === 'tag_chips' && categories && categories.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground block">
                      Tag Display Groups
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateWidget(selectedWidget.id, {
                          options: {
                            ...selectedWidget.options,
                            selectedTagGroups: [],
                          },
                        })
                      }
                      className="text-[10px] text-primary hover:underline cursor-pointer"
                    >
                      Show All
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Select specific tag categories to show on the card, or leave unselected to show all tags.
                  </p>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {categories.map((cat) => {
                      const selectedGroups = selectedWidget.options?.selectedTagGroups || []
                      const isChecked = selectedGroups.includes(cat.id) || selectedGroups.includes(cat.name)

                      return (
                        <label
                          key={cat.id}
                          className="flex items-center gap-2 text-xs text-foreground hover:bg-muted/40 p-1.5 rounded-lg cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...selectedGroups, cat.id]
                                : selectedGroups.filter((g) => g !== cat.id && g !== cat.name)
                              updateWidget(selectedWidget.id, {
                                options: {
                                  ...selectedWidget.options,
                                  selectedTagGroups: next,
                                },
                              })
                            }}
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span className="truncate">{cat.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {cat.tags.length} tag{cat.tags.length === 1 ? '' : 's'}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground/80 leading-relaxed pt-1 border-t border-border/50">
                Tip: Drag the widget's edge handle on the card to snap width, or drag its grip handle to reposition.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Card Canvas (~340px Frame) */}
          <div
            className={`w-[340px] max-w-full rounded-2xl border border-border bg-card shadow-sm relative overflow-hidden select-none ${
              previewMode ? 'p-0' : 'p-4'
            }`}
          >
            {previewMode ? (
              <CardGridRenderer
                cardLayout={cardLayout}
                fieldsSchema={fields}
                fieldValues={mockValues}
              />
            ) : (
              /* 4-Column CSS Grid Canvas with Fixed Row Heights */
              <div
                ref={gridRef}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gridAutoRows: '48px',
                  gap: '8px',
                  minHeight: `${totalGridRows * 56 - 8}px`,
                }}
                className="w-full relative"
              >
                {/* 1. Background Cell Layer (Absolute, perfectly aligned, cannot be displaced by multi-row widgets) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gridAutoRows: '48px',
                    gap: '8px',
                  }}
                  className="absolute inset-0 pointer-events-none"
                >
                  {backgroundCells.map(({ col, row }) => (
                    <div
                      key={`bg-cell-${col}-${row}`}
                      style={{
                        gridColumn: col,
                        gridRow: row,
                      }}
                      className={`w-full h-full rounded-xl border border-dashed transition-colors duration-150 ${
                        activeDrag
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border/40 bg-muted/10'
                      }`}
                    />
                  ))}
                </div>

                {/* 2. Landing Footprint Ghost (Shown while dragging or resizing) */}
                {hoverGhost && (
                  <div
                    style={{
                      gridColumn: `${hoverGhost.col} / span ${hoverGhost.colSpan}`,
                      gridRow: `${hoverGhost.row} / span ${hoverGhost.rowSpan}`,
                    }}
                    className={`rounded-xl border-2 pointer-events-none z-20 flex flex-col items-center justify-center shadow-xs transition-all duration-75 ${
                      hoverGhost.isValid
                        ? 'border-primary bg-primary/20 ring-2 ring-primary/30'
                        : 'border-destructive bg-destructive/20 ring-2 ring-destructive/30'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        hoverGhost.isValid
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-destructive text-white'
                      }`}
                    >
                      {hoverGhost.isValid
                        ? `${hoverGhost.colSpan}×${hoverGhost.rowSpan}`
                        : "Doesn't fit"}
                    </span>
                  </div>
                )}

                {/* 3. Placed Widgets (Foreground Grid) */}
                {cardLayout.widgets.map((widget) => {
                  const field = fields.find((f) => f.id === widget.fieldId)
                  const isSelected = selectedWidgetId === widget.id
                  const isBeingMoved =
                    activeDrag?.type === 'move' && activeDrag.widgetId === widget.id
                  const isBeingResized =
                    activeDrag?.type === 'resize' && activeDrag.widgetId === widget.id

                  const allowVertical =
                    widget.widgetType === 'image_banner' || widget.widgetType === 'text_snippet'

                  return (
                    <div
                      key={widget.id}
                      onClick={() => setSelectedWidgetId(widget.id)}
                      style={{
                        gridColumn: `${widget.col} / span ${widget.colSpan}`,
                        gridRow: `${widget.row} / span ${widget.rowSpan}`,
                      }}
                      className={`relative rounded-xl transition-all select-none group w-full h-full z-10 ${
                        isBeingMoved ? 'opacity-30' : ''
                      } ${
                        isBeingResized ? 'ring-2 ring-primary' : ''
                      } ${
                        isSelected
                          ? 'ring-2 ring-primary shadow-xs'
                          : 'hover:ring-1 hover:ring-border'
                      }`}
                  >
                    {/* Widget Content Preview */}
                    <SampleWidgetContent widget={widget} field={field} preview={previewMode} />

                    {/* Interactive Handles (Editor Mode Only) */}
                    {!previewMode && (
                      <>
                        {/* 1. Pick-Up / Move Handle (Top Left) */}
                        <div
                          onPointerDown={(e) => handleMovePointerDown(e, widget)}
                          onPointerMove={handleMovePointerMove}
                          onPointerUp={handleMovePointerUp}
                          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-background/90 border border-border shadow-xs cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground z-30"
                          title="Pick up and drag to move"
                        >
                          <GripVertical className="h-3 w-3" />
                        </div>

                        {/* 2. Trash Button (Top Right) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeWidget(widget.id)
                          }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-background/90 border border-border shadow-xs text-destructive hover:bg-destructive/10 cursor-pointer z-30"
                          title="Remove widget"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        {/* 3. Horizontal Resize Handle (Right Edge) */}
                        <div
                          onPointerDown={(e) => handleResizePointerDown(e, widget, false)}
                          onPointerMove={handleResizePointerMove}
                          onPointerUp={handleResizePointerUp}
                          className="absolute -right-1.5 top-2 bottom-2 w-3.5 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 group/handle"
                          title="Drag edge horizontally to snap across columns"
                        >
                          <div className="w-1 h-5 rounded-full bg-border group-hover/handle:bg-primary shadow-xs transition-colors" />
                        </div>

                        {/* 4. Corner Resize Handle (Bottom-Right, for Image & Text) */}
                        {allowVertical && (
                          <div
                            onPointerDown={(e) => handleResizePointerDown(e, widget, true)}
                            onPointerMove={handleResizePointerMove}
                            onPointerUp={handleResizePointerUp}
                            className="absolute -right-1 -bottom-1 w-4 h-4 cursor-nwse-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 group/handle"
                            title="Drag corner to snap width and height"
                          >
                            <div className="w-2.5 h-2.5 rounded-br border-r-2 border-b-2 border-muted-foreground/60 group-hover/handle:border-primary transition-colors" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SampleWidgetContent({
  widget,
  field,
  preview,
}: {
  widget: CardGridWidget
  field?: TemplateField
  preview: boolean
}) {
  const { widgetType } = widget

  if (widgetType === 'image_banner') {
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-muted/60 flex items-center justify-center border border-border">
        <img
          src="https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80"
          alt="Sample"
          className="w-full h-full object-cover"
        />
        {!preview && (
          <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono bg-black/70 text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
            Cover Photo ({widget.colSpan}×{widget.rowSpan})
          </span>
        )}
      </div>
    )
  }

  if (widgetType === 'title_header') {
    return (
      <div className="flex items-center w-full h-full px-2.5 rounded-xl border border-border bg-card">
        <h4 className="font-bold text-sm text-foreground truncate">
          {field?.name || 'Recipe Title'}
        </h4>
      </div>
    )
  }

  if (widgetType === 'metric_chip') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 w-full h-full rounded-xl border border-border bg-muted/30 text-xs text-foreground font-medium truncate">
        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="font-semibold truncate">
          25 {field?.config?.unit || 'min'}
        </span>
      </div>
    )
  }

  if (widgetType === 'tag_chips') {
    const selectedGroups = widget.options?.selectedTagGroups || []
    return (
      <div className="flex items-center gap-1 w-full h-full px-2.5 overflow-hidden rounded-xl border border-border bg-muted/20">
        <Tag className="h-3 w-3 text-muted-foreground shrink-0 mr-0.5" />
        <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border truncate">
          {selectedGroups.length > 0 ? selectedGroups[0] : 'Italian'}
        </span>
        <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border truncate">
          {selectedGroups.length > 1 ? selectedGroups[1] : 'Pasta'}
        </span>
        {selectedGroups.length > 2 && (
          <span className="text-[9px] text-muted-foreground font-mono">
            +{selectedGroups.length - 2}
          </span>
        )}
      </div>
    )
  }

  if (widgetType === 'rating_stars') {
    return (
      <div className="flex items-center gap-1 px-2.5 w-full h-full rounded-xl border border-border bg-muted/30 text-xs text-foreground">
        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
        <span className="font-bold">4.8</span>
      </div>
    )
  }

  if (widgetType === 'icon_badge') {
    return (
      <div className="flex items-center justify-center p-1.5 w-full h-full rounded-xl border border-border bg-muted/30 text-xs text-foreground">
        <span className="text-[11px] font-bold text-primary truncate">
          {field?.name || 'Badge'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center px-2.5 w-full h-full rounded-xl border border-border bg-muted/20 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground truncate block">
        {field?.name || 'Widget'}
      </span>
    </div>
  )
}
