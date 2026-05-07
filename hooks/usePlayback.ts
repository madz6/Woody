'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react'
import type { MapNode, PersonaLens, TrackSuggestion } from '@/lib/types'
import type { MapNodeData } from '@/components/map/useMapNodes'
import { woodyPlayer, subscribePlayerState } from '@/lib/player'
import { appendPlayedTrack } from '@/lib/memory'
import { rankByTransition } from '@/lib/heuristics'
import { camelotCodeToSpotifyKeyMode } from '@/lib/camelot'
import { logEvent } from '@/lib/metrics'
import {
  clearPersistedSessionPlayback,
  loadPersistedSessionPlayback,
  savePersistedSessionPlayback,
} from '@/lib/sessionQueueStorage'

function adjustQueueIndexAfterReorder(qi: number, from: number, to: number): number {
  if (qi === from) return to
  if (from < to) {
    if (qi > from && qi <= to) return qi - 1
  } else if (from > to) {
    if (qi >= to && qi < from) return qi + 1
  }
  return qi
}

type RankNode = MapNodeData & {
  key?: number
  mode?: number
  tempo?: number
  energy?: number
}

function buildRankedSessionQueue(
  pool: MapNodeData[],
  clickedIndex: number,
  suggestions: TrackSuggestion[]
): MapNodeData[] | null {
  if (clickedIndex < 0 || clickedIndex >= pool.length) return null
  const clicked = pool[clickedIndex]
  const before = pool.slice(0, clickedIndex)
  const after = pool.slice(clickedIndex + 1)
  const sugClicked = suggestions.find((s) => s.track.id === clicked.trackId)
  const a0 = sugClicked?.audioAttributes
  const km0 = a0?.key ? camelotCodeToSpotifyKeyMode(a0.key) : null
  const hasFromSignal = a0?.bpm != null || a0?.energy != null || km0 != null
  const from = hasFromSignal
    ? {
        energy: a0?.energy,
        tempo: a0?.bpm,
        key: km0?.key,
        mode: km0?.mode,
      }
    : null

  const afterRanked: RankNode[] = after.map((n) => {
    const s2 = suggestions.find((s) => s.track.id === n.trackId)
    const ae = s2?.audioAttributes
    const km = ae?.key ? camelotCodeToSpotifyKeyMode(ae.key) : undefined
    return {
      ...n,
      key: km?.key,
      mode: km?.mode,
      tempo: ae?.bpm,
      energy: ae?.energy,
    }
  })

  const ranked = rankByTransition(from, afterRanked)
  return [
    ...before,
    clicked,
    ...ranked.map((n) => {
      const { key: _k, mode: _m, tempo: _t, energy: _e, ...rest } = n
      return rest as MapNodeData
    }),
  ]
}

export interface HydratedSessionState {
  suggestions: TrackSuggestion[]
  lastIntent: string
  lastLens: PersonaLens | null
  intentMode: 'layer' | 'redirect' | null
  currentSessionId: string | null
}

interface UsePlaybackParams {
  suggestions: TrackSuggestion[]
  mapNodesRef: MutableRefObject<MapNodeData[]>
  memoryNodes: MapNode[]
  currentSessionId: string | null
  lastIntent: string
  lastLens: PersonaLens | null
  intentMode: 'layer' | 'redirect' | null
  loading: boolean
  onPlaybackRecorded?: () => void
}

export function usePlayback({
  suggestions,
  mapNodesRef,
  memoryNodes,
  currentSessionId,
  lastIntent,
  lastLens,
  intentMode,
  loading,
  onPlaybackRecorded,
}: UsePlaybackParams) {
  const suggestionsRef = useRef(suggestions)
  const memoryNodesRef = useRef(memoryNodes)
  const currentSessionIdRef = useRef(currentSessionId)
  suggestionsRef.current = suggestions
  memoryNodesRef.current = memoryNodes
  currentSessionIdRef.current = currentSessionId

  const [playerError, setPlayerError] = useState<string | null>(null)
  const [hasSpotify, setHasSpotify] = useState<boolean | null>(null)
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null)
  const [trailTrackIds, setTrailTrackIds] = useState<string[]>([])
  const [sessionQueue, setSessionQueue] = useState<MapNodeData[]>([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [playbackHydrated, setPlaybackHydrated] = useState(false)
  const [hydratedSession, setHydratedSession] = useState<HydratedSessionState | null>(null)

  const sessionQueueRef = useRef<MapNodeData[]>([])
  const queueIndexRef = useRef(-1)
  const playProgressRef = useRef<{ tid: string | null; maxPos: number }>({
    tid: null,
    maxPos: 0,
  })
  const advancingRef = useRef(false)
  const handleQueueNextRef = useRef<() => Promise<void>>(async () => {})
  const firstPlaySinceIntentRef = useRef(false)

  useEffect(() => {
    sessionQueueRef.current = sessionQueue
  }, [sessionQueue])

  useEffect(() => {
    queueIndexRef.current = queueIndex
  }, [queueIndex])

  const syncPlayingId = useCallback(async () => {
    const st = await woodyPlayer.getState()
    setCurrentTrackId(st?.track_window?.current_track?.id ?? null)
  }, [])

  useEffect(() => {
    const snap = loadPersistedSessionPlayback()
    if (snap) {
      if (snap.queue.length > 0) {
        setSessionQueue(snap.queue)
        setQueueIndex(snap.queueIndex)
        sessionQueueRef.current = snap.queue
        queueIndexRef.current = snap.queueIndex
      }
      setHydratedSession({
        suggestions: snap.suggestions,
        lastIntent: snap.lastIntent,
        lastLens: snap.lastLens,
        intentMode: snap.intentMode,
        currentSessionId: snap.currentSessionId,
      })
    }
    setPlaybackHydrated(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/token', { credentials: 'include' })
        const data = await res.json()
        if (!res.ok || !data.token) {
          if (!cancelled) setHasSpotify(false)
          return
        }
        if (cancelled) return
        setHasSpotify(true)
        setPlayerError(null)
        try {
          await woodyPlayer.init(data.token)
        } catch (e) {
          if (!cancelled) {
            setPlayerError(
              e instanceof Error ? e.message : 'Web Playback could not start - Premium required'
            )
          }
        }
      } catch (e) {
        if (!cancelled) {
          setHasSpotify(false)
          setPlayerError(
            e instanceof Error ? e.message : 'connect spotify to start navigating'
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hasSpotify) return

    let consecutiveFailures = 0

    const doRefresh = async () => {
      const result = await woodyPlayer.refreshAccessToken()
      if (result === 'unauthorized') {
        setHasSpotify(false)
        setPlayerError('Session expired - reconnect Spotify')
        return
      }
      if (result === 'failed') {
        consecutiveFailures += 1
        if (consecutiveFailures >= 2) {
          setHasSpotify(false)
          setPlayerError('Session expired - reconnect Spotify')
        }
        return
      }
      consecutiveFailures = 0
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void doRefresh()
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void doRefresh()
      }
    }, 45 * 60 * 1000)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(intervalId)
    }
  }, [hasSpotify])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') !== 'error') return

    const reason = params.get('reason') ?? ''
    const byReason: Record<string, string> = {
      denied: 'Spotify login was cancelled.',
      oauth: 'Spotify returned an error during login. Try again.',
      missing_code: 'Login redirect was incomplete. Try Connect Spotify again.',
      misconfigured:
        'Server missing SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, or SPOTIFY_REDIRECT_URI in .env.local.',
      invalid_grant:
        'Redirect URI mismatch: SPOTIFY_REDIRECT_URI in .env.local must match Spotify Dashboard -> Redirect URIs exactly.',
      invalid_client:
        'Invalid Spotify client id or secret - check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local.',
      token:
        'Could not complete Spotify login (token step failed). Check client secret and redirect URI.',
      no_access_token: 'Spotify did not return an access token. Check your app settings.',
    }
    setPlayerError(
      byReason[reason] ??
        'Spotify login did not finish. Open the app at the same URL as SPOTIFY_REDIRECT_URI.'
    )

    const u = new URL(window.location.href)
    u.searchParams.delete('auth')
    u.searchParams.delete('reason')
    const qs = u.searchParams.toString()
    window.history.replaceState({}, '', u.pathname + (qs ? `?${qs}` : '') + u.hash)
  }, [])

  useEffect(() => {
    if (!playbackHydrated) return
    if (loading) return
    if (sessionQueue.length === 0 && suggestions.length === 0) {
      clearPersistedSessionPlayback()
      return
    }
    savePersistedSessionPlayback({
      queue: sessionQueue,
      queueIndex,
      suggestions,
      lastIntent,
      lastLens,
      intentMode,
      currentSessionId,
    })
  }, [
    playbackHydrated,
    sessionQueue,
    queueIndex,
    suggestions,
    lastIntent,
    lastLens,
    intentMode,
    currentSessionId,
    loading,
  ])

  useEffect(() => {
    firstPlaySinceIntentRef.current = false
  }, [suggestions])

  const playTrackAndTrail = useCallback(
    async (node: MapNodeData) => {
      if (!node.spotifyUri) return
      try {
        if (!woodyPlayer.isReady()) {
          const res = await fetch('/api/auth/token', { credentials: 'include' })
          const data = await res.json()
          if (data.token) await woodyPlayer.init(data.token)
        }
        await woodyPlayer.play(node.spotifyUri)
        setTrailTrackIds((prev) => [...prev.filter((id) => id !== node.trackId), node.trackId])

        const sid = currentSessionIdRef.current
        if (sid) {
          const suggestion = suggestionsRef.current.find((s) => s.track.id === node.trackId)
          const track = suggestion?.track ?? memoryNodesRef.current.find((m) => m.trackId === node.trackId)?.track
          if (track) {
            appendPlayedTrack(sid, track, 'anchor', suggestion?.audioAttributes)
            onPlaybackRecorded?.()
          }
        }

        if (suggestionsRef.current.length > 0 && !firstPlaySinceIntentRef.current) {
          firstPlaySinceIntentRef.current = true
          logEvent('first_play_after_intent', { sessionId: currentSessionIdRef.current ?? undefined })
        }
        void syncPlayingId()
      } catch (e) {
        console.error(e)
        setPlayerError(e instanceof Error ? e.message : 'playback failed')
      }
    },
    [onPlaybackRecorded, syncPlayingId]
  )

  const selectAndPlay = useCallback(
    async (node: MapNodeData) => {
      const sug = suggestionsRef.current
      const mapNodes = mapNodesRef.current
      if (sug.length > 0) {
        const sugIds = new Set(sug.map((s) => s.track.id))
        const pool = mapNodes.filter((n) => sugIds.has(n.trackId))
        const idx = pool.findIndex((n) => n.trackId === node.trackId)
        if (idx >= 0) {
          const nextQueue = buildRankedSessionQueue(pool, idx, sug)
          if (nextQueue) {
            setSessionQueue(nextQueue)
            setQueueIndex(idx)
            sessionQueueRef.current = nextQueue
            queueIndexRef.current = idx
          }
        } else {
          setSessionQueue([node])
          setQueueIndex(0)
          sessionQueueRef.current = [node]
          queueIndexRef.current = 0
        }
      } else {
        setSessionQueue([])
        setQueueIndex(-1)
        sessionQueueRef.current = []
        queueIndexRef.current = -1
      }
      await playTrackAndTrail(node)
    },
    [mapNodesRef, playTrackAndTrail]
  )

  const next = useCallback(async () => {
    const sq = sessionQueueRef.current
    const qi = queueIndexRef.current
    if (qi < 0 || qi >= sq.length - 1) return
    const nextNode = sq[qi + 1]
    const nqi = qi + 1
    setQueueIndex(nqi)
    queueIndexRef.current = nqi
    await playTrackAndTrail(nextNode)
  }, [playTrackAndTrail])

  const prev = useCallback(async () => {
    const sq = sessionQueueRef.current
    const qi = queueIndexRef.current
    if (qi <= 0) return
    const prevNode = sq[qi - 1]
    const nqi = qi - 1
    setQueueIndex(nqi)
    queueIndexRef.current = nqi
    await playTrackAndTrail(prevNode)
  }, [playTrackAndTrail])

  handleQueueNextRef.current = next

  const pick = useCallback(
    async (i: number) => {
      const sq = sessionQueueRef.current
      const pickNode = sq[i]
      if (!pickNode) return
      setQueueIndex(i)
      queueIndexRef.current = i
      await playTrackAndTrail(pickNode)
    },
    [playTrackAndTrail]
  )

  const reorder = useCallback((from: number, to: number) => {
    setSessionQueue((q) => {
      if (to < 0 || to >= q.length) return q
      const n = [...q]
      const [x] = n.splice(from, 1)
      n.splice(to, 0, x)
      sessionQueueRef.current = n
      return n
    })
    setQueueIndex((qi) => {
      const nqi = adjustQueueIndexAfterReorder(qi, from, to)
      queueIndexRef.current = nqi
      return nqi
    })
  }, [])

  const clearQueue = useCallback(() => {
    setSessionQueue([])
    setQueueIndex(-1)
    sessionQueueRef.current = []
    queueIndexRef.current = -1
  }, [])

  const queueAll = useCallback(async () => {
    const sug = suggestionsRef.current
    const mapNodes = mapNodesRef.current
    if (sug.length === 0) return
    const sugIds = new Set(sug.map((s) => s.track.id))
    const pool = mapNodes.filter((n) => sugIds.has(n.trackId))
    const nextQueue = buildRankedSessionQueue(pool, 0, sug)
    if (!nextQueue?.length) return
    setSessionQueue(nextQueue)
    setQueueIndex(0)
    sessionQueueRef.current = nextQueue
    queueIndexRef.current = 0
    await playTrackAndTrail(nextQueue[0])
  }, [mapNodesRef, playTrackAndTrail])

  const rejectTrackFromPlayback = useCallback(
    async (trackId: string) => {
      const sq = sessionQueueRef.current
      const qi = queueIndexRef.current
      const isCurrent = qi >= 0 && qi < sq.length && sq[qi]?.trackId === trackId
      const newQueue = sq.filter((n) => n.trackId !== trackId)
      let newIndex = qi

      if (isCurrent) {
        newIndex = Math.min(qi, newQueue.length - 1)
      } else if (qi >= 0) {
        const removedIdx = sq.findIndex((n) => n.trackId === trackId)
        if (removedIdx >= 0 && removedIdx < qi) {
          newIndex = qi - 1
        }
      }

      setSessionQueue(newQueue)
      setQueueIndex(newIndex)
      sessionQueueRef.current = newQueue
      queueIndexRef.current = newIndex

      if (isCurrent && newQueue.length > 0 && newIndex >= 0 && newIndex < newQueue.length) {
        await playTrackAndTrail(newQueue[newIndex])
      } else if (isCurrent) {
        try {
          await woodyPlayer.pause()
        } catch {
          /* ignore */
        }
      }
    },
    [playTrackAndTrail]
  )

  useEffect(() => {
    playProgressRef.current = { tid: null, maxPos: 0 }
    advancingRef.current = false
  }, [queueIndex])

  useEffect(() => {
    return subscribePlayerState(() => {
      void (async () => {
        try {
          const st = await woodyPlayer.getState()
          const tid = st?.track_window?.current_track?.id ?? null
          const pos = st?.position ?? 0
          const dur = st?.duration ?? 0
          const paused = st?.paused ?? true

          void syncPlayingId()

          const sq = sessionQueueRef.current
          let qi = queueIndexRef.current
          let cur = qi >= 0 && qi < sq.length ? sq[qi] : null

          if (
            !advancingRef.current &&
            qi >= 0 &&
            qi + 1 < sq.length &&
            tid != null &&
            cur != null &&
            tid !== cur.trackId &&
            tid === sq[qi + 1].trackId
          ) {
            qi += 1
            queueIndexRef.current = qi
            setQueueIndex(qi)
            cur = sq[qi]
            playProgressRef.current = { tid, maxPos: pos }
          }

          const onQueuedTrack = cur != null && tid === cur.trackId && dur > 0

          if (onQueuedTrack) {
            const hasNext = qi < sq.length - 1
            if (!paused) {
              if (playProgressRef.current.tid !== tid) {
                playProgressRef.current = { tid, maxPos: pos }
              } else {
                playProgressRef.current.maxPos = Math.max(playProgressRef.current.maxPos, pos)
              }
              if (hasNext && !advancingRef.current && dur > 2000 && pos >= dur - 750) {
                advancingRef.current = true
                try {
                  await handleQueueNextRef.current()
                } finally {
                  advancingRef.current = false
                  playProgressRef.current = { tid: null, maxPos: 0 }
                }
              }
            } else {
              const progressed =
                playProgressRef.current.tid === tid &&
                playProgressRef.current.maxPos > dur - 2500
              const nearStart = pos < 2000
              const tailPause =
                dur > 2000 && progressed && pos >= dur - 500 && pos <= dur + 80
              if (hasNext && !advancingRef.current && ((progressed && nearStart) || tailPause)) {
                advancingRef.current = true
                try {
                  await handleQueueNextRef.current()
                } finally {
                  advancingRef.current = false
                  playProgressRef.current = { tid: null, maxPos: 0 }
                }
              }
            }
          } else if (tid !== playProgressRef.current.tid) {
            playProgressRef.current = { tid, maxPos: pos }
          }
        } catch {
          void syncPlayingId()
        }
      })()
    })
  }, [syncPlayingId])

  const hasQueueNext = queueIndex >= 0 && queueIndex < sessionQueue.length - 1
  const hasQueuePrev = queueIndex > 0

  return {
    playerError,
    hasSpotify,
    currentTrackId,
    trailTrackIds,
    sessionQueue,
    queueIndex,
    playbackHydrated,
    hydratedSession,
    hasQueueNext,
    hasQueuePrev,
    selectAndPlay,
    next,
    prev,
    pick,
    reorder,
    clearQueue,
    queueAll,
    rejectTrackFromPlayback,
  }
}
