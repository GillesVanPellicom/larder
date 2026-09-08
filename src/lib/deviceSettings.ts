import { useState, useEffect } from 'react'
import { getCookie, setCookie } from './cookies'

export type Theme = 'light' | 'dark'

export interface DeviceSettings {
  theme: Theme
}

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  theme: 'light',
}

const COOKIE_PREFIX = 'coquinaria_'

type SettingsListener = (settings: DeviceSettings) => void
const listeners = new Set<SettingsListener>()

/**
 * Apply DOM modifications based on active device settings (e.g. .dark class).
 */
export function applyDeviceSettings(settings: DeviceSettings): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (settings.theme === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}

/**
 * Read a single device setting from cookies with safe fallbacks and legacy migrations.
 */
export function getDeviceSetting<K extends keyof DeviceSettings>(key: K): DeviceSettings[K] {
  if (typeof window === 'undefined') {
    return DEFAULT_DEVICE_SETTINGS[key]
  }

  if (key === 'theme') {
    const raw = getCookie(`${COOKIE_PREFIX}theme`)
    if (raw === 'light' || raw === 'dark') {
      return raw as DeviceSettings[K]
    }

    // Gracefully migrate legacy localStorage if present
    try {
      const legacy = localStorage.getItem('larder-theme')
      if (legacy === 'light' || legacy === 'dark') {
        setCookie(`${COOKIE_PREFIX}theme`, legacy)
        localStorage.removeItem('larder-theme')
        return legacy as DeviceSettings[K]
      }
    } catch {
      // Ignore localStorage read errors
    }

    // Fallback to system preferences
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return (prefersDark ? 'dark' : 'light') as DeviceSettings[K]
  }

  const raw = getCookie(`${COOKIE_PREFIX}${key}`)
  return (raw as DeviceSettings[K]) ?? DEFAULT_DEVICE_SETTINGS[key]
}

/**
 * Get all device settings as an object.
 */
export function getAllDeviceSettings(): DeviceSettings {
  return {
    theme: getDeviceSetting('theme'),
  }
}

/**
 * Notify all subscribers of changes to device settings.
 */
function notifySubscribers(settings: DeviceSettings): void {
  listeners.forEach((listener) => {
    try {
      listener(settings)
    } catch (err) {
      console.error('Error in device settings subscriber:', err)
    }
  })

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('coquinaria:device-settings-change', {
        detail: settings,
      })
    )
  }
}

/**
 * Set a device setting in cookies, apply DOM effects, and notify subscribers.
 */
export function setDeviceSetting<K extends keyof DeviceSettings>(
  key: K,
  value: DeviceSettings[K]
): void {
  setCookie(`${COOKIE_PREFIX}${key}`, String(value))
  const updatedSettings = getAllDeviceSettings()
  applyDeviceSettings(updatedSettings)
  notifySubscribers(updatedSettings)
}

/**
 * Subscribe to device settings changes.
 * Returns an unsubscribe function.
 */
export function subscribeDeviceSettings(listener: SettingsListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * React hook to access and update device settings reactively.
 */
export function useDeviceSettings() {
  const [settings, setSettingsState] = useState<DeviceSettings>(getAllDeviceSettings)

  useEffect(() => {
    return subscribeDeviceSettings((newSettings) => {
      setSettingsState(newSettings)
    })
  }, [])

  return {
    settings,
    getSetting: getDeviceSetting,
    setSetting: setDeviceSetting,
  }
}
