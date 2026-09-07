import { Button } from '@/components/ui/button'
import { usePwa } from '@/hooks/usePwa'
import { useTheme } from '@/hooks/useTheme'
import type { PageView } from '@/hooks/useNavigation'
import {
  AlertTriangle,
  BookOpen,
  Download,
  Moon,
  Plus,
  Settings,
  Sun,
} from 'lucide-react'

export interface HeaderProps {
  currentView: PageView
  recipesCount: number
  conflictsCount: number
  onNavTab: (view: PageView) => void
  onNewRecipe: () => void
}

export function Header({
  currentView,
  recipesCount,
  conflictsCount,
  onNavTab,
  onNewRecipe,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const { canInstall, triggerInstall } = usePwa()

  const isRecipesActive =
    currentView === 'recipes' ||
    currentView === 'recipe-view' ||
    currentView === 'recipe-form'

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-card/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-full">
        {/* Primary Navigation Tabs - Line overlaps bottom border */}
        <nav className="flex items-center gap-2 sm:gap-6 h-[calc(100%+1px)] -mb-px">
          <button
            type="button"
            onClick={() => onNavTab('recipes')}
            className={`group relative flex items-center gap-2 px-2 sm:px-3 h-full text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
              isRecipesActive
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Recipes</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-mono transition-colors ${
                isRecipesActive
                  ? 'bg-foreground/10 text-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {recipesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavTab('conflicts')}
            className={`group relative flex items-center gap-2 px-2 sm:px-3 h-full text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
              currentView === 'conflicts'
                ? 'border-destructive text-destructive'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 ${
                conflictsCount > 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}
            />
            <span>Conflicts</span>
            {conflictsCount > 0 && (
              <span className="rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-xs font-bold">
                {conflictsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavTab('settings')}
            className={`group relative flex items-center gap-2 px-2 sm:px-3 h-full text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
              currentView === 'settings' || currentView === 'template-editor'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* New Recipe Action */}
          <Button
            size="sm"
            onClick={onNewRecipe}
            className="h-9 px-3.5 text-sm font-medium cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            title="New Recipe (N or Cmd+N)"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>New Recipe</span>
          </Button>

          {/* Light / Dark Mode Toggle Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            className="h-9 w-9 cursor-pointer border-border hover:bg-muted text-foreground"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-amber-400" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-neutral-700" />
            )}
          </Button>

          {/* PWA Install Button if available */}
          {canInstall && (
            <Button
              variant="outline"
              size="icon"
              onClick={triggerInstall}
              title="Install Larder as an App"
              className="h-9 w-9 cursor-pointer border-amber-500 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
