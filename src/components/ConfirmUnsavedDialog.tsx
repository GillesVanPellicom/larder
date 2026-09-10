import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertCircle, RotateCcw } from 'lucide-react'

interface ConfirmUnsavedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmDiscard: () => void
  title?: string
  description?: string
  confirmText?: string
}

export function ConfirmUnsavedDialog({
  open,
  onOpenChange,
  onConfirmDiscard,
  title = 'Discard unsaved changes?',
  description = 'You have unsaved changes that will be lost if you leave this page.',
  confirmText = 'Discard Changes',
}: ConfirmUnsavedDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel
            size="lg"
            className="border-border text-foreground hover:bg-muted cursor-pointer"
          >
            Keep Editing
          </AlertDialogCancel>
          <AlertDialogAction
            size="lg"
            onClick={(e) => {
              e.preventDefault()
              onConfirmDiscard()
              onOpenChange(false)
            }}
            className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
