import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { QuillEditor } from '@/components/QuillEditor'
import type { IngredientItem, TagCategory, TemplateField } from '@/shared/types'
import {
  Image as ImageIcon,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react'

interface DynamicFieldInputProps {
  field: TemplateField
  value: unknown
  onChange: (value: unknown) => void
  categories?: TagCategory[]
  error?: string
}

export function DynamicFieldInput({
  field,
  value,
  onChange,
  categories = [],
  error,
}: DynamicFieldInputProps) {
  const { type, name, required, config } = field

  // RENDER SEPARATOR / SECTION HEADER
  if (type === 'separator') {
    return (
      <div className="pt-4 pb-2">
        {config.separatorStyle === 'line' ? (
          <div className="border-t border-border" />
        ) : config.separatorStyle === 'dashed' ? (
          <div className="border-t border-dashed border-border" />
        ) : (
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              {name}
            </h3>
            <div className="h-px bg-border flex-1" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1.5 animate-in fade-in duration-100">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span>{name}</span>
          {required && <span className="text-destructive font-bold">*</span>}
          {config.unit && (
            <span className="text-[10px] font-mono normal-case rounded bg-muted px-1.5 py-0.2 text-muted-foreground">
              {config.unit}
            </span>
          )}
        </label>
        {field.isArchived && (
          <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
            Archived
          </span>
        )}
      </div>

      {/* FIELD TYPE 1: TEXT */}
      {type === 'text' && (
        <>
          {config.multiline ? (
            <textarea
              placeholder={config.placeholder || ''}
              value={(value as string) || ''}
              maxLength={config.maxLength}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              className={`w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground ${
                config.resizable ? 'resize-y' : 'resize-none'
              } ${error ? 'border-destructive' : ''}`}
            />
          ) : (
            <Input
              placeholder={config.placeholder || ''}
              value={(value as string) || ''}
              maxLength={config.maxLength}
              onChange={(e) => onChange(e.target.value)}
              className={error ? 'border-destructive' : ''}
            />
          )}
        </>
      )}

      {/* FIELD TYPE 2: NUMBER */}
      {type === 'number' && (
        <div className="relative flex items-center max-w-xs">
          <Input
            type="number"
            min={config.min}
            max={config.max}
            step={config.step || 1}
            placeholder={config.placeholder || '0'}
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Number(e.target.value)
              onChange(val)
            }}
            className={`pr-14 ${error ? 'border-destructive' : ''}`}
          />
          {config.unit && (
            <span className="absolute right-3 text-xs font-mono text-muted-foreground pointer-events-none">
              {config.unit}
            </span>
          )}
        </div>
      )}

      {/* FIELD TYPE 3: RICH TEXT (QUILL) */}
      {type === 'rich_text' && (
        <div className={error ? 'border border-destructive rounded-xl' : ''}>
          <QuillEditor
            value={(value as string) || ''}
            onChange={(html) => onChange(html)}
            placeholder={config.placeholder || 'Write content here...'}
          />
        </div>
      )}

      {/* FIELD TYPE 4: BOOLEAN / TOGGLE */}
      {type === 'boolean' && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <span className="text-sm font-medium text-foreground">
            {value ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      )}

      {/* FIELD TYPE 5: STAR RATING */}
      {type === 'rating' && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg border border-border bg-card max-w-fit">
          {[1, 2, 3, 4, 5].map((star) => {
            const currentRating = Number(value) || 0
            const filled = star <= currentRating
            return (
              <button
                key={star}
                type="button"
                onClick={() => onChange(currentRating === star ? 0 : star)}
                className="p-1 text-muted-foreground hover:text-amber-400 transition-colors cursor-pointer"
                title={`${star} stars`}
              >
                <Star
                  className={`h-5 w-5 ${
                    filled
                      ? 'fill-amber-400 text-amber-400'
                      : 'hover:fill-amber-400/30'
                  }`}
                />
              </button>
            )
          })}
          {Number(value) > 0 && (
            <span className="text-xs font-mono font-bold text-amber-500 ml-1.5">
              {Number(value).toFixed(1)}
            </span>
          )}
        </div>
      )}

      {/* FIELD TYPE 6: COVER IMAGE */}
      {type === 'image' && (
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder={config.placeholder || 'https://images.unsplash.com/...'}
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              className={`pl-9 pr-9 ${error ? 'border-destructive' : ''}`}
            />
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            {Boolean(value) && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                title="Clear image URL"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {Boolean(value) && (
            <div className="relative h-44 w-full rounded-xl overflow-hidden border border-border bg-muted/20">
              <img
                src={String(value)}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = ''
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* FIELD TYPE 7: INGREDIENT TABLE */}
      {type === 'ingredient_table' && (
        <div className="space-y-2">
          {(() => {
            const rawIngredients = Array.isArray(value) ? (value as IngredientItem[]) : []
            const rows =
              rawIngredients.length > 0
                ? rawIngredients
                : [{ id: '1', name: '', amount: '', unit: '' }]

            const updateRow = (idx: number, patch: Partial<IngredientItem>) => {
              const updated = [...rows]
              updated[idx] = { ...updated[idx], ...patch }
              onChange(updated)
            }

            const addRow = () => {
              onChange([
                ...rows,
                { id: String(Date.now() + Math.random()), name: '', amount: '', unit: '' },
              ])
            }

            const removeRow = (idx: number) => {
              if (rows.length <= 1) return
              onChange(rows.filter((_, i) => i !== idx))
            }

            return (
              <div className="space-y-2">
                {rows.map((row, idx) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Qty"
                      value={row.amount || ''}
                      onChange={(e) => updateRow(idx, { amount: e.target.value })}
                      className="w-20 shrink-0 text-sm"
                    />
                    <Input
                      placeholder="Unit"
                      value={row.unit || ''}
                      onChange={(e) => updateRow(idx, { unit: e.target.value })}
                      className="w-28 shrink-0 text-sm"
                    />
                    <Input
                      placeholder="Ingredient name"
                      value={row.name || ''}
                      onChange={(e) => updateRow(idx, { name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addRow()
                        }
                      }}
                      className="flex-1 text-sm font-medium"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeRow(idx)}
                      disabled={rows.length <= 1}
                      title="Remove ingredient row"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRow}
                  className="text-xs font-semibold cursor-pointer border-dashed"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Ingredient Row
                </Button>
              </div>
            )
          })()}
        </div>
      )}

      {/* FIELD TYPE 8: TAG CATEGORIES */}
      {type === 'tag_category' && (
        <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
          {categories.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No tag categories found. Create categories in Settings &gt; Tags & Taxonomy.
            </p>
          ) : (
            categories.map((cat) => {
              const selectedDict = (value as Record<string, string[]>) || {}
              const currentSelected = selectedDict[cat.id] || []
              const isExclusive = cat.exclusive || config.exclusive

              const handleToggle = (tag: string) => {
                let nextList: string[]
                if (isExclusive) {
                  nextList = currentSelected.includes(tag) ? [] : [tag]
                } else {
                  nextList = currentSelected.includes(tag)
                    ? currentSelected.filter((t) => t !== tag)
                    : [...currentSelected, tag]
                }
                onChange({
                  ...selectedDict,
                  [cat.id]: nextList,
                })
              }

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{cat.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {isExclusive ? '(Single choice)' : '(Multiple)'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.tags.map((tag) => {
                      const active = currentSelected.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggle(tag)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            active
                              ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
                              : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && <div className="text-xs text-destructive font-medium">{error}</div>}
    </div>
  )
}
