/**
 * Browser cookie utilities with secure defaults.
 * Used for device-level settings and client persistence.
 */

export interface CookieOptions {
  /** Lifetime in days. Defaults to 365 days (1 year). */
  days?: number
  /** Cookie path. Defaults to root '/'. */
  path?: string
  /** Domain attribute. */
  domain?: string
  /** SameSite attribute. Defaults to 'Lax'. */
  sameSite?: 'Lax' | 'Strict' | 'None'
  /** Secure attribute. Defaults to true if running over HTTPS. */
  secure?: boolean
}

/**
 * Get the string value of a cookie by name.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const escapedName = encodeURIComponent(name).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  const matches = document.cookie.match(new RegExp('(?:^|; )' + escapedName + '=([^;]*)'))
  return matches ? decodeURIComponent(matches[1]) : null
}

/**
 * Set a cookie with secure defaults (1-year lifetime, path=/, SameSite=Lax).
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return

  const days = options.days ?? 365
  const path = options.path ?? '/'
  const sameSite = options.sameSite ?? 'Lax'
  const isSecure = options.secure ?? (typeof window !== 'undefined' && window.location.protocol === 'https:')

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`

  if (days > 0) {
    const expires = new Date(Date.now() + days * 864e5)
    cookieString += `; expires=${expires.toUTCString()}; Max-Age=${days * 86400}`
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`
  }

  if (isSecure) {
    cookieString += '; Secure'
  }

  document.cookie = cookieString
}

/**
 * Delete a cookie by expiring it immediately.
 */
export function deleteCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') return
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax`
}
