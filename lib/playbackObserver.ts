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
  skipSignal?: { trackId: string; weight: number }
  overrideTrack?: Track
  consumedExpectedDecision: boolean
}

function fraction(observation: PlaybackObservation): number {
  const duration = observation.track?.durationMs ?? 0
  if (duration <= 0) return 0
  return Math.max(0, Math.min(1, observation.progressMs / duration))
}

function endedWithinPollingWindow(observation: PlaybackObservation): boolean {
  const duration = observation.track?.durationMs ?? 0
  return duration > 0 && duration - observation.progressMs <= 7_000
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
    return { state: { ...state, previous: observation }, events: [], consumedExpectedDecision: false }
  }

  if (!state.previous?.track) {
    return {
      state: {
        ...state,
        previous: observation,
        currentDecisionId: state.expectedTrackId === observation.track.id ? state.expectedDecisionId : null,
      },
      events: [{
        version: 1,
        timestamp: observation.observedAt,
        eventType: 'track_started',
        track: observation.track,
        rawPositionMs: observation.progressMs,
        rawDurationMs: observation.track.durationMs,
        listenedFraction: fraction(observation),
        initiatingSource: state.expectedTrackId === observation.track.id ? 'woody' : 'spotify',
        decisionId: state.expectedDecisionId ?? undefined,
      }],
      consumedExpectedDecision: state.expectedTrackId === observation.track.id,
    }
  }

  if (state.previous.track.id === observation.track.id) {
    return { state: { ...state, previous: observation }, events: [], consumedExpectedDecision: false }
  }

  const listenedFraction = fraction(state.previous)
  const completed = endedWithinPollingWindow(state.previous)
  const expected = state.expectedTrackId === observation.track.id
  const transitionEvent: JourneyEventV1 = {
    version: 1,
    timestamp: observation.observedAt,
    eventType: completed ? 'track_completed' : 'manual_transition',
    track: state.previous.track,
    rawPositionMs: state.previous.progressMs,
    rawDurationMs: state.previous.track.durationMs,
    listenedFraction,
    initiatingSource: completed ? 'spotify' : 'user',
    decisionId: state.currentDecisionId ?? undefined,
  }
  const events: JourneyEventV1[] = [transitionEvent]
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
    initiatingSource: expected ? 'woody' : 'user',
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
    ...(completed ? {} : { skipSignal: { trackId: state.previous.track.id, weight: 1 - listenedFraction } }),
    ...(overrideTrack ? { overrideTrack } : {}),
    consumedExpectedDecision: expected,
  }
}
