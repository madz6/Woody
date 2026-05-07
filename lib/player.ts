/**
 * Singleton Spotify Web Playback SDK wrapper.
 * Starting a specific track URI requires REST PUT /me/player + /play?device_id.
 */

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js'
const SPOTIFY_API = 'https://api.spotify.com/v1'

type SpotifyPlayerInstance = {
  connect: () => Promise<boolean>
  disconnect: () => void
  pause: () => Promise<void>
  resume: () => Promise<void>
  togglePlay: () => Promise<void>
  activateElement: () => Promise<void>
  getCurrentState: () => Promise<SpotifyWebPlaybackState | null>
  addListener: (event: string, cb: (...args: unknown[]) => void) => void
  removeListener: (event: string, cb: (...args: unknown[]) => void) => void
}

export type SpotifyWebPlaybackState = {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      uri: string
      id: string
      name: string
      artists: { name: string }[]
    } | null
  }
}

type SpotifyCtor = new (options: {
  name: string
  getOAuthToken: (cb: (token: string) => void) => void
  volume?: number
}) => SpotifyPlayerInstance

function getSpotifyGlobal(): { Player: SpotifyCtor } | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { Spotify?: { Player: SpotifyCtor } }).Spotify
}

let deviceId: string | null = null
let player: SpotifyPlayerInstance | null = null
let accessToken: string | null = null
let initPromise: Promise<void> | null = null
const stateListeners = new Set<() => void>()

function notifyState() {
  stateListeners.forEach((fn) => {
    try {
      fn()
    } catch {
      /* ignore */
    }
  })
}

export function subscribePlayerState(listener: () => void): () => void {
  stateListeners.add(listener)
  return () => stateListeners.delete(listener)
}

function makeStatusError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function isUnauthorizedError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err != null &&
    'status' in err &&
    (err as { status?: number }).status === 401
  )
}

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (getSpotifyGlobal()) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const selector = `script[src="${SDK_URL}"]`
    const existing = document.querySelector(selector)
    if (existing) {
      if (getSpotifyGlobal()) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Spotify SDK load error')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Spotify SDK load error'))
    document.body.appendChild(script)
  })
}

async function fetchToken(): Promise<string> {
  const res = await fetch('/api/auth/token', { credentials: 'include' })
  const data = (await res.json()) as { token?: string; error?: string }
  if (!res.ok || !data.token) {
    const error = new Error(data.error ?? 'not_connected') as Error & { status?: number }
    error.status = res.status
    throw error
  }
  accessToken = data.token
  return data.token
}

async function withTokenRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (!isUnauthorizedError(err)) throw err
    const result = await woodyPlayer.refreshAccessToken()
    if (result === 'updated' || result === 'unchanged') {
      return await fn()
    }
    throw err
  }
}

export const woodyPlayer = {
  getDeviceId(): string | null {
    return deviceId
  },

  isReady(): boolean {
    return Boolean(deviceId && player)
  },

  async init(initialToken?: string): Promise<void> {
    if (initPromise) return initPromise

    initPromise = (async () => {
      deviceId = null
      if (player) {
        try {
          player.disconnect()
        } catch {
          /* ignore */
        }
        player = null
      }

      accessToken = initialToken ?? (await fetchToken())

      await new Promise<void>((resolve, reject) => {
        let settled = false
        let creationStarted = false

        const timeoutId = window.setTimeout(() => {
          if (!settled) {
            finish(
              new Error(
                'Spotify player did not start in time. Try Chrome or Edge, disable ad blockers for this site, and allow scripts from sdk.scdn.co.'
              )
            )
          }
        }, 25_000)

        const finish = (err?: Error) => {
          if (settled) return
          settled = true
          window.clearTimeout(timeoutId)
          if (err) reject(err)
          else resolve()
        }

        const startPlayer = async () => {
          if (creationStarted) return
          creationStarted = true
          try {
            const Spotify = getSpotifyGlobal()
            if (!Spotify) {
              finish(new Error('Spotify Web Playback SDK unavailable - check blockers and sdk.scdn.co'))
              return
            }

            const p = new Spotify.Player({
              name: 'Woody Web Player',
              getOAuthToken: (cb) => {
                if (accessToken) {
                  cb(accessToken)
                  return
                }
                void fetchToken()
                  .then((token) => cb(token))
                  .catch(() => {
                    if (accessToken) cb(accessToken)
                    else cb('')
                  })
              },
              volume: 0.85,
            })
            player = p

            const pl = p as {
              addListener: (event: string, fn: (arg?: unknown) => void) => void
            }
            pl.addListener('ready', (evt) => {
              const event = evt as { device_id: string }
              deviceId = event.device_id
            })
            pl.addListener('player_state_changed', () => notifyState())
            pl.addListener('not_ready', () => {
              deviceId = null
            })

            pl.addListener('initialization_error', (event) => {
              const err = event as { message: string }
              finish(
                new Error(
                  err.message ||
                    'Web Playback failed to initialize - Premium required; use a supported browser and allow sdk.scdn.co.'
                )
              )
            })
            pl.addListener('authentication_error', (event) => {
              const err = event as { message: string }
              finish(
                new Error(
                  err.message ||
                    'Spotify rejected the player token - click Reconnect or switch account, then refresh.'
                )
              )
            })
            pl.addListener('account_error', () => {
              finish(new Error('Spotify Premium is required for in-browser playback.'))
            })

            const ok = await p.connect()
            if (!ok) {
              finish(new Error('Could not connect to Spotify - refresh the page or try another browser.'))
              return
            }

            const deadline = Date.now() + 20_000
            while (!deviceId && Date.now() < deadline) {
              await new Promise((resolveSleep) => setTimeout(resolveSleep, 50))
            }
            if (!deviceId) {
              finish(
                new Error(
                  'No Web Playback device - confirm Spotify Premium and that the "streaming" scope was granted (reconnect Spotify).'
                )
              )
              return
            }

            finish()
          } catch (e) {
            finish(e instanceof Error ? e : new Error(String(e)))
          }
        }

        const w = window as unknown as { onSpotifyWebPlaybackSDKReady?: () => void }
        w.onSpotifyWebPlaybackSDKReady = () => {
          void startPlayer()
        }

        void loadScript()
          .then(() => {
            if (settled || creationStarted) return
            if (getSpotifyGlobal()) void startPlayer()
          })
          .catch((e) => finish(e instanceof Error ? e : new Error(String(e))))
      })
    })()

    try {
      await initPromise
    } catch (e) {
      initPromise = null
      throw e
    }
  },

  async play(spotifyUri: string): Promise<void> {
    if (!deviceId || !player) throw new Error('Player not ready')
    const currentDeviceId = deviceId
    if (!/^spotify:track:[A-Za-z0-9]+$/.test(spotifyUri)) {
      throw new Error(`Invalid Spotify URI: ${spotifyUri}`)
    }

    await withTokenRetry(async () => {
      const token = accessToken ?? (await fetchToken())
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      const transfer = await fetch(`${SPOTIFY_API}/me/player`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ device_ids: [currentDeviceId], play: false }),
      })
      if (transfer.status === 401) {
        throw makeStatusError(401, 'Transfer failed: 401')
      }
      if (transfer.status === 404) {
        await new Promise((resolveSleep) => setTimeout(resolveSleep, 800))
      } else if (![200, 202, 204].includes(transfer.status)) {
        const body = await transfer.text()
        throw new Error(body || `Transfer failed: ${transfer.status}`)
      }

      const playRes = await fetch(
        `${SPOTIFY_API}/me/player/play?device_id=${encodeURIComponent(currentDeviceId)}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ uris: [spotifyUri] }),
        }
      )
      if (playRes.status === 401) {
        throw makeStatusError(401, 'Play failed: 401')
      }
      if (![200, 202, 204].includes(playRes.status)) {
        const body = await playRes.text()
        throw new Error(body || `Play failed: ${playRes.status}`)
      }
    })

    try {
      await player.activateElement()
    } catch {
      /* autoplay policies */
    }
    notifyState()
  },

  async pause(): Promise<void> {
    await player?.pause()
    notifyState()
  },

  async resume(): Promise<void> {
    await player?.resume()
    notifyState()
  },

  async getState(): Promise<SpotifyWebPlaybackState | null> {
    if (!player) return null
    return player.getCurrentState()
  },

  async seek(positionMs: number): Promise<void> {
    if (!deviceId || !player) return
    const currentDeviceId = deviceId
    await withTokenRetry(async () => {
      const token = accessToken ?? (await fetchToken())
      const res = await fetch(
        `${SPOTIFY_API}/me/player/seek?position_ms=${Math.round(positionMs)}&device_id=${encodeURIComponent(currentDeviceId)}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (res.status === 401) {
        throw makeStatusError(401, 'Seek failed: 401')
      }
    })
    notifyState()
  },

  async skipNext(): Promise<void> {
    if (!deviceId) return
    const currentDeviceId = deviceId
    await withTokenRetry(async () => {
      const token = accessToken ?? (await fetchToken())
      const res = await fetch(
        `${SPOTIFY_API}/me/player/next?device_id=${encodeURIComponent(currentDeviceId)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (res.status === 401) {
        throw makeStatusError(401, 'Skip next failed: 401')
      }
    })
    notifyState()
  },

  async skipPrev(): Promise<void> {
    if (!deviceId) return
    const currentDeviceId = deviceId
    await withTokenRetry(async () => {
      const token = accessToken ?? (await fetchToken())
      const res = await fetch(
        `${SPOTIFY_API}/me/player/previous?device_id=${encodeURIComponent(currentDeviceId)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (res.status === 401) {
        throw makeStatusError(401, 'Skip previous failed: 401')
      }
    })
    notifyState()
  },

  async addToQueue(spotifyUri: string): Promise<void> {
    if (!deviceId) return
    const currentDeviceId = deviceId
    if (!/^spotify:track:[A-Za-z0-9]+$/.test(spotifyUri)) return
    await withTokenRetry(async () => {
      const token = accessToken ?? (await fetchToken())
      const res = await fetch(
        `${SPOTIFY_API}/me/player/queue?uri=${encodeURIComponent(spotifyUri)}&device_id=${encodeURIComponent(currentDeviceId)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (res.status === 401) {
        throw makeStatusError(401, 'Add to queue failed: 401')
      }
    })
  },

  async refreshAccessToken(): Promise<'unchanged' | 'updated' | 'unauthorized' | 'failed'> {
    try {
      const res = await fetch('/api/auth/token', { credentials: 'include' })
      const data = (await res.json()) as { token?: string; error?: string }
      if (!res.ok || !data.token) {
        return res.status === 401 ? 'unauthorized' : 'failed'
      }
      if (data.token === accessToken) return 'unchanged'
      accessToken = data.token
      return 'updated'
    } catch (err) {
      console.error('[woodyPlayer] token refresh failed:', err)
      return 'failed'
    }
  },
}
