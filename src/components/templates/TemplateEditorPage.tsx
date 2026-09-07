import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FormFieldsBuilder } from './FormFieldsBuilder'
import { CardGridDesigner } from './CardGridDesigner'
import type {
  CardGridLayoutConfig,
  RecipeTemplate,
  TagCategory,
  TemplateField,
} from '@/shared/types'
import type { TemplateUpdateConflict } from '@/services/api'
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Check,
  Clock,
  GitBranch,
  History,
  Info,
  LayoutTemplate,
  RotateCcw,
  Sliders,
  Trash2,
} from 'lucide-react'

export interface TemplateEditorPageProps {
  template?: RecipeTemplate | null
  categories?: TagCategory[]
  onBack: () => void
  onSave: (data: {
    name: string
    description?: string
    isDefault?: boolean
    changeSummary?: string
    fieldsSchema: TemplateField[]
    cardLayout: CardGridLayoutConfig
    archiveRemovedFields?: boolean
    confirmPurgeRemovedFields?: boolean
  }) => Promise<RecipeTemplate | TemplateUpdateConflict>
  onRollback?: (targetVersionId: number) => Promise<RecipeTemplate>
  onDuplicate?: (id: string) => Promise<RecipeTemplate>
}

export function TemplateEditorPage({
  template,
  categories = [],
  onBack,
  onSave,
  onRollback,
  onDuplicate,
}: TemplateEditorPageProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'card' | 'history'>('fields')

  // Working Template State
  const [name, setName] = useState(template?.name || 'New Recipe Template')
  const [description, setDescription] = useState(template?.description || '')
  const [isDefault, setIsDefault] = useState(template?.isDefault || false)
  const [changeSummary, setChangeSummary] = useState('')
  const [fields, setFields] = useState<TemplateField[]>([])
  const [cardLayout, setCardLayout] = useState<CardGridLayoutConfig>({
    columns: 4,
    widgets: [],
  })

  // Conflict Resolution State
  const [saving, setSaving] = useState(false)
  const [conflictData, setConflictData] = useState<TemplateUpdateConflict | null>(null)

  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description || '')
      setIsDefault(template.isDefault)
      setChangeSummary('')

      const currentVer = template.currentVersion
      if (currentVer) {
        setFields(currentVer.fieldsSchema || [])
        setCardLayout(currentVer.cardLayout || { columns: 4, widgets: [] })
      }
    } else {
      setName('New Recipe Template')
      setDescription('')
      setIsDefault(false)
      setChangeSummary('')
      // Default core fields for a new template
      setFields([
        {
          id: 'fld_title',
          name: 'Recipe Title',
          type: 'text',
          required: true,
          order: 0,
          config: { placeholder: 'e.g. Grandma’s Carbonara' },
        },
        {
          id: 'fld_description',
          name: 'Description',
          type: 'text',
          required: false,
          order: 1,
          config: { multiline: true, resizable: true },
        },
        {
          id: 'fld_image',
          name: 'Cover Photo',
          type: 'image',
          required: false,
          order: 2,
          config: {},
        },
        {
          id: 'fld_prep_time',
          name: 'Prep Time',
          type: 'number',
          required: false,
          order: 3,
          config: { unit: 'min', min: 0 },
        },
        {
          id: 'fld_cook_time',
          name: 'Cook Time',
          type: 'number',
          required: false,
          order: 4,
          config: { unit: 'min', min: 0 },
        },
        {
          id: 'fld_yield',
          name: 'Yield',
          type: 'text',
          required: false,
          order: 5,
          config: { placeholder: 'e.g. 4 servings' },
        },
        {
          id: 'fld_ingredients',
          name: 'Ingredients',
          type: 'ingredient_table',
          required: true,
          order: 6,
          config: {},
        },
        {
          id: 'fld_instructions',
          name: 'Instructions',
          type: 'rich_text',
          required: true,
          order: 7,
          config: {},
        },
      ])
      setCardLayout({
        columns: 4,
        widgets: [
          {
            id: 'w_fld_image_1',
            fieldId: 'fld_image',
            widgetType: 'image_banner',
            col: 1,
            row: 1,
            colSpan: 4,
            rowSpan: 2,
          },
          {
            id: 'w_fld_title_2',
            fieldId: 'fld_title',
            widgetType: 'title_header',
            col: 1,
            row: 3,
            colSpan: 4,
            rowSpan: 1,
          },
          {
            id: 'w_fld_cook_time_3',
            fieldId: 'fld_cook_time',
            widgetType: 'metric_chip',
            col: 1,
            row: 4,
            colSpan: 2,
            rowSpan: 1,
          },
          {
            id: 'w_fld_yield_4',
            fieldId: 'fld_yield',
            widgetType: 'metric_chip',
            col: 3,
            row: 4,
            colSpan: 2,
            rowSpan: 1,
          },
        ],
      })
    }
  }, [template])

  const handleSaveAttempt = async (options?: {
    archiveRemovedFields?: boolean
    confirmPurgeRemovedFields?: boolean
  }) => {
    if (!name.trim()) return

    try {
      setSaving(true)
      const res = await onSave({
        name: name.trim(),
        description: description.trim(),
        isDefault,
        changeSummary: changeSummary.trim() || undefined,
        fieldsSchema: fields,
        cardLayout,
        archiveRemovedFields: options?.archiveRemovedFields,
        confirmPurgeRemovedFields: options?.confirmPurgeRemovedFields,
      })

      if ('requiresResolution' in res && res.requiresResolution) {
        setConflictData(res as TemplateUpdateConflict)
      } else {
        setConflictData(null)
        onBack()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFieldRequest = (field: TemplateField) => {
    // Stage field removal from working list
    setFields((prev) => prev.filter((f) => f.id !== field.id))
    // Remove any placed widget referencing this field
    setCardLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.fieldId !== field.id),
    }))
  }

  const versions = template?.versions || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            title="Back to Settings"
            className="h-8 w-8 cursor-pointer border-border hover:bg-muted text-foreground shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
                {template ? `Edit Template: ${name}` : 'New Recipe Template'}
              </h1>
              {template?.currentVersion && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                  v{template.currentVersion.version}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize recipe components, order, and card presentation.
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card">
            <span className="text-xs font-semibold text-foreground">Default</span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="text-muted-foreground hover:text-foreground cursor-help">
                    <Info className="h-3 w-3" />
                  </span>
                }
              />
              <TooltipContent side="top">
                When enabled, new recipes will automatically use this template.
              </TooltipContent>
            </Tooltip>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            disabled={saving || !name.trim()}
            onClick={() => handleSaveAttempt()}
            className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            <span>{saving ? 'Saving...' : 'Save Template'}</span>
          </Button>
        </div>
      </div>

      {/* Template Metadata Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card border border-border rounded-2xl p-4 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Template Name</label>
            <span className="text-destructive font-bold text-xs">*</span>
          </div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Classic Recipe, Baking Formula"
            className="text-xs font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <span className="text-[10px] text-muted-foreground">(Optional)</span>
          </div>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of this template"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Version Notes</label>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="text-muted-foreground hover:text-foreground cursor-help">
                    <Info className="h-3 w-3" />
                  </span>
                }
              />
              <TooltipContent side="top">
                Summary of changes saved to the template version log.
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="e.g. Added rating widget, reordered time fields"
            className="text-xs font-mono"
          />
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('fields')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
            activeTab === 'fields'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Fields &amp; Structure</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
            {fields.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('card')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
            activeTab === 'card'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          <span>Card Layout</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
            {cardLayout.widgets.length}
          </span>
        </button>

        {template && (
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Version History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
              {versions.length}
            </span>
          </button>
        )}
      </div>

      {/* TAB CONTENT 1: Fields & Structure */}
      {activeTab === 'fields' && (
        <FormFieldsBuilder
          fields={fields}
          onChange={setFields}
          categories={categories}
          onDeleteRequest={handleDeleteFieldRequest}
        />
      )}

      {/* TAB CONTENT 2: Card Layout */}
      {activeTab === 'card' && (
        <CardGridDesigner
          fields={fields}
          cardLayout={cardLayout}
          onChange={setCardLayout}
        />
      )}

      {/* TAB CONTENT 3: Version History */}
      {activeTab === 'history' && template && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">
              Version Timeline
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
                Snapshots are preserved every time changes are saved. Restore any past version at any time.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-3">
            {versions.map((ver) => {
              const isCurrent = ver.id === template.currentVersionId
              return (
                <div
                  key={ver.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    isCurrent
                      ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        Version {ver.version}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                          Active Version
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ver.changeSummary || 'Saved update'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ver.createdAt).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>{ver.fieldsSchema.length} fields</span>
                      <span>•</span>
                      <span>{ver.cardLayout?.widgets?.length || 0} card widgets</span>
                    </div>
                  </div>

                  {!isCurrent && onRollback && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (confirm(`Restore Version ${ver.version}?`)) {
                          await onRollback(ver.id)
                          onBack()
                        }
                      }}
                      className="h-8 text-xs cursor-pointer border-border hover:bg-muted"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      <span>Restore</span>
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Field Conflict Resolution Dialog (Non-Destructive Protection) */}
      {conflictData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Field Data Detected
                </h3>
                <p className="text-xs text-muted-foreground">
                  The removed field contains values in existing recipes.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
              <span className="text-xs font-semibold text-foreground block">
                Affected Fields &amp; Recipes:
              </span>
              {conflictData.inUseFields?.map((af) => (
                <div key={af.fieldId} className="text-xs text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground">
                    {af.name} (<code className="text-[11px] font-mono">{af.fieldId}</code>) — used in {af.usedByCount} recipe{af.usedByCount > 1 ? 's' : ''}
                  </div>
                  {af.recipeTitles && af.recipeTitles.length > 0 && (
                    <p className="text-[11px] text-muted-foreground italic">
                      Used in: {af.recipeTitles.slice(0, 3).join(', ')}
                      {af.recipeTitles.length > 3 ? ` and ${af.recipeTitles.length - 3} more` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Safe Archive (Recommended) */}
              <button
                type="button"
                onClick={() => handleSaveAttempt({ archiveRemovedFields: true })}
                className="w-full text-left p-3.5 rounded-2xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Archive className="h-4 w-4" />
                    Archive Field (Recommended)
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    No Data Loss
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Preserves existing recipe values in the database while hiding the field from new recipes.
                </p>
              </button>

              {/* Option 2: Fork as New Template */}
              {template && onDuplicate && (
                <button
                  type="button"
                  onClick={async () => {
                    const cloned = await onDuplicate(template.id)
                    setConflictData(null)
                    alert(`Created new template copy "${cloned.name}". Existing recipes remain on the original template.`)
                    onBack()
                  }}
                  className="w-full text-left p-3.5 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer space-y-1"
                >
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <GitBranch className="h-4 w-4 text-blue-400" />
                    Create Copy as New Template
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Leaves all existing recipes untouched on this template, and creates a separate template without this field.
                  </p>
                </button>
              )}

              {/* Option 3: Purge Field and Data */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to permanently delete this field and its data?')) {
                    handleSaveAttempt({ confirmPurgeRemovedFields: true })
                  }
                }}
                className="w-full text-left p-3 rounded-2xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer space-y-0.5"
              >
                <span className="text-xs font-bold text-destructive flex items-center gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Field and Data
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Permanently removes this field and its saved data from existing recipes.
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConflictData(null)}
                className="text-xs cursor-pointer text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
