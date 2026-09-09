export type AppMode = 'woo' | 'standalone'

const APP_MODE_KEY = 'zubkas_app_mode'

export function getAppMode(): AppMode {
  try {
    const saved = localStorage.getItem(APP_MODE_KEY)
    if (saved === 'standalone') return 'standalone'
    return 'woo' // Default to live WooCommerce mode everywhere
  } catch {
    return 'woo'
  }
}

export function setAppMode(mode: AppMode): void {
  try {
    localStorage.setItem(APP_MODE_KEY, mode)
    window.dispatchEvent(new CustomEvent('appmode-change', { detail: mode }))
  } catch {
    // ignore storage errors
  }
}
