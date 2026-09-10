import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmUnsavedDialog } from '@/components/ConfirmUnsavedDialog'
import { isMac } from '@/lib/shortcuts'
import { Check, RotateCcw } from 'lucide-react'
import { cn } from 'cn'

export interface SaveBarProps {
  isDirty: boolean
  submitting?: boolean
  error?: string | null
  saveLabel?: string
  discardLabel?: string
  statusLabel?: string
  onSave?: () => void | Promise<void>
  onDiscard: () => void
  formId?: string
  className?: string
}

export function SaveBar({
  isDirty,
  submitting = false,
  error = null,
  saveLabel = 'Save',
  discardLabel = 'Discard',
  statusLabel = 'Unsaved changes',
  onSave,
  onDiscard,
  formId,
  className = '',
}: SaveBarProps) {
  const [phase, setPhase] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [activeError, setActiveError] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const saveStartRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDirtyRef = useRef(isDirty)
  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])
  const prevDirtyRef = useRef(isDirty)

  const prevSubmittingRef = useRef(submitting)
  const submittingEverActiveRef = useRef(false)

  const clearPendingTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Clear timers on component unmount only
  useEffect(() => {
    return () => {
      clearPendingTimers()
    }
  }, [])

  const triggerSavedSequence = useCallback(() => {
    clearPendingTimers()
    const elapsed = saveStartRef.current ? Date.now() - saveStartRef.current : 600
    const delay = Math.max(0, 600 - elapsed)

    timerRef.current = setTimeout(() => {
      if (isDirtyRef.current) {
        setPhase('idle')
        saveStartRef.current = null
        return
      }
      setPhase('saved')
      saveStartRef.current = null

      timerRef.current = setTimeout(() => {
        setPhase('idle')
      }, 1400)
    }, delay)
  }, [])

  // Trigger error phase when error prop is passed
  useEffect(() => {
    if (error) {
      clearPendingTimers()
      setActiveError(error)
      setPhase('error')
      setIsShaking(true)
      const shakeTimer = setTimeout(() => setIsShaking(false), 500)

      timerRef.current = setTimeout(() => {
        setPhase('idle')
        setActiveError(null)
      }, 2800)

      return () => {
        clearTimeout(shakeTimer)
        clearPendingTimers()
      }
    }
  }, [error])

  // Watch for submitting prop changes from parent
  useEffect(() => {
    const wasSubmitting = prevSubmittingRef.current
    if (submitting && !wasSubmitting) {
      submittingEverActiveRef.current = true
      clearPendingTimers()
      saveStartRef.current = Date.now()
      setPhase('saving')
      setActiveError(null)
    } else if (!submitting && wasSubmitting) {
      if (isDirtyRef.current) {
        clearPendingTimers()
        saveStartRef.current = null
        submittingEverActiveRef.current = false
        setPhase('idle')
      } else {
        triggerSavedSequence()
      }
    }
    prevSubmittingRef.current = submitting
  }, [submitting, triggerSavedSequence])

  // React immediately when the form becomes dirty again during or after saving:
  // If the form transitions from clean to dirty while in 'saved', or if isDirty is true during 'saved' phase,
  // immediately revert to the idle unsaved state without blur/checkmark.
  useEffect(() => {
    const wasDirty = prevDirtyRef.current
    prevDirtyRef.current = isDirty

    if ((!wasDirty && isDirty) || (isDirty && phase === 'saved')) {
      if (phase === 'saved' || phase === 'error') {
        clearPendingTimers()
        saveStartRef.current = null
        submittingEverActiveRef.current = false
        setPhase('idle')
        setActiveError(null)
      }
    } else if (!isDirty) {
      // Reset phase when isDirty drops to false outside of active saving/saved
      if (phase !== 'saving' && phase !== 'saved') {
        clearPendingTimers()
        setPhase('idle')
        saveStartRef.current = null
        setActiveError(null)
      }
    }
  }, [isDirty, phase])

  const handleSaveClick = useCallback(async () => {
    if (phase === 'saving' || phase === 'saved' || submitting) return

    clearPendingTimers()
    saveStartRef.current = Date.now()
    submittingEverActiveRef.current = false
    setPhase('saving')

    if (formId) {
      const form = document.getElementById(formId) as HTMLFormElement | null
      if (form) {
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit()
        } else {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
        }
      }
    }

    if (onSave) {
      try {
        await onSave()
        // If parent didn't toggle the submitting prop, manage the saved completion sequence here
        if (!submittingEverActiveRef.current) {
          if (isDirtyRef.current) {
            clearPendingTimers()
            saveStartRef.current = null
            setPhase('idle')
          } else {
            triggerSavedSequence()
          }
        }
      } catch (err: unknown) {
        console.error(err)
        clearPendingTimers()
        saveStartRef.current = null
        submittingEverActiveRef.current = false
        const msg = err instanceof Error ? err.message : 'Some choices are invalid'
        setActiveError(msg)
        setPhase('error')
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)

        timerRef.current = setTimeout(() => {
          setPhase('idle')
          setActiveError(null)
        }, 2800)
      }
    }
  }, [formId, onSave, phase, submitting, triggerSavedSequence])

  const isVisible = isDirty || phase === 'saving' || phase === 'saved' || phase === 'error'
  const isButtonsDisabled = submitting || phase === 'saving' || phase === 'saved'
  const isOverlayActive = phase === 'saving' || phase === 'saved'
  const canSave = isDirty && !isButtonsDisabled

  const [isMacOs, setIsMacOs] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    setIsMacOs(isMac())
  }, [])

  const handleSaveClickRef = useRef(handleSaveClick)
  useEffect(() => {
    handleSaveClickRef.current = handleSaveClick
  }, [handleSaveClick])

  const onDiscardRef = useRef(onDiscard)
  useEffect(() => {
    onDiscardRef.current = onDiscard
  }, [onDiscard])

  // Global Ctrl+S / Cmd+S (save) and Esc (discard) shortcuts when SaveBar is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        e.stopPropagation()
        if (canSave) {
          void handleSaveClickRef.current()
        }
      }
      // Discard: Escape -> triggers confirmation dialog
      else if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        if (canSave) {
          // Do not trigger discard if user is dismissing an open modal dialog or popup
          const hasOpenOverlay = document.querySelector(
            '[role="dialog"]:not([data-slot="alert-dialog-content"]), [role="alertdialog"]:not([data-slot="alert-dialog-content"]), [data-state="open"][data-slot="combobox-content"]'
          )
          if (!hasOpenOverlay) {
            e.preventDefault()
            e.stopPropagation()
            setShowConfirmModal(true)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [canSave])

  const handleConfirmDiscard = () => {
    setShowConfirmModal(false)
    onDiscard()
  }

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 inset-x-0 mx-auto w-full max-w-2xl px-4 z-50 transition-all duration-400 ease-out',
          isVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-24 opacity-0 pointer-events-none',
          isShaking ? 'animate-head-shake' : '',
          className
        )}
      >
        <div className="relative overflow-hidden flex items-center justify-between gap-2 sm:gap-3 p-1.5 sm:p-2.5 rounded-full border border-border bg-card/85 backdrop-blur-sm shadow-xl">
          {/* Full Bar Blur & Central Morph Animation Overlay */}
          <div
            className={cn(
              'absolute inset-0 z-20 rounded-full flex items-center justify-center bg-card/75 backdrop-blur-sm transition-opacity duration-300',
              isOverlayActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
          >
            {phase === 'saving' && (
              <div className="flex items-center justify-center animate-in fade-in duration-200">
                <svg
                  className="h-8 w-8 animate-spin text-foreground"
                  viewBox="0 0 36 36"
                  fill="none"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    stroke="currentColor"
                    strokeOpacity="0.2"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeDasharray="60 100"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
            {phase === 'saved' && (
              <div className="flex items-center justify-center animate-circle-fade">
                <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500 text-white shadow-md">
                  <svg
                    className="h-4.5 w-4.5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      d="M 5 12.5 L 9.5 17 L 19 7"
                      className="animate-check-draw"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Left Side: Status indicator */}
          <div className="flex items-center gap-2 pl-2.5 sm:pl-4 min-w-0 shrink">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {phase === 'saved' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 transition-colors duration-300" />
                </>
              ) : phase === 'error' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 transition-colors duration-300" />
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 transition-colors duration-300" />
                </>
              )}
            </span>
            <span
              className={cn(
                'text-xs sm:text-sm font-semibold select-none transition-colors duration-300 truncate',
                phase === 'error' ? 'text-destructive' : 'text-foreground'
              )}
            >
              {phase === 'saved'
                ? 'Saved'
                : phase === 'saving'
                ? 'Saving...'
                : phase === 'error'
                ? activeError || 'Some choices are invalid'
                : statusLabel}
            </span>
          </div>

          {/* Right Side: Discard & Save Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isButtonsDisabled}
                    aria-label={discardLabel}
                    className="rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer p-2 sm:px-3.5 h-8 sm:h-9 shrink-0 disabled:opacity-40 flex items-center justify-center"
                  >
                    <RotateCcw className="h-3.5 w-3.5 sm:mr-1.5 shrink-0" />
                    <span className="hidden sm:inline">{discardLabel}</span>
                  </Button>
                }
              />
              <TooltipContent side="top" className="p-1 px-1.5">
                <Kbd>Esc</Kbd>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    onClick={handleSaveClick}
                    variant="default"
                    size="sm"
                    disabled={isButtonsDisabled}
                    aria-label={saveLabel}
                    className="rounded-full text-xs font-semibold shrink-0 cursor-pointer shadow-md bg-primary text-primary-foreground hover:opacity-90 px-3.5 sm:px-4 h-8 sm:h-9 disabled:opacity-40 flex items-center justify-center min-w-16 sm:min-w-24"
                  >
                    <Check className="h-3.5 w-3.5 mr-1 sm:mr-1.5 shrink-0" />
                    <span>{phase === 'saved' ? 'Saved' : saveLabel}</span>
                  </Button>
                }
              />
              {phase !== 'saved' && (
                <TooltipContent side="top" className="p-1 px-1.5">
                  <KbdGroup>
                    <Kbd>{isMacOs ? '⌘' : 'Ctrl'}</Kbd>
                    <span className="text-[10px] text-muted-foreground font-medium select-none px-0.5">+</span>
                    <Kbd>S</Kbd>
                  </KbdGroup>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </div>

      <ConfirmUnsavedDialog
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirmDiscard={handleConfirmDiscard}
        title="Discard unsaved changes?"
        description="You have unsaved changes that will be lost."
        confirmText={discardLabel}
      />
    </>
  )
}



