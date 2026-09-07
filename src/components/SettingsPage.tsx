import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MandatoryFieldsConfig, MetadataConfig, TagCategory } from '@/shared/types'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Edit2,
  Layers,
  Plus,
  Sliders,
  Tags,
  Trash2,
} from 'lucide-react'

interface SettingsPageProps {
  metadataConfig: MetadataConfig | null
  categories: TagCategory[]
  onSaveConfig: (config: MetadataConfig) => Promise<void>
  onRefreshCategories: () => Promise<void>
}

interface DeleteConflictData {
  categoryId: string
  tag: string
  usageCount: number
  recipes: { id: number; title: string }[]
  availableTags: string[]
}

export function SettingsPage({
  metadataConfig,
  categories,
  onSaveConfig,
  onRefreshCategories,
}: SettingsPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<'metadata' | 'tags'>('metadata')

  // Metadata Rules state
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
  const [savingRules, setSavingRules] = useState(false)
  const [rulesSuccess, setRulesSuccess] = useState(false)

  // Taxonomy state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || 'season'
  )
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryExclusive, setNewCategoryExclusive] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [editingTag, setEditingTag] = useState<{ categoryId: string; oldName: string } | null>(
    null
  )
  const [renamedTagText, setRenamedTagText] = useState('')
  const [conflictData, setConflictData] = useState<DeleteConflictData | null>(null)
  const [reassignTarget, setReassignTarget] = useState<string>('')
  const [tagLoading, setTagLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0]

  // Metadata Save
  const handleSaveMetadata = async () => {
    try {
      setSavingRules(true)
      await onSaveConfig({
        mandatoryFields: {
          ...fields,
          title: true,
        },
        mandatoryCategories,
      })
      setRulesSuccess(true)
      setTimeout(() => setRulesSuccess(false), 2000)
    } finally {
      setSavingRules(false)
    }
  }

  const toggleField = (key: keyof MandatoryFieldsConfig) => {
    if (key === 'title') return
    setFields((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleCategoryMandate = (catId: string) => {
    setMandatoryCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    )
  }

  const handleToggleExclusive = async (categoryId: string, exclusive: boolean) => {
    try {
      setTagLoading(true)
      const res = await fetch(`/api/tags/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exclusive }),
      })
      if (res.ok) {
        await onRefreshCategories()
        setFeedback(
          `Set "${activeCategory?.name}" to ${exclusive ? 'Single / Exclusive' : 'Multi-Select'} mode.`
        )
        setTimeout(() => setFeedback(null), 3000)
      }
    } catch (err) {
      console.error('Failed to toggle exclusive mode:', err)
    } finally {
      setTagLoading(false)
    }
  }

  // Taxonomy Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      setTagLoading(true)
      const res = await fetch('/api/tags/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          exclusive: newCategoryExclusive,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setNewCategoryName('')
        setNewCategoryExclusive(false)
        setIsAddingCategory(false)
        await onRefreshCategories()
        setSelectedCategoryId(created.id)
        setFeedback(`Created category "${created.name}"`)
        setTimeout(() => setFeedback(null), 3000)
      }
    } finally {
      setTagLoading(false)
    }
  }

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim() || !activeCategory) return

    try {
      setTagLoading(true)
      const res = await fetch(`/api/tags/${activeCategory.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: newTagName.trim() }),
      })
      if (res.ok) {
        setNewTagName('')
        await onRefreshCategories()
        setFeedback(`Added tag "${newTagName.trim()}" to ${activeCategory.name}`)
      } else {
        const err = await res.json()
        setFeedback(err.error || 'Failed to add tag')
      }
    } finally {
      setTagLoading(false)
    }
  }

  const handleRenameTag = async () => {
    if (!editingTag || !renamedTagText.trim()) return

    try {
      setTagLoading(true)
      const res = await fetch(`/api/tags/${editingTag.categoryId}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName: editingTag.oldName,
          newName: renamedTagText.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setEditingTag(null)
        setRenamedTagText('')
        await onRefreshCategories()
        setFeedback(
          `Renamed "${data.oldName}" to "${data.newName}". Updated ${data.affectedRecipesCount} recipe(s) with zero conflicts!`
        )
      }
    } finally {
      setTagLoading(false)
    }
  }

  const initiateDeleteTag = async (categoryId: string, tag: string) => {
    try {
      setTagLoading(true)
      const usageRes = await fetch(`/api/tags/${categoryId}/${encodeURIComponent(tag)}/usage`)
      const usageData = await usageRes.json()

      if (usageData.count > 0) {
        const cat = categories.find((c) => c.id === categoryId)
        const others = (cat?.tags || []).filter((t) => t !== tag)
        setConflictData({
          categoryId,
          tag,
          usageCount: usageData.count,
          recipes: usageData.recipes,
          availableTags: others,
        })
        setReassignTarget(others[0] || '')
      } else {
        await executeDeleteTag(categoryId, tag, 'strip')
      }
    } finally {
      setTagLoading(false)
    }
  }

  const executeDeleteTag = async (
    categoryId: string,
    tag: string,
    resolution: 'strip' | 'reassign',
    reassignTo?: string
  ) => {
    try {
      setTagLoading(true)
      const res = await fetch(`/api/tags/${categoryId}/${encodeURIComponent(tag)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, reassignTo }),
      })

      if (res.ok) {
        const data = await res.json()
        setConflictData(null)
        await onRefreshCategories()
        setFeedback(
          resolution === 'reassign'
            ? `Reassigned ${data.affectedRecipesCount} recipe(s) to "${reassignTo}" and deleted tag.`
            : `Removed tag "${tag}" from ${data.affectedRecipesCount} recipe(s).`
        )
      }
    } finally {
      setTagLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings & Configuration
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure global metadata constraints and maintain recipe tag taxonomies.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveSubTab('metadata')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'metadata'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Metadata Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tags')}
          className={`flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'tags'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tags className="h-3.5 w-3.5" />
          <span>Tags & Taxonomy</span>
        </button>
      </div>

      {/* Tab 1: Metadata Rules */}
      {activeSubTab === 'metadata' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Mandatory Field Requirements
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toggle attributes that must be present in every recipe. Non-compliant recipes will be flagged on the Conflicts page.
              </p>
            </div>

            <div className="space-y-2 divide-y divide-border rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between pt-2 first:pt-0">
                <div>
                  <span className="text-sm font-semibold text-foreground">Recipe Title</span>
                  <p className="text-xs text-muted-foreground">Primary identifier</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Always Mandatory
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">Recipe Image</span>
                  <p className="text-xs text-muted-foreground">Require photo URL on all recipes</p>
                </div>
                <Switch checked={fields.image_url} onCheckedChange={() => toggleField('image_url')} />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">Ingredients List</span>
                  <p className="text-xs text-muted-foreground">Require at least one ingredient</p>
                </div>
                <Switch checked={fields.ingredients} onCheckedChange={() => toggleField('ingredients')} />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">Instructions / Method</span>
                  <p className="text-xs text-muted-foreground">Require preparation steps</p>
                </div>
                <Switch checked={fields.instructions} onCheckedChange={() => toggleField('instructions')} />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">Description</span>
                  <p className="text-xs text-muted-foreground">Require recipe summary</p>
                </div>
                <Switch checked={fields.description} onCheckedChange={() => toggleField('description')} />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">Yield / Servings</span>
                  <p className="text-xs text-muted-foreground">Require portion count</p>
                </div>
                <Switch checked={fields.yield_amount} onCheckedChange={() => toggleField('yield_amount')} />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">Prep & Cook Times</span>
                  <p className="text-xs text-muted-foreground">Require minutes for preparation and cooking</p>
                </div>
                <Switch
                  checked={fields.prep_time_minutes && fields.cook_time_minutes}
                  onCheckedChange={(checked) =>
                    setFields((prev) => ({
                      ...prev,
                      prep_time_minutes: checked,
                      cook_time_minutes: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Mandatory Tag Categories */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Mandatory Tag Categories
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Require that all recipes assign at least one tag from each selected category.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const isChecked = mandatoryCategories.includes(cat.id)
                return (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 cursor-pointer text-xs select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCategoryMandate(cat.id)}
                      className="rounded border-border text-foreground focus:ring-ring"
                    />
                    <span className="font-semibold text-foreground">{cat.name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>Changes take effect immediately and run compliance scans.</span>
            </div>

            <Button onClick={handleSaveMetadata} disabled={savingRules} className="cursor-pointer">
              {savingRules ? (
                'Saving...'
              ) : rulesSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" /> Rules Saved
                </>
              ) : (
                'Save Metadata Rules'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Tags & Taxonomy */}
      {activeSubTab === 'tags' && (
        <div className="space-y-4">
          {feedback && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl">
              {feedback}
            </div>
          )}

          {/* Category Selector Bar */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Category:
                </span>
                <Select
                  value={activeCategory?.id || ''}
                  onValueChange={(id) => {
                    if (id) setSelectedCategoryId(id)
                  }}
                >
                  <SelectTrigger className="w-56 text-xs h-8.5 bg-card">
                    <SelectValue placeholder="Choose a category..." />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({cat.tags?.length || 0} {cat.tags?.length === 1 ? 'tag' : 'tags'}
                            {cat.exclusive ? ' • Single' : ''})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant={isAddingCategory ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setIsAddingCategory((v) => !v)}
                className="text-xs h-8.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {isAddingCategory ? 'Close' : 'New Category'}
              </Button>
            </div>

            {/* Inline New Category Creation */}
            {isAddingCategory && (
              <form
                onSubmit={handleAddCategory}
                className="mt-4 pt-4 border-t border-border space-y-3 animate-in fade-in"
              >
                <span className="text-xs font-bold text-foreground block">
                  Create New Tag Category
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Input
                    placeholder="Category Name (e.g. Occasion, Dietary, Technique)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="text-xs h-8.5 max-w-sm"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 px-1">
                    <Switch
                      checked={newCategoryExclusive}
                      onCheckedChange={setNewCategoryExclusive}
                      id="new-cat-exclusive"
                    />
                    <label
                      htmlFor="new-cat-exclusive"
                      className="text-xs text-muted-foreground whitespace-nowrap cursor-pointer select-none"
                    >
                      Single tag only (Exclusive)
                    </label>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={tagLoading || !newCategoryName.trim()}
                    className="h-8.5 text-xs shrink-0 cursor-pointer"
                  >
                    Save Category
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Active Category Details & Tag Management */}
          {activeCategory && (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-xs">
              {/* Category Header & Single/Exclusive Switch */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-amber-500" />
                    <h3 className="text-base font-bold text-foreground">
                      {activeCategory.name}
                    </h3>
                    <Badge
                      variant={activeCategory.exclusive ? 'default' : 'secondary'}
                      className="text-[10px] font-normal"
                    >
                      {activeCategory.exclusive ? 'Single Select (Exclusive)' : 'Multi Select'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeCategory.tags?.length || 0} tag(s) configured in this classification.
                  </p>
                </div>

                {/* Exclusive Switch Control */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3.5 py-2">
                  <div className="text-right sm:text-left">
                    <span className="text-xs font-semibold text-foreground block">
                      Single Choice (Exclusive)
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      {activeCategory.exclusive
                        ? 'Recipes pick only 1 tag'
                        : 'Recipes can pick multiple tags'}
                    </span>
                  </div>
                  <Switch
                    checked={Boolean(activeCategory.exclusive)}
                    onCheckedChange={(checked) =>
                      handleToggleExclusive(activeCategory.id, checked)
                    }
                    disabled={tagLoading}
                  />
                </div>
              </div>

              {/* Inline Tag Rename Area (No modal) */}
              {editingTag && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Rename Tag &ldquo;{editingTag.oldName}&rdquo;
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Cascades automatically to all recipes
                    </span>
                  </div>
                  <div className="flex gap-2 max-w-md">
                    <Input
                      value={renamedTagText}
                      onChange={(e) => setRenamedTagText(e.target.value)}
                      className="h-8 text-xs bg-card"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleRenameTag}
                      disabled={tagLoading || !renamedTagText.trim()}
                      className="h-8 text-xs shrink-0 cursor-pointer"
                    >
                      Rename & Cascade
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTag(null)}
                      className="h-8 text-xs shrink-0 cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Inline Conflict Resolution on Tag Delete (No modal) */}
              {conflictData && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-destructive font-bold text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Tag &ldquo;{conflictData.tag}&rdquo; is assigned to {conflictData.usageCount}{' '}
                      recipe(s):
                    </span>
                  </div>

                  <div className="rounded-lg border border-border bg-card/70 p-2 text-xs text-muted-foreground max-h-20 overflow-y-auto">
                    {conflictData.recipes.map((r) => r.title).join(', ')}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {conflictData.availableTags.length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          value={reassignTarget}
                          onChange={(e) => setReassignTarget(e.target.value)}
                          className="h-7.5 text-xs rounded-lg border border-border bg-card px-2 text-foreground"
                        >
                          {conflictData.availableTags.map((t) => (
                            <option key={t} value={t}>
                              Reassign to: {t}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="xs"
                          onClick={() =>
                            executeDeleteTag(
                              conflictData.categoryId,
                              conflictData.tag,
                              'reassign',
                              reassignTarget
                            )
                          }
                          disabled={tagLoading || !reassignTarget}
                          className="h-7.5 text-xs cursor-pointer"
                        >
                          Reassign & Delete
                        </Button>
                      </div>
                    )}

                    <Button
                      variant="destructive"
                      size="xs"
                      onClick={() =>
                        executeDeleteTag(conflictData.categoryId, conflictData.tag, 'strip')
                      }
                      disabled={tagLoading}
                      className="h-7.5 text-xs cursor-pointer"
                    >
                      Strip from recipes & Delete
                    </Button>

                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setConflictData(null)}
                      className="h-7.5 text-xs cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Tag Badges List */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Tags in &ldquo;{activeCategory.name}&rdquo;
                </span>

                <div className="flex flex-wrap gap-2">
                  {(activeCategory.tags || []).map((tag) => (
                    <div
                      key={tag}
                      className="group flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs transition-colors hover:bg-muted/70 hover:border-border/90"
                    >
                      <span className="font-medium text-foreground">{tag}</span>
                      <div className="flex items-center gap-1 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTag({ categoryId: activeCategory.id, oldName: tag })
                            setRenamedTagText(tag)
                          }}
                          title="Rename tag"
                          className="hover:text-foreground cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => initiateDeleteTag(activeCategory.id, tag)}
                          title="Delete tag"
                          className="hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!activeCategory.tags || activeCategory.tags.length === 0) && (
                    <p className="text-xs text-muted-foreground italic py-1">
                      No tags defined in this category yet. Add your first tag below.
                    </p>
                  )}
                </div>
              </div>

              {/* Add Tag Row */}
              <form onSubmit={handleAddTag} className="pt-4 border-t border-border space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Add New Tag
                </label>
                <div className="flex gap-2 max-w-md">
                  <Input
                    placeholder={`e.g. ${activeCategory.name === 'Season' ? 'Monsoon' : 'Gluten-Free'}`}
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="text-xs h-8.5"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={tagLoading || !newTagName.trim()}
                    className="h-8.5 text-xs shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Tag
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
