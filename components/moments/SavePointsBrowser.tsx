'use client'

import type { SavePoint } from '@/lib/types'

function formatWhen(d: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return d.toISOString().slice(0, 16)
  }
}

function SavePointList({
  savePoints,
  onRestore,
}: {
  savePoints: SavePoint[]
  onRestore: (sp: SavePoint) => void
}) {
  const sorted = [...savePoints].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  if (sorted.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-text-mid leading-relaxed">
        No named moments yet. When something on the map hits, save it from the player — it
        will land here so you can return without hunting the globe.
      </p>
    )
  }

  return (
    <ul className="space-y-1">
      {sorted.map((sp) => {
        const title = sp.track ? `${sp.track.name} — ${sp.track.artist}` : 'Track unknown'
        return (
          <li key={sp.id}>
            <button
              type="button"
              onClick={() => onRestore(sp)}
              className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-white/[0.06] transition-colors"
            >
              <span className="block text-sm text-text-hi font-medium">{sp.name}</span>
              <span className="block text-[11px] text-text-lo mt-0.5">{formatWhen(sp.createdAt)}</span>
              <span className="block text-[11px] text-text-mid mt-1 truncate">{title}</span>
              {sp.note ? (
                <span className="block text-[11px] text-text-lo mt-1 line-clamp-2 italic">{sp.note}</span>
              ) : null}
              <span className="block text-[10px] text-amber/90 mt-1.5 uppercase tracking-widest">
                Return to territory
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function SavePointsBrowser({
  open,
  onClose,
  savePoints,
  onRestore,
  embedded = false,
}: {
  open: boolean
  onClose: () => void
  savePoints: SavePoint[]
  onRestore: (sp: SavePoint) => void
  /** When true: renders inline list only (no modal overlay). Used inside PortalSheet. */
  embedded?: boolean
}) {
  if (!open) return null

  if (embedded) {
    return (
      <div className="font-sans">
        <SavePointList savePoints={savePoints} onRestore={onRestore} />
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[38] flex items-end justify-center px-4 pt-16 pb-8 sm:items-center sm:pb-12 bg-soil/88 backdrop-blur-sm font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="moments-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md max-h-[min(70vh,28rem)] flex flex-col rounded-2xl border border-white/[0.1] bg-bark/98 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
          <h2 id="moments-title" className="text-sm font-medium text-text-hi tracking-wide uppercase">
            Moments
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs text-text-lo hover:bg-white/[0.06] hover:text-text-hi"
          >
            Close
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-2 py-2">
          <SavePointList savePoints={savePoints} onRestore={onRestore} />
        </div>
      </div>
    </div>
  )
}
