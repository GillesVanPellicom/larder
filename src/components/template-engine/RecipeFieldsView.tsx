import type { RecipeTemplate, TagCategory } from '@/shared/types'
import { Star } from 'lucide-react'

interface RecipeFieldsViewProps {
  template?: RecipeTemplate | null
  fieldValues?: Record<string, unknown>
  categories?: TagCategory[]
}

export function RecipeFieldsView({
  template,
  fieldValues = {},
  categories = [],
}: RecipeFieldsViewProps) {
  if (!template || !template.currentVersion) return null

  const fields = template.currentVersion.fieldsSchema || []
  // Filter out core fields that are rendered in hero or dedicated sections
  const extraFields = fields.filter((f) => {
    const isStandardCore = [
      'fld_title',
      'fld_description',
      'fld_image',
      'fld_yield',
      'fld_prep_time',
      'fld_cook_time',
      'fld_total_time',
      'fld_ingredients',
      'fld_instructions',
      'fld_notes',
      'fld_tags',
    ].includes(f.id)
    return !isStandardCore && !f.isArchived
  })

  if (extraFields.length === 0) return null

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Additional Recipe Attributes
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {extraFields.map((field) => {
          const rawVal = fieldValues[field.id]
          if (rawVal === undefined || rawVal === null || rawVal === '') return null

          if (field.type === 'separator') {
            return (
              <div key={field.id} className="col-span-full pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {field.name}
                </span>
                <div className="h-px bg-border mt-1" />
              </div>
            )
          }

          if (field.type === 'rating') {
            const score = Number(rawVal) || 0
            return (
              <div key={field.id} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground block">
                  {field.name}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="text-sm font-bold text-foreground">
                    {score.toFixed(1)} / 5.0
                  </span>
                </div>
              </div>
            )
          }

          if (field.type === 'boolean') {
            return (
              <div key={field.id} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {field.name}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  rawVal
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {rawVal ? 'Yes' : 'No'}
                </span>
              </div>
            )
          }

          if (field.type === 'number') {
            return (
              <div key={field.id} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground block">
                  {field.name}
                </span>
                <span className="text-sm font-bold text-foreground font-mono">
                  {String(rawVal)} {field.config.unit || ''}
                </span>
              </div>
            )
          }

          if (field.type === 'tag_category') {
            const cat = categories.find((c) => c.id === field.config.categoryId)
            const tagsList = Array.isArray(rawVal)
              ? (rawVal as string[])
              : typeof rawVal === 'string'
              ? [rawVal]
              : []
            return (
              <div key={field.id} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground block">
                  {field.name}
                </span>
                <div className="flex flex-wrap gap-1">
                  {tagsList.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded-md font-medium border border-border bg-card text-foreground"
                    >
                      {cat ? `${cat.name}: ` : ''}{String(t)}
                    </span>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <div key={field.id} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground block">
                {field.name}
              </span>
              <p className="text-xs text-foreground font-medium whitespace-pre-wrap">
                {String(rawVal)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
