import { useEffect, useState } from 'react'
import {
  applyDeviceSettings,
  getDeviceSetting,
  setDeviceSetting,
  subscribeDeviceSettings,
  type Theme,
} from '@/lib/deviceSettings'

export type { Theme }

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getDeviceSetting('theme'))

  useEffect(() => {
    applyDeviceSettings({ theme })
    return subscribeDeviceSettings((settings) => {
      setThemeState(settings.theme)
      applyDeviceSettings(settings)
    })
  }, [theme])

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setDeviceSetting('theme', nextTheme)
  }

  const setTheme = (nextTheme: Theme) => {
    setDeviceSetting('theme', nextTheme)
  }

  return { theme, toggleTheme, setTheme }
}
