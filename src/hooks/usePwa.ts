import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null
  }
}

// Early capture before React renders
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    window.__deferredPwaPrompt = e as BeforeInstallPromptEvent
  })
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    Boolean(nav.standalone) ||
    document.referrer.startsWith('android-app://')
  )
}

export function usePwa() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPwaPrompt) {
      return window.__deferredPwaPrompt
    }
    return null
  })
  const [isInstalled, setIsInstalled] = useState(checkIsStandalone)

  useEffect(() => {
    if (checkIsStandalone()) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const pwaEvent = e as BeforeInstallPromptEvent
      window.__deferredPwaPrompt = pwaEvent
      setInstallPrompt(pwaEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      window.__deferredPwaPrompt = null
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if prompt was captured on window
    if (window.__deferredPwaPrompt && !installPrompt) {
      setInstallPrompt(window.__deferredPwaPrompt)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [installPrompt])

  const triggerInstall = async (): Promise<boolean> => {
    const prompt = installPrompt || (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null)
    if (!prompt) return false

    try {
      await prompt.prompt()
      const choice = await prompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
        setInstallPrompt(null)
        window.__deferredPwaPrompt = null
        return true
      }
    } catch (err) {
      console.error('Failed to trigger PWA install prompt:', err)
    }
    return false
  }

  return {
    canInstall: !!(installPrompt || (typeof window !== 'undefined' && window.__deferredPwaPrompt)) && !isInstalled,
    isInstalled,
    triggerInstall,
  }
}
