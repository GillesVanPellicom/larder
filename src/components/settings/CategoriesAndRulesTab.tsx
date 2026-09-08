import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
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
  Check,
  Edit2,
  Layers,
  Plus,
  Sliders,
  Trash2,
} from 'lucide-react'
import { tagsApi } from '@/services/api'
import { TagConflictDialog, type DeleteConflictData } from './TagConflictDialog'

export interface CategoriesAndRulesTabProps {
  categories: TagCategory[]
  metadataConfig: MetadataConfig | null
  onRefreshCategories: () => Promise<void>
  onSaveConfig: (config: MetadataConfig) => Promise<void>
}

export function CategoriesAndRulesTab({
  categories,
  metadataConfig,
  onRefreshCategories,
  onSaveConfig,
}: CategoriesAndRulesTabProps) {
  // Category state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || 'season'
  )
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [newTagName, setNewTagName] = useState('')
  const [editingTag, setEditingTag] = useState<{ categoryId: string; oldName: string } | null>(
    null
  )
  const [renamedTagText, setRenamedTagText] = useState('')

  const [conflictData, setConflictData] = useState<DeleteConflictData | null>(null)
  const [reassignTarget, setReassignTarget] = useState<string>('')
  const [tagLoading, setTagLoading] = useState(false)
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null)

  // Metadata mandatory fields state
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
  const [savingFields, setSavingFields] = useState(false)
  const [fieldSuccess, setFieldSuccess] = useState(false)

  const activeCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0]

  const showCategoryFeedback = (msg: string) => {
    setCategoryFeedback(msg)
    setTimeout(() => setCategoryFeedback(null), 3500)
  }

  // Update selection range for category
  const handleRangeChange = async (categoryId: string, newMin: number, newMax: number) => {
    try {
      setTagLoading(true)
      await tagsApi.updateCategory(categoryId, {
        min_tags: newMin,
        max_tags: newMax,
        exclusive: newMax === 1,
      })
      await onRefreshCategories()
      showCategoryFeedback(`Category "${activeCategory?.name || categoryId}" range set to [${newMin}, ${newMax}].`)
    } catch (err) {
      console.error(err)
      showCategoryFeedback(err instanceof Error ? err.message : 'Failed to update category range')
    } finally {
      setTagLoading(false)
    }
  }

  // Create new category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    const slug = newCategoryName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    try {
      setTagLoading(true)
      await tagsApi.createCategory({
        id: slug,
        name: newCategoryName.trim(),
        min_tags: 0,
        max_tags: 0,
        tags: [],
      })
      await onRefreshCategories()
      setSelectedCategoryId(slug)
      setNewCategoryName('')
      setIsAddingCategory(false)
      showCategoryFeedback(`Category "${newCategoryName.trim()}" created successfully!`)
    } catch (err: unknown) {
      showCategoryFeedback(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setTagLoading(false)
    }
  }

  // Delete category (only if empty)
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? It must be empty.')) return
    try {
      setTagLoading(true)
      await tagsApi.deleteCategory(categoryId)
      await onRefreshCategories()
      const remaining = categories.filter((c) => c.id !== categoryId)
      if (remaining.length > 0) {
        setSelectedCategoryId(remaining[0].id)
      }
      showCategoryFeedback('Category removed.')
    } catch (err: unknown) {
      showCategoryFeedback(err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setTagLoading(false)
    }
  }

  // Add tag to active category
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim() || !activeCategory) return

    try {
      setTagLoading(true)
      await tagsApi.addTag(activeCategory.id, newTagName.trim())
      await onRefreshCategories()
      setNewTagName('')
      showCategoryFeedback(`Added tag "${newTagName.trim()}".`)
    } catch (err: unknown) {
      showCategoryFeedback(err instanceof Error ? err.message : 'Failed to add tag')
    } finally {
      setTagLoading(false)
    }
  }

  // Rename tag
  const handleRenameTag = async () => {
    if (!editingTag || !renamedTagText.trim()) return
    try {
      setTagLoading(true)
      const res = await tagsApi.renameTag(
        editingTag.categoryId,
        editingTag.oldName,
        renamedTagText.trim()
      )
      await onRefreshCategories()
      showCategoryFeedback(
        `Renamed tag to "${renamedTagText.trim()}" (${res.affectedRecipesCount} recipes updated).`
      )
      setEditingTag(null)
      setRenamedTagText('')
    } catch (err: unknown) {
      showCategoryFeedback(err instanceof Error ? err.message : 'Failed to rename tag')
    } finally {
      setTagLoading(false)
    }
  }

  // Delete tag
  const handleDeleteTag = async (categoryId: string, tag: string) => {
    try {
      setTagLoading(true)
      const targetCat = categories.find((c) => c.id === categoryId) || activeCategory
      const oldTotal = targetCat?.tags?.length || 0
      const currentMin = targetCat?.min_tags !== undefined ? targetCat.min_tags : (targetCat?.exclusive ? 1 : 0)
      const currentMax = targetCat?.max_tags !== undefined ? targetCat.max_tags : (targetCat?.exclusive ? 1 : oldTotal)

      const res = await tagsApi.deleteTag(categoryId, tag)

      if ('usageCount' in res) {
        setConflictData({
          categoryId,
          tag,
          usageCount: res.usageCount,
          recipes: res.recipes,
          availableTags: res.availableTags,
        })
        setReassignTarget(res.availableTags[0] || '')
        return
      }

      // If a tag is removed and range was set at max (e.g. 9), decrement max (max--)
      if (currentMax >= oldTotal && oldTotal > 0) {
        const nextMax = Math.max(0, oldTotal - 1)
        const nextMin = Math.min(currentMin, nextMax)
        await tagsApi.updateCategory(categoryId, { min_tags: nextMin, max_tags: nextMax })
      }

      await onRefreshCategories()
      showCategoryFeedback(`Deleted tag "${tag}".`)
    } catch (err: unknown) {
      showCategoryFeedback(err instanceof Error ? err.message : 'Failed to delete tag')
    } finally {
      setTagLoading(false)
    }
  }

  // Conflict Resolution: Strip and remove
  const handleResolveStrip = async () => {
    if (!conflictData) return
    try {
      setTagLoading(true)
      const targetCat = categories.find((c) => c.id === conflictData.categoryId) || activeCategory
      const oldTotal = targetCat?.tags?.length || 0
      const currentMin = targetCat?.min_tags !== undefined ? targetCat.min_tags : (targetCat?.exclusive ? 1 : 0)
      const currentMax = targetCat?.max_tags !== undefined ? targetCat.max_tags : (targetCat?.exclusive ? 1 : oldTotal)

      await tagsApi.deleteTag(conflictData.categoryId, conflictData.tag, 'strip')

      // If a tag is removed and range was set at max (e.g. 9), decrement max (max--)
      if (currentMax >= oldTotal && oldTotal > 0) {
        const nextMax = Math.max(0, oldTotal - 1)
        const nextMin = Math.min(currentMin, nextMax)
        await tagsApi.updateCategory(conflictData.categoryId, { min_tags: nextMin, max_tags: nextMax })
      }

      await onRefreshCategories()
      showCategoryFeedback(`Tag removed and stripped from ${conflictData.usageCount} recipe(s).`)
      setConflictData(null)
    } catch (err: unknown) {
      showCategoryFeedback(err instanceof Error ? err.message : 'Failed to resolve conflict')
    } finally {
      setTagLoading(false)
    }
  }

  // Conflict Resolution: Reassign and remove
  const handleResolveReassign = async () => {
    if (!conflictData || !reassignTarget) return
    try {
      setTagLoading(true)
      await tagsApi.deleteTag(
        conflictData.categoryId,
        conflictData.tag,
        'reassign',
        reassignTarget
      )
      await onRefreshCategories()
      showCategoryFeedback(
        `Tag deleted and recipes reassigned to "${reassignTarget}".`
      )
      setConflictData(null)
    } catch (err: unknown) {
      showCategoryFeedback(err instanceof Error ? err.message : 'Failed to resolve conflict')
    } finally {
      setTagLoading(false)
    }
  }

  // Mandatory fields handlers
  const toggleField = (key: keyof MandatoryFieldsConfig) => {
    if (key === 'title' || key === 'ingredients' || key === 'instructions') return
    setFields((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSaveFields = async () => {
    try {
      setSavingFields(true)
      await onSaveConfig({
        mandatoryFields: {
          ...fields,
          title: true,
          ingredients: true,
          instructions: true,
        },
        mandatoryCategories: metadataConfig?.mandatoryCategories || [],
      })
      setFieldSuccess(true)
      setTimeout(() => setFieldSuccess(false), 2500)
    } finally {
      setSavingFields(false)
    }
  }

  const fieldList: { key: keyof MandatoryFieldsConfig; label: string; desc: string; locked?: boolean }[] = [
    { key: 'title', label: 'Recipe Title', desc: 'Primary identifier for any recipe', locked: true },
    { key: 'ingredients', label: 'Ingredients', desc: 'Required listing of ingredients', locked: true },
    { key: 'instructions', label: 'Instructions', desc: 'Directions or preparation steps', locked: true },
    { key: 'description', label: 'Description / Summary', desc: 'Short synopsis of dish' },
    { key: 'prep_time_minutes', label: 'Prep Time', desc: 'Minutes to prepare ingredients' },
    { key: 'cook_time_minutes', label: 'Cook Time', desc: 'Minutes to cook dish' },
    { key: 'total_time_minutes', label: 'Total Time', desc: 'Calculated overall duration requirement' },
    { key: 'yield_amount', label: 'Yield', desc: 'Portion or serving count' },
    { key: 'image_url', label: 'Cover Photo', desc: 'Disallow recipes without hero photos' },
  ]

  const totalTags = activeCategory?.tags?.length || 0
  const currentMin = activeCategory
    ? Math.min(
        Math.max(0, activeCategory.min_tags !== undefined ? activeCategory.min_tags : (activeCategory.exclusive ? 1 : 0)),
        totalTags
      )
    : 0
  const currentMax = activeCategory
    ? Math.min(
        Math.max(
          currentMin,
          activeCategory.max_tags !== undefined ? activeCategory.max_tags : (activeCategory.exclusive ? 1 : totalTags)
        ),
        totalTags
      )
    : 0

  return (
    <div className="space-y-8">
      {/* SECTION 1: Category & Tag Taxonomy */}
      <div className="space-y-6">
        {/* Category Feedback Banner */}
        {categoryFeedback && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-foreground animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-primary shrink-0" />
            <span>{categoryFeedback}</span>
          </div>
        )}

        {/* Category Selection Bar */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Category
              </label>
              <div className="flex items-center gap-2">
                <Select
                  value={activeCategory?.id || ''}
                  onValueChange={(val) => val && setSelectedCategoryId(val)}
                >
                  <SelectTrigger className="w-56 font-semibold">
                    <SelectValue placeholder="Choose Category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.exclusive && '(Exclusive)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingCategory((prev) => !prev)}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1" /> New Category
                </Button>
              </div>
            </div>

            {activeCategory && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={activeCategory.tags && activeCategory.tags.length > 0}
                  onClick={() => handleDeleteCategory(activeCategory.id)}
                  title={
                    activeCategory.tags && activeCategory.tags.length > 0
                      ? 'Cannot delete category that contains tags. Delete tags first.'
                      : 'Delete empty category'
                  }
                  className="text-xs text-destructive hover:bg-destructive/10 cursor-pointer disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Category
                </Button>
              </div>
            )}
          </div>

          {/* Add Category Form */}
          {isAddingCategory && (
            <form
              onSubmit={handleCreateCategory}
              className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 animate-in fade-in"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Create New Tag Category
              </span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Input
                  placeholder="e.g. Cuisine, Season, Dietary"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="max-w-xs text-sm"
                />

                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={tagLoading || !newCategoryName.trim()}>
                    Create
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingCategory(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Active Category Details & Tag List */}
        {activeCategory && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-amber-500" />
                <h3 className="text-base font-bold text-foreground">
                  {activeCategory.name}
                </h3>
                <Badge variant="secondary" className="text-xs font-normal">
                  {totalTags} {totalTags === 1 ? 'tag' : 'tags'}
                </Badge>
              </div>

              {/* Selection Range Slider - clean live display above, neutral indents below */}
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2.5 w-full sm:w-80">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-foreground">Selection Range</span>
                  <span className="text-muted-foreground">
                    From <span className="font-semibold text-foreground">{currentMin}</span> to{' '}
                    <span className="font-semibold text-foreground">{currentMax}</span>
                  </span>
                </div>

                {totalTags > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <Slider
                      min={0}
                      max={totalTags}
                      step={1}
                      value={[currentMin, currentMax]}
                      onValueChange={(val) => {
                        const [minVal, maxVal] = Array.isArray(val) ? val : [val, val]
                        if (minVal !== undefined && maxVal !== undefined) {
                          handleRangeChange(activeCategory.id, minVal, maxVal)
                        }
                      }}
                      disabled={tagLoading}
                      className="cursor-pointer py-1"
                    />
                    {/* Neutral indents and tick labels from 0 to N */}
                    <div className="flex justify-between items-center px-0.5 select-none pt-0.5">
                      {Array.from({ length: totalTags + 1 }, (_, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center cursor-pointer py-0.5 opacity-60 hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (i < currentMin) {
                              handleRangeChange(activeCategory.id, i, currentMax)
                            } else if (i > currentMax) {
                              handleRangeChange(activeCategory.id, currentMin, i)
                            }
                          }}
                          title={`Set bound to ${i}`}
                        >
                          <div className="w-0.5 h-1 rounded-full mb-1 bg-border" />
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {i}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Add tags to configure selection range.
                  </p>
                )}
              </div>
            </div>

            {/* Add Tag Form */}
            <form onSubmit={handleAddTag} className="flex gap-2 max-w-md">
              <Input
                placeholder={`Add tag to ${activeCategory.name}...`}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={tagLoading || !newTagName.trim()}
                className="cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Tag
              </Button>
            </form>

            {/* Tag Badges List */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Configured Tags ({totalTags})
              </span>

              {totalTags === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No tags added to this category yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeCategory.tags.map((tag) => {
                    const isEditing =
                      editingTag?.categoryId === activeCategory.id &&
                      editingTag?.oldName === tag

                    if (isEditing) {
                      return (
                        <div
                          key={tag}
                          className="flex items-center gap-1 rounded-lg border border-primary bg-card p-1 shadow-xs"
                        >
                          <Input
                            value={renamedTagText}
                            onChange={(e) => setRenamedTagText(e.target.value)}
                            className="h-7 w-32 text-xs"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameTag()
                              if (e.key === 'Escape') setEditingTag(null)
                            }}
                          />
                          <Button
                            type="button"
                            size="icon-sm"
                            onClick={handleRenameTag}
                            disabled={tagLoading || !renamedTagText.trim()}
                            className="h-7 w-7"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditingTag(null)}
                            className="h-7 w-7"
                          >
                            ✕
                          </Button>
                        </div>
                      )
                    }

                    return (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium group transition-all"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTag({ categoryId: activeCategory.id, oldName: tag })
                            setRenamedTagText(tag)
                          }}
                          className="opacity-40 group-hover:opacity-100 hover:text-foreground cursor-pointer transition-opacity"
                          title="Rename tag"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(activeCategory.id, tag)}
                          className="opacity-40 group-hover:opacity-100 hover:text-destructive cursor-pointer transition-opacity ml-0.5"
                          title="Delete tag"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Mandatory Recipe Fields */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-xs">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Mandatory Recipe Fields
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Configure which fields are required when adding or updating recipes.
          </p>
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

        {/* Save Field Rules Button */}
        <div className="flex items-center justify-between pt-2">
          {fieldSuccess ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <Check className="h-4 w-4" /> Recipe field rules saved successfully!
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Required fields will be enforced whenever recipes are saved.
            </span>
          )}

          <Button
            onClick={handleSaveFields}
            disabled={savingFields}
            className="min-w-32 cursor-pointer font-semibold"
          >
            {savingFields ? (
              'Saving...'
            ) : (
              <>
                <Sliders className="h-4 w-4 mr-1.5" /> Save Field Rules
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tag Conflict Dialog */}
      <TagConflictDialog
        conflictData={conflictData}
        reassignTarget={reassignTarget}
        loading={tagLoading}
        onReassignTargetChange={setReassignTarget}
        onClose={() => setConflictData(null)}
        onStripAndRemove={handleResolveStrip}
        onReassignAndRemove={handleResolveReassign}
      />
    </div>
  )
}
