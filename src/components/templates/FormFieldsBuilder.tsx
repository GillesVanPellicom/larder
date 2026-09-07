import { useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  createDefaultField,
  FIELD_CATALOG,
} from '@/components/template-engine/fieldCatalog'
import type { FieldType, TagCategory, TemplateField } from '@/shared/types'
import {
  GripVertical,
  Info,
  Minus,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react'

interface FormFieldsBuilderProps {
  fields: TemplateField[]
  onChange: (fields: TemplateField[]) => void
  categories?: TagCategory[]
  onDeleteRequest: (field: TemplateField) => void
}

export function FormFieldsBuilder({
  fields,
  onChange,
  categories = [],
  onDeleteRequest,
}: FormFieldsBuilderProps) {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)

  // Configure touch-friendly sensors with activation delay so scrolling is not blocked!
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag begins
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)
      const reordered = arrayMove(fields, oldIndex, newIndex).map((f, idx) => ({
        ...f,
        order: idx + 1,
      }))
      onChange(reordered)
    }
  }

  const addField = (type: FieldType) => {
    const newField = createDefaultField(type, fields.length + 1)
    onChange([...fields, newField])
    setShowAddMenu(false)
    setEditingFieldId(newField.id)
  }

  const updateField = (id: string, patch: Partial<TemplateField>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  const updateConfig = (id: string, patch: Partial<TemplateField['config']>) => {
    onChange(
      fields.map((f) =>
        f.id === id ? { ...f, config: { ...f.config, ...patch } } : f
      )
    )
  }

  const editingField = fields.find((f) => f.id === editingFieldId)

  return (
    <div className="space-y-6">
      {/* Header and Add Component Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Form Components
            </h3>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="text-muted-foreground hover:text-foreground cursor-help">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                }
              />
              <TooltipContent side="top">
                Add and reorder components to customize your recipe form. Drag using the grip handle to change field order.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure the fields that appear when adding or editing recipes.
          </p>
        </div>

        <div className="relative">
          <Button
            size="sm"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="cursor-pointer font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Add Component</span>
          </Button>

          {/* Add Component Palette Dropdown */}
          {showAddMenu && (
            <div className="absolute right-0 top-11 z-30 w-72 rounded-2xl border border-border bg-card p-2 shadow-lg animate-in fade-in zoom-in-95 duration-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1.5 block">
                Component Palette
              </span>
              <div className="space-y-1">
                {(Object.keys(FIELD_CATALOG) as FieldType[]).map((type) => {
                  const item = FIELD_CATALOG[type]
                  const IconComp = item.icon
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addField(type)}
                      className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left hover:bg-muted transition-colors cursor-pointer"
                    >
                      <IconComp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-foreground block truncate">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground block line-clamp-1">
                          {item.description}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Sortable Canvas & Field Settings Drawer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sortable Field List */}
        <div className="md:col-span-7 space-y-2.5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2.5">
                {fields.map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    isSelected={editingFieldId === field.id}
                    onSelect={() =>
                      setEditingFieldId(
                        editingFieldId === field.id ? null : field.id
                      )
                    }
                    onDelete={() => onDeleteRequest(field)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Field Configuration Drawer */}
        <div className="md:col-span-5">
          {editingField ? (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs animate-in fade-in duration-150 sticky top-20">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Settings2 className="h-3.5 w-3.5 text-primary" />
                  <span>Configure Field</span>
                </span>
                <span className="text-[10px] font-mono rounded bg-muted px-2 py-0.5 text-muted-foreground">
                  {editingField.type}
                </span>
              </div>

              {/* Field Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Field Label / Title
                </label>
                <Input
                  value={editingField.name}
                  onChange={(e) =>
                    updateField(editingField.id, { name: e.target.value })
                  }
                  placeholder="e.g. Baking Time"
                  className="text-sm font-medium"
                />
              </div>

              {/* Mandatory Field Switch (Except for separators) */}
              {editingField.type !== 'separator' && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      Required Field
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
                        Requires this field to be filled in before saving a recipe.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={editingField.required}
                    onCheckedChange={(req) =>
                      updateField(editingField.id, { required: req })
                    }
                  />
                </div>
              )}

              {/* Field-Specific Configurations */}
              {/* Type: Text */}
              {editingField.type === 'text' && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Placeholder Text
                    </label>
                    <Input
                      value={editingField.config.placeholder || ''}
                      onChange={(e) =>
                        updateConfig(editingField.id, {
                          placeholder: e.target.value,
                        })
                      }
                      placeholder="e.g. Briefly describe..."
                      className="text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground">
                        Multi-line Textarea
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
                          Provides a multi-line text area for paragraphs instead of a single-line input.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={Boolean(editingField.config.multiline)}
                      onCheckedChange={(multi) =>
                        updateConfig(editingField.id, { multiline: multi })
                      }
                    />
                  </div>

                  {editingField.config.multiline && (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">
                          User Resizable Box
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
                            Allows authors to freely drag the corner to adjust the height of the text area.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={Boolean(editingField.config.resizable)}
                        onCheckedChange={(res) =>
                          updateConfig(editingField.id, { resizable: res })
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Type: Number */}
              {editingField.type === 'number' && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Unit Label
                    </label>
                    <Input
                      value={editingField.config.unit || ''}
                      onChange={(e) =>
                        updateConfig(editingField.id, { unit: e.target.value })
                      }
                      placeholder="e.g. min, g, °C, servings"
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Min Value
                      </label>
                      <Input
                        type="number"
                        value={
                          editingField.config.min !== undefined
                            ? String(editingField.config.min)
                            : ''
                        }
                        onChange={(e) =>
                          updateConfig(editingField.id, {
                            min: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Max Value
                      </label>
                      <Input
                        type="number"
                        value={
                          editingField.config.max !== undefined
                            ? String(editingField.config.max)
                            : ''
                        }
                        onChange={(e) =>
                          updateConfig(editingField.id, {
                            max: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Type: Tag Category */}
              {editingField.type === 'tag_category' && (
                <div className="space-y-3 pt-1">
                  {categories.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Bound Taxonomy Category
                      </label>
                      <select
                        value={editingField.config.categoryId || ''}
                        onChange={(e) =>
                          updateConfig(editingField.id, { categoryId: e.target.value })
                        }
                        className="w-full h-8 px-2 text-xs rounded-lg border border-input bg-background text-foreground"
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground">
                        Exclusive Selection
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
                          Only allows selecting a single tag for this category instead of multiple tags.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={Boolean(editingField.config.exclusive)}
                      onCheckedChange={(exc) =>
                        updateConfig(editingField.id, { exclusive: exc })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Type: Separator */}
              {editingField.type === 'separator' && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Divider Style
                  </label>
                  <div className="flex items-center gap-2">
                    {(['heading', 'line', 'dashed'] as const).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() =>
                          updateConfig(editingField.id, {
                            separatorStyle: style,
                          })
                        }
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-all cursor-pointer ${
                          editingField.config.separatorStyle === style
                            ? 'bg-foreground text-background border-foreground font-bold shadow-xs'
                            : 'bg-card text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground block">
                No Field Selected
              </span>
              <span>Click on any field to configure its labels, units, or validation rules.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SortableFieldItem({
  field,
  isSelected,
  onSelect,
  onDelete,
}: {
  field: TemplateField
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  }

  const def = FIELD_CATALOG[field.type]
  const IconComp = def ? def.icon : Minus

  if (field.type === 'separator') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={onSelect}
        className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
          isSelected
            ? 'border-primary bg-primary/5 ring-1 ring-primary'
            : 'border-border/60 bg-muted/30 hover:border-border hover:bg-muted/50'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-muted-foreground hover:text-foreground p-1 cursor-grab active:cursor-grabbing shrink-0"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <IconComp className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
            {field.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            title="Delete divider"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
          : 'border-border bg-card hover:border-border/80 hover:bg-muted/10 shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground p-1 cursor-grab active:cursor-grabbing shrink-0"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
          <IconComp className="h-4 w-4 text-primary" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground truncate">
              {field.name}
            </span>
            {field.required && (
              <span className="text-destructive font-bold text-xs" title="Required">
                *
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-mono">
              {def?.label || field.type}
            </span>
            {field.config.unit && (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 rounded">
                {field.config.unit}
              </span>
            )}
            {field.isArchived && (
              <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 rounded">
                Archived
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Configure field"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
          title="Delete field"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
