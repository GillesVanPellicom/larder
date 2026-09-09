import { InfoTooltip } from '@/components/ui/info-tooltip'
import { ShoppingBag } from 'lucide-react'

export function ShoppingListPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)] items-center justify-center text-center px-4 py-16">
      <div className="p-4 rounded-3xl bg-muted/50 border border-border/70 mb-5 shadow-xs">
        <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
      </div>
      <div className="flex items-center gap-2 justify-center">
        <h2 className="text-xl sm:text-2xl font-light tracking-wide text-foreground">
          Shopping List
        </h2>
        <InfoTooltip content="Generate and manage grocery lists directly from your recipes." />
      </div>
      <p className="mt-2 text-sm text-muted-foreground max-w-md font-light">
        Your consolidated shopping lists from selected recipes will appear here.
      </p>
    </div>
  )
}
