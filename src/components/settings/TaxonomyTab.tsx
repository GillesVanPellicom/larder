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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { TagCategory } from '@/shared/types'
import {
  AlertCircle,
  Check,
  Edit2,
  Info,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react'
import { tagsApi } from '@/services/api'
import { TagConflictDialog, type DeleteConflictData } from './TagConflictDialog'

interface TaxonomyTabProps {
  categories: TagCategory[]
  onRefreshCategories: () => Promise<void>
}

export function TaxonomyTab({
  categories,
  onRefreshCategories,
}: TaxonomyTabProps) {
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

  const activeCategory =
    categories.find((c) => c.id === selectedCategoryId) || categories[0]

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 3500)
  }

  // Toggle exclusive property for category
  const handleToggleExclusive = async (categoryId: string, exclusive: boolean) => {
    try {
      setTagLoading(true)
      await tagsApi.updateCategory(categoryId, { exclusive })
      await onRefreshCategories()
      showFeedback(`Category "${activeCategory.name}" exclusive mode updated.`)
    } catch (err) {
      console.error(err)
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
        exclusive: newCategoryExclusive,
        tags: [],
      })
      await onRefreshCategories()
      setSelectedCategoryId(slug)
      setNewCategoryName('')
      setNewCategoryExclusive(false)
      setIsAddingCategory(false)
      showFeedback(`Category "${newCategoryName.trim()}" created successfully!`)
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to create category')
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
      showFeedback('Category removed.')
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to delete category')
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
      showFeedback(`Added tag "${newTagName.trim()}".`)
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to add tag')
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
      showFeedback(
        `Renamed tag to "${renamedTagText.trim()}" (${res.affectedRecipesCount} recipes updated).`
      )
      setEditingTag(null)
      setRenamedTagText('')
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to rename tag')
    } finally {
      setTagLoading(false)
    }
  }

  // Delete tag
  const handleDeleteTag = async (categoryId: string, tag: string) => {
    try {
      setTagLoading(true)
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

      await onRefreshCategories()
      showFeedback(`Deleted tag "${tag}".`)
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to delete tag')
    } finally {
      setTagLoading(false)
    }
  }

  // Conflict Resolution: Strip and remove
  const handleResolveStrip = async () => {
    if (!conflictData) return
    try {
      setTagLoading(true)
      await tagsApi.deleteTag(conflictData.categoryId, conflictData.tag, 'strip')
      await onRefreshCategories()
      showFeedback(`Tag removed and stripped from ${conflictData.usageCount} recipe(s).`)
      setConflictData(null)
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to resolve conflict')
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
      showFeedback(
        `Tag deleted and recipes reassigned to "${reassignTarget}".`
      )
      setConflictData(null)
    } catch (err: unknown) {
      showFeedback(err instanceof Error ? err.message : 'Failed to resolve conflict')
    } finally {
      setTagLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-foreground animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-primary shrink-0" />
          <span>{feedback}</span>
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

        {/* Add Category Collapsible Form */}
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

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Switch
                  checked={newCategoryExclusive}
                  onCheckedChange={setNewCategoryExclusive}
                />
                <span>Single Choice (Exclusive)</span>
              </label>

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
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button type="button" className="p-0.5 text-muted-foreground hover:text-foreground cursor-help">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    }
                  />
                  <TooltipContent className="max-w-xs">
                    {activeCategory.tags?.length || 0} tag(s) configured in this category.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Exclusive Switch Control */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3.5 py-2">
              <div className="text-right sm:text-left">
                <span className="text-xs font-semibold text-foreground block">
                  Single Choice (Exclusive)
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {activeCategory.exclusive
                    ? 'Only 1 tag allowed per recipe'
                    : 'Multiple tags allowed'}
                </span>
              </div>
              <Switch
                checked={activeCategory.exclusive}
                onCheckedChange={(checked) =>
                  handleToggleExclusive(activeCategory.id, checked)
                }
                disabled={tagLoading}
              />
            </div>
          </div>

          {/* Add Tag Form */}
          <form onSubmit={handleAddTag} className="flex gap-2 max-w-md">
            <Input
              placeholder={`Add tag to ${activeCategory.name}...`}
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="text-sm font-medium"
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

          {/* Tag Badges Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Active Tags ({activeCategory.tags?.length || 0})
            </span>

            {(!activeCategory.tags || activeCategory.tags.length === 0) && (
              <p className="text-xs text-muted-foreground italic py-3">
                No tags created in this category yet. Add one above.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {(activeCategory.tags || []).map((tag) => {
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
          </div>
        </div>
      )}

      {/* In-Use Tag Conflict Resolution Dialog */}
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
