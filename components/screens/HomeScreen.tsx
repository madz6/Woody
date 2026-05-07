'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IntentInput, type IntentInputHandle } from '@/components/intent/IntentInput'
import { MiniPlayer } from '@/components/player/MiniPlayer'
import { SessionQueuePanel } from '@/components/player/SessionQueuePanel'
import { SavePointsBrowser } from '@/components/moments/SavePointsBrowser'
import { SavePointModal } from '@/components/save/SavePointModal'
import type { SteerDirection } from '@/components/map/WoodyMap'
import { latLngToVec3, useMapNodes } from '@/components/map/useMapNodes'
import type { MapNodeData } from '@/components/map/useMapNodes'
import {
  buildIntentKey,
  buildTasteProfile,
  createSessionShell,
  getIntentMemory,
  getKnownTrackIds,
  getMapNodes,
  getRecentIntent,
  getSavePoints,
  getSessionById,
  getSessions,
  getTasteCentroid,
  pruneSessions,
  recordTrackRejection,
  saveSession,
  setRecentIntent,
  updateSession,
  updateTasteCentroid,
  writeIntentMemoryFromSession,
} from '@/lib/memory'
import { logEvent } from '@/lib/metrics'
import { applySessionPalette, resetSessionPalette } from '@/lib/session-palette'
import { HaloButton } from '@/components/ui/HaloButton'
import { PortalSheet } from '@/components/ui/PortalSheet'
import { OnboardingScreen } from '@/components/screens/OnboardingScreen'
import type { EnrichedTrackData } from '@/lib/enrichment'
import type { ListeningContext, MapNode, PersonaLens, SavePoint, Session, Track, TrackSuggestion } from '@/lib/types'
import { usePlayback } from '@/hooks/usePlayback'

const WoodyMap = dynamic(
  () => import('@/components/map/WoodyMap').then((m) => ({ default: m.WoodyMap })),
  { ssr: false }
)

const STORAGE_FIRST_REVEAL = 'woody_first_reveal_shown'

const ROTATING_PROMPTS = [
  'Name a texture - velvet, chrome, rain on glass...',
  'Try a time and place - 2am highway, empty lobby...',
  'Stack adjectives until it feels like a room.',
  'What would the lighting be? Neon, candle, overcast...',
  'No wrong answers - half a mood is enough to start.',
  'Think tempo: crawl, stride, or stillness.',
  'Borrow from a film score that lives in your head.',
  'Whisper the vibe in one line - we map from there.',
]

function MapPlaceholder() {
  return <div className="fixed inset-0 z-0 touch-none bg-[#0F0F0D]" aria-hidden />
}

export function HomeScreen() {
  const [suggestions, setSuggestions] = useState<TrackSuggestion[]>([])
  const [lastIntent, setLastIntent] = useState('')
  const [lastLens, setLastLens] = useState<PersonaLens | null>(null)
  const [intentMode, setIntentMode] = useState<'layer' | 'redirect' | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [momentsOpen, setMomentsOpen] = useState(false)
  const [portalOpen, setPortalOpen] = useState(false)
  const [showRevealTooltip, setShowRevealTooltip] = useState(false)
  const [queuePanelExpanded, setQueuePanelExpanded] = useState(false)
  const [memoryNodes, setMemoryNodes] = useState<MapNode[]>([])
  const [mapMounted, setMapMounted] = useState(false)
  const [promptIdx, setPromptIdx] = useState(0)
  const [enrichmentMap, setEnrichmentMap] = useState<Record<string, EnrichedTrackData>>({})
  const [deepenedZoneIds, setDeepenedZoneIds] = useState<string[]>([])
  const [rejectingTrackIds, setRejectingTrackIds] = useState<Set<string>>(new Set())
  const [hiddenRejectedTrackIds, setHiddenRejectedTrackIds] = useState<Set<string>>(new Set())
  const [rejectedGhostPositions, setRejectedGhostPositions] = useState<{ x: number; y: number; z: number }[]>([])
  const [pendingContext, setPendingContext] = useState(false)
  const [sessionSummary, setSessionSummary] = useState<{
    tracksPlayed: number
    tracksRejected: number
    durationMinutes: number
  } | null>(null)
  const [currentListeningContext, setCurrentListeningContext] = useState<ListeningContext | null>(null)
  const [centroidSampleCount, setCentroidSampleCount] = useState(
    () => getTasteCentroid()?.sampleCount ?? 0
  )
  const pendingContextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const summaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intentRef = useRef<IntentInputHandle>(null)
  const mapNodesRef = useRef<MapNodeData[]>([])
  const rejectionTimeoutsRef = useRef<number[]>([])
  const currentSessionIdRef = useRef<string | null>(null)
  const isLowBandwidthRef = useRef(false)

  const playback = usePlayback({
    suggestions,
    mapNodesRef,
    memoryNodes,
    currentSessionId,
    lastIntent,
    lastLens,
    intentMode,
    loading,
    onPlaybackRecorded: useCallback(() => {
      setMemoryNodes(getMapNodes())
      // Update personal taste centroid from the last played track's audio attributes
      const sid = currentSessionIdRef.current
      if (sid) {
        const sessions = getSessions()
        const session = sessions.find((s) => s.id === sid)
        if (session && session.tracks.length > 0) {
          const lastTrack = session.tracks[session.tracks.length - 1]
          if (lastTrack.audioAttributes) {
            // Weight lower in low-bandwidth contexts (can't be bothered to change = weak signal)
            const alpha = isLowBandwidthRef.current ? 0.1 : 0.2
            updateTasteCentroid(lastTrack.audioAttributes, alpha)
            setCentroidSampleCount(getTasteCentroid()?.sampleCount ?? 0)
          }
        }
      }
    }, []),
  })

  const knownTrackIds = useMemo(
    () => getKnownTrackIds(),
    [memoryNodes, suggestions, playback.trailTrackIds]
  )

  // Recomputed whenever memory nodes change (session completions, rejections)
  const tasteProfile = useMemo(() => buildTasteProfile(), [memoryNodes])

  const mapNodes = useMapNodes(suggestions, memoryNodes, {
    knownTrackIds,
    playingTrackId: playback.currentTrackId,
    personaLens: lastLens,
  })

  const visibleMapNodes = useMemo(
    () => mapNodes.filter((node) => !hiddenRejectedTrackIds.has(node.trackId)),
    [hiddenRejectedTrackIds, mapNodes]
  )
  mapNodesRef.current = visibleMapNodes

  const anchorTrack = useMemo((): Track | null => {
    const id = playback.currentTrackId
    if (!id) return null
    const fromSuggestion = suggestions.find((s) => s.track.id === id)?.track
    if (fromSuggestion) return fromSuggestion
    return memoryNodes.find((m) => m.trackId === id)?.track ?? null
  }, [playback.currentTrackId, suggestions, memoryNodes])

  const savePointsList = useMemo(
    () => getSavePoints(),
    [momentsOpen, saveOpen, memoryNodes]
  )

  const hasActiveSession = currentSessionId != null
  const sessionExcludedTrackIds = useMemo(
    () => [...new Set([...rejectingTrackIds, ...hiddenRejectedTrackIds])],
    [hiddenRejectedTrackIds, rejectingTrackIds]
  )

  const territoryEchoCount = memoryNodes.length + savePointsList.length
  const moodTint =
    lastLens?.energy === 'high' ? 'amber' : lastLens?.energy === 'low' ? 'violet' : 'moss'
  const energyPhase =
    lastLens?.energy === 'high' ? 0.85 : lastLens?.energy === 'low' ? 0.35 : 0.55

  const isLowBandwidth =
    currentListeningContext === 'running' || currentListeningContext === 'working'
  // Keep refs in sync so stable callbacks (like onPlaybackRecorded) can read current values
  currentSessionIdRef.current = currentSessionId
  isLowBandwidthRef.current = isLowBandwidth

  const stateEmpty = suggestions.length === 0 && !loading
  const stateLoading = loading
  const stateActive = suggestions.length > 0
  const canQueueAll =
    suggestions.length > 0 &&
    visibleMapNodes.some((node) => suggestions.some((suggestion) => suggestion.track.id === node.trackId))

  const prevQueueLenRef = useRef(0)
  useEffect(() => {
    const len = playback.sessionQueue.length
    if (len > 0 && prevQueueLenRef.current === 0) {
      setQueuePanelExpanded(true)
    }
    if (len === 0) {
      setQueuePanelExpanded(false)
    }
    prevQueueLenRef.current = len
  }, [playback.sessionQueue.length])

  useEffect(() => {
    pruneSessions()
    setMapMounted(true)
    const recent = getRecentIntent()
    if (recent) setLastIntent(recent)
    setMemoryNodes(getMapNodes())
    return () => {
      for (const timeoutId of rejectionTimeoutsRef.current) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  useEffect(() => {
    const snap = playback.hydratedSession
    if (!snap) return
    if (snap.suggestions.length > 0) {
      setSuggestions(snap.suggestions)
    }
    if (snap.lastIntent.trim()) {
      setLastIntent(snap.lastIntent)
      setRecentIntent(snap.lastIntent)
    }
    if (snap.lastLens) setLastLens(snap.lastLens)
    setIntentMode(snap.intentMode)
    if (snap.currentSessionId) setCurrentSessionId(snap.currentSessionId)
    setDeepenedZoneIds([])
    setRejectingTrackIds(new Set())
    setHiddenRejectedTrackIds(new Set())
  }, [playback.hydratedSession])

  useEffect(() => {
    if (!error) return
    const t = window.setTimeout(() => setError(null), 5000)
    return () => window.clearTimeout(t)
  }, [error])

  // Apply session palette to <html> data-palette attribute whenever the lens changes
  useEffect(() => {
    if (lastLens) {
      applySessionPalette(lastLens)
    } else {
      resetSessionPalette()
    }
  }, [lastLens])

  // F4 Moment 3 — one-time "tap to play" tooltip after first suggestions load
  useEffect(() => {
    if (suggestions.length === 0) return
    if (localStorage.getItem(STORAGE_FIRST_REVEAL)) return
    localStorage.setItem(STORAGE_FIRST_REVEAL, '1')
    setShowRevealTooltip(true)
    const t = window.setTimeout(() => setShowRevealTooltip(false), 6000)
    return () => window.clearTimeout(t)
  }, [suggestions.length])

  useEffect(() => {
    if (!stateEmpty) return
    const id = window.setInterval(
      () => setPromptIdx((i) => (i + 1) % ROTATING_PROMPTS.length),
      8000
    )
    return () => window.clearInterval(id)
  }, [stateEmpty])

  useEffect(() => {
    if (suggestions.length === 0) {
      setEnrichmentMap({})
      return
    }
    setEnrichmentMap({})
    let cancelled = false
    const staggerMs = 1100

    const run = async () => {
      for (const s of suggestions) {
        if (cancelled) return
        try {
          const r = await fetch('/api/enrich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trackId: s.track.id,
              trackName: s.track.name,
              artistName: s.track.artist,
            }),
          })
          const data = (await r.json()) as EnrichedTrackData & { trackId?: string }
          if (!cancelled) {
            setEnrichmentMap((prev) => ({ ...prev, [s.track.id]: { ...data } }))
          }
        } catch {
          if (!cancelled) {
            setEnrichmentMap((prev) => ({ ...prev, [s.track.id]: {} }))
          }
        }
        if (!cancelled) {
          await new Promise((r) => setTimeout(r, staggerMs))
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [suggestions])

  const commitCurrentSessionToIntentMemory = useCallback(() => {
    if (!currentSessionId) return
    writeIntentMemoryFromSession(currentSessionId)
  }, [currentSessionId])

  const resolveTrackForNode = useCallback(
    (node: MapNodeData): Track | null => {
      if (node.track) return node.track
      return (
        suggestions.find((suggestion) => suggestion.track.id === node.trackId)?.track ??
        memoryNodes.find((memoryNode) => memoryNode.trackId === node.trackId)?.track ??
        null
      )
    },
    [memoryNodes, suggestions]
  )

  const handleRejectTrack = useCallback(
    async (node: MapNodeData, source: 'map' | 'player') => {
      if (!currentSessionId) return
      if (rejectingTrackIds.has(node.trackId) || hiddenRejectedTrackIds.has(node.trackId)) return

      const track = resolveTrackForNode(node)
      if (!track) return

      setRejectingTrackIds((prev) => new Set(prev).add(node.trackId))
      recordTrackRejection(currentSessionId, {
        track,
        source,
        context: node.kind,
        rejectedAt: new Date(),
      })

      await playback.rejectTrackFromPlayback(node.trackId)
      logEvent('track_rejected', {
        trackId: node.trackId,
        sessionId: currentSessionId,
        kind: node.kind,
        source,
      })

      const timeoutId = window.setTimeout(() => {
        // Capture node position for ghost rendering before hiding
        const liveNode = mapNodesRef.current.find((n) => n.trackId === node.trackId)
        if (liveNode) {
          const [gx, gy, gz] = latLngToVec3(liveNode.lat, liveNode.lng, 1.012)
          setRejectedGhostPositions((prev) => [...prev, { x: gx, y: gy, z: gz }])
        }
        setRejectingTrackIds((prev) => {
          const next = new Set(prev)
          next.delete(node.trackId)
          return next
        })
        setHiddenRejectedTrackIds((prev) => new Set([...prev, node.trackId]))
        setSuggestions((prev) => prev.filter((suggestion) => suggestion.track.id !== node.trackId))
      }, 800)
      rejectionTimeoutsRef.current.push(timeoutId)
    },
    [
      currentSessionId,
      hiddenRejectedTrackIds,
      playback,
      rejectingTrackIds,
      resolveTrackForNode,
    ]
  )

  const reopenSessionTerritory = useCallback(async (session: Session) => {
    setLoading(true)
    setError(null)
    try {
      commitCurrentSessionToIntentMemory()
      logEvent('moment_reopen_started', { sessionId: session.id })
      const tasteProfile = buildTasteProfile()
      const res = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: session.intentText,
          tasteProfile: tasteProfile.sessionCount > 0 ? tasteProfile : undefined,
          intentMemoryEntries: getIntentMemory().entries,
          tasteCentroid: getTasteCentroid(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'nothing in range - try shifting the vibe')
        return
      }
      setSuggestions(data.suggestions ?? [])
      if (data.mode) setIntentMode(data.mode as 'layer' | 'redirect')
      if (data.personaLens) setLastLens(data.personaLens as PersonaLens)
      else setLastLens(session.personaLens)
      setLastIntent(session.intentText)
      setRecentIntent(session.intentText)
      playback.clearQueue()
      setCurrentSessionId(session.id)
      setMemoryNodes(getMapNodes())
      setDeepenedZoneIds([])
      setRejectingTrackIds(new Set())
      setHiddenRejectedTrackIds(new Set())
      logEvent('moment_reopen_succeeded', {
        sessionId: session.id,
        suggestionCount: (data.suggestions ?? []).length,
      })
    } catch (err) {
      console.error(err)
      setError('could not reach the server')
    } finally {
      setLoading(false)
    }
  }, [commitCurrentSessionToIntentMemory, playback])

  const handleRestoreSavePoint = useCallback(
    async (sp: SavePoint) => {
      const session = getSessionById(sp.sessionId)
      if (!session) {
        setError("That moment's session is no longer in this browser.")
        return
      }
      await reopenSessionTerritory(session)
      setMomentsOpen(false)
      setPortalOpen(false)
    },
    [reopenSessionTerritory]
  )

  const handleIntent = useCallback(async (intent: string) => {
    // Session summary before clearing -- Phase 16
    if (currentSessionId) {
      const prevSession = getSessionById(currentSessionId)
      if (prevSession && prevSession.tracks.length > 0) {
        const played = prevSession.tracks.filter((t) => t.signal !== 'rejected').length
        const rejected = prevSession.rejectedTracks?.length ?? 0
        const mins = Math.round((Date.now() - prevSession.createdAt.getTime()) / 60000)
        setSessionSummary({ tracksPlayed: played, tracksRejected: rejected, durationMinutes: mins })
        if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current)
        summaryTimerRef.current = setTimeout(() => setSessionSummary(null), 2500)
      }
    }

    setLoading(true)
    setError(null)
    logEvent('intent_submitted', { intentLen: intent.length })
    const previousIntent = lastIntent.trim() || undefined
    const previousLens = lastLens ?? undefined
    commitCurrentSessionToIntentMemory()
    setLastIntent(intent)
    setRecentIntent(intent)
    setCurrentListeningContext(null)
    try {
      const res = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          tasteProfile: tasteProfile.sessionCount > 0 ? tasteProfile : undefined,
          previousIntent,
          previousLens,
          excludeTrackIds: sessionExcludedTrackIds,
          intentMemoryEntries: getIntentMemory().entries,
          firstSession: tasteProfile.sessionCount === 0,
          tasteCentroid: getTasteCentroid(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'nothing in range - try shifting the vibe')
        return
      }
      logEvent('intent_succeeded', { suggestionCount: (data.suggestions ?? []).length })
      if (typeof data.intent_latency_ms === 'number') {
        logEvent('intent_latency_ms', { ms: data.intent_latency_ms })
      }
      setSuggestions(data.suggestions ?? [])
      if (data.mode) setIntentMode(data.mode as 'layer' | 'redirect')
      if (data.personaLens) setLastLens(data.personaLens as PersonaLens)
      playback.clearQueue()
      setDeepenedZoneIds([])
      setRejectingTrackIds(new Set())
      setHiddenRejectedTrackIds(new Set())
      setRejectedGhostPositions([])

      const sid = crypto.randomUUID()
      setCurrentSessionId(sid)
      const shell = createSessionShell({
        id: sid,
        intentText: intent,
        personaLens: (data.personaLens as PersonaLens) ?? {
          energy: 'medium',
          mood: [],
          exclusions: [],
          tempo: 'medium',
          texture: [],
          rawIntent: intent,
        },
        suggestions: data.suggestions ?? [],
      })
      saveSession(shell)
      setMemoryNodes(getMapNodes())

      // Show context intake chips for 3s then auto-dismiss
      if (pendingContextTimerRef.current) clearTimeout(pendingContextTimerRef.current)
      setPendingContext(true)
      pendingContextTimerRef.current = setTimeout(() => {
        setPendingContext(false)
      }, 3000)
    } catch (err) {
      console.error(err)
      setError('could not reach the server')
    } finally {
      setLoading(false)
    }
  }, [
    commitCurrentSessionToIntentMemory,
    lastIntent,
    lastLens,
    playback,
    sessionExcludedTrackIds,
  ])

  const handleSteer = useCallback(
    async (dir: SteerDirection) => {
      if (!lastIntent.trim()) return
      logEvent('steer')
      setLoading(true)
      setError(null)
      try {
        const tp = buildTasteProfile()
        const res = await fetch('/api/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intent: lastIntent,
            tasteProfile: tp.sessionCount > 0 ? tp : undefined,
            previousLens: lastLens ?? undefined,
            excludeTrackIds: sessionExcludedTrackIds,
            intentMemoryEntries: getIntentMemory().entries,
            tasteCentroid: getTasteCentroid(),
            steer: { azimuth: dir.azimuth, polar: dir.polar },
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'nothing in range - try shifting the vibe')
          return
        }
        if (typeof data.intent_latency_ms === 'number') {
          logEvent('intent_latency_ms', { ms: data.intent_latency_ms, steer: true })
        }
        setSuggestions(data.suggestions ?? [])
        if (data.mode) setIntentMode(data.mode as 'layer' | 'redirect')
        if (data.personaLens) setLastLens(data.personaLens as PersonaLens)
        playback.clearQueue()
        setDeepenedZoneIds([])
        setRejectingTrackIds(new Set())
        setHiddenRejectedTrackIds(new Set())
        setRejectedGhostPositions([])

        const lens = (data.personaLens as PersonaLens) ?? lastLens
        const sid = currentSessionId
        if (sid && lens) {
          updateSession(sid, { personaLens: lens })
        }
        if (!sid) {
          const newId = crypto.randomUUID()
          setCurrentSessionId(newId)
          const shell = createSessionShell({
            id: newId,
            intentText: lastIntent,
            personaLens:
              lens ??
              ({
                energy: 'medium',
                mood: [],
                exclusions: [],
                tempo: 'medium',
                texture: [],
                rawIntent: lastIntent,
              } satisfies PersonaLens),
            suggestions: data.suggestions ?? [],
          })
          saveSession(shell)
        }
        setMemoryNodes(getMapNodes())
        logEvent('steer_succeeded', { suggestionCount: (data.suggestions ?? []).length })
      } catch (err) {
        console.error(err)
        setError('could not reach the server')
      } finally {
        setLoading(false)
      }
    },
    [
      currentSessionId,
      lastIntent,
      lastLens,
      playback,
      sessionExcludedTrackIds,
    ]
  )

  const handleContextSelect = useCallback(
    (ctx: ListeningContext | null) => {
      if (pendingContextTimerRef.current) clearTimeout(pendingContextTimerRef.current)
      setPendingContext(false)
      if (ctx) {
        setCurrentListeningContext(ctx)
        if (currentSessionId) {
          updateSession(currentSessionId, { listeningContext: ctx })
        }
        // Low bandwidth mode: auto-queue all suggestions so user doesn't have to interact
        if (ctx === 'running' || ctx === 'working') {
          void playback.queueAll()
        }
      }
    },
    [currentSessionId, playback]
  )

  const handleZoneDeepen = useCallback(
    async (zoneId: string) => {
      if (!lastIntent.trim()) return
      logEvent('zone_deepen', { zoneId })
      setLoading(true)
      setError(null)
      try {
        const tasteProfile = buildTasteProfile()
        const res = await fetch('/api/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intent: lastIntent,
            tasteProfile: tasteProfile.sessionCount > 0 ? tasteProfile : undefined,
            previousLens: lastLens ?? undefined,
            zoneId,
            excludeTrackIds: sessionExcludedTrackIds,
            intentMemoryEntries: getIntentMemory().entries,
            tasteCentroid: getTasteCentroid(),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'nothing in range - try shifting the vibe')
          return
        }
        const newSuggestions: TrackSuggestion[] = data.suggestions ?? []
        const existingIds = new Set(suggestions.map((s) => s.track.id))
        const fresh = newSuggestions.filter((s) => !existingIds.has(s.track.id))
        if (fresh.length > 0) {
          setSuggestions((prev) => [...prev, ...fresh])
          setDeepenedZoneIds((prev) => (prev.includes(zoneId) ? prev : [...prev, zoneId]))
          logEvent('zone_deepen_succeeded', { zoneId, freshCount: fresh.length })
        } else {
          setError('already deep in this zone - try steering instead')
        }
      } catch (err) {
        console.error(err)
        setError('could not reach the server')
      } finally {
        setLoading(false)
      }
    },
    [lastIntent, lastLens, sessionExcludedTrackIds, suggestions]
  )

  const handleNodeSelect = useCallback(
    async (node: MapNodeData) => {
      await playback.selectAndPlay(node)
    },
    [playback]
  )

  function clearSessionIntent() {
    commitCurrentSessionToIntentMemory()
    setSuggestions([])
    setLastIntent('')
    setLastLens(null)
    setIntentMode(null)
    setCurrentSessionId(null)
    setRecentIntent('')
    playback.clearQueue()
    setQueuePanelExpanded(false)
    setEnrichmentMap({})
    setDeepenedZoneIds([])
    setRejectingTrackIds(new Set())
    setHiddenRejectedTrackIds(new Set())
    setRejectedGhostPositions([])
    intentRef.current?.clear()
    setError(null)
  }

  const intentShellClass = stateEmpty
    ? 'fixed left-1/2 top-1/2 z-30 w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 px-6 transition-opacity duration-300'
    : 'fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.05] bg-bark/60 backdrop-blur-xl pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] px-6 transition-opacity duration-300'

  return (
    <>
      {mapMounted ? (
        <WoodyMap
          nodes={visibleMapNodes}
          trailTrackIds={playback.trailTrackIds}
          onNodeSelect={(n) => void handleNodeSelect(n)}
          onNodeRejectRequest={
            hasActiveSession && !isLowBandwidth ? (node) => void handleRejectTrack(node, 'map') : undefined
          }
          onSteer={handleSteer}
          hoveredId={hoveredId}
          onHoverId={setHoveredId}
          energyPhase={energyPhase}
          moodTint={moodTint}
          personaLens={lastLens}
          enrichmentMap={enrichmentMap}
          rejectingTrackIds={rejectingTrackIds}
          deepenedZoneIds={deepenedZoneIds}
          onZoneSelect={suggestions.length > 0 ? (id) => void handleZoneDeepen(id) : undefined}
          centroidSampleCount={centroidSampleCount}
          tasteAvgEnergy={
            tasteProfile.sessionCount > 0
              ? tasteProfile.avgEnergy === 'high' ? 0.75
                : tasteProfile.avgEnergy === 'low' ? 0.25
                : 0.5
              : undefined
          }
          listeningContext={currentListeningContext ?? undefined}
          rejectedGhostPositions={rejectedGhostPositions}
        />
      ) : (
        <MapPlaceholder />
      )}

      {error && (
        <div
          className="fixed left-1/2 top-4 z-[45] max-w-[min(90vw,24rem)] -translate-x-1/2 rounded-full border border-white/10 bg-bark/95 px-4 py-2.5 text-center text-sm text-text-hi shadow-lg backdrop-blur-md pointer-events-auto font-sans"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Halo — always-visible portal glyph, top-right */}
      {playback.hasSpotify !== null && (
        <HaloButton onClick={() => setPortalOpen(true)} />
      )}

      {/* Portal Sheet — secondary navigation surface */}
      <PortalSheet
        open={portalOpen}
        onClose={() => setPortalOpen(false)}
        hasSpotify={playback.hasSpotify}
        listeningContext={currentListeningContext}
        onContextChange={(ctx) => {
          handleContextSelect(ctx)
          setPortalOpen(false)
        }}
        savePoints={savePointsList}
        onRestoreSavePoint={(sp) => void handleRestoreSavePoint(sp)}
        acousticEnabled={false}
      />

      {/* Onboarding overlay — shown when Spotify explicitly not connected and no sessions exist */}
      {playback.hasSpotify === false && memoryNodes.length === 0 && savePointsList.length === 0 && (
        <OnboardingScreen />
      )}

      {/* F4 Moment 3 — one-time reveal tooltip after first suggestions */}
      <AnimatePresence>
        {showRevealTooltip && (
          <motion.div
            key="reveal-tooltip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
            className="fixed inset-0 z-[25] flex items-center justify-center pointer-events-none"
          >
            <p className="text-sm text-text-mid font-serif italic text-center px-8 select-none">
              tap to play — hold to go deeper
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dev-only OAuth diagnostics link */}
      {process.env.NODE_ENV === 'development' && playback.hasSpotify !== true && (
        <a
          href="/debug/spotify"
          className="fixed bottom-24 right-4 z-halo text-[10px] text-text-lo font-sans underline decoration-white/20 hover:text-text-mid pointer-events-auto"
        >
          Diagnose OAuth (dev)
        </a>
      )}

      {stateActive && lastIntent.trim() && (
        <div className="fixed top-4 left-4 z-40 pointer-events-auto max-w-[min(calc(100vw-2rem),20rem)] transition-opacity duration-300">
          <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-bark/90 backdrop-blur-md px-3 py-2">
            <button
              type="button"
              onClick={() => intentRef.current?.focus()}
              className="min-w-0 flex-1 flex items-center gap-0 text-left text-xs text-text-hi font-sans"
            >
              <span className="min-w-0 truncate">{lastIntent}</span>
              {intentMode && (
                <span className="text-[9px] text-text-lo font-sans ml-1 uppercase tracking-widest flex-shrink-0">
                  {intentMode === 'layer' ? '+ layer' : intentMode === 'redirect' ? '->' : ''}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={clearSessionIntent}
              className="flex-shrink-0 rounded-lg p-1.5 text-text-mid hover:bg-white/[0.06] hover:text-text-hi transition-colors"
              aria-label="Clear intent and map"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <main className="relative z-20 min-h-screen pointer-events-none">
        {stateLoading && (
          <div className="fixed inset-0 z-[22] flex items-center justify-center pointer-events-none transition-opacity duration-300">
            <p className="font-serif italic text-text-mid text-base text-center px-8">
              finding your territory...
            </p>
          </div>
        )}

        <div className={`${intentShellClass} pointer-events-auto`}>
          {/* Territory / uncertainty signal */}
          {stateEmpty && tasteProfile.sessionCount === 0 && (
            <p className="text-xs text-text-lo font-serif italic text-center mb-3 select-none pointer-events-none">
              Still finding your territory -- everything you play teaches me
            </p>
          )}
          {stateEmpty && tasteProfile.sessionCount >= 1 && tasteProfile.sessionCount < 3 && (
            <p className="text-xs text-text-lo font-serif italic text-center mb-3 select-none pointer-events-none">
              Beginning to learn your territory...
            </p>
          )}
          {stateEmpty && tasteProfile.sessionCount >= 3 && (
            <p className="text-xs text-text-lo font-serif italic text-center mb-3 select-none pointer-events-none">
              Your territory:{' '}
              {tasteProfile.dominantTones.slice(0, 2).join(' . ')}
              {' . '}
              {tasteProfile.avgEnergy === 'high'
                ? 'high energy'
                : tasteProfile.avgEnergy === 'low'
                  ? 'low energy'
                  : 'mid energy'}
            </p>
          )}

          <IntentInput
            ref={intentRef}
            onSubmit={(i) => void handleIntent(i)}
            loading={loading}
            className={stateEmpty ? '' : 'max-w-lg mx-auto'}
            placeholder={
              tasteProfile.sessionCount === 0
                ? 'A track or vibe that sounds like you right now'
                : hasActiveSession && isLowBandwidth
                  ? 'Keep it going...'
                  : undefined
            }
          />

          <AnimatePresence>
            {pendingContext && (
              <motion.div
                key="context-chips"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="mt-3 flex flex-wrap justify-center gap-2 max-w-lg mx-auto"
              >
                {(
                  [
                    { id: 'running', label: 'Running' },
                    { id: 'working', label: 'Working' },
                    { id: 'exploring', label: 'Exploring' },
                    { id: 'just_listening', label: 'Just listening' },
                  ] as { id: ListeningContext; label: string }[]
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleContextSelect(id)}
                    className="rounded-full border border-white/15 bg-bark/80 px-3 py-1 text-[11px] text-text-mid hover:text-text-hi hover:border-white/30 transition-colors backdrop-blur-sm"
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {stateEmpty && (
            <p
              key={promptIdx}
              className="mt-4 text-center text-sm text-text-mid font-serif italic leading-relaxed transition-opacity duration-300 max-w-md mx-auto"
            >
              {ROTATING_PROMPTS[promptIdx]}
            </p>
          )}
          {stateEmpty && playback.hasSpotify === true && (
            <div className="mt-8 max-w-md mx-auto rounded-2xl border border-white/[0.06] bg-bark/40 px-4 py-3 text-left">
              <p className="text-[11px] uppercase tracking-widest text-text-lo mb-2">Your territory grows</p>
              <p className="text-xs text-text-mid leading-relaxed font-sans">
                Each intent leaves tracks on the globe; playback etches them into memory. Save a
                discovery from the player — it becomes a named moment you can reopen from the{' '}
                <button
                  type="button"
                  onClick={() => setPortalOpen(true)}
                  className="text-text-hi underline decoration-amber/40 underline-offset-2 hover:decoration-amber/70"
                >
                  territory panel
                </button>
                .
              </p>
              {territoryEchoCount > 0 ? (
                <p className="mt-2 text-[11px] text-text-lo font-sans">
                  {territoryEchoCount} track{territoryEchoCount !== 1 ? 's' : ''} in your territory.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <AnimatePresence>
          {sessionSummary && (
            <motion.div
              key="session-summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-[5.5rem] left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-white/[0.08] bg-bark/95 px-5 py-3 text-center shadow-lg backdrop-blur-md pointer-events-none"
            >
              <p className="text-xs text-text-hi font-sans">
                {sessionSummary.tracksPlayed} played
                {sessionSummary.tracksRejected > 0 ? ` . ${sessionSummary.tracksRejected} skipped` : ''}
                {sessionSummary.durationMinutes > 0 ? ` . ${sessionSummary.durationMinutes}m` : ''}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {playback.hasSpotify === true && (
          <MiniPlayer
            onSaveClick={() => setSaveOpen(true)}
            onNext={playback.hasQueueNext ? playback.next : undefined}
            onPrev={playback.hasQueuePrev ? playback.prev : undefined}
            hasNext={playback.hasQueueNext}
            hasPrev={playback.hasQueuePrev}
            onReject={(trackId) => {
              const node = mapNodesRef.current.find((n) => n.trackId === trackId)
              if (node) void handleRejectTrack(node, 'player')
            }}
          />
        )}

        <SessionQueuePanel
          open={queuePanelExpanded && playback.sessionQueue.length > 0}
          onToggle={() => setQueuePanelExpanded((v) => !v)}
          queue={playback.sessionQueue}
          currentIndex={playback.queueIndex}
          onPick={(index) => void playback.pick(index)}
          onMoveUp={(index) => {
            if (index <= 0) return
            playback.reorder(index, index - 1)
          }}
          onMoveDown={(index) => {
            if (index >= playback.sessionQueue.length - 1) return
            playback.reorder(index, index + 1)
          }}
          onClear={() => playback.clearQueue()}
          onQueueAll={() => void playback.queueAll()}
          canQueueAll={canQueueAll}
          enrichmentByTrackId={enrichmentMap}
          onReorder={(from, to) => playback.reorder(from, to)}
        />

        <SavePointModal
          open={saveOpen}
          onClose={() => setSaveOpen(false)}
          sessionId={currentSessionId ?? ''}
          anchorTrack={anchorTrack}
          onSaved={() => {
            setMemoryNodes(getMapNodes())
            setSaveOpen(false)
          }}
        />

        <SavePointsBrowser
          open={momentsOpen}
          onClose={() => setMomentsOpen(false)}
          savePoints={savePointsList}
          onRestore={(sp) => void handleRestoreSavePoint(sp)}
        />
      </main>
    </>
  )
}
