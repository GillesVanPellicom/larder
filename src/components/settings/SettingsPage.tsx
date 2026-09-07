import type {
  MetadataConfig,
  RecipeTemplate,
  TagCategory,
} from '@/shared/types'
import { LayoutTemplate, Sliders, Tags } from 'lucide-react'
import { useState } from 'react'
import { MetadataRulesTab } from './MetadataRulesTab'
import { TaxonomyTab } from './TaxonomyTab'
import { TemplatesManager } from '@/components/templates/TemplatesManager'

export interface SettingsPageProps {
  metadataConfig: MetadataConfig | null
  categories: TagCategory[]
  onSaveConfig: (config: MetadataConfig) => Promise<void>
  onRefreshCategories: () => Promise<void>
  // Templates Management Props
  templates?: RecipeTemplate[]
  templatesLoading?: boolean
  onOpenTemplateEditor: (template: RecipeTemplate | null) => void
  onDuplicateTemplate?: (id: string) => Promise<RecipeTemplate>
  onDeleteTemplate?: (id: string) => Promise<void>
}

export function SettingsPage({
  metadataConfig,
  categories,
  onSaveConfig,
  onRefreshCategories,
  templates = [],
  templatesLoading = false,
  onOpenTemplateEditor,
  onDuplicateTemplate,
  onDeleteTemplate,
}: SettingsPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<'metadata' | 'tags' | 'templates'>('metadata')

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Settings &amp; Configuration
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure metadata validation, manage tags and taxonomies, and customize templates.
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 sm:gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveSubTab('metadata')}
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
            activeSubTab === 'metadata'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Metadata Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tags')}
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
            activeSubTab === 'tags'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Tags className="h-4 w-4" />
          <span>Tags &amp; Taxonomy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('templates')}
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
            activeSubTab === 'templates'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <LayoutTemplate className="h-4 w-4" />
          <span>Templates</span>
        </button>
      </div>

      {/* Tab 1: Metadata Validation Rules */}
      {activeSubTab === 'metadata' && (
        <MetadataRulesTab
          metadataConfig={metadataConfig}
          categories={categories}
          onSaveConfig={onSaveConfig}
        />
      )}

      {/* Tab 2: Tags & Taxonomy Manager */}
      {activeSubTab === 'tags' && (
        <TaxonomyTab
          categories={categories}
          onRefreshCategories={onRefreshCategories}
        />
      )}

      {/* Tab 3: Recipe Templates Manager */}
      {activeSubTab === 'templates' && (
        <TemplatesManager
          templates={templates}
          loading={templatesLoading}
          onOpenEditor={onOpenTemplateEditor}
          onDuplicateTemplate={
            onDuplicateTemplate ||
            (async () => {
              throw new Error('Duplicate not available')
            })
          }
          onDeleteTemplate={
            onDeleteTemplate ||
            (async () => {
              throw new Error('Delete not available')
            })
          }
        />
      )}
    </div>
  )
}
