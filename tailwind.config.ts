import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Canonical design system tokens (VISUAL_LANGUAGE.md / CLAUDE.md) ──
        void:   '#0a0a0f',   // primary background
        teal:   '#00e5c4',   // primary accent
        cobalt: '#4455ff',   // secondary accent
        moon:   '#f0ede6',   // primary text
        amber:  '#f0a040',   // recommendation / highlight

        // ── Surface layers ──
        // Keeping soil/bark/moss aliases so existing components don't break.
        // These map approximately to the design system surface hierarchy.
        soil:         '#0a0a0f',   // = void (was #0F0F0D — corrected)
        moss:         '#111116',   // surface-1: slightly lighter than void
        bark:         '#18181f',   // surface-2: cards, panels
        'bark-light': '#22222c',   // surface-3: hover states

        // ── Text scale ──
        'text-hi':  '#f0ede6',   // = moon
        'text-mid': '#8a8790',   // mid-emphasis
        'text-lo':  '#46444c',   // de-emphasized

        // ── Acoustic session tones (mapped to main accent system) ──
        // violet → cobalt family (cold/electric sessions)
        // amber stays amber but now correct value
        // moss-green → warm-organic sessions
        // rose → intimate/mournful sessions
        violet:      '#6070e8',   // cold electric — shifted toward cobalt
        'moss-green': '#4E6B45',  // warm organic
        rose:        '#8C5C5C',   // intimate/dark

        // ── Glow helpers ──
        'teal-glow':   'rgba(0,229,196,0.15)',
        'cobalt-glow': 'rgba(68,85,255,0.15)',
        'amber-glow':  'rgba(240,160,64,0.15)',
      },
      fontFamily: {
        // Woody design system font stack (VISUAL_LANGUAGE.md)
        sans:  ['var(--font-epilogue)', 'system-ui', 'sans-serif'],  // body
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],    // headings
        mono:  ['var(--font-space-mono)', 'monospace'],              // data / coordinates
        // Legacy aliases — kept so existing className references don't break
        serif: ['var(--font-epilogue)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display':    ['36px', { lineHeight: '1.15' }],
        'heading-lg': ['24px', { lineHeight: '1.3' }],
        'heading-md': ['18px', { lineHeight: '1.4' }],
        'body-md':    ['15px', { lineHeight: '1.6' }],
        'body-sm':    ['13px', { lineHeight: '1.6' }],
        'meta-sm':    ['11px', { lineHeight: '1.4', letterSpacing: '0.08em' }],
        'label':      ['10px', { lineHeight: '1.4', letterSpacing: '0.1em' }],
      },
      boxShadow: {
        'glow-teal':   '0 0 16px rgba(0, 229, 196, 0.35)',
        'glow-cobalt': '0 0 16px rgba(68, 85, 255, 0.35)',
        'glow-amber':  '0 0 16px rgba(240, 160, 64, 0.35)',
        'glow-violet': '0 0 12px rgba(96, 112, 232, 0.4)',
        'glow-moss':   '0 0 12px rgba(78, 107, 69, 0.4)',
        'glow-rose':   '0 0 12px rgba(140, 92, 92, 0.4)',
        'glow-hi':     '0 0 8px rgba(240, 237, 230, 0.2)',
      },
      transitionTimingFunction: {
        'settle':  'cubic-bezier(0, 0, 0.2, 1)',
        'emerge':  'cubic-bezier(0.4, 0, 1, 1)',
        'breathe': 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      transitionDuration: {
        'micro':       '200ms',
        'interaction': '400ms',
        'state':       '600ms',
        'atmosphere':  '2000ms',
      },
      zIndex: {
        'globe':   '0',
        'nodes':   '10',
        'player':  '20',
        'overlay': '30',
        'halo':    '40',
        'portal':  '50',
      },
      animation: {
        'breathe':      'breathe 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'drift':        'drift 8s ease-in-out infinite',
        'orbit':        'orbit 12s linear infinite',
        'fade-in':      'fade-in 400ms cubic-bezier(0,0,0.2,1) forwards',
        'slide-up':     'slide-up 400ms cubic-bezier(0,0,0.2,1) forwards',
        'portal-open':  'portal-open 400ms cubic-bezier(0,0,0.2,1) forwards',
        'portal-close': 'portal-close 300ms cubic-bezier(0.4,0,1,1) forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.045)' },
        },
        drift: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        orbit: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'portal-open': {
          from: { transform: 'translateY(60vh)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'portal-close': {
          from: { transform: 'translateY(0)',    opacity: '1' },
          to:   { transform: 'translateY(60vh)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
