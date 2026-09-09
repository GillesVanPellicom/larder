import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CategoriesAndRulesTab } from './CategoriesAndRulesTab'
import { IntegrationsTab } from './IntegrationsTab'
import { useTheme } from '@/hooks/useTheme'
import { usePwa } from '@/hooks/usePwa'
import type { MetadataConfig, TagCategory } from '@/shared/types'
import { ConfirmUnsavedDialog } from '@/components/ConfirmUnsavedDialog'
import {
  ArrowLeft,
  Check,
  Download,
  Moon,
  Palette,
  Plug,
  SlidersHorizontal,
  Sun,
} from 'lucide-react'

export interface SettingsPageProps {
  metadataConfig: MetadataConfig | null
  categories: TagCategory[]
  initialTab?: 'rules' | 'appearance' | 'integrations'
  onSaveConfig: (config: MetadataConfig) => Promise<void>
  onRefreshCategories: () => Promise<void>
  onBack?: () => void
}

export function SettingsPage({
  metadataConfig,
  categories,
  initialTab = 'rules',
  onSaveConfig,
  onRefreshCategories,
  onBack,
}: SettingsPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'appearance' | 'integrations'>(initialTab)
  const [isRulesDirty, setIsRulesDirty] = useState(false)
  const [showConfirmBack, setShowConfirmBack] = useState(false)
  const [pendingTab, setPendingTab] = useState<'rules' | 'appearance' | 'integrations' | null>(null)
  const { theme, setTheme } = useTheme()
  const { canInstall, isInstalled, triggerInstall } = usePwa()

  const handleBackClick = () => {
    if (isRulesDirty) {
      setShowConfirmBack(true)
    } else {
      onBack?.()
    }
  }

  const handleTabChange = (newTab: 'rules' | 'appearance' | 'integrations') => {
    if (newTab === activeSubTab) return
    if (isRulesDirty) {
      setPendingTab(newTab)
    } else {
      setActiveSubTab(newTab)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-32 sm:pb-36 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleBackClick}
              title="Back to Recipes"
              className="h-9 w-9 cursor-pointer border-border hover:bg-muted text-foreground shrink-0"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Settings
            </h1>
          </div>
        </div>
      </div>

      {/* Primary Tabs */}
      <div className="flex items-center gap-2 sm:gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => handleTabChange('rules')}
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
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
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
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
          onClick={() => handleTabChange('integrations')}
          className={`group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
            activeSubTab === 'integrations'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <Plug className="h-4 w-4" />
          <span>Integrations</span>
        </button>
      </div>

      {/* Tab 1: Categories & Rules Manager */}
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

      {/* Tab 2: Integrations */}
      {activeSubTab === 'integrations' && (
        <IntegrationsTab />
      )}

      {/* Tab 3: Appearance & Theme */}
      {activeSubTab === 'appearance' && (
        <div className="space-y-6 max-w-2xl animate-in fade-in duration-150">
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

          {/* Progressive Web App Install Option */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Desktop & Mobile App
                  </h2>
                  {isInstalled && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" /> Installed
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isInstalled
                    ? 'Larder is running as a standalone app on your device.'
                    : 'Download Larder as a standalone desktop or mobile application for instant launch.'}
                </p>
              </div>

              {!isInstalled && canInstall && (
                <Button
                  size="sm"
                  onClick={triggerInstall}
                  className="cursor-pointer gap-1.5 shrink-0"
                >
                  <Download className="h-4 w-4" />
                  <span>Install App</span>
                </Button>
              )}
            </div>

            {!isInstalled && !canInstall && (
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Installing on Desktop (Chrome, Edge, Brave)
                </p>
                <p>
                  Click the <strong>Install</strong> icon (⊕) in your browser's address bar, or click the browser menu (⋮) → <strong>Install Larder</strong> to add it to your desktop dock or taskbar.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Back Navigation */}
      <ConfirmUnsavedDialog
        open={showConfirmBack}
        onOpenChange={setShowConfirmBack}
        onConfirmDiscard={() => {
          setIsRulesDirty(false)
          onBack?.()
        }}
        title="Discard unsaved settings?"
        description="You have unsaved changes to your rules and configuration that will be lost."
      />

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
