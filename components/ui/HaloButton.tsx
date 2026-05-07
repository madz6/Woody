'use client'

/** Halo — always-visible portal glyph, fixed top-right.
 *  Opens the Portal Sheet for secondary navigation.
 */
export function HaloButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open territory panel"
      className="
        fixed top-4 right-4 z-halo
        w-9 h-9 rounded-full
        bg-bark border border-white/[0.08]
        flex items-center justify-center
        text-text-lo hover:text-text-mid
        hover:border-white/[0.15] hover:shadow-glow-hi
        transition-colors duration-micro
        pointer-events-auto
      "
    >
      {/* Terrain glyph — three horizontal lines at decreasing opacity, suggesting topographic layers */}
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
        <line x1="2"  y1="2"  x2="14" y2="2"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.9" />
        <line x1="4"  y1="6"  x2="12" y2="6"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.65" />
        <line x1="6"  y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4" />
      </svg>
    </button>
  )
}
