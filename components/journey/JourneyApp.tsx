'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  initialPlaybackObserver,
  reducePlaybackObservation,
  type PlaybackObservation,
  type PlaybackObserverState,
} from '@/lib/playbackObserver'
import { exportJourneySessions, saveJourneySession } from '@/lib/journeyStorage'
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
  const [review, setReview] = useState<Omit<JourneyRunReview, 'submittedAt'>>({
    pairNumber: 1,
    pairLeg: 1,
    timingSupport: 3,
    manualManagementEffort: 3,
    sustainedEffortSupport: 3,
    impactMoments: '',
    mistimedTransitions: '',
    overallPreference: 'no_preference',
    chooseAdaptiveAgain: false,
  })

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
    api<{ connected: true }>('/api/auth/token').then(() => setConnected(true)).catch(() => setConnected(false))
  }, [])

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
    if (!current) return
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

  return (
    <main className="journey-shell">
      <header className="journey-header">
        <div><span className="journey-kicker">PRIVATE V0</span><h1>Woody</h1></div>
        <span className={connected ? 'status-dot status-ok' : 'status-dot'}>{connected ? 'Spotify connected' : 'Spotify offline'}</span>
      </header>

      {connected === false && (
        <section className="journey-card journey-callout">
          <h2>Connect Spotify first</h2>
          <p>Woody controls the official Spotify app. Premium and an active iPhone device are required.</p>
          <a className="journey-button" href="/api/auth/login">Connect Spotify</a>
        </section>
      )}

      {stage === 'setup' && connected !== false && (
        <section className="journey-stack">
          <div className="journey-hero"><span>RUN COMPANION</span><h2>Shape the journey.<br />Keep your hands free.</h2><p>Adaptive sequencing versus your normal queue, measured in paired runs.</p></div>
          <div className="journey-card">
            <h3>Paired test</h3>
            <div className="journey-grid-two">
              <label>Pair<select value={pairNumber} onChange={(event) => setPairNumber(Number(event.target.value) as 1 | 2 | 3 | 4)}>{[1,2,3,4].map((number) => <option key={number} value={number}>{number}</option>)}</select></label>
              <label>Leg<select value={pairLeg} onChange={(event) => setPairLeg(Number(event.target.value) as 1 | 2)}><option value={1}>1</option><option value={2}>2</option></select></label>
            </div>
            <p className="journey-note">Required mode: <strong>{mode === 'adaptive' ? 'Adaptive' : 'Control observation'}</strong>. Order is A/C, C/A, A/C, C/A.</p>
          </div>
          <div className="journey-card">
            <label>What should this run feel like?<textarea value={intent} onChange={(event) => setIntent(event.target.value)} placeholder="Steady confidence, then one properly timed release…" maxLength={1000} /></label>
            <label>Planned duration<div className="journey-range"><input type="range" min="10" max="120" step="5" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} /><strong>{durationMinutes} min</strong></div></label>
          </div>
          <div className="journey-card">
            <h3>Anchor tracks <small>{anchors.length}/3</small></h3>
            {anchors.map((anchor, index) => (
              <div className="anchor-row" key={anchor.track.id}>
                {anchor.track.albumArt && <Image src={anchor.track.albumArt} alt="" width={54} height={54} unoptimized />}
                <div className="anchor-copy"><strong>{anchor.track.name}</strong><span>{anchor.track.artist}</span><textarea value={anchor.note} onChange={(event) => setAnchors((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, note: event.target.value } : item))} placeholder="What should Woody take from this? (optional)" /></div>
                <div className="anchor-actions"><label><input type="radio" checked={anchor.role === 'opener'} onChange={() => setAnchors((current) => current.map((item, itemIndex) => ({ ...item, role: itemIndex === index ? 'opener' : 'reference' })))} /> opener</label><button onClick={() => setAnchors((current) => current.filter((item) => item.track.id !== anchor.track.id))}>Remove</button></div>
              </div>
            ))}
            {anchors.length < 3 && <div className="search-box"><div className="search-line"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void search() }} placeholder="Search Spotify" /><button onClick={() => void search()} disabled={busy}>Search</button></div>{searchResults.map((track) => <button className="search-result" key={track.id} onClick={() => addAnchor(track)}><span>{track.name}</span><small>{track.artist}</small></button>)}</div>}
          </div>
          <button className="journey-button journey-button-primary" disabled={busy || intent.trim().length < 3 || anchors.length < 1} onClick={() => void buildPreview()}>{busy ? 'Interpreting…' : 'Preview journey'}</button>
        </section>
      )}

      {stage === 'preview' && plan && (
        <section className="journey-stack">
          <div className="journey-hero"><span>EDIT BEFORE MOVING</span><h2>The shape, not the surprise.</h2><p>Upcoming tracks stay hidden. Every assumption here is editable.</p></div>
          <div className="journey-card"><h3>Journey phases</h3>{plan.phases.map((phase, index) => <div className="phase-row" key={phase.id}><input type="checkbox" checked={phase.accepted} onChange={(event) => setPlan({ ...plan, phases: plan.phases.map((item, itemIndex) => itemIndex === index ? { ...item, accepted: event.target.checked } : item) })} /><div><strong>{phase.label} · {phase.startMinute}–{phase.endMinute} min</strong><textarea value={phase.description} onChange={(event) => setPlan({ ...plan, phases: plan.phases.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) })} /></div></div>)}</div>
          <div className="journey-card"><h3>Familiar / discovery</h3><div className="journey-range"><input type="range" min="0" max="100" value={Math.round(plan.familiarityTarget * 100)} onChange={(event) => setPlan({ ...plan, familiarityTarget: Number(event.target.value) / 100 })} /><strong>{Math.round(plan.familiarityTarget * 100)} / {100 - Math.round(plan.familiarityTarget * 100)}</strong></div></div>
          <div className="journey-card"><h3>Impact windows</h3><p className="journey-note">Proposed moments of impact or salience—not measured dopamine.</p>{plan.impactWindows.map((window, index) => <div className="impact-row" key={window.id}><input type="checkbox" checked={window.enabled} onChange={(event) => setPlan({ ...plan, impactWindows: plan.impactWindows.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.target.checked } : item) })} /><input type="number" min="1" max={plan.durationMinutes - 1} value={window.minute} onChange={(event) => setPlan({ ...plan, impactWindows: plan.impactWindows.map((item, itemIndex) => itemIndex === index ? { ...item, minute: Number(event.target.value) } : item) })} /><span>minutes</span></div>)}</div>
          {plan.anchors.map((anchor, anchorIndex) => <div className="journey-card" key={anchor.track.id}><h3>{anchor.track.name}</h3><p className="journey-note">Suggested structure from your note. Edit, delete, or confirm it.</p>{TAG_CATEGORIES.map((category) => <label key={category}>{category}<input value={(anchor.confirmedTags[category] ?? anchor.suggestedTags[category] ?? []).join(', ')} onChange={(event) => updateTag(anchorIndex, category, event.target.value)} /></label>)}</div>)}
          <div className="journey-actions"><button className="journey-button journey-button-quiet" onClick={() => setStage('setup')}>Back</button><button className="journey-button journey-button-primary" disabled={busy} onClick={() => void startJourney()}>{busy ? 'Starting…' : mode === 'adaptive' ? 'Start adaptive run' : 'Start control observation'}</button></div>
        </section>
      )}

      {stage === 'active' && session && (
        <section className="journey-stack journey-active">
          <div className="journey-live"><span className="live-pulse" /><span>{session.plan.mode === 'adaptive' ? 'ADAPTIVE' : 'CONTROL'} · {session.status === 'paused_override' ? 'PAUSED' : 'OBSERVING'}</span></div>
          <div className="now-card">{player?.track?.albumArt && <Image src={player.track.albumArt} alt="" width={480} height={480} unoptimized />}<span>NOW PLAYING</span><h2>{player?.track?.name ?? 'Waiting for Spotify…'}</h2><p>{player?.track?.artist ?? 'Open Spotify and start playback'}</p>{player?.track && <div className="progress-track"><i style={{ width: `${fraction(player.progressMs, player.track.durationMs) * 100}%` }} /></div>}</div>
          <div className="journey-card"><h3>What Woody is doing</h3><p>{status}</p><p className="journey-note">No live rating required. Headphone, Watch, and phone skips are observed through Spotify state.</p></div>
          {overrideTrack && <div className="journey-card journey-callout"><h3>You changed direction</h3><p>Automation stopped rather than fighting your choice.</p><button className="journey-button journey-button-primary" disabled={busy} onClick={() => void resumeFromOverride()}>Resume from this track</button><button className="journey-button journey-button-quiet" onClick={endJourney}>End session</button></div>}
          {!overrideTrack && <button className="journey-button journey-button-danger" onClick={endJourney}>End run</button>}
        </section>
      )}

      {stage === 'review' && session && (
        <section className="journey-stack">
          <div className="journey-hero"><span>REALITY CONTACT</span><h2>How did it actually work?</h2><p>Self-report stays separate from playback behavior.</p></div>
          <div className="journey-card review-card">
            {([['timingSupport', 'Perceived timing / support'], ['manualManagementEffort', 'Manual-management effort'], ['sustainedEffortSupport', 'Sustained-effort support']] as const).map(([field, label]) => <label key={field}>{label}<input type="range" min="1" max="5" value={review[field]} onChange={(event) => setReview({ ...review, [field]: Number(event.target.value) })} /><strong>{review[field]} / 5</strong></label>)}
            <label>Specifically well-timed impact moments<textarea value={review.impactMoments} onChange={(event) => setReview({ ...review, impactMoments: event.target.value })} /></label>
            <label>Mistimed or generic transitions<textarea value={review.mistimedTransitions} onChange={(event) => setReview({ ...review, mistimedTransitions: event.target.value })} /></label>
            <label>Overall preference<select value={review.overallPreference} onChange={(event) => setReview({ ...review, overallPreference: event.target.value as JourneyRunReview['overallPreference'] })}><option value="adaptive">Adaptive</option><option value="control_observation">Control</option><option value="no_preference">No preference yet</option></select></label>
            <label className="check-line"><input type="checkbox" checked={review.chooseAdaptiveAgain} onChange={(event) => setReview({ ...review, chooseAdaptiveAgain: event.target.checked })} /> I would choose adaptive for another run</label>
          </div>
          <button className="journey-button journey-button-primary" onClick={submitReview}>Save run evidence</button>
          <button className="journey-button journey-button-quiet" onClick={downloadExport}>Export journey JSON</button>
          <button className="journey-button journey-button-quiet" onClick={() => { setStage('setup'); setPlan(null); setSession(null); setPlayer(null); setOverrideTrack(null); setError(''); setStatus('') }}>Set up matched leg</button>
        </section>
      )}

      {error && <div className="journey-error" role="alert">{error}</div>}
      <footer>Private prototype · Running first · One-decision lookahead</footer>
    </main>
  )
}
