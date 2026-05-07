'use client'

import { useState } from 'react'
import { saveSavePoint } from '@/lib/memory'
import type { Track } from '@/lib/types'

interface SavePointModalProps {
  open: boolean
  onClose: () => void
  sessionId: string | null
  /** Track playing when the user anchors; required for map persistence after refresh. */
  anchorTrack: Track | null
  /** Called after a save is written so the parent can refresh map memory from storage. */
  onSaved?: () => void
}

export function SavePointModal({ open, onClose, sessionId, anchorTrack, onSaved }: SavePointModalProps) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')

  if (!open) return null

  function handleAnchor() {
    if (!name.trim() || !anchorTrack || !sessionId?.trim()) return
    saveSavePoint({
      id: crypto.randomUUID(),
      name: name.trim(),
      note: note.trim() || undefined,
      sessionId: sessionId.trim(),
      createdAt: new Date(),
      trackId: anchorTrack.id,
      track: { ...anchorTrack },
    })
    setName('')
    setNote('')
    onSaved?.()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center px-6 bg-soil/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-point-title"
    >
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <div
          className="mb-10 w-24 h-24 rounded-full bg-amber/20 border border-amber/40 animate-breathe"
          style={{
            boxShadow: '0 0 32px rgba(196, 135, 74, 0.25)',
            animationDuration: '7s',
          }}
        />
        <h2
          id="save-point-title"
          className="font-serif italic text-2xl text-text-hi mb-8 leading-snug"
        >
          name this moment
        </h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="late night drive, april"
          className="w-full rounded-2xl border border-white/[0.08] bg-bark/90 px-4 py-3 text-sm text-text-hi placeholder:text-text-lo placeholder:italic font-sans mb-4 outline-none focus:border-white/15 transition-colors"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="a feeling, a colour, a temperature…"
          rows={3}
          className="w-full rounded-2xl border border-white/[0.08] bg-bark/90 px-4 py-3 text-sm text-text-hi placeholder:text-text-lo placeholder:italic font-sans mb-8 outline-none focus:border-white/15 transition-colors resize-none"
        />
        {!anchorTrack ? (
          <p className="mb-4 text-xs text-text-lo font-sans text-center">
            Play a track first — SavePoints anchor to what is playing now.
          </p>
        ) : !sessionId?.trim() ? (
          <p className="mb-4 text-xs text-text-lo font-sans text-center">
            Start a session from an intent so this moment can be found again.
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleAnchor}
          disabled={!anchorTrack || !name.trim() || !sessionId?.trim()}
          className="w-full rounded-2xl bg-bark-light border border-white/[0.1] py-3.5 text-sm font-sans text-text-hi hover:border-amber/40 transition-colors duration-300 disabled:opacity-40 disabled:pointer-events-none"
        >
          Anchor to map
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-xs text-text-lo font-sans tracking-wide uppercase"
        >
          close
        </button>
      </div>
    </div>
  )
}
