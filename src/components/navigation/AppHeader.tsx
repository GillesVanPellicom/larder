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
import { Menu, Settings } from 'lucide-react'
import { cn } from 'cn'

import { Badge } from '@/components/ui/badge'

export interface AppHeaderProps {
  currentView: PageView
  onNavigate: (view: PageView, recipe?: Recipe | null) => void
  onOpenSettings: (tab?: 'rules' | 'appearance' | 'integrations') => void
  shoppingListCount?: number
  isDatabaseConnected?: boolean
  className?: string
}

export function AppHeader({
  currentView,
  onNavigate,
  onOpenSettings,
  shoppingListCount,
  isDatabaseConnected = true,
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

  const isRecipesActive =
    currentView === 'recipes' || currentView === 'recipe-view' || currentView === 'recipe-form'
  const isShoppingListActive = currentView === 'shopping-list'
  const isIngredientsActive = currentView === 'ingredients'
  const isSettingsActive = currentView === 'settings'

  return (
    <>
      <header
        className={cn(
          'sticky top-3 sm:top-4 z-40 mb-6 transition-all duration-300 w-full max-w-full mx-0',
          'xl:w-[calc(100%+max(0px,(100vw-80rem)/2))] xl:-ml-[calc(max(0px,(100vw-80rem)/4))] xl:-mr-[calc(max(0px,(100vw-80rem)/4))] xl:max-w-[calc(100vw-3rem)]',
          className
        )}
      >
        <div className="relative overflow-hidden flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-full border border-border bg-card/85 backdrop-blur-sm shadow-xl px-4 sm:px-6 h-16 sm:h-[4.75rem]">
          {/* Left Area: Desktop Tabs & Mobile Menu Button */}
          <div className="flex-1 flex items-center justify-start min-w-0">
            {/* Mobile Menu Button */}
            <div className={cn('flex lg:hidden', !isDatabaseConnected && 'invisible')}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileDrawerOpen(true)}
                className="rounded-full h-9 w-9 text-foreground hover:bg-muted/80 cursor-pointer shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Desktop Tabs */}
            <nav className={cn('hidden lg:flex items-center gap-1.5', !isDatabaseConnected && 'invisible')}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleNav('recipes', null)}
                className={cn(
                  'rounded-full text-xs font-light px-3.5 h-9 tracking-[0.16em] uppercase transition-colors cursor-pointer text-foreground',
                  isRecipesActive
                    ? 'bg-muted/90 shadow-2xs'
                    : 'hover:bg-muted/40'
                )}
              >
                RECIPES
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleNav('shopping-list', null)}
                className={cn(
                  'rounded-full text-xs font-light px-3.5 h-9 tracking-[0.16em] uppercase transition-colors cursor-pointer text-foreground whitespace-nowrap gap-1.5',
                  isShoppingListActive
                    ? 'bg-muted/90 shadow-2xs'
                    : 'hover:bg-muted/40'
                )}
              >
                <span>SHOPPING LIST</span>
                {shoppingListCount !== undefined && shoppingListCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 font-bold font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  >
                    {shoppingListCount}
                  </Badge>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleNav('ingredients', null)}
                className={cn(
                  'rounded-full text-xs font-light px-3.5 h-9 tracking-[0.16em] uppercase transition-colors cursor-pointer text-foreground',
                  isIngredientsActive
                    ? 'bg-muted/90 shadow-2xs'
                    : 'hover:bg-muted/40'
                )}
              >
                INGREDIENTS
              </Button>
            </nav>
          </div>

          {/* Center Area: Large Modern Light CAPS "LARDER" */}
          <div className="flex-initial flex items-center justify-center">
            <button
              type="button"
              onClick={() => handleNav('recipes', null)}
              className="font-extralight tracking-[0.24em] sm:tracking-[0.3em] text-xl sm:text-2xl lg:text-3xl uppercase text-foreground select-none hover:opacity-80 transition-opacity cursor-pointer text-center px-3 py-1"
            >
              LARDER
            </button>
          </div>

          {/* Right Area: Desktop Settings & Mobile Symmetry Spacer */}
          <div className="flex-1 flex items-center justify-end min-w-0">
            {/* Desktop Settings Button */}
            <div className="hidden lg:flex items-center">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSettings()}
                      className={cn(
                        'rounded-full h-10 w-10 sm:h-11 sm:w-11 cursor-pointer transition-colors shrink-0 text-foreground',
                        isSettingsActive
                          ? 'bg-muted/90 shadow-2xs'
                          : 'hover:bg-muted/40'
                      )}
                      aria-label="Settings"
                    >
                      <Settings className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                    </Button>
                  }
                />
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>
            </div>

            {/* Mobile Spacer to keep "LARDER" perfectly centered */}
            <div className="flex lg:hidden w-9 h-9 pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Left Drawer */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent
          side="left"
          className="p-6 flex flex-col justify-between"
        >
          <div className="space-y-6">
            <SheetHeader className="p-0 text-left border-b border-border/60 pb-4">
              <SheetTitle>
                LARDER
              </SheetTitle>
            </SheetHeader>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => handleNav('recipes', null)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-light tracking-[0.16em] uppercase transition-colors cursor-pointer text-left text-foreground',
                  isRecipesActive
                    ? 'bg-muted/90 shadow-2xs'
                    : 'hover:bg-muted/40'
                )}
              >
                RECIPES
              </button>

              <button
                type="button"
                onClick={() => handleNav('shopping-list', null)}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-light tracking-[0.16em] uppercase transition-colors cursor-pointer text-left text-foreground',
                  isShoppingListActive
                    ? 'bg-muted/90 shadow-2xs'
                    : 'hover:bg-muted/40'
                )}
              >
                <span>SHOPPING LIST</span>
                {shoppingListCount !== undefined && shoppingListCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-0.5 h-5 font-bold font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  >
                    {shoppingListCount}
                  </Badge>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNav('ingredients', null)}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-light tracking-[0.16em] uppercase transition-colors cursor-pointer text-left text-foreground',
                  isIngredientsActive
                    ? 'bg-muted/90 shadow-2xs'
                    : 'hover:bg-muted/40'
                )}
              >
                INGREDIENTS
              </button>

              <hr className="my-1 border-border/60" />

              <button
                type="button"
                onClick={() => handleSettings()}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-light tracking-[0.16em] uppercase transition-colors cursor-pointer text-left text-foreground',
                  isSettingsActive
                    ? 'bg-muted/90 shadow-2xs'
                    : 'hover:bg-muted/40'
                )}
              >
                <span>SETTINGS</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-border/60 text-[11px] text-muted-foreground text-center select-none font-medium">
            Larder Recipe Manager
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
