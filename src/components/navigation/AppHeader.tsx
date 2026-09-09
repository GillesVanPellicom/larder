import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { PageView, Recipe } from '@/shared/types'
import { BookOpen, Menu, Plus, Settings } from 'lucide-react'
import { cn } from 'cn'

export interface AppHeaderProps {
  currentView: PageView
  onNavigate: (view: PageView, recipe?: Recipe | null) => void
  onOpenSettings: (tab?: 'rules' | 'appearance' | 'integrations') => void
  className?: string
}

export function AppHeader({
  currentView,
  onNavigate,
  onOpenSettings,
  className = '',
}: AppHeaderProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const handleNav = (view: PageView, recipe: Recipe | null = null) => {
    setMobileDrawerOpen(false)
    onNavigate(view, recipe)
  }

  const handleSettings = (tab?: 'rules' | 'appearance' | 'integrations') => {
    setMobileDrawerOpen(false)
    onOpenSettings(tab)
  }

  const isRecipesActive = currentView === 'recipes' || currentView === 'recipe-view'
  const isNewActive = currentView === 'recipe-form'
  const isSettingsActive = currentView === 'settings'

  return (
    <>
      <header
        className={cn(
          'sticky top-3 sm:top-4 z-40 w-full mb-6 transition-all duration-300',
          className
        )}
      >
        <div className="relative overflow-hidden flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-full border border-border bg-card/85 backdrop-blur-md shadow-xl px-3 sm:px-4 h-12 sm:h-14">
          {/* Left Area: Desktop Tabs & Mobile Menu Button */}
          <div className="flex-1 flex items-center justify-start min-w-0">
            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileDrawerOpen(true)}
                className="rounded-full h-8 w-8 text-foreground hover:bg-muted/80 cursor-pointer shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu className="h-4.5 w-4.5" />
              </Button>
            </div>

            {/* Desktop Tabs */}
            <nav className="hidden md:flex items-center gap-1.5">
              <Button
                type="button"
                variant={isRecipesActive ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleNav('recipes', null)}
                className={cn(
                  'rounded-full text-xs font-semibold px-3.5 h-8.5 transition-colors cursor-pointer',
                  isRecipesActive
                    ? 'bg-muted text-foreground font-bold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                <span>Recipes</span>
              </Button>

              <Button
                type="button"
                variant={isNewActive ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleNav('recipe-form', null)}
                className={cn(
                  'rounded-full text-xs font-semibold px-3.5 h-8.5 transition-colors cursor-pointer',
                  isNewActive
                    ? 'bg-muted text-foreground font-bold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Plus className="h-3.5 w-3.5 mr-1 shrink-0" />
                <span>New</span>
              </Button>
            </nav>
          </div>

          {/* Center Area: Large Modern Light CAPS "LARDER" */}
          <div className="flex-initial flex items-center justify-center">
            <button
              type="button"
              onClick={() => handleNav('recipes', null)}
              className="font-extralight tracking-[0.22em] sm:tracking-[0.28em] text-lg sm:text-xl md:text-2xl uppercase text-foreground select-none hover:opacity-80 transition-opacity cursor-pointer text-center px-2 py-0.5"
            >
              LARDER
            </button>
          </div>

          {/* Right Area: Desktop Settings & Mobile Symmetry Spacer */}
          <div className="flex-1 flex items-center justify-end min-w-0">
            {/* Desktop Settings Button */}
            <div className="hidden md:flex items-center">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant={isSettingsActive ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => handleSettings()}
                      className={cn(
                        'rounded-full h-8.5 w-8.5 cursor-pointer transition-colors shrink-0',
                        isSettingsActive
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                      aria-label="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  }
                />
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>
            </div>

            {/* Mobile Spacer to keep "LARDER" perfectly centered */}
            <div className="flex md:hidden w-8 h-8 pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Left Drawer */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent
          side="left"
          className="w-72 bg-card/95 backdrop-blur-md border-r border-border p-6 flex flex-col justify-between"
        >
          <div className="space-y-6">
            <SheetHeader className="p-0 text-left border-b border-border/60 pb-4">
              <SheetTitle className="font-extralight tracking-[0.25em] text-xl uppercase text-foreground">
                LARDER
              </SheetTitle>
            </SheetHeader>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleNav('recipes', null)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer text-left',
                  isRecipesActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>Recipes</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('recipe-form', null)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer text-left',
                  isNewActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>New</span>
              </button>

              <button
                type="button"
                onClick={() => handleSettings()}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer text-left',
                  isSettingsActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-border/40 text-[11px] text-muted-foreground text-center select-none font-medium">
            Larder Recipe Manager
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
