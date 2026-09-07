import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { MandatoryFieldsConfig, MetadataConfig, TagCategory } from '@/shared/types'
import { Check, Info, Sliders } from 'lucide-react'

interface MetadataRulesTabProps {
  metadataConfig: MetadataConfig | null
  categories: TagCategory[]
  onSaveConfig: (config: MetadataConfig) => Promise<void>
}

export function MetadataRulesTab({
  metadataConfig,
  categories,
  onSaveConfig,
}: MetadataRulesTabProps) {
  const [fields, setFields] = useState<MandatoryFieldsConfig>(
    metadataConfig?.mandatoryFields || {
      title: true,
      ingredients: true,
      instructions: true,
      image_url: false,
      description: false,
      yield_amount: false,
      prep_time_minutes: false,
      cook_time_minutes: false,
      total_time_minutes: false,
    }
  )
  const [mandatoryCategories, setMandatoryCategories] = useState<string[]>(
    metadataConfig?.mandatoryCategories || []
  )
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const toggleField = (key: keyof MandatoryFieldsConfig) => {
    if (key === 'title' || key === 'ingredients' || key === 'instructions') return
    setFields((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleCategoryMandate = (catId: string) => {
    setMandatoryCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSaveConfig({
        mandatoryFields: {
          ...fields,
          title: true,
          ingredients: true,
          instructions: true,
        },
        mandatoryCategories,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const fieldList: { key: keyof MandatoryFieldsConfig; label: string; desc: string; locked?: boolean }[] = [
    { key: 'title', label: 'Recipe Title', desc: 'Primary identifier for any recipe', locked: true },
    { key: 'ingredients', label: 'Ingredients', desc: 'Required listing of ingredients', locked: true },
    { key: 'instructions', label: 'Instructions', desc: 'Directions or preparation steps', locked: true },
    { key: 'image_url', label: 'Recipe Image', desc: 'Disallow recipes without hero photos' },
    { key: 'description', label: 'Description / Summary', desc: 'Short synopsis of dish' },
    { key: 'yield_amount', label: 'Yield', desc: 'Portion or serving count' },
    { key: 'prep_time_minutes', label: 'Prep Time', desc: 'Minutes to prepare ingredients' },
    { key: 'cook_time_minutes', label: 'Cook Time', desc: 'Minutes to cook dish' },
    { key: 'total_time_minutes', label: 'Total Time', desc: 'Overall duration requirement' },
  ]

  return (
    <div className="space-y-6">
      {/* 1. Mandatory Field Requirements */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Mandatory Field Requirements
          </h2>
          <Tooltip>
            <TooltipTrigger
              render={
                <button type="button" className="p-0.5 text-muted-foreground hover:text-foreground cursor-help">
                  <Info className="h-3.5 w-3.5" />
                </button>
              }
            />
            <TooltipContent className="max-w-xs">
              Toggle attributes that must be present in every recipe. Non-compliant recipes will be flagged on the Conflicts page.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-2 divide-y divide-border rounded-xl border border-border bg-muted/20 p-4">
          {fieldList.map(({ key, label, desc, locked }) => (
            <div key={key} className="flex items-center justify-between pt-2.5 first:pt-0">
              <div>
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              {locked ? (
                <Badge variant="outline" className="text-xs font-normal">
                  Always Required
                </Badge>
              ) : (
                <Switch
                  checked={Boolean(fields[key])}
                  onCheckedChange={() => toggleField(key)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Mandatory Tag Categories */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Mandatory Tag Categories
          </h2>
          <Tooltip>
            <TooltipTrigger
              render={
                <button type="button" className="p-0.5 text-muted-foreground hover:text-foreground cursor-help">
                  <Info className="h-3.5 w-3.5" />
                </button>
              }
            />
            <TooltipContent className="max-w-xs">
              Require that all recipes assign at least one tag from each selected category.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const isChecked = mandatoryCategories.includes(cat.id)
            return (
              <label
                key={cat.id}
                className={`flex items-center justify-between rounded-xl border p-3.5 transition-colors cursor-pointer ${
                  isChecked
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div>
                  <span className="text-sm font-semibold block">{cat.name}</span>
                  <span className="text-[11px] opacity-70">
                    {cat.exclusive ? 'Single Choice (Exclusive)' : 'Multiple Choices Allowed'}
                  </span>
                </div>
                <Switch
                  checked={isChecked}
                  onCheckedChange={() => toggleCategoryMandate(cat.id)}
                />
              </label>
            )
          })}
        </div>
      </div>

      {/* Save Button & Status Feedback */}
      <div className="flex items-center justify-between pt-2">
        {success ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" /> Global rules saved and recipes evaluated!
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Changes will automatically trigger conflict evaluation across the recipe library.
          </span>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-32 cursor-pointer"
        >
          {saving ? 'Evaluating...' : <><Sliders className="h-4 w-4 mr-1.5" /> Save Rules</>}
        </Button>
      </div>
    </div>
  )
}
