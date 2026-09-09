import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { IngredientItem } from '@/shared/types'
import { GripVertical, Plus, Trash2 } from 'lucide-react'

interface RecipeIngredientsEditorProps {
  ingredients: IngredientItem[]
  onIngredientChange: (index: number, field: keyof IngredientItem, val: string) => void
  onAddRow: () => void
  onRemoveRow: (index: number) => void
  onReorder?: (newIngredients: IngredientItem[]) => void
  isMandatory: boolean
  error?: string
}

interface SortableIngredientRowProps {
  item: IngredientItem
  index: number
  totalCount: number
  onIngredientChange: (index: number, field: keyof IngredientItem, val: string) => void
  onAddRow: () => void
  onRemoveRow: (index: number) => void
}

function SortableIngredientRow({
  item,
  index,
  totalCount,
  onIngredientChange,
  onAddRow,
  onRemoveRow,
}: SortableIngredientRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 bg-card rounded-xl transition-shadow ${
        isDragging ? 'shadow-lg opacity-80 ring-2 ring-primary/30 z-30' : ''
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground hover:text-foreground touch-none shrink-0 rounded-md hover:bg-muted/60 transition-colors"
        title="Reorder ingredient"
        aria-label="Reorder ingredient"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Input
        placeholder="Qty"
        value={item.amount || ''}
        onChange={(e) => onIngredientChange(index, 'amount', e.target.value)}
        className="w-20 shrink-0 text-sm"
      />
      <Input
        placeholder="Unit (g, cup)"
        value={item.unit || ''}
        onChange={(e) => onIngredientChange(index, 'unit', e.target.value)}
        className="w-28 shrink-0 text-sm"
      />
      <Input
        placeholder="Ingredient name"
        value={item.name}
        onChange={(e) => onIngredientChange(index, 'name', e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onAddRow()
          }
        }}
        className="flex-1 text-sm font-medium"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onRemoveRow(index)}
        disabled={totalCount <= 1}
        title="Remove ingredient"
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 shrink-0 cursor-pointer"
      >
        <Trash2 className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
      </Button>
    </div>
  )
}

export function RecipeIngredientsEditor({
  ingredients,
  onIngredientChange,
  onAddRow,
  onRemoveRow,
  onReorder,
  isMandatory,
  error,
}: RecipeIngredientsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = ingredients.findIndex((i) => i.id === active.id)
    const newIndex = ingredients.findIndex((i) => i.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1 && onReorder) {
      onReorder(arrayMove(ingredients, oldIndex, newIndex))
    }
  }

  return (
    <div data-field="ingredients" className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Ingredients {isMandatory && <span className="text-destructive">*</span>}
        </h2>
        <InfoTooltip content="Specify quantities, units, and ingredients. Drag handle to reorder. Press Enter to append a row." />
      </div>

      {error && (
        <div className="text-xs text-destructive font-medium">{error}</div>
      )}

      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="min-w-[540px]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={ingredients.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {ingredients.map((item, idx) => (
                  <SortableIngredientRow
                    key={item.id}
                    item={item}
                    index={idx}
                    totalCount={ingredients.length}
                    onIngredientChange={onIngredientChange}
                    onAddRow={onAddRow}
                    onRemoveRow={onRemoveRow}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onAddRow}
          className="cursor-pointer font-semibold px-6 shadow-2xs"
        >
          <Plus className="h-4.5 w-4.5 mr-1.5" /> Add
        </Button>
      </div>
    </div>
  )
}
