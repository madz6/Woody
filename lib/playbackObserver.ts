import type { JourneyEventV1, JourneySessionMode, Track } from './types'

export interface PlaybackObservation {
  track: Track | null
  progressMs: number
  isPlaying: boolean
  observedAt: string
}

export interface PlaybackObserverState {
  previous: PlaybackObservation | null
  expectedTrackId: string | null
  expectedDecisionId: string | null
  currentDecisionId: string | null
  mode: JourneySessionMode
  pausedForOverride: boolean
}

export interface PlaybackReduction {
  state: PlaybackObserverState
  events: JourneyEventV1[]
  playbackDeltaMs: number
  observationGap: boolean
  skipSignal?: { trackId: string; weight: number }
  overrideTrack?: Track
  consumedExpectedDecision: boolean
}

const MAX_TRUSTED_OBSERVATION_GAP_MS = 15_000

function fraction(observation: PlaybackObservation): number {
  const duration = observation.track?.durationMs ?? 0
  if (duration <= 0) return 0
  return Math.max(0, Math.min(1, observation.progressMs / duration))
}

function endedWithinPollingWindow(observation: PlaybackObservation): boolean {
  const duration = observation.track?.durationMs ?? 0
  return duration > 0 && duration - observation.progressMs <= 7_000
}

function elapsedBetween(previous: PlaybackObservation, current: PlaybackObservation): number {
  const elapsed = Date.parse(current.observedAt) - Date.parse(previous.observedAt)
  return Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0
}

export function initialPlaybackObserver(mode: JourneySessionMode): PlaybackObserverState {
  return {
    previous: null,
    expectedTrackId: null,
    expectedDecisionId: null,
    currentDecisionId: null,
    mode,
    pausedForOverride: false,
  }
}

export function reducePlaybackObservation(
  state: PlaybackObserverState,
  observation: PlaybackObservation,
): PlaybackReduction {
  if (!observation.track) {
    return {
      state: { ...state, previous: observation },
      events: [],
      playbackDeltaMs: 0,
      observationGap: false,
      consumedExpectedDecision: false,
    }
  }

  if (!state.previous?.track) {
    const expected = state.expectedTrackId === observation.track.id
    return {
      state: {
        ...state,
        previous: observation,
        currentDecisionId: expected ? state.expectedDecisionId : null,
      },
      events: [{
        version: 1,
        timestamp: observation.observedAt,
        eventType: 'track_started',
        track: observation.track,
        rawPositionMs: observation.progressMs,
        rawDurationMs: observation.track.durationMs,
        listenedFraction: fraction(observation),
        initiatingSource: expected ? 'woody' : 'spotify',
        decisionId: expected ? state.expectedDecisionId ?? undefined : undefined,
      }],
      playbackDeltaMs: 0,
      observationGap: false,
      consumedExpectedDecision: expected,
    }
  }

  const observationElapsed = elapsedBetween(state.previous, observation)
  const observationGap = observationElapsed > MAX_TRUSTED_OBSERVATION_GAP_MS
  if (state.previous.track.id === observation.track.id) {
    const progressDelta = observation.progressMs - state.previous.progressMs
    const playbackDeltaMs = !observationGap && state.previous.isPlaying && progressDelta > 0
      ? Math.min(progressDelta, state.previous.track.durationMs)
      : 0
    return {
      state: { ...state, previous: observation },
      events: observationGap ? [{
        version: 1,
        timestamp: observation.observedAt,
        eventType: 'observation_gap',
        track: observation.track,
        rawPositionMs: observation.progressMs,
        rawDurationMs: observation.track.durationMs,
        initiatingSource: 'system',
      }] : [],
      playbackDeltaMs,
      observationGap,
      consumedExpectedDecision: false,
    }
  }

  const listenedFraction = fraction(state.previous)
  const completed = !observationGap && endedWithinPollingWindow(state.previous)
  const expected = state.expectedTrackId === observation.track.id
  const earlyExpected = expected && !completed
  const events: JourneyEventV1[] = []
  if (observationGap) {
    events.push({
      version: 1,
      timestamp: observation.observedAt,
      eventType: 'observation_gap',
      track: state.previous.track,
      rawPositionMs: state.previous.progressMs,
      rawDurationMs: state.previous.track.durationMs,
      listenedFraction,
      initiatingSource: 'system',
      decisionId: state.currentDecisionId ?? undefined,
    })
  } else {
    events.push({
      version: 1,
      timestamp: observation.observedAt,
      eventType: completed ? 'track_completed' : 'manual_transition',
      track: state.previous.track,
      rawPositionMs: state.previous.progressMs,
      rawDurationMs: state.previous.track.durationMs,
      listenedFraction,
      initiatingSource: completed ? 'spotify' : 'user',
      decisionId: state.currentDecisionId ?? undefined,
    })
    if (expected && completed) {
      events.push({
        version: 1,
        timestamp: observation.observedAt,
        eventType: 'expected_queued_transition',
        track: observation.track,
        rawPositionMs: observation.progressMs,
        rawDurationMs: observation.track.durationMs,
        initiatingSource: 'woody',
        decisionId: state.expectedDecisionId ?? undefined,
      })
    }
  }

  let pausedForOverride = state.pausedForOverride
  let overrideTrack: Track | undefined
  if (state.mode === 'adaptive' && !expected) {
    pausedForOverride = true
    overrideTrack = observation.track
    events.push({
      version: 1,
      timestamp: observation.observedAt,
      eventType: 'user_override',
      track: observation.track,
      rawPositionMs: observation.progressMs,
      rawDurationMs: observation.track.durationMs,
      listenedFraction: fraction(observation),
      initiatingSource: 'user',
    })
  }

  events.push({
    version: 1,
    timestamp: observation.observedAt,
    eventType: 'track_started',
    track: observation.track,
    rawPositionMs: observation.progressMs,
    rawDurationMs: observation.track.durationMs,
    listenedFraction: fraction(observation),
    initiatingSource: expected ? (earlyExpected ? 'user' : 'woody') : 'user',
    decisionId: expected ? state.expectedDecisionId ?? undefined : undefined,
  })

  return {
    state: {
      ...state,
      previous: observation,
      expectedTrackId: expected ? null : state.expectedTrackId,
      expectedDecisionId: expected ? null : state.expectedDecisionId,
      currentDecisionId: expected ? state.expectedDecisionId : null,
      pausedForOverride,
    },
    events,
    playbackDeltaMs: 0,
    observationGap,
    ...(!completed && !observationGap ? { skipSignal: { trackId: state.previous.track.id, weight: 1 - listenedFraction } } : {}),
    ...(overrideTrack ? { overrideTrack } : {}),
    consumedExpectedDecision: expected,
  }
}
