/**
 * Singleton audio preview — plays a 30s Spotify preview URL after a hover delay.
 * One audio element at a time; cancelling clears timer and stops playback.
 */

let audio: HTMLAudioElement | null = null
let hoverTimer: ReturnType<typeof setTimeout> | null = null

export function startPreview(url: string, delayMs = 600): void {
  if (typeof window === 'undefined') return
  cancelPreview()
  hoverTimer = setTimeout(() => {
    audio = new Audio(url)
    audio.volume = 0.6
    void audio.play().catch(() => {})
  }, delayMs)
}

export function cancelPreview(): void {
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
  if (audio) {
    audio.pause()
    audio.src = ''
    audio = null
  }
}
