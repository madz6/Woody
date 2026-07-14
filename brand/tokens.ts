/**
 * WOODY — BRAND TOKENS
 * Single source of truth for all design values.
 *
 * Import from here. Never hardcode values in components or CSS.
 * CSS custom properties are generated from this file via `cssVars`.
 *
 * Last updated: 2026-05-09
 */

// ─────────────────────────────────────────────
// COLOR
// ─────────────────────────────────────────────

export const color = {
  // Core five — the Woody palette
  void:   '#0a0a0f',  // background — the field
  teal:   '#00e5c4',  // primary accent — acoustic peak, discovery
  cobalt: '#4455ff',  // secondary accent — cold/electric, density
  moon:   '#f0ede6',  // text, figures — the human element
  amber:  '#f0a040',  // highlight — warmth, recommendation, waypoint

  // Surface elevation (void → 4 steps up)
  surface: {
    0: '#0a0a0f',  // canvas — same as void
    1: '#111116',  // card, panel
    2: '#18181f',  // raised element, input
    3: '#22222c',  // hover, selected state
    4: '#2d2d3a',  // tooltip, popover
  },

  // Text hierarchy
  text: {
    hi:  '#f0ede6',  // primary — same as moon
    mid: '#8a8790',  // secondary, labels
    lo:  '#46444c',  // tertiary, disabled, dividers
  },

  // Teal variants
  tealDark:   '#009982',
  tealLight:  '#80f2e2',
  tealGlow:   'rgba(0, 229, 196, 0.15)',
  tealSubtle: 'rgba(0, 229, 196, 0.06)',

  // Cobalt variants
  cobaltDark:   '#2234cc',
  cobaltLight:  '#8899ff',
  cobaltGlow:   'rgba(68, 85, 255, 0.15)',
  cobaltSubtle: 'rgba(68, 85, 255, 0.06)',

  // Amber variants
  amberDark:   '#c07820',
  amberLight:  '#ffe090',
  amberGlow:   'rgba(240, 160, 64, 0.15)',
  amberSubtle: 'rgba(240, 160, 64, 0.06)',

  // Tone system — situational palettes driven by session acoustic state
  tone: {
    violet: '#6070e8',  // dark-violet palette
    moss:   '#4e6b45',  // organic/natural dimension
    rose:   '#8c5c5c',  // warm high-density state
  },

  // Structural
  border:       'rgba(240, 237, 230, 0.10)',
  borderSubtle: 'rgba(240, 237, 230, 0.06)',
  grain:        'rgba(240, 237, 230, 0.035)',  // grain overlay — always present
} as const

// ─────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────

export const font = {
  // Families
  display: '"Syne", system-ui, sans-serif',     // headings, wordmark, UI labels
  body:    '"Epilogue", system-ui, sans-serif',  // body text, descriptions
  mono:    '"Space Mono", monospace',            // data, coordinates, code

  // Weights
  weight: {
    light:     300,
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
  },

  // Size scale
  size: {
    '2xs':  '9px',
    xs:     '10px',
    sm:     '11px',
    base:   '13px',
    md:     '15px',
    lg:     '18px',
    xl:     '24px',
    '2xl':  '32px',
    '3xl':  '48px',
    '4xl':  '64px',
    '5xl':  '96px',
  },

  // Letter spacing
  tracking: {
    tight:  '-0.03em',
    normal: '0em',
    wide:   '0.04em',
    wider:  '0.08em',
    caps:   '0.15em',
    data:   '0.05em',
  },

  // Line height
  leading: {
    none:    1,
    tight:   1.2,
    snug:    1.35,
    normal:  1.5,
    relaxed: 1.7,
  },
} as const

// ─────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────

export const space = {
  0:   '0px',
  px:  '1px',
  0.5: '2px',
  1:   '4px',
  1.5: '6px',
  2:   '8px',
  3:   '12px',
  4:   '16px',
  5:   '20px',
  6:   '24px',
  8:   '32px',
  10:  '40px',
  12:  '48px',
  16:  '64px',
  20:  '80px',
  24:  '96px',
  32:  '128px',
} as const

// ─────────────────────────────────────────────
// SHAPE
// ─────────────────────────────────────────────

export const radius = {
  none:  '0px',
  sm:    '2px',
  md:    '4px',
  lg:    '8px',
  xl:    '12px',
  '2xl': '16px',
  '3xl': '24px',
  pill:  '9999px',
} as const

// ─────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────

export const ease = {
  settle:  'cubic-bezier(0, 0, 0.2, 1)',    // decelerate — landing
  emerge:  'cubic-bezier(0.4, 0, 1, 1)',    // accelerate — leaving
  snap:    'cubic-bezier(0.4, 0, 0.6, 1)',  // symmetric — quick state change
  spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)', // slight overshoot — reserved for delight moments only
} as const

export const duration = {
  instant: '60ms',
  fast:    '120ms',
  normal:  '220ms',
  slow:    '380ms',
  crawl:   '700ms',
  drift:   '1200ms',  // ambient / metabolic motion
} as const

// ─────────────────────────────────────────────
// Z-INDEX
// ─────────────────────────────────────────────

export const z = {
  field:   0,   // acoustic field — the background layer
  content: 10,  // main content
  raised:  20,  // cards, panels
  overlay: 30,  // sheets, drawers
  modal:   40,  // modals, dialogs
  toast:   50,  // notifications
  cursor:  60,  // custom cursor
} as const

// ─────────────────────────────────────────────
// ACOUSTIC → VISUAL MAPPING
// ─────────────────────────────────────────────

export const acoustic = {
  dimensions: ['energy', 'warmth', 'density', 'organicity', 'sacred'] as const,

  // Primary accent color per dimension
  accent: {
    energy:     color.teal,
    warmth:     color.amber,
    density:    color.cobalt,
    organicity: color.tone.moss,
    sacred:     color.moon,
  },

  // Session palette variants — triggered by dominant acoustic state
  palette: {
    'cool-teal':   { ambient: 'rgba(0, 229, 196, 0.04)',   accent: color.teal,         name: 'Cool Teal'   },
    'warm-amber':  { ambient: 'rgba(240, 160, 64, 0.05)',  accent: color.amber,        name: 'Warm Amber'  },
    'dark-violet': { ambient: 'rgba(96, 112, 232, 0.05)',  accent: color.tone.violet,  name: 'Dark Violet' },
    'cold-cobalt': { ambient: 'rgba(68, 85, 255, 0.05)',   accent: color.cobalt,       name: 'Cold Cobalt' },
  },

  // Sprite pose → acoustic state mapping
  pose: {
    standing:      { energy: 0.2, warmth: 0.4, density: 0.3, organicity: 0.5, sacred: 0.3 },
    armsOut:       { energy: 0.4, warmth: 0.6, density: 0.3, organicity: 0.6, sacred: 0.4 },
    reachingUp:    { energy: 0.6, warmth: 0.4, density: 0.4, organicity: 0.4, sacred: 0.7 },
    running:       { energy: 0.9, warmth: 0.3, density: 0.6, organicity: 0.3, sacred: 0.1 },
    drifting:      { energy: 0.2, warmth: 0.5, density: 0.2, organicity: 0.7, sacred: 0.5 },
    crouching:     { energy: 0.3, warmth: 0.3, density: 0.8, organicity: 0.4, sacred: 0.6 },
    dancing:       { energy: 0.8, warmth: 0.5, density: 0.9, organicity: 0.5, sacred: 0.3 },
    sacredStill:   { energy: 0.1, warmth: 0.6, density: 0.4, organicity: 0.8, sacred: 1.0 },
  },
} as const

// ─────────────────────────────────────────────
// ARTIFACT TEMPLATES
// ─────────────────────────────────────────────

export const artifact = {
  // Standard Woody shareable artifact layout
  format: {
    square:    { width: 1080, height: 1080, ratio: '1:1'   },  // Instagram, Twitter
    landscape: { width: 1200, height: 630,  ratio: '1.9:1' },  // Open Graph
    story:     { width: 1080, height: 1920, ratio: '9:16'  },  // Instagram/TikTok story
    dj:        { width: 1200, height: 400,  ratio: '3:1'   },  // DJ set banner
  },

  // Zones on the coordinate field (Energy × Warmth axes)
  zone: {
    'electric-cold':   { energy: [0.7, 1.0], warmth: [0.0, 0.4], label: 'Electric Cold'   },
    'electric-warm':   { energy: [0.7, 1.0], warmth: [0.6, 1.0], label: 'Electric Warm'   },
    'ambient-cold':    { energy: [0.0, 0.4], warmth: [0.0, 0.4], label: 'Ambient Cold'    },
    'ambient-warm':    { energy: [0.0, 0.4], warmth: [0.6, 1.0], label: 'Ambient Warm'    },
    'midfield-centre': { energy: [0.4, 0.7], warmth: [0.4, 0.6], label: 'Midfield Centre' },
  },
} as const

// ─────────────────────────────────────────────
// CSS CUSTOM PROPERTIES (generated)
// ─────────────────────────────────────────────

export const cssVars = `
:root {
  /* Core palette */
  --void:   ${color.void};
  --teal:   ${color.teal};
  --cobalt: ${color.cobalt};
  --moon:   ${color.moon};
  --amber:  ${color.amber};

  /* Surface scale */
  --surface-0: ${color.surface[0]};
  --surface-1: ${color.surface[1]};
  --surface-2: ${color.surface[2]};
  --surface-3: ${color.surface[3]};
  --surface-4: ${color.surface[4]};

  /* Text scale */
  --text-hi:  ${color.text.hi};
  --text-mid: ${color.text.mid};
  --text-lo:  ${color.text.lo};

  /* Glow helpers */
  --teal-glow:   ${color.tealGlow};
  --cobalt-glow: ${color.cobaltGlow};
  --amber-glow:  ${color.amberGlow};

  /* Structural */
  --border:        ${color.border};
  --border-subtle: ${color.borderSubtle};
  --grain-opacity: 0.035;

  /* Typography */
  --font-display: ${font.display};
  --font-body:    ${font.body};
  --font-mono:    ${font.mono};

  /* Motion */
  --ease-settle: ${ease.settle};
  --ease-emerge: ${ease.emerge};
  --ease-snap:   ${ease.snap};

  --duration-fast:   ${duration.fast};
  --duration-normal: ${duration.normal};
  --duration-slow:   ${duration.slow};
  --duration-drift:  ${duration.drift};
}
` as const

// ─────────────────────────────────────────────
// TYPE HELPERS
// ─────────────────────────────────────────────

export type ColorToken      = keyof typeof color
export type SpaceToken      = keyof typeof space
export type RadiusToken     = keyof typeof radius
export type AcousticDim     = typeof acoustic.dimensions[number]
export type SessionPalette  = keyof typeof acoustic.palette
export type ArtifactFormat  = keyof typeof artifact.format
export type AcousticPose    = keyof typeof acoustic.pose
