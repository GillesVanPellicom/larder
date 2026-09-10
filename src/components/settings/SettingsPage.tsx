import { useEffect, useState } from 'react'
import { InfoTab } from './InfoTab'
import { CategoriesAndRulesTab } from './CategoriesAndRulesTab'
import { IntegrationsTab } from './IntegrationsTab'
import { IngredientsPage } from '@/components/ingredients/IngredientsPage'
import { StoresPage } from '@/components/stores/StoresPage'
import { useTheme } from '@/hooks/useTheme'
import type { MetadataConfig, SettingsTabId, TagCategory } from '@/shared/types'
import { ConfirmUnsavedDialog } from '@/components/ConfirmUnsavedDialog'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import {
  Carrot,
  Check,
  Info,
  Moon,
  Palette,
  Plug,
  SlidersHorizontal,
  Store,
  Sun,
} from 'lucide-react'

export interface SettingsPageProps {
  metadataConfig: MetadataConfig | null
  categories: TagCategory[]
  initialTab?: SettingsTabId
  activeTab?: SettingsTabId
  onTabChange?: (tab: SettingsTabId) => void
  onSaveConfig: (config: MetadataConfig) => Promise<void>
  onRefreshCategories: () => Promise<void>
}

export function SettingsPage({
  metadataConfig,
  categories,
  initialTab = 'info',
  activeTab,
  onTabChange,
  onSaveConfig,
  onRefreshCategories,
}: SettingsPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<SettingsTabId>(activeTab ?? initialTab)
  const [isRulesDirty, setIsRulesDirty] = useState(false)
  const [pendingTab, setPendingTab] = useState<SettingsTabId | null>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (activeTab && activeTab !== activeSubTab) {
      setActiveSubTab(activeTab)
    }
  }, [activeTab])

  const handleTabChange = (newTab: SettingsTabId) => {
    if (newTab === activeSubTab) return
    if (isRulesDirty) {
      setPendingTab(newTab)
    } else {
      setActiveSubTab(newTab)
      onTabChange?.(newTab)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-32 sm:pb-36 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-light tracking-wide text-foreground">
            Settings
          </h1>
          <InfoTooltip content="Configure app information, recipe rules, ingredients, appearance, and integrations." />
        </div>
      </div>

      {/* Primary Tabs */}
      <div className="flex items-center gap-2 sm:gap-6 border-b border-border overflow-x-auto overflow-y-hidden select-none">
        <button
          type="button"
          onClick={() => handleTabChange('info')}
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'info'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Info className="h-4 w-4" />
          <span>Info</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('rules')}
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'rules'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Recipe Rules</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('appearance')}
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'appearance'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>Appearance</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('ingredients')}
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'ingredients'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Carrot className="h-4 w-4" />
          <span>Ingredients</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('stores')}
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'stores'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Stores</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('integrations')}
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'integrations'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Plug className="h-4 w-4" />
          <span>Integrations</span>
        </button>
      </div>

      {/* Tab 1: App Info */}
      {activeSubTab === 'info' && (
        <InfoTab />
      )}

      {/* Tab 2: Categories & Rules Manager */}
      {activeSubTab === 'rules' && (
        <CategoriesAndRulesTab
          categories={categories}
          metadataConfig={metadataConfig}
          onRefreshCategories={onRefreshCategories}
          onSaveConfig={async (config) => {
            await onSaveConfig(config)
            setIsRulesDirty(false)
          }}
          onDirtyChange={setIsRulesDirty}
        />
      )}

      {/* Tab 3: Appearance & Theme */}
      {activeSubTab === 'appearance' && (
        <div className="space-y-6 w-full animate-in fade-in duration-150">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-xs">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Theme Preference
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Choose your preferred color theme for Larder.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Light Theme Card */}
              <div
                onClick={() => setTheme('light')}
                className={`relative flex flex-col gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  theme === 'light'
                    ? 'border-primary bg-primary/5 shadow-xs'
                    : 'border-border bg-muted/20 hover:border-border/80 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                      <Sun className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground block">
                        Light Mode
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Clean, bright look
                      </span>
                    </div>
                  </div>
                  {theme === 'light' && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>

              {/* Dark Theme Card */}
              <div
                onClick={() => setTheme('dark')}
                className={`relative flex flex-col gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'border-primary bg-primary/5 shadow-xs'
                    : 'border-border bg-muted/20 hover:border-border/80 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-zinc-800 text-zinc-100">
                      <Moon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground block">
                        Dark Mode
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Easy on the eyes
                      </span>
                    </div>
                  </div>
                  {theme === 'dark' && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Ingredients Manager */}
      {activeSubTab === 'ingredients' && (
        <IngredientsPage embedded />
      )}

      {/* Tab 5: Stores Manager */}
      {activeSubTab === 'stores' && (
        <StoresPage embedded />
      )}

      {/* Tab 6: Integrations */}
      {activeSubTab === 'integrations' && (
        <IntegrationsTab />
      )}

      {/* Confirmation Dialog for Tab Switching */}
      <ConfirmUnsavedDialog
        open={pendingTab !== null}
        onOpenChange={(open) => !open && setPendingTab(null)}
        onConfirmDiscard={() => {
          if (pendingTab) {
            setIsRulesDirty(false)
            setActiveSubTab(pendingTab)
            setPendingTab(null)
          }
        }}
        title="Discard unsaved settings?"
        description="You have unsaved changes to your rules and configuration that will be lost if you switch tabs."
      />
    </div>
  )
}
