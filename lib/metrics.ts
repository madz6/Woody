/**
 * Lightweight client events for product iteration (dev console + optional beacon).
 * Does not replace structured server logging later.
 */

export function logEvent(name: string, payload?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  const body = { name, t: Date.now(), ...payload }
  if (process.env.NODE_ENV === 'development') {
    console.info('[woody:metric]', body)
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' })
      void navigator.sendBeacon('/api/metrics', blob)
    }
  } catch {
    /* ignore */
  }
}
