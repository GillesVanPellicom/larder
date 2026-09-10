import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Stepper } from '@/components/ui/stepper'
import { Switch } from '@/components/ui/switch'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { MandatoryFieldsConfig, MetadataConfig, TagCategory } from '@/shared/types'
import {
  Check,
  ChevronDown,
  Layers,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { tagsApi } from '@/services/api'
import { TagConflictDialog, type DeleteConflictData } from './TagConflictDialog'
import { SaveBar } from '@/components/ui/save-bar'
import { useIsMobile } from '@/hooks/useIsMobile'

export interface CategoriesAndRulesTabProps {
  categories: TagCategory[]
  metadataConfig: MetadataConfig | null
  onRefreshCategories: () => Promise<void>
  onSaveConfig: (config: MetadataConfig) => Promise<void>
  onDirtyChange?: (dirty: boolean) => void
}

export function CategoriesAndRulesTab({
  categories,
  metadataConfig,
  onRefreshCategories,
  onSaveConfig,
  onDirtyChange,
}: CategoriesAndRulesTabProps) {
  const isMobile = useIsMobile()
  // Category state (defaults to '' so user selects what to edit)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  // Working local copy of categories so all changes trigger SaveBar
  const [localCategories, setLocalCategories] = useState<TagCategory[]>(categories)

  // Sync localCategories when incoming categories change and not dirty
  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  // Combobox dropdown state
  const [isSectionPickerOpen, setIsSectionPickerOpen] = useState(false)
  const [sectionSearch, setSectionSearch] = useState('')
  const sectionPickerRef = useRef<HTMLDivElement>(null)

  // Close section picker on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sectionPickerRef.current && !sectionPickerRef.current.contains(e.target as Node)) {
        setIsSectionPickerOpen(false)
      }
    }
    if (isSectionPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSectionPickerOpen])

  // Tag Modal State (Edit Tag)
  const [tagModal, setTagModal] = useState<{
    categoryId: string
    tag: string
  } | null>(null)
  const [tagModalName, setTagModalName] = useState('')

  // Add Tag Modal State
  const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false)
  const [newTagNameInput, setNewTagNameInput] = useState('')

  // Create Category Modal State
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false)
  const [newCategoryModalName, setNewCategoryModalName] = useState('')

  const [conflictData, setConflictData] = useState<DeleteConflictData | null>(null)
  const [reassignTarget, setReassignTarget] = useState<string>('')
  const [tagLoading, setTagLoading] = useState(false)

  const initialFields = useMemo<MandatoryFieldsConfig>(
    () => ({
      title: true,
      ingredients: true,
      instructions: true,
      image_url: Boolean(metadataConfig?.mandatoryFields?.image_url),
      description: Boolean(metadataConfig?.mandatoryFields?.description),
      yield_amount: Boolean(metadataConfig?.mandatoryFields?.yield_amount),
      prep_time_minutes: Boolean(metadataConfig?.mandatoryFields?.prep_time_minutes),
      cook_time_minutes: Boolean(metadataConfig?.mandatoryFields?.cook_time_minutes),
      source_url: Boolean(metadataConfig?.mandatoryFields?.source_url),
    }),
    [metadataConfig]
  )

  // State
  const [fields, setFields] = useState<MandatoryFieldsConfig>(initialFields)
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    setFields(initialFields)
  }, [initialFields])

  const isDirty = useMemo(() => {
    const fieldsChanged = JSON.stringify(fields) !== JSON.stringify(initialFields)
    const categoriesChanged = JSON.stringify(localCategories) !== JSON.stringify(categories)
    return fieldsChanged || categoriesChanged
  }, [fields, initialFields, localCategories, categories])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const handleDiscard = () => {
    setFields(initialFields)
    setLocalCategories(categories)
  }

  const handleSave = async () => {
    try {
      setSavingConfig(true)
      const adjustedFields = {
        ...fields,
        title: true,
        ingredients: true,
        instructions: true,
        prep_time_minutes: Boolean(fields.prep_time_minutes),
        cook_time_minutes: Boolean(fields.cook_time_minutes),
      }
      await onSaveConfig({
        mandatoryFields: adjustedFields,
        mandatoryCategories: metadataConfig?.mandatoryCategories || [],
        timeTrackingMode: 'prep_and_cook',
      })

      // Persist local category updates to the server
      for (const localCat of localCategories) {
        const initialCat = categories.find((c) => c.id === localCat.id)
        if (!initialCat) {
          // New category created
          await tagsApi.createCategory({
            id: localCat.id,
            name: localCat.name,
            exclusive: localCat.exclusive,
            min_tags: localCat.min_tags,
            max_tags: localCat.max_tags,
            tags: localCat.tags,
          })
        } else {
          // Existing category: check if tags or range changed
          const tagsChanged = JSON.stringify(localCat.tags) !== JSON.stringify(initialCat.tags)
          const rangeChanged =
            localCat.min_tags !== initialCat.min_tags ||
            localCat.max_tags !== initialCat.max_tags ||
            localCat.name !== initialCat.name

          if (tagsChanged || rangeChanged) {
            // Strip any tags deleted from recipes
            const deletedTags = (initialCat.tags || []).filter(
              (t) => !(localCat.tags || []).includes(t)
            )
            for (const deletedTag of deletedTags) {
              await tagsApi.deleteTag(localCat.id, deletedTag, 'strip')
            }

            // Update category configuration
            await tagsApi.updateCategory(localCat.id, {
              name: localCat.name,
              min_tags: localCat.min_tags,
              max_tags: localCat.max_tags,
              exclusive: localCat.exclusive,
              tags: localCat.tags,
            })
          }
        }
      }

      await onRefreshCategories()
    } catch (err) {
      console.error('Failed to save rules and categories:', err)
      throw err
    } finally {
      setSavingConfig(false)
    }
  }

  const activeCategory =
    selectedCategoryId && selectedCategoryId !== 'basic_details'
      ? localCategories.find((c) => c.id === selectedCategoryId) || null
      : null

  // Local Range Change
  const handleLocalRangeChange = (categoryId: string, newMin: number, newMax: number) => {
    setLocalCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, min_tags: newMin, max_tags: newMax, exclusive: newMax === 1 }
          : c
      )
    )
  }

  // Create Category from search combobox
  const handleCreateCategory = (categoryName: string) => {
    const trimmed = categoryName.trim()
    if (!trimmed) return

    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `category-${Date.now()}`

    if (localCategories.some((c) => c.id === slug)) {
      setSelectedCategoryId(slug)
      setIsSectionPickerOpen(false)
      setSectionSearch('')
      return
    }

    const newCat: TagCategory = {
      id: slug,
      name: trimmed,
      color: 'neutral',
      min_tags: 0,
      max_tags: 0,
      exclusive: false,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setLocalCategories((prev) => [...prev, newCat])
    setSelectedCategoryId(slug)
    setIsSectionPickerOpen(false)
    setSectionSearch('')
  }

  // Delete category immediately on the server with alert confirmation
  const handleDeleteCategory = async (categoryId: string) => {
    const targetCat = localCategories.find((c) => c.id === categoryId)
    const name = targetCat?.name || 'this category'
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return

    try {
      setTagLoading(true)
      await tagsApi.deleteCategory(categoryId)
      await onRefreshCategories()
      setSelectedCategoryId('')
      setLocalCategories((prev) => prev.filter((c) => c.id !== categoryId))
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setTagLoading(false)
    }
  }

  // Local Add Tag
  const handleLocalAddTag = (categoryId: string, tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    setLocalCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c
        if ((c.tags || []).includes(trimmed)) return c
        return {
          ...c,
          tags: [...(c.tags || []), trimmed],
        }
      })
    )
  }

  // Local Rename Tag
  const handleLocalRenameTag = (categoryId: string, oldTag: string, newTag: string) => {
    const trimmed = newTag.trim()
    if (!trimmed || trimmed === oldTag) return
    setLocalCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c
        return {
          ...c,
          tags: (c.tags || []).map((t) => (t === oldTag ? trimmed : t)),
        }
      })
    )
  }

  // Local Delete Tag
  const handleLocalDeleteTag = (categoryId: string, tagToDelete: string) => {
    setLocalCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c
        const newTags = (c.tags || []).filter((t) => t !== tagToDelete)
        const currentMin = c.min_tags !== undefined ? c.min_tags : (c.exclusive ? 1 : 0)
        const currentMax = c.max_tags !== undefined ? c.max_tags : (c.exclusive ? 1 : (c.tags?.length || 0))
        const nextMax = Math.min(currentMax, newTags.length)
        const nextMin = Math.min(currentMin, nextMax)
        return {
          ...c,
          tags: newTags,
          min_tags: nextMin,
          max_tags: nextMax,
          exclusive: nextMax === 1,
        }
      })
    )
  }

  // Conflict Resolution: Strip and remove
  const handleResolveStrip = async () => {
    if (!conflictData) return
    try {
      setTagLoading(true)
      await tagsApi.deleteTag(conflictData.categoryId, conflictData.tag, 'strip')
      await onRefreshCategories()
      setConflictData(null)
    } catch (err: unknown) {
      console.error(err)
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
      setConflictData(null)
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setTagLoading(false)
    }
  }

  // Mandatory fields handlers
  const toggleField = (key: keyof MandatoryFieldsConfig) => {
    if (key === 'title' || key === 'ingredients' || key === 'instructions') return
    setFields((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const fieldList: { key: keyof MandatoryFieldsConfig; label: string; desc: string; locked?: boolean }[] = [
    { key: 'title', label: 'Recipe Title', desc: 'Primary identifier for any recipe', locked: true },
    { key: 'ingredients', label: 'Ingredients', desc: 'Required listing of ingredients and quantities', locked: true },
    { key: 'instructions', label: 'Instructions', desc: 'Directions or preparation steps', locked: true },
    { key: 'description', label: 'Description / Summary', desc: 'Short synopsis or backstory for the dish' },
    { key: 'yield_amount', label: 'Yield', desc: 'Portion or serving count' },
    { key: 'prep_time_minutes', label: 'Prep Time', desc: 'Minutes to prepare ingredients' },
    { key: 'cook_time_minutes', label: 'Cook Time', desc: 'Minutes to cook dish' },
    { key: 'source_url', label: 'Originally adapted from', desc: 'Attribution, source link, or reference' },
    { key: 'image_url', label: 'Cover Photo', desc: 'Disallow recipes without a hero photo' },
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

  const isDeleteCategoryDisabled = Boolean(activeCategory?.tags && activeCategory.tags.length > 0)

  const deleteCategoryButton = activeCategory ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isDeleteCategoryDisabled}
      onClick={() => handleDeleteCategory(activeCategory.id)}
      className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer disabled:pointer-events-none self-start sm:self-auto"
    >
      <Trash2 className="h-4 w-4 mr-1.5" /> Delete
    </Button>
  ) : null

  // Filtered categories for combobox
  const filteredCategories = useMemo(() => {
    const q = sectionSearch.toLowerCase().trim()
    if (!q) return localCategories
    return localCategories.filter((c) => c.name.toLowerCase().includes(q))
  }, [localCategories, sectionSearch])

  const basicDetailsMatch = useMemo(() => {
    const q = sectionSearch.toLowerCase().trim()
    if (!q) return true
    return 'basic recipe details'.includes(q)
  }, [sectionSearch])

  const exactCategoryMatch = useMemo(() => {
    const q = sectionSearch.toLowerCase().trim()
    if (!q) return true
    return localCategories.some((c) => c.name.toLowerCase() === q)
  }, [localCategories, sectionSearch])

  const selectedDisplayLabel = useMemo(() => {
    if (!selectedCategoryId) return 'Choose section to edit...'
    if (selectedCategoryId === 'basic_details') return 'Basic Recipe Details'
    const cat = localCategories.find((c) => c.id === selectedCategoryId)
    return cat ? cat.name : selectedCategoryId
  }, [selectedCategoryId, localCategories])

  const renderSectionPicker = () => (
    <div className="relative w-full" ref={sectionPickerRef}>
      <button
        type="button"
        onClick={() => setIsSectionPickerOpen((prev) => !prev)}
        className="flex h-12 sm:h-10 w-full items-center justify-between rounded-xl border border-input bg-card px-3.5 py-2 text-base sm:text-sm font-semibold text-foreground shadow-2xs hover:bg-accent/40 focus:outline-hidden focus:ring-2 focus:ring-ring/50 cursor-pointer transition-colors"
      >
        <span className={!selectedCategoryId ? 'text-muted-foreground font-normal' : ''}>
          {selectedDisplayLabel}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 opacity-60" />
      </button>

      {/* Combobox Dropdown */}
      {isSectionPickerOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-72 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 text-left">
          {/* Search Bar */}
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search or create..."
              value={sectionSearch}
              onChange={(e) => setSectionSearch(e.target.value)}
              autoFocus
              className="h-10 sm:h-8 pl-8 text-sm sm:text-xs bg-muted/40 border-border"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && sectionSearch.trim() && !exactCategoryMatch) {
                  e.preventDefault()
                  handleCreateCategory(sectionSearch)
                }
              }}
            />
          </div>

          <div className="max-h-60 overflow-y-auto py-1 space-y-2">
            {/* General Section */}
            {basicDetailsMatch && (
              <div>
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  General
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('basic_details')
                    setIsSectionPickerOpen(false)
                    setSectionSearch('')
                  }}
                  className={`flex w-full items-center justify-between rounded-lg cursor-pointer transition-colors ${
                    isMobile
                      ? 'min-h-11 px-3 py-2.5 text-base sm:text-sm font-semibold'
                      : 'min-h-8 px-2.5 py-1.5 text-xs font-semibold'
                  } ${
                    selectedCategoryId === 'basic_details'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                  }`}
                >
                  <span>Basic Recipe Details</span>
                  {selectedCategoryId === 'basic_details' && (
                    <Check className={isMobile ? "h-4 w-4" : "h-3.5 w-3.5"} />
                  )}
                </button>
              </div>
            )}

            {/* Categories Section */}
            <div>
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Tag Categories
              </span>

              {/* First option is always Create New Category */}
              <button
                type="button"
                onClick={() => {
                  if (sectionSearch.trim()) {
                    handleCreateCategory(sectionSearch)
                  } else {
                    setIsSectionPickerOpen(false)
                    setNewCategoryModalName('')
                    setIsCreateCategoryModalOpen(true)
                  }
                }}
                className={`flex w-full items-center gap-2 rounded-lg cursor-pointer transition-colors text-primary hover:bg-primary/10 ${
                  isMobile
                    ? 'min-h-11 px-3 py-2.5 text-sm font-semibold'
                    : 'min-h-8 px-2.5 py-1.5 text-xs font-semibold'
                }`}
              >
                <Plus className={isMobile ? "h-4 w-4" : "h-3.5 w-3.5"} />
                <span>
                  {sectionSearch.trim()
                    ? `Create category "${sectionSearch.trim()}"`
                    : 'Create new category'}
                </span>
              </button>

              {filteredCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(c.id)
                    setIsSectionPickerOpen(false)
                    setSectionSearch('')
                  }}
                  className={`flex w-full items-center justify-between rounded-lg cursor-pointer transition-colors ${
                    isMobile
                      ? 'min-h-11 px-3 py-2.5 text-base sm:text-sm font-medium'
                      : 'min-h-8 px-2.5 py-1.5 text-xs font-medium'
                  } ${
                    selectedCategoryId === c.id
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                  }`}
                >
                  <span>{c.name}</span>
                  {selectedCategoryId === c.id && <Check className={isMobile ? "h-4 w-4" : "h-3.5 w-3.5"} />}
                </button>
              ))}
            </div>

            {!basicDetailsMatch && filteredCategories.length === 0 && !sectionSearch.trim() && (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No categories found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* VIEW: Nothing Selected (Centered hero with combobox input directly underneath) */}
      {!selectedCategoryId ? (
        <div className="py-20 text-center flex flex-col items-center justify-center animate-in fade-in duration-150">
          <Layers className="h-10 w-10 text-muted-foreground/35 mb-3" />
          <h3 className="text-base font-semibold text-foreground">Choose section to edit</h3>
          <p className="text-sm text-muted-foreground mt-1.5 mb-5 max-w-sm text-center">
            Select an option below to manage its rules and settings.
          </p>
          <div className="w-full max-w-sm">
            {renderSectionPicker()}
          </div>
        </div>
      ) : (
        <>
          {/* Top Searchable Combobox Selector (Positioned at top left when a section is active) */}
          <div className="max-w-md">
            {renderSectionPicker()}
          </div>

          {/* VIEW A: Basic Recipe Details */}
          {selectedCategoryId === 'basic_details' && (
            <div className="space-y-6 animate-in fade-in duration-150">
          {/* Required Information List */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Required Information
              </h2>
              <InfoTooltip content="Fields enabled here will be enforced as required whenever recipes are created or updated." />
            </div>

            <div className="divide-y divide-border">
              {fieldList.map(({ key, label, desc, locked }) => (
                <div key={key} className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {locked && (
                      <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground select-none">
                        Always Required
                      </Badge>
                    )}
                    <Switch
                      checked={locked ? true : Boolean(fields[key])}
                      disabled={Boolean(locked)}
                      onCheckedChange={() => toggleField(key)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: Tag Category Taxonomy & Rules */}
      {selectedCategoryId !== 'basic_details' && activeCategory && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
          {/* Header with Title and Delete button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {activeCategory.name}
              </h3>
            </div>

            {isDeleteCategoryDisabled ? (
              <Tooltip>
                <TooltipTrigger render={<span className="inline-block">{deleteCategoryButton}</span>} />
                <TooltipContent>
                  Cannot delete category that contains tags. Delete all tags first.
                </TooltipContent>
              </Tooltip>
            ) : (
              deleteCategoryButton
            )}
          </div>

          {/* Selection Range Slider Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Allowed Tags per Recipe
                </span>
                <InfoTooltip content="Set the minimum and maximum number of tags that recipes can have in this category. Min 1 means required; Min 0 means optional." />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                From <span className="font-bold text-foreground">{currentMin}</span> to{' '}
                <span className="font-bold text-foreground">{currentMax}</span>
              </span>
            </div>

            {totalTags > 10 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                <div className="space-y-1.5 p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col items-center">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Minimum tags
                  </label>
                  <Stepper
                    value={currentMin}
                    min={0}
                    max={currentMax}
                    step={1}
                    variant="default"
                    onChange={(newMin) =>
                      handleLocalRangeChange(
                        activeCategory.id,
                        Math.min(Math.max(0, newMin), currentMax),
                        currentMax
                      )
                    }
                    disabled={tagLoading}
                  />
                </div>

                <div className="space-y-1.5 p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col items-center">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Maximum tags
                  </label>
                  <Stepper
                    value={currentMax}
                    min={currentMin}
                    max={totalTags}
                    step={1}
                    variant="default"
                    onChange={(newMax) =>
                      handleLocalRangeChange(
                        activeCategory.id,
                        currentMin,
                        Math.max(currentMin, Math.min(newMax, totalTags))
                      )
                    }
                    disabled={tagLoading}
                  />
                </div>
              </div>
            ) : totalTags > 0 ? (
              <div className="py-2">
                <Slider
                  min={0}
                  max={totalTags}
                  step={1}
                  ticks={totalTags + 1}
                  value={[currentMin, currentMax]}
                  onValueChange={(val) => {
                    const [minVal, maxVal] = Array.isArray(val) ? val : [val, val]
                    if (minVal !== undefined && maxVal !== undefined) {
                      handleLocalRangeChange(activeCategory.id, minVal, maxVal)
                    }
                  }}
                  disabled={tagLoading}
                  className="cursor-pointer"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-1">
                Add tags below to configure the selection range.
              </p>
            )}
          </div>

          {/* Tags Management Section */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tags in {activeCategory.name}
              </span>
            </div>

            {/* Tag Chips + Add Tag '+' button */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {activeCategory.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setTagModal({ categoryId: activeCategory.id, tag })
                    setTagModalName(tag)
                  }}
                  className="inline-flex items-center min-h-11 sm:min-h-0 px-3.5 py-2 rounded-xl text-base sm:text-sm font-medium bg-muted/40 hover:bg-muted/80 text-foreground border border-border/70 hover:border-border transition-colors cursor-pointer select-none"
                >
                  <span>{tag}</span>
                </button>
              ))}

              {/* '+' Button to open Add Tag Modal with primary styling */}
              <button
                type="button"
                onClick={() => {
                  setNewTagNameInput('')
                  setIsAddTagModalOpen(true)
                }}
                className="inline-flex items-center min-h-11 sm:min-h-0 gap-1.5 px-3.5 py-2 rounded-xl text-base sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors cursor-pointer select-none"
                title="Add new tag"
              >
                <Plus className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
                <span>Add tag</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )}

      {/* Add Tag Modal */}
      {isAddTagModalOpen && activeCategory && (
        <Dialog open={isAddTagModalOpen} onOpenChange={(open) => !open && setIsAddTagModalOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add a new tag to {activeCategory.name}.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!newTagNameInput.trim()) return
                handleLocalAddTag(activeCategory.id, newTagNameInput.trim())
                setNewTagNameInput('')
                setIsAddTagModalOpen(false)
              }}
              className="space-y-4 py-2"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tag Name</label>
                <Input
                  value={newTagNameInput}
                  onChange={(e) => setNewTagNameInput(e.target.value)}
                  placeholder="e.g. Vegetarian, Quick, Italian..."
                  autoFocus
                  className="text-sm"
                />
              </div>

              <DialogFooter className="flex-row justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setIsAddTagModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!newTagNameInput.trim()}
                >
                  Add
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Category Modal */}
      {isCreateCategoryModalOpen && (
        <Dialog open={isCreateCategoryModalOpen} onOpenChange={(open) => !open && setIsCreateCategoryModalOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add a new taxonomy category to organize your recipes.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!newCategoryModalName.trim()) return
                handleCreateCategory(newCategoryModalName.trim())
                setNewCategoryModalName('')
                setIsCreateCategoryModalOpen(false)
              }}
              className="space-y-4 py-2"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category Name</label>
                <Input
                  value={newCategoryModalName}
                  onChange={(e) => setNewCategoryModalName(e.target.value)}
                  placeholder="e.g. Cuisine, Season, Course, Dietary..."
                  autoFocus
                  className="text-sm"
                />
              </div>

              <DialogFooter className="flex-row justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setIsCreateCategoryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!newCategoryModalName.trim()}
                >
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Tag Edit & Delete Modal (No nested confirm dialog; SaveBar serves as confirmation) */}
      {tagModal && (
        <Dialog open={!!tagModal} onOpenChange={(open) => !open && setTagModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Tag</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update the tag name or remove it from {activeCategory?.name || 'this category'}.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!tagModal || !tagModalName.trim()) return
                handleLocalRenameTag(tagModal.categoryId, tagModal.tag, tagModalName.trim())
                setTagModal(null)
              }}
              className="space-y-4 py-2"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tag Name</label>
                <Input
                  value={tagModalName}
                  onChange={(e) => setTagModalName(e.target.value)}
                  placeholder="Tag name"
                  autoFocus
                  className="text-sm"
                />
              </div>

              <DialogFooter className="flex-row justify-between items-center gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    if (!tagModal) return
                    handleLocalDeleteTag(tagModal.categoryId, tagModal.tag)
                    setTagModal(null)
                  }}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setTagModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!tagModalName.trim() || tagModalName.trim() === tagModal.tag}
                  >
                    Save
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

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

      {/* Floating Sticky Save Bar */}
      <SaveBar
        isDirty={isDirty}
        submitting={savingConfig}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </div>
  )
}


