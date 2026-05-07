'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SavePointsBrowser } from '@/components/moments/SavePointsBrowser'
import { SpotifyLoginNav } from '@/components/auth/SpotifyLoginNav'
import type { ListeningContext, SavePoint } from '@/lib/types'

const CONTEXT_OPTIONS: { id: ListeningContext; label: string; description: string }[] = [
  { id: 'just_listening',  label: 'Desk',    description: 'focused or ambient' },
  { id: 'running',         label: 'Running', description: 'low-bandwidth, continuous' },
  { id: 'working',         label: 'Working', description: 'low-bandwidth, background' },
  { id: 'exploring',       label: 'Explore', description: 'discovery mode' },
]

const ACOUSTIC_STATUS_LABEL: Record<'on' | 'off' | 'checking', string> = {
  on:       'Acoustic service active',
  off:      'Acoustic service offline',
  checking: 'Acoustic service checking',
}

interface PortalSheetProps {
  open: boolean
  onClose: () => void
  hasSpotify: boolean | null
  listeningContext: ListeningContext | null
  onContextChange: (ctx: ListeningContext) => void
  savePoints: SavePoint[]
  onRestoreSavePoint: (sp: SavePoint) => void
  acousticEnabled?: boolean
}

export function PortalSheet({
  open,
  onClose,
  hasSpotify,
  listeningContext,
  onContextChange,
  savePoints,
  onRestoreSavePoint,
  acousticEnabled = false,
}: PortalSheetProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const acousticStatus = acousticEnabled ? 'on' : 'off'
  const statusColor = acousticStatus === 'on' ? 'bg-moss-green' : 'bg-text-lo'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="portal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-overlay bg-soil/60 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            key="portal-sheet"
            initial={{ y: '60vh', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '60vh', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="
              fixed bottom-0 left-0 right-0 z-portal
              max-h-[60vh] rounded-t-2xl overflow-hidden
              glass-heavy font-sans
            "
            role="dialog"
            aria-modal="true"
            aria-label="Territory panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-0.5 rounded-full bg-white/20" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto max-h-[calc(60vh-2rem)] px-4 pb-8 space-y-6">

              {/* ── Account ─────────────────────────────── */}
              <section>
                <p className="label-caps mb-2">Account</p>
                {hasSpotify === true ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04]">
                    <div className="w-2 h-2 rounded-full bg-moss-green flex-shrink-0" />
                    <span className="text-sm text-text-mid">Spotify connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04]">
                    <div className="w-2 h-2 rounded-full bg-text-lo flex-shrink-0" />
                    <span className="text-sm text-text-mid flex-1">Not connected</span>
                    <SpotifyLoginNav className="text-xs text-amber hover:text-amber/80 transition-colors">
                      Connect
                    </SpotifyLoginNav>
                  </div>
                )}
              </section>

              {/* ── Context ─────────────────────────────── */}
              <section>
                <p className="label-caps mb-2">Listening context</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CONTEXT_OPTIONS.map(({ id, label, description }) => {
                    const active = listeningContext === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onContextChange(id)}
                        className={`
                          text-left rounded-xl px-3 py-2.5 transition-colors duration-micro
                          ${active
                            ? 'bg-bark-light border border-amber/30 text-text-hi'
                            : 'bg-white/[0.03] border border-white/[0.06] text-text-mid hover:border-white/[0.12] hover:text-text-hi'
                          }
                        `}
                      >
                        <span className="block text-sm font-medium">{label}</span>
                        <span className="block text-[10px] mt-0.5 opacity-60">{description}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* ── Saved Moments ───────────────────────── */}
              <section>
                <p className="label-caps mb-2">Saved moments</p>
                <SavePointsBrowser
                  open={true}
                  onClose={onClose}
                  savePoints={savePoints}
                  onRestore={(sp) => {
                    onRestoreSavePoint(sp)
                    onClose()
                  }}
                  embedded={true}
                />
              </section>

              {/* ── System ──────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03]">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor}`} />
                  <span className="text-[11px] text-text-lo">{ACOUSTIC_STATUS_LABEL[acousticStatus]}</span>
                </div>
              </section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
