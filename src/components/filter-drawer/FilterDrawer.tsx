import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type {
  FilterCriteria,
  FilterTemplate,
  MatchMode,
  TagCategory,
  TriStateFilter,
  UpdateFilterTemplateDTO,
} from '@/shared/types'
import {
  Bookmark,
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from 'cn'
import { DEFAULT_FILTER_CRITERIA, countActiveFilters } from '@/lib/recipeFilters'
import { useDeviceSettings } from '@/lib/deviceSettings'
import { FilterIngredientsSection } from './FilterIngredientsSection'
import { FilterTagsSection } from './FilterTagsSection'
import { FilterQuickOptionsSection } from './FilterQuickOptionsSection'
import { FilterTemplatesTab } from './FilterTemplatesTab'
import { SaveTemplateModal } from './SaveTemplateModal'

export interface FilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  criteria: FilterCriteria
  onChange: (criteria: FilterCriteria) => void
  categories: TagCategory[]
  allIngredients: string[]
  matchCount?: number
  totalCount?: number
  templates?: FilterTemplate[]
  onApplyTemplate?: (template: FilterTemplate) => void
  onCreateTemplate?: (name: string, criteria: FilterCriteria) => Promise<FilterTemplate>
  onUpdateTemplate?: (id: number, dto: UpdateFilterTemplateDTO) => Promise<FilterTemplate>
  onDeleteTemplate?: (id: number) => Promise<void>
  initialTab?: 'filters' | 'templates'
}

export function FilterDrawer({
  open,
  onOpenChange,
  criteria,
  onChange,
  categories,
  allIngredients,
  templates = [],
  onApplyTemplate,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  initialTab,
}: FilterDrawerProps) {
  const { settings, setSetting } = useDeviceSettings()
  const validInitialTab = initialTab === 'filters' || initialTab === 'templates' ? initialTab : undefined
  const savedTab =
    settings.filterDrawerTab === 'filters' || settings.filterDrawerTab === 'templates'
      ? settings.filterDrawerTab
      : 'filters'
  const [activeTab, setActiveTab] = useState<'filters' | 'templates'>(validInitialTab || savedTab)
  const [draftCriteria, setDraftCriteria] = useState<FilterCriteria>(criteria)
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [templateToRename, setTemplateToRename] = useState<FilterTemplate | null>(null)
  const prevOpenRef = useRef(false)

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setDraftCriteria(criteria)
      const tabToSet =
        (initialTab === 'filters' || initialTab === 'templates' ? initialTab : undefined) ||
        (settings.filterDrawerTab === 'filters' || settings.filterDrawerTab === 'templates'
          ? settings.filterDrawerTab
          : undefined) ||
        'filters'
      setActiveTab(tabToSet)
      // Auto-open collapsible if any of the additional filters are active
      if (
        (criteria.onlyConflicts && criteria.onlyConflicts !== 'any') ||
        (criteria.hasImage && criteria.hasImage !== 'any')
      ) {
        setMoreFiltersOpen(true)
      }
    }
    prevOpenRef.current = open
  }, [open, criteria, initialTab, settings.filterDrawerTab])

  const handleTabChange = (tab: 'filters' | 'templates') => {
    setActiveTab(tab)
    setSetting('filterDrawerTab', tab)
  }

  const activeFiltersCount = countActiveFilters(draftCriteria)
  const additionalFiltersActiveCount =
    (draftCriteria.onlyConflicts && draftCriteria.onlyConflicts !== 'any' ? 1 : 0) +
    (draftCriteria.hasImage && draftCriteria.hasImage !== 'any' ? 1 : 0)

  const handleApply = () => {
    onChange(draftCriteria)
    onOpenChange(false)
  }

  const handleClearSearch = () => {
    setDraftCriteria((prev) => ({ ...prev, searchQuery: '' }))
  }

  const handleResetAll = () => {
    setDraftCriteria(DEFAULT_FILTER_CRITERIA)
  }

  const handleSelectedIngredientsChange = (selected: string[]) => {
    setDraftCriteria((prev) => ({
      ...prev,
      selectedIngredients: selected,
    }))
  }

  const handleIngredientsMatchModeChange = (mode: MatchMode) => {
    setDraftCriteria((prev) => ({
      ...prev,
      matchModePerElement: {
        ...prev.matchModePerElement,
        ingredients: mode,
      },
    }))
  }

  const handleCategoryTagsChange = (categoryId: string, tags: string[]) => {
    setDraftCriteria((prev) => {
      const nextSelectedTags = { ...prev.selectedTags }
      if (tags.length > 0) {
        nextSelectedTags[categoryId] = tags
      } else {
        delete nextSelectedTags[categoryId]
      }
      return {
        ...prev,
        selectedTags: nextSelectedTags,
      }
    })
  }

  const handleCategoryMatchModeChange = (categoryId: string, mode: MatchMode) => {
    setDraftCriteria((prev) => ({
      ...prev,
      matchModePerElement: {
        ...prev.matchModePerElement,
        categoryTags: {
          ...prev.matchModePerElement.categoryTags,
          [categoryId]: mode,
        },
      },
    }))
  }

  const handleApplyTemplate = (template: FilterTemplate) => {
    setDraftCriteria(template.criteria)
    onChange(template.criteria)
    if (onApplyTemplate) {
      onApplyTemplate(template)
    }
    onOpenChange(false)
  }

  const handleOverwriteTemplate = async (template: FilterTemplate) => {
    if (onUpdateTemplate) {
      await onUpdateTemplate(template.id, { criteria: draftCriteria })
    }
  }

  const handleRenameTemplate = (template: FilterTemplate) => {
    setTemplateToRename(template)
    setSaveModalOpen(true)
  }

  const handleDeleteTemplate = async (template: FilterTemplate) => {
    if (onDeleteTemplate) {
      await onDeleteTemplate(template.id)
    }
  }

  const handleSaveModalSubmit = async (name: string) => {
    if (templateToRename) {
      if (onUpdateTemplate) {
        await onUpdateTemplate(templateToRename.id, { name })
      }
      setTemplateToRename(null)
    } else {
      if (onCreateTemplate) {
        await onCreateTemplate(name, draftCriteria)
      }
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="p-0 overflow-hidden"
        >
          {/* Drawer Header with Tabs */}
          <div className="shrink-0 border-b border-border/60 px-5 py-3.5 space-y-2.5">
            <SheetHeader className="p-0 border-b-0 text-left">
              <div className="flex items-center gap-2.5 h-7 pr-8">
                <SheetTitle>Filter Recipes</SheetTitle>
                {activeTab === 'filters' && activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetAll}
                    className="h-6 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2 rounded-md"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              <SheetDescription className="sr-only">
                Filter recipe catalog by tags, ingredients, time, search, and saved templates
              </SheetDescription>
            </SheetHeader>

            {/* Segmented Control Tabs */}
            <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border/50 text-sm font-medium h-11 sm:h-10">
              <button
                type="button"
                onClick={() => handleTabChange('filters')}
                className={cn(
                  'relative flex-1 h-full py-2 sm:py-1.5 px-3 rounded-lg flex items-center justify-center transition-all cursor-pointer select-none text-sm active:scale-[0.99]',
                  activeTab === 'filters'
                    ? 'bg-card text-foreground shadow-xs font-semibold border border-border/50'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                )}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 shrink-0" />
                  <span>Filters</span>
                </span>
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center font-bold pointer-events-none"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('templates')}
                className={cn(
                  'relative flex-1 h-full py-2 sm:py-1.5 px-3 rounded-lg flex items-center justify-center transition-all cursor-pointer select-none text-sm active:scale-[0.99]',
                  activeTab === 'templates'
                    ? 'bg-card text-foreground shadow-xs font-semibold border border-border/50'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                )}
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 shrink-0" />
                  <span>Templates</span>
                </span>
                {templates.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center font-bold pointer-events-none"
                  >
                    {templates.length}
                  </Badge>
                )}
              </button>
            </div>
          </div>

          {/* Scrollable Body: Filters or Templates */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'filters' ? (
              <div className="space-y-5">
                {/* Quick Search */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Text search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search recipes, instructions..."
                      value={draftCriteria.searchQuery}
                      onChange={(e) =>
                        setDraftCriteria((prev) => ({ ...prev, searchQuery: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleApply()
                        }
                      }}
                      className="pl-8 text-sm"
                    />
                    {draftCriteria.searchQuery && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Max Total Time Section */}
                <FilterQuickOptionsSection
                  maxTotalTime={draftCriteria.maxTotalTime}
                  onMaxTimeChange={(mins) =>
                    setDraftCriteria((prev) => ({ ...prev, maxTotalTime: mins }))
                  }
                />

                {/* Ingredients Filter Section */}
                <FilterIngredientsSection
                  allIngredients={allIngredients}
                  selectedIngredients={draftCriteria.selectedIngredients}
                  matchMode={draftCriteria.matchModePerElement.ingredients}
                  onSelectedIngredientsChange={handleSelectedIngredientsChange}
                  onMatchModeChange={handleIngredientsMatchModeChange}
                />

                {/* Tags Categories Section */}
                <FilterTagsSection
                  categories={categories}
                  selectedTags={draftCriteria.selectedTags}
                  matchModes={draftCriteria.matchModePerElement.categoryTags}
                  onCategoryTagsChange={handleCategoryTagsChange}
                  onCategoryMatchModeChange={handleCategoryMatchModeChange}
                />

                {/* Divider under last category tag */}
                <hr className="border-border" />

                {/* Collapsible Section for Additional Filters */}
                <Collapsible
                  open={moreFiltersOpen}
                  onOpenChange={setMoreFiltersOpen}
                  className="space-y-3"
                >
                  <CollapsibleTrigger className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group select-none">
                    <span className="flex items-center gap-2">
                      <span>Additional filters</span>
                      {additionalFiltersActiveCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-bold">
                          {additionalFiltersActiveCount}
                        </Badge>
                      )}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform duration-200',
                        moreFiltersOpen && 'rotate-180'
                      )}
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-4 pt-1">
                    {/* Data Rule Violations Tri-State Select */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-muted-foreground">
                        Has data rule violation(s)
                      </label>
                      <Select
                        value={
                          typeof draftCriteria.onlyConflicts === 'string'
                            ? draftCriteria.onlyConflicts
                            : draftCriteria.onlyConflicts
                            ? 'only'
                            : 'any'
                        }
                        onValueChange={(val) =>
                          setDraftCriteria((prev) => ({
                            ...prev,
                            onlyConflicts: (val as TriStateFilter) || 'any',
                          }))
                        }
                      >
                        <SelectTrigger className="w-full text-xs h-9 justify-between cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any" className="text-xs cursor-pointer">
                            Any
                          </SelectItem>
                          <SelectItem value="none" className="text-xs cursor-pointer">
                            None
                          </SelectItem>
                          <SelectItem value="only" className="text-xs cursor-pointer">
                            Only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Has Image Tri-State Select */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-muted-foreground">
                        Has image
                      </label>
                      <Select
                        value={
                          typeof draftCriteria.hasImage === 'string'
                            ? draftCriteria.hasImage
                            : draftCriteria.hasImage === true
                            ? 'only'
                            : draftCriteria.hasImage === false
                            ? 'none'
                            : 'any'
                        }
                        onValueChange={(val) =>
                          setDraftCriteria((prev) => ({
                            ...prev,
                            hasImage: (val as TriStateFilter) || 'any',
                          }))
                        }
                      >
                        <SelectTrigger className="w-full text-xs h-9 justify-between cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any" className="text-xs cursor-pointer">
                            Any
                          </SelectItem>
                          <SelectItem value="none" className="text-xs cursor-pointer">
                            None
                          </SelectItem>
                          <SelectItem value="only" className="text-xs cursor-pointer">
                            Only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              <FilterTemplatesTab
                templates={templates}
                currentCriteria={draftCriteria}
                onApplyTemplate={handleApplyTemplate}
                onOverwriteTemplate={handleOverwriteTemplate}
                onRenameTemplate={handleRenameTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                hasActiveFilters={activeFiltersCount > 0}
              />
            )}
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-border/60 p-4 bg-muted/20 flex items-center justify-between gap-2 shrink-0">
            {activeTab === 'filters' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTemplateToRename(null)
                    setSaveModalOpen(true)
                  }}
                  disabled={activeFiltersCount === 0}
                  className="cursor-pointer text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Save as template
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => onOpenChange(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleApply}
                    className="cursor-pointer"
                  >
                    Apply
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-end">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="cursor-pointer"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Save / Rename Template Dialog Modal */}
      <SaveTemplateModal
        open={saveModalOpen}
        onOpenChange={(isOpen) => {
          setSaveModalOpen(isOpen)
          if (!isOpen) setTemplateToRename(null)
        }}
        criteria={draftCriteria}
        existingTemplate={templateToRename}
        onSave={handleSaveModalSubmit}
      />
    </>
  )
}
