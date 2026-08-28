'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  initialPlaybackObserver,
  reducePlaybackObservation,
  type PlaybackObservation,
  type PlaybackObserverState,
} from '@/lib/playbackObserver'
import {
  clearJourneySessions,
  exportJourneySessions,
  loadJourneySessions,
  nextPairedRunSlot,
  saveJourneySession,
} from '@/lib/journeyStorage'
import type {
  AspectCaptureV1,
  AspectLabel,
  JourneyAdjustmentKind,
  JourneyAdjustmentScope,
  JourneyDecisionV2,
  JourneyPlanV2,
  JourneyResearchReviewV1,
  JourneySessionMode,
  JourneySessionV2,
  Track,
} from '@/lib/types'

type Stage = 'setup' | 'active' | 'review'
type Device = { id: string; is_active: boolean; name: string; type: string }
type PlayerState = {
  active: boolean
  isPlaying?: boolean
  progressMs?: number
  track?: Track | null
  device?: Device | null
  observedAt?: string
}
type DecisionResponse = Omit<JourneyDecisionV2, 'basis'>
type SystemState = 'observing' | 'selecting' | 'queued' | 'paused' | 'error'

class ClientApiError extends Error {
  constructor(message: string, readonly retryAfterSeconds: number | null = null) {
    super(message)
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  const body = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    const retryAfter = Number(response.headers.get('retry-after'))
    throw new ClientApiError(
      typeof body.error === 'string' ? body.error : `request_${response.status}`,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
    )
  }
  return body as T
}

function post<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function friendlyError(code: string): string {
  const errors: Record<string, string> = {
    not_connected: 'Connect Spotify to continue.',
    no_active_device: 'Open Spotify, play something briefly, then return and retry.',
    unsupported_track: 'Woody cannot make a reliable transition from this track yet. Choose a supported starting track.',
    journey_selection_failed: 'Woody could not choose the next track. The session has paused instead of guessing.',
    spotify_rate_limited: 'Spotify asked Woody to slow down. It will retry automatically.',
    queue_failed: 'Spotify did not confirm the queue change. Woody paused to avoid adding the same track twice.',
    spotify_start_not_confirmed: 'Spotify did not switch to the supported starting track. Nothing was recorded; retry after it begins playing.',
    storage_failed: 'This session could not be saved in browser storage. Export existing research data before continuing.',
  }
  return errors[code] ?? 'Something interrupted the session. Woody paused rather than guessing.'
}

function spotifyUrl(track: Track): string {
  return track.externalUrl ?? `https://open.spotify.com/track/${track.id}`
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function downloadResearchExport() {
  const blob = new Blob([exportJourneySessions()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `woody-research-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function JourneyApp({ researchMode = false }: { researchMode?: boolean }) {
  const [stage, setStage] = useState<Stage>('setup')
  const [connected, setConnected] = useState<boolean | null>(null)
  const [direction, setDirection] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(20)
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [currentSupported, setCurrentSupported] = useState<boolean | null>(null)
  const [selectedStarter, setSelectedStarter] = useState<Track | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [session, setSession] = useState<JourneySessionV2 | null>(null)
  const [status, setStatus] = useState('Checking Spotify…')
  const [systemState, setSystemState] = useState<SystemState>('observing')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const [nextCommitted, setNextCommitted] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustText, setAdjustText] = useState('')
  const [adjustScope, setAdjustScope] = useState<JourneyAdjustmentScope>('next_track')
  const [quickAnswer, setQuickAnswer] = useState<'yes' | 'no' | 'not_sure' | null>(null)
  const [quickNote, setQuickNote] = useState('')
  const [researchTiming, setResearchTiming] = useState(3)
  const [researchEffort, setResearchEffort] = useState(3)
  const [researchNotes, setResearchNotes] = useState('')
  const [researchPreference, setResearchPreference] = useState<JourneyResearchReviewV1['overallPreference']>('no_preference')

  const sessionRef = useRef<JourneySessionV2 | null>(null)
  const observerRef = useRef<PlaybackObserverState>(initialPlaybackObserver('adaptive'))
  const draftRef = useRef<JourneyDecisionV2 | null>(null)
  const pendingRef = useRef<JourneyDecisionV2 | null>(null)
  const generationRef = useRef(0)
  const selectingRef = useRef(false)
  const committingRef = useRef(false)
  const pollingRef = useRef(false)
  const pollBlockedUntilRef = useRef(0)
  const nextDirectionRef = useRef<string | null>(null)
  const nextAdjustmentRef = useRef<JourneyAdjustmentKind | null>(null)
  const wakeLockRef = useRef<{ release(): Promise<void> } | null>(null)
  const adjustDialogRef = useRef<HTMLDivElement | null>(null)

  const pairedSlot = nextPairedRunSlot(loadJourneySessions())
  const mode: JourneySessionMode = researchMode ? pairedSlot.mode : 'adaptive'
  const startTrack = selectedStarter ?? player?.track ?? null
  const startSource = selectedStarter ? 'supported_track_search' as const : 'current_spotify_track' as const

  const commitSession = useCallback((next: JourneySessionV2) => {
    sessionRef.current = next
    setSession(next)
    if (!saveJourneySession(next)) {
      setError(friendlyError('storage_failed'))
      setSystemState('error')
    }
  }, [])

  const checkTrackSupport = useCallback(async (track: Track | null | undefined) => {
    if (!track) {
      setCurrentSupported(null)
      return false
    }
    try {
      const result = await post<{ embedded: boolean }>('/api/journey/anchor', { track })
      setCurrentSupported(result.embedded)
      return result.embedded
    } catch {
      setCurrentSupported(false)
      return false
    }
  }, [])

  const refreshSetup = useCallback(async () => {
    try {
      await api('/api/auth/token')
      setConnected(true)
      const state = await api<PlayerState>('/api/player/state')
      setPlayer(state)
      await checkTrackSupport(state.track)
      setStatus(state.track ? 'Spotify is ready.' : 'Start a track in Spotify, then refresh.')
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : 'not_connected'
      if (code === 'not_connected') setConnected(false)
      else setError(friendlyError(code))
    }
  }, [checkTrackSupport])

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshSetup(), 0)
    return () => window.clearTimeout(timer)
  }, [refreshSetup])

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as Navigator & { wakeLock: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock.request('screen')
      }
    } catch {
      const current = sessionRef.current
      if (current) commitSession({
        ...current,
        events: [...current.events, {
          version: 1,
          timestamp: new Date().toISOString(),
          eventType: 'wake_lock_lost',
          initiatingSource: 'system',
        }],
      })
    }
  }, [commitSession])

  const searchSupported = async () => {
    if (searchQuery.trim().length < 2) return
    setBusy(true)
    setError('')
    try {
      const result = await api<{ tracks: Track[] }>(`/api/journey/corpus?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchResults(result.tracks)
    } catch (caught) {
      setError(friendlyError(caught instanceof Error ? caught.message : 'supported_track_search_failed'))
    } finally {
      setBusy(false)
    }
  }

  const startJourney = async () => {
    if (!startTrack || direction.trim().length < 3) return
    if (mode === 'adaptive' && !selectedStarter && currentSupported !== true) return
    setBusy(true)
    setError('')
    try {
      const devices = await api<{ devices: Device[] }>('/api/player/devices')
      const activeDevice = devices.devices.find((device) => device.is_active)
      if (!activeDevice) throw new Error('no_active_device')
      if (selectedStarter && player?.track?.id !== selectedStarter.id) {
        await post('/api/player/play', { uri: selectedStarter.spotifyUri ?? `spotify:track:${selectedStarter.id}`, deviceId: activeDevice.id })
        let confirmed: PlayerState | null = null
        for (let attempt = 0; attempt < 8; attempt += 1) {
          await delay(attempt === 0 ? 250 : 750)
          const observed = await api<PlayerState>('/api/player/state')
          if (observed.track?.id === selectedStarter.id) {
            confirmed = observed
            break
          }
        }
        if (!confirmed) throw new Error('spotify_start_not_confirmed')
        setPlayer(confirmed)
      }
      const plan = await post<JourneyPlanV2>('/api/journey/plan', {
        mode,
        direction: direction.trim(),
        durationMinutes,
        startTrack,
        startSource,
      })
      const now = new Date().toISOString()
      const next: JourneySessionV2 = {
        version: 2,
        plan,
        status: 'active',
        direction: plan.direction,
        directionRevision: 0,
        decisions: [],
        events: [{ version: 1, timestamp: now, eventType: 'session_started', initiatingSource: 'user' }],
        aspectCaptures: [],
        playedTrackIds: [],
        sessionExcludedTrackIds: [],
        skipPenalties: [],
        playbackElapsedMs: 0,
        startedAt: now,
      }
      observerRef.current = initialPlaybackObserver(mode)
      draftRef.current = null
      pendingRef.current = null
      setDraftReady(false)
      setNextCommitted(false)
      nextDirectionRef.current = null
      nextAdjustmentRef.current = null
      generationRef.current += 1
      commitSession(next)
      setSession(next)
      setStage('active')
      setSystemState('observing')
      setStatus(mode === 'adaptive' ? 'Observing the current track.' : 'Research control: observing only.')
      await requestWakeLock()
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : 'start_failed'
      setError(friendlyError(code))
      setSystemState('error')
    } finally {
      setBusy(false)
    }
  }

  const draftNext = useCallback(async (
    currentTrack: Track,
    adjustment: JourneyAdjustmentKind | null = nextAdjustmentRef.current,
    directionOverride: string | null = nextDirectionRef.current,
  ) => {
    const current = sessionRef.current
    if (!current || current.status !== 'active' || current.plan.mode !== 'adaptive') return
    if (selectingRef.current || pendingRef.current || draftRef.current) return
    selectingRef.current = true
    const generation = generationRef.current
    const effectiveDirection = directionOverride?.trim() || current.direction
    const effectiveRevision = current.directionRevision + (directionOverride ? 1 : 0)
    setSystemState('selecting')
    setStatus('Choosing one next track…')
    try {
      const selected = await post<DecisionResponse>('/api/journey/next', {
        sessionId: current.plan.sessionId,
        decisionIndex: current.decisions.length,
        currentTrackId: currentTrack.id,
        currentTrackArtist: currentTrack.artist,
        startTrackId: current.plan.startTrack.id,
        direction: effectiveDirection,
        adjustment: adjustment ?? undefined,
        excludeIds: [...new Set([...current.playedTrackIds, ...current.sessionExcludedTrackIds])],
        skipPenalties: current.skipPenalties,
      })
      if (generation !== generationRef.current) return
      draftRef.current = {
        ...selected,
        basis: {
          trackId: currentTrack.id,
          directionRevision: effectiveRevision,
          playbackPositionMs: observerRef.current.previous?.progressMs ?? 0,
        },
      }
      setDraftReady(true)
      setSystemState('observing')
      setStatus('Next track prepared. It has not been queued yet.')
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : 'journey_selection_failed'
      setError(friendlyError(code))
      setSystemState('error')
      const latest = sessionRef.current
      if (latest) commitSession({
        ...latest,
        status: 'paused_override',
        events: [...latest.events, { version: 1, timestamp: new Date().toISOString(), eventType: 'network_error', initiatingSource: 'system' }],
      })
    } finally {
      selectingRef.current = false
    }
  }, [commitSession])

  const commitDraft = useCallback(async () => {
    const current = sessionRef.current
    const decision = draftRef.current
    const observedTrackId = observerRef.current.previous?.track?.id
    if (!current || !decision || pendingRef.current || committingRef.current) return
    const effectiveRevision = current.directionRevision + (nextDirectionRef.current ? 1 : 0)
    if (decision.basis.trackId !== observedTrackId || decision.basis.directionRevision !== effectiveRevision) {
      draftRef.current = null
      setDraftReady(false)
      generationRef.current += 1
      if (observerRef.current.previous?.track) void draftNext(observerRef.current.previous.track)
      return
    }
    committingRef.current = true
    try {
      await post('/api/player/queue', { uri: decision.selectedTrack.spotifyUri ?? `spotify:track:${decision.selectedTrack.id}` })
      pendingRef.current = decision
      draftRef.current = null
      setDraftReady(false)
      setNextCommitted(true)
      observerRef.current = {
        ...observerRef.current,
        expectedTrackId: decision.selectedTrack.id,
        expectedDecisionId: decision.decisionId,
      }
      const next: JourneySessionV2 = {
        ...current,
        decisions: [...current.decisions, decision],
        skipPenalties: current.skipPenalties
          .map((penalty) => ({ ...penalty, decisionsRemaining: penalty.decisionsRemaining - 1 }))
          .filter((penalty) => penalty.decisionsRemaining > 0),
        events: [...current.events, {
          version: 1,
          timestamp: new Date().toISOString(),
          eventType: 'queue_added',
          track: decision.selectedTrack,
          initiatingSource: 'woody',
          decisionId: decision.decisionId,
        }],
      }
      nextDirectionRef.current = null
      nextAdjustmentRef.current = null
      commitSession(next)
      setSystemState('queued')
      setStatus('One track is queued in Spotify.')
    } catch {
      setError(friendlyError('queue_failed'))
      setSystemState('error')
      commitSession({
        ...current,
        status: 'paused_override',
        events: [...current.events, { version: 1, timestamp: new Date().toISOString(), eventType: 'network_error', initiatingSource: 'system' }],
      })
    } finally {
      committingRef.current = false
    }
  }, [commitSession, draftNext])

  const finishSession = useCallback((reason: 'user' | 'duration' = 'user') => {
    const current = sessionRef.current
    if (!current || current.status === 'completed') return
    const endedAt = new Date().toISOString()
    generationRef.current += 1
    draftRef.current = null
    pendingRef.current = null
    setDraftReady(false)
    setNextCommitted(false)
    const eventType = reason === 'duration' ? 'duration_reached' : 'session_ended'
    const next: JourneySessionV2 = {
      ...current,
      status: 'completed',
      endedAt,
      events: [...current.events, { version: 1, timestamp: endedAt, eventType, initiatingSource: reason === 'duration' ? 'system' : 'user' }],
    }
    commitSession(next)
    void wakeLockRef.current?.release().catch(() => undefined)
    wakeLockRef.current = null
    setStage('review')
    setStatus(reason === 'duration' ? 'Planned time reached. Spotify keeps playing.' : 'Woody stopped. Spotify keeps playing.')
  }, [commitSession])

  const pollPlayback = useCallback(async () => {
    if (pollingRef.current || Date.now() < pollBlockedUntilRef.current) return
    const current = sessionRef.current
    if (!current || current.status === 'completed') return
    pollingRef.current = true
    try {
      const state = await api<PlayerState>('/api/player/state')
      setPlayer(state)
      if (!state.active || !state.track) return
      const observation: PlaybackObservation = {
        track: state.track,
        progressMs: state.progressMs ?? 0,
        isPlaying: state.isPlaying === true,
        observedAt: state.observedAt ?? new Date().toISOString(),
      }
      const reduction = reducePlaybackObservation(observerRef.current, observation)
      observerRef.current = reduction.state
      if (reduction.consumedExpectedDecision) {
        pendingRef.current = null
        setNextCommitted(false)
      }
      const latest = sessionRef.current ?? current
      const skipPenalties = reduction.skipSignal
        ? [
            ...latest.skipPenalties.filter((penalty) => penalty.trackId !== reduction.skipSignal!.trackId),
            { trackId: reduction.skipSignal.trackId, weight: reduction.skipSignal.weight, decisionsRemaining: 3 },
          ]
        : latest.skipPenalties
      const playbackElapsedMs = latest.playbackElapsedMs + reduction.playbackDeltaMs
      const next: JourneySessionV2 = {
        ...latest,
        status: reduction.overrideTrack ? 'paused_override' : latest.status,
        events: [...latest.events, ...reduction.events],
        playbackElapsedMs,
        playedTrackIds: latest.playedTrackIds.includes(state.track.id)
          ? latest.playedTrackIds
          : [...latest.playedTrackIds, state.track.id],
        skipPenalties,
      }
      if (reduction.events.length > 0 || reduction.playbackDeltaMs > 0 || next.playedTrackIds.length !== latest.playedTrackIds.length) {
        commitSession(next)
      }
      if (playbackElapsedMs >= latest.plan.durationMinutes * 60_000) {
        sessionRef.current = next
        finishSession('duration')
        return
      }
      if (reduction.overrideTrack) {
        generationRef.current += 1
        draftRef.current = null
        setDraftReady(false)
        setSystemState('paused')
        setStatus('Spotify moved outside Woody’s queue. Automation is paused.')
        return
      }
      if (next.status === 'active' && next.plan.mode === 'adaptive') {
        const remainingMs = Math.max(0, state.track.durationMs - (state.progressMs ?? 0))
        if (draftRef.current && !pendingRef.current && remainingMs <= 15_000) await commitDraft()
        else if (!draftRef.current && !pendingRef.current) await draftNext(state.track)
      }
    } catch (caught) {
      if (caught instanceof ClientApiError && caught.message === 'spotify_rate_limited') {
        pollBlockedUntilRef.current = Date.now() + (caught.retryAfterSeconds ?? 5) * 1000
        setStatus(`Spotify asked Woody to wait ${caught.retryAfterSeconds ?? 5} seconds.`)
      } else {
        setStatus('Playback observation is unavailable. No evidence is being inferred.')
      }
    } finally {
      pollingRef.current = false
    }
  }, [commitDraft, commitSession, draftNext, finishSession])

  useEffect(() => {
    if (stage !== 'active') return
    let cancelled = false
    let timer: number | undefined
    const tick = async () => {
      await pollPlayback()
      if (!cancelled) timer = window.setTimeout(tick, 5_000)
    }
    timer = window.setTimeout(tick, 800)
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [pollPlayback, stage])

  useEffect(() => {
    if (!adjustOpen) return
    const dialog = adjustDialogRef.current
    const focusable = () => [...(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select') ?? [])]
    focusable()[0]?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAdjustOpen(false)
      if (event.key !== 'Tab') return
      const elements = focusable()
      if (elements.length === 0) return
      const first = elements[0]
      const last = elements.at(-1)!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [adjustOpen])

  const invalidateDraft = () => {
    generationRef.current += 1
    draftRef.current = null
    setDraftReady(false)
  }

  const adjustNext = async (kind: JourneyAdjustmentKind) => {
    const current = sessionRef.current
    const currentTrack = player?.track
    if (!current || !currentTrack || pendingRef.current) return
    if (kind === 'different_next' && draftRef.current) {
      const rejected = draftRef.current.selectedTrack
      const next = {
        ...current,
        sessionExcludedTrackIds: [...new Set([...current.sessionExcludedTrackIds, rejected.id])],
        events: [...current.events, {
          version: 1 as const,
          timestamp: new Date().toISOString(),
          eventType: 'candidate_rejected' as const,
          track: rejected,
          initiatingSource: 'user' as const,
          decisionId: draftRef.current.decisionId,
        }],
      }
      commitSession(next)
    }
    invalidateDraft()
    nextAdjustmentRef.current = kind
    setAdjustOpen(false)
    await draftNext(currentTrack, kind)
  }

  const applyDirection = async () => {
    const current = sessionRef.current
    const currentTrack = player?.track
    const text = adjustText.trim()
    if (!current || !currentTrack || text.length < 3) return
    invalidateDraft()
    nextAdjustmentRef.current = 'change_direction'
    if (adjustScope === 'rest_of_session') {
      const next: JourneySessionV2 = {
        ...current,
        direction: text,
        directionRevision: current.directionRevision + 1,
        events: [...current.events, {
          version: 1,
          timestamp: new Date().toISOString(),
          eventType: 'direction_changed',
          initiatingSource: 'user',
          attribution: { field: 'direction', value: text, source: 'user_text', recordedAt: new Date().toISOString() },
        }],
      }
      commitSession(next)
      nextDirectionRef.current = null
      await draftNext(currentTrack, 'change_direction', null)
    } else {
      nextDirectionRef.current = text
      await draftNext(currentTrack, 'change_direction', text)
    }
    setAdjustText('')
    setAdjustOpen(false)
  }

  const markMoment = () => {
    const current = sessionRef.current
    const track = player?.track
    if (!current || !track) return
    const position = Math.max(0, player?.progressMs ?? 0)
    const capture: AspectCaptureV1 = {
      version: 1,
      id: crypto.randomUUID(),
      sessionId: current.plan.sessionId,
      track,
      capturedPositionMs: position,
      provisionalWindowStartMs: Math.max(0, position - 6_000),
      provisionalWindowEndMs: Math.min(track.durationMs || position + 6_000, position + 6_000),
      directionContext: current.direction,
      decisionId: observerRef.current.currentDecisionId ?? undefined,
      status: 'captured_only',
      createdAt: new Date().toISOString(),
    }
    commitSession({
      ...current,
      aspectCaptures: [...current.aspectCaptures, capture],
      events: [...current.events, {
        version: 1,
        timestamp: capture.createdAt,
        eventType: 'aspect_marked',
        track,
        rawPositionMs: position,
        rawDurationMs: track.durationMs,
        initiatingSource: 'user',
        decisionId: capture.decisionId,
      }],
    })
    setStatus(`Moment saved at ${formatTime(position)}. Label it later if useful.`)
  }

  const updateCapture = (id: string, changes: Partial<Pick<AspectCaptureV1, 'label' | 'userText'>>) => {
    const current = sessionRef.current
    if (!current) return
    commitSession({
      ...current,
      aspectCaptures: current.aspectCaptures.map((capture) => capture.id === id ? { ...capture, ...changes } : capture),
    })
  }

  const resumeAfterOverride = async () => {
    const current = sessionRef.current
    const track = player?.track
    if (!current || !track) return
    const supported = await checkTrackSupport(track)
    if (!supported) {
      setError(friendlyError('unsupported_track'))
      setSystemState('error')
      return
    }
    observerRef.current = { ...observerRef.current, pausedForOverride: false, previous: null }
    const next: JourneySessionV2 = { ...current, status: 'active' }
    commitSession(next)
    setSystemState('observing')
    setStatus('Resumed from the current Spotify track.')
    await draftNext(track)
  }

  const saveReview = () => {
    const current = sessionRef.current
    if (!current) return
    const submittedAt = new Date().toISOString()
    const next: JourneySessionV2 = {
      ...current,
      ...(quickAnswer ? { quickReview: { stayedWhereWanted: quickAnswer, ...(quickNote.trim() ? { note: quickNote.trim() } : {}), submittedAt } } : {}),
      ...(researchMode ? {
        researchReview: {
          pairNumber: pairedSlot.pairNumber,
          pairLeg: pairedSlot.pairLeg,
          timingSupport: researchTiming,
          manualManagementEffort: researchEffort,
          transitionNotes: researchNotes.trim(),
          overallPreference: researchPreference,
          submittedAt,
        },
      } : {}),
    }
    commitSession(next)
    setStage('setup')
    setSession(null)
    sessionRef.current = null
    setSelectedStarter(null)
    setQuickAnswer(null)
    setQuickNote('')
    void refreshSetup()
  }

  const disconnect = async () => {
    await post('/api/auth/disconnect', {})
    setConnected(false)
    setPlayer(null)
    setCurrentSupported(null)
  }

  if (connected === null) {
    return <main className="journey-v2 journey-v2-center"><div className="woody-mark" aria-hidden="true">W</div><p>Checking Spotify…</p></main>
  }

  if (!connected) {
    return (
      <main className="journey-v2 journey-v2-center">
        <div className="woody-mark" aria-hidden="true">W</div>
        <p className="eyebrow">WOODY</p>
        <h1>Music that can change direction with you.</h1>
        <p>Spotify plays the music. Woody chooses one supported transition at a time.</p>
        <a className="primary-action" href="/api/auth/login">Connect Spotify</a>
        <a className="text-link" href="/privacy">Privacy and data</a>
      </main>
    )
  }

  return (
    <main className={`journey-v2 stage-${stage}`}>
      <header className="journey-v2-header">
        <a href={researchMode ? '/lab' : '/'} className="woody-wordmark"><span>W</span> Woody</a>
        <div className={`system-state state-${systemState}`} aria-live="polite"><i />{status}</div>
      </header>

      {stage === 'setup' && (
        <section className="setup-flow">
          <div className="setup-copy">
            <p className="eyebrow">{researchMode ? `LAB · PAIR ${pairedSlot.pairNumber}.${pairedSlot.pairLeg}` : 'START FROM WHAT IS PLAYING'}</p>
            <h1>Where should the music go?</h1>
            <p>Woody keeps the starting track acoustically present while moving toward your direction.</p>
          </div>

          {player?.track ? (
            <article className={`starter-track ${currentSupported ? 'supported' : 'unsupported'}`}>
              {player.track.albumArt && <Image src={player.track.albumArt} alt="" width={72} height={72} unoptimized />}
              <div><small>PLAYING IN SPOTIFY</small><strong>{player.track.name}</strong><span>{player.track.artist}</span></div>
              <b>{currentSupported ? 'SUPPORTED' : currentSupported === false ? 'NOT IN CORPUS' : 'CHECKING'}</b>
            </article>
          ) : (
            <button className="empty-starter" onClick={() => void refreshSetup()}>Play something in Spotify, then refresh</button>
          )}

          {selectedStarter && (
            <article className="starter-track supported selected">
              {selectedStarter.albumArt && <Image src={selectedStarter.albumArt} alt="" width={72} height={72} unoptimized />}
              <div><small>SUPPORTED START</small><strong>{selectedStarter.name}</strong><span>{selectedStarter.artist}</span></div>
              <button onClick={() => setSelectedStarter(null)}>Use current</button>
            </article>
          )}

          {(currentSupported === false || !player?.track || selectedStarter) && (
            <section className="supported-search">
              <label htmlFor="supported-search">Choose a track Woody can hear</label>
              <div><input id="supported-search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void searchSupported() }} placeholder="Track or artist" /><button disabled={busy} onClick={() => void searchSupported()}>Search</button></div>
              <div className="supported-results">{searchResults.map((track) => <button key={track.id} onClick={() => setSelectedStarter(track)}><span><strong>{track.name}</strong><small>{track.artist}</small></span><b>Use</b></button>)}</div>
            </section>
          )}

          <label className="direction-field">
            <span>DIRECTION</span>
            <textarea value={direction} onChange={(event) => setDirection(event.target.value)} maxLength={1000} placeholder="Relaxed and good, but keep the confidence and rhythmic pull of this track." />
          </label>

          <section className="duration-field">
            <div><span>PLANNED PLAYBACK</span><strong>{durationMinutes} min</strong></div>
            <input aria-label="Planned playback duration" type="range" min="10" max="120" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
          </section>

          {researchMode && <p className="lab-mode">This leg runs in <strong>{mode === 'adaptive' ? 'adaptive' : 'control observation'}</strong> mode. Test controls and diagnostics remain on this route only.</p>}

          <button className="primary-action" disabled={busy || !startTrack || direction.trim().length < 3 || (mode === 'adaptive' && !selectedStarter && currentSupported !== true)} onClick={() => void startJourney()}>
            {busy ? 'Starting…' : mode === 'adaptive' ? 'Start listening' : 'Start control observation'}
          </button>
          {error && <div className="journey-v2-error" role="alert"><strong>Woody paused.</strong><span>{error}</span></div>}

          <footer className="data-controls">
            <a href="/privacy">Privacy and data</a>
            {researchMode && <button onClick={downloadResearchExport}>Export research JSON</button>}
            <button onClick={() => { clearJourneySessions(); setStatus('Local Woody sessions deleted.') }}>Delete local sessions</button>
            <button onClick={() => void disconnect()}>Disconnect Spotify</button>
          </footer>
        </section>
      )}

      {stage === 'active' && session && (
        <section className="active-flow">
          <div className="active-artwork">
            {player?.track?.albumArt ? <a href={spotifyUrl(player.track)} target="_blank" rel="noreferrer"><Image src={player.track.albumArt} alt={`${player.track.name} cover`} width={640} height={640} unoptimized /></a> : <div className="artwork-empty" />}
          </div>
          <div className="active-information">
            <a className="spotify-attribution" href={player?.track ? spotifyUrl(player.track) : 'https://open.spotify.com'} target="_blank" rel="noreferrer">OPEN IN SPOTIFY ↗</a>
            <h1>{player?.track?.name ?? 'Waiting for Spotify'}</h1>
            <p>{player?.track?.artist}</p>
            <div className="track-progress"><i style={{ width: `${player?.track?.durationMs ? Math.min(100, ((player.progressMs ?? 0) / player.track.durationMs) * 100) : 0}%` }} /></div>
            <div className="session-time"><span>Woody playback</span><strong>{formatTime(session.playbackElapsedMs)} / {session.plan.durationMinutes}:00</strong></div>
            <p className="current-direction"><span>DIRECTION</span>{session.direction}</p>
          </div>
          <div className="live-actions">
            {session.plan.mode === 'adaptive' && <button onClick={() => setAdjustOpen(true)}>Adjust next</button>}
            <button onClick={markMoment}>Mark this moment</button>
            <button className="quiet-action" onClick={() => finishSession('user')}>End</button>
          </div>
          {session.aspectCaptures.length > 0 && <p className="capture-count">{session.aspectCaptures.length} {session.aspectCaptures.length === 1 ? 'moment' : 'moments'} saved</p>}
          {session.status === 'paused_override' && (
            <section className="override-notice" role="status"><strong>Automation paused</strong><p>Spotify moved somewhere Woody did not queue. Resume only if the current track is supported.</p><button onClick={resumeAfterOverride}>Check and resume here</button><button onClick={() => finishSession('user')}>End session</button></section>
          )}
          {error && <div className="journey-v2-error" role="alert"><strong>Woody paused.</strong><span>{error}</span></div>}
        </section>
      )}

      {stage === 'review' && session && (
        <section className="review-flow">
          <p className="eyebrow">SESSION ENDED · SPOTIFY CONTINUES</p>
          <h1>Did this stay where you wanted?</h1>
          <div className="quick-review">{(['yes', 'no', 'not_sure'] as const).map((answer) => <button key={answer} className={quickAnswer === answer ? 'active' : ''} onClick={() => setQuickAnswer(answer)}>{answer === 'not_sure' ? 'Not sure' : answer[0].toUpperCase() + answer.slice(1)}</button>)}</div>
          <textarea value={quickNote} onChange={(event) => setQuickNote(event.target.value)} placeholder="Optional: what stayed right or moved too far?" />

          {session.aspectCaptures.length > 0 && <section className="captured-moments"><div><span>MARKED MOMENTS</span><p>Label only the ones worth carrying forward.</p></div>{session.aspectCaptures.map((capture) => <article key={capture.id}><strong>{capture.track.name} · {formatTime(capture.capturedPositionMs)}</strong><select aria-label={`Aspect from ${capture.track.name}`} value={capture.label ?? ''} onChange={(event) => updateCapture(capture.id, { label: (event.target.value || undefined) as AspectLabel | undefined })}><option value="">What mattered?</option><option value="beat">Beat</option><option value="bass">Bass</option><option value="melody">Melody</option><option value="vocal">Vocal</option><option value="instrument_sound">Instrument / sound</option><option value="other">Other</option></select><input value={capture.userText ?? ''} onChange={(event) => updateCapture(capture.id, { userText: event.target.value })} placeholder="Optional detail" /></article>)}</section>}

          {researchMode && <section className="research-review"><h2>Lab evidence</h2><label>Timing support <input type="range" min="1" max="5" value={researchTiming} onChange={(event) => setResearchTiming(Number(event.target.value))} /><b>{researchTiming}/5</b></label><label>Manual management <input type="range" min="1" max="5" value={researchEffort} onChange={(event) => setResearchEffort(Number(event.target.value))} /><b>{researchEffort}/5</b></label><textarea value={researchNotes} onChange={(event) => setResearchNotes(event.target.value)} placeholder="Transition notes" /><label>Preference<select value={researchPreference} onChange={(event) => setResearchPreference(event.target.value as JourneyResearchReviewV1['overallPreference'])}><option value="adaptive">Adaptive</option><option value="control_observation">My queue</option><option value="no_preference">No preference</option></select></label></section>}

          <button className="primary-action" onClick={saveReview}>{quickAnswer || researchMode ? 'Save and finish' : 'Finish without feedback'}</button>
        </section>
      )}

      {adjustOpen && (
        <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAdjustOpen(false) }}>
          <div className="adjust-dialog" ref={adjustDialogRef} role="dialog" aria-modal="true" aria-labelledby="adjust-title">
            <header><div><span>NEXT DECISION</span><h2 id="adjust-title">Adjust next</h2></div><button aria-label="Close" onClick={() => setAdjustOpen(false)}>×</button></header>
            <button disabled={nextCommitted} onClick={() => void adjustNext('closer_to_current')}><strong>Keep closer to this</strong><span>Prioritize acoustic proximity to the current track.</span></button>
            <button disabled={nextCommitted || !draftReady} onClick={() => void adjustNext('different_next')}><strong>Choose another</strong><span>{nextCommitted ? 'Spotify already has the next track.' : 'Reject the prepared candidate for this session.'}</span></button>
            <label><span>CHANGE DIRECTION</span><input value={adjustText} onChange={(event) => setAdjustText(event.target.value)} placeholder="Say exactly what should change" maxLength={1000} /></label>
            <div className="scope-switch"><button className={adjustScope === 'next_track' ? 'active' : ''} onClick={() => setAdjustScope('next_track')}>Next track</button><button className={adjustScope === 'rest_of_session' ? 'active' : ''} onClick={() => setAdjustScope('rest_of_session')}>Rest of session</button></div>
            <button className="apply-adjustment" disabled={adjustText.trim().length < 3} onClick={() => void applyDirection()}>Apply direction</button>
          </div>
        </div>
      )}
    </main>
  )
}
