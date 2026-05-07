'use client'

import { useState } from 'react'
import type { MapNodeData } from '@/components/map/useMapNodes'
import type { EnrichedTrackData } from '@/lib/enrichment'
import { enrichmentSummaryLine } from '@/lib/enrichment'

type KeyCompat = 'compatible' | 'same' | 'distant'

function camelotCompat(a: string | undefined, b: string | undefined): KeyCompat | null {
  if (!a || !b) return null
  const normA = a.trim().toUpperCase()
  const normB = b.trim().toUpperCase()
  if (normA === normB) return 'same'
  // Camelot slot = leading digits, ring = trailing letter
  const matchA = normA.match(/^(\d{1,2})([AB])$/)
  const matchB = normB.match(/^(\d{1,2})([AB])$/)
  if (!matchA || !matchB) return null
  const slotA = parseInt(matchA[1], 10)
  const ringA = matchA[2]
  const slotB = parseInt(matchB[1], 10)
  const ringB = matchB[2]
  const slotDiff = Math.abs(((slotA - slotB + 12) % 12))
  const normalizedDiff = Math.min(slotDiff, 12 - slotDiff)
  // Compatible: same slot different ring, or ±1 on same or different ring
  if ((normalizedDiff === 0 && ringA !== ringB) || (normalizedDiff === 1)) return 'compatible'
  return 'distant'
}

function splitLabel(label: string): { title: string; subtitle: string } {
  const sep = ' -- '
  const i = label.indexOf(sep)
  if (i === -1) return { title: label, subtitle: '' }
  return { title: label.slice(0, i), subtitle: label.slice(i + sep.length) }
}

export function SessionQueuePanel({
  open,
  onToggle,
  queue,
  currentIndex,
  onPick,
  onMoveUp,
  onMoveDown,
  onClear,
  onQueueAll,
  canQueueAll,
  enrichmentByTrackId,
  onReorder,
}: {
  open: boolean
  onToggle: () => void
  queue: MapNodeData[]
  currentIndex: number
  onPick: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onClear: () => void
  onQueueAll: () => void
  canQueueAll: boolean
  enrichmentByTrackId?: Record<string, EnrichedTrackData>
  onReorder?: (fromIndex: number, toIndex: number) => void
}) {
  const count = queue.length
  const [dragFrom, setDragFrom] = useState<number | null>(null)

  return (
    <div
      className="fixed right-4 z-[32] flex flex-col items-end gap-1 pointer-events-auto font-sans"
      style={{ bottom: 'calc(11.25rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="rounded-full border border-white/[0.1] bg-bark/95 px-3.5 py-2 text-[11px] font-medium uppercase tracking-widest text-text-mid hover:text-text-hi hover:border-white/20 transition-colors shadow-md"
      >
        queue{count > 0 ? ` . ${count}` : ''}
      </button>
      {open && (
        <div className="w-[min(20rem,calc(100vw-2rem))] max-h-[min(22rem,45vh)] overflow-y-auto rounded-2xl border border-white/[0.1] bg-bark/95 backdrop-blur-xl px-2.5 py-2.5 shadow-xl">
          <div className="flex flex-wrap items-center gap-2 justify-between mb-2 border-b border-white/[0.06] pb-2.5">
            <p className="text-[10px] text-text-lo uppercase tracking-widest pl-1">session</p>
            <div className="flex flex-wrap gap-1 justify-end">
              <button
                type="button"
                onClick={onQueueAll}
                disabled={!canQueueAll}
                className="rounded-lg px-2.5 py-1 text-[10px] uppercase tracking-wide text-text-mid hover:bg-white/[0.06] hover:text-text-hi disabled:opacity-35"
              >
                queue all
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={count === 0}
                className="rounded-lg px-2.5 py-1 text-[10px] uppercase tracking-wide text-text-mid hover:bg-white/[0.06] hover:text-text-hi disabled:opacity-35"
              >
                clear
              </button>
            </div>
          </div>
          {count === 0 ? (
            <p className="px-2 py-3 text-[11px] text-text-lo text-right leading-relaxed">
              Tap a suggestion on the map to play -- the rest of the list can follow here.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {queue.map((n, i) => {
                const { title, subtitle } = splitLabel(n.label)
                const active = i === currentIndex
                const hint = enrichmentSummaryLine(enrichmentByTrackId?.[n.trackId])
                const dragging = dragFrom === i
                // Harmonic web badge: transition from previous track
                const prev = i > 0 ? queue[i - 1] : null
                const keyCompat = prev ? camelotCompat(prev.keyHint, n.keyHint) : null
                const bpmDelta =
                  prev?.bpmHint != null && n.bpmHint != null
                    ? Math.round(n.bpmHint - prev.bpmHint)
                    : null
                const showBadge = keyCompat !== null || bpmDelta !== null
                return (
                  <li
                    key={`${n.id}-${i}`}
                    onDragOver={(e) => {
                      if (!onReorder) return
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(e) => {
                      if (!onReorder) return
                      e.preventDefault()
                      const raw = e.dataTransfer.getData('text/plain')
                      const from = raw ? parseInt(raw, 10) : dragFrom
                      setDragFrom(null)
                      if (from == null || Number.isNaN(from) || from === i) return
                      onReorder(from, i)
                    }}
                    className="rounded-lg"
                  >
                    {showBadge && (
                      <div className="flex items-center gap-1 px-2 py-0.5 text-[9px] text-text-lo/70">
                        {keyCompat === 'compatible' && (
                          <span className="text-[#4E6B45]" title="Compatible keys">●</span>
                        )}
                        {keyCompat === 'same' && (
                          <span className="text-[#C4874A]" title="Same key">◐</span>
                        )}
                        {keyCompat === 'distant' && (
                          <span className="text-[#8C5C5C]/50" title="Distant keys">○</span>
                        )}
                        {prev?.keyHint && n.keyHint && (
                          <span>{prev.keyHint} → {n.keyHint}</span>
                        )}
                        {bpmDelta !== null && (
                          <span className="ml-1">{bpmDelta > 0 ? '+' : ''}{bpmDelta} BPM</span>
                        )}
                      </div>
                    )}
                    <div
                      className={`flex items-stretch gap-0.5 rounded-lg px-1 py-1 text-left ${
                        active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                      } ${dragging ? 'opacity-50' : ''}`}
                    >
                      {onReorder && count > 1 ? (
                        <span
                          draggable
                          role="button"
                          tabIndex={0}
                          onDragStart={(e) => {
                            setDragFrom(i)
                            e.dataTransfer.effectAllowed = 'move'
                            e.dataTransfer.setData('text/plain', String(i))
                          }}
                          onDragEnd={() => setDragFrom(null)}
                          className="flex w-6 shrink-0 cursor-grab active:cursor-grabbing touch-none items-center justify-center text-text-lo hover:text-text-mid transition-colors"
                          aria-label="Drag to reorder"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                            <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
                          </svg>
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onPick(i)}
                        className="min-w-0 flex-1 text-left px-2 py-1"
                      >
                        <p className={`truncate text-[11px] leading-tight ${active ? 'text-text-hi' : 'text-text-mid'}`}>
                          {title}
                        </p>
                        {subtitle && (
                          <p className="truncate text-[10px] text-text-lo leading-tight mt-0.5">{subtitle}</p>
                        )}
                        {hint && (
                          <p className="truncate text-[9px] text-text-lo/60 leading-tight mt-0.5">{hint}</p>
                        )}
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5 pr-1">
                        {i > 0 && onMoveUp && (
                          <button
                            type="button"
                            onClick={() => onMoveUp(i)}
                            className="p-1 text-text-lo hover:text-text-mid transition-colors"
                            aria-label="Move up"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
                          </button>
                        )}
                        {i < count - 1 && onMoveDown && (
                          <button
                            type="button"
                            onClick={() => onMoveDown(i)}
                            className="p-1 text-text-lo hover:text-text-mid transition-colors"
                            aria-label="Move down"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
