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
        soil:    '#0F0F0D',
        moss:    '#171713',
        bark:    '#1E1B18',
        'bark-light': '#2A2520',
        'text-hi':  '#E8E4DC',
        'text-mid': '#8A8680',
        'text-lo':  '#4A4844',
        violet:  '#7C6BCE',
        amber:   '#C4874A',
        'moss-green': '#4E6B45',
        rose:    '#8C5C5C',
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-lora)', 'serif'],
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
        'glow-violet': '0 0 12px rgba(124, 107, 206, 0.4)',
        'glow-amber':  '0 0 12px rgba(196, 135, 74, 0.4)',
        'glow-moss':   '0 0 12px rgba(78, 107, 69, 0.4)',
        'glow-rose':   '0 0 12px rgba(140, 92, 92, 0.4)',
        'glow-hi':     '0 0 8px rgba(232, 228, 220, 0.2)',
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
