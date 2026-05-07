'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { subscribePlayerState, woodyPlayer } from '@/lib/player'

interface MiniPlayerProps {
  onSaveClick?: () => void
  onNext?: () => void
  onPrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
  onReject?: (trackId: string) => void
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function MiniPlayer({
  onSaveClick,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
  onReject,
}: MiniPlayerProps) {
  const [paused, setPaused] = useState(true)
  const [title, setTitle] = useState<string | null>(null)
  const [artist, setArtist] = useState<string | null>(null)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [albumArt, setAlbumArt] = useState<string | null>(null)
  const [trackId, setTrackId] = useState<string | null>(null)
  const seekBarRef = useRef<HTMLDivElement>(null)

  const sync = useCallback(async () => {
    const state = await woodyPlayer.getState()
    const t = state?.track_window?.current_track
    setPaused(state?.paused ?? true)
    setTitle(t?.name ?? null)
    setArtist(t?.artists?.map((a) => a.name).join(', ') ?? null)
    setPosition(state?.position ?? 0)
    setDuration(state?.duration ?? 0)
    setAlbumArt((t as any)?.album?.images?.[0]?.url ?? null)
    setTrackId((t as any)?.id ?? null)
  }, [])

  useEffect(() => {
    void sync()
    return subscribePlayerState(() => {
      void sync()
    })
  }, [sync])

  const hasTrack = Boolean(title)

  const seekPercent = duration > 0 ? (position / duration) * 100 : 0

  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = seekBarRef.current
    if (!el || !hasTrack || duration <= 0) return
    const rect = el.getBoundingClientRect()
    const width = rect.width
    if (width <= 0) return
    const fraction = clamp((e.clientX - rect.left) / width, 0, 1)
    const targetMs = fraction * duration
    const wp = woodyPlayer as any
    if (typeof wp.seek === 'function') void wp.seek(targetMs)
  }

  const handleSkipPrev = () => {
    if (!hasTrack) return
    if (onPrev) {
      onPrev()
      return
    }
    const wp = woodyPlayer as any
    if (typeof wp.skipPrev === 'function') void wp.skipPrev()
  }

  const handleSkipNext = () => {
    if (!hasTrack) return
    if (onNext) {
      onNext()
      return
    }
    const wp = woodyPlayer as any
    if (typeof wp.skipNext === 'function') void wp.skipNext()
  }

  const transportDisabled = !hasTrack
  const prevDisabled = transportDisabled || (onPrev !== undefined && !hasPrev)
  const nextDisabled = transportDisabled || (onNext !== undefined && !hasNext)

  return (
    <div
      className={`fixed left-0 right-0 z-[31] px-5 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0,0,0.2,1)] ${
        hasTrack ? 'translate-y-0 opacity-100' : 'translate-y-full pointer-events-none opacity-0'
      }`}
      style={{
        bottom: 'calc(7.5rem + env(safe-area-inset-bottom, 0px))',
      }}
      aria-hidden={!hasTrack}
    >
      <div className="max-w-lg mx-auto flex flex-col">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-bark/90 backdrop-blur-xl px-4 py-3 min-h-[60px]">
          {albumArt ? (
            <img
              src={albumArt}
              alt=""
              className="w-9 h-9 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="w-9 h-9 shrink-0 rounded-lg bg-bark-light" aria-hidden />
          )}
          <div className="flex-1 min-w-0 text-left">
            {hasTrack ? (
              <>
                <p className="text-sm font-medium text-text-hi truncate leading-snug font-sans">{title}</p>
                <p className="text-xs text-text-mid truncate mt-0.5 tracking-wide font-sans">{artist}</p>
              </>
            ) : (
              <p className="text-xs text-text-lo font-sans"> </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleSkipPrev}
              disabled={prevDisabled}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-xs text-text-hi font-sans hover:border-white/15 transition-colors duration-200 disabled:opacity-40"
              aria-label="Previous track"
            >
              ◀◀
            </button>
            <button
              type="button"
              onClick={() => void (paused ? woodyPlayer.resume() : woodyPlayer.pause())}
              disabled={transportDisabled}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bark-light border border-white/[0.08] text-text-hi text-sm font-medium font-sans hover:border-white/15 transition-colors duration-200 disabled:opacity-40"
              aria-label={paused ? 'Play' : 'Pause'}
            >
              {paused ? '▶' : '❚❚'}
            </button>
            <button
              type="button"
              onClick={handleSkipNext}
              disabled={nextDisabled}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-xs text-text-hi font-sans hover:border-white/15 transition-colors duration-200 disabled:opacity-40"
              aria-label="Next track"
            >
              ▶▶
            </button>
          </div>
          {onReject && trackId && (
            <button
              type="button"
              onClick={() => onReject(trackId)}
              className="flex-shrink-0 w-10 h-10 rounded-full border border-white/[0.08] text-text-mid hover:text-rose/80 hover:border-rose/30 transition-colors duration-200"
              aria-label="Reject track"
              title="Not this"
            >
              <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6M9 9l6 6" />
              </svg>
            </button>
          )}
          {onSaveClick && (
            <button
              type="button"
              onClick={onSaveClick}
              className="flex-shrink-0 w-10 h-10 rounded-full border border-white/[0.08] text-text-mid hover:text-text-hi hover:border-white/15 transition-colors duration-200"
              aria-label="Save moment"
            >
              <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 20V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15l-6-3-6 3Z" />
              </svg>
            </button>
          )}
        </div>
        <div
          ref={seekBarRef}
          role="presentation"
          className="relative h-0.5 w-full cursor-pointer rounded-full bg-white/[0.08]"
          onClick={handleSeekBarClick}
        >
          <div
            className="h-full rounded-full bg-text-mid"
            style={{ width: `${seekPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
