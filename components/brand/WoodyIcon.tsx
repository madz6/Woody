'use client'

import type { SVGProps } from 'react'

type WoodyIconProps = SVGProps<SVGSVGElement> & {
  size?: number
  /** Show rounded rect background (for app icon usage) */
  withBackground?: boolean
  /** Accent color: teal (default), cobalt, amber */
  accent?: 'teal' | 'cobalt' | 'amber'
}

const ACCENT = {
  teal:   '#00e5c4',
  cobalt: '#4455ff',
  amber:  '#f0a040',
} as const

/**
 * Woody logomark — geometric acoustic field with pixelated human figure.
 *
 * Visual language (VISUAL_LANGUAGE.md):
 *   World B (base): algorithmic geometric grid + acoustic arc
 *   World A (accent): pixelated human figure, the human inside the system
 *
 * Usage:
 *   <WoodyIcon size={48} />                        // bare icon
 *   <WoodyIcon size={64} withBackground />          // app icon with dark bg
 *   <WoodyIcon size={32} accent="cobalt" />         // cold/electric session state
 */
export function WoodyIcon({
  size = 64,
  withBackground = false,
  accent = 'teal',
  ...props
}: WoodyIconProps) {
  const a = ACCENT[accent]

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Woody"
      {...props}
    >
      {/* Background (optional) */}
      {withBackground && (
        <rect width="64" height="64" rx="14" fill="#0a0a0f" />
      )}

      {/* ── World B: Geometric grid ── */}
      <line x1="16" y1="12" x2="16" y2="52" stroke="#18181f" strokeWidth="1" />
      <line x1="32" y1="12" x2="32" y2="52" stroke="#18181f" strokeWidth="1" />
      <line x1="48" y1="12" x2="48" y2="52" stroke="#18181f" strokeWidth="1" />
      <line x1="12" y1="20" x2="52" y2="20" stroke="#18181f" strokeWidth="1" />
      <line x1="12" y1="32" x2="52" y2="32" stroke="#18181f" strokeWidth="1" />
      <line x1="12" y1="44" x2="52" y2="44" stroke="#18181f" strokeWidth="1" />

      {/* Primary acoustic arc — the session journey */}
      <path
        d="M 12 44 C 20 44 22 28 32 24 C 42 20 46 18 52 14"
        stroke={a}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />

      {/* Secondary arc — depth/layer */}
      <path
        d="M 12 48 C 24 48 28 36 38 30 C 44 26 50 22 52 20"
        stroke={accent === 'cobalt' ? '#00e5c4' : '#4455ff'}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />

      {/* Arc peak glow dot */}
      <circle cx="52" cy="14" r="3" fill={a} opacity="0.9" />
      <circle cx="52" cy="14" r="6" fill={a} opacity="0.12" />

      {/* ── World A: Pixelated human figure — dancing in the field ── */}
      {/* Head */}
      <rect x="29" y="22" width="6" height="6" rx="0.5" fill="#f0ede6" />
      {/* Torso */}
      <rect x="29" y="29" width="6" height="7" rx="0.5" fill="#f0ede6" />
      {/* Arms outstretched */}
      <rect x="24" y="30" width="4" height="2" rx="0.5" fill="#f0ede6" />
      <rect x="36" y="30" width="4" height="2" rx="0.5" fill="#f0ede6" />
      {/* Legs */}
      <rect x="29" y="37" width="2.5" height="5" rx="0.5" fill="#f0ede6" />
      <rect x="32.5" y="37" width="2.5" height="5" rx="0.5" fill="#f0ede6" />

      {/* Coordinate waypoints */}
      <circle cx="16" cy="44" r="1.5" fill="#f0a040" opacity="0.7" />
      <circle cx="24" cy="36" r="1.5" fill="#f0a040" opacity="0.5" />
      <circle cx="32" cy="24" r="1.5" fill={a} opacity="0.6" />

      {/* Outer border */}
      {withBackground && (
        <rect
          width="64"
          height="64"
          rx="14"
          stroke="#f0ede6"
          strokeWidth="0.5"
          opacity="0.08"
        />
      )}
    </svg>
  )
}

/**
 * Woody wordmark — "WOODY" in Syne 800 style.
 * For headers, splash screens, onboarding.
 */
export function WoodyWordmark({
  size = 32,
  color = '#f0ede6',
  accentColor = '#00e5c4',
  ...props
}: {
  size?: number
  color?: string
  accentColor?: string
} & SVGProps<SVGSVGElement>) {
  const scale = size / 32
  const w = Math.round(160 * scale)
  const h = size

  return (
    <svg
      viewBox="0 0 160 32"
      width={w}
      height={h}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Woody"
      {...props}
    >
      {/* W */}
      <path
        d="M4 4 L8.5 28 L14 16 L19.5 28 L24 4"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* o */}
      <circle cx="38" cy="18" r="8" stroke={color} strokeWidth="3" fill="none" />
      {/* d */}
      <circle cx="62" cy="18" r="8" stroke={color} strokeWidth="3" fill="none" />
      <line x1="70" y1="6" x2="70" y2="28" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* y */}
      <line x1="82" y1="10" x2="90" y2="24" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="98" y1="10" x2="86" y2="32" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Teal accent dot */}
      <circle cx="104" cy="6" r="3" fill={accentColor} />
    </svg>
  )
}

/**
 * Woody horizontal lockup — icon + wordmark together.
 * Standard usage for app headers.
 */
export function WoodyLockup({
  height = 40,
  iconAccent = 'teal',
}: {
  height?: number
  iconAccent?: WoodyIconProps['accent']
}) {
  return (
    <div className="flex items-center gap-3" aria-label="Woody">
      <WoodyIcon size={height} accent={iconAccent} />
      <WoodyWordmark size={height * 0.6} />
    </div>
  )
}
