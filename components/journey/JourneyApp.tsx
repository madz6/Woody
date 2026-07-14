'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  initialPlaybackObserver,
  reducePlaybackObservation,
  type PlaybackObservation,
  type PlaybackObserverState,
} from '@/lib/playbackObserver'
import {
  exportJourneySessions,
  loadJourneySessions,
  nextPairedRunSlot,
  saveJourneySession,
} from '@/lib/journeyStorage'
import { renderJourneyRunPrint, shareJourneyRunPrint } from '@/lib/journeyRunPrint'
import type {
  JourneyDecision,
  JourneyPhaseType,
  JourneyPlanV1,
  JourneyRunReview,
  JourneySessionMode,
  JourneySessionV1,
  JourneyTagCategory,
  Track,
} from '@/lib/types'

const TAG_CATEGORIES: JourneyTagCategory[] = ['function', 'movement', 'rhythm', 'texture', 'impact', 'relationship']
const PAIR_ORDER: JourneySessionMode[][] = [
  ['adaptive', 'control_observation'],
  ['control_observation', 'adaptive'],
  ['adaptive', 'control_observation'],
  ['control_observation', 'adaptive'],
]

type Stage = 'setup' | 'preview' | 'active' | 'review'
type ReviewAnswerKey = 'timingSupport' | 'manualManagementEffort' | 'sustainedEffortSupport' | 'preference' | 'chooseAgain'
type Device = { id: string; is_active: boolean; name: string; type: string; volume_percent?: number }
type PlayerState = {
  active: boolean
  isPlaying?: boolean
  progressMs?: number
  track?: Track | null
  device?: Device | null
  observedAt?: string
}

class ClientApiError extends Error {
  constructor(message: string, readonly retryAfterSeconds: number | null) {
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

function phaseFor(plan: JourneyPlanV1, startedAt: string): { type: JourneyPhaseType; description: string } {
  const elapsedMinutes = Math.max(0, (Date.now() - Date.parse(startedAt)) / 60_000)
  const impact = plan.impactWindows.find((window) => window.enabled && Math.abs(window.minute - elapsedMinutes) <= 1.25)
  if (impact) return { type: 'impact', description: impact.description }
  const phase = plan.phases.find((candidate) => candidate.accepted && elapsedMinutes >= candidate.startMinute && elapsedMinutes < candidate.endMinute)
    ?? plan.phases.filter((candidate) => candidate.accepted).at(-1)
  return { type: phase?.type ?? 'sustain', description: phase?.description ?? plan.intent }
}

function fraction(progressMs = 0, durationMs = 0): number {
  return durationMs > 0 ? Math.max(0, Math.min(1, progressMs / durationMs)) : 0
}

function JourneySignal({ mode }: { mode: JourneySessionMode }) {
  return (
    <span className={`journey-signal journey-signal-${mode}`} aria-hidden="true">
      <svg viewBox="0 0 160 160">
        <path d="M80 8c18 0 25 16 40 21 17 6 31 1 34 19 3 17-12 25-14 41-3 17 8 27-4 40-12 13-27 3-43 12-13 8-18 18-34 9-15-9-10-24-23-34-12-9-31-6-30-24 0-17 17-22 21-37 5-17-5-29 9-39C45 3 63 8 80 8Z" />
        <g><rect x="42" y="54" width="18" height="58" rx="9" /><rect x="71" y="45" width="18" height="70" rx="9" /><rect x="100" y="54" width="18" height="58" rx="9" /></g>
        <circle cx="80" cy="128" r="8" />
      </svg>
    </span>
  )
}

function freshReview(): Omit<JourneyRunReview, 'submittedAt'> {
  return {
    pairNumber: 1,
    pairLeg: 1,
    timingSupport: 3,
    manualManagementEffort: 3,
    sustainedEffortSupport: 3,
    impactMoments: '',
    mistimedTransitions: '',
    overallPreference: 'no_preference',
    chooseAdaptiveAgain: false,
  }
}

export function JourneyApp() {
  const [stage, setStage] = useState<Stage>('setup')
  const [connected, setConnected] = useState<boolean | null>(null)
  const [intent, setIntent] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(35)
  const [anchors, setAnchors] = useState<Array<{ track: Track; note: string; role: 'opener' | 'reference' }>>([])
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [plan, setPlan] = useState<JourneyPlanV1 | null>(null)
  const [session, setSession] = useState<JourneySessionV1 | null>(null)
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [overrideTrack, setOverrideTrack] = useState<Track | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pairNumber, setPairNumber] = useState<1 | 2 | 3 | 4>(1)
  const [pairLeg, setPairLeg] = useState<1 | 2>(1)
  const mode: JourneySessionMode = PAIR_ORDER[pairNumber - 1][pairLeg - 1]
  const [review, setReview] = useState<Omit<JourneyRunReview, 'submittedAt'>>(freshReview)
  const [runPrint, setRunPrint] = useState<Blob | null>(null)
  const [shareStatus, setShareStatus] = useState('')
  const [reviewAnswers, setReviewAnswers] = useState<ReviewAnswerKey[]>([])

  const sessionRef = useRef<JourneySessionV1 | null>(null)
  const observerRef = useRef<PlaybackObserverState>(initialPlaybackObserver(mode))
  const pendingDecisionRef = useRef<JourneyDecision | null>(null)
  const selectingRef = useRef(false)
  const pollBlockedUntilRef = useRef(0)
  const contextRef = useRef<{ knownTrackIds: string[]; knownArtists: string[] }>({ knownTrackIds: [], knownArtists: [] })
  const wakeLockRef = useRef<{ release(): Promise<void>; addEventListener(type: string, listener: () => void): void } | null>(null)

  const commitSession = useCallback((next: JourneySessionV1) => {
    sessionRef.current = next
    setSession(next)
    saveJourneySession(next)
  }, [])

  useEffect(() => {
    const slot = nextPairedRunSlot(loadJourneySessions())
    api<{ connected: true }>('/api/auth/token')
      .then(() => {
        setConnected(true)
        setPairNumber(slot.pairNumber)
        setPairLeg(slot.pairLeg)
      })
      .catch(() => {
        setConnected(false)
        setPairNumber(slot.pairNumber)
        setPairLeg(slot.pairLeg)
      })
  }, [])

  useEffect(() => {
    if (stage !== 'review' || !session) return
    let cancelled = false
    const lastTrack = [...session.events].reverse().find((event) => event.track)?.track
    const interventions = session.events.filter((event) => event.eventType === 'manual_transition' || event.eventType === 'user_override').length
    renderJourneyRunPrint({
      title: lastTrack?.name ?? 'A Woody run',
      artist: lastTrack?.artist ?? 'Spotify journey',
      intent: session.plan.intent,
      durationMinutes: session.plan.durationMinutes,
      impactMinute: session.plan.impactWindows.find((window) => window.enabled)?.minute,
      interventions,
      mode: session.plan.mode,
    }).then((blob) => {
      if (!cancelled) setRunPrint(blob)
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [session, stage])

  const requestWakeLock = useCallback(async () => {
    const wakeLock = (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<typeof wakeLockRef.current> } }).wakeLock
    if (!wakeLock || document.visibilityState !== 'visible') return
    try {
      const lock = await wakeLock.request('screen')
      wakeLockRef.current = lock
      lock?.addEventListener('release', () => {
        const current = sessionRef.current
        if (!current || current.status !== 'active') return
        commitSession({
          ...current,
          events: [...current.events, {
            version: 1,
            timestamp: new Date().toISOString(),
            eventType: 'wake_lock_lost',
            initiatingSource: 'system',
          }],
        })
      })
    } catch {
      setStatus('Screen lock prevention was unavailable. Keep Safari visible when possible.')
    }
  }, [commitSession])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && sessionRef.current?.status === 'active') void requestWakeLock()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [requestWakeLock])

  const search = async () => {
    if (query.trim().length < 2) return
    setBusy(true)
    setError('')
    try {
      const result = await api<{ tracks: Track[] }>(`/api/spotify/search?q=${encodeURIComponent(query.trim())}`)
      setSearchResults(result.tracks)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'search_failed')
    } finally {
      setBusy(false)
    }
  }

  const addAnchor = (track: Track) => {
    if (anchors.length >= 3 || anchors.some((anchor) => anchor.track.id === track.id)) return
    setAnchors((current) => [...current, { track, note: '', role: current.length === 0 ? 'opener' : 'reference' }])
    setSearchResults([])
    setQuery('')
  }

  const buildPreview = async () => {
    setBusy(true)
    setError('')
    try {
      const result = await post<JourneyPlanV1>('/api/journey/plan', { mode, intent, durationMinutes, anchors })
      setPlan(result)
      setStage('preview')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'journey_plan_failed')
    } finally {
      setBusy(false)
    }
  }

  const updateTag = (anchorIndex: number, category: JourneyTagCategory, raw: string) => {
    if (!plan) return
    const values = raw.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 5)
    setPlan({
      ...plan,
      anchors: plan.anchors.map((anchor, index) => index === anchorIndex
        ? { ...anchor, confirmedTags: { ...anchor.confirmedTags, [category]: values } }
        : anchor),
    })
  }

  const startJourney = async () => {
    if (!plan) return
    setBusy(true)
    setError('')
    setRunPrint(null)
    setShareStatus('')
    setStatus('Checking the active Spotify device…')
    try {
      const deviceResult = await api<{ devices: Device[] }>('/api/player/devices')
      const activeDevice = deviceResult.devices.find((device) => device.is_active)
      if (!activeDevice) {
        throw new Error('no_active_device')
      }
      contextRef.current = await api<{ knownTrackIds: string[]; knownArtists: string[] }>('/api/spotify/context')
        .catch(() => ({ knownTrackIds: [], knownArtists: [] }))

      const acceptedPlan: JourneyPlanV1 = {
        ...plan,
        anchors: plan.anchors.map((anchor) => ({
          ...anchor,
          confirmedTags: Object.keys(anchor.confirmedTags).length > 0 ? anchor.confirmedTags : anchor.suggestedTags,
          attribution: [
            ...anchor.attribution,
            ...Object.entries(Object.keys(anchor.confirmedTags).length > 0 ? anchor.confirmedTags : anchor.suggestedTags)
              .flatMap(([category, values]) => (values ?? []).map((value) => ({
                field: `anchor.tags.${category}`,
                value,
                source: 'user_confirmed' as const,
                recordedAt: new Date().toISOString(),
              }))),
          ],
        })),
      }
      setPlan(acceptedPlan)
      if (acceptedPlan.mode === 'adaptive') {
        setStatus('Preparing anchor audio…')
        await Promise.all(acceptedPlan.anchors.map((anchor) => post('/api/journey/anchor', { track: anchor.track })))
        const opener = acceptedPlan.anchors.find((anchor) => anchor.role === 'opener')!
        await post('/api/player/play', { uri: opener.track.spotifyUri ?? `spotify:track:${opener.track.id}`, deviceId: activeDevice.id })
      }
      const now = new Date().toISOString()
      const next: JourneySessionV1 = {
        version: 1,
        plan: acceptedPlan,
        status: 'active',
        decisions: [],
        events: [{ version: 1, timestamp: now, eventType: 'session_started', initiatingSource: 'user' }],
        playedTrackIds: [],
        rejectedTrackIds: [],
        skipPenalties: [],
        startedAt: now,
      }
      observerRef.current = initialPlaybackObserver(acceptedPlan.mode)
      pendingDecisionRef.current = null
      commitSession(next)
      setStage('active')
      setStatus(acceptedPlan.mode === 'adaptive' ? 'Woody is observing Spotify and keeping one track queued.' : 'Control run: Woody is observing only.')
      await requestWakeLock()
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'start_failed'
      setError(message === 'no_active_device'
        ? 'No active Spotify device. Open Spotify on your iPhone, play anything briefly, return here, and retry.'
        : message)
    } finally {
      setBusy(false)
    }
  }

  const queueNext = useCallback(async (currentTrack: Track) => {
    const current = sessionRef.current
    if (!current || current.status !== 'active' || current.plan.mode !== 'adaptive' || selectingRef.current || pendingDecisionRef.current) return
    selectingRef.current = true
    try {
      const activePhase = phaseFor(current.plan, current.startedAt ?? new Date().toISOString())
      const decision = await post<JourneyDecision>('/api/journey/next', {
        sessionId: current.plan.sessionId,
        decisionIndex: current.decisions.length,
        currentTrackId: currentTrack.id,
        anchorTrackIds: current.plan.anchors.map((anchor) => anchor.track.id),
        phase: activePhase.type,
        phaseDescription: activePhase.description,
        familiarityTarget: current.plan.familiarityTarget,
        knownTrackIds: contextRef.current.knownTrackIds,
        knownArtists: contextRef.current.knownArtists,
        recentKnownness: current.decisions.slice(-10).map((item) => item.knownness),
        excludeIds: [...new Set([...current.playedTrackIds, ...current.rejectedTrackIds])],
        skipPenalties: current.skipPenalties,
      })
      await post('/api/player/queue', { uri: decision.selectedTrack.spotifyUri ?? `spotify:track:${decision.selectedTrack.id}` })
      pendingDecisionRef.current = decision
      observerRef.current = {
        ...observerRef.current,
        expectedTrackId: decision.selectedTrack.id,
        expectedDecisionId: decision.decisionId,
      }
      const next: JourneySessionV1 = {
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
      commitSession(next)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'selection_failed'
      setError(message)
      const latest = sessionRef.current
      if (latest) commitSession({
        ...latest,
        events: [...latest.events, {
          version: 1,
          timestamp: new Date().toISOString(),
          eventType: 'network_error',
          initiatingSource: 'system',
        }],
      })
    } finally {
      selectingRef.current = false
    }
  }, [commitSession])

  const pollPlayback = useCallback(async () => {
    const current = sessionRef.current
    if (!current || current.status === 'completed' || Date.now() < pollBlockedUntilRef.current) return
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
        pendingDecisionRef.current = null
        observerRef.current = { ...observerRef.current, expectedTrackId: null, expectedDecisionId: null }
      }
      const latest = sessionRef.current ?? current
      const skipPenalties = reduction.skipSignal
        ? [
            ...latest.skipPenalties.filter((penalty) => penalty.trackId !== reduction.skipSignal!.trackId),
            { trackId: reduction.skipSignal.trackId, weight: reduction.skipSignal.weight, decisionsRemaining: 3 },
          ]
        : latest.skipPenalties
      const next: JourneySessionV1 = {
        ...latest,
        status: reduction.overrideTrack ? 'paused_override' : latest.status,
        events: [...latest.events, ...reduction.events],
        playedTrackIds: latest.playedTrackIds.includes(state.track.id)
          ? latest.playedTrackIds
          : [...latest.playedTrackIds, state.track.id],
        rejectedTrackIds: reduction.skipSignal && !latest.rejectedTrackIds.includes(reduction.skipSignal.trackId)
          ? [...latest.rejectedTrackIds, reduction.skipSignal.trackId]
          : latest.rejectedTrackIds,
        skipPenalties,
      }
      if (reduction.events.length > 0 || next.status !== latest.status || next.playedTrackIds.length !== latest.playedTrackIds.length) commitSession(next)
      if (reduction.overrideTrack) {
        setOverrideTrack(reduction.overrideTrack)
        setStatus('Automation paused because Spotify moved somewhere unexpected.')
        return
      }
      if (next.status === 'active') void queueNext(state.track)
    } catch (caught) {
      if (caught instanceof ClientApiError && caught.message === 'spotify_rate_limited') {
        pollBlockedUntilRef.current = Date.now() + (caught.retryAfterSeconds ?? 5) * 1000
        setStatus(`Spotify asked Woody to slow down. Retrying in ${caught.retryAfterSeconds ?? 5} seconds.`)
      } else {
        setStatus('Playback observation temporarily unavailable. Retrying…')
      }
    }
  }, [commitSession, queueNext])

  useEffect(() => {
    if (stage !== 'active') return
    const first = window.setTimeout(() => void pollPlayback(), 800)
    const interval = window.setInterval(() => void pollPlayback(), 5_000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(interval)
    }
  }, [pollPlayback, stage])

  const resumeFromOverride = async () => {
    const current = sessionRef.current
    if (!current || !overrideTrack) return
    setBusy(true)
    try {
      await post('/api/journey/anchor', { track: overrideTrack })
      const opener = current.plan.anchors.find((anchor) => anchor.role === 'opener')
      const references = current.plan.anchors.filter((anchor) => anchor.role === 'reference' && anchor.track.id !== overrideTrack.id).slice(0, 1)
      const resumedAnchors = [...(opener ? [opener] : []), ...references, {
        track: overrideTrack,
        role: 'reference' as const,
        note: 'Adopted after a user override.',
        suggestedTags: {},
        confirmedTags: {},
        attribution: [{
          field: 'anchor.override',
          value: overrideTrack.id,
          source: 'behavior_observed' as const,
          recordedAt: new Date().toISOString(),
        }],
      }].slice(0, 3)
      const next = {
        ...current,
        status: 'active' as const,
        plan: { ...current.plan, anchors: resumedAnchors },
      }
      observerRef.current = { ...observerRef.current, pausedForOverride: false, expectedTrackId: null, expectedDecisionId: null }
      pendingDecisionRef.current = null
      setOverrideTrack(null)
      commitSession(next)
      setStatus('Resumed from the track you chose.')
      void queueNext(overrideTrack)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'resume_failed')
    } finally {
      setBusy(false)
    }
  }

  const endJourney = () => {
    const current = sessionRef.current
    if (!current) return
    const endedAt = new Date().toISOString()
    commitSession({
      ...current,
      status: 'completed',
      endedAt,
      events: [...current.events, { version: 1, timestamp: endedAt, eventType: 'session_ended', initiatingSource: 'user' }],
    })
    void wakeLockRef.current?.release()
    setStage('review')
  }

  const submitReview = () => {
    const current = sessionRef.current
    if (!current || reviewAnswers.length < 5) return
    const submittedAt = new Date().toISOString()
    const completeReview: JourneyRunReview = { ...review, pairNumber, pairLeg, submittedAt }
    commitSession({
      ...current,
      review: completeReview,
      events: [...current.events, {
        version: 1,
        timestamp: submittedAt,
        eventType: completeReview.chooseAdaptiveAgain ? 'explicit_approval' : 'explicit_rejection',
        initiatingSource: 'user',
      }],
    })
    setStatus('Run saved locally. Complete the matched leg before changing features.')
  }

  const downloadExport = () => {
    const blob = new Blob([exportJourneySessions()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `woody-journeys-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const shareRunPrint = async () => {
    if (!runPrint) return
    const result = await shareJourneyRunPrint(runPrint)
    if (result === 'shared') setShareStatus('Run print shared.')
    if (result === 'downloaded') setShareStatus('Run print saved as PNG.')
  }

  const setUpNextLeg = () => {
    const slot = nextPairedRunSlot(loadJourneySessions())
    setPairNumber(slot.pairNumber)
    setPairLeg(slot.pairLeg)
    setReview(freshReview())
    setReviewAnswers([])
    setStage('setup')
    setPlan(null)
    setSession(null)
    setPlayer(null)
    setOverrideTrack(null)
    setRunPrint(null)
    setShareStatus('')
    setError('')
    setStatus('')
  }

  const reviewTrack = session ? [...session.events].reverse().find((event) => event.track)?.track : null
  const interventionCount = session?.events.filter((event) => event.eventType === 'manual_transition' || event.eventType === 'user_override').length ?? 0
  const impactMinute = session?.plan.impactWindows.find((window) => window.enabled)?.minute

  return (
    <main className={`journey-shell journey-stage-${stage}`}>
      <header className="journey-header">
        <div className="journey-wordmark"><span>W</span><strong>WOODY</strong></div>
        <span className={connected ? 'status-dot status-ok' : 'status-dot'}>{connected ? 'Spotify ready' : connected === false ? 'Spotify offline' : 'Checking Spotify'}</span>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {connected === null && <motion.section key="checking" className="journey-loading" exit={{ y: -12 }}><JourneySignal mode="adaptive" /><span>Checking Spotify…</span></motion.section>}
        {connected === false && (
          <motion.section key="connect" className="journey-connect" initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: -12 }}>
            <JourneySignal mode="adaptive" />
            <span className="journey-kicker">ONE SMALL HANDSHAKE</span>
            <h1>Connect the music<br />you already use.</h1>
            <p>Woody controls the official Spotify app. Premium and an active iPhone device are required.</p>
            <a className="journey-button journey-button-primary" href="/api/auth/login">Connect Spotify <i>↗</i></a>
          </motion.section>
        )}

        {stage === 'setup' && connected === true && (
          <motion.section key="setup" className="journey-stack" initial={{ x: -18 }} animate={{ x: 0 }} exit={{ x: 16 }}>
            <div className="journey-hero"><span>COMPOSE · 01</span><h1>Where should this<br />run <em>take you?</em></h1><p>{mode === 'adaptive' ? 'Woody will lead this one and keep only one track ahead.' : 'You lead this one. Start your normal playlist or queue; Woody will only observe.'}</p></div>

            {process.env.NODE_ENV === 'development' && <details className="journey-instrumentation"><summary>Test instrumentation</summary><div className="journey-grid-two"><label>Pair<select value={pairNumber} onChange={(event) => setPairNumber(Number(event.target.value) as 1 | 2 | 3 | 4)}>{[1,2,3,4].map((number) => <option key={number} value={number}>{number}</option>)}</select></label><label>Leg<select value={pairLeg} onChange={(event) => setPairLeg(Number(event.target.value) as 1 | 2)}><option value={1}>1</option><option value={2}>2</option></select></label></div></details>}

            <section className="journey-compose-panel">
              <label className="journey-intent"><span>THE FEELING</span><textarea value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="Patient at first. Precise when it opens." maxLength={1000} /></label>
              <div className="journey-duration"><div><span>PLANNED DURATION</span><strong>{durationMinutes}<small>min</small></strong></div><input aria-label="Planned duration" type="range" min="10" max="120" step="1" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} /><div className="journey-duration-ticks"><span>10</span><span>35</span><span>60</span><span>90</span><span>120</span></div><div className="journey-presets">{[20,35,50].map((value) => <button key={value} className={durationMinutes === value ? 'active' : ''} onClick={() => setDurationMinutes(value)}>{value} min</button>)}</div></div>
            </section>

            <section className="journey-anchors">
              <div className="journey-section-heading"><div><span>DIRECTION</span><h2>Anchor tracks</h2></div><strong>{anchors.length} / 3</strong></div>
              {anchors.map((anchor, index) => (
                <article className="anchor-row" key={anchor.track.id}>
                  <span className="anchor-art">{anchor.track.albumArt && <Image src={anchor.track.albumArt} alt="" width={88} height={88} unoptimized />}</span>
                  <div className="anchor-copy"><strong>{anchor.track.name}</strong><span>{anchor.track.artist}</span><textarea value={anchor.note} onChange={(event) => setAnchors((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, note: event.target.value } : item))} placeholder="What should Woody take from this?" /></div>
                  <div className="anchor-actions"><label><input type="radio" checked={anchor.role === 'opener'} onChange={() => setAnchors((current) => current.map((item, itemIndex) => ({ ...item, role: itemIndex === index ? 'opener' : 'reference' })))} /> Opener</label><button onClick={() => setAnchors((current) => current.filter((item) => item.track.id !== anchor.track.id))}>Remove</button></div>
                </article>
              ))}
              {anchors.length < 3 && <div className="search-box"><div className="search-line"><input aria-label="Search Spotify" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void search() }} placeholder="Search a track or artist" /><button onClick={() => void search()} disabled={busy}>Search</button></div><div className="search-results">{searchResults.map((track) => <button className="search-result" key={track.id} onClick={() => addAnchor(track)}>{track.albumArt ? <Image src={track.albumArt} alt="" width={46} height={46} unoptimized /> : <i />}<span><strong>{track.name}</strong><small>{track.artist}</small></span><b>+</b></button>)}</div></div>}
            </section>
            <button className="journey-button journey-button-primary journey-main-action" disabled={busy || intent.trim().length < 3 || anchors.length < 1} onClick={() => void buildPreview()}>{busy ? 'Listening to the shape…' : 'Preview the journey'} <i>→</i></button>
          </motion.section>
        )}

        {stage === 'preview' && plan && (
          <motion.section key="preview" className="journey-stack" initial={{ x: 18 }} animate={{ x: 0 }} exit={{ x: -16 }}>
            <div className="journey-hero"><span>PREVIEW · 02</span><h1>The arc, not<br /><em>the surprise.</em></h1><p>Upcoming tracks stay hidden. Tap any part of the shape to tune it.</p></div>
            <section className="journey-shape">
              <svg viewBox="0 0 340 170" aria-hidden="true"><path d="M12 145C45 126 56 73 104 89s55-61 104-37 58 70 120 5" />{plan.phases.filter((phase) => phase.accepted).slice(0, 4).map((phase, index) => <circle key={phase.id} cx={[12,104,208,328][index]} cy={[145,89,52,57][index]} r="5" />)}</svg>
              <div>{plan.phases.filter((phase) => phase.accepted).slice(0, 4).map((phase) => <span key={phase.id}>{phase.label}</span>)}</div>
            </section>
            <section className="journey-editor-group"><div className="journey-section-heading"><div><span>PHASES</span><h2>How it moves</h2></div></div>{plan.phases.map((phase, index) => <details className="phase-editor" key={phase.id}><summary><input aria-label={`Use ${phase.label} phase`} type="checkbox" checked={phase.accepted} onClick={(event) => event.stopPropagation()} onChange={(event) => setPlan({ ...plan, phases: plan.phases.map((item, itemIndex) => itemIndex === index ? { ...item, accepted: event.target.checked } : item) })} /><span><strong>{phase.label}</strong><small>{phase.startMinute}–{phase.endMinute} min</small></span><i>+</i></summary><textarea aria-label={`${phase.label} description`} value={phase.description} onChange={(event) => setPlan({ ...plan, phases: plan.phases.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) })} /></details>)}</section>
            <section className="journey-balance"><div><span>FAMILIAR GROUND</span><strong>{Math.round(plan.familiarityTarget * 100)}<small> / {100 - Math.round(plan.familiarityTarget * 100)} discovery</small></strong></div><input aria-label="Familiarity balance" type="range" min="0" max="100" value={Math.round(plan.familiarityTarget * 100)} onChange={(event) => setPlan({ ...plan, familiarityTarget: Number(event.target.value) / 100 })} /></section>
            <section className="journey-impact"><div className="journey-section-heading"><div><span>IMPACT WINDOWS</span><h2>Moments with weight</h2></div></div><p>Proposed moments of salience—not measured dopamine.</p>{plan.impactWindows.map((window, index) => <label key={window.id}><input type="checkbox" checked={window.enabled} onChange={(event) => setPlan({ ...plan, impactWindows: plan.impactWindows.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.target.checked } : item) })} /><span>around</span><input aria-label="Impact minute" type="number" min="1" max={plan.durationMinutes - 1} value={window.minute} onChange={(event) => setPlan({ ...plan, impactWindows: plan.impactWindows.map((item, itemIndex) => itemIndex === index ? { ...item, minute: Number(event.target.value) } : item) })} /><strong>min</strong></label>)}</section>
            <details className="journey-tags"><summary><span><small>OPTIONAL DETAIL</small><strong>Fine-tune what Woody heard</strong></span><i>+</i></summary>{plan.anchors.map((anchor, anchorIndex) => <article key={anchor.track.id}><h3>{anchor.track.name}</h3>{TAG_CATEGORIES.map((category) => <label key={category}><span>{category}</span><input value={(anchor.confirmedTags[category] ?? anchor.suggestedTags[category] ?? []).join(', ')} onChange={(event) => updateTag(anchorIndex, category, event.target.value)} /></label>)}</article>)}</details>
            <div className="journey-actions"><button className="journey-button journey-button-quiet" onClick={() => setStage('setup')}>Back</button><button className="journey-button journey-button-primary" disabled={busy} onClick={() => void startJourney()}>{busy ? 'Preparing Spotify…' : mode === 'adaptive' ? 'Start this run' : 'Begin observation'} <i>→</i></button></div>
          </motion.section>
        )}

        {stage === 'active' && session && (
          <motion.section key="active" className="journey-active" initial={{ scale: .97 }} animate={{ scale: 1 }} exit={{ scale: .98 }}>
            <div className="journey-live"><span className="live-pulse" /><span>{session.status === 'paused_override' ? 'PAUSED FOR YOU' : session.plan.mode === 'adaptive' ? 'WOODY IS MOVING' : 'WOODY IS LISTENING'}</span></div>
            <div className="now-artwork">{player?.track?.albumArt ? <Image src={player.track.albumArt} alt={`${player.track.name} artwork`} width={640} height={640} unoptimized priority /> : <div className="now-artwork-empty" />}<JourneySignal mode={session.plan.mode} /></div>
            <div className="now-copy"><span>NOW PLAYING</span><h1>{player?.track?.name ?? 'Waiting for Spotify…'}</h1><p>{player?.track?.artist ?? 'Open Spotify and start playback'}</p>{player?.track && <div className="progress-track"><i style={{ width: `${fraction(player.progressMs, player.track.durationMs) * 100}%` }} /></div>}</div>
            <div className="journey-observation" aria-live="polite"><span className="observation-orbit" /><p><strong>{session.plan.mode === 'adaptive' ? 'One decision ahead' : 'Observation only'}</strong><small>{status || 'Headphone, Watch, and phone changes are observed automatically.'}</small></p></div>
            {overrideTrack && <motion.aside className="journey-override" initial={{ y: '100%' }} animate={{ y: 0 }}><span>YOU CHANGED DIRECTION</span><h2>Woody stopped rather than fighting you.</h2><p>Continue from <strong>{overrideTrack.name}</strong>, or finish here.</p><button className="journey-button journey-button-primary" disabled={busy} onClick={() => void resumeFromOverride()}>Follow this direction</button><button className="journey-button journey-button-quiet" onClick={endJourney}>End the run</button></motion.aside>}
            {!overrideTrack && <button className="journey-end" onClick={endJourney}>End run</button>}
          </motion.section>
        )}

        {stage === 'review' && session && (
          <motion.section key="review" className="journey-stack journey-afterglow" initial={{ y: 22 }} animate={{ y: 0 }} exit={{ y: -12 }}>
            <section className="afterglow-visual"><span className="afterglow-art">{reviewTrack?.albumArt && <Image src={reviewTrack.albumArt} alt="" width={120} height={120} unoptimized />}</span><svg viewBox="0 0 300 110" aria-hidden="true"><path d="M2 94C40 77 56 86 80 58s46 20 82-17 57 18 85-8 40-14 51-28" /><circle cx="162" cy="41" r="6" /></svg>{impactMinute && <strong>~{impactMinute} min</strong>}</section>
            <div className="journey-hero afterglow-heading"><span>AFTERGLOW · 04</span><h1>Your run left<br /><em>a shape.</em></h1><p>Woody observed {session.playedTrackIds.length} tracks and {interventionCount} manual {interventionCount === 1 ? 'change' : 'changes'}. Your answers remain a separate evidence channel.</p></div>

            <section className="review-signals">
              {([['timingSupport', 'Did the timing support you?', 'Not at all', 'Exactly'], ['manualManagementEffort', 'How much did you manage it?', 'None', 'Constant'], ['sustainedEffortSupport', 'Did it carry sustained effort?', 'Not enough', 'Carried me']] as const).map(([field, label, low, high]) => <fieldset key={field}><legend>{label}</legend><div>{[1,2,3,4,5].map((value) => <button type="button" aria-label={`${label}: ${value} of 5`} key={value} className={reviewAnswers.includes(field) && review[field] === value ? 'active' : ''} onClick={() => { setReview({ ...review, [field]: value }); setReviewAnswers((current) => current.includes(field) ? current : [...current, field]) }}>{value}</button>)}</div><p><span>{low}</span><span>{high}</span></p></fieldset>)}
            </section>

            <section className="review-moments"><label><span><i>✦</i><strong>A moment that landed</strong><small>Optional, but especially valuable</small></span><textarea value={review.impactMoments} onChange={(event) => setReview({ ...review, impactMoments: event.target.value })} placeholder="What happened, and when?" /></label><label><span><i>≈</i><strong>A moment that broke it</strong><small>Mistimed, generic, or distracting</small></span><textarea value={review.mistimedTransitions} onChange={(event) => setReview({ ...review, mistimedTransitions: event.target.value })} placeholder="What felt wrong?" /></label></section>

            <fieldset className="review-preference"><legend>Which would you choose for the next matched run?</legend><div>{([['adaptive', 'Woody'], ['control_observation', 'My queue'], ['no_preference', 'Not sure']] as const).map(([value, label]) => <button type="button" key={value} className={reviewAnswers.includes('preference') && review.overallPreference === value ? 'active' : ''} onClick={() => { setReview({ ...review, overallPreference: value }); setReviewAnswers((current) => current.includes('preference') ? current : [...current, 'preference']) }}>{label}</button>)}</div></fieldset>
            <section className="review-return"><span><small>NEXT TIME</small><strong>Would you take Woody again?</strong></span><div><button className={reviewAnswers.includes('chooseAgain') && review.chooseAdaptiveAgain ? 'active' : ''} onClick={() => { setReview({ ...review, chooseAdaptiveAgain: true }); setReviewAnswers((current) => current.includes('chooseAgain') ? current : [...current, 'chooseAgain']) }}>Yes</button><button className={reviewAnswers.includes('chooseAgain') && !review.chooseAdaptiveAgain ? 'active' : ''} onClick={() => { setReview({ ...review, chooseAdaptiveAgain: false }); setReviewAnswers((current) => current.includes('chooseAgain') ? current : [...current, 'chooseAgain']) }}>No</button></div></section>

            <button className="journey-button journey-button-primary journey-main-action" disabled={reviewAnswers.length < 5 || Boolean(session.review)} onClick={submitReview}>{session.review ? 'Evidence saved' : reviewAnswers.length < 5 ? `Answer ${5 - reviewAnswers.length} more` : 'Save this run'} <i>{session.review ? '✓' : '→'}</i></button>
            <section className="journey-run-print"><div><span>RUN PRINT</span><h2>A shareable trace,<br />not your private data.</h2><p>No route, listening history, or written reflection is included.</p></div><button disabled={!runPrint} onClick={() => void shareRunPrint()}>{runPrint ? 'Share or save PNG' : 'Building print…'} <i>↗</i></button>{shareStatus && <small>{shareStatus}</small>}</section>
            <button className="journey-button journey-button-quiet" onClick={setUpNextLeg}>Set up the next run</button>
            <details className="journey-data-tools"><summary>Session data</summary><button onClick={downloadExport}>Export journey JSON</button></details>
          </motion.section>
        )}
      </AnimatePresence>

      {error && <div className="journey-error" role="alert"><strong>Woody hit a snag.</strong><span>{error}</span></div>}
    </main>
  )
}
